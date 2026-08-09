import { useMemo } from 'preact/hooks';
import { useLocale } from './I18nProvider';

function optionsKey(options: object | undefined): string {
  return JSON.stringify(options ?? {});
}

export function useCollator(options?: Intl.CollatorOptions): Intl.Collator {
  const { locale } = useLocale();
  const key = optionsKey(options);
  return useMemo(() => new Intl.Collator(locale, options), [locale, key]);
}

export function useDateFormatter(options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const { locale } = useLocale();
  const key = optionsKey(options);
  return useMemo(() => new Intl.DateTimeFormat(locale, options), [locale, key]);
}

export function useNumberFormatter(options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const { locale } = useLocale();
  const key = optionsKey(options);
  return useMemo(() => new Intl.NumberFormat(locale, options), [locale, key]);
}

export function useListFormatter(options?: Intl.ListFormatOptions): Intl.ListFormat {
  const { locale } = useLocale();
  const key = optionsKey(options);
  return useMemo(() => new Intl.ListFormat(locale, options), [locale, key]);
}

export interface Filter {
  startsWith(string: string, substring: string): boolean;
  endsWith(string: string, substring: string): boolean;
  contains(string: string, substring: string): boolean;
}

export function useFilter(options: Intl.CollatorOptions = { sensitivity: 'base' }): Filter {
  const collator = useCollator(options);
  return useMemo(
    () => ({
      startsWith(string: string, substring: string) {
        if (substring.length === 0) return true;
        const characters = Array.from(string);
        return characters.some(
          (_, end) => collator.compare(characters.slice(0, end + 1).join(''), substring) === 0,
        );
      },
      endsWith(string: string, substring: string) {
        if (substring.length === 0) return true;
        const characters = Array.from(string);
        return characters.some(
          (_, start) => collator.compare(characters.slice(start).join(''), substring) === 0,
        );
      },
      contains(string: string, substring: string) {
        if (substring.length === 0) return true;
        const characters = Array.from(string);
        for (let start = 0; start < characters.length; start++) {
          for (let end = start + 1; end <= characters.length; end++) {
            if (collator.compare(characters.slice(start, end).join(''), substring) === 0) {
              return true;
            }
          }
        }
        return false;
      },
    }),
    [collator],
  );
}
