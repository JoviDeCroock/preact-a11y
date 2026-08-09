import type { JSX, TargetedEvent } from 'preact';
import { useField, type AriaFieldProps } from './useField';

export interface AriaTextFieldProps extends AriaFieldProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  name?: string;
  type?: 'email' | 'password' | 'search' | 'tel' | 'text' | 'url';
  autoComplete?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  onChange?: (value: string) => void;
}

export function useTextField(props: AriaTextFieldProps = {}) {
  const { fieldProps, labelProps, descriptionProps, errorMessageProps } = useField(props);

  const inputProps = {
    ...fieldProps,
    autoComplete: props.autoComplete,
    defaultValue: props.defaultValue,
    disabled: props.isDisabled,
    maxLength: props.maxLength,
    minLength: props.minLength,
    name: props.name,
    pattern: props.pattern,
    placeholder: props.placeholder,
    readOnly: props.isReadOnly,
    required: props.isRequired,
    type: props.type ?? 'text',
    value: props.value,
    onInput(event: TargetedEvent<HTMLInputElement, InputEvent>) {
      props.onChange?.(event.currentTarget.value);
    },
  } satisfies JSX.InputHTMLAttributes<HTMLInputElement>;

  return { inputProps, labelProps, descriptionProps, errorMessageProps };
}
