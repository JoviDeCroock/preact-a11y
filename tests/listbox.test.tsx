import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListBox, Option } from '../src/components';

describe('listbox', () => {
  it('navigates enabled options and selects with the keyboard', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ListBox aria-label="Cities" onSelectionChange={onSelectionChange}>
        <Option id="antwerp">Antwerp</Option>
        <Option id="brussels" isDisabled>
          Brussels
        </Option>
        <Option id="ghent">Ghent</Option>
      </ListBox>,
    );

    const listbox = screen.getByRole('listbox', { name: 'Cities' });
    listbox.focus();
    await waitFor(() =>
      expect(listbox).toHaveAttribute('aria-activedescendant', expect.stringContaining('antwerp')),
    );

    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByRole('option', { name: 'Ghent' })).toHaveAttribute('aria-selected', 'true');
    expect(onSelectionChange.mock.calls.at(-1)?.[0]).toEqual(new Set(['ghent']));

    await user.keyboard('a');
    expect(listbox).toHaveAttribute('aria-activedescendant', expect.stringContaining('antwerp'));
  });

  it('toggles multiple selections by pointer', async () => {
    const user = userEvent.setup();
    render(
      <ListBox aria-label="Toppings" selectionMode="multiple">
        <Option id="cheese">Cheese</Option>
        <Option id="mushrooms">Mushrooms</Option>
      </ListBox>,
    );

    const cheese = screen.getByRole('option', { name: 'Cheese' });
    const mushrooms = screen.getByRole('option', { name: 'Mushrooms' });
    await user.click(cheese);
    await user.click(mushrooms);
    expect(cheese).toHaveAttribute('aria-selected', 'true');
    expect(mushrooms).toHaveAttribute('aria-selected', 'true');
    await user.click(cheese);
    expect(cheese).toHaveAttribute('aria-selected', 'false');
  });
});
