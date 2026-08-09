import { fireEvent, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { createRef } from 'preact';
import { describe, expect, it, vi } from 'vitest';
import { RouterProvider } from '../src';
import {
  Button,
  Checkbox,
  Link,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  ToggleButton,
} from '../src/components';

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

  it('activates links with Enter but not Space', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <Link href="#destination" onPress={onPress}>
        Documentation
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Documentation' });
    link.focus();

    await user.keyboard(' ');
    expect(onPress).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('delegates unmodified same-origin links to a client router', async () => {
    const navigate = vi.fn();
    const user = userEvent.setup();
    render(
      <RouterProvider navigate={navigate} useHref={(href) => `/app${href}`}>
        <Link href="/settings" routerOptions={{ replace: true }}>
          Client settings
        </Link>
      </RouterProvider>,
    );
    const link = screen.getByRole('link', { name: 'Client settings' });
    expect(link).toHaveAttribute('href', '/app/settings');

    await user.click(link);
    expect(navigate).toHaveBeenCalledWith('/settings', { replace: true });

    link.addEventListener('click', (event) => event.preventDefault(), { once: true });
    fireEvent.click(link, { ctrlKey: true });
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('supports uncontrolled toggle buttons', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ToggleButton onChange={onChange}>Pin sidebar</ToggleButton>);
    const button = screen.getByRole('button', { name: 'Pin sidebar' });

    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(onChange).toHaveBeenLastCalledWith(true);
  });
});
