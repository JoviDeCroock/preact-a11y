import { createContext } from 'preact';
import type { ComponentChildren, Ref } from 'preact';
import type { JSX } from '../preactTypes';
import { useContext, useId, useMemo, useRef, useState } from 'preact/hooks';
import { useListBox, useOption, type SelectionMode } from '../collections/useListBox';
import { mergeRefs } from '../utils/mergeRefs';

interface ListBoxContextValue {
  baseId: string;
  focusedKey: string | undefined;
  selectedKeys: Set<string>;
  isDisabled: boolean;
  focus(key: string): void;
  select(key: string): void;
}

const ListBoxContext = createContext<ListBoxContextValue | null>(null);

export interface ListBoxProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'aria-label' | 'aria-labelledby' | 'autoFocus' | 'defaultValue' | 'onChange'
> {
  children: ComponentChildren;
  autoFocus?: 'first' | 'last';
  selectionMode?: SelectionMode;
  selectedKeys?: Iterable<string>;
  defaultSelectedKeys?: Iterable<string>;
  isDisabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  elementRef?: Ref<HTMLDivElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onSelectionChange?: (keys: Set<string>) => void;
}

export function ListBox({
  children,
  autoFocus,
  selectionMode = 'single',
  selectedKeys,
  defaultSelectedKeys,
  isDisabled = false,
  orientation = 'vertical',
  elementRef,
  onSelectionChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...domProps
}: ListBoxProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const [uncontrolled, setUncontrolled] = useState(() => new Set(defaultSelectedKeys));
  const selection = useMemo(
    () => (selectedKeys === undefined ? uncontrolled : new Set(selectedKeys)),
    [selectedKeys, uncontrolled],
  );
  const [focusedKey, setFocusedKey] = useState<string>();
  const baseId = `preact-a11y-listbox-${useId()}`;

  function select(key: string) {
    if (selectionMode === 'none' || isDisabled) return;
    const next = new Set(selectionMode === 'single' ? [] : selection);
    if (selectionMode === 'multiple' && next.has(key)) next.delete(key);
    else next.add(key);
    if (selectedKeys === undefined) setUncontrolled(next);
    onSelectionChange?.(next);
  }

  const context: ListBoxContextValue = {
    baseId,
    focusedKey,
    selectedKeys: selection,
    isDisabled,
    focus: setFocusedKey,
    select,
  };
  const { listBoxProps } = useListBox(
    {
      focusedKey: focusedKey ? `${baseId}-option-${focusedKey}` : undefined,
      autoFocus,
      selectionMode,
      orientation,
      isDisabled,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      onFocusedKeyChange(id) {
        setFocusedKey(id.replace(`${baseId}-option-`, ''));
      },
      onSelectionAction(id) {
        select(id.replace(`${baseId}-option-`, ''));
      },
    },
    localRef,
  );

  return (
    <ListBoxContext.Provider value={context}>
      <div
        {...domProps}
        {...listBoxProps}
        data-orientation={orientation}
        ref={mergeRefs(localRef, elementRef)}
      >
        {children}
      </div>
    </ListBoxContext.Provider>
  );
}

export interface OptionProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'id'> {
  id: string;
  children: ComponentChildren;
  isDisabled?: boolean;
}

export function Option({ id, children, isDisabled = false, ...domProps }: OptionProps) {
  const context = useContext(ListBoxContext);
  if (!context) throw new Error('Option must be rendered inside <ListBox>.');
  const isSelected = context.selectedKeys.has(id);
  const isFocused = context.focusedKey === id;
  const optionId = `${context.baseId}-option-${id}`;
  const { optionProps } = useOption({
    id: optionId,
    key: id,
    isSelected,
    isFocused,
    isDisabled: context.isDisabled || isDisabled,
    onAction: context.select,
    onFocus: context.focus,
  });

  return (
    <div
      {...domProps}
      {...optionProps}
      data-focused={isFocused || undefined}
      data-key={optionId}
      data-selected={isSelected || undefined}
    >
      {children}
    </div>
  );
}
