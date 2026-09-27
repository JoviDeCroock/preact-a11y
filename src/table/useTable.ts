/*
 * Copyright 2020 Adobe. All rights reserved.
 * Licensed under the Apache License, Version 2.0. See LICENSE.
 * Modified by JoviDeCroock for Preact A11y in 2026.
 */

import type { JSX, RefObject, TargetedKeyboardEvent, TargetedPointerEvent } from '../preactTypes';
import { useRef, useState } from 'preact/hooks';
import { useCheckbox } from '../hooks/useCheckbox';
import { usePress } from '../interactions/usePress';
import type { SelectionMode } from '../collections/useListBox';

export type SortDirection = 'ascending' | 'descending';

export interface AriaTableProps {
  focusedCellId?: string;
  selectionMode?: SelectionMode;
  rowCount?: number;
  columnCount?: number;
  isDisabled?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onFocusedCellChange?: (id: string) => void;
  onSelectionAction?: (rowKey: string) => void;
  onRowAction?: (rowKey: string) => void;
  onCellAction?: (rowKey: string, columnKey: string) => void;
  onSort?: (columnKey: string) => void;
}

function enabledCells(table: HTMLElement): HTMLElement[] {
  return Array.from(table.querySelectorAll<HTMLElement>('[data-table-cell]')).filter(
    (cell) => cell.closest('[role="row"]')?.getAttribute('aria-disabled') !== 'true',
  );
}

function cellCoordinates(cell: HTMLElement | undefined) {
  return cell
    ? {
        row: Number(cell.dataset.rowIndex),
        column: Number(cell.dataset.columnIndex),
      }
    : null;
}

function previousRowCell(cells: HTMLElement[], row: number) {
  for (let index = cells.length - 1; index >= 0; index--) {
    const cell = cells[index]!;
    if (Number(cell.dataset.rowIndex) < row) return cell;
  }
}

