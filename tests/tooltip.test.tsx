import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, Tooltip } from '../src/components';

describe('Tooltip', () => {
  it('opens after a hover delay and remains available while hovered', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip closeDelay={100} content="Copies the current URL" delay={10}>
        <Button>Copy link</Button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Copy link' });
    await user.hover(trigger);
    const tooltip = await screen.findByRole('tooltip');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);

    await user.unhover(trigger);
    await user.hover(tooltip);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(tooltip).toBeInTheDocument();

    await user.unhover(tooltip);
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });

  it('opens immediately for keyboard focus and dismisses with Escape', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Tooltip content="Keyboard shortcut: S" onOpenChange={onOpenChange}>
        <Button aria-describedby="persistent-help">Save</Button>
      </Tooltip>,
    );
    await user.tab();
    const trigger = screen.getByRole('button', { name: 'Save' });
    const tooltip = screen.getByRole('tooltip');
    expect(trigger.getAttribute('aria-describedby')).toContain('persistent-help');
    expect(trigger.getAttribute('aria-describedby')).toContain(tooltip.id);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('does not open from pointer focus when a trigger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="More information" delay={0}>
        <Button>Details</Button>
      </Tooltip>,
    );
    await user.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
