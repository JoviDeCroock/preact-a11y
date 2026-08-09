import { cloneElement } from 'preact';
import type { JSX, Ref, RefObject, TargetedKeyboardEvent, VNode } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { mergeProps } from '../utils/mergeProps';
import { mergeRefs } from '../utils/mergeRefs';
import { useFocus, type FocusProps } from './useFocus';

type FocusableDOMProps = Pick<
  JSX.HTMLAttributes<HTMLElement>,
  'aria-disabled' | 'autoFocus' | 'onBlur' | 'onFocus' | 'onKeyDown' | 'onKeyUp' | 'tabIndex'
>;

export interface FocusableOptions extends FocusProps {
  /** Focus the element after it mounts. */
  autoFocus?: boolean;
  /** Keep the element programmatically focusable while removing it from sequential navigation. */
  excludeFromTabOrder?: boolean;
  onKeyDown?: (event: TargetedKeyboardEvent<HTMLElement>) => void;
  onKeyUp?: (event: TargetedKeyboardEvent<HTMLElement>) => void;
}

export interface FocusableAria {
  focusableProps: FocusableDOMProps;
}

/** Adds focus, keyboard, disabled, and autofocus behavior to a Preact DOM element. */
export function useFocusable(
  props: FocusableOptions = {},
  domRef?: RefObject<HTMLElement>,
): FocusableAria {
  const { focusProps } = useFocus(props);

  useEffect(() => {
    if (!props.autoFocus || props.isDisabled) return;
    domRef?.current?.focus();
  }, [domRef, props.autoFocus, props.isDisabled]);

  return {
    focusableProps: mergeProps(
      focusProps as Record<string, unknown>,
      {
        'aria-disabled': props.isDisabled || undefined,
        autoFocus: props.autoFocus || undefined,
        onKeyDown: props.isDisabled ? undefined : props.onKeyDown,
        onKeyUp: props.isDisabled ? undefined : props.onKeyUp,
        tabIndex: props.isDisabled || props.excludeFromTabOrder ? -1 : 0,
      } as Record<string, unknown>,
    ) as FocusableDOMProps,
  };
}

export interface FocusableProps extends FocusableOptions {
  /** A single native Preact element. */
  children: VNode<JSX.HTMLAttributes<HTMLElement>>;
  /** Preact-native ref seam; no forwardRef compatibility layer is installed. */
  elementRef?: Ref<HTMLElement>;
}

/** Clones one native child and composes focus behavior into its existing props. */
export function Focusable({ children, elementRef, ...options }: FocusableProps) {
  const localRef = useRef<HTMLElement>(null);
  const { focusableProps } = useFocusable(options, localRef);
  const props = mergeProps(
    children.props as unknown as Record<string, unknown>,
    focusableProps as Record<string, unknown>,
  );

  return cloneElement(children, {
    ...props,
    ref: mergeRefs(children.ref ?? undefined, elementRef, localRef),
  });
}
