import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useContext, useMemo } from 'preact/hooks';

export type TextDirection = 'ltr' | 'rtl';

export interface LocaleContextValue {
  locale: string;
  direction: TextDirection;
}

function defaultLocale(): string {
  if (typeof navigator !== 'undefined') return navigator.language || 'en-US';
  return 'en-US';
}

export function getTextDirection(locale: string): TextDirection {
  try {
    const maximized = new Intl.Locale(locale).maximize();
    const direction = (maximized as unknown as { textInfo?: { direction?: string } }).textInfo
      ?.direction;
    if (direction === 'rtl') return 'rtl';
    return /^(Arab|Hebr|Thaa|Nkoo|Adlm|Rohg|Syrc)$/i.test(maximized.script ?? '') ? 'rtl' : 'ltr';
  } catch {
    return /^(ar|dv|fa|he|ku|ps|sd|ug|ur)(-|$)/i.test(locale) ? 'rtl' : 'ltr';
  }
}

export function isRTL(locale: string): boolean {
  return getTextDirection(locale) === 'rtl';
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export interface I18nProviderProps {
  children: ComponentChildren;
  locale?: string;
}

export function I18nProvider({ children, locale = defaultLocale() }: I18nProviderProps) {
  const value = useMemo(() => ({ locale, direction: getTextDirection(locale) }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  const locale = context?.locale ?? defaultLocale();
  return context ?? { locale, direction: getTextDirection(locale) };
}
