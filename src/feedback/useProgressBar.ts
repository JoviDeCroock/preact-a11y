import type { JSX } from 'preact';
import { useLabel, type AriaLabelProps } from '../forms/useLabel';
import { useNumberFormatter } from '../i18n/formatters';

export interface AriaProgressBarProps extends AriaLabelProps {
  value?: number;
  minValue?: number;
  maxValue?: number;
  valueLabel?: string;
  isIndeterminate?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
}

export function useProgressBar(props: AriaProgressBarProps = {}) {
  const minValue = props.minValue ?? 0;
  const maxValue = props.maxValue ?? 100;
  const value = Math.min(maxValue, Math.max(minValue, props.value ?? minValue));
  const percentage = maxValue === minValue ? 0 : (value - minValue) / (maxValue - minValue);
  const formatter = useNumberFormatter(props.formatOptions ?? { style: 'percent' });
  const { fieldProps, labelProps } = useLabel(props);
  const valueLabel = props.valueLabel ?? formatter.format(percentage);

  return {
    labelProps,
    valueLabel,
    progressBarProps: {
      ...fieldProps,
      role: 'progressbar',
      'aria-valuemin': props.isIndeterminate ? undefined : minValue,
      'aria-valuemax': props.isIndeterminate ? undefined : maxValue,
      'aria-valuenow': props.isIndeterminate ? undefined : value,
      'aria-valuetext': props.isIndeterminate ? undefined : valueLabel,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
