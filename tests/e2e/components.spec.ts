import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/demo/');
});

test('components support pointer and keyboard interaction', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Increment' });
  const output = page.getByRole('status');

  await button.click();
  await expect(output).toHaveText('Count: 1');
  await button.press('Enter');
  await expect(output).toHaveText('Count: 2');

  const checkbox = page.getByRole('checkbox', { name: 'Accept terms' });
  await checkbox.press('Space');
  await expect(checkbox).toBeChecked();

  const toggle = page.getByRole('switch', { name: 'Enable notifications' });
  await toggle.press('Space');
  await expect(toggle).toBeChecked();

  const darkTheme = page.getByRole('radio', { name: 'Dark' });
  await darkTheme.check();
  await expect(darkTheme).toBeChecked();

  const email = page.getByRole('textbox', { name: 'Email' });
  await email.fill('person@example.com');
  await expect(email).toHaveValue('person@example.com');

  const toggleButton = page.getByRole('button', { name: 'Pin sidebar' });
  await toggleButton.press('Space');
  await expect(toggleButton).toHaveAttribute('aria-pressed', 'true');

  const link = page.getByRole('link', { name: 'Learn more' });
  await link.focus();
  await link.press('Space');
  await expect(page).not.toHaveURL(/#learn-more$/);
  await link.press('Enter');
  await expect(page).toHaveURL(/#learn-more$/);

  const disclosure = page.getByRole('button', { name: 'Keyboard help' });
  await disclosure.click();
  await expect(page.getByRole('region', { name: 'Keyboard help' })).toBeVisible();

  const profileTab = page.getByRole('tab', { name: 'Profile' });
  await profileTab.focus();
  await profileTab.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Security' })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Security' })).toBeVisible();
});

test('fixture has no automatically detectable accessibility violations', async ({ page }) => {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const trigger = page.getByRole('button', { name: 'Open preferences' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Preferences' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Display name' })).toBeFocused();
  expect((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations).toEqual(
    [],
  );

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
