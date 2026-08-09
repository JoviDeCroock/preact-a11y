import type { JSX } from 'preact';

export interface AriaModalProps {
  role?: 'alertdialog' | 'dialog';
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export function useModal(props: AriaModalProps = {}) {
  return {
    modalProps: {
      role: props.role ?? 'dialog',
      'aria-modal': true,
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'],
      'aria-describedby': props['aria-describedby'],
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
