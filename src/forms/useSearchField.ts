import type { JSX, RefObject, TargetedKeyboardEvent } from '../preactTypes';
import { useTextField, type AriaTextFieldProps } from './useTextField';

export interface AriaSearchFieldProps extends Omit<AriaTextFieldProps, 'type'> {
  onClear?: () => void;
}

export function useSearchField(
  props: AriaSearchFieldProps = {},
  ref?: RefObject<HTMLInputElement>,
) {
  const result = useTextField({ ...props, type: 'search' });

  function clear() {
    if (props.isDisabled || props.isReadOnly) return;
    if (props.value === undefined && ref?.current) ref.current.value = '';
    props.onChange?.('');
    props.onClear?.();
    ref?.current?.focus();
  }

  return {
    ...result,
    inputProps: {
      ...result.inputProps,
      onKeyDown(event: TargetedKeyboardEvent<HTMLInputElement>) {
        if (event.key !== 'Escape' || !event.currentTarget.value) return;
        event.preventDefault();
        clear();
      },
    } satisfies JSX.InputHTMLAttributes<HTMLInputElement>,
    clearButtonProps: {
      type: 'button',
      disabled: props.isDisabled || props.isReadOnly,
      'aria-label': 'Clear search',
      'aria-controls': result.inputProps.id,
      onClick: clear,
    } satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  };
}
