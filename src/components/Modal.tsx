import type { ComponentChildren, Ref } from 'preact';
import type { JSX } from '../preactTypes';
import { useEffect, useRef } from 'preact/hooks';
import { ariaHideOutside } from '../overlays/ariaHideOutside';
import { DismissButton } from '../overlays/DismissButton';
import { FocusScope } from '../overlays/FocusScope';
import { useModal, type AriaModalProps } from '../overlays/useModal';
import { useOverlay, type AriaOverlayProps } from '../overlays/useOverlay';
import { usePreventScroll } from '../overlays/usePreventScroll';
import { mergeRefs } from '../utils/mergeRefs';

export interface ModalProps
  extends
    AriaModalProps,
    AriaOverlayProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof AriaModalProps | keyof AriaOverlayProps> {
  children: ComponentChildren;
  elementRef?: Ref<HTMLDivElement>;
  shouldPreventScroll?: boolean;
}

export function Modal({
  children,
  elementRef,
  isOpen = true,
  isDismissable = false,
  isKeyboardDismissDisabled,
  shouldCloseOnInteractOutside,
  shouldPreventScroll = true,
  onClose,
  role,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  ...domProps
}: ModalProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const { overlayProps } = useOverlay(
    {
      isOpen,
      isDismissable,
      isKeyboardDismissDisabled,
      shouldCloseOnInteractOutside,
      onClose,
    },
    localRef,
  );
  const { modalProps } = useModal({
    role,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
  });
  usePreventScroll({ isDisabled: !isOpen || !shouldPreventScroll });
  useEffect(() => {
    if (!isOpen || !localRef.current) return;
    return ariaHideOutside([localRef.current]);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <FocusScope autoFocus contain restoreFocus>
      <div {...domProps} {...overlayProps} {...modalProps} ref={mergeRefs(localRef, elementRef)}>
        {children}
        {isDismissable && <DismissButton label="Dismiss dialog" onDismiss={() => onClose?.()} />}
      </div>
    </FocusScope>
  );
}
