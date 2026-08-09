import { render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { isTextDropItem, useClipboard, type DragItem, type DropItem } from '../src';

class TestDataTransfer {
  private data = new Map<string, string>();
  items = [] as unknown as DataTransferItemList;

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

function dispatchClipboard(target: Element, type: string, clipboardData: TestDataTransfer) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: clipboardData });
  target.dispatchEvent(event);
  return event;
}

function ClipboardTarget({
  getItems,
  isDisabled,
  onCopy,
  onCut,
  onPaste,
}: {
  getItems: (details: { action: 'cut' | 'copy' }) => DragItem[];
  isDisabled?: boolean;
  onCopy: () => void;
  onCut: () => void;
  onPaste: (items: DropItem[]) => void;
}) {
  const { clipboardProps } = useClipboard({ getItems, isDisabled, onCopy, onCut, onPaste });
  return (
    <div
      {...clipboardProps}
      aria-label="Clipboard target"
      aria-readonly="true"
      role="textbox"
      tabIndex={0}
    >
      Clipboard target
    </div>
  );
}

describe('clipboard primitives', () => {
  it('serializes multiple representations and restores typed paste items', async () => {
    const actions: string[] = [];
    const onCopy = vi.fn();
    const onCut = vi.fn();
    const onPaste = vi.fn();
    const getItems = vi.fn(({ action }: { action: 'cut' | 'copy' }): DragItem[] => {
      actions.push(action);
      return [
        { 'text/plain': 'First', 'application/json': '{"id":1}' },
        { 'text/plain': 'Second' },
      ];
    });
    render(<ClipboardTarget getItems={getItems} onCopy={onCopy} onCut={onCut} onPaste={onPaste} />);
    const target = screen.getByRole('textbox', { name: 'Clipboard target' });
    target.focus();

    const copyData = new TestDataTransfer();
    const beforeCopy = dispatchClipboard(target, 'beforecopy', copyData);
    expect(beforeCopy.defaultPrevented).toBe(true);
    const copy = dispatchClipboard(target, 'copy', copyData);
    expect(copy.defaultPrevented).toBe(true);
    expect(copyData.getData('text/plain')).toBe('First\nSecond');
    expect(onCopy).toHaveBeenCalledTimes(1);

    dispatchClipboard(target, 'cut', new TestDataTransfer());
    expect(onCut).toHaveBeenCalledTimes(1);
    expect(actions).toEqual(['copy', 'cut']);

    dispatchClipboard(target, 'paste', copyData);
    expect(onPaste).toHaveBeenCalledTimes(1);
    const pasted = onPaste.mock.calls[0]![0];
    expect(pasted).toHaveLength(2);
    expect(pasted.every(isTextDropItem)).toBe(true);
    expect(await pasted[0]!.getText('application/json')).toBe('{"id":1}');
    expect(await pasted[1]!.getText('text/plain')).toBe('Second');
  });

  it('ignores events while disabled or unfocused', () => {
    const onCopy = vi.fn();
    const props = {
      getItems: () => [{ 'text/plain': 'Value' }],
      onCopy,
      onCut: vi.fn(),
      onPaste: vi.fn(),
    };
    const view = render(<ClipboardTarget {...props} />);
    const target = screen.getByRole('textbox', { name: 'Clipboard target' });

    dispatchClipboard(target, 'copy', new TestDataTransfer());
    expect(onCopy).not.toHaveBeenCalled();
    target.focus();
    view.rerender(<ClipboardTarget {...props} isDisabled />);
    dispatchClipboard(target, 'copy', new TestDataTransfer());
    expect(onCopy).not.toHaveBeenCalled();
  });
});
