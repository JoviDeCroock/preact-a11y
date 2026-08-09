import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { createRef } from 'preact';
import { describe, expect, it, vi } from 'vitest';
import { Button, Checkbox, Radio, RadioGroup, Switch, TextField } from '../src/components';

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

  it('uses switch semantics and prevents read-only changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Switch onChange={onChange}>Notifications</Switch>);
    const toggle = screen.getByRole('switch', { name: 'Notifications' });

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(
      <Switch isReadOnly onChange={onChange}>
        Notifications
      </Switch>,
    );
    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('connects radio group labels and manages an uncontrolled selection', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <RadioGroup label="Favorite pet" description="Choose one" onChange={onChange}>
        <Radio value="cats">Cats</Radio>
        <Radio value="dogs">Dogs</Radio>
      </RadioGroup>,
    );

    const group = screen.getByRole('radiogroup', { name: 'Favorite pet' });
    const dogs = screen.getByRole('radio', { name: 'Dogs' });
    await user.click(dogs);

    expect(group).toHaveAccessibleDescription('Choose one');
    expect(dogs).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith('dogs');
  });

  it('connects text field help and validation messages', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TextField
        label="Email"
        description="Used for account recovery"
        errorMessage="Enter a valid email"
        isInvalid
        isRequired
        type="email"
        onChange={onChange}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Email' });
    await user.type(input, 'person@example.com');

    expect(input).toHaveAccessibleDescription('Used for account recovery Enter a valid email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toBeRequired();
    expect(onChange).toHaveBeenLastCalledWith('person@example.com');
  });
});
