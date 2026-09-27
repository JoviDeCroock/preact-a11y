# Accessibility testing

Automated checks are useful, but they cannot prove that a component is accessible. Test semantic
output, keyboard and pointer behavior, focus movement, form submission, announcements, and the
actual browser accessibility tree where appropriate.

## Unit tests with Vitest

Use Testing Library queries that reflect how users find controls.

```tsx
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Button } from 'preact-a11y/components';
import { expect, test, vi } from 'vitest';

test('activates from the keyboard', async () => {
  const user = userEvent.setup();
  const onPress = vi.fn();
  render(<Button onPress={onPress}>Save</Button>);

  await user.tab();
  expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(onPress).toHaveBeenCalledOnce();
});
```

Prefer `getByRole` with an accessible name over class, test ID, or DOM-structure selectors. Assert
relationships such as `aria-describedby`, `aria-controls`, and `aria-activedescendant` when they
are part of the behavior.

## Browser tests with Playwright

Real browsers reveal focus, pointer, layout, and event-order behavior that jsdom cannot model.

```ts
import { expect, test } from '@playwright/test';

test('restores focus after closing a dialog', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Delete project' });

  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});
```

Cover at least:

- Tab and Shift+Tab order.
- Enter, Space, Escape, arrow, Home, and End behavior where relevant.
- Pointer and touch activation.
- Disabled and read-only suppression.
- Focus entry, containment, and restoration.
- Controlled and uncontrolled state.
- Native form values and validation relationships.
- Left-to-right and right-to-left navigation for directional widgets.

## Axe-core

Run axe against representative rendered states, including open overlays and invalid forms.

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('has no automatically detectable violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

An empty axe result does not verify keyboard interaction, focus order, meaningful labels, or
announcements. Keep behavioral assertions beside the audit.

## Manual checks

Before shipping a new primitive:

1. Complete the task using only the keyboard.
2. Repeat with a screen reader in at least one supported browser.
3. Zoom to 200% and verify reflow and target visibility.
4. Test high-contrast or forced-colors mode.
5. Test touch when the interaction has pointer-specific behavior.
6. Check reduced-motion behavior if the application adds animation.

## This repository's gate

`pnpm check` runs oxfmt, oxlint, strict TypeScript, unit tests, production builds, package-boundary
checks, API inventory, clean-consumer ESM/CommonJS/type checks, Playwright interaction tests, and
axe-core audits in Chromium and Firefox. CI repeats the consumer test with Preact 10.11.0, the
declared minimum peer version, and runs the type checks, unit tests, and consumer test on
Preact 11.
