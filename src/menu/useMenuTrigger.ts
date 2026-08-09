import type { JSX, TargetedKeyboardEvent } from 'preact';

export interface AriaMenuTriggerProps {
  isOpen: boolean;
  isDisabled?: boolean;
  triggerId: string;
  menuId: string;
  onOpenChange: (isOpen: boolean, focusStrategy?: 'first' | 'last') => void;
}

export function useMenuTrigger(props: AriaMenuTriggerProps) {
  return {
    menuTriggerProps: {
      id: props.triggerId,
      type: 'button',
      disabled: props.isDisabled,
      'aria-controls': props.isOpen ? props.menuId : undefined,
      'aria-expanded': props.isOpen,
      'aria-haspopup': 'menu',
      onClick() {
        if (!props.isDisabled) props.onOpenChange(!props.isOpen, 'first');
      },
      onKeyDown(event: TargetedKeyboardEvent<HTMLButtonElement>) {
        if (props.isDisabled || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
        event.preventDefault();
        props.onOpenChange(true, event.key === 'ArrowUp' ? 'last' : 'first');
      },
    } satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  };
}
