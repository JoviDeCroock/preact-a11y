import { fireEvent, render, screen } from '@testing-library/preact';
import { useRef, useState } from 'preact/hooks';
import { describe, expect, it } from 'vitest';
import {
  colorToCSS,
  useColorArea,
  useColorChannelField,
  useColorField,
  useColorSlider,
  useColorSwatch,
  useColorWheel,
  type ColorState,
  type ColorValue,
} from '../src';

const rect = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 100,
  bottom: 100,
  width: 100,
  height: 100,
  toJSON: () => ({}),
};

function ColorFixture() {
  const [value, setValue] = useState<ColorValue>({
    space: 'hsv',
    channels: { hue: 120, saturation: 50, brightness: 50 },
  });
  const state: ColorState = { value, setValue };
  const areaRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const area = useColorArea(
    {
      xChannel: 'saturation',
      yChannel: 'brightness',
      xChannelLabel: 'Saturation area',
      yChannelLabel: 'Brightness area',
    },
    state,
    areaRef,
  );
  const slider = useColorSlider({ channel: 'hue', label: 'Hue slider' }, state, sliderRef);
  const wheel = useColorWheel({ label: 'Hue wheel' }, state, wheelRef);
  const channel = useColorChannelField(
    { channel: 'brightness', label: 'Brightness' },
    state,
    inputRef,
  );
  const field = useColorField({ label: 'Hex color' }, state, inputRef);
  const swatch = useColorSwatch({ color: value, 'aria-label': 'Current color' });
  return (
    <>
      <div {...area.colorAreaProps} data-testid="area" ref={areaRef}>
        <div {...area.thumbProps} />
        <input {...area.xInputProps} />
        <input {...area.yInputProps} />
      </div>
      <span {...slider.labelProps}>Hue</span>
      <div {...slider.trackProps} data-testid="track" ref={sliderRef}>
        <div {...slider.thumbProps} />
        <input {...slider.inputProps} />
      </div>
      <div {...wheel.trackProps} data-testid="wheel" ref={wheelRef}>
        <div {...wheel.thumbProps} />
        <input {...wheel.inputProps} />
      </div>
      <label {...channel.labelProps}>Brightness</label>
      <input {...channel.inputProps} data-testid="brightness" ref={inputRef} />
      <label {...field.labelProps}>Hex color</label>
      <input {...field.inputProps} data-testid="hex" />
      <div {...swatch.colorSwatchProps} />
      <output data-testid="value">
        {Math.round(value.channels.hue ?? 0)}:{Math.round(value.channels.saturation ?? 0)}:
        {Math.round(value.channels.brightness ?? 0)}
      </output>
    </>
  );
}

describe('color primitives', () => {
  it('updates channels from sliders, fields, areas, and wheels', () => {
    render(<ColorFixture />);
    const area = screen.getByTestId('area');
    const track = screen.getByTestId('track');
    const wheel = screen.getByTestId('wheel');
    area.getBoundingClientRect = () => rect;
    track.getBoundingClientRect = () => rect;
    wheel.getBoundingClientRect = () => rect;

    fireEvent.pointerDown(area, { clientX: 25, clientY: 25, pointerId: 1 });
    expect(screen.getByTestId('value')).toHaveTextContent('120:25:75');

    fireEvent.pointerDown(track, { clientX: 50, clientY: 0, pointerId: 2 });
    expect(screen.getByTestId('value')).toHaveTextContent('180:25:75');

    fireEvent.pointerDown(wheel, { clientX: 100, clientY: 50, pointerId: 3 });
    expect(screen.getByTestId('value')).toHaveTextContent('90:25:75');

    const brightness = screen.getByTestId('brightness');
    fireEvent.keyDown(brightness, { key: 'PageDown' });
    expect(screen.getByTestId('value')).toHaveTextContent('90:25:65');
  });

  it('parses hex colors, reports invalid input, and exposes a labeled swatch', () => {
    render(<ColorFixture />);
    const input = screen.getByTestId('hex');
    fireEvent.input(input, { target: { value: 'invalid' } });
    fireEvent.blur(input);
    expect(input).toHaveAttribute('aria-invalid', 'true');

    fireEvent.input(input, { target: { value: '#ff000080' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('img', { name: 'Current color' })).toHaveStyle({
      backgroundColor: 'rgba(255, 0, 0, 0.502)',
    });
  });

  it('serializes RGB, HSL, and HSV colors to CSS', () => {
    expect(colorToCSS({ space: 'rgb', channels: { red: 1, green: 2, blue: 3 } })).toBe(
      'rgb(1 2 3 / 1)',
    );
    expect(colorToCSS({ space: 'hsl', channels: { hue: 20, saturation: 50, lightness: 40 } })).toBe(
      'hsl(20 50% 40% / 1)',
    );
    expect(
      colorToCSS({ space: 'hsv', channels: { hue: 0, saturation: 100, brightness: 100 } }),
    ).toBe('rgb(255 0 0 / 1)');
  });
});
