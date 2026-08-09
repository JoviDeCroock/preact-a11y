#!/usr/bin/env node

import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));

function setOutput(value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `has_unpublished=${value}\n`);
  }
  console.log(`has_unpublished=${value}`);
}

if (packageJson.private || packageJson.version === '0.0.0') {
  console.log(`Skipping ${packageJson.name}@${packageJson.version}; it is not releasable.`);
  setOutput(false);
} else {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(packageJson.name)}/${encodeURIComponent(packageJson.version)}`,
  );

  if (response.status === 404) {
    console.log(`${packageJson.name}@${packageJson.version} has not been published.`);
    setOutput(true);
  } else if (response.ok) {
    console.log(`${packageJson.name}@${packageJson.version} is already published.`);
    setOutput(false);
  } else {
    throw new Error(`npm registry returned ${response.status} ${response.statusText}`);
  }
}
