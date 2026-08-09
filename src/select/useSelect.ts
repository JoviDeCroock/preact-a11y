import type { JSX, TargetedKeyboardEvent } from 'preact';

export interface AriaSelectProps {
  isOpen: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  triggerId: string;
  listBoxId: string;
  labelId?: string;
  valueId?: string;
  onOpenChange: (isOpen: boolean, focusStrategy?: 'first' | 'last') => void;
}

export function useSelect(props: AriaSelectProps) {
  return {
    triggerProps: {
      id: props.triggerId,
      type: 'button',
      disabled: props.isDisabled,
      'aria-controls': props.isOpen ? props.listBoxId : undefined,
      'aria-expanded': props.isOpen,
      'aria-haspopup': 'listbox',
      'aria-required': props.isRequired || undefined,
      'aria-labelledby': [props.labelId, props.valueId].filter(Boolean).join(' ') || undefined,
      onClick() {
        if (!props.isDisabled) props.onOpenChange(!props.isOpen, 'first');
      },
      onKeyDown(event: TargetedKeyboardEvent<HTMLButtonElement>) {
        if (props.isDisabled || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
        event.preventDefault();
        props.onOpenChange(true, event.key === 'ArrowUp' ? 'last' : 'first');
      },
    } satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    valueProps: {
      id: props.valueId,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    menuProps: {
      id: props.listBoxId,
      'aria-labelledby': props.labelId,
    },
  };
}
