import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');

describe('release safety', () => {
  it('does not consider the placeholder version publishable', () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), 'preact-aria-release-'));
    const outputFile = join(temporaryDirectory, 'github-output');
    const result = spawnSync(process.execPath, ['.github/scripts/has-unpublished-package.mjs'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_OUTPUT: outputFile },
    });

    expect(result.status).toBe(0);
    expect(readFileSync(outputFile, 'utf8')).toBe('has_unpublished=false\n');
  });

  it('refuses to stage the placeholder version', () => {
    const result = spawnSync(process.execPath, ['.github/scripts/stage-package.mjs'], {
      cwd: root,
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Refusing to stage the placeholder version 0.0.0');
  });

  it('gates staged publishing behind checks and the npm environment', () => {
    const workflow = readFileSync(join(root, '.github/workflows/main.yml'), 'utf8');

    expect(workflow).toContain('permissions:\n  contents: read');
    expect(workflow).toContain('needs: checks');
    expect(workflow).toContain('name: npm');
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('node .github/scripts/stage-package.mjs');
    expect(workflow).not.toMatch(/run:\s+npm publish/);
  });

  it('requires provenance and scans source plus build output for forbidden runtimes', () => {
    const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const packageCheck = readFileSync(join(root, 'scripts/check-package.mjs'), 'utf8');

    expect(packageJson.publishConfig).toEqual({ access: 'public', provenance: true });
    expect(packageCheck).toContain("join(root, 'src')");
    expect(packageCheck).toContain("'preact/compat'");
    expect(packageCheck).toContain("'@react-stately'");
  });
});
