import type { RefObject } from 'preact';
import type { JSX } from '../preactTypes';
import { useMemo } from 'preact/hooks';
import type { DropTarget } from '../collections/delegates';
import { useDrop } from './useDrop';
import {
  dispatchCollectionDrop,
  getCollectionDropOperation,
  getDroppableTarget,
  getDroppableRegistration,
  setDroppableTarget,
  type DroppableCollectionEventBase,
  type DroppableCollectionState,
} from './useDroppableCollection';

export interface DroppableItemOptions {
  target: DropTarget;
  activateButtonRef?: RefObject<HTMLElement>;
}

export interface DroppableItemResult {
  dropProps: Omit<JSX.HTMLAttributes<HTMLElement>, 'ref'> & {
    'data-drop-key'?: string;
    'data-drop-position'?: string;
  };
  isDropTarget: boolean;
}

function withTarget(
  event: Omit<DroppableCollectionEventBase, 'target'>,
  target: DropTarget,
): DroppableCollectionEventBase {
  return { ...event, target };
}

/** Adds fixed-target drop semantics to an item inside a registered droppable collection. */
export function useDroppableItem(
  options: DroppableItemOptions,
  state: DroppableCollectionState,
  ref: RefObject<HTMLElement>,
): DroppableItemResult {
  const registration = getDroppableRegistration(state);
  const targetRef = useMemo<RefObject<HTMLElement>>(
    () => ({
      get current() {
        return options.activateButtonRef?.current ?? ref.current;
      },
    }),
    [options.activateButtonRef, ref],
  );
  const drop = useDrop({
    ref: targetRef,
    isDisabled: state.isDisabled || !registration,
    getDropOperation(types, allowed) {
      if (!registration) return 'cancel';
      setDroppableTarget(state, options.target);
      return getCollectionDropOperation(registration, options.target, types, allowed);
    },
    onDropEnter(event) {
      setDroppableTarget(state, options.target);
      registration?.options.onDropEnter?.(withTarget(event, options.target));
    },
    onDropMove(event) {
      registration?.options.onDropMove?.(withTarget(event, options.target));
    },
    onDropActivate(event) {
      registration?.options.onDropActivate?.(withTarget(event, options.target));
    },
    onDropExit(event) {
      registration?.options.onDropExit?.(withTarget(event, options.target));
      if (state.isDropTarget(options.target)) setDroppableTarget(state, null);
    },
    onDrop(event) {
      if (registration) dispatchCollectionDrop(registration, options.target, event);
      setDroppableTarget(state, null);
    },
  });

  return {
    dropProps: {
      ...drop.dropProps,
      tabIndex: undefined,
      'data-drop-key': options.target.type === 'item' ? String(options.target.key) : undefined,
      'data-drop-position': options.target.dropPosition,
    },
    isDropTarget:
      drop.isDropTarget ||
      state.isDropTarget(options.target) ||
      getDroppableTarget(state) === options.target,
  };
}
