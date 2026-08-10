import type {
  ComponentChildren,
  JSX,
  RefObject,
  TargetedClipboardEvent,
  TargetedCompositionEvent,
  TargetedInputEvent,
  TargetedKeyboardEvent,
} from 'preact';
import { useMemo } from 'preact/hooks';
import { useField } from '../forms/useField';
import { getSelection, setTokenFieldSelection, type TokenFieldPosition } from './selection';

const TOKEN_CLIPBOARD_TYPE = 'application/vnd.preact-aria.tokens+json';

export interface TokenFieldTextSegment {
  type: 'text';
  text: string;
}

export interface TokenFieldTokenSegment<Value = unknown> {
  type: 'token';
  text: string;
  value?: Value;
}

export type TokenFieldSegment<Value = unknown> =
  | TokenFieldTextSegment
  | TokenFieldTokenSegment<Value>;

export interface TokenFieldState<Value = unknown> {
  value: readonly TokenFieldSegment<Value>[];
  setValue(
    value:
      | readonly TokenFieldSegment<Value>[]
      | ((value: readonly TokenFieldSegment<Value>[]) => readonly TokenFieldSegment<Value>[]),
  ): void;
  isComposing?: boolean;
  setComposing?(isComposing: boolean): void;
}

export interface AriaTokenFieldProps<Value = unknown> {
  id?: string;
  role?: 'textbox' | 'searchbox' | 'combobox';
  label?: ComponentChildren;
  description?: ComponentChildren;
  errorMessage?: ComponentChildren;
  allowsNewlines?: boolean;
  isReadOnly?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-details'?: string;
  onSubmit?: () => void;
  onKeyDown?: (event: TargetedKeyboardEvent<HTMLDivElement>) => void;
  onKeyUp?: (event: TargetedKeyboardEvent<HTMLDivElement>) => void;
  onCopy?: (event: TargetedClipboardEvent<HTMLDivElement>) => void;
  onCut?: (event: TargetedClipboardEvent<HTMLDivElement>) => void;
  onPaste?: (event: TargetedClipboardEvent<HTMLDivElement>) => void;
  onValueChange?: (value: readonly TokenFieldSegment<Value>[]) => void;
}

export interface TokenFieldAria {
  tokenFieldProps: Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'>;
  labelProps: Omit<JSX.HTMLAttributes<HTMLElement>, 'ref'>;
  descriptionProps: Omit<JSX.HTMLAttributes<HTMLElement>, 'ref'>;
  errorMessageProps: Omit<JSX.HTMLAttributes<HTMLElement>, 'ref'>;
}

function segmentLength(segment: TokenFieldSegment): number {
  return segment.text.length;
}

function normalizeSegments<Value>(
  segments: readonly TokenFieldSegment<Value>[],
): TokenFieldSegment<Value>[] {
  const result: TokenFieldSegment<Value>[] = [];
  const appendText = (text: string) => {
    const previous = result.at(-1);
    if (previous?.type === 'text') previous.text += text;
    else result.push({ type: 'text', text });
  };
  appendText('');
  for (const segment of segments) {
    if (segment.type === 'text') appendText(segment.text);
    else {
      result.push({ ...segment });
      appendText('');
    }
  }
  return result;
}

function clampPosition<Value>(
  segments: readonly TokenFieldSegment<Value>[],
  position: TokenFieldPosition,
): TokenFieldPosition {
  const index = Math.max(0, Math.min(position.index, Math.max(0, segments.length - 1)));
  return {
    index,
    offset: Math.max(
      0,
      Math.min(position.offset, segmentLength(segments[index] ?? { type: 'text', text: '' })),
    ),
  };
}

function positionOffset<Value>(
  segments: readonly TokenFieldSegment<Value>[],
  position: TokenFieldPosition,
): number {
  const clamped = clampPosition(segments, position);
  return segments
    .slice(0, clamped.index)
    .reduce((offset, segment) => offset + segmentLength(segment), clamped.offset);
}

