---
'preact-a11y': patch
---

Support Preact 11 (11.0.0-rc.2 and later) alongside Preact 10.11+.

- The `JSX` attribute types derive from `JSX.IntrinsicElements`, since Preact 11 removed
  `JSX.HTMLAttributes`. `JSX.CSSProperties` is now an interface.
- `role`, input `type` and `list`, and anchor `href` accept any value, so prop bags stay spreadable
  onto Preact 11's per-element ARIA types.
- Ref parameters use the newly exported `RefObject` (`{ current: T | null }`), which accepts
  Preact 11's `useRef(null)`.
- Overlay, table, and visually hidden lengths are written in `px`, because Preact 11 no longer
  appends units.
- Token fields listen to lowercase composition events, so IME input also commits on Preact 10 in
  real browsers.
