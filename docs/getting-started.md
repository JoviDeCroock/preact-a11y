# Getting started

## Installation

Install Preact and Preact A11y together:

```sh
pnpm add preact preact-a11y
```

Preact `^10.11.0` and Preact 11 are supported. The package ships ESM, CommonJS, and TypeScript
declarations and has no React dependency.

## Use an unstyled component

Components provide accessible markup and behavior while leaving styling to your application.

```tsx
import { Button } from 'preact-a11y/components';

export function SaveButton() {
  return (
    <Button className="save-button" onPress={() => saveDocument()}>
      Save document
    </Button>
  );
}
```

Interaction state is reflected in the DOM, which makes it easy to style without duplicating
state:

```css
.save-button[data-pressed] {
  transform: translateY(1px);
}

.save-button[data-disabled] {
  cursor: not-allowed;
  opacity: 0.55;
}
```

Use `elementRef` when a component exposes its underlying DOM node. This follows Preact's ref model
without installing a `forwardRef` compatibility shim.

```tsx
import { Button } from 'preact-a11y/components';
import { useRef } from 'preact/hooks';

export function FocusableSaveButton() {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <Button elementRef={ref} onPress={() => saveDocument()}>
      Save
    </Button>
  );
}
```

## Use a headless hook

Hooks return DOM props and state for custom markup. Spread the returned props onto the element
they describe.

```tsx
import { useButton } from 'preact-a11y';
import { useRef } from 'preact/hooks';

export function ToolbarButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps, isPressed } = useButton({ onPress: () => openCommandPalette() }, ref);

  return (
    <button {...buttonProps} className={isPressed ? 'pressed' : undefined} ref={ref}>
      Commands
    </button>
  );
}
```

Do not cherry-pick only the ARIA attributes from a returned prop object. Event handlers, focus
management, native attributes, and relationships are part of the same accessibility contract.

## Controlled and uncontrolled state

Unstyled components accept uncontrolled defaults for simple cases and controlled values when the
application owns state.

```tsx
import { Checkbox } from 'preact-a11y/components';
import { useState } from 'preact/hooks';

export function Preferences() {
  const [selected, setSelected] = useState(false);

  return (
    <Checkbox isSelected={selected} onChange={setSelected}>
      Send weekly summary
    </Checkbox>
  );
}
```

State may live in Preact hooks, signals, or another store. Preact A11y does not require a stately
package.

## Providers

Most primitives need no global provider. Add one only for the behavior you use:

- `I18nProvider` supplies a locale and text direction.
- `RouterProvider` connects links to client-side navigation.
- `OverlayProvider` and `UNSAFE_PortalProvider` coordinate overlay placement and modal behavior.
- `SSRProvider` supplies deterministic server-rendering state where an application needs it.

Continue with [interactions](./interactions.md), [forms](./forms.md), or
[overlays](./overlays.md).
