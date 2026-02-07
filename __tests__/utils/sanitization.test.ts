import { describe, it, expect } from 'vitest';
import { sanitizeUrl, sanitizeArticleDescription } from '../../utils/sanitization';

describe('sanitization', () => {
  it('blocks dangerous protocols', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('data:text/html;base64,PHN2Zz4=')).toBe('');
  });

  it('adds https for bare domains', () => {
    expect(sanitizeUrl('example.com')).toBe('https://example.com');
  });

  it('truncates long descriptions', () => {
    const text = 'a'.repeat(400);
    const out = sanitizeArticleDescription(text, 100);
    expect(out.length).toBeLessThanOrEqual(103);
    expect(out.endsWith('...')).toBe(true);
  });
});
