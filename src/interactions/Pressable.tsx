import { cloneElement } from 'preact';
import type { Ref, VNode } from 'preact';
import type { JSX } from '../preactTypes';
import { useRef } from 'preact/hooks';
import type { PressProps } from '../types';
import { mergeProps } from '../utils/mergeProps';
import { mergeRefs } from '../utils/mergeRefs';
import { useFocusable, type FocusableOptions } from './useFocusable';
import { usePress } from './usePress';

export interface PressableProps extends PressProps, Omit<FocusableOptions, 'isDisabled'> {
  /** A single native Preact element. */
  children: VNode<JSX.HTMLAttributes<HTMLElement>>;
  /** Preact-native ref seam; no forwardRef compatibility layer is installed. */
  elementRef?: Ref<HTMLElement>;
}

/** Clones one native child and composes normalized press behavior into its existing props. */
export function Pressable({ children, elementRef, ...options }: PressableProps) {
  const localRef = useRef<HTMLElement>(null);
  const { pressProps } = usePress(options);
  const { focusableProps } = useFocusable(options, localRef);
  const props = mergeProps(
    children.props as unknown as Record<string, unknown>,
    focusableProps as Record<string, unknown>,
    pressProps as Record<string, unknown>,
  );

  return cloneElement(children, {
    ...props,
    ref: mergeRefs(children.ref ?? undefined, elementRef, localRef),
  });
}
