import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { useRef, useState } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import {
  useCalendar,
  useCalendarCell,
  useCalendarGrid,
  useCalendarHeading,
  useCalendarMonthPicker,
  useCalendarYearPicker,
  useDateField,
  useDatePicker,
  useDateRangePicker,
  useDateSegment,
  useRangeCalendar,
  useTimeField,
  type CalendarDate,
  type CalendarState,
  type DateFieldState,
  type DateSegment,
} from '../src';

const august = {
  start: { year: 2026, month: 8, day: 1 },
  end: { year: 2026, month: 8, day: 31 },
};

function Cell({ date, state }: { date: CalendarDate; state: CalendarState }) {
  const ref = useRef<HTMLButtonElement>(null);
  const cell = useCalendarCell({ date }, state, ref);
  return (
    <td {...cell.cellProps}>
      <button {...cell.buttonProps} ref={ref}>
        {date.day}
      </button>
    </td>
  );
}

function CalendarFixture() {
  const [focusedDate, setFocusedDate] = useState<CalendarDate>({
    year: 2026,
    month: 8,
    day: 15,
  });
  const [visibleRange, setVisibleRange] = useState(august);
  const [selectedDates, setSelectedDates] = useState<readonly CalendarDate[]>([]);
  const state: CalendarState = {
    focusedDate,
    visibleRange,
    selectedDates,
    setFocusedDate,
    setVisibleRange,
    selectDate: (date) => setSelectedDates([date]),
    isDateDisabled: (date) => date.day === 14,
  };
  const calendar = useCalendar({ 'aria-label': 'Release date' }, state);
  const range = useRangeCalendar({ 'aria-label': 'Release range' }, state);
  const grid = useCalendarGrid({}, state);
  const heading = useCalendarHeading();
  const monthPicker = useCalendarMonthPicker({}, state);
  const yearPicker = useCalendarYearPicker({ minYear: 2025, maxYear: 2027 }, state);
  return (
    <>
      <section {...calendar.calendarProps}>
        <h2 {...heading.headingProps}>{calendar.title}</h2>
        <button {...calendar.prevButtonProps}>Previous</button>
        <button {...calendar.nextButtonProps}>Next</button>
        <table {...grid.gridProps}>
          <thead {...grid.headerProps}>
            <tr>
              {grid.weekDays.map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {[14, 15, 16].map((day) => (
                <Cell date={{ year: 2026, month: 8, day }} key={day} state={state} />
              ))}
            </tr>
          </tbody>
        </table>
      </section>
      <output data-testid="focused">{focusedDate.day}</output>
      <output data-testid="selected">{selectedDates[0]?.day ?? 'none'}</output>
      <output data-testid="range-label">{range.calendarProps['aria-label']}</output>
      <output data-testid="pickers">{monthPicker.items.length + yearPicker.items.length}</output>
      <output data-testid="range-start">{visibleRange.start.month}</output>
    </>
  );
}

function FieldFixture() {
  const [segments, setSegments] = useState<readonly DateSegment[]>([
    { type: 'month', text: '08', value: 8, minValue: 1, maxValue: 12 },
    { type: 'literal', text: '/' },
    { type: 'day', text: '10', value: 10, minValue: 1, maxValue: 31 },
  ]);
  const fieldRef = useRef<HTMLDivElement>(null);
  const state: DateFieldState = {
    segments,
    setSegment(type, value) {
      setSegments((current) =>
        current.map((segment) =>
          segment.type === type
            ? { ...segment, value, text: String(value).padStart(2, '0') }
            : segment,
        ),
      );
    },
    clearSegment(type) {
      setSegments((current) =>
        current.map((segment) =>
          segment.type === type
            ? { ...segment, value: undefined, text: '--', isPlaceholder: true }
            : segment,
        ),
      );
    },
  };
  const date = useDateField({ label: 'Travel date' }, state, fieldRef);
  const time = useTimeField({ 'aria-label': 'Travel time' }, state, fieldRef);
  return (
    <>
      <span {...date.labelProps}>Travel date</span>
      <div {...date.fieldProps} ref={fieldRef}>
        {segments.map((segment, index) => (
          <Segment key={`${segment.type}-${index}`} segment={segment} state={state} />
        ))}
      </div>
      <output data-testid="time-role">{time.fieldProps.role}</output>
    </>
  );
}

function Segment({ segment, state }: { segment: DateSegment; state: DateFieldState }) {
  const ref = useRef<HTMLSpanElement>(null);
  const result = useDateSegment(segment, state, ref);
  return (
    <span {...result.segmentProps} ref={ref}>
      {segment.text}
    </span>
  );
}

describe('date and calendar primitives', () => {
  it('navigates, selects, pages, and exposes picker metadata', async () => {
    render(<CalendarFixture />);
    const day15 = screen.getByRole('button', { name: 'August 15, 2026' });
    day15.focus();
    fireEvent.keyDown(day15, { key: 'ArrowRight' });
    await waitFor(() => expect(screen.getByTestId('focused')).toHaveTextContent('16'));
    expect(screen.getByRole('button', { name: 'August 16, 2026' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'August 16, 2026' }));
    expect(screen.getByTestId('selected')).toHaveTextContent('16');
    expect(screen.getByRole('button', { name: 'August 14, 2026' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByTestId('range-start')).toHaveTextContent('7');
    expect(screen.getByTestId('range-label')).toHaveTextContent('Release range');
    expect(screen.getByTestId('pickers')).toHaveTextContent('15');
  });

  it('edits date segments with spinbutton keys and clears atomically', () => {
    render(<FieldFixture />);
    const month = screen.getByRole('spinbutton', { name: 'month' });
    fireEvent.keyDown(month, { key: 'ArrowUp' });
    expect(month).toHaveTextContent('09');
    fireEvent.keyDown(month, { key: 'Delete' });
    expect(month).toHaveTextContent('--');
    expect(screen.getByRole('group', { name: 'Travel date' })).toBeInTheDocument();
    expect(screen.getByTestId('time-role')).toHaveTextContent('group');
  });

  it('connects date picker fields, dialogs, and escape dismissal', () => {
    const close = vi.fn();
    function Picker() {
      const [isOpen, setOpen] = useState(true);
      const state = {
        isOpen,
        open: () => setOpen(true),
        close: () => {
          close();
          setOpen(false);
        },
        toggle: () => setOpen((value) => !value),
      };
      const picker = useDatePicker({ label: 'Deadline' }, state);
      const range = useDateRangePicker(
        { label: 'Trip', startLabel: 'Depart', endLabel: 'Return' },
        state,
      );
      return (
        <>
          <span {...picker.labelProps}>Deadline</span>
          <div {...picker.groupProps}>
            <button {...picker.buttonProps}>Calendar</button>
          </div>
          {isOpen && <div {...picker.dialogProps}>Calendar dialog</div>}
          <output>
            {range.startFieldProps['aria-label']} / {range.endFieldProps['aria-label']}
          </output>
        </>
      );
    }
    render(<Picker />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(close).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Depart / Return')).toBeInTheDocument();
  });
});
