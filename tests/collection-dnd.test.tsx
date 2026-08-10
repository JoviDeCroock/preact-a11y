import { fireEvent, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import {
  useDraggableCollection,
  useDraggableItem,
  useDropIndicator,
  useDroppableCollection,
  useDroppableItem,
  type CollectionKey,
  type DraggableCollectionEndEvent,
  type DraggableCollectionState,
  type DropTarget,
  type DroppableCollectionReorderEvent,
  type DroppableCollectionState,
} from '../src';

const collection = {};
const beforeBeta: DropTarget = { type: 'item', key: 'beta', dropPosition: 'before' };
const beforeGamma: DropTarget = { type: 'item', key: 'gamma', dropPosition: 'before' };

function sameTarget(left: DropTarget | null, right: DropTarget | null) {
  return (
    left?.type === right?.type &&
    left?.key === right?.key &&
    left?.dropPosition === right?.dropPosition
  );
}

function CollectionDndProbe({
  onDragEnd,
  onReorder,
}: {
  onDragEnd: (event: DraggableCollectionEndEvent) => void;
  onReorder: (event: DroppableCollectionReorderEvent) => void;
}) {
  const collectionRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const secondTargetRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [draggedKey, setDraggedKey] = useState<CollectionKey | null>(null);
  const [draggingKeys, setDraggingKeys] = useState(new Set<CollectionKey>());
  const [target, setTarget] = useState<DropTarget | null>(null);

  const dragStateRef = useRef<DraggableCollectionState>();
  if (!dragStateRef.current) {
    dragStateRef.current = {
      collection,
      draggedKey: null,
      draggingKeys: new Set(),
      isDragging: (key) => dragStateRef.current!.draggingKeys.has(key),
      getKeysForDrag: (key) => new Set([key]),
      getItems: (key) => [{ 'text/plain': String(key) }],
      getAllowedDropOperations: () => ['move'],
      startDrag(key, event) {
        setDraggedKey(key);
        setDraggingKeys(event.keys);
      },
      moveDrag() {},
      endDrag(event) {
        setDraggedKey(null);
        setDraggingKeys(new Set());
        onDragEnd(event);
      },
    };
  }
  dragStateRef.current.draggedKey = draggedKey;
  dragStateRef.current.draggingKeys = draggingKeys;
  const dragState = dragStateRef.current;

  const dropStateRef = useRef<DroppableCollectionState>();
  if (!dropStateRef.current) {
    dropStateRef.current = {
      collection,
      target: null,
      setTarget,
      isDropTarget: (candidate) => sameTarget(dropStateRef.current!.target, candidate),
      getDropOperation: ({ target: candidate, types, allowedOperations }) =>
        candidate.type === 'item' && types.has('text/plain') && allowedOperations.includes('move')
          ? 'move'
          : 'cancel',
    };
  }
  dropStateRef.current.target = target;
  const dropState = dropStateRef.current;

  useDraggableCollection({}, dragState, collectionRef);
  const drag = useDraggableItem({ hasAction: true, key: 'alpha' }, dragState);
  const collectionDrop = useDroppableCollection(
    {
      keyboardDelegate: {
        getKeyBelow: (key) => (key === 'beta' ? 'gamma' : null),
        getKeyAbove: (key) => (key === 'gamma' ? 'beta' : null),
      },
      dropTargetDelegate: { getDropTargetFromPoint: () => ({ type: 'root' }) },
      acceptedDragTypes: ['text/plain'],
      onReorder,
    },
    dropState,
    collectionRef,
  );
  const indicator = useDropIndicator({ target: beforeBeta }, dropState, indicatorRef);
  const itemDrop = useDroppableItem({ target: beforeBeta }, dropState, targetRef);
  const secondItemDrop = useDroppableItem({ target: beforeGamma }, dropState, secondTargetRef);

  return (
    <div
      {...collectionDrop.collectionProps}
      aria-label="Reorder list"
      ref={collectionRef}
      role="list"
    >
      <div
        {...drag.dragProps}
        aria-label="Alpha"
        data-dragging={drag.isDragging || undefined}
        role="button"
      >
        Alpha
      </div>
      <div
        {...indicator.dropIndicatorProps}
        data-hidden={indicator.isHidden || undefined}
        ref={indicatorRef}
      />
      <div
        {...itemDrop.dropProps}
        aria-label="Before Beta"
        data-drop-target={itemDrop.isDropTarget || undefined}
        ref={targetRef}
        role="region"
        tabIndex={-1}
      >
        Beta
      </div>
      <div
        {...secondItemDrop.dropProps}
        aria-label="Before Gamma"
        data-drop-target={secondItemDrop.isDropTarget || undefined}
        ref={secondTargetRef}
        role="region"
        tabIndex={-1}
      >
        Gamma
      </div>
    </div>
  );
}

class TestDataTransfer {
  private data = new Map<string, string>();
  dropEffect: DataTransfer['dropEffect'] = 'none';
  effectAllowed: DataTransfer['effectAllowed'] = 'uninitialized';
  files = [] as unknown as FileList;
  items = [] as unknown as DataTransferItemList;
  setDragImage = vi.fn();
  get types() {
    return [...this.data.keys()];
  }
  clearData() {
    this.data.clear();
  }
  getData(type: string) {
    return this.data.get(type) ?? '';
  }
  setData(type: string, value: string) {
    this.data.set(type, value);
  }
}

describe('collection drag and drop hooks', () => {
  it('supports keyboard reordering, indicators, internal detection, and action conflicts', async () => {
    const onDragEnd = vi.fn();
    const onReorder = vi.fn();
    const user = userEvent.setup();
    render(<CollectionDndProbe onDragEnd={onDragEnd} onReorder={onReorder} />);
    const source = screen.getByRole('button', { name: 'Alpha' });
    const indicator = document.querySelector<HTMLElement>('[aria-label="Drop before beta"]')!;

    source.focus();
    await user.keyboard('{Enter}');
    expect(source).not.toHaveAttribute('data-dragging');

    await user.keyboard('{Alt>}{Enter}{/Alt}');
    expect(source).toHaveAttribute('data-dragging');
    expect(indicator).not.toHaveAttribute('aria-hidden');
    expect(indicator).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('region', { name: 'Before Gamma' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(indicator).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onReorder).toHaveBeenCalledWith(
      expect.objectContaining({ keys: new Set(['alpha']), target: beforeBeta }),
    );
    expect(onDragEnd).toHaveBeenCalledWith(
      expect.objectContaining({ dropOperation: 'move', isInternal: true }),
    );
    expect(source).toHaveFocus();
  });

  it('routes native internal drops to collection reorder callbacks', () => {
    const onDragEnd = vi.fn();
    const onReorder = vi.fn();
    render(<CollectionDndProbe onDragEnd={onDragEnd} onReorder={onReorder} />);
    const source = screen.getByRole('button', { name: 'Alpha' });
    const transfer = new TestDataTransfer();

    fireEvent.dragStart(source, { dataTransfer: transfer });
    const indicator = document.querySelector<HTMLElement>('[aria-label="Drop before beta"]')!;
    fireEvent.dragEnter(indicator, { dataTransfer: transfer });
    expect(transfer.dropEffect).toBe('move');
    fireEvent.drop(indicator, { dataTransfer: transfer });
    transfer.dropEffect = 'move';
    fireEvent.dragEnd(source, { dataTransfer: transfer });

    expect(onReorder).toHaveBeenCalledWith(
      expect.objectContaining({ keys: new Set(['alpha']), target: beforeBeta }),
    );
    expect(onDragEnd).toHaveBeenCalledWith(expect.objectContaining({ isInternal: true }));
  });
});
