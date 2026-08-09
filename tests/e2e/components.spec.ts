import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/demo/');
});

test('components support pointer and keyboard interaction', async ({ page }) => {
  const main = page.getByRole('main', { name: 'Component demo' });
  await page.keyboard.press('F6');
  await expect(main).toBeFocused();

  const button = page.getByRole('button', { name: 'Increment', exact: true });
  const output = page.getByText(/^Count:/);

  await button.click();
  await expect(output).toHaveText('Count: 1');
  await button.press('Enter');
  await expect(output).toHaveText('Count: 2');

  const composedButton = page.getByRole('button', { name: 'Composed increment' });
  await composedButton.press('Enter');
  await expect(page.getByText(/^Composed count:/)).toHaveText('Composed count: 1');

  const focusRingButton = page.getByRole('button', { name: 'Focus ring example' });
  await page.keyboard.down('Tab');
  await focusRingButton.focus();
  await page.keyboard.up('Tab');
  await expect(focusRingButton).toHaveClass(/focus-ring/);
  await focusRingButton.click();
  await expect(focusRingButton).not.toHaveClass(/focus-ring/);

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

  const showNotification = page.getByRole('button', { name: 'Show notification' });
  await showNotification.click();
  const toast = page.getByRole('alertdialog', { name: 'Settings saved' });
  await expect(toast).toBeVisible();
  await toast.getByRole('button', { name: 'Close notification' }).click();
  await expect(toast).toBeHidden();
  await expect(showNotification).toBeFocused();

  const popoverTrigger = page.getByRole('button', { name: 'Open account help' });
  await popoverTrigger.click();
  let popover = page.getByRole('dialog', { name: 'Account help' });
  await expect(popover).toBeVisible();
  await expect(page.getByRole('button', { name: 'Read guide' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden();
  await expect(popoverTrigger).toBeFocused();

  await popoverTrigger.click();
  popover = page.getByRole('dialog', { name: 'Account help' });
  await page.locator('.popover-underlay').click({ position: { x: 5, y: 5 } });
  await expect(popover).toBeHidden();

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

  const environments = page.getByRole('grid', { name: 'Deployment environments' });
  await environments.focus();
  await environments.press('ArrowDown');
  await expect(environments).toHaveAttribute('aria-activedescendant', /preview/);
  await environments.press('Space');
  await expect(page.getByRole('row', { name: /Preview/ })).toHaveAttribute('aria-selected', 'true');
  await environments.press('ArrowRight');
  const previewCheckbox = page.getByRole('checkbox', { name: 'Select Preview' });
  await expect(previewCheckbox).toBeFocused();
  await expect(previewCheckbox).toHaveAttribute('tabindex', '-1');
  await previewCheckbox.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Deploy preview' })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(previewCheckbox).toBeFocused();

  const fileTree = page.getByRole('treegrid', { name: 'File browser' });
  await fileTree.focus();
  await fileTree.press('ArrowRight');
  await expect(fileTree).toHaveAttribute('aria-activedescendant', /package/);
  await fileTree.press('F2');
  const openPackage = page.getByRole('button', { name: 'Open package.json' });
  await expect(openPackage).toBeFocused();
  await openPackage.press('Escape');
  await expect(fileTree).toBeFocused();
  await fileTree.press('ArrowLeft');
  await expect(fileTree).toHaveAttribute('aria-activedescendant', /workspace/);
  await fileTree.press('ArrowLeft');
  await expect(page.getByRole('row', { name: 'Workspace' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await expect(page.getByRole('button', { name: 'Open package.json' })).toBeHidden();

  const topics = page.getByRole('grid', { name: 'Topics' });
  await topics.focus();
  await topics.press('ArrowRight');
  await expect(topics).toHaveAttribute('aria-activedescendant', /accessibility/);
  await topics.press('Space');
  await expect(page.getByRole('row', { name: /Accessibility/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await topics.press('Delete');
  await expect(page.getByRole('row', { name: /Accessibility/ })).toBeHidden();
  await expect(topics).toHaveAttribute('aria-activedescendant', /vdom/);

  const contributors = page.getByRole('grid', { name: 'Contributors' });
  await contributors.focus();
  await contributors.press('ArrowRight');
  await contributors.press('Enter');
  const nameHeader = page.getByRole('columnheader', { name: /Name/ });
  await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  await contributors.press('F2');
  const nameResizer = page.getByRole('slider', { name: 'Resize Name column' });
  await expect(nameResizer).toBeFocused();
  await nameResizer.press('ArrowRight');
  await expect(nameHeader).toHaveCSS('width', '130px');
  await nameResizer.press('Escape');
  await expect(contributors).toBeFocused();
  await contributors.press('ArrowDown');
  await contributors.press('Space');
  await expect(page.getByRole('row', { name: /Ada Lovelace/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await contributors.press('ArrowDown');
  await expect(contributors).toHaveAttribute('aria-activedescendant', /margaret-name/);
  await contributors.press('ArrowRight');
  await contributors.press('F2');
  await expect(page.getByRole('button', { name: 'Open Margaret' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(contributors).toBeFocused();

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

  const showNotification = page.getByRole('button', { name: 'Show notification' });
  await showNotification.click();
  const toastRegion = page.getByRole('region', { name: /Notifications/ });
  expect((await new AxeBuilder({ page }).include('.toast-region').analyze()).violations).toEqual(
    [],
  );
  await toastRegion.getByRole('button', { name: 'Close notification' }).click();

  const popoverTrigger = page.getByRole('button', { name: 'Open account help' });
  await popoverTrigger.click();
  const popover = page.getByRole('dialog', { name: 'Account help' });
  await expect(popover).toBeVisible();
  expect((await new AxeBuilder({ page }).include('.popover').analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');

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

  const portalTrigger = page.getByRole('button', { name: 'Open portal modal' });
  await portalTrigger.click();
  const portalDialog = page.getByRole('dialog', { name: 'Portal preferences' });
  await expect(portalDialog).toBeVisible();
  await expect(page.locator('[data-overlay-container]').first()).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  expect(
    (await new AxeBuilder({ page }).include('[aria-label="Portal preferences"]').analyze())
      .violations,
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(portalDialog).toBeHidden();
  await expect(portalTrigger).toBeFocused();
});
