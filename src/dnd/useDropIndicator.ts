import type { JSX, RefObject } from '../preactTypes';
import { useEffect, useState } from 'preact/hooks';
import type { DropTarget } from '../collections/delegates';
import { subscribeCollectionSession } from './collectionSession';
import {
  collectionSessionIsValid,
  getDroppableRegistration,
  type DroppableCollectionState,
} from './useDroppableCollection';
import { useDroppableItem } from './useDroppableItem';

export interface DropIndicatorProps {
  target: DropTarget;
  activateButtonRef?: RefObject<HTMLElement>;
}

export interface DropIndicatorAria {
  dropIndicatorProps: Omit<JSX.HTMLAttributes<HTMLElement>, 'ref'>;
  isDropTarget: boolean;
  isHidden: boolean;
}

function targetLabel(target: DropTarget): string {
  if (target.type === 'root') return 'Drop on collection';
  const position = target.dropPosition ?? 'on';
  return `Drop ${position} ${String(target.key)}`;
}

/** Provides a keyboard-operable, conditionally exposed collection drop indicator. */
export function useDropIndicator(
  props: DropIndicatorProps,
  state: DroppableCollectionState,
  ref: RefObject<HTMLElement>,
): DropIndicatorAria {
  const [, setVersion] = useState(0);
  useEffect(() => subscribeCollectionSession(() => setVersion((value) => value + 1)), []);
  const item = useDroppableItem(props, state, ref);
  const isHidden = !collectionSessionIsValid(getDroppableRegistration(state), props.target);

  return {
    dropIndicatorProps: {
      ...item.dropProps,
      role: 'button' as const,
      tabIndex: isHidden ? -1 : 0,
      'aria-hidden': isHidden || undefined,
      'aria-label': targetLabel(props.target),
    },
    isDropTarget: item.isDropTarget,
    isHidden,
  };
}
