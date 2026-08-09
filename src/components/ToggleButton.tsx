import type { ComponentChildren, JSX, Ref } from 'preact';
import { useRef } from 'preact/hooks';
import { useToggleButton, type AriaToggleButtonProps } from '../hooks/useToggleButton';
import { mergeRefs } from '../utils/mergeRefs';

export interface ToggleButtonProps
  extends
    AriaToggleButtonProps,
    Omit<
      JSX.ButtonHTMLAttributes<HTMLButtonElement>,
      keyof AriaToggleButtonProps | 'children' | 'disabled'
    > {
  children: ComponentChildren;
  elementRef?: Ref<HTMLButtonElement>;
}

export function ToggleButton({
  children,
  elementRef,
  isSelected,
  defaultSelected,
  isDisabled,
  onChange,
  onPress,
  onPressStart,
  onPressEnd,
  onPressUp,
  onPressChange,
  type,
  ...domProps
}: ToggleButtonProps) {
  const localRef = useRef<HTMLButtonElement>(null);
  const result = useToggleButton(
    {
      isSelected,
      defaultSelected,
      isDisabled,
      onChange,
      onPress,
      onPressStart,
      onPressEnd,
      onPressUp,
      onPressChange,
      type,
    },
    localRef,
  );

  return (
    <button
      {...domProps}
      {...result.buttonProps}
      data-pressed={result.isPressed || undefined}
      data-selected={result.isSelected || undefined}
      ref={mergeRefs(localRef, elementRef)}
    >
      {children}
    </button>
  );
}
