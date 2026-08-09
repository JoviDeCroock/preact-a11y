import type { JSX, RefObject, TargetedKeyboardEvent } from 'preact';
import { useEffect } from 'preact/hooks';

const overlayStack: Element[] = [];

export interface AriaOverlayProps {
  isOpen?: boolean;
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  onClose?: () => void;
}

function isTopmostOverlay(element: Element): boolean {
  return overlayStack.at(-1) === element;
}

export function useOverlay(props: AriaOverlayProps, ref: RefObject<Element>) {
  const {
    isOpen = true,
    isDismissable = false,
    isKeyboardDismissDisabled = false,
    shouldCloseOnInteractOutside,
    onClose,
  } = props;

  useEffect(() => {
    const overlay = ref.current;
    if (!isOpen || !overlay) return;

    overlayStack.push(overlay);

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (
        !isDismissable ||
        !(target instanceof Element) ||
        overlay!.contains(target) ||
        !isTopmostOverlay(overlay!) ||
        shouldCloseOnInteractOutside?.(target) === false
      ) {
        return;
      }

      onClose?.();
    }

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      const index = overlayStack.lastIndexOf(overlay);
      if (index >= 0) overlayStack.splice(index, 1);
    };
  }, [isDismissable, isOpen, onClose, ref, shouldCloseOnInteractOutside]);

  return {
    overlayProps: {
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        if (
          event.key !== 'Escape' ||
          isKeyboardDismissDisabled ||
          !ref.current ||
          !isTopmostOverlay(ref.current)
        ) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        onClose?.();
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
