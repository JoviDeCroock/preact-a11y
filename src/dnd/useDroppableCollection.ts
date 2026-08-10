import type { JSX, RefObject, TargetedKeyboardEvent } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { CollectionKey, DropTarget } from '../collections/delegates';
import { getCollectionSession, markCollectionDrop } from './collectionSession';
import { isKeyboardDragging } from './keyboardManager';
import {
  DIRECTORY_DRAG_TYPE,
  type DragTypes,
  type DropEvent,
  type DropItem,
  type DropOperation,
} from './types';
import { useDrop } from './useDrop';

export interface CollectionKeyboardDelegate {
  getKeyBelow?(key: CollectionKey): CollectionKey | null;
  getKeyAbove?(key: CollectionKey): CollectionKey | null;
  getKeyLeftOf?(key: CollectionKey): CollectionKey | null;
  getKeyRightOf?(key: CollectionKey): CollectionKey | null;
  getFirstKey?(): CollectionKey | null;
  getLastKey?(): CollectionKey | null;
}

export interface CollectionDropTargetDelegate {
  getDropTargetFromPoint(
    x: number,
    y: number,
    isValidDropTarget: (target: DropTarget) => boolean,
  ): DropTarget | null;
}

export interface CollectionDropOperationEvent {
  target: DropTarget;
  types: DragTypes;
  allowedOperations: DropOperation[];
  isInternal: boolean;
  draggingKeys: Set<CollectionKey>;
}

export interface DroppableCollectionState {
  collection?: object;
  target: DropTarget | null;
  isDisabled?: boolean;
  setTarget(target: DropTarget | null): void;
  isDropTarget(target: DropTarget | null): boolean;
  getDropOperation(event: CollectionDropOperationEvent): DropOperation;
}

export interface DroppableCollectionEventBase {
  target: DropTarget;
  x: number;
  y: number;
  dropOperation: DropOperation;
  types: DragTypes;
}

export interface DroppableCollectionDropEvent extends DropEvent {
  target: DropTarget;
}

export interface DroppableCollectionInsertDropEvent {
  items: DropItem[];
  dropOperation: DropOperation;
  target: DropTarget & { type: 'item' };
}

export interface DroppableCollectionRootDropEvent {
  items: DropItem[];
  dropOperation: DropOperation;
}

export interface DroppableCollectionItemDropEvent extends DroppableCollectionInsertDropEvent {
  isInternal: boolean;
}

export interface DroppableCollectionReorderEvent {
  keys: Set<CollectionKey>;
  dropOperation: DropOperation;
  target: DropTarget & { type: 'item' };
}

export interface DroppableCollectionOptions {
  keyboardDelegate: CollectionKeyboardDelegate;
  dropTargetDelegate: CollectionDropTargetDelegate;
  acceptedDragTypes?: 'all' | Array<string | typeof DIRECTORY_DRAG_TYPE>;
  onKeyDown?: (event: TargetedKeyboardEvent<HTMLElement>) => void;
  onDropEnter?: (event: DroppableCollectionEventBase) => void;
  onDropMove?: (event: DroppableCollectionEventBase) => void;
  onDropActivate?: (event: DroppableCollectionEventBase) => void;
  onDropExit?: (event: DroppableCollectionEventBase) => void;
  onDrop?: (event: DroppableCollectionDropEvent) => void;
  onInsert?: (event: DroppableCollectionInsertDropEvent) => void;
  onRootDrop?: (event: DroppableCollectionRootDropEvent) => void;
  onItemDrop?: (event: DroppableCollectionItemDropEvent) => void;
  onReorder?: (event: DroppableCollectionReorderEvent) => void;
  onMove?: (event: DroppableCollectionReorderEvent) => void;
  shouldAcceptItemDrop?: (target: DropTarget & { type: 'item' }, types: DragTypes) => boolean;
}

export interface DroppableCollectionResult {
  collectionProps: Omit<JSX.HTMLAttributes<HTMLElement>, 'ref'>;
}

