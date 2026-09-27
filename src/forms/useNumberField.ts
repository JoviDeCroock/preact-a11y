import type { JSX, TargetedEvent, TargetedKeyboardEvent } from '../preactTypes';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { useLocale } from '../i18n/I18nProvider';
import { useNumberFormatter } from '../i18n/formatters';
import { useField, type AriaFieldProps } from './useField';

export interface AriaNumberFieldProps extends AriaFieldProps {
  value?: number;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
  onChange?: (value: number | null) => void;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createParser(locale: string, options?: Intl.NumberFormatOptions) {
  const formatter = new Intl.NumberFormat(locale, options);
  const parts = formatter.formatToParts(-12345.6);
  const group = parts.find((part) => part.type === 'group')?.value;
  const decimal = parts.find((part) => part.type === 'decimal')?.value;
  const minus = parts.find((part) => part.type === 'minusSign')?.value;
  const digits = new Map(
    Array.from({ length: 10 }, (_, number) => [
      new Intl.NumberFormat(locale, { useGrouping: false }).format(number),
      String(number),
    ]),
  );

  return (input: string): number | null => {
    let normalized = input.trim();
    for (const [localized, latin] of digits) normalized = normalized.replaceAll(localized, latin);
    if (group) normalized = normalized.replace(new RegExp(escapeRegExp(group), 'g'), '');
    if (decimal) normalized = normalized.replace(decimal, '.');
    if (minus && minus !== '-') normalized = normalized.replace(minus, '-');
    normalized = normalized.replace(/[\s\u00a0\u202f]/g, '');
    if (normalized === '' || normalized === '-' || normalized === '.') return null;
    normalized = normalized.replace(/[^0-9+\-.]/g, '');
    const value = Number(normalized);
    if (!Number.isFinite(value)) return null;
    return options?.style === 'percent' ? value / 100 : value;
  };
}

export function useNumberField(props: AriaNumberFieldProps = {}) {
  const { locale } = useLocale();
  const formatter = useNumberFormatter(props.formatOptions);
  const parser = useMemo(
    () => createParser(locale, props.formatOptions),
    [locale, props.formatOptions],
  );
  const [uncontrolled, setUncontrolled] = useState(props.defaultValue);
  const numericValue = props.value ?? uncontrolled;
  const [inputValue, setInputValue] = useState(() =>
    numericValue === undefined ? '' : formatter.format(numericValue),
  );
  const { fieldProps, labelProps, descriptionProps, errorMessageProps } = useField(props);
  const step = props.step ?? 1;

  useEffect(() => {
    if (props.value !== undefined) setInputValue(formatter.format(props.value));
  }, [formatter, props.value]);

  function commit(next: number | null) {
    if (props.isDisabled || props.isReadOnly) return;
    if (next == null) {
      setInputValue('');
      if (props.value === undefined) setUncontrolled(undefined);
      props.onChange?.(null);
      return;
    }

    const clamped = Math.min(
      props.maxValue ?? Infinity,
      Math.max(props.minValue ?? -Infinity, next),
    );
    setInputValue(formatter.format(clamped));
    if (props.value === undefined) setUncontrolled(clamped);
    props.onChange?.(clamped);
  }

  function adjust(delta: number) {
    const parsed = parser(inputValue);
    commit((parsed ?? props.minValue ?? 0) + delta * step);
  }

  const parsedValue = parser(inputValue);
  return {
    labelProps,
    descriptionProps,
    errorMessageProps,
    inputProps: {
      ...fieldProps,
      role: 'spinbutton' as const,
      type: 'text' as const,
      inputMode: 'decimal',
      value: inputValue,
      disabled: props.isDisabled,
      readOnly: props.isReadOnly,
      required: props.isRequired,
      'aria-valuemin': props.minValue,
      'aria-valuemax': props.maxValue,
      'aria-valuenow': parsedValue ?? undefined,
      'aria-valuetext': parsedValue == null ? undefined : formatter.format(parsedValue),
      onInput(event: TargetedEvent<HTMLInputElement, Event>) {
        setInputValue(event.currentTarget.value);
      },
      onBlur() {
        commit(parser(inputValue));
      },
      onKeyDown(event: TargetedKeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          adjust(event.key === 'ArrowUp' ? 1 : -1);
        } else if (event.key === 'Enter') {
          commit(parser(inputValue));
        }
      },
    } satisfies JSX.InputHTMLAttributes<HTMLInputElement>,
    incrementButtonProps: {
      type: 'button',
      disabled: props.isDisabled || props.isReadOnly || numericValue === props.maxValue,
      'aria-label': 'Increase value',
      'aria-controls': fieldProps.id,
      onClick: () => adjust(1),
    } satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    decrementButtonProps: {
      type: 'button',
      disabled: props.isDisabled || props.isReadOnly || numericValue === props.minValue,
      'aria-label': 'Decrease value',
      'aria-controls': fieldProps.id,
      onClick: () => adjust(-1),
    } satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  };
}
