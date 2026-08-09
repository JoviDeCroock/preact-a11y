import type { FocusEventHandler, JSX, TargetedFocusEvent } from 'preact';
import { useState } from 'preact/hooks';

export interface FocusWithinProps {
  isDisabled?: boolean;
  onFocusWithin?: FocusEventHandler<HTMLElement>;
  onBlurWithin?: FocusEventHandler<HTMLElement>;
  onFocusWithinChange?: (isFocusWithin: boolean) => void;
}

export function useFocusWithin(props: FocusWithinProps = {}) {
  const [isFocusWithin, setFocusWithin] = useState(false);

  return {
    isFocusWithin,
    focusWithinProps: {
      onFocusIn(event: TargetedFocusEvent<HTMLElement>) {
        if (props.isDisabled) return;
        if (!isFocusWithin) {
          setFocusWithin(true);
          props.onFocusWithinChange?.(true);
        }
        props.onFocusWithin?.(event);
      },
      onFocusOut(event: TargetedFocusEvent<HTMLElement>) {
        if (props.isDisabled || event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return;
        }
        setFocusWithin(false);
        props.onFocusWithinChange?.(false);
        props.onBlurWithin?.(event);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
