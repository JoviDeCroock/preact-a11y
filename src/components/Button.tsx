import type { ComponentChildren, JSX, Ref } from 'preact';
import { useButton } from '../hooks/useButton';
import type { PressProps } from '../types';
import { mergeProps } from '../utils/mergeProps';

export interface ButtonProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>, PressProps {
  children?: ComponentChildren;
  elementRef?: Ref<HTMLButtonElement>;
}

export function Button({
  children,
  elementRef,
  isDisabled,
  onPress,
  onPressChange,
  onPressEnd,
  onPressStart,
  onPressUp,
  preventFocusOnPress,
  ...domProps
}: ButtonProps) {
  const { buttonProps, isPressed } = useButton({
    isDisabled,
    onPress,
    onPressChange,
    onPressEnd,
    onPressStart,
    onPressUp,
    preventFocusOnPress,
    type: domProps.type as 'button' | 'reset' | 'submit' | undefined,
  });
  const props = mergeProps(
    domProps as Record<string, unknown>,
    buttonProps as Record<string, unknown>,
  );

  return (
    <button
      {...props}
      data-disabled={isDisabled || undefined}
      data-pressed={isPressed || undefined}
      ref={elementRef}
    >
      {children}
    </button>
  );
}
