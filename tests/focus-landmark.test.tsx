import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import {
  FocusRing,
  FocusScope,
  Focusable,
  Pressable,
  UNSTABLE_createLandmarkController,
  useFocusManager,
  useLandmark,
  type AriaLandmarkRole,
  type FocusManager,
} from '../src';

function Landmark({
  children,
  label,
  role,
}: {
  children: ComponentChildren;
  label: string;
  role: AriaLandmarkRole;
}) {
  const ref = useRef<HTMLElement>(null);
  const { landmarkProps } = useLandmark({ role, 'aria-label': label }, ref);
  return (
    <section {...landmarkProps} ref={ref}>
      {children}
    </section>
  );
}

function CaptureManager({ capture }: { capture: (manager: FocusManager | undefined) => void }) {
  capture(useFocusManager());
  return null;
}

describe('focus composition', () => {
  it('composes autofocus, keyboard handlers, disabled focus, and Preact refs', async () => {
    const childKeyDown = vi.fn();
    const focusableKeyDown = vi.fn();
    const elementRef = vi.fn();
    const { rerender } = render(
      <Focusable autoFocus elementRef={elementRef} onKeyDown={focusableKeyDown}>
        <button className="existing" onKeyDown={childKeyDown}>
          Focusable action
        </button>
      </Focusable>,
    );
    const button = screen.getByRole('button', { name: 'Focusable action' });

    await waitFor(() => expect(button).toHaveFocus());
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    expect(childKeyDown).toHaveBeenCalledTimes(1);
    expect(focusableKeyDown).toHaveBeenCalledTimes(1);
    expect(elementRef).toHaveBeenCalledWith(button);

    rerender(
      <Focusable isDisabled elementRef={elementRef} onKeyDown={focusableKeyDown}>
        <button className="existing" onKeyDown={childKeyDown}>
          Focusable action
        </button>
      </Focusable>,
    );
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    expect(childKeyDown).toHaveBeenCalledTimes(2);
    expect(focusableKeyDown).toHaveBeenCalledTimes(1);
  });

  it('adds press behavior without losing child events or refs', async () => {
    const onPress = vi.fn();
    const onClick = vi.fn();
    const elementRef = vi.fn();
    const user = userEvent.setup();
    render(
      <Pressable elementRef={elementRef} onPress={onPress}>
        <div onClick={onClick} role="button" tabIndex={0}>
          Composed action
        </div>
      </Pressable>,
    );
    const button = screen.getByRole('button', { name: 'Composed action' });

    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(elementRef).toHaveBeenCalledWith(button);

    button.focus();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('applies focus and keyboard-focus classes without wrapper markup', async () => {
    const user = userEvent.setup();
    render(
      <>
        <FocusRing focusClass="focused" focusRingClass="focus-ring">
          <button className="existing">Ring target</button>
        </FocusRing>
        <button>Outside</button>
      </>,
    );
    const target = screen.getByRole('button', { name: 'Ring target' });

    await user.tab();
    expect(target).toHaveClass('existing', 'focused', 'focus-ring');
    await user.click(target);
    expect(target).toHaveClass('existing', 'focused');
    expect(target).not.toHaveClass('focus-ring');
    await user.tab();
    expect(target).toHaveClass('existing');
    expect(target).not.toHaveClass('focused', 'focus-ring');
  });

  it('moves focus within the nearest scope and supports filtering and wrapping', () => {
    let manager: FocusManager | undefined;
    render(
      <FocusScope>
        <CaptureManager capture={(value) => (manager = value)} />
        <button>First</button>
        <button disabled>Disabled</button>
        <button tabIndex={-1}>Programmatic</button>
        <button>Last</button>
      </FocusScope>,
    );

    expect(manager?.focusFirst({ tabbable: true })).toBe(
      screen.getByRole('button', { name: 'First' }),
    );
    expect(manager?.focusNext({ tabbable: true })).toBe(
      screen.getByRole('button', { name: 'Last' }),
    );
    expect(manager?.focusNext({ tabbable: true, wrap: true })).toBe(
      screen.getByRole('button', { name: 'First' }),
    );
    expect(manager?.focusLast({ accept: (node) => node.textContent === 'Programmatic' })).toBe(
      screen.getByRole('button', { name: 'Programmatic' }),
    );
  });
});

describe('landmark navigation', () => {
  it('cycles registered landmarks with F6 and supports imperative main focus', () => {
    render(
      <>
        <button>Before landmarks</button>
        <Landmark label="Application" role="main">
          Main content
        </Landmark>
        <Landmark label="Project navigation" role="navigation">
          Navigation content
        </Landmark>
      </>,
    );
    const before = screen.getByRole('button', { name: 'Before landmarks' });
    const main = screen.getByRole('main', { name: 'Application' });
    const navigation = screen.getByRole('navigation', { name: 'Project navigation' });

    before.focus();
    fireEvent.keyDown(document, { key: 'F6' });
    expect(main).toHaveFocus();
    fireEvent.keyDown(document, { key: 'F6' });
    expect(navigation).toHaveFocus();
    fireEvent.keyDown(document, { key: 'F6', shiftKey: true });
    expect(main).toHaveFocus();

    navigation.focus();
    const controller = UNSTABLE_createLandmarkController();
    expect(controller.focusMain()).toBe(true);
    expect(main).toHaveFocus();
    expect(controller.focusPrevious()).toBe(true);
    expect(navigation).toHaveFocus();
    controller.dispose();
    expect(controller.focusNext()).toBe(false);
  });
});
