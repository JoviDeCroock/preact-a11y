/*
 * Copyright 2020 Adobe. All rights reserved.
 * Licensed under the Apache License, Version 2.0. See LICENSE.
 * Modified by JoviDeCroock for Preact A11y in 2026.
 */

import type { JSX } from '../preactTypes';
import { useEffect, useRef } from 'preact/hooks';
import { useFocus } from '../interactions/useFocus';
import { readFromDataTransfer, writeToDataTransfer } from './dataTransfer';
import type { DragItem, DropItem } from './types';

export interface ClipboardProps {
  getItems?: (details: { action: 'cut' | 'copy' }) => DragItem[];
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: (items: DropItem[]) => void;
  isDisabled?: boolean;
}

export interface ClipboardResult {
  clipboardProps: Pick<JSX.HTMLAttributes<HTMLElement>, 'onBlur' | 'onFocus'>;
}

/** Handles focused copy, cut, and paste interactions using native DataTransfer formats. */
export function useClipboard(options: ClipboardProps): ClipboardResult {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const focused = useRef(false);
  const { focusProps } = useFocus({
    onFocusChange: (isFocused) => {
      focused.current = isFocused;
    },
  });

  useEffect(() => {
    if (options.isDisabled || typeof document === 'undefined') return;

    const handleBeforeCopy = (event: Event) => {
      if (focused.current && optionsRef.current.getItems) event.preventDefault();
    };
    const handleBeforeCut = (event: Event) => {
      const current = optionsRef.current;
      if (focused.current && current.getItems && current.onCut) event.preventDefault();
    };
    const handleBeforePaste = (event: Event) => {
      if (focused.current && optionsRef.current.onPaste) event.preventDefault();
    };
    const handleCopy = (event: ClipboardEvent) => {
      const current = optionsRef.current;
      if (!focused.current || !current.getItems || !event.clipboardData) return;
      event.preventDefault();
      writeToDataTransfer(event.clipboardData, current.getItems({ action: 'copy' }));
      current.onCopy?.();
    };
    const handleCut = (event: ClipboardEvent) => {
      const current = optionsRef.current;
      if (!focused.current || !current.getItems || !current.onCut || !event.clipboardData) return;
      event.preventDefault();
      writeToDataTransfer(event.clipboardData, current.getItems({ action: 'cut' }));
      current.onCut();
    };
    const handlePaste = (event: ClipboardEvent) => {
      const current = optionsRef.current;
      if (!focused.current || !current.onPaste || !event.clipboardData) return;
      event.preventDefault();
      current.onPaste(readFromDataTransfer(event.clipboardData));
    };

    document.addEventListener('beforecopy', handleBeforeCopy);
    document.addEventListener('beforecut', handleBeforeCut);
    document.addEventListener('beforepaste', handleBeforePaste);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('beforecopy', handleBeforeCopy);
      document.removeEventListener('beforecut', handleBeforeCut);
      document.removeEventListener('beforepaste', handleBeforePaste);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
    };
  }, [options.isDisabled]);

  return { clipboardProps: focusProps };
}
