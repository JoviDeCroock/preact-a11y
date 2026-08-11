import type { RefObject } from 'preact';
import type {
  JSX,
  TargetedEvent,
  TargetedKeyboardEvent,
  TargetedPointerEvent,
} from '../preactTypes';
import { useEffect, useState } from 'preact/hooks';
import { useField, type AriaFieldProps } from '../forms/useField';

type WithoutRef<Props> = Omit<Props, 'ref'>;

export type ColorSpace = 'rgb' | 'hsl' | 'hsv';
export type ColorChannel =
  | 'red'
  | 'green'
  | 'blue'
  | 'hue'
  | 'saturation'
  | 'lightness'
  | 'brightness'
  | 'alpha';

export interface ColorValue {
  space: ColorSpace;
  channels: Partial<Record<ColorChannel, number>>;
  alpha?: number;
}

/** Consumer-owned state contract shared by all color hooks. */
export interface ColorState {
  value: ColorValue;
  setValue(value: ColorValue): void;
}

export interface ColorChannelRange {
  minValue: number;
  maxValue: number;
  step: number;
}

function channelRange(channel: ColorChannel): ColorChannelRange {
  if (channel === 'hue') return { minValue: 0, maxValue: 360, step: 1 };
  if (channel === 'red' || channel === 'green' || channel === 'blue') {
    return { minValue: 0, maxValue: 255, step: 1 };
  }
  if (channel === 'alpha') return { minValue: 0, maxValue: 1, step: 0.01 };
  return { minValue: 0, maxValue: 100, step: 1 };
}

function channelValue(color: ColorValue, channel: ColorChannel) {
  return channel === 'alpha' ? (color.alpha ?? 1) : (color.channels[channel] ?? 0);
}

function clamp(value: number, range: ColorChannelRange) {
  return Math.min(range.maxValue, Math.max(range.minValue, value));
}

function colorWithChannel(color: ColorValue, channel: ColorChannel, value: number) {
  const range = channelRange(channel);
  const next = clamp(value, range);
  return channel === 'alpha'
    ? { ...color, alpha: next }
    : { ...color, channels: { ...color.channels, [channel]: next } };
}

function setChannel(state: ColorState, channel: ColorChannel, value: number) {
  state.setValue(colorWithChannel(state.value, channel, value));
}

function colorLabel(color: ColorValue) {
  const parts = Object.entries(color.channels).map(
    ([name, value]) => `${name} ${Math.round(value)}`,
  );
  if (color.alpha != null && color.alpha < 1) parts.push(`alpha ${Math.round(color.alpha * 100)}%`);
  return parts.join(', ');
}

