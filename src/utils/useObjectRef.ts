import type { Ref, RefObject } from 'preact';
import { useMemo } from 'preact/hooks';

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

export function useObjectRef<T>(ref?: Ref<T>): RefObject<T> {
  return useMemo(() => {
    let current: T | null = null;
    return {
      get current() {
        return current;
      },
      set current(value: T | null) {
        current = value;
        setRef(ref, value);
      },
    };
  }, [ref]);
}
