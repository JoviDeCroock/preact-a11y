import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { createRef } from 'preact';
import { describe, expect, it, vi } from 'vitest';
import { Button, Checkbox } from '../src/components';

describe('native components', () => {
  it('exposes the underlying element through a Preact-native elementRef', () => {
    const elementRef = createRef<HTMLButtonElement>();
    render(<Button elementRef={elementRef}>Save</Button>);

    expect(elementRef.current).toBe(screen.getByRole('button', { name: 'Save' }));
  });

  it('normalizes button activation and disabled behavior', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Button onPress={onPress}>Save</Button>);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);

    rerender(
      <Button isDisabled onPress={onPress}>
        Save
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('supports uncontrolled and indeterminate checkboxes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Checkbox onChange={onChange}>Accept terms</Checkbox>);
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(
      <Checkbox isIndeterminate onChange={onChange}>
        Accept terms
      </Checkbox>,
    );
    expect(checkbox).toBePartiallyChecked();
  });
});
