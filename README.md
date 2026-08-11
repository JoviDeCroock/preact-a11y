<div align="center">

# Preact A11y

**Headless accessibility and interaction primitives, built natively for Preact.**

[![CI](https://github.com/JoviDeCroock/preact-aria/actions/workflows/main.yml/badge.svg)](https://github.com/JoviDeCroock/preact-aria/actions/workflows/main.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Preact 10.11+](https://img.shields.io/badge/Preact-10.11%2B-673ab8.svg)](https://preactjs.com/)

[Getting started](./docs/getting-started.md) · [Components](#two-levels-of-control) ·
[Documentation](./docs/README.md) · [Contributing](./CONTRIBUTING.md)

</div>

---

Preact A11y gives design systems the accessible behavior behind buttons, fields, overlays,
collections, drag and drop, date and color controls, and more—without prescribing styles or
bringing React into your bundle.

> **Inspired by React Aria. Native to Preact.**
>
> [React Aria](https://react-spectrum.adobe.com/react-aria/) is the leading inspiration for this
> project's public API and behavior. Preact A11y is an independent Preact implementation: it does
> not re-export React Aria, use React Stately, or depend on `preact/compat`.

> [!IMPORTANT]
> Preact A11y is under active development. Review the current API and test the primitives in your
> product before adopting it in production.

## Why Preact A11y?

| Principle                       | What it means                                                       |
| ------------------------------- | ------------------------------------------------------------------- |
| **Preact-native**               | Built with `preact` and `preact/hooks`, including types.            |
| **Headless by default**         | Bring your own markup, styling, state, and design tokens.           |
| **Behavior, not ARIA stickers** | Keyboard, pointer, touch, focus, and form behavior ship together.   |
| **Composable state**            | Use local hooks, signals, or any external store.                    |
| **Browser-verified**            | Playwright exercises Chromium, Firefox, mobile input, and axe-core. |

## Install

```sh
pnpm add preact preact-a11y
```

Preact `>=10.11.0 <11` is supported. The package ships ESM, CommonJS, and TypeScript declarations.

## Two levels of control

### Start with an unstyled component

```tsx
import { Button, Checkbox, TextField } from 'preact-a11y/components';

export function ProfileForm() {
  return (
    <form>
      <TextField
        autoComplete="email"
        description="Used for account recovery."
        isRequired
        label="Email address"
        name="email"
        type="email"
      />

      <Checkbox name="updates">Send me product updates</Checkbox>

      <Button type="submit">Save profile</Button>
    </form>
  );
}
```

Components are unstyled and expose state through attributes such as `data-pressed`,
`data-selected`, and `data-invalid`.

### Drop down to a hook

```tsx
import { useButton } from 'preact-a11y';
import { useRef } from 'preact/hooks';

export function CommandButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps, isPressed } = useButton({ onPress: () => openCommandPalette() }, ref);

  return (
    <button {...buttonProps} data-pressed={isPressed || undefined} ref={ref}>
      Open commands
    </button>
  );
}
```

Hooks return Preact-ready DOM props and interaction state, giving a design system full control over
the rendered tree.

## What is included?

| Area               | Primitives                                                                            |
| ------------------ | ------------------------------------------------------------------------------------- |
| **Interactions**   | Press, hover, focus, focus rings, keyboard, movement, long press, outside interaction |
| **Forms**          | Text/search/number fields, checkbox, switch, radio, select, combobox, slider          |
| **Collections**    | Listbox, menu, grid list, tree, tags, table, sections, delegates, autocomplete        |
| **Overlays**       | Portal, focus scope, modal, popover, tooltip, positioning, scroll prevention          |
| **Navigation**     | Links, router integration, breadcrumbs, tabs, disclosure, toolbar, landmarks          |
| **Rich input**     | Clipboard, drag and drop, token fields, dates, calendars, and color controls          |
| **Feedback**       | Progress bars, meters, separators, and focus-safe toast regions                       |
| **Infrastructure** | Stable IDs, SSR state, locale direction, Intl formatters, localized strings           |

## Documentation

- [Getting started](./docs/getting-started.md)
- [Interactions](./docs/interactions.md)
- [Forms and validation](./docs/forms.md)
- [Collections](./docs/collections.md)
- [Overlays and focus](./docs/overlays.md)
- [Internationalization and routing](./docs/internationalization.md)
- [Accessibility testing](./docs/testing.md)

## How React Aria influences this project

React Aria demonstrated that accessible interaction logic can be separated from styling and
component state. Preact A11y follows that philosophy and uses React Aria's public documentation,
API vocabulary, and observable behavior as a reference.

The implementation boundary is deliberate:

- no React or React DOM dependency;
- no `preact/compat` bridge;
- no React Aria or React Stately re-export;
- no state-management package required;
- Preact-native refs, events, JSX, portals, and hooks;
- behavior verified independently in real browsers.

The pinned React Aria API inventory helps catch missing primitive families, but matching an export
name is never considered accessibility proof. Keyboard, pointer, touch, focus, form, direction,
and automated accessibility checks remain the release gate. See [NOTICE](./NOTICE) for attribution.

## Verification

```sh
pnpm install
pnpm check
```

The full gate runs oxfmt, oxlint, strict TypeScript, unit tests, production package checks,
clean-consumer ESM/CommonJS/type checks, API inventory, Playwright in Chromium and Firefox, mobile
touch coverage, and axe-core audits. CI separately verifies the declared Preact 10.11.0 floor.

## License

[MIT](./LICENSE) © Preact A11y contributors.

React Aria documentation and behavior are used as references under the terms described in
[NOTICE](./NOTICE); no React Aria source is bundled or re-exported.
