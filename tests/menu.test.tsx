import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Menu, MenuItem, MenuTrigger } from '../src/components';

describe('menu primitives', () => {
  it('navigates, skips disabled items, and dispatches actions', async () => {
    const onAction = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Menu aria-label="Actions" onAction={onAction} onClose={onClose}>
        <MenuItem id="edit">Edit</MenuItem>
        <MenuItem id="delete" isDisabled>
          Delete
        </MenuItem>
        <MenuItem id="duplicate">Duplicate</MenuItem>
      </Menu>,
    );

    const menu = screen.getByRole('menu', { name: 'Actions' });
    await waitFor(() => expect(menu).toHaveFocus());
    expect(menu).toHaveAttribute('aria-activedescendant', expect.stringContaining('edit'));

    await user.keyboard('{ArrowDown}{Enter}');
    expect(onAction).toHaveBeenLastCalledWith('duplicate');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('opens from arrow keys, dismisses with Escape, and restores trigger focus', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <MenuTrigger label="More actions" onOpenChange={onOpenChange}>
        <MenuItem id="first">First</MenuItem>
        <MenuItem id="last">Last</MenuItem>
      </MenuTrigger>,
    );
    const trigger = screen.getByRole('button', { name: 'More actions' });
    trigger.focus();

    await user.keyboard('{ArrowUp}');
    const menu = screen.getByRole('menu', { name: 'More actions' });
    await waitFor(() => expect(menu).toHaveFocus());
    expect(menu).toHaveAttribute('aria-activedescendant', expect.stringContaining('last'));

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('supports checkbox and radio menu item state', () => {
    render(
      <Menu aria-label="View" selectedKeys={['sidebar', 'comfortable']}>
        <MenuItem id="sidebar" type="checkbox">
          Sidebar
        </MenuItem>
        <MenuItem id="comfortable" type="radio">
          Comfortable
        </MenuItem>
      </Menu>,
    );

    expect(screen.getByRole('menuitemcheckbox', { name: 'Sidebar' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Comfortable' })).toBeChecked();
  });
});
