import { toChildArray } from 'preact';
import type { ComponentChildren, Ref, VNode } from 'preact';
import type { JSX } from '../preactTypes';
import { useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import { useTree, useTreeItem } from '../collections/useTree';
import type { SelectionMode } from '../collections/useListBox';
import { mergeRefs } from '../utils/mergeRefs';

export interface TreeItemProps {
  id: string;
  title: ComponentChildren;
  children?: ComponentChildren;
  textValue?: string;
  description?: ComponentChildren;
  isDisabled?: boolean;
  hasChildItems?: boolean;
}

export function TreeItem(_props: TreeItemProps) {
  return null;
}

interface FlatTreeNode extends TreeItemProps {
  parentId?: string;
  level: number;
  posInSet: number;
  setSize: number;
}

function itemChildren(children: ComponentChildren): Array<VNode<TreeItemProps>> {
  const result: Array<VNode<TreeItemProps>> = [];
  for (const child of toChildArray(children)) {
    if (typeof child === 'object' && child != null && child.type === TreeItem) {
      result.push(child as VNode<TreeItemProps>);
    }
  }
  return result;
}

function flattenTree(
  children: ComponentChildren,
  expanded: Set<string>,
  parentId?: string,
  level = 1,
): FlatTreeNode[] {
  const items = itemChildren(children);
  return items.flatMap((item, index) => {
    const node: FlatTreeNode = {
      ...item.props,
      parentId,
      level,
      posInSet: index + 1,
      setSize: items.length,
    };
    return [
      node,
      ...(expanded.has(node.id) ? flattenTree(node.children, expanded, node.id, level + 1) : []),
    ];
  });
}

interface TreeRowProps {
  node: FlatTreeNode;
  baseId: string;
  isFocused: boolean;
  isSelected: boolean | undefined;
  isExpanded: boolean;
  onFocus: (id: string) => void;
  onSelect: (id: string) => void;
  onAction: (id: string) => void;
  onToggle: (id: string, expanded: boolean) => void;
}

function TreeRow({
  node,
  baseId,
  isFocused,
  isSelected,
  isExpanded,
  onFocus,
  onSelect,
  onAction,
  onToggle,
}: TreeRowProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const rowId = `${baseId}-row-${node.id}`;
  const label = node.textValue ?? (typeof node.title === 'string' ? node.title : node.id);
  const hasChildren = node.hasChildItems || itemChildren(node.children).length > 0;
  const result = useTreeItem({
    id: rowId,
    key: node.id,
    label,
    level: node.level,
    posInSet: node.posInSet,
    setSize: node.setSize,
    isSelected,
    isFocused,
    isDisabled: node.isDisabled,
    isExpanded,
    hasChildItems: hasChildren,
    descriptionId: node.description == null ? undefined : `${rowId}-description`,
    onSelect,
    onAction,
    onFocus,
    onToggle: (expanded) => onToggle(node.id, expanded),
  });
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
  }, [node.title, isExpanded]);
  return (
    <div
      {...result.rowProps}
      data-focused={isFocused || undefined}
      data-grid-key={node.id}
      data-selected={isSelected || undefined}
      data-text-value={label}
      ref={localRef}
    >
      <div {...result.gridCellProps}>
        {hasChildren && <button {...result.expandButtonProps}>▸</button>}
        {node.title}
        {node.description != null && <div {...result.descriptionProps}>{node.description}</div>}
      </div>
    </div>
  );
}

export interface TreeProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'aria-label' | 'aria-labelledby' | 'onChange'
> {
  children: ComponentChildren;
  selectionMode?: SelectionMode;
  selectedKeys?: Iterable<string>;
  defaultSelectedKeys?: Iterable<string>;
  expandedKeys?: Iterable<string>;
  defaultExpandedKeys?: Iterable<string>;
  isDisabled?: boolean;
  elementRef?: Ref<HTMLDivElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onSelectionChange?: (keys: Set<string>) => void;
  onExpandedChange?: (keys: Set<string>) => void;
  onAction?: (key: string) => void;
}

export function Tree({
  children,
  selectionMode = 'single',
  selectedKeys,
  defaultSelectedKeys,
  expandedKeys,
  defaultExpandedKeys,
  isDisabled = false,
  elementRef,
  onSelectionChange,
  onExpandedChange,
  onAction,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...domProps
}: TreeProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const baseId = `preact-aria-tree-${useId()}`;
  const [uncontrolledSelection, setUncontrolledSelection] = useState(
    () => new Set(defaultSelectedKeys),
  );
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(
    () => new Set(defaultExpandedKeys),
  );
  const selection = useMemo(
    () => (selectedKeys === undefined ? uncontrolledSelection : new Set(selectedKeys)),
    [selectedKeys, uncontrolledSelection],
  );
  const expanded = useMemo(
    () => (expandedKeys === undefined ? uncontrolledExpanded : new Set(expandedKeys)),
    [expandedKeys, uncontrolledExpanded],
  );
  const nodes = useMemo(() => flattenTree(children, expanded), [children, expanded]);
  const [focusedKey, setFocusedKey] = useState<string>();

  function select(key: string) {
    if (selectionMode === 'none' || isDisabled) return;
    const next = new Set(selectionMode === 'single' ? [] : selection);
    if (selectionMode === 'multiple' && next.has(key)) next.delete(key);
    else next.add(key);
    if (selectedKeys === undefined) setUncontrolledSelection(next);
    onSelectionChange?.(next);
  }

  function toggle(key: string, open: boolean) {
    const next = new Set(expanded);
    if (open) next.add(key);
    else next.delete(key);
    if (expandedKeys === undefined) setUncontrolledExpanded(next);
    onExpandedChange?.(next);
  }

  const domId = (key: string) => `${baseId}-row-${key}`;
  const keyFromDom = (id: string) => id.replace(`${baseId}-row-`, '');
  const result = useTree(
    {
      focusedKey: focusedKey ? domId(focusedKey) : undefined,
      selectionMode,
      isDisabled,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      onFocusedKeyChange: (id) => setFocusedKey(keyFromDom(id)),
      onSelectionAction: (id) => select(keyFromDom(id)),
      onAction: onAction ? (id) => onAction(keyFromDom(id)) : undefined,
      onClearSelection() {
        const next = new Set<string>();
        if (selectedKeys === undefined) setUncontrolledSelection(next);
        onSelectionChange?.(next);
      },
      getParentKey(id) {
        const parent = nodes.find((node) => domId(node.id) === id)?.parentId;
        return parent ? domId(parent) : undefined;
      },
      getFirstChildKey(id) {
        const key = keyFromDom(id);
        const child = nodes.find((node) => node.parentId === key);
        return child ? domId(child.id) : undefined;
      },
      isExpanded: (id) => expanded.has(keyFromDom(id)),
      isExpandable(id) {
        const node = nodes.find((item) => domId(item.id) === id);
        return Boolean(node && (node.hasChildItems || itemChildren(node.children).length));
      },
      onExpandedChange: (id, open) => toggle(keyFromDom(id), open),
    },
    localRef,
  );

  return (
    <div {...domProps} {...result.gridProps} ref={mergeRefs(localRef, elementRef)}>
      {nodes.map((node) => (
        <TreeRow
          baseId={baseId}
          isExpanded={expanded.has(node.id)}
          isFocused={focusedKey === node.id}
          isSelected={selectionMode === 'none' ? undefined : selection.has(node.id)}
          key={node.id}
          node={node}
          onAction={(key) => onAction?.(key)}
          onFocus={setFocusedKey}
          onSelect={select}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}