function offsetPosition<Value>(
  segments: readonly TokenFieldSegment<Value>[],
  offset: number,
): TokenFieldPosition {
  let remaining = Math.max(0, offset);
  for (let index = 0; index < segments.length; index++) {
    const length = segmentLength(segments[index]!);
    if (remaining <= length) return { index, offset: remaining };
    remaining -= length;
  }
  const index = Math.max(0, segments.length - 1);
  return { index, offset: segmentLength(segments[index] ?? { type: 'text', text: '' }) };
}

function replaceRange<Value>(
  value: readonly TokenFieldSegment<Value>[],
  startPosition: TokenFieldPosition,
  endPosition: TokenFieldPosition,
  insert: readonly TokenFieldSegment<Value>[],
): { value: TokenFieldSegment<Value>[]; caretOffset: number } {
  const segments = normalizeSegments(value);
  const start = clampPosition(segments, startPosition);
  const end = clampPosition(segments, endPosition);
  const before: TokenFieldSegment<Value>[] = segments.slice(0, start.index);
  const after: TokenFieldSegment<Value>[] = segments.slice(end.index + 1);
  const startSegment = segments[start.index];
  const endSegment = segments[end.index];
  if (startSegment) {
    if (startSegment.type === 'text')
      before.push({ type: 'text', text: startSegment.text.slice(0, start.offset) });
    else if (start.offset >= startSegment.text.length) before.push(startSegment);
  }
  if (endSegment) {
    if (endSegment.type === 'text')
      after.unshift({ type: 'text', text: endSegment.text.slice(end.offset) });
    else if (end.offset <= 0) after.unshift(endSegment);
  }
  const next = normalizeSegments([...before, ...insert, ...after]);
  return {
    value: next,
    caretOffset:
      positionOffset(segments, start) +
      insert.reduce((sum, segment) => sum + segment.text.length, 0),
  };
}

function sliceRange<Value>(
  value: readonly TokenFieldSegment<Value>[],
  start: TokenFieldPosition,
  end: TokenFieldPosition,
) {
  const segments = normalizeSegments(value);
  const from = clampPosition(segments, start);
  const to = clampPosition(segments, end);
  const result = segments.slice(from.index, to.index + 1).map((segment) => ({ ...segment }));
  const first = result[0];
  const last = result.at(-1);
  if (first?.type === 'text') first.text = first.text.slice(from.offset);
  else if (first && from.offset >= first.text.length) result.shift();
  const adjustedLast = result.at(-1);
  if (adjustedLast?.type === 'text') {
    adjustedLast.text = adjustedLast.text.slice(
      0,
      from.index === to.index ? to.offset - from.offset : to.offset,
    );
  } else if (last && to.offset <= 0) result.pop();
  return normalizeSegments(result);
}

function previousPosition<Value>(
  value: readonly TokenFieldSegment<Value>[],
  position: TokenFieldPosition,
  segmenter: Intl.Segmenter,
): TokenFieldPosition | null {
  const current = clampPosition(value, position);
  const segment = value[current.index];
  if (segment?.type === 'text' && current.offset > 0) {
    let boundary = 0;
    for (const part of segmenter.segment(segment.text.slice(0, current.offset)))
      boundary = part.index;
    return { index: current.index, offset: boundary };
  }
  if (segment?.type === 'token' && current.offset > 0) return { index: current.index, offset: 0 };
  if (current.index <= 0) return null;
  const previous = value[current.index - 1]!;
  if (previous.type === 'token') return { index: current.index - 1, offset: 0 };
  let boundary = 0;
  for (const part of segmenter.segment(previous.text)) boundary = part.index;
  return { index: current.index - 1, offset: boundary };
}

