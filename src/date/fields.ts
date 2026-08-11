import type { ComponentChildren, RefObject } from 'preact';
import type { JSX, TargetedKeyboardEvent } from '../preactTypes';
import { useField, type AriaFieldProps } from '../forms/useField';
import { useId } from '../utils/useId';

type WithoutRef<Props> = Omit<Props, 'ref'>;

export type DateSegmentType =
  | 'day'
  | 'month'
  | 'year'
  | 'era'
  | 'hour'
  | 'minute'
  | 'second'
  | 'dayPeriod'
  | 'timeZoneName'
  | 'literal';

export interface DateSegment {
  type: DateSegmentType;
  text: string;
  value?: number;
  minValue?: number;
  maxValue?: number;
  isPlaceholder?: boolean;
  isEditable?: boolean;
}

/** Consumer-owned state contract shared by date and time field hooks. */
export interface DateFieldState {
  segments: readonly DateSegment[];
  isInvalid?: boolean;
  setSegment(type: DateSegmentType, value: number): void;
  increment?(type: DateSegmentType, amount?: number): void;
  decrement?(type: DateSegmentType, amount?: number): void;
  clearSegment?(type: DateSegmentType): void;
}

export interface AriaDateFieldProps extends AriaFieldProps {
  isDisabled?: boolean;
  isReadOnly?: boolean;
  autoFocus?: boolean;
}

export interface DateFieldAria {
  labelProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  descriptionProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  errorMessageProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  fieldProps: WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>;
}

export function useDateField(
  props: AriaDateFieldProps,
  state: DateFieldState,
  ref: RefObject<HTMLElement>,
): DateFieldAria {
  const field = useField({ ...props, isInvalid: props.isInvalid ?? state.isInvalid });
  return {
    labelProps: field.labelProps,
    descriptionProps: field.descriptionProps,
    errorMessageProps: field.errorMessageProps,
    fieldProps: {
      ...field.fieldProps,
      role: 'group',
      'aria-disabled': props.isDisabled || undefined,
      'aria-readonly': props.isReadOnly || undefined,
      onFocus() {
        if (props.autoFocus && !ref.current?.contains(document.activeElement)) {
          ref.current?.querySelector<HTMLElement>('[role="spinbutton"]')?.focus();
        }
      },
    } satisfies WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>,
  };
}

export function useTimeField(
  props: AriaDateFieldProps,
  state: DateFieldState,
  ref: RefObject<HTMLElement>,
): DateFieldAria {
  const result = useDateField(props, state, ref);
  return {
    ...result,
    fieldProps: {
      ...result.fieldProps,
    } satisfies WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>,
  };
}

export interface AriaDateSegmentProps {
  isDisabled?: boolean;
  isReadOnly?: boolean;
}

export interface DateSegmentAria {
  segmentProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  isPlaceholder: boolean;
  isEditable: boolean;
}

export function useDateSegment(
  segment: DateSegment,
  state: DateFieldState,
  ref: RefObject<HTMLElement>,
  props: AriaDateSegmentProps = {},
): DateSegmentAria {
  const editable = segment.type !== 'literal' && segment.isEditable !== false;
  const disabled = props.isDisabled;
  const readOnly = props.isReadOnly || !editable;

  function adjust(direction: 1 | -1, amount = 1) {
    if (disabled || readOnly) return;
    const action = direction > 0 ? state.increment : state.decrement;
    if (action) action(segment.type, amount);
    else {
      const min = segment.minValue ?? 0;
      const max = segment.maxValue ?? Number.MAX_SAFE_INTEGER;
      const current = segment.value ?? min;
      const range = max - min + 1;
      state.setSegment(
        segment.type,
        min + ((((current - min + direction * amount) % range) + range) % range),
      );
    }
  }

  function onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      adjust(event.key === 'ArrowUp' ? 1 : -1);
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      adjust(event.key === 'PageUp' ? 1 : -1, 10);
    } else if (event.key === 'Home' && segment.minValue != null) {
      event.preventDefault();
      state.setSegment(segment.type, segment.minValue);
    } else if (event.key === 'End' && segment.maxValue != null) {
      event.preventDefault();
      state.setSegment(segment.type, segment.maxValue);
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      state.clearSegment?.(segment.type);
    } else if (/^[0-9]$/.test(event.key) && !readOnly && !disabled) {
      event.preventDefault();
      const digit = Number(event.key);
      const combined = Number(`${segment.value ?? ''}${digit}`);
      state.setSegment(segment.type, combined <= (segment.maxValue ?? combined) ? combined : digit);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const segments = [
        ...(ref.current?.parentElement?.querySelectorAll<HTMLElement>('[role="spinbutton"]') ?? []),
      ];
      const index = segments.indexOf(ref.current!);
      segments[index + (event.key === 'ArrowRight' ? 1 : -1)]?.focus();
    }
  }

  return {
    segmentProps: editable
      ? ({
          role: 'spinbutton',
          tabIndex: disabled ? undefined : 0,
          inputMode: 'numeric',
          contentEditable: !disabled && !readOnly,
          'aria-label': segment.type,
          'aria-disabled': disabled || undefined,
          'aria-readonly': readOnly || undefined,
          'aria-valuemin': segment.minValue,
          'aria-valuemax': segment.maxValue,
          'aria-valuenow': segment.value,
          'aria-valuetext': segment.text,
          onKeyDown,
          onFocus() {
            const selection = window.getSelection();
            if (ref.current && selection) {
              const range = document.createRange();
              range.selectNodeContents(ref.current);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          },
        } satisfies JSX.HTMLAttributes<HTMLElement>)
      : ({ 'aria-hidden': true } satisfies JSX.HTMLAttributes<HTMLElement>),
    isPlaceholder: segment.isPlaceholder || false,
    isEditable: editable,
  };
}

