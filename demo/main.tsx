import { render } from 'preact';
import { useState } from 'preact/hooks';
import { Button, Checkbox, Radio, RadioGroup, Switch, TextField } from '../src/components';
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
    </main>
  );
}

render(<App />, document.querySelector('#app')!);
