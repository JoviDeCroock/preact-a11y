# Preact Aria

Preact-native accessibility and interaction primitives for building design systems and
unstyled component libraries. React Aria is an API and behavior reference, but this
package is implemented independently with `preact` and `preact/hooks`—it does not use
React, React DOM, `preact/compat`, or React Stately.

> This project is under active development and is not ready for production use yet.

## Install

```sh
pnpm add preact preact-aria
```

## Hooks

Hooks provide behavior and ARIA/DOM props without prescribing markup or styles.

```tsx
import { useButton } from 'preact-aria';
import { useRef } from 'preact/hooks';

export function SaveButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps, isPressed } = useButton({ onPress: () => save() }, ref);

  return (
    <button {...buttonProps} data-pressed={isPressed || undefined} ref={ref}>
      Save
    </button>
  );
}
```

## Components

Optional unstyled components compose the same native hooks. Preact's own ref model is
kept explicit through `elementRef`; no React-style `forwardRef` shim is installed.

```tsx
import { Button, Checkbox, Switch, TextField } from 'preact-aria/components';

export function Settings() {
  return (
    <>
      <Button onPress={() => save()}>Save</Button>
      <Checkbox onChange={(selected) => updateConsent(selected)}>Accept terms</Checkbox>
      <Switch onChange={(selected) => updateNotifications(selected)}>Notifications</Switch>
      <TextField label="Email" description="Used for account recovery" type="email" />
    </>
  );
}
```

## Current native primitives

- Press, hover, focus, focus-visible, and focus-ring interactions
- Button, toggle button, link, checkbox, switch, radio group, field, and text field hooks
- Matching unstyled form and selection components
- Modal semantics, outside/Escape dismissal, scroll locking, and focus scopes
- Disclosures and automatic/manual keyboard-navigable tabs
- Single/multiple-selection listboxes with active focus and typeahead
- VisuallyHidden, mergeProps, and mergeRefs utilities

The full implementation roadmap is tracked in [docs/parity.md](./docs/parity.md). State
management packages are intentionally out of scope; primitives use small internal state
only where browser behavior requires it.

## Verification

```sh
pnpm install
pnpm check
```

The full gate includes oxfmt, oxlint, strict TypeScript, unit tests, production package
builds, clean-consumer ESM/CommonJS/type checks, Chromium and Firefox interaction tests,
and axe-core accessibility audits.

## License

Apache-2.0. React Aria documentation and behavior are used as references under the terms
described in [NOTICE](./NOTICE); no React Aria source is bundled or re-exported.
