import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Breadcrumb, Breadcrumbs, Dialog, Toolbar } from '../src/components';

describe('structural primitives', () => {
  it('labels breadcrumb navigation and marks the current page', () => {
    render(
      <Breadcrumbs>
        <Breadcrumb href="/">Home</Breadcrumb>
        <Breadcrumb isCurrent>Settings</Breadcrumb>
      </Breadcrumbs>,
    );

    expect(screen.getByRole('navigation', { name: 'Breadcrumbs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Settings')).toHaveAttribute('aria-current', 'page');
  });

  it('associates a dialog with its title', () => {
    render(<Dialog title="Details">Dialog content</Dialog>);
    expect(screen.getByRole('dialog', { name: 'Details' })).toHaveTextContent('Dialog content');
  });

  it('moves toolbar focus with orientation-aware arrow keys', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar aria-label="Editing tools">
        <button>Bold</button>
        <button disabled>Unavailable</button>
        <button>Italic</button>
      </Toolbar>,
    );
    const bold = screen.getByRole('button', { name: 'Bold' });
    bold.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(bold).toHaveFocus();
  });
});
