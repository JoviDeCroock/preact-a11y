import type { JSX } from '../preactTypes';
import { useProgressBar, type AriaProgressBarProps } from './useProgressBar';

export interface AriaMeterProps extends Omit<AriaProgressBarProps, 'isIndeterminate'> {
  value: number;
}

export function useMeter(props: AriaMeterProps) {
  const result = useProgressBar(props);
  return {
    labelProps: result.labelProps,
    valueLabel: result.valueLabel,
    meterProps: {
      ...result.progressBarProps,
      role: 'meter' as const,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
