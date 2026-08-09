import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { useRef } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import { useButton } from '../src/index';

function Button(props: { children: string; isDisabled?: boolean; onPress: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps, isPressed } = useButton(props, ref);

  return (
    <button {...buttonProps} data-pressed={isPressed || undefined} ref={ref}>
      {props.children}
    </button>
  );
}

describe('useButton', () => {
  it('normalizes keyboard and pointer interactions into press events', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(<Button onPress={onPress}>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('prevents interaction when disabled', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <Button isDisabled onPress={onPress}>
        Save
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
