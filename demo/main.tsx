import { render } from 'preact';
import { useRef, useState } from 'preact/hooks';
import {
  FocusRing,
  DragPreview,
  OverlayContainer,
  OverlayProvider,
  Pressable,
  RouterProvider,
  isTextDropItem,
  useClipboard,
  useAutocomplete,
  useCalendar,
  useCalendarCell,
  useCalendarGrid,
  useCalendarHeading,
  useDateField,
  useDateSegment,
  useColorChannelField,
  useColorSlider,
  useColorSwatch,
  useDrag,
  useDraggableCollection,
  useDraggableItem,
  useDrop,
  useDropIndicator,
  useDroppableCollection,
  useDroppableItem,
  useLandmark,
  usePreviewTrigger,
  useSubmenuTrigger,
  useToken,
  useTokenField,
  type DragPreviewRenderer,
  type DropEvent,
  type CollectionKey,
  type CalendarDate,
  type CalendarState,
  type DateFieldState,
  type DateSegment,
  type ColorState,
  type ColorValue,
  type DraggableCollectionState,
  type DropTarget,
  type DroppableCollectionState,
  type SubmenuFocusStrategy,
  type TokenFieldSegment,
} from '../src';
import {
  Button,
  Breadcrumb,
  Breadcrumbs,
  Checkbox,
  CheckboxGroup,
  CheckboxGroupItem,
  ComboBox,
  ComboBoxItem,
  Disclosure,
  GridList,
  GridListItem,
  GridListSection,
  GridListSelectionCheckbox,
  Link,
  ListBox,
  MenuItem,
  MenuTrigger,
  Meter,
  Modal,
  NumberField,
  Option,
  Popover,
  ProgressBar,
  Radio,
  RadioGroup,
  SearchField,
  Select,
  SelectItem,
  Separator,
  Slider,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  TagGroup,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  TableSelectAllCheckbox,
  TableSelectionCheckbox,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupItem,
  Toolbar,
  ToastRegion,
  Tree,
  TreeItem,
  Tooltip,
  type ToastItem,
} from '../src/components';
import './styles.css';

function ClipboardExample() {
  const [status, setStatus] = useState('Ready');
  const { clipboardProps } = useClipboard({
    getItems: ({ action }) => [
      {
        'text/plain': `Preact Aria ${action}`,
        'application/json': JSON.stringify({ library: 'preact-aria', action }),
      },
    ],
    onCopy: () => setStatus('Copied'),
    onCut: () => setStatus('Cut'),
    onPaste: (items) => {
      const text = items.find(isTextDropItem);
      if (text) void text.getText('text/plain').then((value) => setStatus(`Pasted: ${value}`));
    },
  });
  return (
    <div
      {...clipboardProps}
      aria-label="Clipboard workspace"
      aria-readonly="true"
      role="textbox"
      tabIndex={0}
    >
      Clipboard status: {status}
    </div>
  );
}

