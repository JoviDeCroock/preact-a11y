import type { RefObject } from 'preact';

export type CollectionKey = string | number;
export type Orientation = 'horizontal' | 'vertical';
export type Direction = 'ltr' | 'rtl';

export interface CollectionNode<T = unknown> {
  key: CollectionKey;
  type?: 'item' | 'section';
  textValue?: string;
  value?: T;
  props?: { isDisabled?: boolean; disabledBehavior?: 'all' | 'selection' };
}

export interface CollectionLike<T = unknown> extends Iterable<CollectionNode<T>> {
  getItem(key: CollectionKey): CollectionNode<T> | undefined;
  getKeyAfter(key: CollectionKey): CollectionKey | null;
  getKeyBefore(key: CollectionKey): CollectionKey | null;
  getFirstKey(): CollectionKey | null;
  getLastKey(): CollectionKey | null;
}

export interface ListKeyboardDelegateOptions<T> {
  collection: CollectionLike<T>;
  ref: RefObject<HTMLElement>;
  collator?: Intl.Collator;
  layout?: 'stack' | 'grid';
  orientation?: Orientation;
  direction?: Direction;
  disabledKeys?: Set<CollectionKey>;
  disabledBehavior?: 'all' | 'selection';
}

function itemElement(ref: RefObject<HTMLElement>, key: CollectionKey) {
  return [...(ref.current?.querySelectorAll<HTMLElement>('[data-key]') ?? [])].find(
    (element) => element.dataset.key === String(key),
  );
}

/** DOM-aware keyboard navigation for stack and grid collections. */
export class ListKeyboardDelegate<T = unknown> {
  private collection: CollectionLike<T>;
  private ref: RefObject<HTMLElement>;
  private collator?: Intl.Collator;
  private layout: 'stack' | 'grid';
  private orientation: Orientation;
  private direction: Direction;
  private disabledKeys: Set<CollectionKey>;
  private disabledBehavior: 'all' | 'selection';

  constructor(options: ListKeyboardDelegateOptions<T>);
  constructor(
    collection: CollectionLike<T>,
    disabledKeys: Set<CollectionKey>,
    ref: RefObject<HTMLElement>,
    collator?: Intl.Collator,
  );
  constructor(
    optionsOrCollection: ListKeyboardDelegateOptions<T> | CollectionLike<T>,
    disabledKeys = new Set<CollectionKey>(),
    ref?: RefObject<HTMLElement>,
    collator?: Intl.Collator,
  ) {
    if ('collection' in optionsOrCollection) {
      const options = optionsOrCollection;
      this.collection = options.collection;
      this.ref = options.ref;
      this.collator = options.collator;
      this.layout = options.layout ?? 'stack';
      this.orientation = options.orientation ?? 'vertical';
      this.direction = options.direction ?? 'ltr';
      this.disabledKeys = options.disabledKeys ?? new Set();
      this.disabledBehavior = options.disabledBehavior ?? 'all';
    } else {
      this.collection = optionsOrCollection;
      this.ref = ref!;
      this.collator = collator;
      this.layout = 'stack';
      this.orientation = 'vertical';
      this.direction = 'ltr';
      this.disabledKeys = disabledKeys;
      this.disabledBehavior = 'all';
    }
  }

  private isDisabled(key: CollectionKey) {
    const item = this.collection.getItem(key);
    return (
      this.disabledBehavior === 'all' &&
      (this.disabledKeys.has(key) || item?.props?.isDisabled === true) &&
      item?.props?.disabledBehavior !== 'selection'
    );
  }

  private find(
    key: CollectionKey | null,
    next: (key: CollectionKey) => CollectionKey | null,
    includeDisabled = false,
  ): CollectionKey | null {
    let current = key;
    while (current != null) {
      const item = this.collection.getItem(current);
      if (item?.type !== 'section' && (includeDisabled || !this.isDisabled(current)))
        return current;
      current = next(current);
    }
    return null;
  }

  getNextKey(key: CollectionKey, options: { includeDisabled?: boolean } = {}) {
    return this.find(
      this.collection.getKeyAfter(key),
      (current) => this.collection.getKeyAfter(current),
      options.includeDisabled,
    );
  }

  getPreviousKey(key: CollectionKey, options: { includeDisabled?: boolean } = {}) {
    return this.find(
      this.collection.getKeyBefore(key),
      (current) => this.collection.getKeyBefore(current),
      options.includeDisabled,
    );
  }

