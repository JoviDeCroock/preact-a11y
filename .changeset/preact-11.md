---
'preact-a11y': patch
---

Support Preact 11 (11.0.0-rc.2 and later) alongside Preact 10.11+.

- The `JSX` attribute types derive from `JSX.IntrinsicElements`, since Preact 11 removed
  `JSX.HTMLAttributes`. `JSX.CSSProperties` is now an interface.
- `role`, input `type` and `list`, and anchor `href` accept any value, so prop bags stay spreadable
  onto Preact 11's per-element ARIA types.
- Prop bag and component prop types no longer declare `ref`, which Preact 10 never passes to
  function components and the components overwrite on Preact 11. Use `elementRef`; the slider
  thumb's `inputProps` still carries its input ref.
- `JSX.InputHTMLAttributes` narrows `defaultValue` to `string` and `JSX.SelectHTMLAttributes`
  accepts `string[]` values, so both spread onto `<input>`/`<select>` on every supported Preact.
- Ref parameters use the newly exported `RefObject` (`{ current: T | null }`), which accepts
  Preact 11's `useRef(null)`.
- Overlay, table, and visually hidden lengths are written in `px`, because Preact 11 no longer
  appends units.
- Slider thumbs keep the `--slider-thumb-percent` custom property alongside their position.
- Token fields listen to lowercase composition events, so IME input also commits on Preact 10 in
  real browsers.
