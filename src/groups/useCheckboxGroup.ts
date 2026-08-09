import type { JSX, RefObject } from 'preact';
import { useField, type AriaFieldProps } from '../forms/useField';
import { useCheckbox, type AriaCheckboxProps } from '../hooks/useCheckbox';

export interface AriaCheckboxGroupProps extends AriaFieldProps {
  isDisabled?: boolean;
  isReadOnly?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export function useCheckboxGroup(props: AriaCheckboxGroupProps = {}) {
  const { fieldProps, labelProps, descriptionProps, errorMessageProps } = useField(props);
  return {
    groupProps: {
      ...fieldProps,
      role: 'group',
      'aria-disabled': props.isDisabled || undefined,
      'aria-readonly': props.isReadOnly || undefined,
    } satisfies JSX.HTMLAttributes<HTMLDivElement>,
    labelProps: { id: labelProps.id },
    descriptionProps,
    errorMessageProps,
  };
}

export interface AriaCheckboxGroupItemProps extends Omit<AriaCheckboxProps, 'isSelected'> {
  isSelected: boolean;
}

export function useCheckboxGroupItem(
  props: AriaCheckboxGroupItemProps,
  ref?: RefObject<HTMLInputElement>,
) {
  return useCheckbox(props, ref);
}
