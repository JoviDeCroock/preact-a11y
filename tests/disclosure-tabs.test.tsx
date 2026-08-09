import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Disclosure, Tab, TabList, TabPanel, Tabs } from '../src/components';

describe('disclosure and tabs', () => {
  it('associates a disclosure trigger and panel', async () => {
    const onExpandedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Disclosure title="Advanced settings" onExpandedChange={onExpandedChange}>
        Advanced content
      </Disclosure>,
    );

    const trigger = screen.getByRole('button', { name: 'Advanced settings' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: 'Advanced settings' })).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Advanced settings' })).toHaveTextContent(
      'Advanced content',
    );
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
  });

  it('moves and automatically activates tabs while skipping disabled items', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Tabs defaultSelectedKey="account" onSelectionChange={onSelectionChange}>
        <TabList aria-label="Settings sections">
          <Tab id="account">Account</Tab>
          <Tab id="security" isDisabled>
            Security
          </Tab>
          <Tab id="billing">Billing</Tab>
        </TabList>
        <TabPanel id="account">Account panel</TabPanel>
        <TabPanel id="security">Security panel</TabPanel>
        <TabPanel id="billing">Billing panel</TabPanel>
      </Tabs>,
    );

    const account = screen.getByRole('tab', { name: 'Account' });
    account.focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Billing' })).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'Billing' })).toHaveTextContent('Billing panel');
    expect(onSelectionChange).toHaveBeenLastCalledWith('billing');

    await user.keyboard('{ArrowRight}');
    expect(account).toHaveFocus();
  });

  it('supports manual tab activation', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultSelectedKey="one" keyboardActivation="manual">
        <TabList aria-label="Manual tabs">
          <Tab id="one">One</Tab>
          <Tab id="two">Two</Tab>
        </TabList>
        <TabPanel id="one">First panel</TabPanel>
        <TabPanel id="two">Second panel</TabPanel>
      </Tabs>,
    );

    screen.getByRole('tab', { name: 'One' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'One' })).toBeVisible();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('tabpanel', { name: 'Two' })).toBeVisible();
  });
});
