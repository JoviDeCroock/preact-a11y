# Collections

Collection primitives coordinate keyboard navigation, focus, selection, disabled items,
typeahead, and item relationships. They cover listboxes, menus, grid lists, trees, tag groups, and
tables without requiring a state-management package.

## Listbox

```tsx
import { ListBox, Option } from 'preact-a11y/components';
import { useState } from 'preact/hooks';

export function TeamPicker() {
  const [selectedKeys, setSelectedKeys] = useState(new Set(['design']));

  return (
    <ListBox
      aria-label="Teams"
      selectedKeys={selectedKeys}
      selectionMode="multiple"
      onSelectionChange={setSelectedKeys}
    >
      <Option id="design">Design</Option>
      <Option id="engineering">Engineering</Option>
      <Option id="support">Support</Option>
    </ListBox>
  );
}
```

The collection retains DOM focus on the listbox and tracks an active option. Arrow keys move the
active item, Home and End move to boundaries, typeahead finds items, and selection behavior follows
the configured mode.

## Choose the right collection

| Primitive  | Use it for                                                     |
| ---------- | -------------------------------------------------------------- |
| `ListBox`  | Choosing one or more values from a non-interactive list        |
| `Menu`     | Actions or navigation commands                                 |
| `GridList` | Selectable rows that may contain interactive child controls    |
| `Tree`     | Hierarchical items with expandable parents                     |
| `TagGroup` | Selected values that may be removed                            |
| `Table`    | Tabular data with row/column navigation, sorting, or selection |

Do not use a menu as a replacement for a select or listbox. The roles have different expectations
for selection, focus, and assistive technology announcements.

## Sections and labels

Listboxes, menus, and grid lists support labeled sections. A section heading is presentational
content linked to a group; it is not itself a selectable item. Give an otherwise unlabeled
collection an `aria-label` or `aria-labelledby`.

## Controlled collection state

Component APIs accept iterable keys and emit `Set<string>` values. Hooks accept explicit focused,
selected, expanded, sorted, or disabled state depending on the collection. This makes the behavior
compatible with local hooks, signals, server state, or a custom collection model.

Keep keys stable across renders. A key should identify the logical item, not its current index.
Stable keys are required for reliable focus recovery, selection, drag and drop, and announcements.

## Low-level delegates

Use `ListKeyboardDelegate` and `ListDropTargetDelegate` when a custom or virtualized collection
needs navigation and drop-target calculations. They operate on collection and layout contracts
rather than requiring a specific component tree.

`CollectionBuilder`, `createLeafComponent`, and `createBranchComponent` can build immutable
collection nodes from Preact children. `useAutocomplete` adds filtering and virtual focus to a
consumer-owned collection.

## Drag and drop

The drag/drop hooks expose typed transfer items, keyboard navigation, drop indicators, and
standalone or collection targets. Always provide a keyboard path for every pointer drag operation,
and announce the available operation and resulting location.

Clipboard hooks use the same typed item model for copy, cut, and paste. Treat custom MIME data as
untrusted input when it crosses an application boundary.

## Styling collection state

Unstyled collection components expose state through attributes:

```css
[role='option'][data-focused] {
  outline: 2px solid Highlight;
}

[role='option'][data-selected] {
  background: color-mix(in srgb, Highlight 18%, transparent);
}
```

Do not hide the focused item with `display: none`, and keep selected state distinguishable without
relying on color alone.
