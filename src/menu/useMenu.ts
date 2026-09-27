import type { JSX, RefObject, TargetedKeyboardEvent } from '../preactTypes';
import { useEffect, useRef } from 'preact/hooks';

export interface AriaMenuProps {
  focusedKey?: string;
  autoFocus?: 'first' | 'last';
  isDisabled?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onFocusedKeyChange?: (key: string) => void;
  onAction?: (key: string) => void;
  onClose?: () => void;
}

function enabledItems(element: HTMLElement): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>('[role^="menuitem"]')).filter(
    (item) => item.getAttribute('aria-disabled') !== 'true',
  );
}

export function useMenu(props: AriaMenuProps, ref: RefObject<HTMLElement>) {
  const search = useRef('');
  const lastTypeTime = useRef(0);

  function focusItem(item: HTMLElement | undefined) {
    const key = item?.dataset.key;
    if (!key) return;
    props.onFocusedKeyChange?.(key);
    item.scrollIntoView?.({ block: 'nearest' });
  }

  useEffect(() => {
    if (!ref.current || !props.autoFocus) return;
    ref.current.focus();
  }, [props.autoFocus, ref]);

  function onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
    if (props.isDisabled || !ref.current) return;
    const items = enabledItems(ref.current);
    const current = items.findIndex((item) => item.dataset.key === props.focusedKey);

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(items.at(current <= 0 ? -1 : current - 1));
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(items[(current + 1) % items.length]);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(items[0]);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(items.at(-1));
    } else if ((event.key === 'Enter' || event.key === ' ') && props.focusedKey) {
      event.preventDefault();
      props.onAction?.(props.focusedKey);
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') event.preventDefault();
      props.onClose?.();
    } else if (
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.isComposing
    ) {
      const now = performance.now();
      search.current = now - lastTypeTime.current > 500 ? event.key : search.current + event.key;
      lastTypeTime.current = now;
      const query = search.current.toLocaleLowerCase();
      const start = Math.max(0, current + 1);
      const ordered = [...items.slice(start), ...items.slice(0, start)];
      const match = ordered.find((item) =>
        item.textContent?.trim().toLocaleLowerCase().startsWith(query),
      );
      if (match) {
        event.preventDefault();
        focusItem(match);
      }
    }
  }

  return {
    menuProps: {
      role: 'menu' as const,
      tabIndex: props.isDisabled ? undefined : 0,
      'aria-activedescendant': props.focusedKey,
      'aria-disabled': props.isDisabled || undefined,
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'],
      onKeyDown,
      onFocus() {
        if (props.focusedKey || !ref.current) return;
        const items = enabledItems(ref.current);
        focusItem(props.autoFocus === 'last' ? items.at(-1) : items[0]);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}

export interface AriaMenuItemProps {
  id: string;
  key: string;
  type?: 'item' | 'checkbox' | 'radio';
  isSelected?: boolean;
  isDisabled?: boolean;
  onAction?: (key: string) => void;
  onFocus?: (key: string) => void;
}

export function useMenuItem(props: AriaMenuItemProps) {
  const selectable = props.type === 'checkbox' || props.type === 'radio';
  return {
    menuItemProps: {
      id: props.id,
      role:
        props.type === 'checkbox'
          ? ('menuitemcheckbox' as const)
          : props.type === 'radio'
            ? ('menuitemradio' as const)
            : ('menuitem' as const),
      'aria-checked': selectable ? (props.isSelected ?? false) : undefined,
      'aria-disabled': props.isDisabled || undefined,
      onClick() {
        if (!props.isDisabled) props.onAction?.(props.key);
      },
      onPointerMove() {
        if (!props.isDisabled) props.onFocus?.(props.key);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
