import type { JSX, Ref } from 'preact';
import { useTextField, type AriaTextFieldProps } from '../forms/useTextField';

export interface TextFieldProps
  extends
    AriaTextFieldProps,
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      keyof AriaTextFieldProps | 'children' | 'disabled' | 'onInput' | 'readOnly' | 'required'
    > {
  className?: string;
  elementRef?: Ref<HTMLInputElement>;
  inputClassName?: string;
  labelClassName?: string;
}

export function TextField({
  className,
  elementRef,
  inputClassName,
  labelClassName,
  label,
  description,
  errorMessage,
  isInvalid,
  isRequired,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  placeholder,
  name,
  type,
  autoComplete,
  minLength,
  maxLength,
  pattern,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  onChange,
  ...inputDOMProps
}: TextFieldProps) {
  const { inputProps, labelProps, descriptionProps, errorMessageProps } = useTextField({
    label,
    description,
    errorMessage,
    isInvalid,
    isRequired,
    isDisabled,
    isReadOnly,
    value,
    defaultValue,
    placeholder,
    name,
    type,
    autoComplete,
    minLength,
    maxLength,
    pattern,
    id,
    onChange,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
  });

  return (
    <div
      className={className}
      data-disabled={isDisabled || undefined}
      data-invalid={isInvalid || undefined}
      data-readonly={isReadOnly || undefined}
      data-required={isRequired || undefined}
    >
      {label != null && (
        <label {...labelProps} className={labelClassName}>
          {label}
        </label>
      )}
      <input {...inputDOMProps} {...inputProps} className={inputClassName} ref={elementRef} />
      {description != null && <div {...descriptionProps}>{description}</div>}
      {isInvalid && errorMessage != null && <div {...errorMessageProps}>{errorMessage}</div>}
    </div>
  );
}
