// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

let security: any;

beforeAll(async () => {
  const mod = await import('../scripts/security-scan.cjs');
  security = mod.default ?? mod;
});

function tempFile(content: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'security-scan-'));
  const file = path.join(dir, 'sample.txt');
  fs.writeFileSync(file, content, 'utf8');
  return { dir, file };
}

function fakeGoogleApiKey() {
  return `AIzaSy${'A'.repeat(33)}`;
}

describe('quality-core security scan', () => {
  it('detects obvious secrets in files', () => {
    const { dir, file } = tempFile(`const key = '${fakeGoogleApiKey()}';\n`);
    const findings = security.scanFile(file);
    expect(findings.length).toBeGreaterThan(0);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('ignores safe patterns like process.env', () => {
    const { dir, file } = tempFile(`const key = process.env.API_KEY || '${fakeGoogleApiKey()}';\n`);
    const findings = security.scanFile(file);
    expect(findings.length).toBe(0);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('supports repo-wide config without ignoring security-scan tests', () => {
    const defaultConfig = security.buildConfig();
    const repoWideConfig = security.buildConfig({ repoWide: true });
    expect(defaultConfig.ignoreFiles).toContain('security-scan.core.test.ts');
    expect(repoWideConfig.ignoreFiles).not.toContain('security-scan.core.test.ts');
  });
});
