import { cloneElement, Fragment, toChildArray } from 'preact';
import type { ComponentChildren, Ref, VNode } from 'preact';
import { useMemo } from 'preact/hooks';
import type { CollectionKey, CollectionLike } from './delegates';

export interface BuiltCollectionNode<Value = unknown> {
  type: string;
  key: CollectionKey;
  value: Value | null;
  level: number;
  index: number;
  textValue: string;
  rendered: ComponentChildren;
  parentKey: CollectionKey | null;
  prevKey: CollectionKey | null;
  nextKey: CollectionKey | null;
  firstChildKey: CollectionKey | null;
  lastChildKey: CollectionKey | null;
  props: Record<string, unknown>;
  childNodes: Iterable<BuiltCollectionNode<Value>>;
  render?: (node: BuiltCollectionNode<Value>) => ComponentChildren;
}

export class BuiltCollection<Value = unknown>
  implements CollectionLike<Value>, Iterable<BuiltCollectionNode<Value>>
{
  readonly #nodes: BuiltCollectionNode<Value>[];
  readonly #map: Map<CollectionKey, BuiltCollectionNode<Value>>;
  readonly #indices: Map<CollectionKey, number>;

  constructor(nodes: BuiltCollectionNode<Value>[] = []) {
    this.#nodes = nodes;
    this.#map = new Map(nodes.map((node) => [node.key, node]));
    this.#indices = new Map(nodes.map((node, index) => [node.key, index]));
  }

  get size() {
    return this.#nodes.length;
  }

  [Symbol.iterator]() {
    return this.#nodes[Symbol.iterator]();
  }

  getKeys() {
    return this.#map.keys();
  }

  getItem(key: CollectionKey) {
    return this.#map.get(key);
  }

  at(index: number) {
    return this.#nodes.at(index);
  }

  getKeyBefore(key: CollectionKey) {
    const index = this.#indices.get(key);
    return index == null ? null : (this.#nodes[index - 1]?.key ?? null);
  }

  getKeyAfter(key: CollectionKey) {
    const index = this.#indices.get(key);
    return index == null ? null : (this.#nodes[index + 1]?.key ?? null);
  }

  getFirstKey() {
    return this.#nodes[0]?.key ?? null;
  }

  getLastKey() {
    return this.#nodes.at(-1)?.key ?? null;
  }

  getChildren(key: CollectionKey) {
    return this.#map.get(key)?.childNodes ?? [];
  }

  getTextValue(key: CollectionKey) {
    return this.#map.get(key)?.textValue ?? '';
  }

  filter(predicate: (textValue: string, node: BuiltCollectionNode<Value>) => boolean) {
    return new BuiltCollection(this.#nodes.filter((node) => predicate(node.textValue, node)));
  }
}

export interface CollectionNodeClass {
  new (key: CollectionKey): object;
  readonly type: string;
}

interface CollectionMetadata<Props extends object = Record<string, unknown>> {
  type: string;
  isBranch: boolean;
  render: (
    props: Props,
    ref: Ref<Element> | undefined,
    node: BuiltCollectionNode,
  ) => ComponentChildren;
  useChildren?: (props: Props) => ComponentChildren;
}

const collectionMetadata = Symbol('preact-a11y collection metadata');

type CollectionComponent<Props extends object> = ((props: Props) => VNode | null) & {
  [collectionMetadata]?: CollectionMetadata<Props>;
};

function nodeType(nodeClass: CollectionNodeClass | string): string {
  return typeof nodeClass === 'string' ? nodeClass : nodeClass.type;
}

function textValue(children: ComponentChildren): string {
  return toChildArray(children)
    .map((child) => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''))
    .join('')
    .trim();
}

function isVNode(value: ComponentChildren): value is VNode<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && 'type' in value && 'props' in value;
}

function buildCollection<Value>(content: ComponentChildren): BuiltCollection<Value> {
  const flattened: BuiltCollectionNode<Value>[] = [];

  function visit(
    children: ComponentChildren,
    parent: BuiltCollectionNode<Value> | null,
    level: number,
    path: string,
  ) {
    const direct: BuiltCollectionNode<Value>[] = [];
    toChildArray(children).forEach((child, index) => {
      if (!isVNode(child)) return;
      if (child.type === Fragment) {
        visit(child.props.children as ComponentChildren, parent, level, `${path}-${index}`);
        return;
      }
      if (child.type === Collection) {
        visit(
          renderCollection(child.props as CollectionProps<Value>),
          parent,
          level,
          `${path}-${index}`,
        );
        return;
      }
      const component = child.type as CollectionComponent<Record<string, unknown>>;
      const metadata = component[collectionMetadata];
      if (!metadata) {
        visit(child.props.children as ComponentChildren, parent, level, `${path}-${index}`);
        return;
      }

      const props = child.props as Record<string, unknown>;
      const key = (props.id as CollectionKey | undefined) ?? child.key ?? `${path}-${index}`;
      const node: BuiltCollectionNode<Value> = {
        type: metadata.type,
        key,
        value: (props.value as Value | undefined) ?? null,
        level,
        index: flattened.length,
        textValue:
          (props.textValue as string | undefined) ?? textValue(props.children as ComponentChildren),
        rendered: props.children as ComponentChildren,
        parentKey: parent?.key ?? null,
        prevKey: null,
        nextKey: null,
        firstChildKey: null,
        lastChildKey: null,
        props,
        childNodes: [],
      };
      node.render = () =>
        metadata.render(
          props,
          props.elementRef as Ref<Element> | undefined,
          node as BuiltCollectionNode<unknown>,
        );
      flattened.push(node);
      direct.push(node);

      if (metadata.isBranch) {
        const branchChildren = metadata.useChildren?.(props) ?? props.children;
        const start = flattened.length;
        visit(branchChildren as ComponentChildren, node, level + 1, `${path}-${index}`);
        const descendants = flattened
          .slice(start)
          .filter((candidate) => candidate.parentKey === key);
        node.childNodes = descendants;
        node.firstChildKey = descendants[0]?.key ?? null;
        node.lastChildKey = descendants.at(-1)?.key ?? null;
      }
    });
    for (let index = 0; index < direct.length; index++) {
      direct[index]!.prevKey = direct[index - 1]?.key ?? null;
      direct[index]!.nextKey = direct[index + 1]?.key ?? null;
    }
  }

  visit(content, null, 0, 'item');
  return new BuiltCollection(flattened);
}

export interface CollectionBuilderProps<CollectionType extends BuiltCollection<unknown>> {
  content: ComponentChildren;
  children: (collection: CollectionType) => ComponentChildren;
  createCollection?: () => CollectionType;
}

/** Builds an immutable collection snapshot from Preact-native leaf and branch components. */
export function CollectionBuilder<CollectionType extends BuiltCollection<unknown>>(
  props: CollectionBuilderProps<CollectionType>,
) {
  const collection = useMemo(() => {
    const built = buildCollection(props.content);
    if (!props.createCollection) return built as CollectionType;
    const custom = props.createCollection();
    const mutable = custom as CollectionType & {
      addNode?: (node: BuiltCollectionNode) => void;
      commit?: (first: CollectionKey | null, last: CollectionKey | null) => void;
    };
    if (mutable.addNode) {
      for (const node of built) mutable.addNode(node);
      mutable.commit?.(built.getFirstKey(), built.getLastKey());
      return mutable;
    }
    return built as CollectionType;
  }, [props.content, props.createCollection]);
  return <Fragment>{props.children(collection)}</Fragment>;
}

export interface CollectionProps<Value> {
  items?: Iterable<Value>;
  children?: ComponentChildren | ((item: Value) => ComponentChildren);
  dependencies?: readonly unknown[];
  idScope?: CollectionKey;
  addIdAndValue?: boolean;
}

function renderCollection<Value>(props: CollectionProps<Value>) {
  const renderItem = props.children;
  if (!props.items || typeof renderItem !== 'function') return renderItem;
  return [...props.items].map((item, index) => {
    const child = renderItem(item);
    if (!isVNode(child)) return child;
    const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const rawKey = (record.key ?? record.id ?? index) as CollectionKey;
    const key = props.idScope == null ? rawKey : `${String(props.idScope)}-${String(rawKey)}`;
    if (props.addIdAndValue === false) return cloneElement(child, { key });
    return cloneElement(child, { id: key, key, value: item });
  });
}

/** Renders static children or maps item data to keyed Preact children. */
export function Collection<Value>(props: CollectionProps<Value>) {
  const rendered = useMemo(
    () => renderCollection(props),
    [props.items, props.children, props.idScope, props.addIdAndValue, props.dependencies],
  );
  return <Fragment>{rendered}</Fragment>;
}

type NativeCollectionProps<ElementType extends Element> = {
  elementRef?: Ref<ElementType>;
};

function standaloneNode<Value, Props extends object>(type: string, props: Props) {
  const record = props as Record<string, unknown>;
  const children = record.children as ComponentChildren;
  return {
    type,
    key: (record.id as CollectionKey | undefined) ?? 'item',
    value: (record.value as Value | undefined) ?? null,
    level: 0,
    index: 0,
    textValue: (record.textValue as string | undefined) ?? textValue(children),
    rendered: children,
    parentKey: null,
    prevKey: null,
    nextKey: null,
    firstChildKey: null,
    lastChildKey: null,
    props: record,
    childNodes: [],
  } satisfies BuiltCollectionNode<Value>;
}

export function createLeafComponent<Value, Props extends object, ElementType extends Element>(
  nodeClass: CollectionNodeClass | string,
  render: (
    props: Props,
    ref: Ref<ElementType> | undefined,
    node: BuiltCollectionNode<Value>,
  ) => ComponentChildren,
) {
  const type = nodeType(nodeClass);
  const Component = ((props: Props & NativeCollectionProps<ElementType>) => {
    const node = standaloneNode<Value, Props & NativeCollectionProps<ElementType>>(type, props);
    return <Fragment>{render(props, props.elementRef, node)}</Fragment>;
  }) as CollectionComponent<Props & NativeCollectionProps<ElementType>>;
  Component[collectionMetadata] = {
    type,
    isBranch: false,
    render: render as CollectionMetadata<Props>['render'],
  };
  return Component;
}

export function createBranchComponent<
  Value,
  Props extends { children?: ComponentChildren },
  ElementType extends Element,
>(
  nodeClass: CollectionNodeClass | string,
  render: (
    props: Props,
    ref: Ref<ElementType> | undefined,
    node: BuiltCollectionNode<Value>,
  ) => ComponentChildren,
  useChildren?: (props: Props) => ComponentChildren,
) {
  const Component = createLeafComponent<Value, Props, ElementType>(nodeClass, render);
  Component[collectionMetadata] = {
    ...Component[collectionMetadata]!,
    isBranch: true,
    useChildren: useChildren as CollectionMetadata<Props>['useChildren'],
  };
  return Component;
}
