import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastRegion, type ToastItem } from '../src/components';

const toasts: ToastItem[] = [
  { id: 'saved', title: 'Saved', description: 'Your changes were saved.' },
  { id: 'failed', title: 'Failed', description: 'Try again.', priority: 'assertive' },
];

afterEach(() => vi.useRealTimers());

describe('ToastRegion', () => {
  it('labels notifications and uses polite or assertive live content', () => {
    render(<ToastRegion onDismiss={() => {}} toasts={toasts} />);
    expect(screen.getByRole('region', { name: 'Notifications (2)' })).toBeInTheDocument();
    const dialogs = screen.getAllByRole('alertdialog');
    expect(within(dialogs[0]!).getByRole('status')).toHaveAttribute('aria-atomic', 'true');
    expect(within(dialogs[1]!).getByRole('alert')).toHaveAttribute('aria-atomic', 'true');
  });

  it('dismisses with Escape and moves focus to a remaining toast', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<ToastRegion onDismiss={onDismiss} toasts={toasts} />);
    const saved = screen.getByRole('alertdialog', { name: 'Saved' });
    saved.focus();
    await user.keyboard('{Escape}');
    expect(onDismiss).toHaveBeenLastCalledWith('saved');

    rerender(<ToastRegion onDismiss={onDismiss} toasts={[toasts[1]!]} />);
    await waitFor(() => expect(screen.getByRole('alertdialog', { name: 'Failed' })).toHaveFocus());
  });

  it('restores focus after the final focused toast is removed', async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(
      <div>
        <button>Previous action</button>
        <ToastRegion onDismiss={onDismiss} toasts={[toasts[0]!]} />
      </div>,
    );
    const previous = screen.getByRole('button', { name: 'Previous action' });
    previous.focus();
    screen.getByRole('alertdialog', { name: 'Saved' }).focus();

    rerender(
      <div>
        <button>Previous action</button>
        <ToastRegion onDismiss={onDismiss} toasts={[]} />
      </div>,
    );
    await waitFor(() => expect(previous).toHaveFocus());
  });

  it('pauses timeout dismissal while the region is hovered', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <ToastRegion
        onDismiss={onDismiss}
        toasts={[{ id: 'timed', title: 'Timed', timeout: 100 }]}
      />,
    );
    const region = screen.getByRole('region');
    fireEvent.pointerEnter(region, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.pointerLeave(region, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onDismiss).toHaveBeenLastCalledWith('timed');
  });
});
