import type { JSX, TargetedKeyboardEvent } from 'preact';
import { usePress } from '../interactions/usePress';
import type { PressProps } from '../types';

export interface AriaLinkProps extends PressProps {
  elementType?: keyof JSX.IntrinsicElements;
  href?: string;
  target?: string;
  rel?: string;
  download?: string | boolean;
  referrerPolicy?: JSX.AnchorHTMLAttributes<HTMLAnchorElement>['referrerPolicy'];
}

export function useLink(props: AriaLinkProps = {}) {
  const { elementType = 'a', isDisabled = false } = props;
  const { isPressed, pressProps } = usePress(props);
  const { onKeyDown, onKeyUp, ...pointerProps } = pressProps;
  const isNativeAnchor = elementType === 'a';

  const linkProps = {
    ...pointerProps,
    href: isDisabled ? undefined : props.href,
    target: props.target,
    rel: props.rel,
    download: props.download,
    referrerPolicy: props.referrerPolicy,
    'aria-disabled': isDisabled || undefined,
    ...(isNativeAnchor
      ? { tabIndex: isDisabled ? -1 : undefined }
      : { role: 'link', tabIndex: isDisabled ? -1 : 0 }),
    onKeyDown(event: TargetedKeyboardEvent<HTMLAnchorElement>) {
      if (event.key !== ' ') onKeyDown?.(event);
    },
    onKeyUp(event: TargetedKeyboardEvent<HTMLAnchorElement>) {
      if (event.key !== ' ') onKeyUp?.(event);
    },
  } satisfies JSX.AnchorHTMLAttributes<HTMLAnchorElement>;

  return { isPressed, linkProps };
}
