import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { useRef, useState } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import {
  getSelection,
  setTokenFieldSelection,
  tokenFieldPositionToDOMRange,
  useToken,
  useTokenField,
  type TokenFieldSegment,
} from '../src';

class TestClipboardData {
  private data = new Map<string, string>();
  getData(type: string) {
    return this.data.get(type) ?? '';
  }
  setData(type: string, value: string) {
    this.data.set(type, value);
  }
  get types() {
    return [...this.data.keys()];
  }
}

function Token({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const token = useToken({}, null, ref);
  return (
    <span {...token.tokenProps} data-selected={token.isSelected || undefined} ref={ref}>
      {text}
    </span>
  );
}

function TokenFieldProbe({ onSubmit = () => {} }: { onSubmit?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<readonly TokenFieldSegment[]>([
    { type: 'text', text: 'Hi ' },
    { type: 'token', text: 'Preact', value: 'preact' },
    { type: 'text', text: ' docs' },
  ]);
  const [isComposing, setComposing] = useState(false);
  const field = useTokenField(
    { description: 'Add topics', label: 'Topics', onSubmit },
    { value, setValue, isComposing, setComposing },
    ref,
  );
  return (
    <>
      <span {...field.labelProps}>Topics</span>
      <div {...field.tokenFieldProps} ref={ref}>
        {value.map((segment, index) =>
          segment.type === 'token' ? (
            <Token key={`${segment.text}-${index}`} text={segment.text} />
          ) : (
            <span data-preact-a11y-text key={`text-${index}`}>
              {segment.text}
            </span>
          ),
        )}
      </div>
      <span {...field.descriptionProps}>Add topics</span>
      <output data-types={value.map((segment) => segment.type).join(',')}>
        {value.map((segment) => segment.text).join('')}
      </output>
    </>
  );
}

function beforeInput(element: Element, inputType: string, data: string | null = null) {
  element.dispatchEvent(
    new InputEvent('beforeinput', { bubbles: true, cancelable: true, data, inputType }),
  );
}

describe('token field primitives', () => {
  it('maps segment positions to DOM ranges and reports atomic token selection', async () => {
    render(<TokenFieldProbe />);
    const field = screen.getByRole('textbox', { name: 'Topics' });
    const token = field.querySelector<HTMLElement>('[data-preact-a11y-token]')!;
    const selectionChange = vi.fn();
    document.addEventListener('selectionchange', selectionChange, { once: true });

    setTokenFieldSelection(field, { index: 1, offset: 0 }, { index: 1, offset: 6 }, true);
    expect(getSelection(field)).toEqual([
      { index: 1, offset: 0 },
      { index: 1, offset: 6 },
    ]);
    expect(selectionChange).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(token).toHaveAttribute('data-selected'));

    const range = tokenFieldPositionToDOMRange(field, { index: 2, offset: 2 });
    expect(range.collapsed).toBe(true);
    expect(range.startContainer.textContent).toContain(' docs');
  });

  it('edits text and removes adjacent tokens as atomic segments', async () => {
    render(<TokenFieldProbe />);
    const field = screen.getByRole('textbox', { name: 'Topics' });
    field.focus();
    setTokenFieldSelection(field, { index: 0, offset: 3 }, { index: 0, offset: 3 });
    beforeInput(field, 'insertText', 'there ');
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Hi there Preact docs'),
    );

    setTokenFieldSelection(field, { index: 2, offset: 0 }, { index: 2, offset: 0 });
    beforeInput(field, 'deleteContentBackward');
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveAttribute('data-types', 'text');
      expect(screen.getByRole('status')).toHaveTextContent('Hi there docs');
    });

    const text = field.querySelector<HTMLElement>('[data-preact-a11y-text]')!;
    // `fireEvent.composition*` guesses Preact 10's `CompositionStart` casing; dispatch the real events.
    field.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    text.textContent = 'Bonjour docs';
    field.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Bonjour docs'));
  });

  it('preserves token structure across clipboard copy and paste', async () => {
    render(<TokenFieldProbe />);
    const field = screen.getByRole('textbox', { name: 'Topics' });
    const clipboard = new TestClipboardData();
    setTokenFieldSelection(field, { index: 1, offset: 0 }, { index: 1, offset: 6 });
    fireEvent.copy(field, { clipboardData: clipboard });
    expect(clipboard.getData('text/plain')).toBe('Preact');
    expect(clipboard.getData('application/vnd.preact-a11y.tokens+json')).toContain('"token"');

    setTokenFieldSelection(field, { index: 2, offset: 5 }, { index: 2, offset: 5 });
    fireEvent.paste(field, { clipboardData: clipboard });
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveAttribute(
        'data-types',
        'text,token,text,token,text',
      ),
    );
  });

  it('focuses from its label and submits a single-line field with Enter', () => {
    const onSubmit = vi.fn();
    render(<TokenFieldProbe onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText('Topics'));
    const field = screen.getByRole('textbox', { name: 'Topics' });
    expect(field).toHaveFocus();
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
