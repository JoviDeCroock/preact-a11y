import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'preact/hooks';
import { useModalOverlay, useOverlayPosition } from '../src';
import { Button, Popover } from '../src/components';

function rect(x: number, y: number, width: number, height: number): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    toJSON: () => ({}),
  };
}

afterEach(() => vi.restoreAllMocks());

describe('popover primitives', () => {
  it('links a trigger, contains focus, dismisses, and restores trigger focus', async () => {
    const user = userEvent.setup();
    render(
      <Popover aria-label="Help" content={<Button>Inside action</Button>} placement="bottom">
        <Button>Open help</Button>
      </Popover>,
    );
    const trigger = screen.getByRole('button', { name: 'Open help' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Help' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', dialog.id);
    expect(screen.getByRole('button', { name: 'Inside action' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Help' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('dismisses outside interaction while a non-modal popover leaves siblings exposed', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button>Outside</button>
        <Popover aria-label="Details" content="Popover details" isNonModal>
          <button>Open details</button>
        </Popover>
      </div>,
    );
    const outside = screen.getByRole('button', { name: 'Outside' });
    await user.click(screen.getByRole('button', { name: 'Open details' }));
    expect(outside).not.toHaveAttribute('aria-hidden');
    await user.click(outside);
    expect(screen.queryByRole('dialog', { name: 'Details' })).not.toBeInTheDocument();
  });

  it('flips and clamps an overlay when the preferred side has insufficient room', async () => {
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(800);
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(800);

    function Fixture() {
      const targetRef = useRef<HTMLButtonElement>(null);
      const overlayRef = useRef<HTMLDivElement>(null);
      const result = useOverlayPosition({
        targetRef,
        overlayRef,
        isOpen: true,
        placement: 'bottom',
        offset: 8,
      });
      return (
        <>
          <button
            ref={(element) => {
              (targetRef as { current: HTMLButtonElement | null }).current = element;
              if (element) element.getBoundingClientRect = () => rect(100, 700, 100, 40);
            }}
          >
            Target
          </button>
          <div
            {...result.overlayProps}
            data-testid="positioned"
            ref={(element) => {
              (overlayRef as { current: HTMLDivElement | null }).current = element;
              if (element) element.getBoundingClientRect = () => rect(0, 0, 200, 200);
            }}
          />
        </>
      );
    }

    render(<Fixture />);
    const overlay = screen.getByTestId('positioned');
    await waitFor(() => expect(overlay).toHaveAttribute('data-placement', 'top'));
    expect(overlay).toHaveStyle({ left: '50px', top: '492px' });
  });

  it('composes modal semantics, dismissal, and scroll locking', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    function ModalFixture() {
      const ref = useRef<HTMLDivElement>(null);
      const result = useModalOverlay(
        { isOpen: true, isDismissable: true, 'aria-label': 'Hook modal', onClose },
        ref,
      );
      return (
        <div {...result.modalProps} ref={ref} tabIndex={-1}>
          Modal content
        </div>
      );
    }
    render(<ModalFixture />);
    const modal = screen.getByRole('dialog', { name: 'Hook modal' });
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(document.documentElement.style.overflow).toBe('hidden');
    modal.focus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
