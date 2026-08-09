import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  GridList,
  GridListItem,
  GridListSection,
  GridListSelectionCheckbox,
} from '../src/components';

describe('GridList', () => {
  it('navigates enabled rows, selects, clears, and invokes row actions', async () => {
    const onSelectionChange = vi.fn();
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(
      <GridList
        aria-label="Projects"
        defaultSelectedKeys={['alpha']}
        onAction={onAction}
        onSelectionChange={onSelectionChange}
        selectionMode="multiple"
      >
        <GridListItem id="alpha" textValue="Alpha">
          Alpha <GridListSelectionCheckbox /> <button>Open Alpha</button>
        </GridListItem>
        <GridListItem id="beta" isDisabled textValue="Beta">
          Beta
        </GridListItem>
        <GridListItem id="gamma" textValue="Gamma">
          Gamma <GridListSelectionCheckbox /> <button>Open Gamma</button>
        </GridListItem>
      </GridList>,
    );
    const grid = screen.getByRole('grid', { name: 'Projects' });
    await user.click(grid);
    expect(grid).toHaveAttribute('aria-activedescendant', expect.stringMatching(/alpha/));

    await user.keyboard('{ArrowDown}');
    expect(grid).toHaveAttribute('aria-activedescendant', expect.stringMatching(/gamma/));
    await user.keyboard(' ');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['alpha', 'gamma']));
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenLastCalledWith('gamma');
    await user.keyboard('{Escape}');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
  });

  it('moves into nested controls without turning their interaction into a row press', async () => {
    const onSelectionChange = vi.fn();
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(
      <GridList
        aria-label="Files"
        onAction={onAction}
        onSelectionChange={onSelectionChange}
        selectionMode="multiple"
      >
        <GridListItem id="report" textValue="Report">
          Report <GridListSelectionCheckbox /> <button>More actions</button>
        </GridListItem>
      </GridList>,
    );
    const grid = screen.getByRole('grid');
    await user.click(grid);
    await user.keyboard('{ArrowRight}');
    const checkbox = screen.getByRole('checkbox', { name: 'Select Report' });
    expect(checkbox).toHaveAttribute('tabindex', '-1');
    expect(checkbox).toHaveFocus();
    await user.keyboard(' ');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['report']));
    expect(onAction).not.toHaveBeenCalled();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'More actions' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(checkbox).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(grid).toHaveFocus();
  });

  it('labels row groups from section headings', () => {
    render(
      <GridList aria-label="Bookmarks">
        <GridListSection heading="Favorites" id="favorites">
          <GridListItem id="docs">Documentation</GridListItem>
        </GridListSection>
      </GridList>,
    );
    expect(screen.getByRole('rowgroup', { name: 'Favorites' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: 'Documentation' })).toBeInTheDocument();
  });
});
