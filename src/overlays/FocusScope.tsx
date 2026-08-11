import { createContext } from 'preact';
import type { ComponentChildren, RefObject } from 'preact';
import type { JSX } from '../preactTypes';
import { useContext, useEffect, useMemo, useRef } from 'preact/hooks';

const focusScopes: HTMLElement[] = [];
const focusableSelector = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]',
].join(',');

function isAvailable(element: HTMLElement) {
  if (
    element.hidden ||
    element.getAttribute('aria-hidden') === 'true' ||
    element.closest('[hidden], [inert], [aria-hidden="true"]')
  ) {
    return false;
  }
  const view = element.ownerDocument.defaultView;
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    const style = view?.getComputedStyle(current);
    if (style?.display === 'none' || style?.visibility === 'hidden') return false;
  }
  return true;
}

function focusableElements(scope: HTMLElement, options: FocusManagerOptions = {}): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) =>
      isAvailable(element) &&
      (!options.tabbable || element.tabIndex >= 0) &&
      (options.accept?.(element) ?? true),
  );
}

export interface FocusManagerOptions {
  from?: Element;
  tabbable?: boolean;
  wrap?: boolean;
  accept?: (node: Element) => boolean;
}

export interface FocusManager {
  focusNext(options?: FocusManagerOptions): HTMLElement | null;
  focusPrevious(options?: FocusManagerOptions): HTMLElement | null;
  focusFirst(options?: FocusManagerOptions): HTMLElement | null;
  focusLast(options?: FocusManagerOptions): HTMLElement | null;
}

const FocusManagerContext = createContext<FocusManager | undefined>(undefined);

function focusElement(element: HTMLElement | undefined) {
  element?.focus();
  return element ?? null;
}

function relativeElement(
  elements: HTMLElement[],
  from: Element | undefined,
  direction: 'next' | 'previous',
) {
  if (!from) return direction === 'next' ? elements[0] : elements.at(-1);
  const currentIndex = elements.findIndex((element) => element === from || element.contains(from));
  if (currentIndex >= 0) {
    return direction === 'next' ? elements[currentIndex + 1] : elements[currentIndex - 1];
  }
  const relation =
    direction === 'next' ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING;
  const candidates = elements.filter((element) => from.compareDocumentPosition(element) & relation);
  return direction === 'next' ? candidates[0] : candidates.at(-1);
}

function createFocusManager(scopeRef: RefObject<HTMLElement>): FocusManager {
  const elementsFor = (options?: FocusManagerOptions) => {
    const scope = scopeRef.current;
    return scope ? focusableElements(scope, options) : [];
  };

  return {
    focusFirst(options) {
      return focusElement(elementsFor(options)[0]);
    },
    focusLast(options) {
      return focusElement(elementsFor(options).at(-1));
    },
    focusNext(options = {}) {
      const elements = elementsFor(options);
      if (!elements.length) return null;
      const from =
        options.from ?? (typeof document === 'undefined' ? undefined : document.activeElement);
      const next = relativeElement(elements, from ?? undefined, 'next');
      return focusElement(next ?? (options.wrap ? elements[0] : undefined));
    },
    focusPrevious(options = {}) {
      const elements = elementsFor(options);
      if (!elements.length) return null;
      const from =
        options.from ?? (typeof document === 'undefined' ? undefined : document.activeElement);
      const previous = relativeElement(elements, from ?? undefined, 'previous');
      return focusElement(previous ?? (options.wrap ? elements.at(-1) : undefined));
    },
  };
}

/** Returns the focus manager belonging to the nearest parent FocusScope. */
export function useFocusManager(): FocusManager | undefined {
  return useContext(FocusManagerContext);
}

export interface FocusScopeProps {
  children: ComponentChildren;
  contain?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
  className?: string;
  style?: JSX.CSSProperties;
}

export function FocusScope({
  children,
  contain = false,
  restoreFocus = false,
  autoFocus = false,
  className,
  style,
}: FocusScopeProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const focusManager = useMemo(() => createFocusManager(scopeRef), []);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    focusScopes.push(scope);

    const rememberFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && scope.contains(event.target)) {
        lastFocused.current = event.target;
      }
    };

    const containFocus = (event: FocusEvent) => {
      if (!contain || focusScopes.at(-1) !== scope || scope.contains(event.target as Node)) return;
      const target = lastFocused.current ?? focusableElements(scope, { tabbable: true })[0];
      target?.focus();
    };

    const wrapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !contain || focusScopes.at(-1) !== scope) return;
      const elements = focusableElements(scope, { tabbable: true });
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0]!;
      const last = elements.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    scope.addEventListener('focusin', rememberFocus);
    document.addEventListener('focusin', containFocus, true);
    document.addEventListener('keydown', wrapTab, true);

    if (autoFocus) {
      queueMicrotask(() => {
        if (!focusScopes.includes(scope)) return;
        const elements = focusableElements(scope, { tabbable: true });
        (
          elements.find((element) => !element.hasAttribute('data-dismiss-button')) ?? elements[0]
        )?.focus();
      });
    }

    return () => {
      scope.removeEventListener('focusin', rememberFocus);
      document.removeEventListener('focusin', containFocus, true);
      document.removeEventListener('keydown', wrapTab, true);
      const index = focusScopes.lastIndexOf(scope);
      if (index >= 0) focusScopes.splice(index, 1);
      if (restoreFocus && previouslyFocused?.isConnected)
        queueMicrotask(() => previouslyFocused.focus());
    };
  }, [autoFocus, contain, restoreFocus]);

  return (
    <FocusManagerContext.Provider value={focusManager}>
      <div className={className} data-focus-scope="" ref={scopeRef} style={style}>
        {children}
      </div>
    </FocusManagerContext.Provider>
  );
}
