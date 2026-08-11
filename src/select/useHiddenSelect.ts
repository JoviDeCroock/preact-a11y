import type { JSX, TargetedEvent } from '../preactTypes';

export interface HiddenSelectOption {
  key: string;
  label: string;
  isDisabled?: boolean;
}

export interface AriaHiddenSelectProps {
  name?: string;
  selectedKey?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  label?: string;
  onChange?: (key: string) => void;
}

export function useHiddenSelect(props: AriaHiddenSelectProps) {
  return {
    selectProps: {
      name: props.name,
      value: props.selectedKey ?? '',
      disabled: props.isDisabled,
      required: props.isRequired,
      'aria-label': props.label,
      tabIndex: -1,
      onChange(event: TargetedEvent<HTMLSelectElement, Event>) {
        props.onChange?.(event.currentTarget.value);
      },
    } satisfies JSX.SelectHTMLAttributes<HTMLSelectElement>,
  };
}
