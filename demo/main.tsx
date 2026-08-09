import { render } from 'preact';
import { useState } from 'preact/hooks';
import {
  Button,
  Checkbox,
  Disclosure,
  Link,
  Modal,
  Radio,
  RadioGroup,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
  ToggleButton,
} from '../src/components';
import './styles.css';

function App() {
  const [count, setCount] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <main>
      <h1>Preact Aria browser fixture</h1>
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
      <TextField label="Email" description="We will only use this for accessibility updates" />
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
