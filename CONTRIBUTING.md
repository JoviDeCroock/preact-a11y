# Contributing

Thanks for helping make Preact A11y reliable and accessible.

## Development

Use Node.js 20.19 or newer and the pnpm version declared in `package.json`:

```sh
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` is the release gate. It runs oxfmt, oxlint, TypeScript 6 and 7,
unit tests, package builds and boundary checks, parity inventory, isolated consumer tests,
real-browser interaction tests, and axe-core audits.

## Project boundaries

- Implement against `preact` and `preact/hooks` directly.
- Do not add React, React DOM, React Aria, React Stately, or `preact/compat` dependencies.
- Preserve Apache-2.0 attribution and modification notices when adapting React Aria source.
- Do not re-export React Aria or use it as a runtime dependency.
- Keep state-management packages out of scope; expose accessibility and interaction primitives.
- Preserve ESM, CommonJS, declaration, SSR-import, and clean-consumer compatibility.

## Accessibility changes

For affected behavior, cover the relevant keyboard, pointer, touch, disabled, focus, and
screen-reader semantics. Add real-browser coverage for representative composition changes.
An axe-core pass is required but does not replace behavioral assertions or manual reasoning
about the accessibility model.

## Changesets

Add a changeset for every user-visible API, behavior, type, or compatibility change:

```sh
pnpm changeset
```

Release commits and dependency-only maintenance do not require a changeset. Publishing is
performed by the reviewed Version Packages and staged npm release workflow; contributors
must not publish directly.
