import type { RefObject } from 'preact';
import type {
  JSX,
  TargetedEvent,
  TargetedFocusEvent,
  TargetedKeyboardEvent,
  TargetedPointerEvent,
} from '../preactTypes';
import { useCallback } from 'preact/hooks';
import { useId } from '../utils/useId';

export interface AutocompleteNode {
  id: string;
  textValue?: string;
  [key: string]: unknown;
}

/** Consumer-owned state contract for autocomplete behavior. */
export interface AutocompleteState {
  inputValue: string;
  focusedNodeId: string | null;
  setInputValue(value: string): void;
  setFocusedNodeId(id: string | null): void;
}

export interface AriaAutocompleteProps {
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>;
  collectionRef: RefObject<HTMLElement>;
  filter?: (textValue: string, inputValue: string, node: AutocompleteNode) => boolean;
  disableAutoFocusFirst?: boolean;
  disableVirtualFocus?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export interface AutocompleteCollectionProps extends JSX.HTMLAttributes<HTMLElement> {
  shouldUseVirtualFocus: boolean;
  disallowTypeAhead: boolean;
}

export interface AutocompleteAria {
  inputProps: JSX.InputHTMLAttributes<HTMLInputElement>;
  collectionProps: AutocompleteCollectionProps;
  collectionRef: RefObject<HTMLElement>;
  filter?: (nodeTextValue: string, node: AutocompleteNode) => boolean;
}

const itemSelector = [
  '[role="option"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="treeitem"]',
  '[role="row"]',
].join(',');

function isEnabled(element: HTMLElement) {
  return element.getAttribute('aria-disabled') !== 'true' && !element.hasAttribute('disabled');
}

function collectionItems(collection: HTMLElement | null, collectionId: string) {
  if (!collection) return [];
  return [...collection.querySelectorAll<HTMLElement>(itemSelector)]
    .filter(isEnabled)
    .map((element, index) => {
      element.id ||= `${collectionId}-item-${index}`;
      return element;
    });
}

function itemFromTarget(target: EventTarget | null, collection: HTMLElement | null) {
  if (!(target instanceof Element) || !collection) return null;
  const item = target.closest<HTMLElement>(itemSelector);
  return item && collection.contains(item) && isEnabled(item) ? item : null;
}

/**
 * Connects a text input to any Preact collection without owning or prescribing state.
 */
export function useAutocomplete(
  props: AriaAutocompleteProps,
  state: AutocompleteState,
): AutocompleteAria {
  const collectionId = useId(props.id);
  const shouldUseVirtualFocus = !props.disableVirtualFocus;

  const setFocusedItem = useCallback(
    (item: HTMLElement | undefined) => {
      if (!item) {
        state.setFocusedNodeId(null);
        return;
      }
      state.setFocusedNodeId(item.id);
      item.scrollIntoView?.({ block: 'nearest' });
      if (!shouldUseVirtualFocus) item.focus();
    },
    [shouldUseVirtualFocus, state],
  );

  const clearVirtualFocus = useCallback(() => {
    state.setFocusedNodeId(null);
  }, [state]);

  const onInput = useCallback(
    (event: TargetedEvent<HTMLInputElement, Event>) => {
      const value = event.currentTarget.value;
      state.setInputValue(value);
      const inputType = (event as TargetedEvent<HTMLInputElement, InputEvent>).inputType;
      if (inputType === 'insertText' && !props.disableAutoFocusFirst) {
        queueMicrotask(() =>
          setFocusedItem(collectionItems(props.collectionRef.current, collectionId)[0]),
        );
      } else if (
        inputType.includes('insert') ||
        inputType.includes('delete') ||
        inputType.includes('history')
      ) {
        clearVirtualFocus();
      }
    },
    [
      clearVirtualFocus,
      collectionId,
      props.collectionRef,
      props.disableAutoFocusFirst,
      setFocusedItem,
      state,
    ],
  );

  const onKeyDown = useCallback(
    (event: TargetedKeyboardEvent<HTMLInputElement>) => {
      if (event.isComposing) return;
      const items = collectionItems(props.collectionRef.current, collectionId);
      const current = items.findIndex((item) => item.id === state.focusedNodeId);
      let next: HTMLElement | undefined;

      if (event.key === 'ArrowDown') next = items[current + 1] ?? items[0];
      else if (event.key === 'ArrowUp') next = items[current - 1] ?? items.at(-1);
      else if (event.key === 'Home' || event.key === 'PageUp') next = items[0];
      else if (event.key === 'End' || event.key === 'PageDown') next = items.at(-1);
      else if (event.key === 'Enter' && current >= 0) {
        event.preventDefault();
        items[current]!.click();
        return;
      } else if (
        event.key === 'Escape' ||
        ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && current >= 0)
      ) {
        clearVirtualFocus();
        return;
      } else return;

      if (next) {
        event.preventDefault();
        setFocusedItem(next);
      }
    },
    [clearVirtualFocus, collectionId, props.collectionRef, setFocusedItem, state.focusedNodeId],
  );

  const filter = props.filter;
  return {
    inputProps: {
      role: 'combobox',
      value: state.inputValue,
      enterKeyHint: 'go',
      autoComplete: 'off',
      autoCorrect: 'off',
      spellcheck: false,
      'aria-autocomplete': 'list',
      'aria-controls': collectionId,
      'aria-expanded': true,
      'aria-activedescendant': shouldUseVirtualFocus
        ? (state.focusedNodeId ?? undefined)
        : undefined,
      onInput,
      onKeyDown,
      onBlur() {
        if (shouldUseVirtualFocus) clearVirtualFocus();
      },
    },
    collectionProps: {
      id: collectionId,
      'aria-label': props['aria-label'] ?? (props['aria-labelledby'] ? undefined : 'Suggestions'),
      'aria-labelledby': props['aria-labelledby'],
      shouldUseVirtualFocus,
      disallowTypeAhead: shouldUseVirtualFocus,
      onPointerDown(event: TargetedPointerEvent<HTMLElement>) {
        if (shouldUseVirtualFocus && event.pointerType !== 'touch') event.preventDefault();
      },
      onPointerMove(event: TargetedPointerEvent<HTMLElement>) {
        const item = itemFromTarget(event.target, props.collectionRef.current);
        if (item) setFocusedItem(item);
      },
      onFocusCapture(event: TargetedFocusEvent<HTMLElement>) {
        const item = itemFromTarget(event.target, props.collectionRef.current);
        if (item) setFocusedItem(item);
      },
    },
    collectionRef: props.collectionRef,
    filter: filter
      ? (nodeTextValue, node) => filter(nodeTextValue, state.inputValue, node)
      : undefined,
  };
}
