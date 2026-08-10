import { render, screen } from '@testing-library/preact';
import type { ComponentChildren } from 'preact';
import { describe, expect, it } from 'vitest';
import {
  Collection,
  CollectionBuilder,
  createBranchComponent,
  createLeafComponent,
  type BuiltCollectionNode,
} from '../src';

interface Item {
  id: string;
  name: string;
}

interface ItemProps {
  id?: string;
  value?: Item;
  textValue?: string;
  children?: ComponentChildren;
}

const ItemNode = createLeafComponent<Item, ItemProps, HTMLLIElement>(
  'item',
  (props, elementRef, node) => (
    <li ref={elementRef} data-key={node.key}>
      {props.children}
    </li>
  ),
);

const SectionNode = createBranchComponent<Item, ItemProps, HTMLElement>(
  'section',
  (props, elementRef) => <section ref={elementRef}>{props.children}</section>,
);

describe('collection construction', () => {
  it('builds keyed immutable snapshots from dynamic Preact children', () => {
    const items: Item[] = [
      { id: 'alpha', name: 'Alpha' },
      { id: 'bravo', name: 'Bravo' },
    ];

    render(
      <CollectionBuilder
        content={
          <Collection items={items} idScope="suggestions">
            {(item) => <ItemNode textValue={item.name}>{item.name}</ItemNode>}
          </Collection>
        }
      >
        {(collection) => (
          <output data-testid="snapshot">
            {[...collection]
              .map((node) => `${node.key}:${node.textValue}:${(node.value as Item | null)?.name}`)
              .join('|')}
          </output>
        )}
      </CollectionBuilder>,
    );

    expect(screen.getByTestId('snapshot')).toHaveTextContent(
      'suggestions-alpha:Alpha:Alpha|suggestions-bravo:Bravo:Bravo',
    );
  });

  it('tracks branch relationships separately from flattened navigation', () => {
    let section: BuiltCollectionNode | undefined;
    let child: BuiltCollectionNode | undefined;
    let after: BuiltCollectionNode | undefined;

    render(
      <CollectionBuilder
        content={
          <>
            <SectionNode id="group">
              <ItemNode id="nested">Nested</ItemNode>
            </SectionNode>
            <ItemNode id="after">After</ItemNode>
          </>
        }
      >
        {(collection) => {
          section = collection.getItem('group');
          child = collection.getItem('nested');
          after = collection.getItem('after');
          return <span>ready</span>;
        }}
      </CollectionBuilder>,
    );

    expect(section?.firstChildKey).toBe('nested');
    expect(child?.parentKey).toBe('group');
    expect(child?.nextKey).toBeNull();
    expect(after?.prevKey).toBe('group');
    expect(section && [...section.childNodes].map((node) => node.key)).toEqual(['nested']);
  });

  it('renders leaf components directly with Preact element refs', () => {
    const { container } = render(<ItemNode id="direct">Direct</ItemNode>);
    expect(container.querySelector('[data-key="direct"]')).toHaveTextContent('Direct');
  });
});
