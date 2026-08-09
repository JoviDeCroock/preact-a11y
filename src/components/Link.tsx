import type { ComponentChildren, JSX, Ref } from 'preact';
import { useLink, type AriaLinkProps } from '../hooks/useLink';

export interface LinkProps
  extends
    AriaLinkProps,
    Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, keyof AriaLinkProps | 'children'> {
  children: ComponentChildren;
  elementRef?: Ref<HTMLAnchorElement>;
}

export function Link({
  children,
  elementRef,
  href,
  target,
  rel,
  download,
  referrerPolicy,
  routerOptions,
  isDisabled,
  onPress,
  onPressStart,
  onPressEnd,
  onPressUp,
  onPressChange,
  ...domProps
}: LinkProps) {
  const { isPressed, linkProps } = useLink({
    href,
    target,
    rel,
    download,
    referrerPolicy,
    routerOptions,
    isDisabled,
    onPress,
    onPressStart,
    onPressEnd,
    onPressUp,
    onPressChange,
  });

  return (
    <a
      {...domProps}
      {...linkProps}
      data-disabled={isDisabled || undefined}
      data-pressed={isPressed || undefined}
      ref={elementRef}
    >
      {children}
    </a>
  );
}
