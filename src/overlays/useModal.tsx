import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import type { JSX } from '../preactTypes';
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks';
import { Portal } from './Portal';
import { useUNSAFE_PortalContext } from './PortalProvider';

interface ModalContextValue {
  parent?: ModalContextValue;
  modalCount: number;
  addModal(): void;
  removeModal(): void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export interface ModalProviderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: ComponentChildren;
}

/** Tracks nested modal visibility through Preact context, including across portals. */
export function ModalProvider({ children }: ModalProviderProps) {
  const parent = useContext(ModalContext);
  const parentAddModal = parent?.addModal;
  const parentRemoveModal = parent?.removeModal;
  const [modalCount, setModalCount] = useState(0);
  const addModal = useCallback(() => {
    setModalCount((count) => count + 1);
    parentAddModal?.();
  }, [parentAddModal]);
  const removeModal = useCallback(() => {
    setModalCount((count) => Math.max(0, count - 1));
    parentRemoveModal?.();
  }, [parentRemoveModal]);
  const value = useMemo(
    () => ({ parent, modalCount, addModal, removeModal }),
    [addModal, modalCount, parent, removeModal],
  );
  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export interface ModalProviderAria {
  modalProviderProps: Pick<JSX.HTMLAttributes<HTMLElement>, 'aria-hidden'>;
}

export function useModalProvider(): ModalProviderAria {
  const context = useContext(ModalContext);
  return {
    modalProviderProps: { 'aria-hidden': context && context.modalCount > 0 ? true : undefined },
  };
}

function OverlayContainerDOM(props: ModalProviderProps) {
  const { modalProviderProps } = useModalProvider();
  return <div data-overlay-container {...props} {...modalProviderProps} />;
}

/** Provides a top-level application container that is hidden while a nested modal is active. */
export function OverlayProvider(props: ModalProviderProps) {
  return (
    <ModalProvider>
      <OverlayContainerDOM {...props} />
    </ModalProvider>
  );
}

export interface OverlayContainerProps extends ModalProviderProps {
  portalContainer?: Element;
}

/** Portals a nested overlay provider to the configured target. */
export function OverlayContainer({
  portalContainer: explicitContainer,
  ...props
}: OverlayContainerProps) {
  const portal = useUNSAFE_PortalContext();
  const portalContainer =
    explicitContainer ??
    portal.getContainer?.() ??
    (typeof document === 'undefined' ? undefined : document.body);
  useEffect(() => {
    if (portalContainer?.closest('[data-overlay-container]')) {
      throw new Error('An OverlayContainer must not be inside another overlay container.');
    }
  }, [portalContainer]);
  if (!portalContainer) return null;
  return (
    <Portal container={portalContainer}>
      <OverlayProvider {...props} />
    </Portal>
  );
}

export interface AriaModalProps {
  role?: 'alertdialog' | 'dialog';
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  isDisabled?: boolean;
}

export function useModal(props: AriaModalProps = {}) {
  const context = useContext(ModalContext);
  const addModal = context?.parent?.addModal;
  const removeModal = context?.parent?.removeModal;
  useEffect(() => {
    if (props.isDisabled || !addModal) return;
    addModal();
    return () => removeModal?.();
  }, [addModal, props.isDisabled, removeModal]);

  return {
    modalProps: {
      role: props.role ?? 'dialog',
      'aria-modal': props.isDisabled ? undefined : true,
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'],
      'aria-describedby': props['aria-describedby'],
      'data-ismodal': props.isDisabled ? undefined : true,
    } satisfies JSX.HTMLAttributes<HTMLElement> & { 'data-ismodal'?: boolean },
  };
}
