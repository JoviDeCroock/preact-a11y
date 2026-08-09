import { fireEvent, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  TableSelectAllCheckbox,
  TableSelectionCheckbox,
} from '../src/components';

function ExampleTable(props: {
  onSelectionChange?: (keys: Set<string>) => void;
  onSortChange?: (descriptor: { column: string; direction: 'ascending' | 'descending' }) => void;
  onCellAction?: (row: string, column: string) => void;
  onColumnWidthsChange?: (widths: Map<string, number>) => void;
}) {
  return (
    <Table
      aria-label="Team members"
      defaultColumnWidths={new Map([['name', 100]])}
      onCellAction={props.onCellAction}
      onColumnWidthsChange={props.onColumnWidthsChange}
      onSelectionChange={props.onSelectionChange}
      onSortChange={props.onSortChange}
      selectionMode="multiple"
    >
      <TableHeader>
        <TableColumn id="selection">
          <TableSelectAllCheckbox />
        </TableColumn>
        <TableColumn allowsResizing allowsSorting id="name" maxWidth={200} minWidth={80}>
          Name
        </TableColumn>
        <TableColumn id="role">Role</TableColumn>
      </TableHeader>
      <TableBody>
        <TableRow id="ada" textValue="Ada Lovelace">
          <TableCell columnId="selection">
            <TableSelectionCheckbox />
          </TableCell>
          <TableCell columnId="name" isRowHeader>
            Ada Lovelace
          </TableCell>
          <TableCell columnId="role">
            <button>Open Ada</button>
          </TableCell>
        </TableRow>
        <TableRow id="grace" isDisabled textValue="Grace Hopper">
          <TableCell columnId="selection">
            <TableSelectionCheckbox />
          </TableCell>
          <TableCell columnId="name" isRowHeader>
            Grace Hopper
          </TableCell>
          <TableCell columnId="role">Admiral</TableCell>
        </TableRow>
        <TableRow id="margaret" textValue="Margaret Hamilton">
          <TableCell columnId="selection">
            <TableSelectionCheckbox />
          </TableCell>
          <TableCell columnId="name" isRowHeader>
            Margaret Hamilton
          </TableCell>
          <TableCell columnId="role">
            <button>Open Margaret</button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

describe('Table', () => {
  it('navigates cells, sorts columns, skips disabled rows, and invokes cell actions', async () => {
    const onSortChange = vi.fn();
    const onSelectionChange = vi.fn();
    const onCellAction = vi.fn();
    const user = userEvent.setup();
    render(
      <ExampleTable
        onCellAction={onCellAction}
        onSelectionChange={onSelectionChange}
        onSortChange={onSortChange}
      />,
    );
    const table = screen.getByRole('grid', { name: 'Team members' });
    await user.click(table);
    expect(table).toHaveAttribute('aria-rowcount', '4');
    expect(table).toHaveAttribute('aria-colcount', '3');

    await user.keyboard('{ArrowRight}{Enter}');
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'name', direction: 'ascending' });
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    await user.keyboard('{Enter}');
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'name', direction: 'descending' });

    await user.keyboard('{ArrowDown} ');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['ada']));
    await user.keyboard('{ArrowDown}');
    expect(table).toHaveAttribute('aria-activedescendant', expect.stringMatching(/margaret-name/));
    await user.keyboard('{ArrowRight}{Enter}');
    expect(onCellAction).toHaveBeenLastCalledWith('margaret', 'role');
  });

  it('selects all enabled rows and enters nested controls with F2', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<ExampleTable onSelectionChange={onSelectionChange} />);
    const table = screen.getByRole('grid');
    await user.click(table);
    await user.keyboard('{F2} ');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['ada', 'margaret']));
    await user.keyboard('{Escape}{ArrowDown}{ArrowRight}{ArrowRight}{F2}');
    const action = screen.getByRole('button', { name: 'Open Ada' });
    expect(action).toHaveFocus();
    expect(action).toHaveAttribute('tabindex', '-1');
    await user.keyboard('{Escape}');
    expect(table).toHaveFocus();
  });

  it('updates column widths through the accessible resize input', () => {
    const onColumnWidthsChange = vi.fn();
    render(<ExampleTable onColumnWidthsChange={onColumnWidthsChange} />);
    const resizer = screen.getByRole('slider', { name: 'Resize Name column' });
    fireEvent.input(resizer, { target: { value: '150' } });
    expect(onColumnWidthsChange.mock.calls.at(-1)?.[0].get('name')).toBe(150);
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveStyle({ width: '150px' });
  });
});