  private spatialKey(key: CollectionKey, axis: 'x' | 'y', direction: -1 | 1) {
    const current = itemElement(this.ref, key)?.getBoundingClientRect();
    if (!current) return direction > 0 ? this.getNextKey(key) : this.getPreviousKey(key);
    const crossAxis = axis === 'x' ? 'y' : 'x';
    const currentCenter = current[axis] + current[axis === 'x' ? 'width' : 'height'] / 2;
    const currentCross = current[crossAxis] + current[crossAxis === 'x' ? 'width' : 'height'] / 2;
    let best: { key: CollectionKey; distance: number; crossDistance: number } | undefined;
    for (const item of this.collection) {
      if (item.type === 'section' || this.isDisabled(item.key) || item.key === key) continue;
      const rect = itemElement(this.ref, item.key)?.getBoundingClientRect();
      if (!rect) continue;
      const center = rect[axis] + rect[axis === 'x' ? 'width' : 'height'] / 2;
      const distance = (center - currentCenter) * direction;
      if (distance <= 0) continue;
      const cross = rect[crossAxis] + rect[crossAxis === 'x' ? 'width' : 'height'] / 2;
      const candidate = { key: item.key, distance, crossDistance: Math.abs(cross - currentCross) };
      if (
        !best ||
        candidate.crossDistance < best.crossDistance ||
        (candidate.crossDistance === best.crossDistance && candidate.distance < best.distance)
      ) {
        best = candidate;
      }
    }
    return best?.key ?? null;
  }

  getKeyBelow(key: CollectionKey, options: { includeDisabled?: boolean } = {}) {
    if (options.includeDisabled || this.layout === 'stack') return this.getNextKey(key, options);
    return this.spatialKey(key, 'y', 1);
  }

  getKeyAbove(key: CollectionKey, options: { includeDisabled?: boolean } = {}) {
    if (options.includeDisabled || this.layout === 'stack')
      return this.getPreviousKey(key, options);
    return this.spatialKey(key, 'y', -1);
  }

  getKeyRightOf(key: CollectionKey, options: { includeDisabled?: boolean } = {}) {
    if (this.layout === 'stack' && this.orientation === 'vertical') return null;
    if (options.includeDisabled || this.layout === 'stack')
      return this.direction === 'rtl'
        ? this.getPreviousKey(key, options)
        : this.getNextKey(key, options);
    return this.spatialKey(key, 'x', this.direction === 'rtl' ? -1 : 1);
  }

  getKeyLeftOf(key: CollectionKey, options: { includeDisabled?: boolean } = {}) {
    if (this.layout === 'stack' && this.orientation === 'vertical') return null;
    if (options.includeDisabled || this.layout === 'stack')
      return this.direction === 'rtl'
        ? this.getNextKey(key, options)
        : this.getPreviousKey(key, options);
    return this.spatialKey(key, 'x', this.direction === 'rtl' ? 1 : -1);
  }

  getFirstKey() {
    return this.find(this.collection.getFirstKey(), (key) => this.collection.getKeyAfter(key));
  }

  getLastKey() {
    return this.find(this.collection.getLastKey(), (key) => this.collection.getKeyBefore(key));
  }

  getKeyPageAbove(key: CollectionKey) {
    const container = this.ref.current;
    const current = itemElement(this.ref, key)?.getBoundingClientRect();
    if (!container || !current) return this.getFirstKey();
    const boundary =
      this.orientation === 'horizontal'
        ? current.left - container.clientWidth
        : current.top - container.clientHeight;
    let result: CollectionKey = key;
    let candidate = this.getKeyAbove(result);
    while (candidate != null) {
      const rect = itemElement(this.ref, candidate)?.getBoundingClientRect();
      if (!rect || (this.orientation === 'horizontal' ? rect.left : rect.top) < boundary) break;
      result = candidate;
      candidate = this.getKeyAbove(result);
    }
    return result === key ? (this.getFirstKey() ?? key) : result;
  }

  getKeyPageBelow(key: CollectionKey) {
    const container = this.ref.current;
    const current = itemElement(this.ref, key)?.getBoundingClientRect();
    if (!container || !current) return this.getLastKey();
    const boundary =
      this.orientation === 'horizontal'
        ? current.right + container.clientWidth
        : current.bottom + container.clientHeight;
    let result: CollectionKey = key;
    let candidate = this.getKeyBelow(result);
    while (candidate != null) {
      const rect = itemElement(this.ref, candidate)?.getBoundingClientRect();
      if (!rect || (this.orientation === 'horizontal' ? rect.right : rect.bottom) > boundary) break;
      result = candidate;
      candidate = this.getKeyBelow(result);
    }
    return result === key ? (this.getLastKey() ?? key) : result;
  }

