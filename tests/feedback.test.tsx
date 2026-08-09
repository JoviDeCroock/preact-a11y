import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { Meter, ProgressBar, Separator } from '../src/components';

describe('feedback primitives', () => {
  it('exposes normalized progress values and an accessible label', () => {
    render(<ProgressBar label="Uploading" maxValue={200} value={250} />);
    const progress = screen.getByRole('progressbar', { name: 'Uploading' });

    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '200');
    expect(progress).toHaveAttribute('aria-valuenow', '200');
    expect(progress).toHaveAttribute('aria-valuetext', '100%');
  });

  it('omits values for indeterminate progress', () => {
    render(<ProgressBar aria-label="Loading" isIndeterminate />);
    const progress = screen.getByRole('progressbar', { name: 'Loading' });

    expect(progress).not.toHaveAttribute('aria-valuenow');
    expect(progress).not.toHaveAttribute('aria-valuetext');
  });

  it('provides meter and separator semantics', () => {
    render(
      <>
        <Meter label="Storage used" maxValue={1000} value={250} valueLabel="250 MB" />
        <Separator orientation="vertical" />
      </>,
    );

    const meter = screen.getByRole('meter', { name: 'Storage used' });
    expect(meter).toHaveAttribute('aria-valuenow', '250');
    expect(meter).toHaveAttribute('aria-valuetext', '250 MB');
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });
});
