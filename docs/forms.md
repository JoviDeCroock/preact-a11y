# Forms and validation

Form primitives connect visible labels, descriptions, errors, native constraints, keyboard
behavior, and submitted values. Use the unstyled components for common markup or the corresponding
hooks when a design system needs a different structure.

## Text fields

```tsx
import { TextField } from 'preact-a11y/components';

export function AccountEmail({ error }: { error?: string }) {
  return (
    <TextField
      autoComplete="email"
      description="Used for security notices."
      errorMessage={error}
      isInvalid={Boolean(error)}
      isRequired
      label="Email address"
      name="email"
      type="email"
    />
  );
}
```

The label, description, and error are assigned stable IDs and connected to the input. Invalid
state controls both semantics and `data-invalid`; it is not inferred from text color.

For custom markup, `useTextField` returns `inputProps`, `labelProps`, `descriptionProps`, and
`errorMessageProps`:

```tsx
import { useTextField } from 'preact-a11y';

export function CompactField() {
  const field = useTextField({
    label: 'Project name',
    description: 'Shown to collaborators.',
    name: 'project',
  });

  return (
    <div>
      <label {...field.labelProps}>Project name</label>
      <input {...field.inputProps} />
      <small {...field.descriptionProps}>Shown to collaborators.</small>
    </div>
  );
}
```

## Selection controls

Checkboxes, switches, radios, and toggle buttons support controlled and uncontrolled selection.
Keep the visible label inside the component unless you provide an explicit accessible label.

```tsx
import { Checkbox, Radio, RadioGroup, Switch } from 'preact-a11y/components';

export function NotificationSettings() {
  return (
    <section>
      <Checkbox name="digest" value="weekly">
        Weekly digest
      </Checkbox>

      <Switch name="mentions">Notify me about mentions</Switch>

      <RadioGroup label="Delivery frequency" name="frequency" defaultValue="daily">
        <Radio value="instant">Immediately</Radio>
        <Radio value="daily">Daily summary</Radio>
        <Radio value="never">Never</Radio>
      </RadioGroup>
    </section>
  );
}
```

## Select and combobox

`Select` offers choice from a fixed set. `ComboBox` adds text input and locale-aware filtering.
Both include a hidden native control so values participate in HTML form submission.

```tsx
import { Select, SelectItem } from 'preact-a11y/components';

export function TimeZoneField() {
  return (
    <Select label="Time zone" name="timezone" defaultSelectedKey="brussels">
      <SelectItem id="brussels">Brussels</SelectItem>
      <SelectItem id="london">London</SelectItem>
      <SelectItem id="new-york">New York</SelectItem>
    </Select>
  );
}
```

```tsx
import { ComboBox, ComboBoxItem } from 'preact-a11y/components';

export function AssigneeField() {
  return (
    <ComboBox label="Assignee" name="assignee">
      <ComboBoxItem id="ada">Ada</ComboBoxItem>
      <ComboBoxItem id="grace">Grace</ComboBoxItem>
      <ComboBoxItem id="linus">Linus</ComboBoxItem>
    </ComboBox>
  );
}
```

## Search, numbers, sliders, and structured fields

- `SearchField` includes clear behavior with an accessible button.
- `NumberField` uses locale-aware parsing and keyboard stepping.
- `Slider` supports one or multiple thumbs, hidden inputs, constraints, and orientation.
- Date, time, calendar, token, and color hooks expose accessible behavior while accepting
  consumer-owned state contracts.

## Validation guidance

1. Set `isInvalid` when the application considers a value invalid.
2. Provide a concise `errorMessage` that tells the user how to recover.
3. Keep native attributes such as `required`, `minLength`, and `pattern` when they describe the
   actual constraint.
4. Validate on submission or at a predictable interaction boundary; avoid announcing errors on
   every keystroke.
5. Move focus to an error summary only when doing so helps the user recover from a failed
   submission.
