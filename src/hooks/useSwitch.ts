import type { JSX, RefObject } from 'preact';
import { useCheckbox, type AriaCheckboxProps } from './useCheckbox';

export type AriaSwitchProps = AriaCheckboxProps;

export function useSwitch(props: AriaSwitchProps = {}, ref?: RefObject<HTMLInputElement>) {
  const result = useCheckbox(props, ref);
  return {
    ...result,
    inputProps: {
      ...result.inputProps,
      role: 'switch',
    } satisfies JSX.InputHTMLAttributes<HTMLInputElement>,
  };
}
