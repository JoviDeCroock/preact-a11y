import type { JSX } from '../preactTypes';
import { useField, type AriaFieldProps } from '../forms/useField';

export interface AriaRadioGroupProps extends AriaFieldProps {
  name?: string;
  orientation?: 'horizontal' | 'vertical';
  isDisabled?: boolean;
  isReadOnly?: boolean;
}

export function useRadioGroup(props: AriaRadioGroupProps = {}) {
  const { fieldProps, labelProps, descriptionProps, errorMessageProps } = useField(props);

  return {
    radioGroupProps: {
      ...fieldProps,
      role: 'radiogroup',
      'aria-disabled': props.isDisabled || undefined,
      'aria-orientation': props.orientation,
      'aria-readonly': props.isReadOnly || undefined,
    } satisfies JSX.HTMLAttributes<HTMLDivElement>,
    labelProps: { id: labelProps.id },
    descriptionProps,
    errorMessageProps,
  };
}
