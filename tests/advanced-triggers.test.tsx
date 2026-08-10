import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import {
  I18nProvider,
  usePreviewTrigger,
  useSubmenuTrigger,
  type SubmenuFocusStrategy,
} from '../src';

function SubmenuProbeInner() {
  const parentMenuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [focusStrategy, setFocusStrategy] = useState<SubmenuFocusStrategy>();
  const aria = useSubmenuTrigger(
    { delay: 10, parentMenuRef, submenuRef },
    {
      isOpen,
      focusStrategy,
      submenuLevel: 2,
      open(strategy) {
        setFocusStrategy(strategy);
        setOpen(true);
      },
      close() {
        setOpen(false);
      },
    },
    triggerRef,
  );
  const { autoFocus, submenuLevel, ...submenuProps } = aria.submenuProps;

  return (
    <>
      <div ref={parentMenuRef} role="menu">
        <div {...aria.submenuTriggerProps} ref={triggerRef} role="menuitem" tabIndex={0}>
          Export
        </div>
        <div role="menuitem" tabIndex={-1}>
          Print
        </div>
      </div>
      {isOpen && (
        <div
          {...submenuProps}
          data-auto-focus={autoFocus}
          data-level={submenuLevel}
          ref={submenuRef}
          role="menu"
          tabIndex={-1}
        >
          <button>PDF</button>
        </div>
      )}
    </>
  );
}

function SubmenuProbe({ locale = 'en-US' }: { locale?: string }) {
  return (
    <I18nProvider locale={locale}>
      <SubmenuProbeInner />
    </I18nProvider>
  );
}

function PreviewProbe() {
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const aria = usePreviewTrigger(
    { closeDelay: 10, delay: 10, popoverRef, triggerRef },
    { isOpen, open: () => setOpen(true), close: () => setOpen(false) },
  );
  const { isNonModal: _, ...popoverProps } = aria.popoverProps;
  return (
    <>
      <a {...aria.triggerProps} href="/article" ref={triggerRef}>
        Article
      </a>
      {isOpen && (
        <div {...popoverProps} ref={popoverRef}>
          <button>Read preview</button>
        </div>
      )}
    </>
  );
}

describe('advanced controlled triggers', () => {
  it('opens and closes a submenu with directional keyboard focus handoff', async () => {
    const user = userEvent.setup();
    render(<SubmenuProbe />);
    const trigger = screen.getByRole('menuitem', { name: 'Export' });
    trigger.focus();

    await user.keyboard('{ArrowRight}');
    const submenu = screen.getByRole('menu', { name: 'Export' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(submenu).toHaveAttribute('data-level', '2');
    expect(submenu).toHaveAttribute('data-auto-focus', 'first');
    await Promise.resolve();
    expect(submenu).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.queryByRole('menu', { name: 'Export' })).not.toBeInTheDocument();
    await Promise.resolve();
    expect(trigger).toHaveFocus();
  });

  it('reverses submenu arrow keys in RTL and closes when parent focus moves', async () => {
    const user = userEvent.setup();
    render(<SubmenuProbe locale="ar" />);
    const trigger = screen.getByRole('menuitem', { name: 'Export' });
    trigger.focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('menu', { name: 'Export' })).toBeInTheDocument();

    screen.getByRole('menuitem', { name: 'Print' }).focus();
    await waitFor(() =>
      expect(screen.queryByRole('menu', { name: 'Export' })).not.toBeInTheDocument(),
    );
  });

  it('keeps an interactive preview open across pointer and keyboard handoff', async () => {
    vi.useFakeTimers();
    render(<PreviewProbe />);
    const trigger = screen.getByRole('link', { name: 'Article' });

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    await vi.advanceTimersByTimeAsync(10);
    const dialog = screen.getByRole('dialog');
    expect(trigger).toHaveAttribute('aria-controls', dialog.id);
    expect(trigger).toHaveAttribute('aria-describedby', dialog.id);

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    fireEvent.pointerEnter(dialog, { pointerType: 'mouse' });
    await vi.advanceTimersByTimeAsync(20);
    expect(dialog).toBeInTheDocument();

    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Read preview' })).toHaveFocus();

    vi.useRealTimers();
  });
});