function hsvToRgb(hue: number, saturation: number, brightness: number) {
  const c = (brightness / 100) * (saturation / 100);
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = brightness / 100 - c;
  const [red, green, blue] =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [red, green, blue].map((value) => Math.round((value + m) * 255));
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  const normalizedSaturation = saturation / 100;
  const normalizedLightness = lightness / 100;
  const c = (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = normalizedLightness - c / 2;
  const [red, green, blue] =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [red, green, blue].map((value) => Math.round((value + m) * 255));
}

export function colorToCSS(color: ColorValue) {
  const alpha = color.alpha ?? 1;
  if (color.space === 'hsl') {
    return `hsl(${color.channels.hue ?? 0} ${color.channels.saturation ?? 0}% ${color.channels.lightness ?? 0}% / ${alpha})`;
  }
  const channels =
    color.space === 'hsv'
      ? hsvToRgb(
          color.channels.hue ?? 0,
          color.channels.saturation ?? 0,
          color.channels.brightness ?? 0,
        )
      : [color.channels.red ?? 0, color.channels.green ?? 0, color.channels.blue ?? 0];
  return `rgb(${channels.map(Math.round).join(' ')} / ${alpha})`;
}

function rangeInputProps(
  channel: ColorChannel,
  state: ColorState,
  label: string,
  disabled?: boolean,
): WithoutRef<JSX.InputHTMLAttributes<HTMLInputElement>> {
  const range = channelRange(channel);
  const value = channelValue(state.value, channel);
  return {
    type: 'range',
    min: range.minValue,
    max: range.maxValue,
    step: range.step,
    value,
    disabled,
    'aria-label': label,
    'aria-valuetext': `${Math.round(value * (channel === 'alpha' ? 100 : 1))}${channel === 'alpha' ? '%' : ''}`,
    onInput(event: TargetedEvent<HTMLInputElement, Event>) {
      setChannel(state, channel, event.currentTarget.valueAsNumber);
    },
  };
}

export interface AriaColorAreaProps {
  xChannel: ColorChannel;
  yChannel: ColorChannel;
  isDisabled?: boolean;
  xChannelLabel?: string;
  yChannelLabel?: string;
  'aria-label'?: string;
}

export interface ColorAreaAria {
  colorAreaProps: WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>;
  thumbProps: WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>;
  xInputProps: WithoutRef<JSX.InputHTMLAttributes<HTMLInputElement>>;
  yInputProps: WithoutRef<JSX.InputHTMLAttributes<HTMLInputElement>>;
  isDragging: boolean;
}

export function useColorArea(
  props: AriaColorAreaProps,
  state: ColorState,
  ref: RefObject<HTMLElement>,
): ColorAreaAria {
  const [isDragging, setDragging] = useState(false);

  function update(event: TargetedPointerEvent<HTMLDivElement>) {
    if (props.isDisabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const xRange = channelRange(props.xChannel);
    const yRange = channelRange(props.yChannel);
    const x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), {
      minValue: 0,
      maxValue: 1,
      step: 0,
    });
    const y = clamp((event.clientY - rect.top) / Math.max(1, rect.height), {
      minValue: 0,
      maxValue: 1,
      step: 0,
    });
    const xValue = xRange.minValue + x * (xRange.maxValue - xRange.minValue);
    const yValue = yRange.minValue + (1 - y) * (yRange.maxValue - yRange.minValue);
    const next = colorWithChannel(
      colorWithChannel(state.value, props.xChannel, xValue),
      props.yChannel,
      yValue,
    );
    state.setValue(next);
  }

  return {
    colorAreaProps: {
      role: 'group',
      'aria-label': props['aria-label'] ?? 'Color area',
      'aria-disabled': props.isDisabled || undefined,
      onPointerDown(event) {
        if (props.isDisabled) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setDragging(true);
        update(event);
      },
      onPointerMove(event) {
        if (isDragging) update(event);
      },
      onPointerUp(event) {
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        setDragging(false);
      },
      onPointerCancel: () => setDragging(false),
    },
    thumbProps: {
      role: 'presentation',
      style: {
        left: `${(channelValue(state.value, props.xChannel) / channelRange(props.xChannel).maxValue) * 100}%`,
        top: `${100 - (channelValue(state.value, props.yChannel) / channelRange(props.yChannel).maxValue) * 100}%`,
      },
    },
    xInputProps: rangeInputProps(
      props.xChannel,
      state,
      props.xChannelLabel ?? props.xChannel,
      props.isDisabled,
    ),
    yInputProps: rangeInputProps(
      props.yChannel,
      state,
      props.yChannelLabel ?? props.yChannel,
      props.isDisabled,
    ),
    isDragging,
  };
}

export interface AriaColorSliderProps {
  channel: ColorChannel;
  orientation?: 'horizontal' | 'vertical';
  isDisabled?: boolean;
  label?: string;
}

export interface ColorSliderAria {
  labelProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  trackProps: WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>;
  thumbProps: WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>;
  inputProps: WithoutRef<JSX.InputHTMLAttributes<HTMLInputElement>>;
  outputProps: WithoutRef<JSX.OutputHTMLAttributes<HTMLOutputElement>>;
  isDragging: boolean;
}

