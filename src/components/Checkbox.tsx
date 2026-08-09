import type { ComponentChildren, JSX, Ref } from 'preact';
import { useRef } from 'preact/hooks';
import { useCheckbox, type AriaCheckboxProps } from '../hooks/useCheckbox';
import { mergeRefs } from '../utils/mergeRefs';

export interface CheckboxProps
  extends
    AriaCheckboxProps,
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      'checked' | 'children' | 'name' | 'onChange' | 'type' | 'value'
    > {
  children: ComponentChildren;
  className?: string;
  elementRef?: Ref<HTMLInputElement>;
  inputClassName?: string;
}

export function Checkbox({
  children,
  className,
  elementRef,
  inputClassName,
  isSelected,
  defaultSelected,
  isIndeterminate,
  isDisabled,
  isReadOnly,
  isRequired,
  name,
  value,
  onChange,
  ...inputDOMProps
}: CheckboxProps) {
  const localRef = useRef<HTMLInputElement>(null);
  const { inputProps, isSelected: selected } = useCheckbox(
    {
      isSelected,
      defaultSelected,
      isIndeterminate,
      isDisabled,
      isReadOnly,
      isRequired,
      name,
      value,
      onChange,
    },
    localRef,
  );

  return (
    <label
      className={className}
      data-disabled={isDisabled || undefined}
      data-selected={selected || undefined}
    >
      <input
        {...inputDOMProps}
        {...inputProps}
        className={inputClassName}
        ref={mergeRefs(localRef, elementRef)}
      />
      {children}
    </label>
  );
}
