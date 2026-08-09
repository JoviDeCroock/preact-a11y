import type { ComponentChildren, JSX } from 'preact';
import { useId } from 'preact/hooks';

export interface AriaFieldProps {
  id?: string;
  label?: ComponentChildren;
  description?: ComponentChildren;
  errorMessage?: ComponentChildren;
  isInvalid?: boolean;
  isRequired?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

function joinIds(...ids: Array<string | undefined | false>): string | undefined {
  const value = ids.filter(Boolean).join(' ');
  return value || undefined;
}

export function useField(props: AriaFieldProps = {}) {
  const generatedId = useId();
  const fieldId = props.id ?? `preact-aria-${generatedId}`;
  const labelId = `${fieldId}-label`;
  const descriptionId = `${fieldId}-description`;
  const errorMessageId = `${fieldId}-error`;
  const hasVisibleLabel = props.label != null;

  return {
    fieldProps: {
      id: fieldId,
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'] ?? (hasVisibleLabel ? labelId : undefined),
      'aria-describedby': joinIds(
        props['aria-describedby'],
        props.description != null && descriptionId,
        props.isInvalid && props.errorMessage != null && errorMessageId,
      ),
      'aria-invalid': props.isInvalid || undefined,
      'aria-required': props.isRequired || undefined,
    },
    labelProps: {
      id: labelId,
      htmlFor: fieldId,
    } satisfies JSX.LabelHTMLAttributes<HTMLLabelElement>,
    descriptionProps: {
      id: descriptionId,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    errorMessageProps: {
      id: errorMessageId,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
