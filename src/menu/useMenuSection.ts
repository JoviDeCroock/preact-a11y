import type { ComponentChildren, JSX } from 'preact';
import { useId } from '../utils/useId';

export interface AriaMenuSectionProps {
  heading?: ComponentChildren;
  'aria-label'?: string;
}

export interface MenuSectionAria {
  itemProps: Pick<JSX.HTMLAttributes<HTMLElement>, 'role'>;
  headingProps: Pick<JSX.HTMLAttributes<HTMLElement>, 'id' | 'role'>;
  groupProps: Pick<JSX.HTMLAttributes<HTMLElement>, 'aria-label' | 'aria-labelledby' | 'role'>;
}

/** Provides menu section wrapper, visual heading, and labeled group semantics. */
export function useMenuSection(props: AriaMenuSectionProps): MenuSectionAria {
  const headingId = useId();
  const hasHeading = props.heading != null;
  return {
    itemProps: { role: 'presentation' },
    headingProps: hasHeading ? { id: headingId, role: 'presentation' } : {},
    groupProps: {
      role: 'group',
      'aria-label': props['aria-label'],
      'aria-labelledby': hasHeading ? headingId : undefined,
    },
  };
}
