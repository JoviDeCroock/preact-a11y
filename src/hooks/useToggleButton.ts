import { useState } from 'preact/hooks';
import type { JSX, RefObject } from 'preact';
import { useButton, type AriaButtonProps } from './useButton';

export interface AriaToggleButtonProps extends AriaButtonProps {
  isSelected?: boolean;
  defaultSelected?: boolean;
  onChange?: (isSelected: boolean) => void;
}

export interface ToggleButtonResult {
  buttonProps: JSX.ButtonHTMLAttributes<HTMLButtonElement>;
  isPressed: boolean;
  isSelected: boolean;
}

export function useToggleButton(
  props: AriaToggleButtonProps = {},
  ref?: RefObject<Element>,
): ToggleButtonResult {
  const [uncontrolled, setUncontrolled] = useState(props.defaultSelected ?? false);
  const isSelected = props.isSelected ?? uncontrolled;
  const result = useButton(
    {
      ...props,
      onPress(event) {
        const next = !isSelected;
        if (props.isSelected === undefined) setUncontrolled(next);
        props.onChange?.(next);
        props.onPress?.(event);
      },
    },
    ref,
  );

  return {
    ...result,
    isSelected,
    buttonProps: {
      ...result.buttonProps,
      'aria-pressed': isSelected,
    },
  };
}
