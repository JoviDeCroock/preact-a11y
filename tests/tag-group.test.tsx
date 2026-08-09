import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { useState } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../src';
import { Tag, TagGroup } from '../src/components';

describe('TagGroup', () => {
  it('navigates, selects, removes selected tags, and recovers focus', async () => {
    const onRemove = vi.fn();
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();

    function Fixture() {
      const [items, setItems] = useState(['alpha', 'beta', 'gamma']);
      return (
        <TagGroup
          aria-label="Filters"
          defaultSelectedKeys={['alpha', 'beta']}
          onRemove={(keys) => {
            onRemove(keys);
            setItems((current) => current.filter((item) => !keys.has(item)));
          }}
          onSelectionChange={onSelectionChange}
          selectionMode="multiple"
        >
          {items.map((item) => (
            <Tag id={item} key={item}>
              {item[0]!.toUpperCase() + item.slice(1)}
            </Tag>
          ))}
        </TagGroup>
      );
    }

    render(<Fixture />);
    const group = screen.getByRole('grid', { name: 'Filters' });
    await user.click(group);
    await user.keyboard('{ArrowRight}');
    expect(group).toHaveAttribute('aria-activedescendant', expect.stringMatching(/beta/));
    await user.keyboard('{Delete}');
    expect(onRemove).toHaveBeenLastCalledWith(new Set(['alpha', 'beta']));
    expect(group).toHaveAttribute('aria-activedescendant', expect.stringMatching(/gamma/));
    expect(screen.queryByRole('row', { name: /Alpha/ })).not.toBeInTheDocument();

    await user.keyboard(' ');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['alpha', 'beta', 'gamma']));
    await user.keyboard('{Backspace}');
    expect(screen.getByRole('group', { name: 'Filters' })).toHaveFocus();
    expect(screen.getByText('No tags')).toBeInTheDocument();
  });

  it('provides removal buttons and field descriptions', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(
      <TagGroup description="Applied to search results" label="Topics" onRemove={onRemove}>
        <Tag id="preact">Preact</Tag>
      </TagGroup>,
    );
    const group = screen.getByRole('grid', { name: 'Topics' });
    expect(group).toHaveAccessibleDescription('Applied to search results');
    await user.click(screen.getByRole('button', { name: 'Remove Preact' }));
    expect(onRemove).toHaveBeenLastCalledWith(new Set(['preact']));
  });

  it('reverses horizontal navigation in RTL and skips disabled tags', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="ar-EG">
        <TagGroup aria-label="RTL tags">
          <Tag id="one">One</Tag>
          <Tag id="two" isDisabled>
            Two
          </Tag>
          <Tag id="three">Three</Tag>
        </TagGroup>
      </I18nProvider>,
    );
    const group = screen.getByRole('grid');
    await user.click(group);
    await user.keyboard('{ArrowLeft}');
    expect(group).toHaveAttribute('aria-activedescendant', expect.stringMatching(/three/));
  });
});
