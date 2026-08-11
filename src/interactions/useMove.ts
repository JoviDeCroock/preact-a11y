import type { JSX, TargetedKeyboardEvent, TargetedPointerEvent } from '../preactTypes';
import { useRef } from 'preact/hooks';
import type { PointerType } from '../types';

export interface MoveEvent {
  type: 'movestart' | 'move' | 'moveend';
  pointerType: PointerType;
  target: Element;
  deltaX: number;
  deltaY: number;
}

export interface MoveProps {
  isDisabled?: boolean;
  onMoveStart?: (event: MoveEvent) => void;
  onMove?: (event: MoveEvent) => void;
  onMoveEnd?: (event: MoveEvent) => void;
}

function moveEvent(
  type: MoveEvent['type'],
  target: Element,
  pointerType: PointerType,
  deltaX = 0,
  deltaY = 0,
): MoveEvent {
  return { type, target, pointerType, deltaX, deltaY };
}

export function useMove(props: MoveProps = {}) {
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);

  function endPointer(event: TargetedPointerEvent<HTMLElement>) {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    props.onMoveEnd?.(moveEvent('moveend', event.currentTarget, event.pointerType as PointerType));
  }

  return {
    moveProps: {
      onPointerDown(event: TargetedPointerEvent<HTMLElement>) {
        if (props.isDisabled || event.button !== 0 || pointer.current) return;
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture?.(event.pointerId);
        props.onMoveStart?.(
          moveEvent('movestart', event.currentTarget, event.pointerType as PointerType),
        );
      },
      onPointerMove(event: TargetedPointerEvent<HTMLElement>) {
        const previous = pointer.current;
        if (!previous || previous.id !== event.pointerId) return;
        const deltaX = event.clientX - previous.x;
        const deltaY = event.clientY - previous.y;
        pointer.current = { id: previous.id, x: event.clientX, y: event.clientY };
        if (deltaX || deltaY) {
          props.onMove?.(
            moveEvent(
              'move',
              event.currentTarget,
              event.pointerType as PointerType,
              deltaX,
              deltaY,
            ),
          );
        }
      },
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        if (props.isDisabled) return;
        const distance = event.shiftKey ? 10 : 1;
        const deltas: Record<string, [number, number]> = {
          ArrowLeft: [-distance, 0],
          ArrowRight: [distance, 0],
          ArrowUp: [0, -distance],
          ArrowDown: [0, distance],
        };
        const delta = deltas[event.key];
        if (!delta) return;
        event.preventDefault();
        props.onMoveStart?.(moveEvent('movestart', event.currentTarget, 'keyboard'));
        props.onMove?.(moveEvent('move', event.currentTarget, 'keyboard', delta[0], delta[1]));
        props.onMoveEnd?.(moveEvent('moveend', event.currentTarget, 'keyboard'));
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