export function useTable(props: AriaTableProps, ref: RefObject<HTMLElement>) {
  function focusCell(cell: HTMLElement | undefined) {
    if (!cell?.id) return;
    props.onFocusedCellChange?.(cell.id);
    cell.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  function onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
    if (props.isDisabled || !ref.current) return;
    const fromTable = event.target === event.currentTarget;
    if (event.key === 'Escape' && !fromTable) {
      event.preventDefault();
      ref.current.focus();
      return;
    }
    const cells = enabledCells(ref.current);
    const current = cells.find((cell) => cell.id === props.focusedCellId);
    const coordinates = cellCoordinates(current);
    if (fromTable && event.key === 'F2' && current) {
      const interactive = current.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      );
      if (interactive) {
        event.preventDefault();
        interactive.focus();
      }
      return;
    }
    if (fromTable && coordinates && event.key.startsWith('Arrow')) {
      event.preventDefault();
      let row = coordinates.row;
      let column = coordinates.column;
      if (event.key === 'ArrowUp') row--;
      else if (event.key === 'ArrowDown') row++;
      else if (event.key === 'ArrowLeft') column--;
      else if (event.key === 'ArrowRight') column++;
      const exact = cells.find(
        (cell) =>
          Number(cell.dataset.rowIndex) === row && Number(cell.dataset.columnIndex) === column,
      );
      if (exact) focusCell(exact);
      else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const sameColumn = cells.filter((cell) => Number(cell.dataset.columnIndex) === column);
        focusCell(
          event.key === 'ArrowDown'
            ? sameColumn.find((cell) => Number(cell.dataset.rowIndex) > coordinates.row)
            : previousRowCell(sameColumn, coordinates.row),
        );
      }
    } else if (fromTable && coordinates && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      const row = cells.filter((cell) => Number(cell.dataset.rowIndex) === coordinates.row);
      focusCell(event.key === 'Home' ? row[0] : row.at(-1));
    } else if (fromTable && current && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const rowKey = current.dataset.rowKey;
      const columnKey = current.dataset.columnKey;
      if (current.getAttribute('role') === 'columnheader' && columnKey && event.key === 'Enter') {
        props.onSort?.(columnKey);
      } else if (rowKey && event.key === ' ') {
        props.onSelectionAction?.(rowKey);
      } else if (rowKey && columnKey && props.onCellAction) {
        props.onCellAction(rowKey, columnKey);
      } else if (rowKey) props.onRowAction?.(rowKey);
    }
  }

  return {
    gridProps: {
      role: 'grid' as const,
      tabIndex: props.isDisabled ? undefined : 0,
      'aria-activedescendant': props.focusedCellId,
      'aria-disabled': props.isDisabled || undefined,
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'],
      'aria-multiselectable': props.selectionMode === 'multiple' || undefined,
      'aria-rowcount': props.rowCount,
      'aria-colcount': props.columnCount,
      onKeyDown,
      onFocus(event) {
        if (event.target === event.currentTarget && !props.focusedCellId)
          focusCell(enabledCells(event.currentTarget)[0]);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}

export function useTableRowGroup() {
  return {
    rowGroupProps: { role: 'rowgroup' as const } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}

export interface AriaTableHeaderRowProps {
  rowIndex?: number;
}

export function useTableHeaderRow(props: AriaTableHeaderRowProps = {}) {
  return {
    rowProps: {
      role: 'row' as const,
      'aria-rowindex': props.rowIndex ?? 1,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}

export interface AriaTableColumnHeaderProps {
  id: string;
  columnKey: string;
  columnIndex: number;
  sortDirection?: SortDirection;
  allowsSorting?: boolean;
  onSort?: (columnKey: string) => void;
}

export function useTableColumnHeader(props: AriaTableColumnHeaderProps) {
  const press = usePress({
    isDisabled: !props.allowsSorting,
    onPress: () => props.onSort?.(props.columnKey),
  });
  return {
    columnHeaderProps: {
      ...(props.allowsSorting ? press.pressProps : {}),
      id: props.id,
      role: 'columnheader' as const,
      'aria-colindex': props.columnIndex,
      'aria-sort': props.allowsSorting ? (props.sortDirection ?? 'none') : undefined,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    isPressed: press.isPressed,
  };
}

export interface AriaTableRowProps {
  id: string;
  rowKey: string;
  rowIndex: number;
  isSelected?: boolean;
  isDisabled?: boolean;
  onSelect?: (key: string) => void;
  onAction?: (key: string) => void;
}

export function useTableRow(props: AriaTableRowProps) {
  return {
    rowProps: {
      id: props.id,
      role: 'row' as const,
      'aria-rowindex': props.rowIndex,
      'aria-selected': props.isSelected,
      'aria-disabled': props.isDisabled || undefined,
      onClick(event) {
        if (
          props.isDisabled ||
          (event.target instanceof Element && event.target.closest('button, a, input, select'))
        )
          return;
        props.onSelect?.(props.rowKey);
      },
      onDblClick() {
        if (!props.isDisabled) props.onAction?.(props.rowKey);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    expandButtonProps: {} satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    isSelected: props.isSelected ?? false,
    isDisabled: props.isDisabled ?? false,
  };
}

export interface AriaTableCellProps {
  id: string;
  rowKey: string;
  columnKey: string;
  rowIndex: number;
  columnIndex: number;
}

export function useTableCell(props: AriaTableCellProps) {
  return {
    gridCellProps: {
      id: props.id,
      role: 'gridcell' as const,
      'aria-rowindex': props.rowIndex,
      'aria-colindex': props.columnIndex,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    isPressed: false,
  };
}

export interface AriaTableSelectionCheckboxProps {
  isSelected: boolean;
  isDisabled?: boolean;
  label: string;
  onChange: (selected: boolean) => void;
}

export function useTableSelectionCheckbox(props: AriaTableSelectionCheckboxProps) {
  const checkbox = useCheckbox(props);
  return {
    checkboxProps: {
      ...checkbox.inputProps,
      'aria-label': props.label,
    } satisfies JSX.InputHTMLAttributes<HTMLInputElement>,
  };
}

export interface AriaTableSelectAllCheckboxProps {
  selectedCount: number;
  rowCount: number;
  isDisabled?: boolean;
  onChange: (selected: boolean) => void;
}

export function useTableSelectAllCheckbox(props: AriaTableSelectAllCheckboxProps) {
  const checkbox = useCheckbox({
    isSelected: props.rowCount > 0 && props.selectedCount === props.rowCount,
    isIndeterminate: props.selectedCount > 0 && props.selectedCount < props.rowCount,
    isDisabled: props.isDisabled || props.rowCount === 0,
    onChange: props.onChange,
  });
  return {
    checkboxProps: {
      ...checkbox.inputProps,
      'aria-label': 'Select all rows',
    } satisfies JSX.InputHTMLAttributes<HTMLInputElement>,
  };
}

export interface AriaTableColumnResizeProps {
  columnKey: string;
  value: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  isDisabled?: boolean;
  'aria-label': string;
  onResizeStart?: (columnKey: string, width: number) => void;
  onResize?: (columnKey: string, width: number) => void;
  onResizeEnd?: (columnKey: string, width: number) => void;
}

export function useTableColumnResize(props: AriaTableColumnResizeProps) {
  const [isResizing, setResizing] = useState(false);
  const [isMouseResizing, setMouseResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(props.value);
  const min = props.minValue ?? 40;
  const max = props.maxValue ?? 1000;
  const step = props.step ?? 10;
  const clamp = (value: number) => Math.min(max, Math.max(min, Math.round(value / step) * step));

  return {
    inputProps: {
      type: 'range' as const,
      min,
      max,
      step,
      value: props.value,
      disabled: props.isDisabled,
      'aria-label': props['aria-label'],
      onFocus: () => setResizing(true),
      onBlur: () => {
        setResizing(false);
        props.onResizeEnd?.(props.columnKey, props.value);
      },
      onInput(event) {
        props.onResize?.(props.columnKey, event.currentTarget.valueAsNumber);
      },
      onChange(event) {
        props.onResizeEnd?.(props.columnKey, event.currentTarget.valueAsNumber);
      },
    } satisfies JSX.InputHTMLAttributes<HTMLInputElement>,
    resizerProps: {
      onPointerDown(event: TargetedPointerEvent<HTMLElement>) {
        if (props.isDisabled || event.button !== 0) return;
        startX.current = event.clientX;
        startWidth.current = props.value;
        setResizing(true);
        setMouseResizing(true);
        event.currentTarget.setPointerCapture?.(event.pointerId);
        props.onResizeStart?.(props.columnKey, props.value);
      },
      onPointerMove(event: TargetedPointerEvent<HTMLElement>) {
        if (!isMouseResizing) return;
        props.onResize?.(
          props.columnKey,
          clamp(startWidth.current + event.clientX - startX.current),
        );
      },
      onPointerUp(event: TargetedPointerEvent<HTMLElement>) {
        if (!isMouseResizing) return;
        const width = clamp(startWidth.current + event.clientX - startX.current);
        setResizing(false);
        setMouseResizing(false);
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        props.onResizeEnd?.(props.columnKey, width);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    isResizing,
    isMouseResizing,
  };
}
