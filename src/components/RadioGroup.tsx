import { createContext } from 'preact';
import type { ComponentChildren, Ref } from 'preact';
import type { JSX } from '../preactTypes';
import { useContext, useId, useState } from 'preact/hooks';
import { useRadio, type AriaRadioProps } from '../hooks/useRadio';
import { useRadioGroup, type AriaRadioGroupProps } from '../hooks/useRadioGroup';

interface RadioGroupContextValue {
  name: string;
  selectedValue: string | undefined;
  isDisabled: boolean;
  isReadOnly: boolean;
  isRequired: boolean;
  select(value: string): void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps
  extends
    AriaRadioGroupProps,
    Omit<
      JSX.HTMLAttributes<HTMLDivElement>,
      keyof AriaRadioGroupProps | 'defaultValue' | 'onChange'
    > {
  children: ComponentChildren;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export function RadioGroup({
  children,
  label,
  description,
  errorMessage,
  isInvalid,
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  orientation = 'vertical',
  name,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  value,
  defaultValue,
  onChange,
  ...domProps
}: RadioGroupProps) {
  const generatedName = `preact-aria-radio-${useId()}`;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const selectedValue = value ?? uncontrolled;
  const { radioGroupProps, labelProps, descriptionProps, errorMessageProps } = useRadioGroup({
    label,
    description,
    errorMessage,
    isInvalid,
    isRequired,
    isDisabled,
    isReadOnly,
    orientation,
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
  });

  const context: RadioGroupContextValue = {
    name: name ?? generatedName,
    selectedValue,
    isDisabled,
    isReadOnly,
    isRequired,
    select(nextValue) {
      if (value === undefined) setUncontrolled(nextValue);
      onChange?.(nextValue);
    },
  };

  return (
    <div {...domProps} {...radioGroupProps} data-orientation={orientation}>
      {label != null && <span {...labelProps}>{label}</span>}
      <RadioGroupContext.Provider value={context}>{children}</RadioGroupContext.Provider>
      {description != null && <div {...descriptionProps}>{description}</div>}
      {isInvalid && errorMessage != null && <div {...errorMessageProps}>{errorMessage}</div>}
    </div>
  );
}

export interface RadioProps
  extends
    Omit<AriaRadioProps, 'name'>,
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      'checked' | 'children' | 'name' | 'onChange' | 'type' | 'value'
    > {
  children: ComponentChildren;
  className?: string;
  elementRef?: Ref<HTMLInputElement>;
  inputClassName?: string;
  name?: string;
}

export function Radio({
  children,
  className,
  elementRef,
  inputClassName,
  value,
  name,
  isSelected,
  defaultSelected,
  isDisabled,
  isReadOnly,
  isRequired,
  onChange,
  ...inputDOMProps
}: RadioProps) {
  const group = useContext(RadioGroupContext);
  const result = useRadio({
    value,
    name: group?.name ?? name,
    isSelected: group ? group.selectedValue === value : isSelected,
    defaultSelected: group ? undefined : defaultSelected,
    isDisabled: group?.isDisabled || isDisabled,
    isReadOnly: group?.isReadOnly || isReadOnly,
    isRequired: group?.isRequired || isRequired,
    onChange: group?.select ?? onChange,
  });

  return (
    <label
      className={className}
      data-disabled={result.isDisabled || undefined}
      data-selected={result.isSelected || undefined}
    >
      <input
        {...inputDOMProps}
        {...result.inputProps}
        className={inputClassName}
        ref={elementRef}
      />
      {children}
    </label>
  );
}
