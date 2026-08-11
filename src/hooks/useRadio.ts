import type { JSX, TargetedEvent } from '../preactTypes';
import { useState } from 'preact/hooks';

export interface AriaRadioProps {
  value: string;
  name?: string;
  isSelected?: boolean;
  defaultSelected?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  onChange?: (value: string) => void;
}

export function useRadio(props: AriaRadioProps) {
  const [uncontrolled, setUncontrolled] = useState(props.defaultSelected ?? false);
  const isSelected = props.isSelected ?? uncontrolled;

  return {
    inputProps: {
      checked: isSelected,
      disabled: props.isDisabled,
      name: props.name,
      required: props.isRequired,
      type: 'radio',
      value: props.value,
      'aria-readonly': props.isReadOnly || undefined,
      onClick(event) {
        if (props.isReadOnly) event.preventDefault();
      },
      onChange(event: TargetedEvent<HTMLInputElement, Event>) {
        if (props.isReadOnly || !event.currentTarget.checked) return;
        if (props.isSelected === undefined) setUncontrolled(true);
        props.onChange?.(props.value);
      },
    } satisfies JSX.InputHTMLAttributes<HTMLInputElement>,
    isDisabled: props.isDisabled ?? false,
    isSelected,
  };
}
