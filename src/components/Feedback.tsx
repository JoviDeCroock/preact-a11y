import type { JSX } from 'preact';
import { useMeter, type AriaMeterProps } from '../feedback/useMeter';
import { useProgressBar, type AriaProgressBarProps } from '../feedback/useProgressBar';
import { useSeparator, type SeparatorProps as AriaSeparatorProps } from '../feedback/useSeparator';

export interface ProgressBarProps
  extends
    AriaProgressBarProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof AriaProgressBarProps> {
  trackClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function ProgressBar({
  label,
  value,
  minValue,
  maxValue,
  valueLabel: valueLabelProp,
  isIndeterminate,
  formatOptions,
  trackClassName,
  labelClassName,
  valueClassName,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...domProps
}: ProgressBarProps) {
  const { progressBarProps, labelProps, valueLabel } = useProgressBar({
    label,
    value,
    minValue,
    maxValue,
    valueLabel: valueLabelProp,
    isIndeterminate,
    formatOptions,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
  });
  return (
    <div {...domProps} data-indeterminate={isIndeterminate || undefined}>
      {label != null && (
        <span {...labelProps} className={labelClassName}>
          {label}
        </span>
      )}
      {!isIndeterminate && <span className={valueClassName}>{valueLabel}</span>}
      <div {...progressBarProps} className={trackClassName} />
    </div>
  );
}

export interface MeterProps
  extends AriaMeterProps, Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof AriaMeterProps> {
  trackClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function Meter({
  label,
  value,
  minValue,
  maxValue,
  valueLabel: valueLabelProp,
  formatOptions,
  trackClassName,
  labelClassName,
  valueClassName,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...domProps
}: MeterProps) {
  const { meterProps, labelProps, valueLabel } = useMeter({
    label,
    value,
    minValue,
    maxValue,
    valueLabel: valueLabelProp,
    formatOptions,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
  });
  return (
    <div {...domProps}>
      {label != null && (
        <span {...labelProps} className={labelClassName}>
          {label}
        </span>
      )}
      <span className={valueClassName}>{valueLabel}</span>
      <div {...meterProps} className={trackClassName} />
    </div>
  );
}

export type SeparatorComponentProps = AriaSeparatorProps &
  Omit<JSX.HTMLAttributes<HTMLHRElement>, keyof AriaSeparatorProps>;

export function Separator({ orientation, ...domProps }: SeparatorComponentProps) {
  const { separatorProps } = useSeparator({ orientation });
  return <hr {...domProps} {...separatorProps} data-orientation={orientation ?? 'horizontal'} />;
}
