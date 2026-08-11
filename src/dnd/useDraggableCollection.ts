import type { RefObject } from 'preact';
import type { JSX } from '../preactTypes';
import { useEffect } from 'preact/hooks';
import type { CollectionKey } from '../collections/delegates';
import type { DragPreviewRenderer } from './useDrag';
import type { DragEndEvent, DragItem, DragMoveEvent, DragStartEvent, DropOperation } from './types';

export interface DraggableCollectionStartEvent extends DragStartEvent {
  keys: Set<CollectionKey>;
}

export interface DraggableCollectionMoveEvent extends DragMoveEvent {
  keys: Set<CollectionKey>;
}

export interface DraggableCollectionEndEvent extends DragEndEvent {
  keys: Set<CollectionKey>;
  isInternal: boolean;
}

export interface DraggableCollectionState {
  collection?: object;
  draggedKey: CollectionKey | null;
  draggingKeys: Set<CollectionKey>;
  isDisabled?: boolean;
  isDragging(key: CollectionKey): boolean;
  getKeysForDrag(key: CollectionKey): Set<CollectionKey>;
  getItems(key: CollectionKey): DragItem[];
  preview?: RefObject<DragPreviewRenderer>;
  getAllowedDropOperations?: () => DropOperation[];
  startDrag(key: CollectionKey, event: DraggableCollectionStartEvent): void;
  moveDrag(event: DraggableCollectionMoveEvent): void;
  endDrag(event: DraggableCollectionEndEvent): void;
}

export interface DraggableCollectionOptions {
  onKeyDown?: JSX.KeyboardEventHandler<HTMLElement>;
}

const collectionRefs = new WeakMap<DraggableCollectionState, RefObject<HTMLElement>>();

export function getDraggableCollectionRef(state: DraggableCollectionState) {
  return collectionRefs.get(state);
}

/** Registers collection-level cleanup while item hooks provide the drag affordances. */
export function useDraggableCollection(
  _props: DraggableCollectionOptions,
  state: DraggableCollectionState,
  ref: RefObject<HTMLElement>,
): void {
  collectionRefs.set(state, ref);
  useEffect(
    () => () => {
      collectionRefs.delete(state);
    },
    [state],
  );
}