function nextPosition<Value>(
  value: readonly TokenFieldSegment<Value>[],
  position: TokenFieldPosition,
  segmenter: Intl.Segmenter,
): TokenFieldPosition | null {
  const current = clampPosition(value, position);
  const segment = value[current.index];
  if (segment?.type === 'token' && current.offset < segment.text.length)
    return { index: current.index, offset: segment.text.length };
  if (segment?.type === 'text' && current.offset < segment.text.length) {
    for (const part of segmenter.segment(segment.text.slice(current.offset))) {
      if (part.index > 0) return { index: current.index, offset: current.offset + part.index };
    }
    return { index: current.index, offset: segment.text.length };
  }
  if (current.index >= value.length - 1) return null;
  const next = value[current.index + 1]!;
  return {
    index: current.index + 1,
    offset: next.type === 'token' ? next.text.length : Math.min(1, next.text.length),
  };
}

function parseTransferredSegments<Value>(data: string): TokenFieldSegment<Value>[] | null {
  try {
    const parsed = JSON.parse(data) as unknown;
    if (
      !Array.isArray(parsed) ||
      !parsed.every(
        (segment) =>
          typeof segment === 'object' &&
          segment !== null &&
          'type' in segment &&
          (segment.type === 'text' || segment.type === 'token') &&
          'text' in segment &&
          typeof segment.text === 'string',
      )
    ) {
      return null;
    }
    return parsed as TokenFieldSegment<Value>[];
  } catch {
    return null;
  }
}

function segmentsFromDOM<Value>(root: HTMLElement, previous: readonly TokenFieldSegment<Value>[]) {
  return normalizeSegments(
    [...root.childNodes].map<TokenFieldSegment<Value>>((node, index) => {
      if (node instanceof HTMLElement && node.hasAttribute('data-preact-aria-token')) {
        const oldToken = previous[index];
        return {
          type: 'token',
          text: node.textContent ?? '',
          value: oldToken?.type === 'token' ? oldToken.value : undefined,
        };
      }
      return {
        type: 'text',
        text: node instanceof HTMLBRElement ? '\n' : (node.textContent ?? ''),
      };
    }),
  );
}

