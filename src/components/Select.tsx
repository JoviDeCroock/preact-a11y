import type { ComponentChild, ComponentChildren, VNode } from 'preact';
import { toChildArray } from 'preact';
import { useId, useRef, useState } from 'preact/hooks';
import { useInteractOutside } from '../interactions/useInteractOutside';
import { HiddenSelect } from '../select/HiddenSelect';
import { useSelect } from '../select/useSelect';
import { ListBox, Option, type OptionProps } from './ListBox';

function optionData(children: ComponentChildren) {
  return toChildArray(children)
    .map((child: ComponentChild) => {
      if (typeof child !== 'object' || child == null || !('props' in child)) return null;
      const props = (child as VNode<OptionProps>).props;
      return {
        key: props.id,
        label: typeof props.children === 'string' ? props.children : String(props.id),
        isDisabled: props.isDisabled,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);
}

export const SelectItem = Option;
export type SelectItemProps = OptionProps;

export interface SelectProps {
  children: ComponentChildren;
  label: ComponentChildren;
  placeholder?: ComponentChildren;
  selectedKey?: string;
  defaultSelectedKey?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  name?: string;
  className?: string;
  triggerClassName?: string;
  listBoxClassName?: string;
  onSelectionChange?: (key: string) => void;
}

export function Select({
  children,
  label,
  placeholder = 'Select an option',
  selectedKey,
  defaultSelectedKey,
  isDisabled,
  isRequired,
  name,
  className,
  triggerClassName,
  listBoxClassName,
  onSelectionChange,
}: SelectProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultSelectedKey);
  const [isOpen, setOpen] = useState(false);
  const [focusStrategy, setFocusStrategy] = useState<'first' | 'last'>('first');
  const selection = selectedKey ?? uncontrolled;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listBoxRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const labelId = `preact-aria-select-label-${generatedId}`;
  const valueId = `preact-aria-select-value-${generatedId}`;
  const triggerId = `preact-aria-select-trigger-${generatedId}`;
  const listBoxId = `preact-aria-select-listbox-${generatedId}`;
  const options = optionData(children);
  const selectedLabel = options.find((option) => option.key === selection)?.label;

  function setOpenState(next: boolean, strategy: 'first' | 'last' = 'first') {
    setFocusStrategy(strategy);
    setOpen(next);
    queueMicrotask(() => (next ? listBoxRef.current?.focus() : triggerRef.current?.focus()));
  }

  function select(keys: Set<string>) {
    const key = keys.values().next().value as string | undefined;
    if (!key) return;
    if (selectedKey === undefined) setUncontrolled(key);
    onSelectionChange?.(key);
    setOpenState(false);
  }

  const { triggerProps, valueProps, menuProps } = useSelect({
    isOpen,
    isDisabled,
    isRequired,
    triggerId,
    listBoxId,
    labelId,
    valueId,
    onOpenChange: setOpenState,
  });
  useInteractOutside({
    ref: containerRef,
    isDisabled: !isOpen,
    onInteractOutside: () => setOpenState(false),
  });

  return (
    <div
      className={className}
      ref={containerRef}
      onKeyDown={(event) => event.key === 'Escape' && isOpen && setOpenState(false)}
    >
      <span id={labelId}>{label}</span>
      <button {...triggerProps} className={triggerClassName} ref={triggerRef}>
        <span {...valueProps}>{selectedLabel ?? placeholder}</span>
      </button>
      <HiddenSelect
        isDisabled={isDisabled}
        isRequired={isRequired}
        label={typeof label === 'string' ? label : undefined}
        name={name}
        options={options}
        selectedKey={selection}
        onChange={(key) => select(new Set([key]))}
      />
      {isOpen && (
        <ListBox
          {...menuProps}
          className={listBoxClassName}
          autoFocus={focusStrategy}
          elementRef={listBoxRef}
          selectedKeys={selection ? [selection] : []}
          onSelectionChange={select}
        >
          {children}
        </ListBox>
      )}
    </div>
  );
}
