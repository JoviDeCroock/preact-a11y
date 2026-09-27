import { render, screen } from '@testing-library/preact';
import { useEffect } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import { SSRProvider, chain, mergeProps, useId, useIsSSR, useObjectRef } from '../src';

function Ids() {
  return (
    <output data-custom={useId('custom-id')} data-generated={useId()}>
      IDs
    </output>
  );
}

describe('framework utilities', () => {
  it('chains callbacks in order with shared arguments', () => {
    const calls: string[] = [];
    const callback = chain<[string]>(
      (value) => calls.push(`first:${value}`),
      undefined,
      (value) => calls.push(`second:${value}`),
    );

    callback('value');
    expect(calls).toEqual(['first:value', 'second:value']);
  });

  it('merges lowercase DOM event handlers instead of replacing them', () => {
    for (const key of ['oncompositionstart', 'oncompositionend', 'onfocusin', 'onpointerenter']) {
      const calls: string[] = [];
      const merged = mergeProps<Record<string, unknown>>(
        { [key]: () => calls.push('first') },
        { [key]: () => calls.push('second') },
      );
      (merged[key] as () => void)();
      expect(calls).toEqual(['first', 'second']);
    }
  });

  it('provides stable generated and caller-defined ids', () => {
    const { rerender } = render(<Ids />);
    const output = screen.getByRole('status');
    const generated = output.getAttribute('data-generated');
    rerender(<Ids />);

    expect(output).toHaveAttribute('data-custom', 'custom-id');
    expect(generated).toMatch(/^preact-a11y-/);
    expect(output).toHaveAttribute('data-generated', generated);
  });

  it('synchronizes Preact object and callback refs', () => {
    const callbackRef = vi.fn();
    function RefTarget() {
      const objectRef = useObjectRef<HTMLButtonElement>(callbackRef);
      return <button ref={objectRef}>Ref target</button>;
    }
    const { unmount } = render(<RefTarget />);
    const button = screen.getByRole('button', { name: 'Ref target' });
    expect(callbackRef).toHaveBeenCalledWith(button);
    unmount();
    expect(callbackRef).toHaveBeenLastCalledWith(null);
  });

  it('reports the initial SSR-compatible pass before hydration effects', () => {
    const values: boolean[] = [];
    function Probe() {
      const isSSR = useIsSSR();
      values.push(isSSR);
      return <output>{String(isSSR)}</output>;
    }
    render(
      <SSRProvider>
        <Probe />
      </SSRProvider>,
    );

    expect(values[0]).toBe(true);
    expect(values.at(-1)).toBe(false);
  });
});

describe('test environment', () => {
  let mounted = false;
  let cleaned = false;
  function Effect() {
    useEffect(
      () => () => {
        cleaned = true;
      },
      [],
    );
    return null;
  }

  it('mounts a component with a passive effect', () => {
    render(<Effect />);
    mounted = true;
  });

  it('runs its unmount cleanup before the next test starts', () => {
    // Preact 11 defers it until after paint; tests/setup.ts flushes it inside act().
    expect(cleaned).toBe(mounted);
  });
});
