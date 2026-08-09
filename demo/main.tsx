import { render } from 'preact';
import { useState } from 'preact/hooks';
import {
  Button,
  Checkbox,
  Link,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  ToggleButton,
} from '../src/components';
import './styles.css';

function App() {
  const [count, setCount] = useState(0);

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
      <TextField label="Email" description="We will only use this for accessibility updates" />
      <ToggleButton>Pin sidebar</ToggleButton>
      <Link href="#learn-more">Learn more</Link>
      <section id="learn-more" tabIndex={-1}>
        Native Preact accessibility primitives.
      </section>
    </main>
  );
}

render(<App />, document.querySelector('#app')!);
