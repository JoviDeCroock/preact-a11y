# Interactions

Accessibility is more than assigning a role. A control must respond consistently to keyboard,
mouse, touch, virtual clicks, focus changes, and disabled state. Preact A11y interaction hooks
normalize those inputs into Preact-native props and events.

## Press

Use `usePress` for a custom pressable surface, or `useButton` when the result represents a button.
Prefer a native `<button>` whenever possible.

```tsx
import { useButton } from 'preact-a11y';
import { useRef } from 'preact/hooks';

export function IconButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps, isPressed } = useButton({ onPress: () => zoomIn() }, ref);

  return (
    <button {...buttonProps} aria-label="Zoom in" data-pressed={isPressed || undefined} ref={ref}>
      +
    </button>
  );
}
```

`onPress` is the portable activation event. It avoids making application logic depend on whether
activation came from a pointer, Enter, Space, or assistive technology.

## Merge behavior safely

Use `mergeProps` when multiple hooks contribute props to one element. It composes event handlers,
class names, and referenced IDs rather than allowing the last spread to silently replace earlier
behavior.

```tsx
import { mergeProps, useFocus, useHover, usePress } from 'preact-a11y';

export function InteractiveCard() {
  const press = usePress({ onPress: () => openCard() });
  const focus = useFocus({ onFocusChange: (focused) => logFocus(focused) });
  const hover = useHover({ onHoverChange: (hovered) => logHover(hovered) });
  const props = mergeProps(press.pressProps, focus.focusProps, hover.hoverProps);

  return (
    <div {...props} role="button" tabIndex={0}>
      Open details
    </div>
  );
}
```

When a native element can express the same control, use it instead of recreating semantics with a
role and `tabIndex`.

## Focus

- `useFocus` observes focus on one element.
- `useFocusWithin` observes focus entering or leaving a subtree.
- `useFocusVisible` tracks keyboard-style focus visibility globally.
- `useFocusRing` combines focus and focus-visible state.
- `FocusRing` exposes the same state through a render wrapper.
- `FocusScope` contains, restores, or programmatically moves focus within overlays.

Use focus-visible state for visual presentation only. Never remove the browser outline without an
equally visible replacement.

## Hover, keyboard, and movement

`useHover` suppresses emulated mouse events after touch input and exposes `onHoverStart`,
`onHoverEnd`, and `onHoverChange`. `useKeyboard` composes key-down and key-up behavior. `useMove`
normalizes pointer and keyboard movement deltas for controls such as sliders and color areas.

Other focused interaction primitives include:

- `useLongPress` for deliberate long-press gestures with keyboard-safe alternatives.
- `useContextMenu` for context-menu triggers without losing native semantics.
- `useInteractOutside` for overlay dismissal boundaries.
- `Pressable` and `Focusable` for child composition when a hook-level API is too low-level.

## Disabled behavior

Use the primitive's `isDisabled` option. It handles native `disabled` where available and
`aria-disabled`, focusability, and event suppression for non-native controls. Styling alone does
not disable an interaction.

## Test the input matrix

At minimum, verify Tab focus, Enter and Space activation, pointer activation, disabled behavior,
and focus visibility. See [accessibility testing](./testing.md) for browser examples.
