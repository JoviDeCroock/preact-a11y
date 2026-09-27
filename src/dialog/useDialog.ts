import type { JSX } from '../preactTypes';
import { useId } from 'preact/hooks';

export interface AriaDialogProps {
  role?: 'alertdialog' | 'dialog';
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function useDialog(props: AriaDialogProps = {}) {
  const titleId = `preact-a11y-dialog-title-${useId()}`;
  return {
    dialogProps: {
      role: props.role ?? ('dialog' as const),
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'] ?? (props['aria-label'] ? undefined : titleId),
      tabIndex: -1,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    titleProps: { id: titleId } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
