import { createElement, type ComponentChildren, type JSX } from 'preact';

const hiddenStyle: JSX.CSSProperties = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
};

export function useVisuallyHidden(props: { isFocusable?: boolean } = {}) {
  return {
    visuallyHiddenProps: {
      style: hiddenStyle,
      tabIndex: props.isFocusable ? 0 : undefined,
    },
  };
}

export interface VisuallyHiddenProps {
  children?: ComponentChildren;
  elementType?: keyof JSX.IntrinsicElements;
  isFocusable?: boolean;
}

export function VisuallyHidden({
  children,
  elementType = 'span',
  isFocusable,
}: VisuallyHiddenProps) {
  const { visuallyHiddenProps } = useVisuallyHidden({ isFocusable });
  return createElement(elementType, visuallyHiddenProps, children);
}
