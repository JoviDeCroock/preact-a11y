import type { JSX, TargetedEvent, TargetedKeyboardEvent } from '../preactTypes';

export interface AriaComboBoxProps {
  isOpen: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  inputValue: string;
  inputId: string;
  listBoxId: string;
  labelId?: string;
  activeDescendant?: string;
  onInputChange: (value: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onNavigate: (direction: 'first' | 'last' | 'next' | 'previous') => void;
  onSelectionAction: () => void;
}

export function useComboBox(props: AriaComboBoxProps) {
  return {
    inputProps: {
      id: props.inputId,
      role: 'combobox' as const,
      type: 'text' as const,
      autoComplete: 'off',
      disabled: props.isDisabled,
      readOnly: props.isReadOnly,
      value: props.inputValue,
      'aria-autocomplete': 'list',
      'aria-controls': props.isOpen ? props.listBoxId : undefined,
      'aria-expanded': props.isOpen,
      'aria-labelledby': props.labelId,
      'aria-activedescendant': props.isOpen ? props.activeDescendant : undefined,
      onInput(event: TargetedEvent<HTMLInputElement, Event>) {
        props.onInputChange(event.currentTarget.value);
        props.onOpenChange(true);
      },
      onKeyDown(event: TargetedKeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          props.onOpenChange(true);
          props.onNavigate(event.key === 'ArrowDown' ? 'next' : 'previous');
        } else if (event.key === 'Home' && props.isOpen) {
          event.preventDefault();
          props.onNavigate('first');
        } else if (event.key === 'End' && props.isOpen) {
          event.preventDefault();
          props.onNavigate('last');
        } else if (event.key === 'Enter' && props.isOpen) {
          event.preventDefault();
          props.onSelectionAction();
        } else if (event.key === 'Escape' && props.isOpen) {
          event.preventDefault();
          props.onOpenChange(false);
        } else if (event.key === 'Tab') props.onOpenChange(false);
      },
    } satisfies JSX.InputHTMLAttributes<HTMLInputElement>,
    buttonProps: {
      type: 'button',
      tabIndex: -1,
      disabled: props.isDisabled || props.isReadOnly,
      'aria-label': 'Show suggestions',
      'aria-controls': props.isOpen ? props.listBoxId : undefined,
      'aria-expanded': props.isOpen,
      'aria-haspopup': 'listbox',
      onClick: () => props.onOpenChange(!props.isOpen),
    } satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    listBoxProps: {
      id: props.listBoxId,
      role: 'listbox' as const,
      'aria-labelledby': props.labelId,
    } satisfies JSX.HTMLAttributes<HTMLDivElement>,
  };
}
