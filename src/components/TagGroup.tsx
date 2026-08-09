import { createContext, Fragment, toChildArray } from 'preact';
import type { ComponentChildren, JSX, Ref } from 'preact';
import { useContext, useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import { useTag, useTagGroup } from '../collections/useTagGroup';
import type { SelectionMode } from '../collections/useListBox';
import { mergeRefs } from '../utils/mergeRefs';

interface TagContextValue {
  baseId: string;
  focusedKey?: string;
  selectedKeys: Set<string>;
  selectionMode: SelectionMode;
  isDisabled: boolean;
  allowsRemoving: boolean;
  focus(key: string): void;
  select(key: string): void;
  action(key: string): void;
  remove(keys: Set<string>): void;
}

const TagContext = createContext<TagContextValue | null>(null);

export interface TagGroupProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'aria-label' | 'aria-labelledby' | 'onChange'
> {
  children?: ComponentChildren;
  label?: ComponentChildren;
  description?: ComponentChildren;
  errorMessage?: ComponentChildren;
  emptyState?: ComponentChildren;
  isInvalid?: boolean;
  isDisabled?: boolean;
  selectionMode?: SelectionMode;
  selectedKeys?: Iterable<string>;
  defaultSelectedKeys?: Iterable<string>;
  elementRef?: Ref<HTMLDivElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onSelectionChange?: (keys: Set<string>) => void;
  onAction?: (key: string) => void;
  onRemove?: (keys: Set<string>) => void;
}

export function TagGroup({
  children,
  label,
  description,
  errorMessage,
  emptyState = 'No tags',
  isInvalid,
  isDisabled = false,
  selectionMode = 'none',
  selectedKeys,
  defaultSelectedKeys,
  elementRef,
  onSelectionChange,
  onAction,
  onRemove,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...domProps
}: TagGroupProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const baseId = `preact-aria-tags-${useId()}`;
  const [uncontrolled, setUncontrolled] = useState(() => new Set(defaultSelectedKeys));
  const selection = useMemo(
    () => (selectedKeys === undefined ? uncontrolled : new Set(selectedKeys)),
    [selectedKeys, uncontrolled],
  );
  const [focusedKey, setFocusedKey] = useState<string>();
  const tagCount = toChildArray(children).filter(
    (child) => typeof child === 'object' && child != null && child.type === Tag,
  ).length;
  const previousKeys = useRef<string[]>([]);

  function select(key: string) {
    if (selectionMode === 'none' || isDisabled) return;
    const next = new Set(selectionMode === 'single' ? [] : selection);
    if (selectionMode === 'multiple' && next.has(key)) next.delete(key);
    else next.add(key);
    if (selectedKeys === undefined) setUncontrolled(next);
    onSelectionChange?.(next);
  }

  function remove(keys: Set<string>) {
    if (!isDisabled) onRemove?.(keys);
  }

  useEffect(() => {
    const current = Array.from(
      localRef.current?.querySelectorAll<HTMLElement>('[data-tag-key]') ?? [],
    ).map((element) => element.dataset.tagKey!);
    if (focusedKey && !current.includes(focusedKey)) {
      const oldIndex = previousKeys.current.indexOf(focusedKey);
      const next = current[Math.min(Math.max(0, oldIndex), current.length - 1)];
      setFocusedKey(next);
      if (current.length === 0) localRef.current?.focus();
    }
    previousKeys.current = current;
  }, [children, focusedKey]);

  const context: TagContextValue = {
    baseId,
    focusedKey,
    selectedKeys: selection,
    selectionMode,
    isDisabled,
    allowsRemoving: Boolean(onRemove),
    focus: setFocusedKey,
    select,
    action: (key) => onAction?.(key),
    remove,
  };
  const result = useTagGroup(
    {
      focusedKey: focusedKey ? `${baseId}-tag-${focusedKey}` : undefined,
      tagCount,
      selectionMode,
      selectedKeys: new Set(Array.from(selection, (key) => `${baseId}-tag-${key}`)),
      isDisabled,
      label,
      description,
      errorMessage,
      isInvalid,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      onFocusedKeyChange: (id) => setFocusedKey(id.replace(`${baseId}-tag-`, '')),
      onSelectionAction: (id) => select(id.replace(`${baseId}-tag-`, '')),
      onAction: onAction ? (id) => onAction(id.replace(`${baseId}-tag-`, '')) : undefined,
      onClearSelection() {
        const next = new Set<string>();
        if (selectedKeys === undefined) setUncontrolled(next);
        onSelectionChange?.(next);
      },
      onRemove: onRemove
        ? (ids) => remove(new Set(Array.from(ids, (id) => id.replace(`${baseId}-tag-`, ''))))
        : undefined,
    },
    localRef,
  );
  return (
    <TagContext.Provider value={context}>
      <Fragment>
        {label != null && <span {...result.labelProps}>{label}</span>}
        <div {...domProps} {...result.gridProps} ref={mergeRefs(localRef, elementRef)}>
          {tagCount ? children : emptyState}
        </div>
        {description != null && <div {...result.descriptionProps}>{description}</div>}
        {isInvalid && errorMessage != null && (
          <div {...result.errorMessageProps}>{errorMessage}</div>
        )}
      </Fragment>
    </TagContext.Provider>
  );
}

export interface TagProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'id'> {
  id: string;
  children: ComponentChildren;
  textValue?: string;
  isDisabled?: boolean;
}

export function Tag({ id, children, textValue, isDisabled = false, ...domProps }: TagProps) {
  const context = useContext(TagContext);
  if (!context) throw new Error('Tag must be rendered inside <TagGroup>.');
  const label = textValue ?? (typeof children === 'string' ? children : id);
  const disabled = context.isDisabled || isDisabled;
  const result = useTag({
    id: `${context.baseId}-tag-${id}`,
    key: id,
    label,
    isSelected: context.selectionMode === 'none' ? undefined : context.selectedKeys.has(id),
    isFocused: context.focusedKey === id,
    isDisabled: disabled,
    allowsRemoving: context.allowsRemoving,
    onSelect: context.select,
    onAction: context.action,
    onFocus: context.focus,
    onRemove: () => context.remove(new Set([id])),
  });
  return (
    <div
      {...domProps}
      {...result.rowProps}
      data-focused={result.isFocused || undefined}
      data-selected={result.isSelected || undefined}
      data-tag-key={id}
      data-text-value={label}
    >
      <div {...result.gridCellProps}>
        {children}
        {result.allowsRemoving && <button {...result.removeButtonProps}>×</button>}
      </div>
    </div>
  );
}
