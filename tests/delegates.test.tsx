import { render } from '@testing-library/preact';
import { createRef } from 'preact';
import { describe, expect, it } from 'vitest';
import {
  ListDropTargetDelegate,
  ListKeyboardDelegate,
  type CollectionKey,
  type CollectionLike,
  type CollectionNode,
} from '../src';

class TestCollection implements CollectionLike<string> {
  constructor(private nodes: CollectionNode<string>[]) {}

  *[Symbol.iterator]() {
    yield* this.nodes;
  }

  getItem(key: CollectionKey) {
    return this.nodes.find((item) => item.key === key);
  }

  getKeyAfter(key: CollectionKey) {
    const index = this.nodes.findIndex((item) => item.key === key);
    return this.nodes[index + 1]?.key ?? null;
  }

  getKeyBefore(key: CollectionKey) {
    const index = this.nodes.findIndex((item) => item.key === key);
    return this.nodes[index - 1]?.key ?? null;
  }

  getFirstKey() {
    return this.nodes[0]?.key ?? null;
  }

  getLastKey() {
    return this.nodes.at(-1)?.key ?? null;
  }
}

function rect(x: number, y: number, width = 100, height = 30): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({}),
  };
}

const validTarget = () => true;

function CollectionDOM({
  elementRef,
}: {
  elementRef: ReturnType<typeof createRef<HTMLDivElement>>;
}) {
  return (
    <div ref={elementRef}>
      <div data-key="alpha">Alpha</div>
      <div data-key="bravo">Bravo</div>
      <div data-key="charlie">Charlie</div>
      <div data-key="delta">Delta</div>
    </div>
  );
}

describe('collection delegates', () => {
  it('navigates, skips disabled items, handles RTL, and performs collated search', () => {
    const collection = new TestCollection([
      { key: 'alpha', type: 'item', textValue: 'Alpha' },
      { key: 'bravo', type: 'item', textValue: 'Bravo', props: { isDisabled: true } },
      { key: 'charlie', type: 'item', textValue: 'Charlie' },
    ]);
    const ref = createRef<HTMLDivElement>();
    render(<CollectionDOM elementRef={ref} />);
    const delegate = new ListKeyboardDelegate({
      collection,
      ref,
      collator: new Intl.Collator('en', { sensitivity: 'base' }),
    });

    expect(delegate.getNextKey('alpha')).toBe('charlie');
    expect(delegate.getPreviousKey('charlie')).toBe('alpha');
    expect(delegate.getNextKey('alpha', { includeDisabled: true })).toBe('bravo');
    expect(delegate.getFirstKey()).toBe('alpha');
    expect(delegate.getLastKey()).toBe('charlie');
    expect(delegate.getKeyForSearch('ch')).toBe('charlie');

    const rtl = new ListKeyboardDelegate({
      collection,
      ref,
      direction: 'rtl',
      orientation: 'horizontal',
    });
    expect(rtl.getKeyRightOf('charlie')).toBe('alpha');
    expect(rtl.getKeyLeftOf('alpha')).toBe('charlie');
  });

  it('uses DOM geometry for two-dimensional grid navigation', () => {
    const collection = new TestCollection([
      { key: 'alpha', type: 'item' },
      { key: 'bravo', type: 'item' },
      { key: 'charlie', type: 'item' },
      { key: 'delta', type: 'item' },
    ]);
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<CollectionDOM elementRef={ref} />);
    const elements = [...container.querySelectorAll<HTMLElement>('[data-key]')];
    const rectangles = [rect(0, 0), rect(120, 0), rect(0, 40), rect(120, 40)];
    elements.forEach((element, index) => {
      element.getBoundingClientRect = () => rectangles[index]!;
    });
    const delegate = new ListKeyboardDelegate({ collection, ref, layout: 'grid' });

    expect(delegate.getKeyRightOf('alpha')).toBe('bravo');
    expect(delegate.getKeyBelow('alpha')).toBe('charlie');
    expect(delegate.getKeyLeftOf('delta')).toBe('charlie');
    expect(delegate.getKeyAbove('delta')).toBe('bravo');
  });

  it('maps pointer positions to before, on, after, and root targets', () => {
    const collection = new TestCollection([
      { key: 'alpha', type: 'item' },
      { key: 'bravo', type: 'item' },
    ]);
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<CollectionDOM elementRef={ref} />);
    const [alpha, bravo] = [...container.querySelectorAll<HTMLElement>('[data-key]')];
    alpha!.getBoundingClientRect = () => rect(0, 0);
    bravo!.getBoundingClientRect = () => rect(0, 40);
    const delegate = new ListDropTargetDelegate(collection, ref);

    expect(delegate.getDropTargetFromPoint(20, 2, validTarget)).toEqual({
      type: 'item',
      key: 'alpha',
      dropPosition: 'before',
    });
    expect(delegate.getDropTargetFromPoint(20, 15, validTarget)).toEqual({
      type: 'item',
      key: 'alpha',
      dropPosition: 'on',
    });
    expect(delegate.getDropTargetFromPoint(20, 29, validTarget)).toEqual({
      type: 'item',
      key: 'alpha',
      dropPosition: 'after',
    });
    expect(
      delegate.getDropTargetFromPoint(20, 10, (target) => target.dropPosition !== 'on'),
    ).toEqual({ type: 'item', key: 'alpha', dropPosition: 'before' });
    expect(delegate.getDropTargetFromPoint(20, 100, validTarget)).toEqual({
      type: 'item',
      key: 'bravo',
      dropPosition: 'after',
    });

    const empty = new ListDropTargetDelegate(new TestCollection([]), ref);
    expect(empty.getDropTargetFromPoint(0, 0, validTarget)).toEqual({ type: 'root' });
  });
});
