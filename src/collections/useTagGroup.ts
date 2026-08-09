import type { JSX, RefObject, TargetedFocusEvent, TargetedKeyboardEvent } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { useField, type AriaFieldProps } from '../forms/useField';
import { useButton } from '../hooks/useButton';
import { useLocale } from '../i18n/I18nProvider';
import { useGridListItem, type AriaGridListItemProps } from './useGridList';
import type { SelectionMode } from './useListBox';

export interface AriaTagGroupProps extends Omit<AriaFieldProps, 'isRequired'> {
  focusedKey?: string;
  tagCount: number;
  selectionMode?: SelectionMode;
  selectedKeys?: Set<string>;
  isDisabled?: boolean;
  escapeKeyBehavior?: 'clearSelection' | 'none';
  onFocusedKeyChange?: (key: string) => void;
  onSelectionAction?: (key: string) => void;
  onAction?: (key: string) => void;
  onClearSelection?: () => void;
  onRemove?: (keys: Set<string>) => void;
}

function enabledTags(group: HTMLElement): HTMLElement[] {
  return Array.from(group.querySelectorAll<HTMLElement>('[role="row"][data-tag-key]')).filter(
    (tag) => tag.getAttribute('aria-disabled') !== 'true',
  );
}

export function useTagGroup(props: AriaTagGroupProps, ref: RefObject<HTMLElement>) {
  const { direction } = useLocale();
  const [isFocusWithin, setFocusWithin] = useState(false);
  const search = useRef('');
  const lastTypeTime = useRef(0);
  const { fieldProps, labelProps, descriptionProps, errorMessageProps } = useField(props);

  function focusTag(tag: HTMLElement | undefined) {
    if (tag?.id) props.onFocusedKeyChange?.(tag.id);
  }

  function onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
    if (props.isDisabled || event.target !== event.currentTarget || !ref.current) return;
    const tags = enabledTags(ref.current);
    const current = tags.findIndex((tag) => tag.id === props.focusedKey);
    const previous = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    const next = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    if (event.key === previous || event.key === next) {
      event.preventDefault();
      const delta = event.key === next ? 1 : -1;
      focusTag(tags[(current + delta + tags.length) % tags.length]);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focusTag(event.key === 'Home' ? tags[0] : tags.at(-1));
    } else if (event.key === ' ' && props.focusedKey) {
      event.preventDefault();
      props.onSelectionAction?.(props.focusedKey);
    } else if (event.key === 'Enter' && props.focusedKey) {
      event.preventDefault();
      props.onAction?.(props.focusedKey);
    } else if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      props.focusedKey &&
      props.onRemove
    ) {
      event.preventDefault();
      props.onRemove(
        props.selectedKeys?.has(props.focusedKey)
          ? new Set(props.selectedKeys)
          : new Set([props.focusedKey]),
      );
    } else if (event.key === 'Escape' && props.escapeKeyBehavior !== 'none') {
      props.onClearSelection?.();
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
      const ordered = [...tags.slice(start), ...tags.slice(0, start)];
      const match = ordered.find((tag) =>
        (tag.dataset.textValue ?? tag.textContent ?? '')
          .trim()
          .toLocaleLowerCase()
          .startsWith(query),
      );
      if (match) {
        event.preventDefault();
        focusTag(match);
      }
    }
  }

  return {
    gridProps: {
      ...fieldProps,
      role: props.tagCount ? 'grid' : 'group',
      tabIndex: props.isDisabled ? undefined : 0,
      'aria-activedescendant': props.tagCount ? props.focusedKey : undefined,
      'aria-disabled': props.isDisabled || undefined,
      'aria-multiselectable': props.selectionMode === 'multiple' || undefined,
      'aria-atomic': 'false',
      'aria-relevant': 'additions',
      'aria-live': isFocusWithin ? 'polite' : 'off',
      onKeyDown,
      onFocus(event) {
        if (event.target === event.currentTarget && !props.focusedKey)
          focusTag(enabledTags(event.currentTarget)[0]);
      },
      onFocusIn() {
        setFocusWithin(true);
      },
      onFocusOut(event: TargetedFocusEvent<HTMLElement>) {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setFocusWithin(false);
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    labelProps: { id: labelProps.id },
    descriptionProps,
    errorMessageProps,
  };
}

export interface AriaTagProps extends AriaGridListItemProps {
  label: string;
  allowsRemoving?: boolean;
  onRemove?: () => void;
}

export interface TagAria {
  rowProps: JSX.HTMLAttributes<HTMLDivElement>;
  gridCellProps: JSX.HTMLAttributes<HTMLDivElement>;
  descriptionProps: JSX.HTMLAttributes<HTMLDivElement>;
  removeButtonProps: JSX.ButtonHTMLAttributes<HTMLButtonElement>;
  isSelected: boolean;
  isDisabled: boolean;
  isFocused: boolean;
  allowsRemoving: boolean;
}

export function useTag(props: AriaTagProps): TagAria {
  const item = useGridListItem(props);
  const remove = useButton({
    isDisabled: props.isDisabled || !props.allowsRemoving,
    onPress: props.onRemove,
  });
  return {
    ...item,
    removeButtonProps: {
      ...remove.buttonProps,
      'aria-label': `Remove ${props.label}`,
    } satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    allowsRemoving: props.allowsRemoving ?? false,
  };
}
