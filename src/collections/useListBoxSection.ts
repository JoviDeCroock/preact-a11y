import type { ComponentChildren, JSX, TargetedMouseEvent } from 'preact';
import { useId } from '../utils/useId';

export interface AriaListBoxSectionProps {
  heading?: ComponentChildren;
  'aria-label'?: string;
}

export interface ListBoxSectionAria {
  itemProps: Pick<JSX.HTMLAttributes<HTMLElement>, 'role'>;
  headingProps: Pick<JSX.HTMLAttributes<HTMLElement>, 'id' | 'onMouseDown' | 'role'>;
  groupProps: Pick<JSX.HTMLAttributes<HTMLElement>, 'aria-label' | 'aria-labelledby' | 'role'>;
}

/** Provides listbox section wrapper, visual heading, and labeled group semantics. */
export function useListBoxSection(props: AriaListBoxSectionProps): ListBoxSectionAria {
  const headingId = useId();
  const hasHeading = props.heading != null;
  return {
    itemProps: { role: 'presentation' },
    headingProps: hasHeading
      ? {
          id: headingId,
          role: 'presentation',
          onMouseDown: (event: TargetedMouseEvent<HTMLElement>) => event.preventDefault(),
        }
      : {},
    groupProps: {
      role: 'group',
      'aria-label': props['aria-label'],
      'aria-labelledby': hasHeading ? headingId : undefined,
    },
  };
}