export function useColorSlider(
  props: AriaColorSliderProps,
  state: ColorState,
  trackRef: RefObject<HTMLElement>,
): ColorSliderAria {
  const [isDragging, setDragging] = useState(false);
  const orientation = props.orientation ?? 'horizontal';
  const range = channelRange(props.channel);
  const value = channelValue(state.value, props.channel);

  function update(event: TargetedPointerEvent<HTMLDivElement>) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || props.isDisabled) return;
    const ratio =
      orientation === 'horizontal'
        ? (event.clientX - rect.left) / Math.max(1, rect.width)
        : 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
    setChannel(state, props.channel, range.minValue + ratio * (range.maxValue - range.minValue));
  }

  return {
    labelProps: { id: `${props.channel}-label` },
    trackProps: {
      role: 'presentation',
      onPointerDown(event) {
        if (props.isDisabled) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setDragging(true);
        update(event);
      },
      onPointerMove(event) {
        if (isDragging) update(event);
      },
      onPointerUp: () => setDragging(false),
      onPointerCancel: () => setDragging(false),
    },
    thumbProps: {
      role: 'presentation',
      style: {
        [orientation === 'horizontal' ? 'left' : 'bottom']:
          `${((value - range.minValue) / (range.maxValue - range.minValue)) * 100}%`,
      },
    },
    inputProps: rangeInputProps(
      props.channel,
      state,
      props.label ?? props.channel,
      props.isDisabled,
    ),
    outputProps: {
      'aria-live': 'off',
    },
    isDragging,
  };
}

export interface AriaColorWheelProps {
  isDisabled?: boolean;
  label?: string;
}

export interface ColorWheelAria {
  trackProps: WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>;
  thumbProps: WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>;
  inputProps: WithoutRef<JSX.InputHTMLAttributes<HTMLInputElement>>;
  isDragging: boolean;
}

export function useColorWheel(
  props: AriaColorWheelProps,
  state: ColorState,
  ref: RefObject<HTMLElement>,
): ColorWheelAria {
  const [isDragging, setDragging] = useState(false);
  const hue = channelValue(state.value, 'hue');

  function update(event: TargetedPointerEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || props.isDisabled) return;
    const angle = Math.atan2(
      event.clientY - (rect.top + rect.height / 2),
      event.clientX - (rect.left + rect.width / 2),
    );
    setChannel(state, 'hue', ((angle * 180) / Math.PI + 450) % 360);
  }

  return {
    trackProps: {
      role: 'presentation',
      onPointerDown(event) {
        if (props.isDisabled) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setDragging(true);
        update(event);
      },
      onPointerMove(event) {
        if (isDragging) update(event);
      },
      onPointerUp: () => setDragging(false),
      onPointerCancel: () => setDragging(false),
    },
    thumbProps: {
      role: 'presentation',
      style: { transform: `rotate(${hue}deg)` },
    },
    inputProps: rangeInputProps('hue', state, props.label ?? 'Hue', props.isDisabled),
    isDragging,
  };
}

export interface AriaColorChannelFieldProps extends AriaFieldProps {
  channel: ColorChannel;
  isDisabled?: boolean;
  isReadOnly?: boolean;
}

export interface ColorFieldAria {
  labelProps: WithoutRef<JSX.LabelHTMLAttributes<HTMLLabelElement>>;
  inputProps: WithoutRef<JSX.InputHTMLAttributes<HTMLInputElement>>;
  descriptionProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  errorMessageProps: WithoutRef<JSX.HTMLAttributes<HTMLElement>>;
  isInvalid: boolean;
}

