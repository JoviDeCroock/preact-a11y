import type { RefObject } from 'preact';
import type { JSX, TargetedKeyboardEvent } from '../preactTypes';
import { useButton } from '../hooks/useButton';
import {
  useGridList,
  useGridListItem,
  type AriaGridListItemProps,
  type AriaGridListProps,
} from './useGridList';

export interface AriaTreeProps extends Omit<AriaGridListProps, 'shouldFocusWrap'> {
  getParentKey?: (key: string) => string | undefined;
  getFirstChildKey?: (key: string) => string | undefined;
  isExpanded?: (key: string) => boolean;
  isExpandable?: (key: string) => boolean;
  onExpandedChange?: (key: string, expanded: boolean) => void;
}

function focusableChildren(row: HTMLElement | undefined): HTMLElement[] {
  if (!row) return [];
  return Array.from(
    row.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function useTree(props: AriaTreeProps, ref: RefObject<HTMLElement>) {
  const grid = useGridList({ ...props, keyboardNavigationBehavior: 'tab' }, ref);
  const baseKeyDown = grid.gridProps.onKeyDown as
    | ((event: TargetedKeyboardEvent<HTMLElement>) => void)
    | undefined;

  return {
    gridProps: {
      ...grid.gridProps,
      role: 'treegrid',
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        const fromTree = event.target === event.currentTarget;
        const key = props.focusedKey;
        if (event.key === 'Escape' && !fromTree) {
          event.preventDefault();
          ref.current?.focus();
          return;
        }
        if (fromTree && event.key === 'F2' && key) {
          const row = Array.from(
            ref.current?.querySelectorAll<HTMLElement>('[role="row"]') ?? [],
          ).find((candidate) => candidate.id === key);
          const target = focusableChildren(row)[0];
          if (target) {
            event.preventDefault();
            target.focus();
          }
          return;
        }
        if (fromTree && key && event.key === 'ArrowRight' && props.isExpandable?.(key)) {
          event.preventDefault();
          if (!props.isExpanded?.(key)) props.onExpandedChange?.(key, true);
          else {
            const child = props.getFirstChildKey?.(key);
            if (child) props.onFocusedKeyChange?.(child);
          }
          return;
        }
        if (fromTree && key && event.key === 'ArrowLeft') {
          if (props.isExpandable?.(key) && props.isExpanded?.(key)) {
            event.preventDefault();
            props.onExpandedChange?.(key, false);
            return;
          }
          const parent = props.getParentKey?.(key);
          if (parent) {
            event.preventDefault();
            props.onFocusedKeyChange?.(parent);
            return;
          }
        }
        baseKeyDown?.(event);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}

export interface AriaTreeItemProps extends AriaGridListItemProps {
  level: number;
  posInSet: number;
  setSize: number;
  isExpanded?: boolean;
  hasChildItems?: boolean;
  label: string;
  onToggle?: (expanded: boolean) => void;
}

export interface TreeItemAria {
  rowProps: JSX.HTMLAttributes<HTMLDivElement>;
  gridCellProps: JSX.HTMLAttributes<HTMLDivElement>;
  descriptionProps: JSX.HTMLAttributes<HTMLDivElement>;
  expandButtonProps: JSX.ButtonHTMLAttributes<HTMLButtonElement>;
  isSelected: boolean;
  isDisabled: boolean;
  isFocused: boolean;
}

export function useTreeItem(props: AriaTreeItemProps): TreeItemAria {
  const item = useGridListItem(props);
  const expand = useButton({
    isDisabled: props.isDisabled,
    onPress: () => props.onToggle?.(!props.isExpanded),
  });
  return {
    ...item,
    rowProps: {
      ...item.rowProps,
      'aria-level': props.level,
      'aria-posinset': props.posInSet,
      'aria-setsize': props.setSize,
      'aria-expanded': props.hasChildItems ? (props.isExpanded ?? false) : undefined,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    expandButtonProps: {
      ...expand.buttonProps,
      'aria-label': `${props.isExpanded ? 'Collapse' : 'Expand'} ${props.label}`,
      'aria-expanded': props.hasChildItems ? (props.isExpanded ?? false) : undefined,
    } satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  };
}
