import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import {
  I18nProvider,
  LocalizedStringDictionary,
  type LocalizedString,
  type LocalizedStringFormatter,
  type LocalizedStringVariables,
  getTextDirection,
  useDateFormatter,
  useFilter,
  useListFormatter,
  useLocale,
  useLocalizedStringDictionary,
  useLocalizedStringFormatter,
  useNumberFormatter,
} from '../src';

const messages = {
  'en-US': {
    greeting: 'Hello',
    items: (
      variables: LocalizedStringVariables,
      formatter?: LocalizedStringFormatter<string, LocalizedString>,
    ) => {
      const count = Number(variables?.count ?? 0);
      return formatter!.plural(count, {
        '=0': 'No items',
        one: `${formatter!.number(count)} item`,
        other: `${formatter!.number(count)} items`,
      });
    },
  },
  fr: {
    greeting: 'Bonjour',
    items: (
      variables: LocalizedStringVariables,
      formatter?: LocalizedStringFormatter<string, LocalizedString>,
    ) => {
      const count = Number(variables?.count ?? 0);
      return formatter!.plural(count, {
        one: `${formatter!.number(count)} element`,
        other: `${formatter!.number(count)} elements`,
      });
    },
  },
};

function FormattingProbe() {
  const { locale, direction } = useLocale();
  const number = useNumberFormatter({ maximumFractionDigits: 1 });
  const date = useDateFormatter({ dateStyle: 'long', timeZone: 'UTC' });
  const list = useListFormatter({ type: 'conjunction' });
  const filter = useFilter({ sensitivity: 'base' });

  return (
    <output
      data-contains={filter.contains('Straße', 'STRASSE') || undefined}
      data-date={date.format(new Date('2024-01-02T00:00:00Z'))}
      data-direction={direction}
      data-list={list.format(['A', 'B', 'C'])}
      data-locale={locale}
      data-number={number.format(1234.5)}
    />
  );
}

function MessageProbe({ count }: { count: number }) {
  const dictionary = useLocalizedStringDictionary(messages, 'message-probe');
  const sameDictionary = useLocalizedStringDictionary(messages);
  const formatter = useLocalizedStringFormatter(messages, 'message-probe');
  return (
    <output
      data-dictionary={dictionary === sameDictionary || undefined}
      data-greeting={formatter.format('greeting')}
      data-items={formatter.format('items', { count })}
    />
  );
}

describe('internationalization primitives', () => {
  it('provides locale direction and Intl formatters', () => {
    render(
      <I18nProvider locale="de-DE">
        <FormattingProbe />
      </I18nProvider>,
    );
    const output = screen.getByRole('status');

    expect(output).toHaveAttribute('data-locale', 'de-DE');
    expect(output).toHaveAttribute('data-direction', 'ltr');
    expect(output).toHaveAttribute('data-number', '1.234,5');
    expect(output).toHaveAttribute('data-date', '2. Januar 2024');
    expect(output).toHaveAttribute('data-list', 'A, B und C');
    expect(output).toHaveAttribute('data-contains', 'true');
  });

  it('derives RTL direction from language and script subtags', () => {
    expect(getTextDirection('ar-EG')).toBe('rtl');
    expect(getTextDirection('az-Arab')).toBe('rtl');
    expect(getTextDirection('az-Latn')).toBe('ltr');
  });

  it('formats localized callback messages using language fallback', () => {
    const { rerender } = render(
      <I18nProvider locale="fr-CA">
        <MessageProbe count={2} />
      </I18nProvider>,
    );

    let output = screen.getByRole('status');
    expect(output).toHaveAttribute('data-dictionary', 'true');
    expect(output).toHaveAttribute('data-greeting', 'Bonjour');
    expect(output).toHaveAttribute('data-items', '2 elements');

    rerender(
      <I18nProvider locale="en-US">
        <MessageProbe count={0} />
      </I18nProvider>,
    );
    output = screen.getByRole('status');
    expect(output).toHaveAttribute('data-items', 'No items');
  });

  it('reports missing messages with locale and package context', () => {
    const dictionary = new LocalizedStringDictionary(
      { 'en-US': { greeting: 'Hello' } },
      'en-US',
      'demo',
    );
    expect(() => dictionary.getStringForLocale('missing' as 'greeting', 'nl-BE')).toThrow(
      'Missing localized message "missing" for locale "nl-BE" in demo.',
    );
  });
});
