# Preact A11y documentation

Preact A11y provides headless accessibility and interaction primitives for Preact 10.11 and
newer, including Preact 11. Use the unstyled components when their markup fits your design
system, or use the hooks when you need complete control over rendering.

## Start here

- [Getting started](./getting-started.md) — install the package, choose an API layer, and build
  your first accessible control.
- [Interactions](./interactions.md) — press, hover, focus, keyboard, movement, and composition.
- [Forms and validation](./forms.md) — labels, descriptions, errors, selection controls, and
  native form submission.
- [Collections](./collections.md) — listboxes, menus, grids, trees, tables, tags, and keyboard
  navigation.
- [Overlays and focus](./overlays.md) — popovers, dialogs, tooltips, portals, dismissal, and focus
  restoration.
- [Internationalization and routing](./internationalization.md) — locale direction, Intl helpers,
  localized strings, and client-side navigation.
- [Accessibility testing](./testing.md) — test semantics and behavior with Vitest, Playwright,
  and axe-core.

## API layers

| Entry point              | Best for                                           |
| ------------------------ | -------------------------------------------------- |
| `preact-a11y`            | Headless hooks, providers, and low-level utilities |
| `preact-a11y/components` | Unstyled, composable Preact components             |

Both entry points are implemented with `preact` and `preact/hooks`. They do not load React,
`preact/compat`, React Stately, or a component state framework.

## Design principles

1. **Native semantics first.** A native element is preferred whenever it already expresses the
   correct behavior.
2. **Behavior and ARIA travel together.** Returned props include keyboard, pointer, focus, and
   relationship handling—not only `aria-*` attributes.
3. **State stays composable.** Components support controlled and uncontrolled values; hooks can
   be paired with local hooks, signals, or another store.
4. **Styling stays yours.** Components are unstyled and expose state through DOM attributes such
   as `data-pressed`, `data-selected`, and `data-invalid`.
5. **Preact stays Preact.** Refs, events, JSX, and rendering are based on Preact's own contracts.

## React Aria inspiration

[React Aria](https://react-spectrum.adobe.com/react-aria/) established an excellent model for
accessible, headless interaction primitives. Preact A11y uses its public API, documentation, and
behavior as important references and adapts portions of its Apache-2.0 licensed implementation
for Preact.

React Aria is not a runtime dependency, and API-name coverage is not treated as proof of
accessibility. The release gate exercises real keyboard, pointer, touch, focus, form, and
screen-reader-facing semantics in browsers. Preact A11y is not affiliated with, authorized,
endorsed, or sponsored by Adobe. See the repository NOTICE for attribution.