export interface DatePickerState {
  isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;
}

export interface AriaDatePickerProps extends AriaFieldProps {
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isOpen?: boolean;
  'aria-label'?: string;
}

export interface DatePickerAria {
  labelProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  descriptionProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  errorMessageProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  groupProps: WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>;
  fieldProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  buttonProps: JSX.ButtonHTMLAttributes<HTMLButtonElement>;
  dialogProps: WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>;
  calendarProps: { autoFocus: true };
}

function usePickerProps(props: AriaDatePickerProps, state: DatePickerState): DatePickerAria {
  const field = useField(props);
  const dialogId = useId(props.id ? `${props.id}-dialog` : undefined);
  const buttonId = `${field.fieldProps.id}-button`;
  return {
    labelProps: field.labelProps,
    descriptionProps: field.descriptionProps,
    errorMessageProps: field.errorMessageProps,
    groupProps: {
      ...field.fieldProps,
      role: 'group',
    } satisfies WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>,
    fieldProps: {
      'aria-labelledby': field.fieldProps['aria-labelledby'],
      'aria-describedby': field.fieldProps['aria-describedby'],
    } satisfies WithoutRef<JSX.HTMLAttributes<HTMLElement>>,
    buttonProps: {
      id: buttonId,
      type: 'button',
      disabled: props.isDisabled || props.isReadOnly,
      'aria-label': 'Open calendar',
      'aria-haspopup': 'dialog',
      'aria-expanded': state.isOpen,
      'aria-controls': state.isOpen ? dialogId : undefined,
      onClick: () => state.toggle(),
    } satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    dialogProps: {
      id: dialogId,
      role: 'dialog',
      'aria-modal': true,
      'aria-labelledby': buttonId,
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        if (event.key === 'Escape') {
          event.stopPropagation();
          state.close();
        }
      },
    } satisfies WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>,
    calendarProps: {
      autoFocus: true,
    },
  };
}

export function useDatePicker(props: AriaDatePickerProps, state: DatePickerState) {
  return usePickerProps(props, state);
}

export interface AriaDateRangePickerProps extends AriaDatePickerProps {
  startLabel?: ComponentChildren;
  endLabel?: ComponentChildren;
}

export interface DateRangePickerAria extends DatePickerAria {
  startFieldProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  endFieldProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
}

export function useDateRangePicker(
  props: AriaDateRangePickerProps,
  state: DatePickerState,
): DateRangePickerAria {
  const result = usePickerProps(props, state);
  const startId = `${result.groupProps.id}-start`;
  const endId = `${result.groupProps.id}-end`;
  return {
    ...result,
    startFieldProps: {
      id: startId,
      'aria-label': typeof props.startLabel === 'string' ? props.startLabel : 'Start date',
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    endFieldProps: {
      id: endId,
      'aria-label': typeof props.endLabel === 'string' ? props.endLabel : 'End date',
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
