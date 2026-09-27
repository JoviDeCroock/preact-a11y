import type { ComponentChildren } from 'preact';
import type { JSX, RefObject, TargetedKeyboardEvent } from '../preactTypes';
import { useEffect } from 'preact/hooks';
import { useLocale } from '../i18n/I18nProvider';
import { useId } from '../utils/useId';

type WithoutRef<Props> = Omit<Props, 'ref'>;

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export interface CalendarRange {
  start: CalendarDate;
  end: CalendarDate;
}

export interface CalendarState {
  focusedDate: CalendarDate;
  visibleRange: CalendarRange;
  selectedDates?: readonly CalendarDate[];
  isInvalid?: boolean;
  setFocusedDate(date: CalendarDate): void;
  selectDate(date: CalendarDate): void;
  setVisibleRange?(range: CalendarRange): void;
  isDateDisabled?(date: CalendarDate): boolean;
  isDateUnavailable?(date: CalendarDate): boolean;
}

export interface AriaCalendarProps {
  id?: string;
  label?: ComponentChildren;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  errorMessage?: ComponentChildren;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export interface CalendarAria {
  calendarProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  prevButtonProps: JSX.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps: JSX.ButtonHTMLAttributes<HTMLButtonElement>;
  title: string;
  errorMessageProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
}

const dateKey = (date: CalendarDate) =>
  `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;

function toUTCDate(date: CalendarDate) {
  return new Date(Date.UTC(date.year, date.month - 1, date.day));
}

function fromUTCDate(date: Date): CalendarDate {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function addDays(date: CalendarDate, days: number) {
  const value = toUTCDate(date);
  value.setUTCDate(value.getUTCDate() + days);
  return fromUTCDate(value);
}

function addMonths(date: CalendarDate, months: number) {
  const day = date.day;
  const value = new Date(Date.UTC(date.year, date.month - 1 + months, 1));
  const maxDay = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0),
  ).getUTCDate();
  value.setUTCDate(Math.min(day, maxDay));
  return fromUTCDate(value);
}

function compareDates(left: CalendarDate, right: CalendarDate) {
  return dateKey(left).localeCompare(dateKey(right));
}

function sameDate(left: CalendarDate, right: CalendarDate) {
  return compareDates(left, right) === 0;
}

function page(state: CalendarState, months: number) {
  const range = {
    start: addMonths(state.visibleRange.start, months),
    end: addMonths(state.visibleRange.end, months),
  };
  state.setVisibleRange?.(range);
  state.setFocusedDate(addMonths(state.focusedDate, months));
}

function calendarTitle(range: CalendarRange, locale: string) {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const start = formatter.format(toUTCDate(range.start));
  const end = formatter.format(toUTCDate(range.end));
  return start === end ? start : `${start} – ${end}`;
}

/** Supplies calendar grouping and page navigation while leaving date state with the consumer. */
export function useCalendar(props: AriaCalendarProps, state: CalendarState): CalendarAria {
  const { locale } = useLocale();
  const id = useId(props.id);
  const title = calendarTitle(state.visibleRange, locale);
  const errorId = `${id}-error`;
  const isBlocked = props.isDisabled || props.isReadOnly;

  return {
    calendarProps: {
      id,
      role: 'group' as const,
      'aria-label': props['aria-label'] ?? (props['aria-labelledby'] ? undefined : title),
      'aria-labelledby': props['aria-labelledby'],
      'aria-describedby': state.isInvalid && props.errorMessage != null ? errorId : undefined,
      'aria-disabled': props.isDisabled || undefined,
      'aria-readonly': props.isReadOnly || undefined,
    },
    prevButtonProps: {
      type: 'button',
      disabled: isBlocked,
      'aria-label': 'Previous month',
      onClick: () => page(state, -1),
    },
    nextButtonProps: {
      type: 'button',
      disabled: isBlocked,
      'aria-label': 'Next month',
      onClick: () => page(state, 1),
    },
    title,
    errorMessageProps: { id: errorId },
  };
}

export interface AriaRangeCalendarProps extends AriaCalendarProps {
  allowsNonContiguousRanges?: boolean;
}

export function useRangeCalendar(
  props: AriaRangeCalendarProps,
  state: CalendarState,
): CalendarAria {
  const result = useCalendar(props, state);
  return {
    ...result,
    calendarProps: {
      ...result.calendarProps,
      'aria-label':
        props['aria-label'] ??
        (props['aria-labelledby'] ? undefined : `${result.title}, date range`),
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}

export interface AriaCalendarGridProps {
  startDate?: CalendarDate;
  endDate?: CalendarDate;
  firstDayOfWeek?: number;
  weekdayStyle?: 'long' | 'short' | 'narrow';
  'aria-label'?: string;
}

export interface CalendarGridAria {
  gridProps: WithoutRef<JSX.TableHTMLAttributes<HTMLTableElement>>;
  headerProps: WithoutRef<JSX.HTMLAttributes<HTMLTableSectionElement>>;
  weekDays: string[];
}

export function useCalendarGrid(
  props: AriaCalendarGridProps,
  state: CalendarState,
): CalendarGridAria {
  const { locale } = useLocale();
  const start = props.startDate ?? state.visibleRange.start;
  const end = props.endDate ?? state.visibleRange.end;
  const firstDayOfWeek = props.firstDayOfWeek ?? 0;
  const weekdayFormatter = new Intl.DateTimeFormat(locale, {
    weekday: props.weekdayStyle ?? 'short',
    timeZone: 'UTC',
  });
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(2024, 0, 7 + ((firstDayOfWeek + index) % 7)));
    return weekdayFormatter.format(date);
  });

  return {
    gridProps: {
      role: 'grid' as const,
      'aria-label': props['aria-label'] ?? calendarTitle({ start, end }, locale),
      'aria-readonly': true,
    } satisfies WithoutRef<JSX.TableHTMLAttributes<HTMLTableElement>>,
    headerProps: {
      'aria-hidden': true,
    } satisfies WithoutRef<JSX.HTMLAttributes<HTMLTableSectionElement>>,
    weekDays,
  };
}

export interface AriaCalendarCellProps {
  date: CalendarDate;
  firstDayOfWeek?: number;
  isDisabled?: boolean;
  isUnavailable?: boolean;
}

export interface CalendarCellButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  'data-date': string;
}

export interface CalendarCellAria {
  cellProps: WithoutRef<JSX.TdHTMLAttributes<HTMLTableCellElement>>;
  buttonProps: CalendarCellButtonProps;
  formattedDate: string;
  isSelected: boolean;
  isFocused: boolean;
  isDisabled: boolean;
  isUnavailable: boolean;
  isOutsideVisibleRange: boolean;
  isInvalid: boolean | undefined;
}

function focusRenderedDate(ref: RefObject<HTMLElement>, date: CalendarDate) {
  queueMicrotask(() => {
    const root = ref.current?.closest('[role="grid"]') ?? ref.current?.ownerDocument;
    root?.querySelector<HTMLElement>(`[data-date="${dateKey(date)}"]`)?.focus();
  });
}

export function useCalendarCell(
  props: AriaCalendarCellProps,
  state: CalendarState,
  ref: RefObject<HTMLElement>,
): CalendarCellAria {
  const { locale, direction } = useLocale();
  const date = props.date;
  const selected = state.selectedDates?.some((value) => sameDate(value, date)) ?? false;
  const unavailable = props.isUnavailable || state.isDateUnavailable?.(date) || false;
  const disabled = props.isDisabled || state.isDateDisabled?.(date) || unavailable;
  const outside =
    compareDates(date, state.visibleRange.start) < 0 ||
    compareDates(date, state.visibleRange.end) > 0;
  const focused = sameDate(date, state.focusedDate);
  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const formattedDate = formatter.format(toUTCDate(date));

  useEffect(() => {
    if (focused && document.activeElement?.closest('[role="grid"]')) ref.current?.focus();
  }, [focused, ref]);

  function move(next: CalendarDate) {
    state.setFocusedDate(next);
    focusRenderedDate(ref, next);
  }

  function onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
    let next: CalendarDate | undefined;
    if (event.key === 'ArrowLeft') next = addDays(date, direction === 'rtl' ? 1 : -1);
    else if (event.key === 'ArrowRight') next = addDays(date, direction === 'rtl' ? -1 : 1);
    else if (event.key === 'ArrowUp') next = addDays(date, -7);
    else if (event.key === 'ArrowDown') next = addDays(date, 7);
    else if (event.key === 'Home') {
      const weekday = toUTCDate(date).getUTCDay();
      next = addDays(date, -((weekday - (props.firstDayOfWeek ?? 0) + 7) % 7));
    } else if (event.key === 'End') {
      const weekday = toUTCDate(date).getUTCDay();
      next = addDays(date, 6 - ((weekday - (props.firstDayOfWeek ?? 0) + 7) % 7));
    } else if (event.key === 'PageUp') next = addMonths(date, event.shiftKey ? -12 : -1);
    else if (event.key === 'PageDown') next = addMonths(date, event.shiftKey ? 12 : 1);
    else if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault();
      state.selectDate(date);
      return;
    }
    if (next) {
      event.preventDefault();
      move(next);
    }
  }

  return {
    cellProps: {
      role: 'gridcell' as const,
      'aria-selected': selected,
      'aria-disabled': disabled || undefined,
    } satisfies WithoutRef<JSX.TdHTMLAttributes<HTMLTableCellElement>>,
    buttonProps: {
      type: 'button',
      tabIndex: focused ? 0 : -1,
      disabled,
      'aria-label': formattedDate,
      'aria-pressed': selected,
      'aria-current': sameDate(date, fromUTCDate(new Date())) ? 'date' : undefined,
      'data-date': dateKey(date),
      onClick: () => state.selectDate(date),
      onFocus: () => state.setFocusedDate(date),
      onKeyDown,
    } satisfies CalendarCellButtonProps,
    formattedDate,
    isSelected: selected,
    isFocused: focused,
    isDisabled: disabled,
    isUnavailable: unavailable,
    isOutsideVisibleRange: outside,
    isInvalid: state.isInvalid && selected,
  };
}

export interface AriaCalendarHeadingProps {
  id?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface CalendarHeadingAria {
  headingProps: WithoutRef<JSX.HTMLAttributes<HTMLHeadingElement>>;
}

export function useCalendarHeading(props: AriaCalendarHeadingProps = {}): CalendarHeadingAria {
  const id = useId(props.id);
  return {
    headingProps: {
      id,
      role: 'heading' as const,
      'aria-level': props.level ?? 2,
      'aria-live': 'polite',
      'aria-atomic': true,
    } satisfies WithoutRef<JSX.HTMLAttributes<HTMLHeadingElement>>,
  };
}

export interface CalendarPickerItem {
  key: number;
  label: string;
  buttonProps: JSX.ButtonHTMLAttributes<HTMLButtonElement>;
}

export interface CalendarPickerAria {
  gridProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  items: CalendarPickerItem[];
}

export function useCalendarMonthPicker(
  props: { 'aria-label'?: string } = {},
  state: CalendarState,
): CalendarPickerAria {
  const { locale } = useLocale();
  const formatter = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });
  const items: CalendarPickerItem[] = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const date = { ...state.focusedDate, month, day: 1 };
    const selected = month === state.focusedDate.month;
    return {
      key: month,
      label: formatter.format(toUTCDate(date)),
      buttonProps: {
        type: 'button',
        'aria-pressed': selected,
        tabIndex: selected ? 0 : -1,
        onClick: () => state.setFocusedDate(date),
      },
    };
  });
  return {
    gridProps: {
      role: 'grid' as const,
      'aria-label': props['aria-label'] ?? 'Choose month',
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    items,
  };
}

export function useCalendarYearPicker(
  props: { minYear?: number; maxYear?: number; 'aria-label'?: string } = {},
  state: CalendarState,
): CalendarPickerAria {
  const min = props.minYear ?? state.focusedDate.year - 10;
  const max = props.maxYear ?? state.focusedDate.year + 10;
  const items: CalendarPickerItem[] = Array.from(
    { length: Math.max(0, max - min + 1) },
    (_, index) => {
      const year = min + index;
      const selected = year === state.focusedDate.year;
      return {
        key: year,
        label: String(year),
        buttonProps: {
          type: 'button',
          'aria-pressed': selected,
          tabIndex: selected ? 0 : -1,
          onClick: () => state.setFocusedDate({ ...state.focusedDate, year }),
        },
      };
    },
  );
  return {
    gridProps: {
      role: 'grid' as const,
      'aria-label': props['aria-label'] ?? 'Choose year',
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    items,
  };
}
