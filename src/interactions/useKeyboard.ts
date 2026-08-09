import type { JSX, TargetedKeyboardEvent } from 'preact';

export interface KeyboardProps {
  isDisabled?: boolean;
  onKeyDown?: (event: TargetedKeyboardEvent<HTMLElement>) => void;
  onKeyUp?: (event: TargetedKeyboardEvent<HTMLElement>) => void;
}

export function useKeyboard(props: KeyboardProps = {}) {
  return {
    keyboardProps: {
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        if (!props.isDisabled) props.onKeyDown?.(event);
      },
      onKeyUp(event: TargetedKeyboardEvent<HTMLElement>) {
        if (!props.isDisabled) props.onKeyUp?.(event);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
