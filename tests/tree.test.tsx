import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tree, TreeItem } from '../src/components';

describe('Tree', () => {
  it('expands, enters children, returns to parents, and exposes hierarchy metadata', async () => {
    const onExpandedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Tree aria-label="Files" onExpandedChange={onExpandedChange}>
        <TreeItem id="documents" title="Documents">
          <TreeItem id="reports" title="Reports" />
          <TreeItem id="drafts" isDisabled title="Drafts" />
        </TreeItem>
        <TreeItem id="settings" title="Settings" />
      </Tree>,
    );
    const tree = screen.getByRole('treegrid', { name: 'Files' });
    await user.click(tree);
    const documents = screen.getByRole('row', { name: /Documents/ });
    expect(documents).toHaveAttribute('aria-level', '1');
    expect(documents).toHaveAttribute('aria-posinset', '1');
    expect(documents).toHaveAttribute('aria-setsize', '2');
    expect(documents).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard('{ArrowRight}');
    expect(documents).toHaveAttribute('aria-expanded', 'true');
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(['documents']));
    const reports = screen.getByRole('row', { name: 'Reports' });
    expect(reports).toHaveAttribute('aria-level', '2');

    await user.keyboard('{ArrowRight}');
    expect(tree).toHaveAttribute('aria-activedescendant', expect.stringMatching(/reports/));
    await user.keyboard('{ArrowLeft}');
    expect(tree).toHaveAttribute('aria-activedescendant', expect.stringMatching(/documents/));
    await user.keyboard('{ArrowLeft}');
    expect(documents).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('row', { name: 'Reports' })).not.toBeInTheDocument();
  });

  it('skips disabled visible nodes and supports selection and typeahead', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Tree
        aria-label="Pages"
        defaultExpandedKeys={['content']}
        onSelectionChange={onSelectionChange}
        selectionMode="multiple"
      >
        <TreeItem id="content" title="Content">
          <TreeItem id="archived" isDisabled title="Archived" />
          <TreeItem id="blog" title="Blog" />
        </TreeItem>
        <TreeItem id="settings" title="Settings" />
      </Tree>,
    );
    const tree = screen.getByRole('treegrid');
    await user.click(tree);
    await user.keyboard('{ArrowDown}');
    expect(tree).toHaveAttribute('aria-activedescendant', expect.stringMatching(/blog/));
    await user.keyboard(' ');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['blog']));
    await user.keyboard('s');
    expect(tree).toHaveAttribute('aria-activedescendant', expect.stringMatching(/settings/));
  });

  it('uses F2 and Escape to enter and leave controls within a row', async () => {
    const user = userEvent.setup();
    render(
      <Tree aria-label="Actions">
        <TreeItem id="report" title={<button>Rename report</button>} />
      </Tree>,
    );
    const tree = screen.getByRole('treegrid');
    await user.click(tree);
    await user.keyboard('{F2}');
    const rename = screen.getByRole('button', { name: 'Rename report' });
    expect(rename).toHaveFocus();
    expect(rename).toHaveAttribute('tabindex', '-1');
    await user.keyboard('{Escape}');
    expect(tree).toHaveFocus();
  });
});
