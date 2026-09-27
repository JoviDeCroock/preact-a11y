import type { JSX } from '../preactTypes';
import { useId } from '../utils/useId';

export interface AriaTooltipProps {
  id?: string;
  isOpen?: boolean;
  'aria-label'?: string;
}

export function useTooltip(props: AriaTooltipProps = {}) {
  const id = useId(props.id);
  return {
    tooltipProps: {
      id,
      role: 'tooltip' as const,
      'aria-label': props['aria-label'],
    } satisfies JSX.HTMLAttributes<HTMLDivElement>,
  };
}
