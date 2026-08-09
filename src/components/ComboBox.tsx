import type { ComponentChildren } from 'preact';
import { toChildArray } from 'preact';
import { useId, useMemo, useRef, useState } from 'preact/hooks';
import { useComboBox } from '../combobox/useComboBox';
import { useFilter } from '../i18n/formatters';
import { useInteractOutside } from '../interactions/useInteractOutside';
import { HiddenSelect } from '../select/HiddenSelect';

export interface ComboBoxItemProps {
  id: string;
  children: string;
  isDisabled?: boolean;
}

export function ComboBoxItem(_props: ComboBoxItemProps) {
  return null;
}

export interface ComboBoxProps {
  children: ComponentChildren;
  label: ComponentChildren;
  inputValue?: string;
  defaultInputValue?: string;
  selectedKey?: string;
  defaultSelectedKey?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  name?: string;
  onInputChange?: (value: string) => void;
  onSelectionChange?: (key: string | null) => void;
}

export function ComboBox(props: ComboBoxProps) {
  const items = useMemo(
    () =>
      toChildArray(props.children).flatMap((child) =>
        typeof child === 'object' && child != null && 'props' in child
          ? [child.props as ComboBoxItemProps]
          : [],
      ),
    [props.children],
  );
  const initialKey = props.selectedKey ?? props.defaultSelectedKey;
  const initialLabel = items.find((item) => item.id === initialKey)?.children ?? '';
  const [uncontrolledInput, setUncontrolledInput] = useState(
    props.defaultInputValue ?? initialLabel,
  );
  const [uncontrolledKey, setUncontrolledKey] = useState(props.defaultSelectedKey);
  const [isOpen, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const value = props.inputValue ?? uncontrolledInput;
  const selection = props.selectedKey ?? uncontrolledKey;
  const { contains } = useFilter({ sensitivity: 'base' });
  const filtered = value
    ? items.filter((item) => contains(item.children, value) || item.id === selection)
    : items;
  const enabled = filtered.filter((item) => !item.isDisabled);
  const activeItem = enabled[focusedIndex];
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const labelId = `preact-aria-combobox-label-${generatedId}`;
  const inputId = `preact-aria-combobox-input-${generatedId}`;
  const listBoxId = `preact-aria-combobox-listbox-${generatedId}`;

  function changeInput(next: string) {
    if (props.inputValue === undefined) setUncontrolledInput(next);
    if (props.selectedKey === undefined) setUncontrolledKey(undefined);
    props.onInputChange?.(next);
    props.onSelectionChange?.(null);
    setFocusedIndex(0);
  }

  function navigate(direction: 'first' | 'last' | 'next' | 'previous') {
    if (!enabled.length) return;
    if (direction === 'first') setFocusedIndex(0);
    else if (direction === 'last') setFocusedIndex(enabled.length - 1);
    else if (direction === 'next')
      setFocusedIndex((index) => (index + 1 + enabled.length) % enabled.length);
    else setFocusedIndex((index) => (index <= 0 ? enabled.length - 1 : index - 1));
  }

  function select(item = activeItem) {
    if (!item) return;
    if (props.selectedKey === undefined) setUncontrolledKey(item.id);
    if (props.inputValue === undefined) setUncontrolledInput(item.children);
    props.onSelectionChange?.(item.id);
    props.onInputChange?.(item.children);
    setOpen(false);
    inputRef.current?.focus();
  }

  const result = useComboBox({
    isOpen,
    isDisabled: props.isDisabled,
    isReadOnly: props.isReadOnly,
    inputValue: value,
    inputId,
    listBoxId,
    labelId,
    activeDescendant: activeItem ? `${listBoxId}-option-${activeItem.id}` : undefined,
    onInputChange: changeInput,
    onOpenChange(next) {
      setOpen(next);
      if (next && focusedIndex < 0) setFocusedIndex(0);
    },
    onNavigate: navigate,
    onSelectionAction: () => select(),
  });
  useInteractOutside({
    ref: containerRef,
    isDisabled: !isOpen,
    onInteractOutside: () => setOpen(false),
  });

  return (
    <div ref={containerRef}>
      <label id={labelId} htmlFor={inputId}>
        {props.label}
      </label>
      <input {...result.inputProps} ref={inputRef} required={props.isRequired} />
      <button {...result.buttonProps}>▾</button>
      <HiddenSelect
        isDisabled={props.isDisabled}
        isRequired={props.isRequired}
        label={typeof props.label === 'string' ? props.label : undefined}
        name={props.name}
        options={items.map((item) => ({
          key: item.id,
          label: item.children,
          isDisabled: item.isDisabled,
        }))}
        selectedKey={selection}
        onChange={(key) => select(items.find((item) => item.id === key))}
      />
      {isOpen && (
        <div {...result.listBoxProps}>
          {filtered.map((item) => (
            <div
              aria-disabled={item.isDisabled || undefined}
              aria-selected={selection === item.id}
              data-focused={activeItem?.id === item.id || undefined}
              id={`${listBoxId}-option-${item.id}`}
              key={item.id}
              role="option"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => !item.isDisabled && select(item)}
              onPointerMove={() => !item.isDisabled && setFocusedIndex(enabled.indexOf(item))}
            >
              {item.children}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
