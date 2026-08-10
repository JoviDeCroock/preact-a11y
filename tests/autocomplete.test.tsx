import { fireEvent, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import { useAutocomplete } from '../src';

function AutocompleteFixture({ onAction = () => {} }: { onAction?: (value: string) => void }) {
  const [inputValue, setInputValue] = useState('');
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const collectionRef = useRef<HTMLUListElement>(null);
  const { inputProps, collectionProps, filter } = useAutocomplete(
    {
      inputRef,
      collectionRef,
      filter: (text, input) => text.toLocaleLowerCase().includes(input.toLocaleLowerCase()),
    },
    { inputValue, focusedNodeId, setInputValue, setFocusedNodeId },
  );
  const { shouldUseVirtualFocus, disallowTypeAhead, ...domCollectionProps } = collectionProps;

  return (
    <>
      <label for="autocomplete-input">Search</label>
      <input {...inputProps} ref={inputRef} id="autocomplete-input" />
      <ul
        {...domCollectionProps}
        ref={collectionRef}
        role="listbox"
        data-virtual-focus={String(shouldUseVirtualFocus)}
        data-disallow-typeahead={String(disallowTypeAhead)}
      >
        {['Apple', 'Banana', 'Cherry']
          .filter((name) => filter?.(name, { id: name }) ?? true)
          .map((name) => (
            <li id={`option-${name}`} key={name} role="option" onClick={() => onAction(name)}>
              {name}
            </li>
          ))}
      </ul>
      <output>{focusedNodeId ?? 'none'}</output>
    </>
  );
}

describe('useAutocomplete', () => {
  it('filters, moves virtual focus, and activates the focused option', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<AutocompleteFixture onAction={onAction} />);
    const input = screen.getByRole('combobox');

    await user.type(input, 'a');
    expect(input).toHaveAttribute('aria-activedescendant', 'option-Apple');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('option', { name: 'Cherry' })).not.toBeInTheDocument();

    await user.keyboard('{ArrowDown}{Enter}');
    expect(input).toHaveAttribute('aria-activedescendant', 'option-Banana');
    expect(onAction).toHaveBeenCalledWith('Banana');
  });

  it('skips disabled options and clears virtual focus for cursor navigation', () => {
    render(<AutocompleteFixture />);
    const input = screen.getByRole('combobox');
    const banana = screen.getByRole('option', { name: 'Banana' });
    banana.setAttribute('aria-disabled', 'true');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', 'option-Cherry');

    fireEvent.keyDown(input, { key: 'ArrowLeft' });
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });
});
