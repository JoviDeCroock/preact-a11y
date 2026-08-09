import { useEffect, useState } from 'preact/hooks';
import type { JSX, TargetedFocusEvent } from 'preact';
import { useFocusWithin } from './useFocusWithin';

type Modality = 'keyboard' | 'pointer';
let modality: Modality = 'pointer';
let listening = false;
const subscribers = new Set<(value: Modality) => void>();

function setModality(value: Modality) {
  modality = value;
  for (const subscriber of subscribers) subscriber(value);
}

function ensureGlobalListeners() {
  if (listening || typeof document === 'undefined') return;
  listening = true;
  document.addEventListener(
    'keydown',
    (event) => {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) setModality('keyboard');
    },
    true,
  );
  document.addEventListener('pointerdown', () => setModality('pointer'), true);
}

export interface FocusProps {
  isDisabled?: boolean;
  onFocus?: (event: TargetedFocusEvent<HTMLElement>) => void;
  onBlur?: (event: TargetedFocusEvent<HTMLElement>) => void;
  onFocusChange?: (isFocused: boolean) => void;
}

export function useFocus(props: FocusProps = {}) {
  const [isFocused, setFocused] = useState(false);
  const focusProps: Pick<JSX.HTMLAttributes<HTMLElement>, 'onBlur' | 'onFocus'> = {
    onFocus(event: TargetedFocusEvent<HTMLElement>) {
      if (props.isDisabled) return;
      setFocused(true);
      props.onFocusChange?.(true);
      props.onFocus?.(event);
    },
    onBlur(event: TargetedFocusEvent<HTMLElement>) {
      setFocused(false);
      props.onFocusChange?.(false);
      props.onBlur?.(event);
    },
  };
  return { focusProps, isFocused };
}

export function useFocusVisible() {
  const [isFocusVisible, setFocusVisible] = useState(modality === 'keyboard');
  useEffect(() => {
    ensureGlobalListeners();
    subscribers.add(setFocusVisibleFromModality);
    return () => subscribers.delete(setFocusVisibleFromModality);

    function setFocusVisibleFromModality(value: Modality) {
      setFocusVisible(value === 'keyboard');
    }
  }, []);
  return { isFocusVisible };
}

export interface FocusRingOptions extends FocusProps {
  within?: boolean;
  isTextInput?: boolean;
  autoFocus?: boolean;
}

export interface FocusRingAria {
  focusProps: Pick<
    JSX.HTMLAttributes<HTMLElement>,
    'onBlur' | 'onFocus' | 'onFocusIn' | 'onFocusOut'
  >;
  isFocused: boolean;
  isFocusVisible: boolean;
}

export function useFocusRing(props: FocusRingOptions = {}): FocusRingAria {
  const { focusProps, isFocused } = useFocus(props);
  const { focusWithinProps, isFocusWithin } = useFocusWithin({ isDisabled: props.isDisabled });
  const { isFocusVisible: hadKeyboardFocus } = useFocusVisible();
  const [isAutoFocusVisible, setAutoFocusVisible] = useState(props.autoFocus === true);
  useEffect(() => {
    if (!props.autoFocus) return;
    ensureGlobalListeners();
    const clearAutoFocus = (value: Modality) => {
      if (value === 'pointer') setAutoFocusVisible(false);
    };
    subscribers.add(clearAutoFocus);
    return () => subscribers.delete(clearAutoFocus);
  }, [props.autoFocus]);
  const focused = props.within ? isFocusWithin : isFocused;
  return {
    focusProps: props.within ? focusWithinProps : focusProps,
    isFocused: focused,
    isFocusVisible: focused && (hadKeyboardFocus || isAutoFocusVisible),
  };
}
