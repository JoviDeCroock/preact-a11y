import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fixture = mkdtempSync(join(tmpdir(), 'preact-a11y-consumer-'));
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const node = process.execPath;
const preactSpec = process.env.PREACT_A11Y_PREACT_SPEC;

function pack(directory) {
  const output = execFileSync(
    pnpm,
    ['--config.ignore-scripts=true', 'pack', '--json', '--pack-destination', fixture],
    {
      cwd: directory,
      encoding: 'utf8',
    },
  );
  return basename(JSON.parse(output).filename);
}

const archive = pack(root);
const preactArchive = preactSpec ? undefined : pack(join(root, 'node_modules/preact'));

writeFileSync(
  join(fixture, 'package.json'),
  JSON.stringify(
    {
      private: true,
      type: 'module',
      dependencies: {
        preact: preactSpec ?? `file:./${preactArchive}`,
        'preact-a11y': `file:./${archive}`,
      },
    },
    undefined,
    2,
  ),
);

writeFileSync(
  join(fixture, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        jsx: 'react-jsx',
        jsxImportSource: 'preact',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        module: 'Preserve',
        moduleResolution: 'Bundler',
        noEmit: true,
        skipLibCheck: false,
        strict: true,
        target: 'ES2022',
      },
      include: ['index.tsx'],
    },
    undefined,
    2,
  ),
);

writeFileSync(
  join(fixture, 'index.tsx'),
  `import {
  useButton,
  useCheckbox,
  useDialog,
  useDisclosure,
  useFocusRing,
  useLandmark,
  useLink,
  useNumberField,
  usePress,
  useProgressBar,
  useRadio,
  useSearchField,
  useSeparator,
  useSwitch,
  useTextField,
  useVisuallyHidden,
  type AriaButtonProps,
} from 'preact-a11y';
import {Button} from 'preact-a11y/components';
import {useRef} from 'preact/hooks';

export function HookButton(props: AriaButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const {buttonProps} = useButton(props, ref);
  return <button {...buttonProps} ref={ref}>Hook button</button>;
}

export function ComponentButton() {
  return <Button onPress={() => undefined}>Component button</Button>;
}

// Prop bags must stay spreadable onto the elements they are meant for, including Preact 11's
// per-element ARIA roles and its discriminated <a>/<input> attribute unions.
export function SpreadTargets() {
  const mainRef = useRef<HTMLElement>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const {linkProps} = useLink({href: '/docs'});
  const {pressProps} = usePress({});
  const {focusProps} = useFocusRing();
  const {landmarkProps} = useLandmark({role: 'main'}, mainRef);
  const textField = useTextField({type: 'email'});
  const searchField = useSearchField();
  const numberField = useNumberField();
  const {inputProps: checkboxProps} = useCheckbox({}, checkboxRef);
  const {inputProps: switchProps} = useSwitch();
  const {inputProps: radioProps} = useRadio({value: 'a'});
  const disclosure = useDisclosure();
  const {separatorProps} = useSeparator();
  const {progressBarProps} = useProgressBar({value: 1});
  const dialog = useDialog();
  const {visuallyHiddenProps} = useVisuallyHidden();
  return (
    <main {...landmarkProps} ref={mainRef}>
      <a {...linkProps}>Docs</a>
      <button {...pressProps} {...focusProps}>Press</button>
      <input {...textField.inputProps} />
      <label {...textField.labelProps}>Email</label>
      <input {...searchField.inputProps} />
      <button {...searchField.clearButtonProps}>Clear</button>
      <input {...numberField.inputProps} />
      <input {...checkboxProps} ref={checkboxRef} />
      <input {...switchProps} />
      <input {...radioProps} />
      <button {...disclosure.buttonProps}>Toggle</button>
      <div {...disclosure.panelProps} />
      <hr {...separatorProps} />
      <div {...progressBarProps} />
      <section {...dialog.dialogProps}>
        <h2 {...dialog.titleProps}>Title</h2>
      </section>
      <span {...visuallyHiddenProps}>Hidden</span>
    </main>
  );
}
`,
);

const installArguments = ['install', '--ignore-scripts'];
if (!preactSpec) installArguments.push('--offline');

execFileSync(pnpm, installArguments, {
  cwd: fixture,
  stdio: 'inherit',
});

const packageJson = JSON.parse(
  readFileSync(join(fixture, 'node_modules/preact-a11y/package.json'), 'utf8'),
);
if (packageJson.dependencies?.react || packageJson.peerDependencies?.react) {
  throw new Error('The published package must not depend on React.');
}

for (const typeScript of [
  join(root, 'node_modules/typescript/bin/tsc'),
  join(root, 'node_modules/@typescript/typescript6/bin/tsc6'),
]) {
  execFileSync(node, [typeScript], {
    cwd: fixture,
    stdio: 'inherit',
  });
}
execFileSync(
  node,
  [
    '--input-type=module',
    '--eval',
    "await Promise.all([import('preact-a11y'), import('preact-a11y/components')])",
  ],
  { cwd: fixture, stdio: 'inherit' },
);
execFileSync(node, ['--eval', "require('preact-a11y'); require('preact-a11y/components')"], {
  cwd: fixture,
  stdio: 'inherit',
});

console.log(
  `consumer: types, ESM, and CommonJS passed with ${preactSpec ?? 'the locked Preact version'} and without React (${fixture})`,
);
