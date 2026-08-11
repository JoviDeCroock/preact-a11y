import type { RefObject } from 'preact';
import type { JSX, TargetedEvent, TargetedKeyboardEvent } from '../preactTypes';
import { useId, useState } from 'preact/hooks';
import { useLocale } from '../i18n/I18nProvider';
import { useNumberFormatter } from '../i18n/formatters';
import type { SliderState } from './useSlider';

export interface AriaSliderThumbProps {
  index: number;
  label: string;
  id?: string;
  name?: string;
  isDisabled?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
}

export function useSliderThumb(
  props: AriaSliderThumbProps,
  state: SliderState,
  inputRef?: RefObject<HTMLInputElement>,
) {
  const { direction } = useLocale();
  const formatter = useNumberFormatter(props.formatOptions);
  const generatedId = useId();
  const inputId = props.id ?? `preact-aria-slider-${generatedId}`;
  const [isDragging, setDragging] = useState(false);
  const [isFocused, setFocused] = useState(false);
  const value = state.values[props.index]!;
  const min = state.getThumbMin(props.index);
  const max = state.getThumbMax(props.index);
  const isDisabled = state.isDisabled || props.isDisabled;

  function setValue(next: number, isEnd = false) {
    if (!isDisabled) state.setThumbValue(props.index, next, isEnd);
  }

  return {
    thumbProps: {
      'data-disabled': isDisabled || undefined,
      'data-dragging': isDragging || undefined,
      'data-focused': isFocused || undefined,
      'data-orientation': state.orientation,
      'data-value': value,
      style: {
        '--slider-thumb-percent': `${state.getThumbPercent(props.index)}%`,
      },
    } as JSX.HTMLAttributes<HTMLElement> & {
      'data-disabled'?: true;
      'data-orientation': typeof state.orientation;
      'data-value': number;
    },
    inputProps: {
      ref: inputRef,
      id: inputId,
      type: 'range',
      min,
      max,
      step: state.step,
      value,
      name: props.name,
      disabled: isDisabled,
      'aria-label': props.label,
      'aria-valuetext': formatter.format(value),
      onFocus() {
        setFocused(true);
      },
      onBlur() {
        setFocused(false);
      },
      onPointerDown() {
        if (!isDisabled) setDragging(true);
      },
      onPointerUp() {
        setDragging(false);
      },
      onPointerCancel() {
        setDragging(false);
      },
      onInput(event: TargetedEvent<HTMLInputElement, Event>) {
        setValue(event.currentTarget.valueAsNumber);
      },
      onChange(event: TargetedEvent<HTMLInputElement, Event>) {
        setValue(event.currentTarget.valueAsNumber, true);
      },
      onKeyDown(event: TargetedKeyboardEvent<HTMLInputElement>) {
        const horizontalDirection = direction === 'rtl' ? -1 : 1;
        const pageStep = Math.max(state.step, (state.maxValue - state.minValue) / 10);
        let next: number | undefined;
        if (event.key === 'ArrowUp') next = value + state.step;
        else if (event.key === 'ArrowDown') next = value - state.step;
        else if (event.key === 'ArrowRight') next = value + state.step * horizontalDirection;
        else if (event.key === 'ArrowLeft') next = value - state.step * horizontalDirection;
        else if (event.key === 'PageUp') next = value + pageStep;
        else if (event.key === 'PageDown') next = value - pageStep;
        else if (event.key === 'Home') next = min;
        else if (event.key === 'End') next = max;
        if (next === undefined) return;
        event.preventDefault();
        setValue(next, true);
      },
    } satisfies JSX.InputHTMLAttributes<HTMLInputElement>,
    labelProps: {
      htmlFor: inputId,
    } satisfies JSX.LabelHTMLAttributes<HTMLLabelElement>,
    isDragging,
    isFocused,
    isDisabled,
  };
}
