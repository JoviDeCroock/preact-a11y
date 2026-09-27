import type { JSX, RefObject, TargetedDragEvent, TargetedKeyboardEvent } from '../preactTypes';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { readFromDataTransfer } from './dataTransfer';
import {
  cancelKeyboardDrag,
  completeKeyboardDrop,
  isKeyboardDragging,
  moveKeyboardDropTarget,
  registerKeyboardDropTarget,
  type KeyboardDropTarget,
} from './keyboardManager';
import {
  DragTypes,
  type DropActivateEvent,
  type DropEnterEvent,
  type DropEvent,
  type DropExitEvent,
  type DropMoveEvent,
  type DropOperation,
} from './types';

export interface DropOptions {
  ref: RefObject<HTMLElement>;
  getDropOperation?: (types: DragTypes, allowedOperations: DropOperation[]) => DropOperation;
  getDropOperationForPoint?: (
    types: DragTypes,
    allowedOperations: DropOperation[],
    x: number,
    y: number,
  ) => DropOperation;
  onDropEnter?: (event: DropEnterEvent) => void;
  onDropMove?: (event: DropMoveEvent) => void;
  onDropActivate?: (event: DropActivateEvent) => void;
  onDropExit?: (event: DropExitEvent) => void;
  onDrop?: (event: DropEvent) => void;
  hasDropButton?: boolean;
  isDisabled?: boolean;
}

export interface DropResult {
  dropProps: DropDOMProps;
  isDropTarget: boolean;
  dropButtonProps?: JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    'data-preact-a11y-drop-button': true;
  };
}

type DropDOMProps = Pick<
  JSX.HTMLAttributes<HTMLElement>,
  'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop' | 'onKeyDown' | 'tabIndex'
>;

function allowedOperations(effect: DataTransfer['effectAllowed']): DropOperation[] {
  if (effect === 'none') return [];
  const result: DropOperation[] = [];
  if (effect === 'all' || effect === 'uninitialized' || effect.toLowerCase().includes('copy'))
    result.push('copy');
  if (effect === 'all' || effect === 'uninitialized' || effect.toLowerCase().includes('move'))
    result.push('move');
  if (effect === 'all' || effect === 'uninitialized' || effect.toLowerCase().includes('link'))
    result.push('link');
  return result;
}

/** Adds native pointer drop handling and keyboard-operable drop-target navigation. */
export function useDrop(options: DropOptions): DropResult {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [isDropTarget, setDropTarget] = useState(false);
  const activationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const operationFor = (types: DragTypes, allowed: DropOperation[], x: number, y: number) => {
    if (optionsRef.current.isDisabled) return 'cancel';
    const operation =
      optionsRef.current.getDropOperationForPoint?.(types, allowed, x, y) ??
      optionsRef.current.getDropOperation?.(types, allowed) ??
      allowed[0] ??
      'cancel';
    return operation === 'cancel' || allowed.includes(operation) ? operation : 'cancel';
  };

  const keyboardTarget = useMemo<KeyboardDropTarget>(
    () => ({
      ref: options.ref,
      focus() {
        const button = options.ref.current?.querySelector<HTMLElement>(
          '[data-preact-a11y-drop-button]',
        );
        (button ?? options.ref.current)?.focus();
      },
      getOperation: operationFor,
      setActive: setDropTarget,
      drop(items, operation) {
        const types = new DragTypes(items.flatMap((item) => [...item.types]));
        optionsRef.current.onDrop?.({
          type: 'drop',
          items,
          types,
          dropOperation: operation,
          x: 0,
          y: 0,
        });
      },
    }),
    [options.ref],
  );

  useEffect(() => registerKeyboardDropTarget(keyboardTarget), [keyboardTarget]);
  useEffect(
    () => () => {
      if (activationTimer.current) clearTimeout(activationTimer.current);
    },
    [],
  );

  const keyboardHandler = (event: TargetedKeyboardEvent<HTMLElement>) => {
    if (!isKeyboardDragging()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelKeyboardDrag();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      completeKeyboardDrop(keyboardTarget);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'Tab') {
      event.preventDefault();
      moveKeyboardDropTarget(keyboardTarget, event.shiftKey ? -1 : 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      moveKeyboardDropTarget(keyboardTarget, -1);
    }
  };

  const eventDetails = (event: TargetedDragEvent<HTMLElement>) => {
    const x = event.clientX ?? 0;
    const y = event.clientY ?? 0;
    const allowed = event.dataTransfer ? allowedOperations(event.dataTransfer.effectAllowed) : [];
    const types = new DragTypes(event.dataTransfer ? Array.from(event.dataTransfer.types) : []);
    const dropOperation = operationFor(types, allowed, x, y);
    if (event.dataTransfer)
      event.dataTransfer.dropEffect = dropOperation === 'cancel' ? 'none' : dropOperation;
    return { types, allowed, dropOperation };
  };

  const dropProps: DropDOMProps = {
    onDragEnter(event) {
      const { types, dropOperation } = eventDetails(event);
      if (dropOperation === 'cancel') return;
      event.preventDefault();
      event.stopPropagation();
      setDropTarget(true);
      optionsRef.current.onDropEnter?.({
        type: 'dropenter',
        types,
        dropOperation,
        x: event.clientX ?? 0,
        y: event.clientY ?? 0,
      });
      if (optionsRef.current.onDropActivate) {
        if (activationTimer.current) clearTimeout(activationTimer.current);
        activationTimer.current = setTimeout(() => {
          optionsRef.current.onDropActivate?.({
            type: 'dropactivate',
            types,
            dropOperation,
            x: event.clientX ?? 0,
            y: event.clientY ?? 0,
          });
        }, 800);
      }
    },
    onDragOver(event) {
      const { types, dropOperation } = eventDetails(event);
      if (dropOperation === 'cancel') return;
      event.preventDefault();
      event.stopPropagation();
      setDropTarget(true);
      optionsRef.current.onDropMove?.({
        type: 'dropmove',
        types,
        dropOperation,
        x: event.clientX ?? 0,
        y: event.clientY ?? 0,
      });
    },
    onDragLeave(event) {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      const { types, dropOperation } = eventDetails(event);
      if (activationTimer.current) clearTimeout(activationTimer.current);
      setDropTarget(false);
      optionsRef.current.onDropExit?.({
        type: 'dropexit',
        types,
        dropOperation,
        x: event.clientX ?? 0,
        y: event.clientY ?? 0,
      });
    },
    onDrop(event) {
      const { types, dropOperation } = eventDetails(event);
      if (dropOperation === 'cancel' || !event.dataTransfer) return;
      event.preventDefault();
      event.stopPropagation();
      if (activationTimer.current) clearTimeout(activationTimer.current);
      setDropTarget(false);
      optionsRef.current.onDrop?.({
        type: 'drop',
        items: readFromDataTransfer(event.dataTransfer),
        types,
        dropOperation,
        x: event.clientX ?? 0,
        y: event.clientY ?? 0,
      });
    },
  };

  if (!options.hasDropButton) {
    dropProps.onKeyDown = keyboardHandler;
    dropProps.tabIndex = options.isDisabled ? undefined : 0;
  }

  return {
    dropProps,
    isDropTarget,
    dropButtonProps: options.hasDropButton
      ? {
          'aria-label': 'Drop',
          'data-preact-a11y-drop-button': true,
          disabled: options.isDisabled,
          type: 'button',
          onClick: () => completeKeyboardDrop(keyboardTarget),
          onKeyDown: keyboardHandler,
        }
      : undefined,
  };
}
