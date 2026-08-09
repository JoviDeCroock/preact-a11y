import { useEffect } from 'preact/hooks';

let lockCount = 0;
let previousOverflow = '';

export interface PreventScrollOptions {
  isDisabled?: boolean;
}

export function usePreventScroll(options: PreventScrollOptions = {}) {
  useEffect(() => {
    if (options.isDisabled || typeof document === 'undefined') return;

    if (lockCount === 0) {
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount === 0) document.documentElement.style.overflow = previousOverflow;
    };
  }, [options.isDisabled]);
}
