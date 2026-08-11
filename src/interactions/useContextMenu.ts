import type { JSX, TargetedKeyboardEvent, TargetedMouseEvent } from '../preactTypes';

export interface ContextMenuEvent {
  pointerType: 'keyboard' | 'mouse';
  target: Element;
  x: number;
  y: number;
}

export interface ContextMenuProps {
  isDisabled?: boolean;
  onContextMenu?: (event: ContextMenuEvent) => void;
}

export function useContextMenu(props: ContextMenuProps = {}) {
  return {
    contextMenuProps: {
      onContextMenu(event: TargetedMouseEvent<HTMLElement>) {
        if (props.isDisabled) return;
        event.preventDefault();
        props.onContextMenu?.({
          pointerType: 'mouse',
          target: event.currentTarget,
          x: event.clientX,
          y: event.clientY,
        });
      },
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        if (
          props.isDisabled ||
          (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey))
        ) {
          return;
        }
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        props.onContextMenu?.({
          pointerType: 'keyboard',
          target: event.currentTarget,
          x: rect.left,
          y: rect.bottom,
        });
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
