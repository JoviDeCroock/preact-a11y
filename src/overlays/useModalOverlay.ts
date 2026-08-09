import type { JSX, RefObject } from 'preact';
import { useEffect } from 'preact/hooks';
import { mergeProps } from '../utils/mergeProps';
import { ariaHideOutside } from './ariaHideOutside';
import { useModal } from './useModal';
import { useOverlay } from './useOverlay';
import { usePreventScroll } from './usePreventScroll';

export interface AriaModalOverlayProps {
  isOpen: boolean;
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  shouldPreventScroll?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  role?: 'dialog' | 'alertdialog';
  onClose: () => void;
}

export function useModalOverlay(props: AriaModalOverlayProps, ref: RefObject<HTMLElement>) {
  const overlay = useOverlay(props, ref);
  const modal = useModal(props);
  usePreventScroll({ isDisabled: !props.isOpen || props.shouldPreventScroll === false });
  useEffect(() => {
    if (!props.isOpen || !ref.current) return;
    return ariaHideOutside([ref.current]);
  }, [props.isOpen, ref]);

  return {
    modalProps: mergeProps(
      overlay.overlayProps as Record<string, unknown>,
      modal.modalProps as Record<string, unknown>,
    ) as JSX.HTMLAttributes<HTMLElement>,
    underlayProps: {
      style: { position: 'fixed', inset: 0 },
      'data-preact-aria-underlay': true,
    } as JSX.HTMLAttributes<HTMLElement>,
  };
}
