import type { RefObject } from 'preact';
import type { JSX, TargetedFocusEvent, TargetedPointerEvent } from '../preactTypes';
import { useEffect, useRef, useState } from 'preact/hooks';

export interface AriaToastRegionProps {
  toastIds: readonly string[];
  'aria-label'?: string;
}

export function useToastRegion(props: AriaToastRegionProps, ref: RefObject<HTMLElement>) {
  const [isHovered, setHovered] = useState(false);
  const [isFocusWithin, setFocusWithin] = useState(false);
  const previousIds = useRef(props.toastIds);
  const focusedId = useRef<string | null>(null);
  const restoreTarget = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const oldIds = previousIds.current;
    const removedIndex = focusedId.current ? oldIds.indexOf(focusedId.current) : -1;
    if (removedIndex >= 0 && !props.toastIds.includes(focusedId.current!)) {
      const nextId = props.toastIds[removedIndex] ?? props.toastIds.at(-1);
      const next = nextId
        ? Array.from(ref.current?.querySelectorAll<HTMLElement>('[data-toast-id]') ?? []).find(
            (element) => element.dataset.toastId === nextId,
          )
        : null;
      if (next) {
        next.focus();
        focusedId.current = nextId!;
      } else if (restoreTarget.current?.isConnected) {
        restoreTarget.current.focus();
        restoreTarget.current = null;
        focusedId.current = null;
      }
    }
    previousIds.current = props.toastIds;
  }, [props.toastIds, ref]);

  useEffect(
    () => () => {
      if (restoreTarget.current?.isConnected) restoreTarget.current.focus();
    },
    [],
  );

  return {
    regionProps: {
      role: 'region',
      tabIndex: -1,
      'aria-label': props['aria-label'] ?? `Notifications (${props.toastIds.length})`,
      'data-preact-aria-top-layer': true,
      onpointerenter(event: TargetedPointerEvent<HTMLElement>) {
        if (event.pointerType !== 'touch') setHovered(true);
      },
      onpointerleave(event: TargetedPointerEvent<HTMLElement>) {
        if (event.pointerType !== 'touch') setHovered(false);
      },
      onfocusin(event: TargetedFocusEvent<HTMLElement>) {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          restoreTarget.current = event.relatedTarget as HTMLElement | null;
        }
        setFocusWithin(true);
        focusedId.current =
          (event.target as HTMLElement).closest<HTMLElement>('[data-toast-id]')?.dataset.toastId ??
          null;
      },
      onfocusout(event: TargetedFocusEvent<HTMLElement>) {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setFocusWithin(false);
        const next = event.relatedTarget as HTMLElement | null;
        if (next && next !== document.body && next !== document.documentElement) {
          focusedId.current = null;
          restoreTarget.current = null;
        }
      },
    } as JSX.HTMLAttributes<HTMLElement> & { 'data-preact-aria-top-layer': true },
    isPaused: isHovered || isFocusWithin,
  };
}
