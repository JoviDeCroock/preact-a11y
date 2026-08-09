import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../src';
import { NumberField, SearchField } from '../src/components';

describe('advanced field primitives', () => {
  it('clears an uncontrolled search field and restores input focus', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchField
        defaultValue="accessibility"
        label="Search docs"
        onChange={onChange}
        onClear={onClear}
      />,
    );
    const input = screen.getByRole('searchbox', { name: 'Search docs' });

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(onClear).toHaveBeenCalledTimes(1);

    await user.type(input, 'aria');
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
    expect(onClear).toHaveBeenCalledTimes(2);
  });

  it('formats, parses, steps, and clamps locale-aware numbers', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <I18nProvider locale="de-DE">
        <NumberField
          defaultValue={1.5}
          label="Quantity"
          maxValue={2}
          minValue={0}
          onChange={onChange}
          step={0.5}
        />
      </I18nProvider>,
    );
    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    expect(input).toHaveValue('1,5');

    await user.click(screen.getByRole('button', { name: 'Increase value' }));
    expect(input).toHaveValue('2');
    expect(onChange).toHaveBeenLastCalledWith(2);

    await user.clear(input);
    await user.type(input, '3,5');
    await user.keyboard('{Enter}');
    expect(input).toHaveValue('2');
    expect(onChange).toHaveBeenLastCalledWith(2);

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveValue('1,5');
    expect(onChange).toHaveBeenLastCalledWith(1.5);
  });
});
