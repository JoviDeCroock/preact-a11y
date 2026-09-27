import type { JSX, TargetedKeyboardEvent } from '../preactTypes';
import { usePress } from '../interactions/usePress';
import {
  shouldClientNavigate,
  useRouterContext,
  type RouterOptions,
} from '../navigation/RouterProvider';
import type { PressProps } from '../types';

export interface AriaLinkProps extends PressProps {
  elementType?: keyof JSX.IntrinsicElements;
  href?: string;
  target?: string;
  rel?: string;
  download?: string | boolean;
  referrerPolicy?: JSX.AnchorHTMLAttributes<HTMLAnchorElement>['referrerPolicy'];
  routerOptions?: RouterOptions;
}

export function useLink(props: AriaLinkProps = {}) {
  const { elementType = 'a', isDisabled = false } = props;
  const router = useRouterContext();
  const href = router.useHref(props.href ?? '');
  const { isPressed, pressProps } = usePress(props);
  const { onClick, onKeyDown, onKeyUp, ...pointerProps } = pressProps;
  const isNativeAnchor = elementType === 'a';

  const linkProps = {
    ...pointerProps,
    href: isDisabled || !props.href ? undefined : href,
    target: props.target,
    rel: props.rel,
    download: props.download,
    referrerPolicy: props.referrerPolicy,
    'aria-disabled': isDisabled || undefined,
    ...(isNativeAnchor
      ? { tabIndex: isDisabled ? -1 : undefined }
      : { role: 'link' as const, tabIndex: isDisabled ? -1 : 0 }),
    onClick(event) {
      onClick?.(event);
      if (
        event.defaultPrevented ||
        isDisabled ||
        router.isNative ||
        !router.navigate ||
        !props.href ||
        !isNativeAnchor ||
        !shouldClientNavigate(event.currentTarget, event)
      ) {
        return;
      }
      event.preventDefault();
      router.navigate(props.href, props.routerOptions);
    },
    onKeyDown(event: TargetedKeyboardEvent<HTMLAnchorElement>) {
      if (event.key !== ' ') onKeyDown?.(event);
    },
    onKeyUp(event: TargetedKeyboardEvent<HTMLAnchorElement>) {
      if (event.key !== ' ') onKeyUp?.(event);
    },
  } satisfies JSX.AnchorHTMLAttributes<HTMLAnchorElement>;

  return { isPressed, linkProps };
}
