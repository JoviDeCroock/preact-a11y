/*
 * Copyright 2022 Adobe. All rights reserved.
 * Licensed under the Apache License, Version 2.0. See LICENSE.
 * Modified by JoviDeCroock for Preact A11y in 2026.
 */

import { useMemo } from 'preact/hooks';
import { useLocale } from './I18nProvider';

export type LocalizedStringVariables = Record<string, boolean | number | string> | undefined;

export type LocalizedString =
  | string
  | ((
      variables: LocalizedStringVariables,
      formatter?: LocalizedStringFormatter<string, LocalizedString>,
    ) => string);

export type LocalizedStrings<
  Key extends string = string,
  Message extends LocalizedString = string,
> = Record<string, Record<Key, Message>>;

function localeParts(locale: string): { language: string; script?: string } {
  try {
    const parsed = new Intl.Locale(locale);
    return { language: parsed.language, script: parsed.script };
  } catch {
    const [language] = locale.split('-');
    return { language: language || locale };
  }
}

/** A locale-aware message lookup with exact, script, language, and default fallbacks. */
export class LocalizedStringDictionary<
  Key extends string = string,
  Message extends LocalizedString = string,
> {
  readonly #messages: LocalizedStrings<Key, Message>;
  readonly #defaultLocale: string;
  readonly #packageName?: string;
  readonly #resolved = new Map<string, Record<Key, Message>>();

  constructor(
    messages: LocalizedStrings<Key, Message>,
    defaultLocale = 'en-US',
    packageName?: string,
  ) {
    this.#messages = Object.fromEntries(Object.entries(messages).filter(([, value]) => value));
    this.#defaultLocale = defaultLocale;
    this.#packageName = packageName;
  }

  getStringsForLocale(locale: string): Record<Key, Message> {
    const cached = this.#resolved.get(locale);
    if (cached) return cached;

    const { language, script } = localeParts(locale);
    const messages =
      this.#messages[locale] ??
      (script ? this.#messages[`${language}-${script}`] : undefined) ??
      this.#messages[language] ??
      Object.entries(this.#messages).find(([key]) => key.startsWith(`${language}-`))?.[1] ??
      this.#messages[this.#defaultLocale] ??
      Object.values(this.#messages)[0];

    if (!messages) {
      const source = this.#packageName ? ` for ${this.#packageName}` : '';
      throw new Error(`No localized messages are available${source}.`);
    }

    this.#resolved.set(locale, messages);
    return messages;
  }

  getStringForLocale(key: Key, locale: string): Message {
    const message = this.getStringsForLocale(locale)[key];
    if (message == null) {
      const source = this.#packageName ? ` in ${this.#packageName}` : '';
      throw new Error(`Missing localized message "${key}" for locale "${locale}"${source}.`);
    }
    return message;
  }
}

type DeferredString = string | (() => string);

const pluralRulesCache = new Map<string, Intl.PluralRules>();
const numberFormatCache = new Map<string, Intl.NumberFormat>();

function resolveString(value: DeferredString | undefined): string {
  return typeof value === 'function' ? value() : (value ?? '');
}

/** Formats messages and exposes locale-aware plural, number, and selection helpers. */
export class LocalizedStringFormatter<
  Key extends string = string,
  Message extends LocalizedString = string,
> {
  readonly #locale: string;
  readonly #dictionary: LocalizedStringDictionary<Key, Message>;

  constructor(locale: string, dictionary: LocalizedStringDictionary<Key, Message>) {
    this.#locale = locale;
    this.#dictionary = dictionary;
  }

  format(key: Key, variables?: LocalizedStringVariables): string {
    const message = this.#dictionary.getStringForLocale(key, this.#locale);
    return typeof message === 'function'
      ? message(variables, this as unknown as LocalizedStringFormatter<string, LocalizedString>)
      : message;
  }

  plural(
    count: number,
    options: Record<string, DeferredString>,
    type: Intl.PluralRuleType = 'cardinal',
  ): string {
    const exact = options[`=${count}`];
    if (exact != null) return resolveString(exact);
    const cacheKey = `${this.#locale}:${type}`;
    let rules = pluralRulesCache.get(cacheKey);
    if (!rules) {
      rules = new Intl.PluralRules(this.#locale, { type });
      pluralRulesCache.set(cacheKey, rules);
    }
    const category = rules.select(count);
    return resolveString(options[category] ?? options.other);
  }

  number(value: number, options?: Intl.NumberFormatOptions): string {
    const cacheKey = `${this.#locale}:${JSON.stringify(options ?? {})}`;
    let formatter = numberFormatCache.get(cacheKey);
    if (!formatter) {
      formatter = new Intl.NumberFormat(this.#locale, options);
      numberFormatCache.set(cacheKey, formatter);
    }
    return formatter.format(value);
  }

  select(options: Record<string, DeferredString>, value: string): string {
    return resolveString(options[value] ?? options.other);
  }
}

const dictionaryCache = new WeakMap<object, LocalizedStringDictionary<string, LocalizedString>>();

/** Returns a stable dictionary for a static localized message object. */
export function useLocalizedStringDictionary<
  Key extends string = string,
  Message extends LocalizedString = string,
>(
  strings: LocalizedStrings<Key, Message>,
  packageName?: string,
): LocalizedStringDictionary<Key, Message> {
  let dictionary = dictionaryCache.get(strings);
  if (!dictionary) {
    dictionary = new LocalizedStringDictionary(
      strings,
      'en-US',
      packageName,
    ) as unknown as LocalizedStringDictionary<string, LocalizedString>;
    dictionaryCache.set(strings, dictionary);
  }
  return dictionary as unknown as LocalizedStringDictionary<Key, Message>;
}

/** Returns a formatter bound to the current I18nProvider locale. */
export function useLocalizedStringFormatter<
  Key extends string = string,
  Message extends LocalizedString = string,
>(
  strings: LocalizedStrings<Key, Message>,
  packageName?: string,
): LocalizedStringFormatter<Key, Message> {
  const { locale } = useLocale();
  const dictionary = useLocalizedStringDictionary(strings, packageName);
  return useMemo(() => new LocalizedStringFormatter(locale, dictionary), [dictionary, locale]);
}
