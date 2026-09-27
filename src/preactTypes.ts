import type { JSX as PreactJSX, Ref } from 'preact';

type Booleanish = boolean | 'false' | 'true';

/** ARIA attributes owned by preact-a11y so older Preact 10 declarations remain usable. */
export interface AriaAttributes {
  'aria-activedescendant'?: string;
  'aria-atomic'?: Booleanish;
  'aria-autocomplete'?: 'both' | 'inline' | 'list' | 'none';
  'aria-braillelabel'?: string;
  'aria-brailleroledescription'?: string;
  'aria-busy'?: Booleanish;
  'aria-checked'?: Booleanish | 'mixed';
  'aria-colcount'?: number;
  'aria-colindex'?: number;
  'aria-colindextext'?: string;
  'aria-colspan'?: number;
  'aria-controls'?: string;
  'aria-current'?: Booleanish | 'date' | 'location' | 'page' | 'step' | 'time';
  'aria-describedby'?: string;
  'aria-description'?: string;
  'aria-details'?: string;
  'aria-disabled'?: Booleanish;
  /** @deprecated in ARIA 1.1. */
  'aria-dropeffect'?: 'copy' | 'execute' | 'link' | 'move' | 'none' | 'popup';
  'aria-errormessage'?: string;
  'aria-expanded'?: Booleanish;
  'aria-flowto'?: string;
  /** @deprecated in ARIA 1.1. */
  'aria-grabbed'?: Booleanish;
  'aria-haspopup'?: Booleanish | 'dialog' | 'grid' | 'listbox' | 'menu' | 'tree';
  'aria-hidden'?: Booleanish;
  'aria-invalid'?: Booleanish | 'grammar' | 'spelling';
  'aria-keyshortcuts'?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-level'?: number;
  'aria-live'?: 'assertive' | 'off' | 'polite';
  'aria-modal'?: Booleanish;
  'aria-multiline'?: Booleanish;
  'aria-multiselectable'?: Booleanish;
  'aria-orientation'?: 'horizontal' | 'vertical';
  'aria-owns'?: string;
  'aria-placeholder'?: string;
  'aria-posinset'?: number;
  'aria-pressed'?: Booleanish | 'mixed';
  'aria-readonly'?: Booleanish;
  'aria-relevant'?:
    | 'additions'
    | 'additions removals'
    | 'additions text'
    | 'all'
    | 'removals'
    | 'removals additions'
    | 'removals text'
    | 'text'
    | 'text additions'
    | 'text removals';
  'aria-required'?: Booleanish;
  'aria-roledescription'?: string;
  'aria-rowcount'?: number;
  'aria-rowindex'?: number;
  'aria-rowindextext'?: string;
  'aria-rowspan'?: number;
  'aria-selected'?: Booleanish;
  'aria-setsize'?: number;
  'aria-sort'?: 'ascending' | 'descending' | 'none' | 'other';
  'aria-valuemax'?: number;
  'aria-valuemin'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
}

/** Nullable ref object: Preact 10's `RefObject`, and what Preact 11's `useRef(null)` returns. */
export type RefObject<T> = { current: T | null };

export type TargetedEvent<
  Target extends EventTarget = EventTarget,
  TypedEvent extends Event = Event,
> = Omit<TypedEvent, 'currentTarget'> & { readonly currentTarget: Target };

export type TargetedClipboardEvent<Target extends EventTarget> = TargetedEvent<
  Target,
  ClipboardEvent
>;
export type TargetedCompositionEvent<Target extends EventTarget> = TargetedEvent<
  Target,
  CompositionEvent
>;
export type TargetedDragEvent<Target extends EventTarget> = TargetedEvent<Target, DragEvent>;
export type TargetedFocusEvent<Target extends EventTarget> = TargetedEvent<Target, FocusEvent>;
export type TargetedInputEvent<Target extends EventTarget> = TargetedEvent<Target, InputEvent>;
export type TargetedKeyboardEvent<Target extends EventTarget> = TargetedEvent<
  Target,
  KeyboardEvent
>;
export type TargetedMouseEvent<Target extends EventTarget> = TargetedEvent<Target, MouseEvent>;
export type TargetedPointerEvent<Target extends EventTarget> = TargetedEvent<Target, PointerEvent>;

export type EventHandler<EventType extends Event> = {
  bivarianceHack(event: EventType): void;
}['bivarianceHack'];
export type FocusEventHandler<Target extends EventTarget> = EventHandler<
  TargetedFocusEvent<Target>
>;

type EventPropName<Attributes> = Extract<keyof Attributes, `on${string}`>;

type WithoutThis<Handler, Target extends EventTarget> =
  Exclude<Handler, undefined> extends (this: never, event: infer EventType) => infer Result
    ? EventType extends Event
      ? EventHandler<TargetedEvent<Target, EventType>> | Extract<Handler, undefined>
      : ((event: EventType) => Result) | Extract<Handler, undefined>
    : Handler;

type StableEventAttributes<Attributes, Target extends EventTarget> = {
  [Key in EventPropName<Attributes>]?: WithoutThis<Attributes[Key], Target>;
};

/**
 * Preact 11 narrows some attributes per element (`role` everywhere, `type` and `list` on `<input>`,
 * `href` on `<a>`) and models `<a>`/`<input>` as unions discriminated by them. A headless prop bag
 * cannot know which element it is spread onto, and any declared union here makes it unspreadable,
 * so these stay unchecked. Write literals for them with `as const` so inferred bags stay narrow.
 */
// oxlint-disable-next-line typescript/no-explicit-any
type Discriminant = any;

