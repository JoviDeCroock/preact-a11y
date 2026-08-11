import { useEffect, useState } from 'preact/hooks';
import type { RefObject } from 'preact';
import type { JSX, TargetedEvent } from '../preactTypes';

export interface AriaCheckboxProps {
  isSelected?: boolean;
  defaultSelected?: boolean;
  isIndeterminate?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  name?: string;
  value?: string;
  onChange?: (isSelected: boolean) => void;
}

export function useCheckbox(props: AriaCheckboxProps = {}, ref?: RefObject<HTMLInputElement>) {
  const [uncontrolled, setUncontrolled] = useState(props.defaultSelected ?? false);
  const isSelected = props.isSelected ?? uncontrolled;

  useEffect(() => {
    if (ref?.current) ref.current.indeterminate = props.isIndeterminate ?? false;
  }, [props.isIndeterminate, ref]);

  return {
    inputProps: {
      'aria-checked': props.isIndeterminate ? ('mixed' as const) : undefined,
      'aria-readonly': props.isReadOnly || undefined,
      checked: isSelected,
      disabled: props.isDisabled,
      name: props.name,
      readOnly: props.isReadOnly,
      required: props.isRequired,
      type: 'checkbox' as const,
      value: props.value,
      onClick(event) {
        if (props.isReadOnly) event.preventDefault();
      },
      onChange(event: TargetedEvent<HTMLInputElement, Event>) {
        if (props.isReadOnly) return;
        const next = event.currentTarget.checked;
        if (props.isSelected === undefined) setUncontrolled(next);
        props.onChange?.(next);
      },
    } satisfies JSX.InputHTMLAttributes<HTMLInputElement>,
    isDisabled: props.isDisabled ?? false,
    isSelected,
  };
}
