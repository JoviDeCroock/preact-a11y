import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';

export interface SSRProviderProps {
  children: ComponentChildren;
}

export function SSRProvider({ children }: SSRProviderProps) {
  return <>{children}</>;
}

export function useIsSSR(): boolean {
  const [isSSR, setSSR] = useState(true);
  useEffect(() => setSSR(false), []);
  return isSSR;
}
