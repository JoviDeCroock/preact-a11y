import type { RefObject } from 'preact';
import type { JSX, TargetedKeyboardEvent } from '../preactTypes';
import { useEffect, useRef } from 'preact/hooks';

export type SelectionMode = 'none' | 'single' | 'multiple';

export interface AriaListBoxProps {
  focusedKey?: string;
  autoFocus?: 'first' | 'last';
  selectionMode?: SelectionMode;
  orientation?: 'horizontal' | 'vertical';
  isDisabled?: boolean;
  shouldUseVirtualFocus?: boolean;
  disallowTypeAhead?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onFocusedKeyChange?: (key: string) => void;
  onSelectionAction?: (key: string) => void;
}

function enabledOptions(element: HTMLElement): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>('[role="option"]')).filter(
    (option) => option.getAttribute('aria-disabled') !== 'true',
  );
}

export function useListBox(props: AriaListBoxProps, ref: RefObject<HTMLElement>) {
  const search = useRef('');
  const lastTypeTime = useRef(0);
  const orientation = props.orientation ?? 'vertical';
  const selectionMode = props.selectionMode ?? 'single';

  useEffect(() => {
    if (props.autoFocus) ref.current?.focus();
  }, [props.autoFocus, ref]);

  function focusOption(option: HTMLElement | undefined) {
    const key = option?.dataset.key;
    if (!key) return;
    props.onFocusedKeyChange?.(key);
    option.scrollIntoView?.({ block: 'nearest' });
  }

  function onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
    if (props.isDisabled || !ref.current) return;
    const options = enabledOptions(ref.current);
    const current = options.findIndex((option) => option.dataset.key === props.focusedKey);
    const previousKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';

    if (event.key === previousKey) {
      event.preventDefault();
      focusOption(options[Math.max(0, current - 1)] ?? options[0]);
    } else if (event.key === nextKey) {
      event.preventDefault();
      focusOption(options[Math.min(options.length - 1, current + 1)] ?? options[0]);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(options[0]);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(options.at(-1));
    } else if ((event.key === 'Enter' || event.key === ' ') && props.focusedKey) {
      event.preventDefault();
      props.onSelectionAction?.(props.focusedKey);
    } else if (
      !props.disallowTypeAhead &&
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
      const ordered = [...options.slice(start), ...options.slice(0, start)];
      const match = ordered.find((option) =>
        option.textContent?.trim().toLocaleLowerCase().startsWith(query),
      );
      if (match) {
        event.preventDefault();
        focusOption(match);
      }
    }
  }

  return {
    listBoxProps: {
      role: 'listbox',
      tabIndex: props.isDisabled ? undefined : props.shouldUseVirtualFocus ? -1 : 0,
      'aria-activedescendant': props.focusedKey,
      'aria-disabled': props.isDisabled || undefined,
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'],
      'aria-multiselectable': selectionMode === 'multiple' || undefined,
      'aria-orientation': orientation,
      onKeyDown,
      onFocus() {
        if (!props.focusedKey) {
          const options = enabledOptions(ref.current!);
          focusOption(props.autoFocus === 'last' ? options.at(-1) : options[0]);
        }
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}

export interface AriaOptionProps {
  id: string;
  key: string;
  isSelected?: boolean;
  isFocused?: boolean;
  isDisabled?: boolean;
  onAction?: (key: string) => void;
  onFocus?: (key: string) => void;
}

export function useOption(props: AriaOptionProps) {
  return {
    optionProps: {
      id: props.id,
      role: 'option',
      'aria-disabled': props.isDisabled || undefined,
      'aria-selected': props.isSelected,
      onClick() {
        if (!props.isDisabled) props.onAction?.(props.key);
      },
      onPointerMove() {
        if (!props.isDisabled) props.onFocus?.(props.key);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
