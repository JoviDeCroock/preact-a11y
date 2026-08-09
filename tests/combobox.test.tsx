import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ComboBox, ComboBoxItem } from '../src/components';

describe('combobox', () => {
  it('filters options while retaining input focus and selects the active option', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <ComboBox label="Animal" name="animal" onSelectionChange={onSelectionChange}>
        <ComboBoxItem id="cat">Cat</ComboBoxItem>
        <ComboBoxItem id="dog">Dog</ComboBoxItem>
      </ComboBox>,
    );
    const input = screen.getByRole('combobox', { name: 'Animal' });

    await user.type(input, 'do');
    expect(input).toHaveFocus();
    expect(screen.getByRole('option', { name: 'Dog' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Cat' })).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-activedescendant', expect.stringContaining('dog'));

    await user.keyboard('{Enter}');
    expect(input).toHaveValue('Dog');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onSelectionChange).toHaveBeenLastCalledWith('dog');
    expect(container.querySelector('select')).toHaveValue('dog');
  });

  it('opens with arrows, skips disabled options, and closes with Escape', async () => {
    const user = userEvent.setup();
    render(
      <ComboBox label="City">
        <ComboBoxItem id="antwerp" isDisabled>
          Antwerp
        </ComboBoxItem>
        <ComboBoxItem id="brussels">Brussels</ComboBoxItem>
      </ComboBox>,
    );
    const input = screen.getByRole('combobox', { name: 'City' });
    input.focus();
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', expect.stringContaining('brussels'));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });
});
