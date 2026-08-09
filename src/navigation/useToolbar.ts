import type { JSX, RefObject, TargetedKeyboardEvent } from 'preact';

export interface AriaToolbarProps {
  orientation?: 'horizontal' | 'vertical';
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const toolbarItemSelector =
  'button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]';

export function useToolbar(props: AriaToolbarProps, ref: RefObject<HTMLElement>) {
  const orientation = props.orientation ?? 'horizontal';
  return {
    toolbarProps: {
      role: 'toolbar',
      'aria-orientation': orientation,
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'],
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        if (!ref.current) return;
        const items = Array.from(ref.current.querySelectorAll<HTMLElement>(toolbarItemSelector));
        const current = items.indexOf(document.activeElement as HTMLElement);
        const previousKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
        const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
        let next: HTMLElement | undefined;

        if (event.key === previousKey) next = items.at(current <= 0 ? -1 : current - 1);
        else if (event.key === nextKey) next = items[(current + 1) % items.length];
        else if (event.key === 'Home') next = items[0];
        else if (event.key === 'End') next = items.at(-1);
        if (!next) return;
        event.preventDefault();
        next.focus();
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
