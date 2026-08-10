import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fixture = mkdtempSync(join(tmpdir(), 'preact-aria-consumer-'));
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const node = process.execPath;
const preactSpec = process.env.PREACT_ARIA_PREACT_SPEC;

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
        'preact-aria': `file:./${archive}`,
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
  `import {useButton, type AriaButtonProps} from 'preact-aria';
import {Button} from 'preact-aria/components';
import {useRef} from 'preact/hooks';

export function HookButton(props: AriaButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const {buttonProps} = useButton(props, ref);
  return <button {...buttonProps} ref={ref}>Hook button</button>;
}

export function ComponentButton() {
  return <Button onPress={() => undefined}>Component button</Button>;
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
  readFileSync(join(fixture, 'node_modules/preact-aria/package.json'), 'utf8'),
);
if (packageJson.dependencies?.react || packageJson.peerDependencies?.react) {
  throw new Error('The published package must not depend on React.');
}

execFileSync(node, [join(root, 'node_modules/typescript/bin/tsc')], {
  cwd: fixture,
  stdio: 'inherit',
});
execFileSync(
  node,
  [
    '--input-type=module',
    '--eval',
    "await Promise.all([import('preact-aria'), import('preact-aria/components')])",
  ],
  { cwd: fixture, stdio: 'inherit' },
);
execFileSync(node, ['--eval', "require('preact-aria'); require('preact-aria/components')"], {
  cwd: fixture,
  stdio: 'inherit',
});

console.log(
  `consumer: types, ESM, and CommonJS passed with ${preactSpec ?? 'the locked Preact version'} and without React (${fixture})`,
);