export interface DroppableRegistration {
  options: DroppableCollectionOptions;
  state: DroppableCollectionState;
}

const registrations = new WeakMap<DroppableCollectionState, DroppableRegistration>();
const activeTargets = new WeakMap<DroppableCollectionState, DropTarget | null>();
const ROOT_TARGET: DropTarget = { type: 'root' };

export function getDroppableTarget(state: DroppableCollectionState) {
  return activeTargets.has(state) ? (activeTargets.get(state) ?? null) : state.target;
}

export function setDroppableTarget(state: DroppableCollectionState, target: DropTarget | null) {
  activeTargets.set(state, target);
  state.setTarget(target);
}

function token(state: DroppableCollectionState): object {
  return state.collection ?? state;
}

function details(
  state: DroppableCollectionState,
  target: DropTarget,
  types: DragTypes,
  allowed: DropOperation[],
) {
  const session = getCollectionSession();
  return {
    target,
    types,
    allowedOperations: allowed,
    isInternal: session?.source === token(state),
    draggingKeys: session?.keys ?? new Set<CollectionKey>(),
  };
}

function accepts(options: DroppableCollectionOptions, types: DragTypes) {
  if (!options.acceptedDragTypes || options.acceptedDragTypes === 'all') return true;
  return options.acceptedDragTypes.some((type) => types.has(type));
}

export function getCollectionDropOperation(
  registration: DroppableRegistration,
  target: DropTarget,
  types: DragTypes,
  allowed: DropOperation[],
): DropOperation {
  const { options, state } = registration;
  if (state.isDisabled || !accepts(options, types)) return 'cancel';
  if (
    target.type === 'item' &&
    target.dropPosition === 'on' &&
    options.shouldAcceptItemDrop &&
    !options.shouldAcceptItemDrop(target as DropTarget & { type: 'item' }, types)
  ) {
    return 'cancel';
  }
  const operation = state.getDropOperation(details(state, target, types, allowed));
  return operation === 'cancel' || allowed.includes(operation) ? operation : 'cancel';
}

function collectionEvent(
  event: Omit<DroppableCollectionEventBase, 'target'>,
  target: DropTarget,
): DroppableCollectionEventBase {
  return { ...event, target };
}

export function dispatchCollectionDrop(
  registration: DroppableRegistration,
  target: DropTarget,
  event: DropEvent,
) {
  const { options, state } = registration;
  const session = getCollectionSession();
  const isInternal = session?.source === token(state);
  markCollectionDrop(token(state));
  const dropEvent = { ...event, target };
  if (options.onDrop) {
    options.onDrop(dropEvent);
    return;
  }
  if (target.type === 'root') {
    options.onRootDrop?.({ items: event.items, dropOperation: event.dropOperation });
    return;
  }

  const itemTarget = target as DropTarget & { type: 'item' };
  if (isInternal && options.onMove) {
    options.onMove({
      keys: session?.keys ?? new Set(),
      dropOperation: event.dropOperation,
      target: itemTarget,
    });
  } else if (isInternal && itemTarget.dropPosition !== 'on' && options.onReorder) {
    options.onReorder({
      keys: session?.keys ?? new Set(),
      dropOperation: event.dropOperation,
      target: itemTarget,
    });
  } else if (itemTarget.dropPosition === 'on') {
    options.onItemDrop?.({
      items: event.items,
      dropOperation: event.dropOperation,
      target: itemTarget,
      isInternal,
    });
  } else {
    options.onInsert?.({
      items: event.items,
      dropOperation: event.dropOperation,
      target: itemTarget,
    });
  }
}

export function getDroppableRegistration(state: DroppableCollectionState) {
  return registrations.get(state);
}

export function collectionSessionIsValid(
  registration: DroppableRegistration | undefined,
  target: DropTarget,
) {
  const session = getCollectionSession();
  return !!(
    registration &&
    session &&
    getCollectionDropOperation(registration, target, session.types, session.allowedOperations) !==
      'cancel'
  );
}

