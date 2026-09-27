import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../src';
import { Slider } from '../src/components';

describe('Slider', () => {
  it('supports keyboard changes, bounds, steps, and change-end events', async () => {
    const onChange = vi.fn();
    const onChangeEnd = vi.fn();
    const user = userEvent.setup();
    render(
      <Slider
        defaultValue={25}
        label="Volume"
        maxValue={100}
        minValue={0}
        name="volume"
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        step={5}
      />,
    );
    const slider = screen.getByRole('slider', { name: 'Volume' });
    expect(slider).toHaveValue('25');
    expect(slider).toHaveAttribute('aria-valuetext', '25');
    expect(slider).toHaveAttribute('name', 'volume');
    const thumb = slider.closest<HTMLElement>('[data-slider-thumb]')!;
    expect(thumb.style.getPropertyValue('--slider-thumb-percent')).toBe('25%');
    expect(thumb.style.left).toBe('25%');

    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveValue('30');
    expect(onChange).toHaveBeenLastCalledWith(30);
    expect(onChangeEnd).toHaveBeenLastCalledWith(30);

    await user.keyboard('{End}');
    expect(slider).toHaveValue('100');
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it('keeps range thumbs ordered and gives each one an accessible name', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Slider
        defaultValue={[20, 80]}
        formatOptions={{ style: 'currency', currency: 'EUR' }}
        label="Price"
        minValue={0}
        maxValue={100}
        onChange={onChange}
        step={10}
      />,
    );
    const minimum = screen.getByRole('slider', { name: 'Minimum Price' });
    const maximum = screen.getByRole('slider', { name: 'Maximum Price' });
    expect(minimum).toHaveAttribute('max', '80');
    expect(maximum).toHaveAttribute('min', '20');
    expect(screen.getByText(/€20\.00.*€80\.00/)).toBeInTheDocument();

    minimum.focus();
    await user.keyboard('{End}');
    expect(minimum).toHaveValue('80');
    expect(onChange).toHaveBeenLastCalledWith([80, 80]);

    await user.keyboard('{ArrowRight}');
    expect(minimum).toHaveValue('80');
  });

  it('reverses horizontal arrow keys in RTL locales', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="ar-EG">
        <Slider defaultValue={50} label="Brightness" step={10} />
      </I18nProvider>,
    );
    const slider = screen.getByRole('slider', { name: 'Brightness' });
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveValue('40');
  });
});
