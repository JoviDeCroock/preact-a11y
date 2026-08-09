import type { ComponentChildren, JSX, Ref } from 'preact';
import { useRef } from 'preact/hooks';
import { useSwitch, type AriaSwitchProps } from '../hooks/useSwitch';
import { mergeRefs } from '../utils/mergeRefs';

export interface SwitchProps
  extends
    AriaSwitchProps,
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      'checked' | 'children' | 'name' | 'onChange' | 'role' | 'type' | 'value'
    > {
  children: ComponentChildren;
  className?: string;
  elementRef?: Ref<HTMLInputElement>;
  inputClassName?: string;
}

export function Switch({
  children,
  className,
  elementRef,
  inputClassName,
  isSelected,
  defaultSelected,
  isDisabled,
  isReadOnly,
  isRequired,
  name,
  value,
  onChange,
  ...inputDOMProps
}: SwitchProps) {
  const localRef = useRef<HTMLInputElement>(null);
  const { inputProps, isSelected: selected } = useSwitch(
    {
      isSelected,
      defaultSelected,
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
