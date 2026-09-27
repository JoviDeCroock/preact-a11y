import { dragItemsToDropItems, getDragTypes } from './dataTransfer';
import { DragTypes, type DragItem, type DropOperation } from './types';
import type { RefObject } from '../preactTypes';

export interface KeyboardDropTarget {
  ref: RefObject<HTMLElement>;
  focus(): void;
  getOperation(
    types: DragTypes,
    allowedOperations: DropOperation[],
    x: number,
    y: number,
  ): DropOperation;
  setActive(active: boolean): void;
  drop(items: ReturnType<typeof dragItemsToDropItems>, operation: DropOperation): void;
}

interface KeyboardDragSession {
  items: DragItem[];
  types: DragTypes;
  allowedOperations: DropOperation[];
  source: HTMLElement;
  finish(operation: DropOperation): void;
}

const targets = new Set<KeyboardDropTarget>();
let session: KeyboardDragSession | undefined;
let activeTarget: KeyboardDropTarget | undefined;
let liveRegion: HTMLElement | undefined;

function announce(message: string) {
  if (typeof document === 'undefined') return;
  if (!liveRegion?.isConnected) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'assertive');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.dataset.preactA11yDragAnnouncer = '';
    Object.assign(liveRegion.style, {
      border: '0',
      clip: 'rect(0 0 0 0)',
      clipPath: 'inset(50%)',
      height: '1px',
      overflow: 'hidden',
      position: 'fixed',
      whiteSpace: 'nowrap',
      width: '1px',
    });
    document.body.append(liveRegion);
  }
  liveRegion.textContent = '';
  queueMicrotask(() => {
    if (liveRegion) liveRegion.textContent = message;
  });
}

function validTargets() {
  if (!session) return [];
  return [...targets].filter(
    (target) =>
      target.ref.current?.isConnected &&
      target.getOperation(session!.types, session!.allowedOperations, 0, 0) !== 'cancel',
  );
}

function activate(target: KeyboardDropTarget | undefined) {
  if (activeTarget === target) return;
  activeTarget?.setActive(false);
  activeTarget = target;
  activeTarget?.setActive(true);
  activeTarget?.focus();
  if (activeTarget)
    announce('Drop target. Press Enter to drop, arrow keys to move, or Escape to cancel.');
}

export function registerKeyboardDropTarget(target: KeyboardDropTarget) {
  targets.add(target);
  return () => {
    if (activeTarget === target) activeTarget = undefined;
    targets.delete(target);
  };
}

export function startKeyboardDrag(options: Omit<KeyboardDragSession, 'types'>) {
  if (session) cancelKeyboardDrag();
  session = { ...options, types: new DragTypes(getDragTypes(options.items)) };
  announce('Dragging. Use arrow keys to choose a drop target, Enter to drop, or Escape to cancel.');
  activate(validTargets()[0]);
}

export function isKeyboardDragging() {
  return session !== undefined;
}

export function moveKeyboardDropTarget(from: KeyboardDropTarget, delta: number) {
  const available = validTargets();
  if (!available.length) return;
  const index = Math.max(0, available.indexOf(from));
  activate(available[(index + delta + available.length) % available.length]);
}

export function completeKeyboardDrop(target: KeyboardDropTarget) {
  if (!session) return false;
  const operation = target.getOperation(session.types, session.allowedOperations, 0, 0);
  if (operation === 'cancel') return false;
  const current = session;
  target.setActive(false);
  activeTarget = undefined;
  session = undefined;
  target.drop(dragItemsToDropItems(current.items), operation);
  current.finish(operation);
  current.source.focus();
  queueMicrotask(() => {
    if (current.source.isConnected) current.source.focus();
  });
  announce('Drop complete.');
  return true;
}

export function cancelKeyboardDrag(source?: HTMLElement) {
  if (!session || (source && session.source !== source)) return false;
  const current = session;
  activeTarget?.setActive(false);
  activeTarget = undefined;
  session = undefined;
  current.finish('cancel');
  current.source.focus();
  announce('Drag cancelled.');
  return true;
}
