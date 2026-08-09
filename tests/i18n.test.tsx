import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import {
  I18nProvider,
  getTextDirection,
  useDateFormatter,
  useFilter,
  useListFormatter,
  useLocale,
  useNumberFormatter,
} from '../src';

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
});
