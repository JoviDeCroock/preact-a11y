import type {
  JSX,
  RefObject,
  TargetedFocusEvent,
  TargetedKeyboardEvent,
  TargetedPointerEvent,
} from '../preactTypes';
import { useEffect, useRef } from 'preact/hooks';
import { useLongPress } from '../interactions/useLongPress';
import { mergeProps } from '../utils/mergeProps';
import { useId } from '../utils/useId';

export interface PreviewTriggerState {
  isOpen: boolean;
  open(immediate?: boolean): void;
  close(immediate?: boolean): void;
}

export interface AriaPreviewTriggerProps {
  triggerRef: RefObject<HTMLElement>;
  popoverRef: RefObject<HTMLElement>;
  id?: string;
  isDisabled?: boolean;
  delay?: number;
  closeDelay?: number;
  longPressDelay?: number;
  'aria-description'?: string;
}

export interface PreviewTriggerAria {
  triggerProps: JSX.HTMLAttributes<HTMLElement>;
  popoverProps: JSX.HTMLAttributes<HTMLElement> & { isNonModal: true };
}

const TABBABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function usePreviewTrigger(
  props: AriaPreviewTriggerProps,
  state: PreviewTriggerState,
): PreviewTriggerAria {
  const {
    closeDelay = 250,
    delay = 500,
    isDisabled,
    longPressDelay = 500,
    popoverRef,
    triggerRef,
  } = props;
  const popoverId = useId(props.id);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointerInside = useRef(false);
  const longPressed = useRef(false);

  function clearTimer() {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  }

  function scheduleOpen(immediate = false) {
    clearTimer();
    if (isDisabled) return;
    if (immediate || delay <= 0) state.open(true);
    else timer.current = setTimeout(() => state.open(), delay);
  }

  function containsFocus(): boolean {
    const active = triggerRef.current?.ownerDocument.activeElement;
    return !!(
      active &&
      (triggerRef.current?.contains(active) || popoverRef.current?.contains(active))
    );
  }

  function scheduleClose(immediate = false) {
    clearTimer();
    if (pointerInside.current || containsFocus()) return;
    if (immediate || closeDelay <= 0) state.close(true);
    else timer.current = setTimeout(() => state.close(), closeDelay);
  }

  useEffect(() => clearTimer, []);

  const { longPressProps } = useLongPress({
    isDisabled,
    threshold: longPressDelay,
    onLongPress() {
      longPressed.current = true;
      scheduleOpen(true);
      queueMicrotask(() => popoverRef.current?.focus());
    },
    onLongPressEnd() {
      queueMicrotask(() => {
        longPressed.current = false;
      });
    },
  });

  const interactionProps: JSX.HTMLAttributes<HTMLElement> = {
    'aria-haspopup': 'dialog',
    'aria-expanded': state.isOpen,
    'aria-controls': state.isOpen ? popoverId : undefined,
    'aria-describedby': state.isOpen ? popoverId : undefined,
    'aria-description': props['aria-description'],
    style: { WebkitTouchCallout: 'none', WebkitUserDrag: 'none' },
    onpointerenter(event: TargetedPointerEvent<HTMLElement>) {
      if (event.pointerType === 'touch') return;
      pointerInside.current = true;
      scheduleOpen();
    },
    onpointerleave(event: TargetedPointerEvent<HTMLElement>) {
      if (event.pointerType === 'touch') return;
      pointerInside.current = false;
      scheduleClose();
    },
    onFocus(event: TargetedFocusEvent<HTMLElement>) {
      if (longPressed.current && event.relatedTarget === popoverRef.current) {
        popoverRef.current?.focus();
        return;
      }
      scheduleOpen();
    },
    onBlur() {
      queueMicrotask(() => scheduleClose());
    },
    onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
      if (event.key === 'Escape') {
        event.preventDefault();
        clearTimer();
        state.close(true);
        triggerRef.current?.focus();
      } else if (event.key === 'Tab' && !event.shiftKey && state.isOpen) {
        const first = popoverRef.current?.querySelector<HTMLElement>(TABBABLE);
        if (first) {
          event.preventDefault();
          first.focus();
        }
      }
    },
  };

  return {
    triggerProps: mergeProps(
      interactionProps as Record<string, unknown>,
      longPressProps as Record<string, unknown>,
    ) as JSX.HTMLAttributes<HTMLElement>,
    popoverProps: {
      id: popoverId,
      role: 'dialog' as const,
      tabIndex: -1,
      isNonModal: true,
      onpointerenter(event: TargetedPointerEvent<HTMLElement>) {
        if (event.pointerType === 'touch') return;
        pointerInside.current = true;
        clearTimer();
        state.open(true);
      },
      onpointerleave(event: TargetedPointerEvent<HTMLElement>) {
        if (event.pointerType === 'touch') return;
        pointerInside.current = false;
        scheduleClose();
      },
      onFocus() {
        clearTimer();
        state.open(true);
      },
      onBlur() {
        queueMicrotask(() => scheduleClose());
      },
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        clearTimer();
        state.close(true);
        triggerRef.current?.focus();
      },
    },
  };
}
