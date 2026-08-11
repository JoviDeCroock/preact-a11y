import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const docsDirectory = join(root, 'docs');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const files = [
  join(root, 'README.md'),
  ...readdirSync(docsDirectory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => join(docsDirectory, file)),
];
const failures = [];
const sources = new Map(files.map((file) => [file, readFileSync(file, 'utf8')]));

for (const [file, source] of sources) {
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const link = match[1].replace(/^<|>$/g, '');
    if (/^(?:[a-z]+:|#)/i.test(link)) continue;
    const path = decodeURIComponent(link.split('#')[0]);
    if (!path) continue;
    const target = resolve(dirname(file), path);
    if (!existsSync(target)) {
      failures.push(`${relative(root, file)} links to missing ${path}`);
    }
  }
}

const allDocumentation = [...sources.values()].join('\n');
if (existsSync(join(docsDirectory, 'parity.md'))) {
  failures.push('docs/parity.md must not be used as product documentation');
}
if (!allDocumentation.includes('https://react-spectrum.adobe.com/react-aria/')) {
  failures.push('documentation must disclose the React Aria inspiration');
}
if (!allDocumentation.includes(`pnpm add preact ${packageJson.name}`)) {
  failures.push(`documentation must include installation for ${packageJson.name}`);
}
if (/(?:from\s+['"]|pnpm add preact\s+)preact-aria(?:[/'"]|\s|$)/.test(allDocumentation)) {
  failures.push('documentation contains the retired preact-aria package name');
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`docs: ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`docs: ${files.length} Markdown files and local links verified`);
}