/** Adds root-level pointer and keyboard drop behavior to a controlled collection. */
export function useDroppableCollection(
  options: DroppableCollectionOptions,
  state: DroppableCollectionState,
  ref: RefObject<HTMLElement>,
): DroppableCollectionResult {
  const registrationRef = useRef<DroppableRegistration>({ options, state });
  registrationRef.current.options = options;
  registrationRef.current.state = state;
  const registration = registrationRef.current;
  registrations.set(state, registration);
  activeTargets.set(state, state.target);

  const targetFor = (types: DragTypes, allowed: DropOperation[], x: number, y: number) => {
    const target =
      options.dropTargetDelegate.getDropTargetFromPoint(
        x,
        y,
        (candidate) =>
          getCollectionDropOperation(registration, candidate, types, allowed) !== 'cancel',
      ) ?? ROOT_TARGET;
    setDroppableTarget(state, target);
    return target;
  };

  const drop = useDrop({
    ref,
    isDisabled: state.isDisabled,
    getDropOperationForPoint(types, allowed, x, y) {
      return getCollectionDropOperation(
        registration,
        targetFor(types, allowed, x, y),
        types,
        allowed,
      );
    },
    onDropEnter(event) {
      options.onDropEnter?.(collectionEvent(event, getDroppableTarget(state) ?? ROOT_TARGET));
    },
    onDropMove(event) {
      options.onDropMove?.(collectionEvent(event, getDroppableTarget(state) ?? ROOT_TARGET));
    },
    onDropActivate(event) {
      options.onDropActivate?.(collectionEvent(event, getDroppableTarget(state) ?? ROOT_TARGET));
    },
    onDropExit(event) {
      options.onDropExit?.(collectionEvent(event, getDroppableTarget(state) ?? ROOT_TARGET));
      setDroppableTarget(state, null);
    },
    onDrop(event) {
      dispatchCollectionDrop(registration, getDroppableTarget(state) ?? ROOT_TARGET, event);
      setDroppableTarget(state, null);
    },
  });

  useEffect(
    () => () => {
      if (registrations.get(state) === registration) registrations.delete(state);
      activeTargets.delete(state);
    },
    [state],
  );

  function moveWithKeyboardDelegate(event: TargetedKeyboardEvent<HTMLElement>) {
    const currentTarget = getDroppableTarget(state);
    const eventTarget = event.target instanceof HTMLElement ? event.target : null;
    const eventKey = eventTarget?.dataset.dropKey;
    if (!isKeyboardDragging() || (!eventKey && currentTarget?.type !== 'item')) return;
    const key = eventKey ?? currentTarget!.key!;
    let next: CollectionKey | null | undefined;
    if (event.key === 'ArrowDown') next = options.keyboardDelegate.getKeyBelow?.(key);
    else if (event.key === 'ArrowUp') next = options.keyboardDelegate.getKeyAbove?.(key);
    else if (event.key === 'ArrowLeft') next = options.keyboardDelegate.getKeyLeftOf?.(key);
    else if (event.key === 'ArrowRight') next = options.keyboardDelegate.getKeyRightOf?.(key);
    else if (event.key === 'Home') next = options.keyboardDelegate.getFirstKey?.();
    else if (event.key === 'End') next = options.keyboardDelegate.getLastKey?.();
    else return;
    if (next == null) return;
    event.preventDefault();
    setDroppableTarget(state, {
      type: 'item',
      key: next,
      dropPosition:
        (eventTarget?.dataset.dropPosition as DropTarget['dropPosition']) ??
        currentTarget?.dropPosition ??
        'on',
    });
    const element = [...(ref.current?.querySelectorAll<HTMLElement>('[data-drop-key]') ?? [])].find(
      (candidate) => candidate.dataset.dropKey === String(next),
    );
    element?.focus();
  }

  return {
    collectionProps: {
      ...drop.dropProps,
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        drop.dropProps.onKeyDown?.(event);
        moveWithKeyboardDelegate(event);
        options.onKeyDown?.(event);
      },
    },
  };
}
