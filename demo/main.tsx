import { render } from 'preact';
import { useRef, useState } from 'preact/hooks';
import {
  FocusRing,
  OverlayContainer,
  OverlayProvider,
  Pressable,
  RouterProvider,
  isTextDropItem,
  useClipboard,
  useLandmark,
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
