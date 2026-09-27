import type { JSX, RefObject, TargetedPointerEvent } from '../preactTypes';
import { useRef, useState } from 'preact/hooks';
import { useNumberFormatter } from '../i18n/formatters';
import { useField, type AriaFieldProps } from '../forms/useField';

export type SliderOrientation = 'horizontal' | 'vertical';

export interface AriaSliderProps extends AriaFieldProps {
  value?: number | readonly number[];
  defaultValue?: number | readonly number[];
  minValue?: number;
  maxValue?: number;
  step?: number;
  orientation?: SliderOrientation;
  isDisabled?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
  onChange?: (value: number | number[]) => void;
  onChangeEnd?: (value: number | number[]) => void;
}

export interface SliderState {
  values: number[];
  minValue: number;
  maxValue: number;
  step: number;
  orientation: SliderOrientation;
  isDisabled: boolean;
  getThumbMin(index: number): number;
  getThumbMax(index: number): number;
  getThumbPercent(index: number): number;
  setThumbValue(index: number, value: number, isEnd?: boolean): void;
}

function toValues(value: number | readonly number[] | undefined, fallback: number): number[] {
  if (typeof value === 'number') return [value];
  return value?.length ? [...value] : [fallback];
}

function stepPrecision(step: number): number {
  const value = String(step).toLowerCase();
  if (value.includes('e-')) return Number(value.split('e-')[1]);
  return value.split('.')[1]?.length ?? 0;
}

function roundToStep(value: number, minValue: number, step: number): number {
  const rounded = minValue + Math.round((value - minValue) / step) * step;
  return Number(rounded.toFixed(stepPrecision(step)));
}

export function useSlider(props: AriaSliderProps = {}, trackRef: RefObject<HTMLDivElement>) {
  const minValue = props.minValue ?? 0;
  const maxValue = props.maxValue ?? 100;
  const step = props.step ?? 1;
  const orientation = props.orientation ?? 'horizontal';
  const isRange = Array.isArray(props.value ?? props.defaultValue);
  const [uncontrolled, setUncontrolled] = useState(() =>
    toValues(props.defaultValue, minValue).map((value) =>
      Math.min(maxValue, Math.max(minValue, roundToStep(value, minValue, step))),
    ),
  );
  const source = props.value === undefined ? uncontrolled : toValues(props.value, minValue);
  const values = source.map((value) => Math.min(maxValue, Math.max(minValue, value)));
  const activeThumb = useRef<number | null>(null);
  const formatter = useNumberFormatter(props.formatOptions);
  const { fieldProps, labelProps, descriptionProps, errorMessageProps } = useField(props);

  function getThumbMin(index: number) {
    return index === 0 ? minValue : values[index - 1]!;
  }

  function getThumbMax(index: number) {
    return index === values.length - 1 ? maxValue : values[index + 1]!;
  }

  function publicValue(next: number[]): number | number[] {
    return isRange ? next : next[0]!;
  }

  function setThumbValue(index: number, value: number, isEnd = false) {
    if (props.isDisabled) return;
    const next = [...values];
    next[index] = Math.min(
      getThumbMax(index),
      Math.max(getThumbMin(index), roundToStep(value, minValue, step)),
    );
    if (props.value === undefined) setUncontrolled(next);
    if (next[index] !== values[index]) props.onChange?.(publicValue(next));
    if (isEnd) props.onChangeEnd?.(publicValue(next));
  }

  function valueFromPointer(event: TargetedPointerEvent<HTMLElement>): number {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio =
      orientation === 'vertical'
        ? (rect.bottom - event.clientY) / rect.height
        : (event.clientX - rect.left) / rect.width;
    return minValue + Math.min(1, Math.max(0, ratio)) * (maxValue - minValue);
  }

  function nearestThumb(value: number): number {
    return values.reduce(
      (nearest, current, index) =>
        Math.abs(current - value) < Math.abs(values[nearest]! - value) ? index : nearest,
      0,
    );
  }

  const state: SliderState = {
    values,
    minValue,
    maxValue,
    step,
    orientation,
    isDisabled: props.isDisabled ?? false,
    getThumbMin,
    getThumbMax,
    getThumbPercent(index) {
      return ((values[index]! - minValue) / (maxValue - minValue || 1)) * 100;
    },
    setThumbValue,
  };

  return {
    state,
    groupProps: {
      ...fieldProps,
      role: 'group' as const,
      'aria-disabled': props.isDisabled || undefined,
    } satisfies JSX.HTMLAttributes<HTMLDivElement>,
    trackProps: {
      'data-orientation': orientation,
      onPointerDown(event: TargetedPointerEvent<HTMLElement>) {
        if (props.isDisabled || event.button !== 0 || event.target !== event.currentTarget) return;
        const value = valueFromPointer(event);
        activeThumb.current = nearestThumb(value);
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setThumbValue(activeThumb.current, value);
      },
      onPointerMove(event: TargetedPointerEvent<HTMLElement>) {
        if (
          activeThumb.current == null ||
          !event.currentTarget.hasPointerCapture?.(event.pointerId)
        )
          return;
        setThumbValue(activeThumb.current, valueFromPointer(event));
      },
      onPointerUp(event: TargetedPointerEvent<HTMLElement>) {
        if (activeThumb.current == null) return;
        setThumbValue(activeThumb.current, valueFromPointer(event), true);
        activeThumb.current = null;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      },
      ref: trackRef,
    } as JSX.HTMLAttributes<HTMLDivElement> & { 'data-orientation': SliderOrientation },
    labelProps,
    outputProps: {
      'aria-live': 'off',
    } satisfies JSX.OutputHTMLAttributes<HTMLOutputElement>,
    descriptionProps,
    errorMessageProps,
    formattedValues: values.map((value) => formatter.format(value)),
    valueText: values.map((value) => formatter.format(value)).join(' – '),
  };
}
