import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { useState } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '../src/components';
import { ariaHideOutside } from '../src';

function ModalExample({ onClose = () => undefined }: { onClose?: () => void }) {
  const [isOpen, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open settings</button>
      <p>Background content</p>
      <Modal
        aria-label="Settings"
        isDismissable
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
      >
        <button>Save</button>
        <button>Cancel</button>
      </Modal>
    </div>
  );
}

describe('overlay primitives', () => {
  it('contains focus, dismisses with Escape, and restores trigger focus', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ModalExample onClose={onClose} />);
    const trigger = screen.getByRole('button', { name: 'Open settings' });

    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus());

    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Dismiss dialog' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('dismisses only after an outside pointer interaction', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ModalExample onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Open settings' }));

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByText('Background content'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restores existing aria-hidden values', () => {
    const outside = document.createElement('div');
    outside.setAttribute('aria-hidden', 'false');
    const target = document.createElement('div');
    document.body.append(outside, target);

    const restore = ariaHideOutside([target]);
    expect(outside).toHaveAttribute('aria-hidden', 'true');
    restore();
    expect(outside).toHaveAttribute('aria-hidden', 'false');

    outside.remove();
    target.remove();
  });
});
