import { createContext } from 'preact';
import type { ComponentChildren, Ref } from 'preact';
import type { JSX } from '../preactTypes';
import { useContext, useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import {
  useGridList,
  useGridListItem,
  useGridListSection,
  useGridListSelectionCheckbox,
} from '../collections/useGridList';
import type { SelectionMode } from '../collections/useListBox';
import { mergeRefs } from '../utils/mergeRefs';

interface GridContextValue {
  baseId: string;
  focusedKey?: string;
  selectedKeys: Set<string>;
  selectionMode: SelectionMode;
  keyboardNavigationBehavior: 'arrow' | 'tab';
  isDisabled: boolean;
  focus(key: string): void;
  select(key: string): void;
  action(key: string): void;
}

const GridContext = createContext<GridContextValue | null>(null);
const ItemContext = createContext<{ id: string; label: string; isDisabled: boolean } | null>(null);

export interface GridListProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'aria-label' | 'aria-labelledby' | 'onChange'
> {
  children: ComponentChildren;
  selectionMode?: SelectionMode;
  selectedKeys?: Iterable<string>;
  defaultSelectedKeys?: Iterable<string>;
  isDisabled?: boolean;
  keyboardNavigationBehavior?: 'arrow' | 'tab';
  shouldFocusWrap?: boolean;
  elementRef?: Ref<HTMLDivElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onSelectionChange?: (keys: Set<string>) => void;
  onAction?: (key: string) => void;
}

export function GridList({
  children,
  selectionMode = 'single',
  selectedKeys,
  defaultSelectedKeys,
  isDisabled = false,
  keyboardNavigationBehavior,
  shouldFocusWrap,
  elementRef,
  onSelectionChange,
  onAction,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...domProps
}: GridListProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const baseId = `preact-aria-grid-${useId()}`;
  const [uncontrolled, setUncontrolled] = useState(() => new Set(defaultSelectedKeys));
  const selection = useMemo(
    () => (selectedKeys === undefined ? uncontrolled : new Set(selectedKeys)),
    [selectedKeys, uncontrolled],
  );
  const [focusedKey, setFocusedKey] = useState<string>();

  function select(key: string) {
    if (selectionMode === 'none' || isDisabled) return;
    const next = new Set(selectionMode === 'single' ? [] : selection);
    if (selectionMode === 'multiple' && next.has(key)) next.delete(key);
    else next.add(key);
    if (selectedKeys === undefined) setUncontrolled(next);
    onSelectionChange?.(next);
  }

  const context: GridContextValue = {
    baseId,
    focusedKey,
    selectedKeys: selection,
    selectionMode,
    keyboardNavigationBehavior: keyboardNavigationBehavior ?? 'arrow',
    isDisabled,
    focus: setFocusedKey,
    select,
    action: (key) => onAction?.(key),
  };
  const { gridProps } = useGridList(
    {
      focusedKey: focusedKey ? `${baseId}-row-${focusedKey}` : undefined,
      selectionMode,
      isDisabled,
      keyboardNavigationBehavior,
      shouldFocusWrap,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      onFocusedKeyChange: (id) => setFocusedKey(id.replace(`${baseId}-row-`, '')),
      onSelectionAction: (id) => select(id.replace(`${baseId}-row-`, '')),
      onAction: onAction ? (id) => onAction(id.replace(`${baseId}-row-`, '')) : undefined,
      onClearSelection() {
        const next = new Set<string>();
        if (selectedKeys === undefined) setUncontrolled(next);
        onSelectionChange?.(next);
      },
    },
    localRef,
  );
  return (
    <GridContext.Provider value={context}>
      <div {...domProps} {...gridProps} ref={mergeRefs(localRef, elementRef)}>
        {children}
      </div>
    </GridContext.Provider>
  );
}

export interface GridListItemProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'id'> {
  id: string;
  children: ComponentChildren;
  textValue?: string;
  description?: ComponentChildren;
  isDisabled?: boolean;
  elementRef?: Ref<HTMLDivElement>;
}

export function GridListItem({
  id,
  children,
  textValue,
  description,
  isDisabled = false,
  elementRef,
  ...domProps
}: GridListItemProps) {
  const context = useContext(GridContext);
  if (!context) throw new Error('GridListItem must be rendered inside <GridList>.');
  const rowId = `${context.baseId}-row-${id}`;
  const localRef = useRef<HTMLDivElement>(null);
  const disabled = context.isDisabled || isDisabled;
  const result = useGridListItem({
    id: rowId,
    key: id,
    isSelected: context.selectionMode === 'none' ? undefined : context.selectedKeys.has(id),
    isFocused: context.focusedKey === id,
    isDisabled: disabled,
    descriptionId: description == null ? undefined : `${rowId}-description`,
    onSelect: context.select,
    onAction: context.action,
    onFocus: context.focus,
  });
  const label = textValue ?? (typeof children === 'string' ? children : id);
  useEffect(() => {
    if (context.keyboardNavigationBehavior !== 'arrow' || !localRef.current) return;
    const elements = Array.from(
      localRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]',
      ),
    );
    const previous = elements.map((element) => element.getAttribute('tabindex'));
    elements.forEach((element) => element.setAttribute('tabindex', '-1'));
    return () => {
      elements.forEach((element, index) => {
        const value = previous[index];
        if (value == null) element.removeAttribute('tabindex');
        else element.setAttribute('tabindex', value);
      });
    };
  }, [children, context.keyboardNavigationBehavior]);
  return (
    <ItemContext.Provider value={{ id, label, isDisabled: disabled }}>
      <div
        {...domProps}
        {...result.rowProps}
        data-focused={result.isFocused || undefined}
        data-grid-key={id}
        data-selected={result.isSelected || undefined}
        data-text-value={label}
        ref={mergeRefs(localRef, elementRef)}
      >
        <div {...result.gridCellProps}>
          {children}
          {description != null && <div {...result.descriptionProps}>{description}</div>}
        </div>
      </div>
    </ItemContext.Provider>
  );
}

export interface GridListSelectionCheckboxProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'checked' | 'onChange' | 'type'
> {
  'aria-label'?: string;
}

export function GridListSelectionCheckbox({
  'aria-label': ariaLabel,
  ...domProps
}: GridListSelectionCheckboxProps) {
  const grid = useContext(GridContext);
  const item = useContext(ItemContext);
  if (!grid || !item)
    throw new Error('GridListSelectionCheckbox must be rendered inside <GridListItem>.');
  const { checkboxProps } = useGridListSelectionCheckbox({
    isSelected: grid.selectedKeys.has(item.id),
    isDisabled: item.isDisabled || grid.selectionMode === 'none',
    'aria-label': ariaLabel ?? `Select ${item.label}`,
    onChange: () => grid.select(item.id),
  });
  return <input {...domProps} {...checkboxProps} />;
}

export interface GridListSectionProps {
  id: string;
  heading?: ComponentChildren;
  children: ComponentChildren;
  'aria-label'?: string;
  className?: string;
}

export function GridListSection({
  id,
  heading,
  children,
  className,
  ...props
}: GridListSectionProps) {
  const result = useGridListSection({
    id,
    hasHeading: heading != null,
    'aria-label': props['aria-label'],
  });
  return (
    <div {...result.rowGroupProps} className={className}>
      {heading != null && (
        <div {...result.rowProps}>
          <div {...result.rowHeaderProps}>{heading}</div>
        </div>
      )}
      {children}
    </div>
  );
}