function DropZone({
  label,
  onDrop,
}: {
  label: string;
  onDrop: (label: string, event: DropEvent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drop = useDrop({
    ref,
    getDropOperation: (types, allowed) =>
      types.has('text/plain') && allowed.includes('move') ? 'move' : 'cancel',
    onDrop: (event) => onDrop(label, event),
  });
  return (
    <div
      {...drop.dropProps}
      aria-label={label}
      data-drop-target={drop.isDropTarget || undefined}
      ref={ref}
      role="region"
    >
      {label}
    </div>
  );
}

function DragDropExample() {
  const [status, setStatus] = useState('Ready');
  const previewRef = useRef<DragPreviewRenderer>(null);
  const drag = useDrag({
    getItems: () => [{ 'text/plain': 'Preact card' }],
    getAllowedDropOperations: () => ['move'],
    onDragStart: () => setStatus('Dragging'),
    onDragEnd: (event) => {
      if (event.dropOperation === 'cancel') setStatus('Cancelled');
    },
    preview: previewRef,
  });
  const handleDrop = (label: string, event: DropEvent) => {
    const item = event.items.find(isTextDropItem);
    if (item)
      void item.getText('text/plain').then((text) => setStatus(`Dropped on ${label}: ${text}`));
  };
  return (
    <section aria-label="Drag and drop example">
      <div
        {...drag.dragProps}
        aria-label="Preact card"
        data-dragging={drag.isDragging || undefined}
        role="button"
      >
        Preact card
      </div>
      <DropZone label="Backlog drop zone" onDrop={handleDrop} />
      <DropZone label="Archive drop zone" onDrop={handleDrop} />
      <output aria-live="polite">Drag status: {status}</output>
      <DragPreview previewRef={previewRef}>{() => <div>Preact card preview</div>}</DragPreview>
    </section>
  );
}

const collectionDragToken = {};
const afterBetaTarget: DropTarget = { type: 'item', key: 'beta', dropPosition: 'after' };

function targetsMatch(left: DropTarget | null, right: DropTarget | null) {
  return (
    left?.type === right?.type &&
    left?.key === right?.key &&
    left?.dropPosition === right?.dropPosition
  );
}

function CollectionDragDropExample() {
  const collectionRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState(['alpha', 'beta']);
  const [draggedKey, setDraggedKey] = useState<CollectionKey | null>(null);
  const [draggingKeys, setDraggingKeys] = useState(new Set<CollectionKey>());
  const [target, setTarget] = useState<DropTarget | null>(null);

  const dragStateRef = useRef<DraggableCollectionState>();
  if (!dragStateRef.current) {
    dragStateRef.current = {
      collection: collectionDragToken,
      draggedKey: null,
      draggingKeys: new Set(),
      isDragging: (key) => dragStateRef.current!.draggingKeys.has(key),
      getKeysForDrag: (key) => new Set([key]),
      getItems: (key) => [{ 'text/plain': String(key) }],
      getAllowedDropOperations: () => ['move'],
      startDrag(key, event) {
        setDraggedKey(key);
        setDraggingKeys(event.keys);
      },
      moveDrag() {},
      endDrag() {
        setDraggedKey(null);
        setDraggingKeys(new Set());
      },
    };
  }
  dragStateRef.current.draggedKey = draggedKey;
  dragStateRef.current.draggingKeys = draggingKeys;
  const dragState = dragStateRef.current;

  const dropStateRef = useRef<DroppableCollectionState>();
  if (!dropStateRef.current) {
    dropStateRef.current = {
      collection: collectionDragToken,
      target: null,
      setTarget,
      isDropTarget: (candidate) => targetsMatch(dropStateRef.current!.target, candidate),
      getDropOperation: ({ target: candidate, types, allowedOperations }) =>
        candidate.type === 'item' && types.has('text/plain') && allowedOperations.includes('move')
          ? 'move'
          : 'cancel',
    };
  }
  dropStateRef.current.target = target;
  const dropState = dropStateRef.current;

  useDraggableCollection({}, dragState, collectionRef);
  const drag = useDraggableItem({ key: 'alpha' }, dragState);
  const collectionDrop = useDroppableCollection(
    {
      keyboardDelegate: {},
      dropTargetDelegate: { getDropTargetFromPoint: () => ({ type: 'root' }) },
      acceptedDragTypes: ['text/plain'],
      onReorder: () => setOrder(['beta', 'alpha']),
    },
    dropState,
    collectionRef,
  );
  const indicator = useDropIndicator({ target: afterBetaTarget }, dropState, indicatorRef);
  const itemDrop = useDroppableItem({ target: afterBetaTarget }, dropState, targetRef);

  const alpha = (
    <div key="alpha" role="listitem">
      <div
        {...drag.dragProps}
        aria-label="Alpha collection card"
        data-dragging={drag.isDragging || undefined}
        ref={sourceRef}
        role="button"
      >
        Alpha
      </div>
    </div>
  );
  const beta = (
    <div
      {...itemDrop.dropProps}
      aria-label="Beta collection card"
      data-drop-target={itemDrop.isDropTarget || undefined}
      key="beta"
      ref={targetRef}
      role="listitem"
      tabIndex={-1}
    >
      Beta
      <div {...indicator.dropIndicatorProps} ref={indicatorRef} />
    </div>
  );

  return (
    <section aria-label="Collection drag and drop example">
      <div
        {...collectionDrop.collectionProps}
        aria-label="Reorder cards"
        ref={collectionRef}
        role="list"
      >
        {order.map((key) => (key === 'alpha' ? alpha : beta))}
      </div>
      <output aria-live="polite">Collection order: {order.join(', ')}</output>
    </section>
  );
}

function SubmenuExample() {
  const parentMenuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [focusStrategy, setFocusStrategy] = useState<SubmenuFocusStrategy>();
  const aria = useSubmenuTrigger(
    { parentMenuRef, submenuRef },
    {
      isOpen,
      focusStrategy,
      open(strategy) {
        setFocusStrategy(strategy);
        setOpen(true);
      },
      close: () => setOpen(false),
    },
    triggerRef,
  );
  const { autoFocus: _, submenuLevel: __, ...submenuProps } = aria.submenuProps;

  return (
    <div className="submenu-example">
      <div aria-label="Export actions" ref={parentMenuRef} role="menu">
        <div {...aria.submenuTriggerProps} ref={triggerRef} role="menuitem" tabIndex={0}>
          Export submenu
        </div>
        <div role="menuitem" tabIndex={-1}>
          Print
        </div>
      </div>
      {isOpen && (
        <div {...submenuProps} ref={submenuRef} role="menu" tabIndex={-1}>
          <div role="menuitem" tabIndex={-1}>
            Export PDF
          </div>
          <div role="menuitem" tabIndex={-1}>
            Export HTML
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewExample() {
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const aria = usePreviewTrigger(
    { closeDelay: 100, delay: 50, popoverRef, triggerRef },
    { isOpen, open: () => setOpen(true), close: () => setOpen(false) },
  );
  const { isNonModal: _, ...popoverProps } = aria.popoverProps;

  return (
    <>
      <a {...aria.triggerProps} href="#preview-article" ref={triggerRef}>
        Preview article
      </a>
      {isOpen && (
        <div {...popoverProps} aria-label="Article preview" className="preview" ref={popoverRef}>
          <p>Build accessible Preact interfaces from unstyled primitives.</p>
          <button>Read article preview</button>
        </div>
      )}
    </>
  );
}

function TokenExample({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const token = useToken({}, null, ref);
  return (
    <span {...token.tokenProps} data-selected={token.isSelected || undefined} ref={ref}>
      {text}
    </span>
  );
}

function TokenFieldExample() {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Editing');
  const [value, setValue] = useState<readonly TokenFieldSegment[]>([
    { type: 'text', text: '' },
    { type: 'token', text: 'Preact', value: 'preact' },
    { type: 'text', text: ' aria' },
  ]);
  const [isComposing, setComposing] = useState(false);
  const field = useTokenField(
    {
      description: 'Type text around atomic topic tokens',
      label: 'Topics token field',
      onSubmit: () => setStatus('Submitted'),
    },
    { isComposing, setComposing, setValue, value },
    ref,
  );
  return (
    <section>
      <span {...field.labelProps}>Topics token field</span>
      <div {...field.tokenFieldProps} ref={ref}>
        {value.map((segment, index) =>
          segment.type === 'token' ? (
            <TokenExample key={`${segment.text}-${index}`} text={segment.text} />
          ) : (
            <span data-preact-aria-text key={`text-${index}`}>
              {segment.text}
            </span>
          ),
        )}
      </div>
      <span {...field.descriptionProps}>Type text around atomic topic tokens</span>
      <output aria-live="polite">
        Token field status: {status}; value: {value.map((segment) => segment.text).join('')}
      </output>
    </section>
  );
}

function AutocompleteExample() {
  const inputRef = useRef<HTMLInputElement>(null);
  const collectionRef = useRef<HTMLUListElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [status, setStatus] = useState('No primitive selected');
  const autocomplete = useAutocomplete(
    {
      inputRef,
      collectionRef,
      'aria-label': 'Primitive suggestions',
      filter: (text, input) => text.toLocaleLowerCase().includes(input.toLocaleLowerCase()),
    },
    { inputValue, focusedNodeId, setInputValue, setFocusedNodeId },
  );
  const { shouldUseVirtualFocus, disallowTypeAhead, ...collectionProps } =
    autocomplete.collectionProps;
  const suggestions = ['Button', 'Collection', 'ListBox', 'TokenField'].filter(
    (name) => autocomplete.filter?.(name, { id: `primitive-${name}` }) ?? true,
  );

  return (
    <section>
      <label for="primitive-finder">Primitive finder</label>
      <input {...autocomplete.inputProps} id="primitive-finder" ref={inputRef} />
      <ul
        {...collectionProps}
        data-disallow-typeahead={disallowTypeAhead || undefined}
        data-virtual-focus={shouldUseVirtualFocus || undefined}
        ref={collectionRef}
        role="listbox"
      >
        {suggestions.map((name) => (
          <li
            aria-selected={focusedNodeId === `primitive-${name}`}
            id={`primitive-${name}`}
            key={name}
            onClick={() => {
              setInputValue(name);
              setStatus(`${name} selected`);
            }}
            role="option"
          >
            {name}
          </li>
        ))}
      </ul>
      <output aria-live="polite">Autocomplete status: {status}</output>
    </section>
  );
}

function DemoCalendarCell({ date, state }: { date: CalendarDate; state: CalendarState }) {
  const ref = useRef<HTMLButtonElement>(null);
  const cell = useCalendarCell({ date }, state, ref);
  return (
    <td {...cell.cellProps}>
      <button {...cell.buttonProps} ref={ref}>
        {date.day}
      </button>
    </td>
  );
}

function CalendarExample() {
  const [focusedDate, setFocusedDate] = useState<CalendarDate>({
    year: 2026,
    month: 8,
    day: 12,
  });
  const [selectedDates, setSelectedDates] = useState<readonly CalendarDate[]>([]);
  const [visibleRange, setVisibleRange] = useState({
    start: { year: 2026, month: 8, day: 1 },
    end: { year: 2026, month: 8, day: 31 },
  });
  const state: CalendarState = {
    focusedDate,
    selectedDates,
    visibleRange,
    setFocusedDate,
    setVisibleRange,
    selectDate: (date) => setSelectedDates([date]),
  };
  const calendar = useCalendar({ 'aria-label': 'Release calendar' }, state);
  const grid = useCalendarGrid({}, state);
  const heading = useCalendarHeading();
  const dates = Array.from({ length: 7 }, (_, index) => ({
    year: 2026,
    month: 8,
    day: 10 + index,
  }));
  return (
    <section {...calendar.calendarProps}>
      <h2 {...heading.headingProps}>{calendar.title}</h2>
      <button {...calendar.prevButtonProps}>Previous</button>
      <button {...calendar.nextButtonProps}>Next</button>
      <table {...grid.gridProps}>
        <thead {...grid.headerProps}>
          <tr>
            {grid.weekDays.map((day) => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {dates.map((date) => (
              <DemoCalendarCell date={date} key={date.day} state={state} />
            ))}
          </tr>
        </tbody>
      </table>
      <output aria-live="polite">Calendar selection: {selectedDates[0]?.day ?? 'none'}</output>
    </section>
  );
}

function DemoDateSegment({ segment, state }: { segment: DateSegment; state: DateFieldState }) {
  const ref = useRef<HTMLSpanElement>(null);
  const aria = useDateSegment(segment, state, ref);
  return (
    <span {...aria.segmentProps} ref={ref}>
      {segment.text}
    </span>
  );
}

function DateFieldExample() {
  const ref = useRef<HTMLDivElement>(null);
  const [segments, setSegments] = useState<readonly DateSegment[]>([
    { type: 'month', text: '08', value: 8, minValue: 1, maxValue: 12 },
    { type: 'literal', text: '/' },
    { type: 'day', text: '12', value: 12, minValue: 1, maxValue: 31 },
    { type: 'literal', text: '/' },
    { type: 'year', text: '2026', value: 2026, minValue: 1900, maxValue: 2100 },
  ]);
  const state: DateFieldState = {
    segments,
    setSegment(type, value) {
      setSegments((current) =>
        current.map((segment) =>
          segment.type === type ? { ...segment, value, text: String(value) } : segment,
        ),
      );
    },
  };
  const field = useDateField({ label: 'Launch date' }, state, ref);
  return (
    <section>
      <span {...field.labelProps}>Launch date</span>
      <div {...field.fieldProps} ref={ref}>
        {segments.map((segment, index) => (
          <DemoDateSegment key={`${segment.type}-${index}`} segment={segment} state={state} />
        ))}
      </div>
    </section>
  );
}

function ColorExample() {
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState<ColorValue>({
    space: 'hsv',
    channels: { hue: 180, saturation: 75, brightness: 80 },
  });
  const state: ColorState = { value, setValue };
  const slider = useColorSlider({ channel: 'hue', label: 'Hue selector' }, state, trackRef);
  const brightness = useColorChannelField(
    { channel: 'brightness', label: 'Color brightness' },
    state,
    inputRef,
  );
  const swatch = useColorSwatch({ color: value, 'aria-label': 'Selected color' });
  return (
    <section aria-label="Color controls">
      <span {...slider.labelProps}>Hue</span>
      <div {...slider.trackProps} className="color-track" ref={trackRef}>
        <div {...slider.thumbProps} className="color-thumb" />
        <input {...slider.inputProps} />
      </div>
      <label {...brightness.labelProps}>Color brightness</label>
      <input {...brightness.inputProps} ref={inputRef} />
      <div {...swatch.colorSwatchProps} className="color-swatch" />
      <output aria-live="polite">Selected hue: {Math.round(value.channels.hue ?? 0)}</output>
    </section>
  );
}

function App() {
  const [count, setCount] = useState(0);
  const [composedCount, setComposedCount] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isProviderModalOpen, setProviderModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [tags, setTags] = useState(['preact', 'accessibility', 'vdom']);
  const mainRef = useRef<HTMLElement>(null);
  const { landmarkProps } = useLandmark({ role: 'main', 'aria-label': 'Component demo' }, mainRef);

  return (
    <main {...landmarkProps} ref={mainRef}>
      <h1>Preact Aria browser fixture</h1>
      <Breadcrumbs>
        <Breadcrumb href="#home">Home</Breadcrumb>
        <Breadcrumb isCurrent>Fixture</Breadcrumb>
      </Breadcrumbs>
      <Toolbar aria-label="Text formatting">
        <Button>Bold</Button>
        <Button>Italic</Button>
      </Toolbar>
      <Button onPress={() => setCount((value) => value + 1)}>Increment</Button>
      <output aria-live="polite">Count: {count}</output>
      <Pressable onPress={() => setComposedCount((value) => value + 1)}>
        <div role="button">Composed increment</div>
      </Pressable>
      <output aria-live="polite">Composed count: {composedCount}</output>
      <FocusRing focusClass="focused" focusRingClass="focus-ring">
        <button>Focus ring example</button>
      </FocusRing>
      <ClipboardExample />
      <DragDropExample />
      <CollectionDragDropExample />
      <Checkbox>Accept terms</Checkbox>
      <CheckboxGroup label="Permissions" name="permission">
        <CheckboxGroupItem value="read">Read projects</CheckboxGroupItem>
        <CheckboxGroupItem value="write">Edit projects</CheckboxGroupItem>
      </CheckboxGroup>
      <Switch>Enable notifications</Switch>
      <RadioGroup label="Theme" description="Choose an interface theme">
        <Radio value="light">Light</Radio>
        <Radio value="dark">Dark</Radio>
      </RadioGroup>
      <Disclosure title="Keyboard help">
        Use Tab to move between controls and Space or Enter to activate them.
      </Disclosure>
      <Tabs defaultSelectedKey="profile">
        <TabList aria-label="Account sections">
          <Tab id="profile">Profile</Tab>
          <Tab id="security">Security</Tab>
        </TabList>
        <TabPanel id="profile">Profile settings</TabPanel>
        <TabPanel id="security">Security settings</TabPanel>
      </Tabs>
      <ListBox aria-label="Favorite city" defaultSelectedKeys={['antwerp']}>
        <Option id="antwerp">Antwerp</Option>
        <Option id="brussels">Brussels</Option>
        <Option id="ghent">Ghent</Option>
      </ListBox>
      <GridList
        aria-label="Deployment environments"
        className="grid-list"
        defaultSelectedKeys={['production']}
        selectionMode="multiple"
      >
        <GridListSection heading="Recent environments" id="recent-environments">
          <GridListItem id="production" textValue="Production">
            <GridListSelectionCheckbox /> Production <Button>Deploy production</Button>
          </GridListItem>
          <GridListItem id="staging" isDisabled textValue="Staging">
            Staging
          </GridListItem>
          <GridListItem id="preview" textValue="Preview">
            <GridListSelectionCheckbox /> Preview <Button>Deploy preview</Button>
          </GridListItem>
        </GridListSection>
      </GridList>
      <Tree aria-label="File browser" className="tree" defaultExpandedKeys={['workspace']}>
        <TreeItem id="workspace" title="Workspace">
          <TreeItem id="package" title={<Button>Open package.json</Button>} />
          <TreeItem id="secrets" isDisabled title="Secrets" />
        </TreeItem>
        <TreeItem id="settings" title="Settings" />
      </Tree>
      <TagGroup
        className="tag-group"
        label="Topics"
        onRemove={(keys) => setTags((items) => items.filter((item) => !keys.has(item)))}
        selectionMode="multiple"
      >
        {tags.map((tag) => (
          <Tag id={tag} key={tag}>
            {tag === 'vdom' ? 'VDOM' : tag[0]!.toUpperCase() + tag.slice(1)}
          </Tag>
        ))}
      </TagGroup>
      <Table aria-label="Contributors" className="data-table" selectionMode="multiple">
        <TableHeader>
          <TableColumn id="selection">
            <TableSelectAllCheckbox />
          </TableColumn>
          <TableColumn
            allowsResizing
            allowsSorting
            defaultWidth={120}
            id="name"
            resizerClassName="column-resizer"
          >
            Name
          </TableColumn>
          <TableColumn id="role">Role</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow id="ada" textValue="Ada Lovelace">
            <TableCell columnId="selection">
              <TableSelectionCheckbox />
            </TableCell>
            <TableCell columnId="name" isRowHeader>
              Ada Lovelace
            </TableCell>
            <TableCell columnId="role">
              <Button>Open Ada</Button>
            </TableCell>
          </TableRow>
          <TableRow id="grace" isDisabled textValue="Grace Hopper">
            <TableCell columnId="selection">
              <TableSelectionCheckbox />
            </TableCell>
            <TableCell columnId="name" isRowHeader>
              Grace Hopper
            </TableCell>
            <TableCell columnId="role">Admiral</TableCell>
          </TableRow>
          <TableRow id="margaret" textValue="Margaret Hamilton">
            <TableCell columnId="selection">
              <TableSelectionCheckbox />
            </TableCell>
            <TableCell columnId="name" isRowHeader>
              Margaret Hamilton
            </TableCell>
            <TableCell columnId="role">
              <Button>Open Margaret</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <MenuTrigger label="More actions">
        <MenuItem id="rename">Rename</MenuItem>
        <MenuItem id="archive">Archive</MenuItem>
        <MenuItem id="delete" isDisabled>
          Delete
        </MenuItem>
      </MenuTrigger>
      <SubmenuExample />
      <ProgressBar label="Upload progress" value={65} />
      <Meter label="Storage used" maxValue={100} value={42} />
      <Separator />
      <TextField label="Email" description="We will only use this for accessibility updates" />
      <TokenFieldExample />
      <AutocompleteExample />
      <CalendarExample />
      <DateFieldExample />
      <ColorExample />
      <SearchField label="Search docs" />
      <NumberField defaultValue={2} label="Seats" maxValue={10} minValue={1} />
      <Slider
        className="slider"
        defaultValue={25}
        inputClassName="slider-input"
        label="Volume"
        name="volume"
        step={5}
        thumbClassName="slider-thumb"
        trackClassName="slider-track"
      />
      <Slider
        className="slider"
        defaultValue={[20, 80]}
        label="Price range"
        name="price"
        step={10}
        thumbClassName="slider-thumb"
        trackClassName="slider-track"
      />
      <Select defaultSelectedKey="cat" label="Favorite animal" name="animal">
        <SelectItem id="cat">Cat</SelectItem>
        <SelectItem id="dog">Dog</SelectItem>
        <SelectItem id="kangaroo">Kangaroo</SelectItem>
      </Select>
      <ComboBox label="Favorite framework">
        <ComboBoxItem id="preact">Preact</ComboBoxItem>
        <ComboBoxItem id="vanilla">Vanilla</ComboBoxItem>
        <ComboBoxItem id="web-components">Web Components</ComboBoxItem>
      </ComboBox>
      <ToggleButton>Pin sidebar</ToggleButton>
      <ToggleButtonGroup aria-label="Text alignment" defaultValue={['left']}>
        <ToggleButtonGroupItem id="left">Align left</ToggleButtonGroupItem>
        <ToggleButtonGroupItem id="center">Align center</ToggleButtonGroupItem>
        <ToggleButtonGroupItem id="right">Align right</ToggleButtonGroupItem>
      </ToggleButtonGroup>
      <Tooltip closeDelay={100} content="Copies a shareable link" delay={50}>
        <Button>Copy share link</Button>
      </Tooltip>
      <PreviewExample />
      <Button
        onPress={() =>
          setToasts([
            {
              id: 'saved',
              title: 'Settings saved',
              description: 'Your preferences are up to date.',
            },
          ])
        }
      >
        Show notification
      </Button>
      <ToastRegion
        className="toast-region"
        onDismiss={(id) => setToasts((items) => items.filter((item) => item.id !== id))}
        toastClassName="toast"
        toasts={toasts}
      />
      <Popover
        aria-label="Account help"
        className="popover"
        content={
          <>
            <h2>Account help</h2>
            <Button>Read guide</Button>
          </>
        }
        showArrow
        underlayClassName="popover-underlay"
      >
        <Button>Open account help</Button>
      </Popover>
      <Button onPress={() => setModalOpen(true)}>Open preferences</Button>
      <Modal
        aria-label="Preferences"
        className="modal"
        isDismissable
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      >
        <h2>Preferences</h2>
        <TextField label="Display name" />
        <Button onPress={() => setModalOpen(false)}>Save preferences</Button>
      </Modal>
      <Button onPress={() => setProviderModalOpen(true)}>Open portal modal</Button>
      {isProviderModalOpen && (
        <OverlayContainer>
          <Modal
            aria-label="Portal preferences"
            className="modal"
            isDismissable
            isOpen
            onClose={() => setProviderModalOpen(false)}
          >
            <h2>Portal preferences</h2>
            <Button onPress={() => setProviderModalOpen(false)}>Close portal modal</Button>
          </Modal>
        </OverlayContainer>
      )}
      <Link href="#learn-more">Learn more</Link>
      <Link href="/client-settings">Client-routed settings</Link>
      <section id="learn-more" tabIndex={-1}>
        Native Preact accessibility primitives.
      </section>
      <section id="preview-article" tabIndex={-1}>
        Article destination.
      </section>
    </main>
  );
}

render(
  <RouterProvider
    navigate={(path, options) => {
      if (options?.replace) history.replaceState(options.state, '', path);
      else history.pushState(options?.state, '', path);
    }}
  >
    <OverlayProvider>
      <App />
    </OverlayProvider>
  </RouterProvider>,
  document.querySelector('#app')!,
);
