// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

let BuildAudit: any;
let BundleAudit: any;

beforeAll(async () => {
  const buildModule = await import('../packages/audits/build.cjs');
  const bundleModule = await import('../packages/audits/bundle-analysis.cjs');
  BuildAudit = (buildModule.default ?? buildModule) as typeof BuildAudit;
  BundleAudit = (bundleModule.default ?? bundleModule) as typeof BundleAudit;
});

function createTempDist() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pn-dist-'));
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'assets', 'app.js'), 'a'.repeat(1024 * 5));
  fs.writeFileSync(path.join(dir, 'assets', 'app.css'), 'b'.repeat(1024 * 2));
  fs.writeFileSync(path.join(dir, 'assets', 'logo.png'), 'c'.repeat(1024));
  return dir;
}

describe('quality-core audits', () => {
  it('build audit returns violations when thresholds are exceeded', async () => {
    const distDir = createTempDist();
    const result = await BuildAudit.run({
      distDir,
      thresholds: {
        build: {
          bundle_total_kb: 1,
          largest_chunk_kb: 1,
          css_total_kb: 1,
          assets_count: 0,
        },
      },
    });
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('bundle analysis returns metrics', async () => {
    const distDir = createTempDist();
    const result = await BundleAudit.run({
      distDir,
      thresholds: {
        build: {
          bundle_total_kb: 1,
          largest_chunk_kb: 1,
          css_total_kb: 1,
        },
      },
    });
    expect(result.metrics).toBeDefined();
    expect(result.metrics.bundleTotalKb).toBeGreaterThan(0);
  });
});
