import type { JSX, RefObject, TargetedKeyboardEvent } from '../preactTypes';
import { useToggleButton, type AriaToggleButtonProps } from '../hooks/useToggleButton';

export interface AriaToggleButtonGroupProps {
  orientation?: 'horizontal' | 'vertical';
  isDisabled?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function useToggleButtonGroup(
  props: AriaToggleButtonGroupProps,
  ref: RefObject<HTMLElement>,
) {
  const orientation = props.orientation ?? 'horizontal';
  return {
    groupProps: {
      role: 'group' as const,
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'],
      'aria-disabled': props.isDisabled || undefined,
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        if (!ref.current || props.isDisabled) return;
        const items = Array.from(
          ref.current.querySelectorAll<HTMLButtonElement>(
            'button[data-toggle-key]:not([disabled])',
          ),
        );
        const current = items.indexOf(document.activeElement as HTMLButtonElement);
        const previous = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
        const next = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
        let target: HTMLButtonElement | undefined;
        if (event.key === previous) target = items.at(current <= 0 ? -1 : current - 1);
        else if (event.key === next) target = items[(current + 1) % items.length];
        else if (event.key === 'Home') target = items[0];
        else if (event.key === 'End') target = items.at(-1);
        if (!target) return;
        event.preventDefault();
        target.focus();
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}

export interface AriaToggleButtonGroupItemProps extends AriaToggleButtonProps {
  id: string;
}

export function useToggleButtonGroupItem(
  props: AriaToggleButtonGroupItemProps,
  ref?: RefObject<Element>,
) {
  return useToggleButton(props, ref);
}
