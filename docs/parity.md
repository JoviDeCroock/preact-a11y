# Accessibility primitive roadmap

React Aria is a behavioral and API reference, not a runtime dependency. Each family is
implemented natively for Preact and must pass unit, real-browser, keyboard, pointer, and
automated accessibility coverage before being marked complete.

| Family                    | Status      | Current scope                                               |
| ------------------------- | ----------- | ----------------------------------------------------------- |
| Interactions              | In progress | Press/long press, move, focus, keyboard, context/outside    |
| Buttons                   | In progress | Button and toggle button hooks and components               |
| Selection controls        | In progress | Checkbox, radio, select, and filtered combobox              |
| Forms                     | In progress | Labels, validation, text/search, locale-aware number fields |
| Feedback                  | In progress | Labels, progress bars, meters, and separators               |
| Overlays                  | In progress | Dismissal, modal semantics, focus containment/restoration   |
| Collections               | In progress | Listbox and menu focus, selection, actions, and typeahead   |
| Disclosure and navigation | In progress | Links, breadcrumbs, dialogs, tabs, and keyboard toolbars    |
| Internationalization      | In progress | Locale/direction, filtering, date/number/list formatting    |
| Utilities and SSR         | In progress | Chaining, stable IDs, object refs, and hydration state      |
| Drag and drop             | Planned     | Pointer, keyboard, and assistive-technology flows           |

React Stately and component state libraries are intentionally out of scope. Consumers may
use signals, local hooks, or any external store while composing these accessibility
primitives.

## Reference baseline

The machine-readable runtime API baseline is pinned to `react-aria@3.51.0` in
[`react-aria-3.51.0-runtime-exports.json`](./react-aria-3.51.0-runtime-exports.json). The
parity check reports direct name coverage against all 159 upstream runtime exports while
also verifying Preact-native component exports. A direct-name match is useful inventory,
not proof of behavioral parity; the family completion rules below remain the release gate.

## Completion rules

A family is complete only when:

1. Its public API and types are Preact-native and contain no React or `preact/compat` seam.
2. Keyboard, mouse, touch/pointer, disabled, focus, and screen-reader semantics relevant to
   the family have browser tests.
3. Representative compositions pass axe-core in Chromium and Firefox.
4. The package can be installed and type-checked in an isolated project containing only
   Preact.
