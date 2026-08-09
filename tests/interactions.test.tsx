import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { useRef } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import { useFocusRing, useFocusWithin, useInteractOutside, useKeyboard, usePress } from '../src';

function CustomButton({ onPress }: { onPress: () => void }) {
  const { pressProps } = usePress({ onPress });
  return (
    <div {...pressProps} role="button" tabIndex={0}>
      Custom action
    </div>
  );
}

function Focusable() {
  const { focusProps, isFocusVisible } = useFocusRing();
  return (
    <button {...focusProps} data-focus-visible={isFocusVisible || undefined}>
      Focus me
    </button>
  );
}

function FocusWithinExample({ onChange }: { onChange: (value: boolean) => void }) {
  const { focusWithinProps, isFocusWithin } = useFocusWithin({ onFocusWithinChange: onChange });
  return (
    <div {...focusWithinProps} data-within={isFocusWithin || undefined}>
      <button>First child</button>
      <button>Second child</button>
    </div>
  );
}

function OutsideExample({ onOutside }: { onOutside: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useInteractOutside({ ref, onInteractOutside: onOutside });
  return <div ref={ref}>Inside</div>;
}

describe('interaction primitives', () => {
  it('adds keyboard activation to non-native pressable elements', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(<CustomButton onPress={onPress} />);

    const button = screen.getByRole('button', { name: 'Custom action' });
    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('shows focus rings for keyboard focus but not pointer focus', async () => {
    const user = userEvent.setup();
    render(<Focusable />);
    const button = screen.getByRole('button', { name: 'Focus me' });

    await user.tab();
    expect(button).toHaveAttribute('data-focus-visible');

    await user.click(button);
    expect(button).not.toHaveAttribute('data-focus-visible');
  });

  it('tracks focus across descendants without false blur transitions', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <FocusWithinExample onChange={onChange} />
        <button>Outside</button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'First child' }));
    expect(onChange).toHaveBeenLastCalledWith(true);
    await user.tab();
    expect(onChange).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('reports completed pointer interactions outside a ref', async () => {
    const onOutside = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <OutsideExample onOutside={onOutside} />
        <button>Outside</button>
      </>,
    );

    await user.click(screen.getByText('Inside'));
    expect(onOutside).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('suppresses keyboard callbacks while disabled', async () => {
    const onKeyDown = vi.fn();
    function KeyboardTarget({ isDisabled }: { isDisabled?: boolean }) {
      const { keyboardProps } = useKeyboard({ isDisabled, onKeyDown });
      return <button {...keyboardProps}>Keyboard target</button>;
    }
    const user = userEvent.setup();
    const { rerender } = render(<KeyboardTarget />);
    const target = screen.getByRole('button', { name: 'Keyboard target' });
    target.focus();
    await user.keyboard('{Enter}');
    expect(onKeyDown).toHaveBeenCalledTimes(1);

    rerender(<KeyboardTarget isDisabled />);
    await user.keyboard('{Enter}');
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
});
