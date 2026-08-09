import type { JSX, Ref } from 'preact';
import { useRef } from 'preact/hooks';
import { useNumberField, type AriaNumberFieldProps } from '../forms/useNumberField';
import { useSearchField, type AriaSearchFieldProps } from '../forms/useSearchField';
import { mergeRefs } from '../utils/mergeRefs';

export interface SearchFieldProps
  extends
    AriaSearchFieldProps,
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      keyof AriaSearchFieldProps | 'children' | 'disabled' | 'onInput' | 'readOnly' | 'required'
    > {
  className?: string;
  elementRef?: Ref<HTMLInputElement>;
  inputClassName?: string;
  labelClassName?: string;
  clearButtonClassName?: string;
}

export function SearchField({
  className,
  elementRef,
  inputClassName,
  labelClassName,
  clearButtonClassName,
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
  autoComplete,
  minLength,
  maxLength,
  pattern,
  onChange,
  onClear,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  ...inputDOMProps
}: SearchFieldProps) {
  const localRef = useRef<HTMLInputElement>(null);
  const { inputProps, clearButtonProps, labelProps, descriptionProps, errorMessageProps } =
    useSearchField(
      {
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
        autoComplete,
        minLength,
        maxLength,
        pattern,
        onChange,
        onClear,
        id,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-describedby': ariaDescribedby,
      },
      localRef,
    );

  return (
    <div className={className} data-invalid={isInvalid || undefined}>
      {label != null && (
        <label {...labelProps} className={labelClassName}>
          {label}
        </label>
      )}
      <input
        {...inputDOMProps}
        {...inputProps}
        className={inputClassName}
        ref={mergeRefs(localRef, elementRef)}
      />
      <button {...clearButtonProps} className={clearButtonClassName}>
        ×
      </button>
      {description != null && <div {...descriptionProps}>{description}</div>}
      {isInvalid && errorMessage != null && <div {...errorMessageProps}>{errorMessage}</div>}
    </div>
  );
}

export interface NumberFieldProps
  extends
    AriaNumberFieldProps,
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      keyof AriaNumberFieldProps | 'children' | 'disabled' | 'onInput' | 'readOnly' | 'required'
    > {
  className?: string;
  elementRef?: Ref<HTMLInputElement>;
  inputClassName?: string;
  labelClassName?: string;
  incrementButtonClassName?: string;
  decrementButtonClassName?: string;
}

export function NumberField({
  className,
  elementRef,
  inputClassName,
  labelClassName,
  incrementButtonClassName,
  decrementButtonClassName,
  label,
  description,
  errorMessage,
  isInvalid,
  isRequired,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  minValue,
  maxValue,
  step,
  formatOptions,
  onChange,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  ...inputDOMProps
}: NumberFieldProps) {
  const result = useNumberField({
    label,
    description,
    errorMessage,
    isInvalid,
    isRequired,
    isDisabled,
    isReadOnly,
    value,
    defaultValue,
    minValue,
    maxValue,
    step,
    formatOptions,
    onChange,
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
  });

  return (
    <div className={className} data-invalid={isInvalid || undefined}>
      {label != null && (
        <label {...result.labelProps} className={labelClassName}>
          {label}
        </label>
      )}
      <button {...result.decrementButtonProps} className={decrementButtonClassName}>
        −
      </button>
      <input
        {...inputDOMProps}
        {...result.inputProps}
        className={inputClassName}
        ref={elementRef}
      />
      <button {...result.incrementButtonProps} className={incrementButtonClassName}>
        +
      </button>
      {description != null && <div {...result.descriptionProps}>{description}</div>}
      {isInvalid && errorMessage != null && <div {...result.errorMessageProps}>{errorMessage}</div>}
    </div>
  );
}
