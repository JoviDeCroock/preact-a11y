import type { JSX, RefObject, TargetedKeyboardEvent, TargetedPointerEvent } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { useLocale } from '../i18n/I18nProvider';
import { useId } from '../utils/useId';

export type SubmenuFocusStrategy = 'first' | 'last';

/** Minimal controlled state contract; no state-management package is required. */
export interface SubmenuTriggerState {
  isOpen: boolean;
  focusStrategy?: SubmenuFocusStrategy | null;
  submenuLevel?: number;
  open(strategy?: SubmenuFocusStrategy): void;
  close(): void;
  closeAll?(): void;
}

export interface AriaSubmenuTriggerProps {
  parentMenuRef: RefObject<HTMLElement>;
  submenuRef: RefObject<HTMLElement>;
  isDisabled?: boolean;
  type?: 'dialog' | 'menu';
  delay?: number;
  shouldUseVirtualFocus?: boolean;
  triggerId?: string;
  submenuId?: string;
}

export interface SubmenuTriggerAria {
  submenuTriggerProps: JSX.HTMLAttributes<HTMLElement>;
  submenuProps: Omit<JSX.HTMLAttributes<HTMLElement>, 'autoFocus'> & {
    autoFocus?: SubmenuFocusStrategy;
    submenuLevel: number;
  };
  popoverProps: {
    disableFocusManagement: true;
    isNonModal: true;
    shouldCloseOnInteractOutside(target: Element): boolean;
  };
}

export function useSubmenuTrigger(
  props: AriaSubmenuTriggerProps,
  state: SubmenuTriggerState,
  ref: RefObject<HTMLElement>,
): SubmenuTriggerAria {
  const {
    delay = 200,
    isDisabled,
    parentMenuRef,
    shouldUseVirtualFocus,
    submenuRef,
    type = 'menu',
  } = props;
  const triggerId = useId(props.triggerId);
  const submenuId = useId(props.submenuId);
  const { direction } = useLocale();
  const openTimer = useRef<ReturnType<typeof setTimeout>>();

  function cancelOpen() {
    if (openTimer.current !== undefined) clearTimeout(openTimer.current);
    openTimer.current = undefined;
  }

  function open(strategy?: SubmenuFocusStrategy) {
    if (isDisabled) return;
    cancelOpen();
    state.open(strategy);
    if (!shouldUseVirtualFocus && type === 'menu') {
      queueMicrotask(() => submenuRef.current?.focus());
    }
  }

  function close(restoreFocus = false) {
    cancelOpen();
    state.close();
    if (restoreFocus && !shouldUseVirtualFocus) queueMicrotask(() => ref.current?.focus());
  }

  useEffect(() => {
    const parentMenu = parentMenuRef.current;
    function onFocusIn(event: FocusEvent) {
      if (
        state.isOpen &&
        event.target instanceof Node &&
        parentMenu?.contains(event.target) &&
        event.target !== ref.current
      ) {
        close();
      }
    }
    parentMenu?.addEventListener('focusin', onFocusIn);
    return () => {
      cancelOpen();
      parentMenu?.removeEventListener('focusin', onFocusIn);
    };
  }, [parentMenuRef, ref, state.isOpen]);

  const openKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const closeKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';

  return {
    submenuTriggerProps: {
      id: triggerId,
      'aria-controls': state.isOpen ? submenuId : undefined,
      'aria-expanded': state.isOpen,
      'aria-haspopup': isDisabled ? undefined : type,
      'aria-disabled': isDisabled || undefined,
      onClick() {
        if (isDisabled) return;
        if (state.isOpen) close();
        else open();
      },
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        if (isDisabled || event.key !== openKey) return;
        event.preventDefault();
        event.stopPropagation();
        open('first');
      },
      onPointerEnter(event: TargetedPointerEvent<HTMLElement>) {
        if (isDisabled || event.pointerType === 'touch' || state.isOpen) return;
        cancelOpen();
        openTimer.current = setTimeout(() => open(), delay);
      },
      onPointerLeave(event: TargetedPointerEvent<HTMLElement>) {
        if (event.pointerType !== 'touch') cancelOpen();
      },
    },
    submenuProps: {
      id: submenuId,
      'aria-labelledby': triggerId,
      autoFocus: state.focusStrategy ?? undefined,
      submenuLevel: state.submenuLevel ?? 1,
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        if (event.key !== closeKey && event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        close(true);
      },
    },
    popoverProps: {
      disableFocusManagement: true,
      isNonModal: true,
      shouldCloseOnInteractOutside(target: Element) {
        return target !== ref.current;
      },
    },
  };
}
