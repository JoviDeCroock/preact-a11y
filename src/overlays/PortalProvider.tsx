import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';

export interface PortalProviderContextValue {
  getContainer?: () => HTMLElement | null;
}

export interface PortalProviderProps {
  /** Pass null to clear an inherited portal container. */
  getContainer?: (() => HTMLElement | null) | null;
  children: ComponentChildren;
}

const PortalContext = createContext<PortalProviderContextValue>({});

/** Sets the default portal target for nested overlays. */
export function UNSAFE_PortalProvider({ getContainer, children }: PortalProviderProps) {
  const parent = useUNSAFE_PortalContext();
  return (
    <PortalContext.Provider
      value={{
        getContainer: getContainer === null ? undefined : (getContainer ?? parent.getContainer),
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function useUNSAFE_PortalContext(): PortalProviderContextValue {
  return useContext(PortalContext);
}
