// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

let loader: any;

beforeAll(async () => {
  const mod = await import('../scripts/performance-gate/loadReport.cjs');
  loader = mod.default ?? mod;
});

function tempFile(name: string, content: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lh-report-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, content, 'utf8');
  return { dir, file };
}

describe('performance-gate loadReport', () => {
  it('loads JSON report', () => {
    const payload = {
      configSettings: { formFactor: 'desktop' },
      categories: { performance: { score: 0.8 }, accessibility: { score: 0.9 } },
      audits: { 'first-contentful-paint': { numericValue: 1200 } },
    };
    const { dir, file } = tempFile('report.json', JSON.stringify(payload));
    const report = loader.loadReport(file);
    expect(report.categories.performance.score).toBe(0.8);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('loads HTML report with embedded JSON', () => {
    const payload = { configSettings: { screenEmulation: { mobile: true } } };
    const html = `<!doctype html><script>window.__LIGHTHOUSE_JSON__ = ${JSON.stringify(payload)};</script>`;
    const { dir, file } = tempFile('report.html', html);
    const report = loader.loadReport(file);
    expect(loader.getFormFactor(report)).toBe('mobile');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('extracts key metrics', () => {
    const report = {
      audits: {
        'first-contentful-paint': { numericValue: 1200 },
        'largest-contentful-paint': { numericValue: 2000 },
        'total-blocking-time': { numericValue: 150 },
        'cumulative-layout-shift': { numericValue: 0.05 },
        'speed-index': { numericValue: 1800 },
        'interactive': { numericValue: 2500 },
        'max-potential-fid': { numericValue: 90 },
      },
      categories: {
        performance: { score: 0.7 },
        accessibility: { score: 0.9 },
        'best-practices': { score: 0.8 },
        seo: { score: 0.95 },
      },
    };
    const metrics = loader.extractMetrics(report);
    expect(metrics.lcp).toBe(2000);
    expect(metrics.performanceScore).toBe(0.7);
  });
});