/** Provides contenteditable token-field semantics over a consumer-owned segment array. */
export function useTokenField<Value = unknown>(
  props: AriaTokenFieldProps<Value>,
  state: TokenFieldState<Value>,
  ref: RefObject<HTMLDivElement>,
): TokenFieldAria {
  const { fieldProps, labelProps, descriptionProps, errorMessageProps } = useField(props);
  const graphemes = useMemo(() => new Intl.Segmenter(undefined, { granularity: 'grapheme' }), []);

  function selection() {
    const root = ref.current;
    const fallback = normalizeSegments(state.value);
    if (!root) {
      const position = offsetPosition(fallback, Number.POSITIVE_INFINITY);
      return [position, position] as const;
    }
    return (
      getSelection(root) ??
      ([
        offsetPosition(fallback, Number.POSITIVE_INFINITY),
        offsetPosition(fallback, Number.POSITIVE_INFINITY),
      ] as const)
    );
  }

  function update(
    start: TokenFieldPosition,
    end: TokenFieldPosition,
    insert: TokenFieldSegment<Value>[],
  ) {
    const change = replaceRange(state.value, start, end, insert);
    state.setValue(change.value);
    props.onValueChange?.(change.value);
    queueMicrotask(() => {
      if (!ref.current) return;
      const caret = offsetPosition(change.value, change.caretOffset);
      setTokenFieldSelection(ref.current, caret, caret, true);
    });
  }

  function writeClipboard(event: TargetedClipboardEvent<HTMLDivElement>, cut: boolean) {
    if (!event.clipboardData) return;
    const [start, end] = selection();
    const selected = sliceRange(state.value, start, end);
    event.preventDefault();
    event.clipboardData.setData(TOKEN_CLIPBOARD_TYPE, JSON.stringify(selected));
    event.clipboardData.setData('text/plain', selected.map((segment) => segment.text).join(''));
    if (cut && !props.isReadOnly && !props.isDisabled) update(start, end, []);
  }

  const tokenFieldProps: Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> = {
    ...fieldProps,
    role: props.role ?? 'textbox',
    tabIndex: props.isDisabled ? -1 : 0,
    contentEditable: !props.isDisabled && !props.isReadOnly,
    'aria-multiline': props.allowsNewlines ?? false,
    'aria-readonly': props.isReadOnly || undefined,
    'aria-disabled': props.isDisabled || undefined,
    'aria-details': props['aria-details'],
    spellcheck: true,
    style: { whiteSpace: 'pre-wrap' },
    onBeforeInput(event: TargetedInputEvent<HTMLDivElement>) {
      if (props.isDisabled || props.isReadOnly || event.isComposing) return;
      const [start, end] = selection();
      if (
        event.inputType === 'insertText' ||
        event.inputType === 'insertReplacementText' ||
        event.inputType === 'insertFromDrop'
      ) {
        event.preventDefault();
        const text = props.allowsNewlines
          ? (event.data ?? '')
          : (event.data ?? '').replace(/[\r\n]+/g, ' ');
        update(start, end, [{ type: 'text', text }]);
      } else if (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak') {
        event.preventDefault();
        if (event.inputType === 'insertParagraph' && props.onSubmit) props.onSubmit();
        else if (props.allowsNewlines) update(start, end, [{ type: 'text', text: '\n' }]);
      } else if (event.inputType === 'deleteContentBackward') {
        event.preventDefault();
        const previous =
          start.index === end.index && start.offset === end.offset
            ? previousPosition(normalizeSegments(state.value), start, graphemes)
            : start;
        if (previous) update(previous, end, []);
      } else if (event.inputType === 'deleteContentForward') {
        event.preventDefault();
        const next =
          start.index === end.index && start.offset === end.offset
            ? nextPosition(normalizeSegments(state.value), end, graphemes)
            : end;
        if (next) update(start, next, []);
      }
    },
    onCompositionStart(_event: TargetedCompositionEvent<HTMLDivElement>) {
      state.setComposing?.(true);
    },
    onCompositionEnd(_event: TargetedCompositionEvent<HTMLDivElement>) {
      state.setComposing?.(false);
      if (ref.current) {
        const next = segmentsFromDOM(ref.current, state.value);
        state.setValue(next);
        props.onValueChange?.(next);
      }
    },
    onKeyDown(event: TargetedKeyboardEvent<HTMLDivElement>) {
      props.onKeyDown?.(event);
      if (event.defaultPrevented || event.key !== 'Enter' || props.allowsNewlines) return;
      if (props.onSubmit) {
        event.preventDefault();
        props.onSubmit();
      }
    },
    onKeyUp: props.onKeyUp,
    onCopy(event: TargetedClipboardEvent<HTMLDivElement>) {
      props.onCopy?.(event);
      if (!event.defaultPrevented) writeClipboard(event, false);
    },
    onCut(event: TargetedClipboardEvent<HTMLDivElement>) {
      props.onCut?.(event);
      if (!event.defaultPrevented) writeClipboard(event, true);
    },
    onPaste(event: TargetedClipboardEvent<HTMLDivElement>) {
      props.onPaste?.(event);
      if (event.defaultPrevented || props.isDisabled || props.isReadOnly || !event.clipboardData)
        return;
      const custom = event.clipboardData.getData(TOKEN_CLIPBOARD_TYPE);
      let segments = custom ? parseTransferredSegments<Value>(custom) : null;
      if (!segments) segments = [{ type: 'text', text: event.clipboardData.getData('text/plain') }];
      if (!props.allowsNewlines) {
        segments = segments.map((segment) => ({
          ...segment,
          text: segment.text.replace(/[\r\n]+/g, ' '),
        }));
      }
      event.preventDefault();
      const [start, end] = selection();
      update(start, end, segments);
    },
  };

  return {
    tokenFieldProps,
    labelProps: {
      id: labelProps.id,
      onClick() {
        if (!props.isDisabled) ref.current?.focus();
      },
    },
    descriptionProps,
    errorMessageProps,
  };
}
