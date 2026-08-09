import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { useListBoxSection, useMenuSection } from '../src';

function ListBoxSection() {
  const section = useListBoxSection({ heading: 'European cities' });
  return (
    <div {...section.itemProps}>
      <div {...section.headingProps}>European cities</div>
      <div {...section.groupProps}>
        <div role="option">Antwerp</div>
      </div>
    </div>
  );
}

function MenuSection() {
  const section = useMenuSection({ 'aria-label': 'File actions' });
  return (
    <div {...section.itemProps}>
      <div {...section.groupProps}>
        <div role="menuitem">Save</div>
      </div>
    </div>
  );
}

describe('collection section hooks', () => {
  it('labels a listbox group with a presentational visual heading', () => {
    render(<ListBoxSection />);
    const heading = screen.getByText('European cities');
    const group = screen.getByRole('group', { name: 'European cities' });

    expect(heading).toHaveAttribute('role', 'presentation');
    expect(group).toHaveAttribute('aria-labelledby', heading.id);
    expect(fireEvent.mouseDown(heading)).toBe(false);
  });

  it('supports directly labeled menu groups without a heading', () => {
    render(<MenuSection />);
    const group = screen.getByRole('group', { name: 'File actions' });

    expect(group).not.toHaveAttribute('aria-labelledby');
    expect(screen.getByRole('menuitem', { name: 'Save' })).toBeInTheDocument();
  });
});
