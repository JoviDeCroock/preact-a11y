import { cloneElement } from 'preact';
import type { VNode } from 'preact';
import type { JSX } from '../preactTypes';
import { mergeProps } from '../utils/mergeProps';
import { useFocusRing } from './useFocus';

export interface FocusRingProps {
  /** A single native Preact element that receives focus handlers and classes. */
  children: VNode<JSX.HTMLAttributes<HTMLElement>>;
  /** Class applied whenever the element, or its descendants with `within`, is focused. */
  focusClass?: string;
  /** Class applied only when keyboard focus should be visibly indicated. */
  focusRingClass?: string;
  within?: boolean;
  isTextInput?: boolean;
  autoFocus?: boolean;
}

/** Applies focus classes to a native child without adding wrapper markup. */
export function FocusRing({
  children,
  focusClass,
  focusRingClass,
  within,
  isTextInput,
  autoFocus,
}: FocusRingProps) {
  const { focusProps, isFocused, isFocusVisible } = useFocusRing({
    autoFocus,
    isTextInput,
    within,
  });
  const activeClasses = [isFocused && focusClass, isFocusVisible && focusRingClass]
    .filter(Boolean)
    .join(' ');
  const props = mergeProps(
    children.props as unknown as Record<string, unknown>,
    focusProps as Record<string, unknown>,
    { className: activeClasses || undefined } as Record<string, unknown>,
  );

  return cloneElement(children, props);
}
