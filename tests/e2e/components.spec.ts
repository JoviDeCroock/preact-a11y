import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/demo/');
});

test('components support pointer and keyboard interaction', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Increment' });
  const output = page.getByText(/^Count:/);

  await button.click();
  await expect(output).toHaveText('Count: 1');
  await button.press('Enter');
  await expect(output).toHaveText('Count: 2');

  const bold = page.getByRole('button', { name: 'Bold' });
  await bold.focus();
  await bold.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Italic' })).toBeFocused();

  const checkbox = page.getByRole('checkbox', { name: 'Accept terms' });
  await checkbox.press('Space');
  await expect(checkbox).toBeChecked();

  const readProjects = page.getByRole('checkbox', { name: 'Read projects' });
  await readProjects.check();
  await expect(readProjects).toBeChecked();

  const toggle = page.getByRole('switch', { name: 'Enable notifications' });
  await toggle.press('Space');
  await expect(toggle).toBeChecked();

  const darkTheme = page.getByRole('radio', { name: 'Dark' });
  await darkTheme.check();
  await expect(darkTheme).toBeChecked();

  const email = page.getByRole('textbox', { name: 'Email' });
  await email.fill('person@example.com');
  await expect(email).toHaveValue('person@example.com');

  const search = page.getByRole('searchbox', { name: 'Search docs' });
  await search.fill('keyboard');
  await search.press('Escape');
  await expect(search).toHaveValue('');

  const seats = page.getByRole('spinbutton', { name: 'Seats' });
  await seats.press('ArrowUp');
  await expect(seats).toHaveValue('3');

  const volume = page.getByRole('slider', { name: 'Volume' });
  await volume.focus();
  await volume.press('ArrowRight');
  await expect(volume).toHaveValue('30');
  const volumeTrack = page.locator('[data-slider-track]').first();
  const trackBounds = await volumeTrack.boundingBox();
  if (!trackBounds) throw new Error('Volume slider track has no layout bounds.');
  await volumeTrack.click({ position: { x: trackBounds.width * 0.75, y: trackBounds.height / 2 } });
  await expect(volume).toHaveValue('75');

  const minimumPrice = page.getByRole('slider', { name: 'Minimum Price range' });
  await minimumPrice.focus();
  await minimumPrice.press('End');
  await expect(minimumPrice).toHaveValue('80');

  const selectTrigger = page.getByRole('button', { name: /Favorite animal/ });
  await selectTrigger.press('ArrowDown');
  const animalList = page.getByRole('listbox', { name: 'Favorite animal' });
  await expect(animalList).toBeFocused();
  await animalList.press('End');
  await animalList.press('Enter');
  await expect(selectTrigger).toContainText('Kangaroo');

  const framework = page.getByRole('combobox', { name: 'Favorite framework' });
  await framework.fill('pre');
  await expect(framework).toHaveAttribute('aria-activedescendant', /preact/);
  await framework.press('Enter');
  await expect(framework).toHaveValue('Preact');

  const toggleButton = page.getByRole('button', { name: 'Pin sidebar' });
  await toggleButton.press('Space');
  await expect(toggleButton).toHaveAttribute('aria-pressed', 'true');

  const alignLeft = page.getByRole('button', { name: 'Align left' });
  await alignLeft.focus();
  await alignLeft.press('ArrowRight');
  const alignCenter = page.getByRole('button', { name: 'Align center' });
  await expect(alignCenter).toBeFocused();
  await alignCenter.press('Space');
  await expect(alignLeft).toHaveAttribute('aria-pressed', 'false');
  await expect(alignCenter).toHaveAttribute('aria-pressed', 'true');

  const tooltipTrigger = page.getByRole('button', { name: 'Copy share link' });
  await tooltipTrigger.focus();
  let tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  const tooltipId = await tooltip.getAttribute('id');
  if (!tooltipId) throw new Error('Tooltip has no id.');
  await expect(tooltipTrigger).toHaveAttribute('aria-describedby', tooltipId);
  await tooltipTrigger.press('Escape');
  await expect(tooltip).toBeHidden();

  await tooltipTrigger.hover();
  tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  await tooltip.hover();
  await page.waitForTimeout(150);
  await expect(tooltip).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden();

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

  const cities = page.getByRole('listbox', { name: 'Favorite city' });
  await cities.focus();
  await cities.press('End');
  await cities.press('Enter');
  await expect(page.getByRole('option', { name: 'Ghent' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  const menuTrigger = page.getByRole('button', { name: 'More actions' });
  await menuTrigger.focus();
  await menuTrigger.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'More actions' });
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-activedescendant', /rename/);
  await menu.press('ArrowDown');
  await expect(menu).toHaveAttribute('aria-activedescendant', /archive/);
  await menu.press('Escape');
  await expect(menu).toBeHidden();
  await expect(menuTrigger).toBeFocused();
});

test('fixture has no automatically detectable accessibility violations', async ({ page }) => {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole('button', { name: 'More actions' }).click();
  expect((await new AxeBuilder({ page }).include('[role="menu"]').analyze()).violations).toEqual(
    [],
  );
  await page.keyboard.press('Escape');

  const tooltipTrigger = page.getByRole('button', { name: 'Copy share link' });
  await tooltipTrigger.focus();
  expect((await new AxeBuilder({ page }).include('[role="tooltip"]').analyze()).violations).toEqual(
    [],
  );
  await tooltipTrigger.press('Escape');

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
