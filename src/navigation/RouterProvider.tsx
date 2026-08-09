import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useContext, useMemo } from 'preact/hooks';

export interface RouterOptions {
  replace?: boolean;
  state?: unknown;
}

export interface RouterProviderProps {
  navigate: (path: string, options?: RouterOptions) => void;
  useHref?: (href: string) => string;
  children: ComponentChildren;
}

interface RouterContextValue {
  isNative: boolean;
  navigate?: RouterProviderProps['navigate'];
  useHref: (href: string) => string;
}

const nativeRouter: RouterContextValue = {
  isNative: true,
  useHref: (href) => href,
};

const RouterContext = createContext<RouterContextValue>(nativeRouter);

/** Connects Preact Aria links to a client-side router while preserving native link semantics. */
export function RouterProvider({ children, navigate, useHref }: RouterProviderProps) {
  const value = useMemo<RouterContextValue>(
    () => ({ isNative: false, navigate, useHref: useHref ?? nativeRouter.useHref }),
    [navigate, useHref],
  );
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouterContext() {
  return useContext(RouterContext);
}

export interface LinkModifiers {
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

export function shouldClientNavigate(link: HTMLAnchorElement, modifiers: LinkModifiers) {
  const target = link.getAttribute('target');
  const url = new URL(link.href, link.ownerDocument.baseURI);
  return (
    (!target || target === '_self') &&
    url.origin === link.ownerDocument.location.origin &&
    !link.hasAttribute('download') &&
    !modifiers.metaKey &&
    !modifiers.ctrlKey &&
    !modifiers.altKey &&
    !modifiers.shiftKey
  );
}
