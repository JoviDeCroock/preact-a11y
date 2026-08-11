import { createContext, toChildArray } from 'preact';
import type { ComponentChildren, Ref, VNode } from 'preact';
import type { JSX } from '../preactTypes';
import { useContext, useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import {
  useTable,
  useTableCell,
  useTableColumnHeader,
  useTableColumnResize,
  useTableHeaderRow,
  useTableRow,
  useTableRowGroup,
  useTableSelectAllCheckbox,
  useTableSelectionCheckbox,
  type SortDirection,
} from '../table/useTable';
import type { SelectionMode } from '../collections/useListBox';
import { mergeRefs } from '../utils/mergeRefs';
import { VisuallyHidden } from '../visually-hidden';

export interface SortDescriptor {
  column: string;
  direction: SortDirection;
}

interface TableContextValue {
  baseId: string;
  columnIds: string[];
  rowKeys: string[];
  enabledRowKeys: string[];
  selectedKeys: Set<string>;
  selectionMode: SelectionMode;
  sortDescriptor?: SortDescriptor;
  focusedCellId?: string;
  isDisabled: boolean;
  focusCell(id: string): void;
  select(key: string): void;
  selectAll(selected: boolean): void;
  action(key: string): void;
  cellAction(rowKey: string, columnKey: string): void;
  sort(columnKey: string): void;
  getWidth(columnKey: string, fallback?: number): number | undefined;
  setWidth(columnKey: string, width: number): void;
}

interface RowContextValue {
  rowKey: string;
  rowIndex: number;
  isDisabled: boolean;
  label: string;
}

const TableContext = createContext<TableContextValue | null>(null);
const RowContext = createContext<RowContextValue | null>(null);

function childrenOfType<P>(children: ComponentChildren, type: (props: P) => ComponentChildren) {
  const result: Array<VNode<P>> = [];
  for (const child of toChildArray(children)) {
    if (typeof child === 'object' && child != null && child.type === type)
      result.push(child as VNode<P>);
  }
  return result;
}

function tableParts(children: ComponentChildren) {
  const headers = childrenOfType(children, TableHeader);
  const bodies = childrenOfType(children, TableBody);
  const columns = headers.flatMap((header) => childrenOfType(header.props.children, TableColumn));
  const rows = bodies.flatMap((body) => childrenOfType(body.props.children, TableRow));
  return { columns, rows };
}

export interface TableProps extends Omit<
  JSX.TableHTMLAttributes<HTMLTableElement>,
  'aria-label' | 'aria-labelledby' | 'onChange'
> {
  children: ComponentChildren;
  selectionMode?: SelectionMode;
  selectedKeys?: Iterable<string>;
  defaultSelectedKeys?: Iterable<string>;
  sortDescriptor?: SortDescriptor;
  defaultSortDescriptor?: SortDescriptor;
  columnWidths?: ReadonlyMap<string, number>;
  defaultColumnWidths?: ReadonlyMap<string, number>;
  isDisabled?: boolean;
  elementRef?: Ref<HTMLTableElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onSelectionChange?: (keys: Set<string>) => void;
  onSortChange?: (descriptor: SortDescriptor) => void;
  onColumnWidthsChange?: (widths: Map<string, number>) => void;
  onRowAction?: (key: string) => void;
  onCellAction?: (rowKey: string, columnKey: string) => void;
}

export function Table({
  children,
  selectionMode = 'none',
  selectedKeys,
  defaultSelectedKeys,
  sortDescriptor: controlledSort,
  defaultSortDescriptor,
  columnWidths,
  defaultColumnWidths,
  isDisabled = false,
  elementRef,
  onSelectionChange,
  onSortChange,
  onColumnWidthsChange,
  onRowAction,
  onCellAction,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...domProps
}: TableProps) {
  const localRef = useRef<HTMLTableElement>(null);
  const baseId = `preact-aria-table-${useId()}`;
  const { columns, rows } = tableParts(children);
  const columnIds = columns.map((column) => column.props.id);
  const defaultWidths = new Map(
    columns.flatMap((column) =>
      column.props.defaultWidth == null ? [] : [[column.props.id, column.props.defaultWidth]],
    ),
  );
  const rowKeys = rows.map((row) => row.props.id);
  const enabledRowKeys = rows.filter((row) => !row.props.isDisabled).map((row) => row.props.id);
  const [uncontrolledSelection, setUncontrolledSelection] = useState(
    () => new Set(defaultSelectedKeys),
  );
  const selection = useMemo(
    () => (selectedKeys === undefined ? uncontrolledSelection : new Set(selectedKeys)),
    [selectedKeys, uncontrolledSelection],
  );
  const [uncontrolledSort, setUncontrolledSort] = useState(defaultSortDescriptor);
  const sortDescriptor = controlledSort ?? uncontrolledSort;
  const [uncontrolledWidths, setUncontrolledWidths] = useState(() => new Map(defaultColumnWidths));
  const widths = useMemo(
    () => (columnWidths === undefined ? uncontrolledWidths : new Map(columnWidths)),
    [columnWidths, uncontrolledWidths],
  );
  const [focusedCellId, setFocusedCellId] = useState<string>();

  function select(key: string) {
    if (selectionMode === 'none' || isDisabled || !enabledRowKeys.includes(key)) return;
    const next = new Set(selectionMode === 'single' ? [] : selection);
    if (selectionMode === 'multiple' && next.has(key)) next.delete(key);
    else next.add(key);
    if (selectedKeys === undefined) setUncontrolledSelection(next);
    onSelectionChange?.(next);
  }

  function selectAll(selected: boolean) {
    const next = selected ? new Set(enabledRowKeys) : new Set<string>();
    if (selectedKeys === undefined) setUncontrolledSelection(next);
    onSelectionChange?.(next);
  }

  function sort(column: string) {
    const next: SortDescriptor = {
      column,
      direction:
        sortDescriptor?.column === column && sortDescriptor.direction === 'ascending'
          ? 'descending'
          : 'ascending',
    };
    if (controlledSort === undefined) setUncontrolledSort(next);
    onSortChange?.(next);
  }

  function setWidth(column: string, width: number) {
    const next = new Map(widths);
    next.set(column, width);
    if (columnWidths === undefined) setUncontrolledWidths(next);
    onColumnWidthsChange?.(next);
  }

  const context: TableContextValue = {
    baseId,
    columnIds,
    rowKeys,
    enabledRowKeys,
    selectedKeys: selection,
    selectionMode,
    sortDescriptor,
    focusedCellId,
    isDisabled,
    focusCell: setFocusedCellId,
    select,
    selectAll,
    action: (key) => onRowAction?.(key),
    cellAction: (rowKey, columnKey) => onCellAction?.(rowKey, columnKey),
    sort,
    getWidth: (column, fallback) => widths.get(column) ?? defaultWidths.get(column) ?? fallback,
    setWidth,
  };
  const result = useTable(
    {
      focusedCellId,
      selectionMode,
      rowCount: rows.length + 1,
      columnCount: columns.length,
      isDisabled,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      onFocusedCellChange: setFocusedCellId,
      onSelectionAction: select,
      onRowAction,
      onCellAction,
      onSort: sort,
    },
    localRef,
  );
  return (
    <TableContext.Provider value={context}>
      <table {...domProps} {...result.gridProps} ref={mergeRefs(localRef, elementRef)}>
        {children}
      </table>
    </TableContext.Provider>
  );
}

export interface TableHeaderProps {
  children: ComponentChildren;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  const group = useTableRowGroup();
  const row = useTableHeaderRow();
  return (
    <thead
      {...(group.rowGroupProps as JSX.HTMLAttributes<HTMLTableSectionElement>)}
      className={className}
    >
      <tr {...(row.rowProps as JSX.HTMLAttributes<HTMLTableRowElement>)}>{children}</tr>
    </thead>
  );
}

export interface TableColumnProps {
  id: string;
  children: ComponentChildren;
  allowsSorting?: boolean;
  allowsResizing?: boolean;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  resizerClassName?: string;
}

export function TableColumn({
  id,
  children,
  allowsSorting,
  allowsResizing,
  defaultWidth,
  minWidth,
  maxWidth,
  className,
  resizerClassName,
}: TableColumnProps) {
  const context = useContext(TableContext);
  if (!context) throw new Error('TableColumn must be rendered inside <Table>.');
  const columnIndex = context.columnIds.indexOf(id);
  const result = useTableColumnHeader({
    id: `${context.baseId}-header-${id}`,
    columnKey: id,
    columnIndex: columnIndex + 1,
    allowsSorting,
    sortDirection:
      context.sortDescriptor?.column === id ? context.sortDescriptor.direction : undefined,
    onSort: context.sort,
  });
  const width = context.getWidth(id, defaultWidth);
  return (
    <th
      {...(result.columnHeaderProps as JSX.ThHTMLAttributes<HTMLTableCellElement>)}
      className={className}
      data-column-key={id}
      data-column-index={columnIndex}
      data-row-index={0}
      data-table-cell
      style={width == null ? undefined : { width }}
      tabIndex={-1}
    >
      {children}
      {allowsResizing && (
        <TableColumnResizer
          columnId={id}
          className={resizerClassName}
          label={`Resize ${typeof children === 'string' ? children : id} column`}
          maxValue={maxWidth}
          minValue={minWidth}
          value={width ?? 120}
        />
      )}
    </th>
  );
}

export interface TableBodyProps {
  children: ComponentChildren;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  const result = useTableRowGroup();
  return (
    <tbody
      {...(result.rowGroupProps as JSX.HTMLAttributes<HTMLTableSectionElement>)}
      className={className}
    >
      {children}
    </tbody>
  );
}

export interface TableRowProps {
  id: string;
  children: ComponentChildren;
  textValue?: string;
  isDisabled?: boolean;
  className?: string;
}

export function TableRow({
  id,
  children,
  textValue,
  isDisabled = false,
  className,
}: TableRowProps) {
  const context = useContext(TableContext);
  if (!context) throw new Error('TableRow must be rendered inside <Table>.');
  const rowIndex = context.rowKeys.indexOf(id) + 2;
  const disabled = context.isDisabled || isDisabled;
  const result = useTableRow({
    id: `${context.baseId}-row-${id}`,
    rowKey: id,
    rowIndex,
    isSelected: context.selectionMode === 'none' ? undefined : context.selectedKeys.has(id),
    isDisabled: disabled,
    onSelect: context.select,
    onAction: context.action,
  });
  return (
    <RowContext.Provider
      value={{ rowKey: id, rowIndex, isDisabled: disabled, label: textValue ?? id }}
    >
      <tr
        {...(result.rowProps as JSX.HTMLAttributes<HTMLTableRowElement>)}
        className={className}
        data-row-key={id}
        data-selected={result.isSelected || undefined}
      >
        {children}
      </tr>
    </RowContext.Provider>
  );
}

export interface TableCellProps {
  columnId: string;
  children: ComponentChildren;
  isRowHeader?: boolean;
  className?: string;
}

export function TableCell({ columnId, children, isRowHeader, className }: TableCellProps) {
  const table = useContext(TableContext);
  const row = useContext(RowContext);
  if (!table || !row) throw new Error('TableCell must be rendered inside <TableRow>.');
  const columnIndex = table.columnIds.indexOf(columnId);
  const id = `${table.baseId}-cell-${row.rowKey}-${columnId}`;
  const result = useTableCell({
    id,
    rowKey: row.rowKey,
    columnKey: columnId,
    rowIndex: row.rowIndex,
    columnIndex: columnIndex + 1,
  });
  const localRef = useRef<HTMLTableCellElement>(null);
  useEffect(() => {
    if (!localRef.current) return;
    const controls = Array.from(
      localRef.current.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea'),
    );
    const previous = controls.map((control) => control.getAttribute('tabindex'));
    controls.forEach((control) => control.setAttribute('tabindex', '-1'));
    return () =>
      controls.forEach((control, index) => {
        if (previous[index] == null) control.removeAttribute('tabindex');
        else control.setAttribute('tabindex', previous[index]!);
      });
  }, [children]);
  const common = {
    ...result.gridCellProps,
    className,
    'data-column-key': columnId,
    'data-column-index': columnIndex,
    'data-row-key': row.rowKey,
    'data-row-index': row.rowIndex - 1,
    'data-table-cell': true,
    ref: localRef,
    role: isRowHeader ? 'rowheader' : 'gridcell',
    style: { width: table.getWidth(columnId) },
  } as JSX.TdHTMLAttributes<HTMLTableCellElement>;
  return isRowHeader ? <th {...common}>{children}</th> : <td {...common}>{children}</td>;
}

export function TableSelectionCheckbox() {
  const table = useContext(TableContext);
  const row = useContext(RowContext);
  if (!table || !row) throw new Error('TableSelectionCheckbox must be rendered inside <TableRow>.');
  const result = useTableSelectionCheckbox({
    isSelected: table.selectedKeys.has(row.rowKey),
    isDisabled: row.isDisabled || table.selectionMode === 'none',
    label: `Select ${row.label}`,
    onChange: () => table.select(row.rowKey),
  });
  return <input {...result.checkboxProps} />;
}

export function TableSelectAllCheckbox() {
  const table = useContext(TableContext);
  if (!table) throw new Error('TableSelectAllCheckbox must be rendered inside <Table>.');
  const selectedCount = table.enabledRowKeys.filter((key) => table.selectedKeys.has(key)).length;
  const result = useTableSelectAllCheckbox({
    selectedCount,
    rowCount: table.enabledRowKeys.length,
    isDisabled: table.selectionMode !== 'multiple',
    onChange: table.selectAll,
  });
  return <input {...result.checkboxProps} tabIndex={-1} />;
}

export interface TableColumnResizerProps {
  columnId: string;
  label: string;
  value: number;
  minValue?: number;
  maxValue?: number;
  className?: string;
}

export function TableColumnResizer({
  columnId,
  label,
  value,
  minValue,
  maxValue,
  className,
}: TableColumnResizerProps) {
  const table = useContext(TableContext);
  if (!table) throw new Error('TableColumnResizer must be rendered inside <Table>.');
  const result = useTableColumnResize({
    columnKey: columnId,
    value,
    minValue,
    maxValue,
    'aria-label': label,
    onResize: table.setWidth,
    onResizeEnd: table.setWidth,
  });
  return (
    <>
      <VisuallyHidden>
        <input {...result.inputProps} tabIndex={-1} />
      </VisuallyHidden>
      <span
        {...result.resizerProps}
        aria-hidden="true"
        className={className}
        data-mouse-resizing={result.isMouseResizing || undefined}
        data-resizing={result.isResizing || undefined}
      />
    </>
  );
}
