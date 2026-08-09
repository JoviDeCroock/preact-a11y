import { render } from 'preact';
import { useState } from 'preact/hooks';
import {
  Button,
  Breadcrumb,
  Breadcrumbs,
  Checkbox,
  Disclosure,
  Link,
  ListBox,
  MenuItem,
  MenuTrigger,
  Meter,
  Modal,
  NumberField,
  Option,
  ProgressBar,
  Radio,
  RadioGroup,
  SearchField,
  Separator,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
  ToggleButton,
  Toolbar,
} from '../src/components';
import './styles.css';

function App() {
  const [count, setCount] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <main>
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
      <Checkbox>Accept terms</Checkbox>
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
      <ToggleButton>Pin sidebar</ToggleButton>
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
      <Link href="#learn-more">Learn more</Link>
      <section id="learn-more" tabIndex={-1}>
        Native Preact accessibility primitives.
      </section>
    </main>
  );
}

render(<App />, document.querySelector('#app')!);
