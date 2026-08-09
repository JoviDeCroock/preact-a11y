import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

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
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableElements(scope: HTMLElement): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true',
  );
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
      const target = lastFocused.current ?? focusableElements(scope)[0];
      target?.focus();
    };

    const wrapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !contain || focusScopes.at(-1) !== scope) return;
      const elements = focusableElements(scope);
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
        const elements = focusableElements(scope);
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
    <div className={className} data-focus-scope="" ref={scopeRef} style={style}>
      {children}
    </div>
  );
}
