import type { RefObject } from 'preact';
import type { JSX } from '../preactTypes';
import { usePress } from '../interactions/usePress';
import type { PressProps } from '../types';

export interface AriaButtonProps extends PressProps {
  elementType?: keyof JSX.IntrinsicElements;
  type?: 'button' | 'submit' | 'reset';
  tabIndex?: number;
}

export function useButton(props: AriaButtonProps = {}, _ref?: RefObject<Element>) {
  const { elementType = 'button', isDisabled = false } = props;
  const { isPressed, pressProps } = usePress(props);
  const isNativeButton = elementType === 'button';

  const buttonProps = {
    ...pressProps,
    ...(isNativeButton
      ? { disabled: isDisabled, type: props.type ?? 'button' }
      : {
          'aria-disabled': isDisabled || undefined,
          role: 'button' as const,
          tabIndex: isDisabled ? -1 : (props.tabIndex ?? 0),
        }),
  } as JSX.ButtonHTMLAttributes<HTMLButtonElement>;

  return { buttonProps, isPressed };
}
