import type { JSX } from '../preactTypes';

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
}

export function useSeparator(props: SeparatorProps = {}) {
  const orientation = props.orientation ?? 'horizontal';
  return {
    separatorProps: {
      role: 'separator' as const,
      'aria-orientation': orientation === 'vertical' ? 'vertical' : undefined,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
