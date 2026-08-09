import type { JSX, TargetedPointerEvent } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { PointerType } from '../types';

export interface LongPressEvent {
  type: 'longpressstart' | 'longpress' | 'longpressend';
  pointerType: PointerType;
  target: Element;
}

export interface LongPressProps {
  isDisabled?: boolean;
  threshold?: number;
  onLongPressStart?: (event: LongPressEvent) => void;
  onLongPress?: (event: LongPressEvent) => void;
  onLongPressEnd?: (event: LongPressEvent) => void;
}

export function useLongPress(props: LongPressProps = {}) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const active = useRef<{
    id: number;
    x: number;
    y: number;
    target: Element;
    pointerType: PointerType;
  }>();
  const triggered = useRef(false);

  function clear() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
  }

  function finish() {
    clear();
    const interaction = active.current;
    active.current = undefined;
    if (interaction) {
      props.onLongPressEnd?.({
        type: 'longpressend',
        target: interaction.target,
        pointerType: interaction.pointerType,
      });
    }
  }

  useEffect(() => clear, []);

  return {
    longPressProps: {
      onPointerDown(event: TargetedPointerEvent<HTMLElement>) {
        if (props.isDisabled || event.button !== 0 || active.current) return;
        const pointerType = event.pointerType as PointerType;
        active.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          target: event.currentTarget,
          pointerType,
        };
        triggered.current = false;
        props.onLongPressStart?.({
          type: 'longpressstart',
          target: event.currentTarget,
          pointerType,
        });
        timer.current = setTimeout(() => {
          const interaction = active.current;
          if (!interaction) return;
          triggered.current = true;
          props.onLongPress?.({
            type: 'longpress',
            target: interaction.target,
            pointerType: interaction.pointerType,
          });
        }, props.threshold ?? 500);
      },
      onPointerMove(event: TargetedPointerEvent<HTMLElement>) {
        const interaction = active.current;
        if (
          !interaction ||
          interaction.id !== event.pointerId ||
          Math.hypot(event.clientX - interaction.x, event.clientY - interaction.y) <= 10
        ) {
          return;
        }
        finish();
      },
      onPointerUp(event: TargetedPointerEvent<HTMLElement>) {
        if (active.current?.id === event.pointerId) finish();
      },
      onPointerCancel(event: TargetedPointerEvent<HTMLElement>) {
        if (active.current?.id === event.pointerId) finish();
      },
      onContextMenu(event) {
        if (triggered.current) event.preventDefault();
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
