import type { JSX } from '../preactTypes';
import type { CollectionKey } from '../collections/delegates';
import { finishCollectionSession, startCollectionSession } from './collectionSession';
import { useDrag } from './useDrag';
import type { DraggableCollectionState } from './useDraggableCollection';

export interface DraggableItemProps {
  key: CollectionKey;
  hasDragButton?: boolean;
  hasAction?: boolean;
}

export interface DraggableItemResult {
  dragProps: Omit<JSX.HTMLAttributes<HTMLElement>, 'ref'>;
  dragButtonProps: JSX.ButtonHTMLAttributes<HTMLButtonElement>;
  isDragging: boolean;
}

/** Connects an item key to a consumer-owned draggable collection state. */
export function useDraggableItem(
  props: DraggableItemProps,
  state: DraggableCollectionState,
): DraggableItemResult {
  const keysForDrag = () => state.getKeysForDrag(props.key);
  const allowedOperations = () =>
    state.getAllowedDropOperations?.() ?? (['copy', 'move', 'link'] as const);
  const drag = useDrag({
    isDisabled: state.isDisabled,
    hasDragButton: props.hasDragButton,
    preview: state.preview,
    getItems: () => state.getItems(props.key),
    getAllowedDropOperations: () => [...allowedOperations()],
    onDragStart(event) {
      const keys = keysForDrag();
      startCollectionSession(state.collection ?? state, keys, state.getItems(props.key), [
        ...allowedOperations(),
      ]);
      state.startDrag(props.key, { ...event, keys });
    },
    onDragMove(event) {
      state.moveDrag({ ...event, keys: keysForDrag() });
    },
    onDragEnd(event) {
      const session = finishCollectionSession();
      state.endDrag({
        ...event,
        keys: session?.keys ?? keysForDrag(),
        isInternal: session?.isInternal ?? false,
      });
    },
  });

  const dragProps = { ...drag.dragProps };
  if (props.hasAction && !props.hasDragButton) {
    const onKeyDown = dragProps.onKeyDown;
    dragProps.onKeyDown = (event) => {
      if (event.altKey) onKeyDown?.(event);
    };
  }

  return { ...drag, dragProps };
}
