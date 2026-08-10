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
  useDrag,
  useDrop,
  useLandmark,
  usePreviewTrigger,
  useSubmenuTrigger,
  type DragPreviewRenderer,
  type DropEvent,
  type SubmenuFocusStrategy,
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
