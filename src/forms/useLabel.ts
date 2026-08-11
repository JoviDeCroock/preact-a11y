import type { ComponentChildren } from 'preact';
import type { JSX } from '../preactTypes';
import { useId } from 'preact/hooks';

export interface AriaLabelProps {
  label?: ComponentChildren;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function useLabel(props: AriaLabelProps = {}) {
  const generatedId = useId();
  const labelId = `preact-a11y-label-${generatedId}`;
  return {
    labelProps: {
      id: labelId,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    fieldProps: {
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'] ?? (props.label != null ? labelId : undefined),
    },
  };
}
