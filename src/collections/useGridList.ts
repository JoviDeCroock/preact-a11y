import type { JSX, RefObject, TargetedKeyboardEvent } from '../preactTypes';
import { useRef } from 'preact/hooks';
import { useCheckbox } from '../hooks/useCheckbox';
import type { SelectionMode } from './useListBox';

export interface AriaGridListProps {
  focusedKey?: string;
  selectionMode?: SelectionMode;
  isDisabled?: boolean;
  keyboardNavigationBehavior?: 'arrow' | 'tab';
  escapeKeyBehavior?: 'clearSelection' | 'none';
  shouldFocusWrap?: boolean;
  disallowTypeAhead?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onFocusedKeyChange?: (key: string) => void;
  onSelectionAction?: (key: string) => void;
  onAction?: (key: string) => void;
  onClearSelection?: () => void;
}

function enabledRows(grid: HTMLElement): HTMLElement[] {
  return Array.from(grid.querySelectorAll<HTMLElement>('[role="row"][data-grid-key]')).filter(
    (row) => row.getAttribute('aria-disabled') !== 'true',
  );
}

function rowFocusables(row: HTMLElement): HTMLElement[] {
  return Array.from(
    row.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function useGridList(props: AriaGridListProps, ref: RefObject<HTMLElement>) {
  const search = useRef('');
  const lastTypeTime = useRef(0);

  function focusRow(row: HTMLElement | undefined) {
    const id = row?.id;
    if (!id) return;
    props.onFocusedKeyChange?.(id);
    row.scrollIntoView?.({ block: 'nearest' });
  }

  function onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
    if (props.isDisabled || !ref.current) return;
    const rows = enabledRows(ref.current);
    const current = rows.findIndex((row) => row.id === props.focusedKey);
    const row = rows[current];
    const fromGrid = event.target === event.currentTarget;

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      let next = current < 0 ? 0 : current + delta;
      if (props.shouldFocusWrap) next = (next + rows.length) % rows.length;
      else next = Math.min(rows.length - 1, Math.max(0, next));
      focusRow(rows[next]);
      ref.current.focus();
    } else if (fromGrid && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      focusRow(event.key === 'Home' ? rows[0] : rows.at(-1));
    } else if (
      props.keyboardNavigationBehavior !== 'tab' &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
      row
    ) {
      const focusables = rowFocusables(row);
      const focusIndex = focusables.indexOf(document.activeElement as HTMLElement);
      if (event.key === 'ArrowRight' && focusIndex < focusables.length - 1) {
        event.preventDefault();
        focusables[focusIndex + 1]?.focus();
      } else if (event.key === 'ArrowLeft' && focusIndex >= 0) {
        event.preventDefault();
        if (focusIndex === 0) ref.current.focus();
        else focusables[focusIndex - 1]?.focus();
      }
    } else if (fromGrid && event.key === ' ' && props.focusedKey) {
      event.preventDefault();
      props.onSelectionAction?.(props.focusedKey);
    } else if (fromGrid && event.key === 'Enter' && props.focusedKey) {
      event.preventDefault();
      if (props.onAction) props.onAction(props.focusedKey);
      else props.onSelectionAction?.(props.focusedKey);
    } else if (event.key === 'Escape' && props.escapeKeyBehavior !== 'none') {
      props.onClearSelection?.();
    } else if (
      fromGrid &&
      !props.disallowTypeAhead &&
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.isComposing
    ) {
      const now = performance.now();
      search.current = now - lastTypeTime.current > 500 ? event.key : search.current + event.key;
      lastTypeTime.current = now;
      const query = search.current.toLocaleLowerCase();
      const start = Math.max(0, current + 1);
      const ordered = [...rows.slice(start), ...rows.slice(0, start)];
      const match = ordered.find((candidate) =>
        (candidate.dataset.textValue ?? candidate.textContent ?? '')
          .trim()
          .toLocaleLowerCase()
          .startsWith(query),
      );
      if (match) {
        event.preventDefault();
        focusRow(match);
      }
    }
  }

  return {
    gridProps: {
      role: 'grid' as const,
      tabIndex: props.isDisabled ? undefined : 0,
      'aria-activedescendant': props.focusedKey,
      'aria-disabled': props.isDisabled || undefined,
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'],
      'aria-multiselectable': props.selectionMode === 'multiple' || undefined,
      onKeyDown,
      onFocus(event) {
        if (event.target === event.currentTarget && !props.focusedKey)
          focusRow(enabledRows(event.currentTarget)[0]);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}

export interface AriaGridListItemProps {
  id: string;
  key: string;
  isSelected?: boolean;
  isFocused?: boolean;
  isDisabled?: boolean;
  descriptionId?: string;
  onSelect?: (key: string) => void;
  onAction?: (key: string) => void;
  onFocus?: (key: string) => void;
}

function isInteractiveTarget(target: EventTarget | null, row: HTMLElement): boolean {
  return (
    target instanceof Element &&
    target !== row &&
    Boolean(target.closest('button, a, input, select, textarea'))
  );
}

export function useGridListItem(props: AriaGridListItemProps) {
  return {
    rowProps: {
      id: props.id,
      role: 'row' as const,
      'aria-selected': props.isSelected,
      'aria-disabled': props.isDisabled || undefined,
      onClick(event) {
        if (props.isDisabled || isInteractiveTarget(event.target, event.currentTarget)) return;
        props.onSelect?.(props.key);
      },
      onDblClick(event) {
        if (props.isDisabled || isInteractiveTarget(event.target, event.currentTarget)) return;
        props.onAction?.(props.key);
      },
      onPointerMove() {
        if (!props.isDisabled) props.onFocus?.(props.key);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    gridCellProps: {
      role: 'gridcell' as const,
      'aria-describedby': props.descriptionId,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    descriptionProps: {
      id: props.descriptionId,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    isSelected: props.isSelected ?? false,
    isDisabled: props.isDisabled ?? false,
    isFocused: props.isFocused ?? false,
  };
}

export interface AriaGridListSectionProps {
  id: string;
  hasHeading?: boolean;
  'aria-label'?: string;
}

export function useGridListSection(props: AriaGridListSectionProps) {
  const headingId = `${props.id}-heading`;
  return {
    rowProps: { role: 'row' as const } satisfies JSX.HTMLAttributes<HTMLElement>,
    rowHeaderProps: {
      id: headingId,
      role: 'rowheader' as const,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    rowGroupProps: {
      role: 'rowgroup' as const,
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-label'] || props.hasHeading === false ? undefined : headingId,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}

export interface AriaGridListSelectionCheckboxProps {
  isSelected: boolean;
  isDisabled?: boolean;
  'aria-label': string;
  onChange: (isSelected: boolean) => void;
}

export function useGridListSelectionCheckbox(props: AriaGridListSelectionCheckboxProps) {
  const checkbox = useCheckbox(props);
  return {
    checkboxProps: {
      ...checkbox.inputProps,
      'aria-label': props['aria-label'],
    } satisfies JSX.InputHTMLAttributes<HTMLInputElement>,
    isSelected: checkbox.isSelected,
    isDisabled: checkbox.isDisabled,
  };
}
