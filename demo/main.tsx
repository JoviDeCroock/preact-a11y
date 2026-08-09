import { render } from 'preact';
import { useState } from 'preact/hooks';
import { Button, Checkbox } from '../src/components';
import './styles.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <main>
      <h1>Preact Aria browser fixture</h1>
      <Button onPress={() => setCount((value) => value + 1)}>Increment</Button>
      <output aria-live="polite">Count: {count}</output>
      <Checkbox>Accept terms</Checkbox>
    </main>
  );
}

render(<App />, document.querySelector('#app')!);
