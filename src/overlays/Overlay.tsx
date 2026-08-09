import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useContext, useEffect, useMemo, useState } from 'preact/hooks';
import { FocusScope } from './FocusScope';
import { Portal } from './Portal';
import { useUNSAFE_PortalContext } from './PortalProvider';

export interface OverlayProps {
  portalContainer?: Element;
  children: ComponentChildren;
  disableFocusManagement?: boolean;
  shouldContainFocus?: boolean;
  isExiting?: boolean;
}

interface OverlayContextValue {
  addContain(): void;
  removeContain(): void;
}

const OverlayContext = createContext<OverlayContextValue | undefined>(undefined);

/** Renders an overlay into a Preact-native portal with optional focus containment/restoration. */
export function Overlay(props: OverlayProps) {
  const [containCount, setContainCount] = useState(0);
  const portal = useUNSAFE_PortalContext();
  const portalContainer =
    props.portalContainer ??
    portal.getContainer?.() ??
    (typeof document === 'undefined' ? undefined : document.body);
  const context = useMemo<OverlayContextValue>(
    () => ({
      addContain: () => setContainCount((count) => count + 1),
      removeContain: () => setContainCount((count) => Math.max(0, count - 1)),
    }),
    [],
  );

  if (!portalContainer) return null;
  const contain = (props.shouldContainFocus || containCount > 0) && !props.isExiting;
  const contents = props.disableFocusManagement ? (
    props.children
  ) : (
    <FocusScope contain={contain} restoreFocus>
      {props.children}
    </FocusScope>
  );

  return (
    <Portal container={portalContainer}>
      <OverlayContext.Provider value={context}>{contents}</OverlayContext.Provider>
    </Portal>
  );
}

/** Requests focus containment from the nearest Overlay. */
export function useOverlayFocusContain() {
  const context = useContext(OverlayContext);
  useEffect(() => {
    context?.addContain();
    return () => context?.removeContain();
  }, [context]);
}