  getKeyForSearch(search: string, fromKey?: CollectionKey) {
    if (!this.collator || !search) return null;
    let key = fromKey ? this.getNextKey(fromKey) : this.getFirstKey();
    while (key != null) {
      const text = this.collection.getItem(key)?.textValue ?? '';
      if (this.collator.compare(text.slice(0, search.length), search) === 0) return key;
      key = this.getNextKey(key);
    }
    return null;
  }
}

export interface DropTarget {
  type: 'root' | 'item';
  key?: CollectionKey;
  dropPosition?: 'before' | 'on' | 'after';
}

export interface ListDropTargetDelegateOptions {
  layout?: 'stack' | 'grid';
  orientation?: Orientation;
  direction?: Direction;
}

/** Maps pointer coordinates to on/before/after targets in a DOM-backed list or grid. */
export class ListDropTargetDelegate {
  private collection: Iterable<CollectionNode>;
  private ref: RefObject<HTMLElement>;
  private layout: 'stack' | 'grid';
  private orientation: Orientation;
  private direction: Direction;

  constructor(
    collection: Iterable<CollectionNode>,
    ref: RefObject<HTMLElement>,
    options: ListDropTargetDelegateOptions = {},
  ) {
    this.collection = collection;
    this.ref = ref;
    this.layout = options.layout ?? 'stack';
    this.orientation = options.orientation ?? 'vertical';
    this.direction = options.direction ?? 'ltr';
  }

  getDropTargetFromPoint(
    x: number,
    y: number,
    isValidDropTarget: (target: DropTarget) => boolean,
  ): DropTarget {
    const root = this.ref.current;
    const items = [...this.collection].filter((item) => item.type !== 'section');
    if (!root || !items.length) return { type: 'root' };
    const elements = new Map<CollectionKey, HTMLElement>();
    for (const element of root.querySelectorAll<HTMLElement>('[data-key]')) {
      const item = items.find(({ key }) => String(key) === element.dataset.key);
      if (item) elements.set(item.key, element);
    }

    const primaryPoint = this.orientation === 'horizontal' ? x : y;
    const flowPoint =
      this.layout === 'stack' ? primaryPoint : this.orientation === 'horizontal' ? y : x;
    const isFlowRTL =
      this.direction === 'rtl' &&
      ((this.layout === 'stack' && this.orientation === 'horizontal') ||
        (this.layout === 'grid' && this.orientation === 'vertical'));

    for (const item of items) {
      const rect = elements.get(item.key)?.getBoundingClientRect();
      if (!rect || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue;
      const flowStart =
        this.layout === 'stack'
          ? this.orientation === 'horizontal'
            ? rect.left
            : rect.top
          : this.orientation === 'horizontal'
            ? rect.top
            : rect.left;
      const flowEnd =
        this.layout === 'stack'
          ? this.orientation === 'horizontal'
            ? rect.right
            : rect.bottom
          : this.orientation === 'horizontal'
            ? rect.bottom
            : rect.right;
      const on: DropTarget = { type: 'item', key: item.key, dropPosition: 'on' };
      const before = { ...on, dropPosition: isFlowRTL ? 'after' : 'before' } as DropTarget;
      const after = { ...on, dropPosition: isFlowRTL ? 'before' : 'after' } as DropTarget;
      if (isValidDropTarget(on)) {
        if (flowPoint <= flowStart + 5 && isValidDropTarget(before)) return before;
        if (flowPoint >= flowEnd - 5 && isValidDropTarget(after)) return after;
        return on;
      }
      const midpoint = flowStart + (flowEnd - flowStart) / 2;
      if (flowPoint <= midpoint && isValidDropTarget(before)) return before;
      if (isValidDropTarget(after)) return after;
      return { type: 'root' };
    }

    const positioned = items
      .map((item) => ({ item, rect: elements.get(item.key)?.getBoundingClientRect() }))
      .filter((entry): entry is { item: CollectionNode; rect: DOMRect } => Boolean(entry.rect));
    if (!positioned.length) return { type: 'root' };
    const first = positioned[0]!;
    const last = positioned.at(-1)!;
    const firstStart = this.orientation === 'horizontal' ? first.rect.left : first.rect.top;
    const target = primaryPoint < firstStart ? first.item : last.item;
    return {
      type: 'item',
      key: target.key,
      dropPosition:
        primaryPoint < firstStart
          ? isFlowRTL
            ? 'after'
            : 'before'
          : isFlowRTL
            ? 'before'
            : 'after',
    };
  }
}
