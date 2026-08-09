#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const maxStageAttempts = 4;
const stageRetryDelay = 10_000;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  return result;
}

function versionExists(name, version) {
  const result = run('npm', ['view', `${name}@${version}`, 'version', '--json']);
  if (result.status === 0) return true;

  const output = `${result.stdout}\n${result.stderr}`;
  if (output.includes('E404') || output.includes('No match found')) return false;
  throw new Error(`Could not check npm version for ${name}@${version}`);
}

function distTag(version) {
  return version.match(/^[^-]+-([0-9A-Za-z-]+)/)?.[1] ?? 'latest';
}

function wait(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function stagePackage(name, args, attempt = 1) {
  const result = run('pnpm', args);
  const transient = /\bE5\d{2}\b/.test(`${result.stdout}\n${result.stderr}`);
  if (result.status === 0 || attempt === maxStageAttempts || !transient) return result;

  const delay = stageRetryDelay * 2 ** (attempt - 1);
  console.log(`npm returned a transient error for ${name}; retrying in ${delay / 1000}s...`);
  await wait(delay);
  return stagePackage(name, args, attempt + 1);
}

function createGitTag(tagName) {
  const existing = spawnSync('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${tagName}`], {
    cwd: root,
    stdio: 'ignore',
  });

  if (existing.status !== 0) {
    const result = run('git', ['tag', tagName, '-m', tagName]);
    if (result.status !== 0) process.exit(result.status || 1);
  }

  // changesets/action parses this exact line, pushes the tag, and creates the release.
  console.log(`New tag: ${tagName}`);
}

if (!packageJson.name || !packageJson.version || packageJson.private) {
  throw new Error('package.json must describe a publishable named package.');
}
if (packageJson.version === '0.0.0') {
  throw new Error('Refusing to stage the placeholder version 0.0.0.');
}

if (versionExists(packageJson.name, packageJson.version)) {
  console.log(`Skipping ${packageJson.name}@${packageJson.version}; already published.`);
  process.exit(0);
}

const tag = distTag(packageJson.version);
console.log(`Staging ${packageJson.name}@${packageJson.version} with dist-tag ${tag}...`);
const result = await stagePackage(`${packageJson.name}@${packageJson.version}`, [
  'stage',
  'publish',
  '.',
  '--provenance',
  '--access',
  packageJson.publishConfig?.access ?? 'public',
  '--tag',
  tag,
  '--json',
]);

if (result.status !== 0) process.exit(result.status || 1);

const stageId = result.stdout.match(/"stageId"\s*:\s*"([^"]+)"/)?.[1];
const tagName = `${packageJson.name}@${packageJson.version}`;
createGitTag(tagName);
console.log(`Staged ${tagName}${stageId ? ` (${stageId})` : ''}.`);
console.log('Approve it only after review with `npm stage approve <stage-id>`.');
