import type { JSX, RefObject, TargetedKeyboardEvent, TargetedPointerEvent } from '../preactTypes';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useId } from '../utils/useId';

export interface AriaTooltipTriggerProps {
  id?: string;
  isOpen?: boolean;
  defaultOpen?: boolean;
  isDisabled?: boolean;
  delay?: number;
  closeDelay?: number;
  trigger?: 'focus' | 'all';
  onOpenChange?: (isOpen: boolean) => void;
}

export function useTooltipTrigger(props: AriaTooltipTriggerProps = {}, _ref?: RefObject<Element>) {
  const tooltipId = useId(props.id);
  const [uncontrolled, setUncontrolled] = useState(props.defaultOpen ?? false);
  const isOpen = props.isOpen ?? uncontrolled;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointerDown = useRef(false);

  function clearTimer() {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  }

  function setOpen(next: boolean) {
    clearTimer();
    if ((props.isDisabled && next) || next === isOpen) return;
    if (props.isOpen === undefined) setUncontrolled(next);
    props.onOpenChange?.(next);
  }

  function schedule(next: boolean, delay: number) {
    clearTimer();
    if (delay <= 0) setOpen(next);
    else timer.current = setTimeout(() => setOpen(next), delay);
  }

  useEffect(() => clearTimer, []);

  return {
    triggerProps: {
      'aria-describedby': isOpen ? tooltipId : undefined,
      onpointerenter(event: TargetedPointerEvent<HTMLElement>) {
        if (props.trigger === 'focus' || event.pointerType === 'touch') return;
        schedule(true, props.delay ?? 1500);
      },
      onpointerleave(event: TargetedPointerEvent<HTMLElement>) {
        if (props.trigger === 'focus' || event.pointerType === 'touch') return;
        schedule(false, props.closeDelay ?? 500);
      },
      onPointerDown() {
        pointerDown.current = true;
        setOpen(false);
      },
      onPointerUp() {
        pointerDown.current = false;
      },
      onPointerCancel() {
        pointerDown.current = false;
      },
      onFocus() {
        if (!pointerDown.current) setOpen(true);
      },
      onBlur() {
        setOpen(false);
      },
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        if (event.key === 'Escape') setOpen(false);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    tooltipHoverProps: {
      onpointerenter(event: TargetedPointerEvent<HTMLElement>) {
        if (event.pointerType !== 'touch') clearTimer();
      },
      onpointerleave(event: TargetedPointerEvent<HTMLElement>) {
        if (event.pointerType !== 'touch') schedule(false, props.closeDelay ?? 500);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    tooltipId,
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
  };
}
