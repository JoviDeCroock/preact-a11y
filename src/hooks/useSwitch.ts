import type { RefObject } from 'preact';
import type { JSX } from '../preactTypes';
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