/** Attributes typed here rather than read from Preact, so every supported version agrees on them. */
type OwnedAttributes<Target extends EventTarget> = AriaAttributes & {
  ref?: Ref<Target>;
  role?: Discriminant;
  [attribute: `data-${string}`]: unknown;
  enterKeyHint?: 'done' | 'enter' | 'go' | 'next' | 'previous' | 'search' | 'send';
  oncompositionend?: EventHandler<TargetedCompositionEvent<Target>>;
  oncompositionstart?: EventHandler<TargetedCompositionEvent<Target>>;
  onFocusIn?: FocusEventHandler<Target>;
  onFocusOut?: FocusEventHandler<Target>;
  onfocusin?: FocusEventHandler<Target>;
  onfocusout?: FocusEventHandler<Target>;
  onpointerenter?: EventHandler<TargetedPointerEvent<Target>>;
  onpointerleave?: EventHandler<TargetedPointerEvent<Target>>;
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
};

type StableAttributes<Attributes, Target extends EventTarget> = Omit<
  Attributes,
  EventPropName<Attributes> | keyof OwnedAttributes<Target>
> &
  StableEventAttributes<Omit<Attributes, keyof OwnedAttributes<Target>>, Target> &
  OwnedAttributes<Target>;

/**
 * Preact's own attributes for an intrinsic element. Preact 11 dropped `JSX.HTMLAttributes` and
 * friends, while `JSX.IntrinsicElements` exists on every supported version.
 */
type IntrinsicAttributes<Tag extends keyof PreactJSX.IntrinsicElements> =
  PreactJSX.IntrinsicElements[Tag];

type ElementAttributes<
  Tag extends keyof PreactJSX.IntrinsicElements,
  Target extends EventTarget,
  Attributes extends object = Record<never, never>,
> = StableAttributes<Omit<IntrinsicAttributes<Tag>, keyof Attributes>, Target> & Attributes;

type PreactCSSProperties = Exclude<
  Extract<IntrinsicAttributes<'div'>['style'], object>,
  { peek(): unknown }
>;

interface AnchorAttributes {
  download?: unknown;
  href?: Discriminant;
  hrefLang?: string;
  media?: string;
  ping?: string;
  rel?: string;
  target?: string;
  type?: string;
}

interface ButtonAttributes {
  disabled?: boolean;
  form?: string;
  formAction?: string;
  formEncType?: string;
  formMethod?: string;
  formNoValidate?: boolean;
  formTarget?: string;
  name?: string;
  type?: 'button' | 'reset' | 'submit';
  value?: string | number;
}

interface InputAttributes {
  accept?: string;
  alt?: string;
  autoComplete?: string;
  capture?: 'environment' | 'user';
  checked?: boolean;
  defaultChecked?: boolean;
  defaultValue?: string | number;
  disabled?: boolean;
  form?: string;
  inputMode?: string;
  list?: Discriminant;
  max?: number | string;
  maxLength?: number;
  min?: number | string;
  minLength?: number;
  multiple?: boolean;
  name?: string;
  pattern?: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  size?: number;
  step?: number | string;
  type?: Discriminant;
  value?: string | number;
}

interface LabelAttributes {
  form?: string;
  htmlFor?: string;
}

interface OutputAttributes {
  form?: string;
  htmlFor?: string;
  name?: string;
}

interface SelectAttributes {
  autoComplete?: string;
  disabled?: boolean;
  form?: string;
  multiple?: boolean;
  name?: string;
  required?: boolean;
  size?: number;
  value?: string | number | readonly string[];
}

interface TableAttributes {
  cellPadding?: string;
  cellSpacing?: string;
}

interface TableCellAttributes {
  abbr?: string;
  colSpan?: number;
  headers?: string;
  rowSpan?: number;
  scope?: string;
}

/** Version-stable Preact JSX types used by the public primitive contracts. */
export namespace JSX {
  export type AnchorHTMLAttributes<Target extends EventTarget = HTMLAnchorElement> =
    ElementAttributes<'a', Target, AnchorAttributes>;
  export type ButtonHTMLAttributes<Target extends EventTarget = HTMLButtonElement> =
    ElementAttributes<'button', Target, ButtonAttributes>;
  /**
   * Preact 10 declares this on `JSX`, Preact 11 on the package root, so it is read off `style`.
   * An interface keeps declarations naming this type instead of the build-time Preact's.
   */
  export interface CSSProperties extends PreactCSSProperties {}
  export type HTMLAttributes<Target extends EventTarget = HTMLElement> = ElementAttributes<
    'div',
    Target
  >;
  export type InputHTMLAttributes<Target extends EventTarget = HTMLInputElement> =
    ElementAttributes<'input', Target, InputAttributes>;
  export type IntrinsicElements = PreactJSX.IntrinsicElements;
  export type KeyboardEventHandler<Target extends EventTarget> = EventHandler<
    TargetedKeyboardEvent<Target>
  >;
  export type LabelHTMLAttributes<Target extends EventTarget = HTMLLabelElement> =
    ElementAttributes<'label', Target, LabelAttributes>;
  export type OutputHTMLAttributes<Target extends EventTarget = HTMLOutputElement> =
    ElementAttributes<'output', Target, OutputAttributes>;
  export type SelectHTMLAttributes<Target extends EventTarget = HTMLSelectElement> =
    ElementAttributes<'select', Target, SelectAttributes>;
  export type TableHTMLAttributes<Target extends EventTarget = HTMLTableElement> =
    ElementAttributes<'table', Target, TableAttributes>;
  export type TdHTMLAttributes<Target extends EventTarget = HTMLTableCellElement> =
    ElementAttributes<'td', Target, TableCellAttributes>;
  export type ThHTMLAttributes<Target extends EventTarget = HTMLTableCellElement> =
    ElementAttributes<'th', Target, TableCellAttributes>;
}
