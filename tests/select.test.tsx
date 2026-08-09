import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select, SelectItem } from '../src/components';

describe('select primitives', () => {
  it('selects an option and synchronizes the hidden form control', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Select label="Animal" name="animal" onSelectionChange={onSelectionChange}>
        <SelectItem id="cat">Cat</SelectItem>
        <SelectItem id="dog">Dog</SelectItem>
      </Select>,
    );
    const trigger = screen.getByRole('button', { name: /Animal/ });

    await user.click(trigger);
    const listbox = screen.getByRole('listbox', { name: 'Animal' });
    await waitFor(() => expect(listbox).toHaveFocus());
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onSelectionChange).toHaveBeenLastCalledWith('dog');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent('Dog');
    expect(container.querySelector('select')).toHaveValue('dog');
  });

  it('opens to the last option with ArrowUp and restores focus on Escape', async () => {
    const user = userEvent.setup();
    render(
      <Select label="Color">
        <SelectItem id="red">Red</SelectItem>
        <SelectItem id="blue">Blue</SelectItem>
      </Select>,
    );
    const trigger = screen.getByRole('button', { name: /Color/ });
    trigger.focus();
    await user.keyboard('{ArrowUp}');
    const listbox = screen.getByRole('listbox', { name: 'Color' });
    await waitFor(() =>
      expect(listbox).toHaveAttribute('aria-activedescendant', expect.stringContaining('blue')),
    );

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
