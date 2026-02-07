// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest';

let UI: any;

beforeAll(async () => {
  const mod = await import('../cli/ui-helpers.cjs');
  UI = mod.default ?? mod;
});

describe('quality-core ui-helpers', () => {
  it('truncateOutput shortens long output', () => {
    const input = Array.from({ length: 40 }, (_, i) => `line-${i}`).join('\n');
    const out = UI.truncateOutput(input, 10);
    expect(out).toContain('lines truncated');
    expect(out.split('\n').length).toBeLessThanOrEqual(12);
  });

  it('printSummary truncates long warning/error lists', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    UI.printSummary({
      title: 'TEST',
      status: 'pass',
      warnings: ['w1', 'w2', 'w3', 'w4', 'w5'],
      errors: ['e1', 'e2', 'e3', 'e4'],
      duration: 1,
      maxItems: 2,
    });
    const output = logSpy.mock.calls.map(call => call.join(' ')).join('\n');
    expect(output).toContain('... e mais');
    logSpy.mockRestore();
  });
});
