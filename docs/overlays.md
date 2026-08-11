# Overlays and focus

Overlays combine several accessibility responsibilities: the trigger relationship, dismissal,
focus movement, focus restoration, outside interaction, scroll locking, positioning, and hiding
background content from assistive technology.

## Popover

`Popover` clones one trigger element and connects it to positioned dialog content.

```tsx
import { Button, Popover } from 'preact-a11y/components';

export function AccountMenu() {
  return (
    <Popover
      aria-label="Account options"
      content={
        <div>
          <a href="/profile">Profile</a>
          <button type="button">Sign out</button>
        </div>
      }
      placement="bottom end"
    >
      <Button>Account</Button>
    </Popover>
  );
}
```

The trigger receives expanded and control relationships. Opening moves focus into the popover;
closing restores focus to the trigger. Escape and outside interaction dismiss it when
`isDismissable` is enabled.

Use `isNonModal` only when users must continue interacting with the page while the popover remains
open. Otherwise focus containment prevents the keyboard from moving behind the overlay.

## Modal dialog

```tsx
import { Button, Modal } from 'preact-a11y/components';
import { useState } from 'preact/hooks';

export function DeleteProject() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setOpen(true)}>Delete project</Button>
      <Modal
        aria-labelledby="delete-title"
        isDismissable
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        <h2 id="delete-title">Delete project?</h2>
        <p>This action cannot be undone.</p>
        <Button onPress={() => setOpen(false)}>Cancel</Button>
      </Modal>
    </>
  );
}
```

Every dialog needs an accessible name through `aria-label` or `aria-labelledby`. Place the modal
in an `OverlayContainer` when the application uses a dedicated portal root.

## Tooltips

Tooltips describe a trigger; they do not contain actions. The trigger remains focused while the
tooltip is open, and `aria-describedby` connects the content.

```tsx
import { Button, Tooltip } from 'preact-a11y/components';

export function HelpButton() {
  return (
    <Tooltip content="Open keyboard shortcuts" placement="bottom">
      <Button aria-label="Keyboard shortcuts">?</Button>
    </Tooltip>
  );
}
```

Use a popover instead when the content contains links, buttons, fields, or other interactive
elements.

## Portal and provider structure

`OverlayProvider` tracks nested modal state. `OverlayContainer` renders overlay content at the
configured portal boundary. `UNSAFE_PortalProvider` can supply an application-specific portal
target while keeping the implementation on Preact core.

The internal portal owns its mount node, preserves the surrounding Preact context, and removes
only its own content during cleanup.

## Low-level hooks

- `useOverlay` handles Escape and outside interaction dismissal.
- `useOverlayTrigger` connects a trigger and overlay.
- `useOverlayPosition` calculates placement and arrow geometry.
- `usePopover` composes positioning, modal behavior, and underlay props.
- `useModal` and `useModalOverlay` hide background content and apply dialog semantics.
- `usePreventScroll` locks document scrolling while an overlay is active.
- `FocusScope` contains, restores, and programmatically moves focus.
- `DismissButton` gives screen-reader users a hidden dismissal affordance.

When using hooks directly, treat their returned props and refs as a unit. Positioning without
focus or dismissal semantics is not a complete accessible overlay.