export function useColorChannelField(
  props: AriaColorChannelFieldProps,
  state: ColorState,
  _ref?: RefObject<HTMLInputElement>,
): ColorFieldAria {
  const field = useField(props);
  const range = channelRange(props.channel);
  const value = channelValue(state.value, props.channel);
  return {
    labelProps: field.labelProps,
    descriptionProps: field.descriptionProps,
    errorMessageProps: field.errorMessageProps,
    inputProps: {
      ...field.fieldProps,
      role: 'spinbutton',
      type: 'number',
      inputMode: 'decimal',
      min: range.minValue,
      max: range.maxValue,
      step: range.step,
      value,
      disabled: props.isDisabled,
      readOnly: props.isReadOnly,
      onInput(event: TargetedEvent<HTMLInputElement, Event>) {
        if (!props.isReadOnly) setChannel(state, props.channel, event.currentTarget.valueAsNumber);
      },
      onKeyDown(event: TargetedKeyboardEvent<HTMLInputElement>) {
        if (props.isDisabled || props.isReadOnly) return;
        if (event.key === 'PageUp' || event.key === 'PageDown') {
          event.preventDefault();
          setChannel(
            state,
            props.channel,
            value + (event.key === 'PageUp' ? 10 : -10) * range.step,
          );
        }
      },
    },
    isInvalid: props.isInvalid || false,
  };
}

function parseHex(value: string): ColorValue | null {
  const match = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(value.trim());
  if (!match) return null;
  let hex = match[1]!;
  if (hex.length <= 4) hex = [...hex].map((character) => character + character).join('');
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const alpha = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return { space: 'rgb', channels: { red, green, blue }, alpha };
}

function colorToHex(color: ColorValue) {
  const channels =
    color.space === 'rgb'
      ? [color.channels.red ?? 0, color.channels.green ?? 0, color.channels.blue ?? 0]
      : color.space === 'hsl'
        ? hslToRgb(
            color.channels.hue ?? 0,
            color.channels.saturation ?? 0,
            color.channels.lightness ?? 0,
          )
        : hsvToRgb(
            color.channels.hue ?? 0,
            color.channels.saturation ?? 0,
            color.channels.brightness ?? 0,
          );
  const hex = channels.map((value) => Math.round(value).toString(16).padStart(2, '0')).join('');
  const alpha = color.alpha ?? 1;
  return `#${hex}${
    alpha < 1
      ? Math.round(alpha * 255)
          .toString(16)
          .padStart(2, '0')
      : ''
  }`;
}

export interface AriaColorFieldProps extends AriaFieldProps {
  isDisabled?: boolean;
  isReadOnly?: boolean;
  placeholder?: string;
}

export function useColorField(
  props: AriaColorFieldProps,
  state: ColorState,
  _ref?: RefObject<HTMLInputElement>,
): ColorFieldAria {
  const field = useField(props);
  const [inputValue, setInputValue] = useState(() => colorToHex(state.value));
  const [isInvalid, setInvalid] = useState(false);
  useEffect(() => setInputValue(colorToHex(state.value)), [state.value]);

  function commit() {
    if (props.isReadOnly || props.isDisabled) return;
    const parsed = parseHex(inputValue);
    setInvalid(!parsed);
    if (parsed) state.setValue(parsed);
  }

  return {
    labelProps: field.labelProps,
    descriptionProps: field.descriptionProps,
    errorMessageProps: field.errorMessageProps,
    inputProps: {
      ...field.fieldProps,
      type: 'text',
      value: inputValue,
      placeholder: props.placeholder ?? '#000000',
      disabled: props.isDisabled,
      readOnly: props.isReadOnly,
      autoComplete: 'off',
      spellcheck: false,
      'aria-invalid': props.isInvalid || isInvalid || undefined,
      onInput(event: TargetedEvent<HTMLInputElement, Event>) {
        setInputValue(event.currentTarget.value);
      },
      onBlur: commit,
      onKeyDown(event: TargetedKeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') commit();
      },
    },
    isInvalid: props.isInvalid || isInvalid,
  };
}

export interface AriaColorSwatchProps {
  color: ColorValue;
  'aria-label'?: string;
}

export interface ColorSwatchAria {
  colorSwatchProps: WithoutRef<JSX.HTMLAttributes<HTMLDivElement>>;
}

export function useColorSwatch(props: AriaColorSwatchProps): ColorSwatchAria {
  return {
    colorSwatchProps: {
      role: 'img',
      'aria-label': props['aria-label'] ?? colorLabel(props.color),
      style: { backgroundColor: colorToCSS(props.color) },
    },
  };
}
