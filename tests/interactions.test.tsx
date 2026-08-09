import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useFocusRing, usePress } from '../src';

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
});
