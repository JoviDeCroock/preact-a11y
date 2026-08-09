import { fireEvent, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { createRef } from 'preact';
import { useRef } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import {
  DragPreview,
  isTextDropItem,
  useDrag,
  useDrop,
  type DragEndEvent,
  type DragPreviewRenderer,
  type DropEvent,
} from '../src';

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

  clearData(type?: string) {
    if (type) this.data.delete(type);
    else this.data.clear();
  }

  getData(type: string) {
    return this.data.get(type) ?? '';
  }

  setData(type: string, value: string) {
    this.data.set(type, value);
  }
}

function DndExample({
  onDrop,
  onDragEnd,
  preview,
}: {
  onDrop: (event: DropEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  preview?: ReturnType<typeof createRef<DragPreviewRenderer>>;
}) {
  const dropRef = useRef<HTMLDivElement>(null);
  const drag = useDrag({
    getItems: () => [{ 'text/plain': 'Preact item', 'application/json': '{"id":1}' }],
    getAllowedDropOperations: () => ['copy', 'move'],
    onDragEnd,
    preview,
  });
  const drop = useDrop({
    ref: dropRef,
    getDropOperation: (types, allowed) =>
      types.has('text/plain') && allowed.includes('move') ? 'move' : 'cancel',
    onDrop,
  });
  return (
    <>
      <div
        {...drag.dragProps}
        aria-label="Draggable item"
        data-dragging={drag.isDragging || undefined}
        role="button"
      >
        Draggable item
      </div>
      <div
        {...drop.dropProps}
        aria-label="Drop target"
        data-drop-target={drop.isDropTarget || undefined}
        ref={dropRef}
        role="region"
      >
        Drop target
      </div>
    </>
  );
}

describe('drag and drop primitives', () => {
  it('supports keyboard drag, target navigation, drop, announcements, and focus recovery', async () => {
    const onDrop = vi.fn();
    const onDragEnd = vi.fn();
    const user = userEvent.setup();
    render(<DndExample onDragEnd={onDragEnd} onDrop={onDrop} />);
    const source = screen.getByRole('button', { name: 'Draggable item' });
    const target = screen.getByRole('region', { name: 'Drop target' });

    source.focus();
    await user.keyboard('{Enter}');
    expect(source).toHaveAttribute('data-dragging');
    expect(target).toHaveAttribute('data-drop-target');
    expect(target).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onDrop).toHaveBeenCalledTimes(1);
    const event = onDrop.mock.calls[0]![0];
    expect(event.dropOperation).toBe('move');
    expect(event.items[0] && isTextDropItem(event.items[0])).toBe(true);
    expect(await event.items[0]!.getText('text/plain')).toBe('Preact item');
    expect(onDragEnd).toHaveBeenLastCalledWith(
      expect.objectContaining({ dropOperation: 'move', type: 'dragend' }),
    );
    expect(source).toHaveFocus();
    expect(source).not.toHaveAttribute('data-dragging');
  });

  it('serializes native drags, negotiates operations, and renders a custom preview', () => {
    const onDrop = vi.fn();
    const onDragEnd = vi.fn();
    const preview = createRef<DragPreviewRenderer>();
    render(
      <>
        <DndExample onDragEnd={onDragEnd} onDrop={onDrop} preview={preview} />
        <DragPreview previewRef={preview}>
          {(items) => ({
            element: <div>{items[0]?.['text/plain']}</div>,
            x: 4,
            y: 6,
          })}
        </DragPreview>
      </>,
    );
    const source = screen.getByRole('button', { name: 'Draggable item' });
    const target = screen.getByRole('region', { name: 'Drop target' });
    const transfer = new TestDataTransfer();

    fireEvent.dragStart(source, { clientX: 10, clientY: 20, dataTransfer: transfer });
    expect(transfer.effectAllowed).toBe('copyMove');
    expect(transfer.getData('text/plain')).toBe('Preact item');
    expect(transfer.setDragImage).toHaveBeenCalledWith(expect.any(HTMLElement), 4, 6);

    fireEvent.dragEnter(target, { clientX: 30, clientY: 40, dataTransfer: transfer });
    expect(transfer.dropEffect).toBe('move');
    expect(target).toHaveAttribute('data-drop-target');
    fireEvent.drop(target, { clientX: 30, clientY: 40, dataTransfer: transfer });
    expect(onDrop).toHaveBeenCalledWith(
      expect.objectContaining({ dropOperation: 'move', type: 'drop' }),
    );

    transfer.dropEffect = 'move';
    fireEvent.dragEnd(source, { clientX: 30, clientY: 40, dataTransfer: transfer });
    expect(onDragEnd).toHaveBeenCalledWith(
      expect.objectContaining({ dropOperation: 'move', type: 'dragend' }),
    );
  });

  it('cancels keyboard dragging with Escape', async () => {
    const onDragEnd = vi.fn();
    const user = userEvent.setup();
    render(<DndExample onDragEnd={onDragEnd} onDrop={vi.fn()} />);
    const source = screen.getByRole('button', { name: 'Draggable item' });
    source.focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{Escape}');

    expect(onDragEnd).toHaveBeenLastCalledWith(
      expect.objectContaining({ dropOperation: 'cancel' }),
    );
    expect(source).toHaveFocus();
  });
});
