---
'preact-a11y': patch
---

Support Preact 11. Prop bags no longer depend on `JSX.HTMLAttributes` (removed in Preact 11), ref
parameters accept Preact 11's `useRef(null)` objects, overlay and table sizes are written in `px`
now that Preact 11 no longer appends units, and token fields listen to lowercase composition
events so IME input also commits on Preact 10 in real browsers.
