import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  CheckboxGroup,
  CheckboxGroupItem,
  ToggleButtonGroup,
  ToggleButtonGroupItem,
} from '../src/components';

describe('grouped controls', () => {
  it('coordinates checkbox values and shared group semantics', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CheckboxGroup label="Permissions" name="permission" onChange={onChange}>
        <CheckboxGroupItem value="read">Read</CheckboxGroupItem>
        <CheckboxGroupItem value="write">Write</CheckboxGroupItem>
      </CheckboxGroup>,
    );

    const group = screen.getByRole('group', { name: 'Permissions' });
    expect(group).toBeInTheDocument();
    expect(group).not.toHaveAttribute('aria-orientation');
    await user.click(screen.getByRole('checkbox', { name: 'Read' }));
    await user.click(screen.getByRole('checkbox', { name: 'Write' }));
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual(new Set(['read', 'write']));
  });

  it('enforces single toggle selection and arrow-key focus', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleButtonGroup aria-label="Alignment" onChange={onChange}>
        <ToggleButtonGroupItem id="left">Left</ToggleButtonGroupItem>
        <ToggleButtonGroupItem id="center">Center</ToggleButtonGroupItem>
      </ToggleButtonGroup>,
    );
    const left = screen.getByRole('button', { name: 'Left' });
    const center = screen.getByRole('button', { name: 'Center' });
    expect(screen.getByRole('group', { name: 'Alignment' })).not.toHaveAttribute(
      'aria-orientation',
    );
    await user.click(left);
    await user.click(center);
    expect(left).toHaveAttribute('aria-pressed', 'false');
    expect(center).toHaveAttribute('aria-pressed', 'true');
    expect(onChange).toHaveBeenLastCalledWith(new Set(['center']));

    left.focus();
    await user.keyboard('{ArrowRight}');
    expect(center).toHaveFocus();
  });

  it('can require one toggle to remain selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleButtonGroup
        aria-label="View"
        defaultValue={['grid']}
        disallowEmptySelection
        onChange={onChange}
      >
        <ToggleButtonGroupItem id="grid">Grid</ToggleButtonGroupItem>
        <ToggleButtonGroupItem id="list">List</ToggleButtonGroupItem>
      </ToggleButtonGroup>,
    );

    const grid = screen.getByRole('button', { name: 'Grid' });
    await user.click(grid);
    expect(grid).toHaveAttribute('aria-pressed', 'true');
    expect(onChange).toHaveBeenLastCalledWith(new Set(['grid']));
  });
});
