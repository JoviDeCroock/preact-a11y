import type { JSX, RefObject, TargetedDragEvent, TargetedKeyboardEvent } from '../preactTypes';
import { useEffect, useRef, useState } from 'preact/hooks';
import { writeToDataTransfer } from './dataTransfer';
import { cancelKeyboardDrag, startKeyboardDrag } from './keyboardManager';
import type { DragEndEvent, DragItem, DragMoveEvent, DragStartEvent, DropOperation } from './types';

export type DragPreviewRenderer = (
  items: DragItem[],
  callback: (element: HTMLElement | null, x?: number, y?: number) => void,
) => void;

export interface DragOptions {
  onDragStart?: (event: DragStartEvent) => void;
  onDragMove?: (event: DragMoveEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  getItems: () => DragItem[];
  preview?: RefObject<DragPreviewRenderer>;
  getAllowedDropOperations?: () => DropOperation[];
  hasDragButton?: boolean;
  isDisabled?: boolean;
}

export interface DragResult {
  dragProps: DragDOMProps;
  dragButtonProps: JSX.ButtonHTMLAttributes<HTMLButtonElement>;
  isDragging: boolean;
}

type DragDOMProps = Pick<
  JSX.HTMLAttributes<HTMLElement>,
  'draggable' | 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onKeyDown' | 'tabIndex'
>;

function effectAllowed(operations: DropOperation[]): DataTransfer['effectAllowed'] {
  const allowed = new Set(operations);
  if (allowed.has('copy') && allowed.has('move') && allowed.has('link')) return 'all';
  if (allowed.has('copy') && allowed.has('move')) return 'copyMove';
  if (allowed.has('copy') && allowed.has('link')) return 'copyLink';
  if (allowed.has('move') && allowed.has('link')) return 'linkMove';
  if (allowed.has('copy')) return 'copy';
  if (allowed.has('move')) return 'move';
  if (allowed.has('link')) return 'link';
  return 'none';
}

function dropOperation(effect: DataTransfer['dropEffect']): DropOperation {
  return effect === 'copy' || effect === 'move' || effect === 'link' ? effect : 'cancel';
}

/** Adds native pointer drag and an equivalent keyboard/screen-reader flow to an element. */
export function useDrag(options: DragOptions): DragResult {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const sourceRef = useRef<HTMLElement | null>(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const [isDragging, setDragging] = useState(false);

  const allowedOperations = () =>
    optionsRef.current.getAllowedDropOperations?.() ?? ['move', 'copy', 'link'];

  const startKeyboard = (source: HTMLElement) => {
    if (optionsRef.current.isDisabled || isDragging) return;
    const rect = source.getBoundingClientRect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    sourceRef.current = source;
    setDragging(true);
    optionsRef.current.onDragStart?.({ type: 'dragstart', x, y });
    startKeyboardDrag({
      items: optionsRef.current.getItems(),
      allowedOperations: allowedOperations(),
      source,
      finish(operation) {
        setDragging(false);
        optionsRef.current.onDragEnd?.({ type: 'dragend', x, y, dropOperation: operation });
      },
    });
  };

  useEffect(
    () => () => {
      if (sourceRef.current) cancelKeyboardDrag(sourceRef.current);
    },
    [],
  );

  const onKeyDown = (event: TargetedKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    startKeyboard(event.currentTarget);
  };

  const nativeProps: DragDOMProps = {
    draggable: !options.isDisabled,
    onDragStart(event: TargetedDragEvent<HTMLElement>) {
      if (optionsRef.current.isDisabled || !event.dataTransfer) {
        event.preventDefault();
        return;
      }
      event.stopPropagation();
      const items = optionsRef.current.getItems();
      event.dataTransfer.clearData();
      writeToDataTransfer(event.dataTransfer, items);
      event.dataTransfer.effectAllowed = effectAllowed(allowedOperations());
      optionsRef.current.preview?.current?.(items, (element, x, y) => {
        if (element) event.dataTransfer?.setDragImage(element, x ?? 0, y ?? 0);
      });
      sourceRef.current = event.currentTarget;
      lastPosition.current = { x: event.clientX, y: event.clientY };
      setDragging(true);
      optionsRef.current.onDragStart?.({
        type: 'dragstart',
        x: event.clientX,
        y: event.clientY,
      });
    },
    onDrag(event: TargetedDragEvent<HTMLElement>) {
      if (event.clientX === lastPosition.current.x && event.clientY === lastPosition.current.y) {
        return;
      }
      lastPosition.current = { x: event.clientX, y: event.clientY };
      optionsRef.current.onDragMove?.({ type: 'dragmove', x: event.clientX, y: event.clientY });
    },
    onDragEnd(event: TargetedDragEvent<HTMLElement>) {
      event.stopPropagation();
      setDragging(false);
      sourceRef.current = null;
      optionsRef.current.onDragEnd?.({
        type: 'dragend',
        x: event.clientX,
        y: event.clientY,
        dropOperation: event.dataTransfer ? dropOperation(event.dataTransfer.dropEffect) : 'cancel',
      });
    },
  };

  if (!options.hasDragButton && !options.isDisabled) {
    nativeProps.onKeyDown = onKeyDown;
    nativeProps.tabIndex = 0;
  }

  return {
    dragProps: nativeProps,
    dragButtonProps: options.hasDragButton
      ? {
          'aria-label': isDragging ? 'Dragging' : 'Drag',
          disabled: options.isDisabled,
          type: 'button',
          onClick: (event) => startKeyboard(event.currentTarget),
        }
      : {},
    isDragging,
  };
}
