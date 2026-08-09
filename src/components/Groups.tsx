import { createContext } from 'preact';
import type { ComponentChildren, Ref } from 'preact';
import { useContext, useRef, useState } from 'preact/hooks';
import { useCheckboxGroup, type AriaCheckboxGroupProps } from '../groups/useCheckboxGroup';
import {
  useToggleButtonGroup,
  type AriaToggleButtonGroupProps,
} from '../groups/useToggleButtonGroup';
import { mergeRefs } from '../utils/mergeRefs';
import { Checkbox, type CheckboxProps } from './Checkbox';
import { ToggleButton, type ToggleButtonProps } from './ToggleButton';

interface CheckboxContextValue {
  values: Set<string>;
  isDisabled: boolean;
  isReadOnly: boolean;
  name?: string;
  toggle(value: string, selected: boolean): void;
}

const CheckboxContext = createContext<CheckboxContextValue | null>(null);

export interface CheckboxGroupProps extends AriaCheckboxGroupProps {
  children: ComponentChildren;
  value?: Iterable<string>;
  defaultValue?: Iterable<string>;
  name?: string;
  className?: string;
  onChange?: (values: Set<string>) => void;
}

export function CheckboxGroup({
  children,
  value,
  defaultValue,
  name,
  className,
  label,
  description,
  errorMessage,
  isInvalid,
  isRequired,
  isDisabled = false,
  isReadOnly = false,
  orientation = 'vertical',
  onChange,
}: CheckboxGroupProps) {
  const [uncontrolled, setUncontrolled] = useState(() => new Set(defaultValue));
  const values = value === undefined ? uncontrolled : new Set(value);
  const result = useCheckboxGroup({
    label,
    description,
    errorMessage,
    isInvalid,
    isRequired,
    isDisabled,
    isReadOnly,
    orientation,
  });
  const context: CheckboxContextValue = {
    values,
    isDisabled,
    isReadOnly,
    name,
    toggle(key, selected) {
      const next = new Set(values);
      if (selected) next.add(key);
      else next.delete(key);
      if (value === undefined) setUncontrolled(next);
      onChange?.(next);
    },
  };
  return (
    <div {...result.groupProps} className={className} data-orientation={orientation}>
      {label != null && <span {...result.labelProps}>{label}</span>}
      <CheckboxContext.Provider value={context}>{children}</CheckboxContext.Provider>
      {description != null && <div {...result.descriptionProps}>{description}</div>}
      {isInvalid && errorMessage != null && <div {...result.errorMessageProps}>{errorMessage}</div>}
    </div>
  );
}

export interface CheckboxGroupItemProps extends Omit<
  CheckboxProps,
  'isSelected' | 'name' | 'onChange'
> {
  value: string;
}

export function CheckboxGroupItem({
  value,
  isDisabled,
  isReadOnly,
  ...props
}: CheckboxGroupItemProps) {
  const group = useContext(CheckboxContext);
  if (!group) throw new Error('CheckboxGroupItem must be rendered inside <CheckboxGroup>.');
  return (
    <Checkbox
      {...props}
      isDisabled={group.isDisabled || isDisabled}
      isReadOnly={group.isReadOnly || isReadOnly}
      isSelected={group.values.has(value)}
      name={group.name}
      value={value}
      onChange={(selected) => group.toggle(value, selected)}
    />
  );
}

interface ToggleContextValue {
  values: Set<string>;
  isDisabled: boolean;
  toggle(key: string, selected: boolean): void;
}

const ToggleContext = createContext<ToggleContextValue | null>(null);

export interface ToggleButtonGroupProps extends AriaToggleButtonGroupProps {
  children: ComponentChildren;
  selectionMode?: 'single' | 'multiple';
  value?: Iterable<string>;
  defaultValue?: Iterable<string>;
  disallowEmptySelection?: boolean;
  className?: string;
  elementRef?: Ref<HTMLDivElement>;
  onChange?: (values: Set<string>) => void;
}

export function ToggleButtonGroup({
  children,
  selectionMode = 'single',
  value,
  defaultValue,
  disallowEmptySelection,
  isDisabled = false,
  orientation = 'horizontal',
  className,
  elementRef,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: ToggleButtonGroupProps) {
  const [uncontrolled, setUncontrolled] = useState(() => new Set(defaultValue));
  const values = value === undefined ? uncontrolled : new Set(value);
  const localRef = useRef<HTMLDivElement>(null);
  const { groupProps } = useToggleButtonGroup(
    { orientation, isDisabled, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby },
    localRef,
  );
  const context: ToggleContextValue = {
    values,
    isDisabled,
    toggle(key, selected) {
      const next = new Set(values);
      if (selected) {
        if (selectionMode === 'single') next.clear();
        next.add(key);
      } else if (!disallowEmptySelection || values.size > 1) {
        next.delete(key);
      }
      if (value === undefined) setUncontrolled(next);
      onChange?.(next);
    },
  };
  return (
    <ToggleContext.Provider value={context}>
      <div {...groupProps} className={className} ref={mergeRefs(localRef, elementRef)}>
        {children}
      </div>
    </ToggleContext.Provider>
  );
}

export interface ToggleButtonGroupItemProps extends Omit<
  ToggleButtonProps,
  'isSelected' | 'onChange'
> {
  id: string;
}

export function ToggleButtonGroupItem({ id, isDisabled, ...props }: ToggleButtonGroupItemProps) {
  const group = useContext(ToggleContext);
  if (!group) throw new Error('ToggleButtonGroupItem must be rendered inside <ToggleButtonGroup>.');
  return (
    <ToggleButton
      {...props}
      data-toggle-key={id}
      isDisabled={group.isDisabled || isDisabled}
      isSelected={group.values.has(id)}
      onChange={(selected) => group.toggle(id, selected)}
    />
  );
}
