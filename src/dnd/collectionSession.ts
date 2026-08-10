import type { CollectionKey } from '../collections/delegates';
import { getDragTypes } from './dataTransfer';
import { DragTypes, type DragItem, type DropOperation } from './types';

export interface CollectionDragSession {
  source: object;
  keys: Set<CollectionKey>;
  items: DragItem[];
  types: DragTypes;
  allowedOperations: DropOperation[];
  isInternal: boolean;
}

let session: CollectionDragSession | undefined;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function startCollectionSession(
  source: object,
  keys: Set<CollectionKey>,
  items: DragItem[],
  allowedOperations: DropOperation[],
) {
  session = {
    source,
    keys,
    items,
    types: new DragTypes(getDragTypes(items)),
    allowedOperations,
    isInternal: false,
  };
  emit();
}

export function getCollectionSession() {
  return session;
}

export function markCollectionDrop(target: object) {
  if (session) session.isInternal = session.source === target;
}

export function finishCollectionSession() {
  const result = session;
  session = undefined;
  emit();
  return result;
}

export function subscribeCollectionSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
