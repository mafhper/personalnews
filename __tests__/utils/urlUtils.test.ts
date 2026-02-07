import { describe, it, expect } from 'vitest';
import { normalizeUrl, areUrlsEqual } from '../../utils/urlUtils';

describe('urlUtils', () => {
  it('normalizes urls with missing protocol and trailing slash', () => {
    expect(normalizeUrl('example.com/')).toBe('https://example.com');
  });

  it('compares urls after normalization', () => {
    expect(areUrlsEqual('https://Example.com/path/', 'example.com/path')).toBe(
      true
    );
  });
});
