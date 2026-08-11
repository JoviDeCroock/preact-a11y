import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const failures = [];

if (packageJson.license !== 'Apache-2.0') {
  failures.push('package license must be Apache-2.0');
}

const license = readFileSync(join(root, 'LICENSE'), 'utf8');
if (!license.includes('Apache License\n                           Version 2.0')) {
  failures.push('LICENSE must contain the Apache License, Version 2.0');
}

const notice = readFileSync(join(root, 'NOTICE'), 'utf8');
if (!notice.includes('Portions of this project are adapted from the React Spectrum project')) {
  failures.push('NOTICE must retain React Spectrum attribution');
}
if (!notice.includes('not affiliated with, authorized, endorsed, or\nsponsored by Adobe')) {
  failures.push('NOTICE must include the Adobe non-affiliation statement');
}

const forbiddenPackages = [
  'react',
  'react-dom',
  'preact/compat',
  '@react-aria',
  '@react-stately',
  'react-aria',
  'react-stately',
];

for (const field of [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
]) {
  const dependencies = packageJson[field] ?? {};
  for (const dependency of Object.keys(dependencies)) {
    if (
      forbiddenPackages.some((name) => dependency === name || dependency.startsWith(`${name}/`))
    ) {
      failures.push(`${field} must not contain ${dependency}`);
    }
  }
}

if ('./stately' in packageJson.exports) {
  failures.push('the package must not expose a stately entry point');
}

const expectedFiles = [
  'dist/index.js',
  'dist/index.cjs',
  'dist/index.d.ts',
  'dist/components.js',
  'dist/components.cjs',
  'dist/components.d.ts',
];

for (const file of expectedFiles) {
  if (!existsSync(join(root, file))) failures.push(`missing built file ${file}`);
}

const forbiddenSourcePatterns = [
  ['preact/compat', /preact\/compat/],
  ['React import', /(?:from\s*|require\s*\()["']react(?:\/[^"']*)?["']/],
  ['React DOM import', /(?:from\s*|require\s*\()["']react-dom(?:\/[^"']*)?["']/],
  ['React Aria import', /(?:from\s*|require\s*\()["'](?:@react-aria|react-aria)(?:\/[^"']*)?["']/],
  [
    'React Stately import',
    /(?:from\s*|require\s*\()["'](?:@react-stately|react-stately)(?:\/[^"']*)?["']/,
  ],
];

function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) inspect(path);
    else if (
      ['.js', '.cjs', '.mjs', '.ts', '.tsx'].includes(extname(path)) ||
      path.endsWith('.d.ts')
    ) {
      const source = readFileSync(path, 'utf8');
      for (const [label, pattern] of forbiddenSourcePatterns) {
        if (pattern.test(source))
          failures.push(`${path.slice(root.length + 1)} contains a ${label}`);
      }
    }
  }
}

const dist = join(root, 'dist');
if (existsSync(dist)) inspect(dist);
const source = join(root, 'src');
if (existsSync(source)) inspect(source);

if (failures.length > 0) {
  for (const failure of failures) console.error(`package: ${failure}`);
  process.exitCode = 1;
} else {
  console.log('package: Preact-native publish boundary verified');
}
