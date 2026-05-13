import { describe, it, expect } from 'vitest';
import {
  sanitizeUrl,
  sanitizeArticleDescription,
  sanitizeFeedHtmlForRender,
  sanitizeWithDomPurify,
} from '../../utils/sanitization';

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

  it('marks all sanitized article links as external', () => {
    const out = sanitizeWithDomPurify('<a href="https://example.com/story">Read more</a>');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it('sanitizes hostile feed HTML immediately before rendering', () => {
    const out = sanitizeFeedHtmlForRender(`
      <svg><script>alert(1)</script></svg>
      <p style="color:red" onclick="alert(1)">hello</p>
      <a href="javascript:alert(1)">bad link</a>
      <img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" onerror="alert(1)">
    `);

    expect(out).not.toContain('<svg');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('style=');
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('data:image/svg+xml');
    expect(out).toContain('<p>hello</p>');
  });

  it('escapes plain text before converting it to paragraphs', () => {
    const out = sanitizeFeedHtmlForRender('First line\n\n<script>alert(1)</script>');

    expect(out).toContain('<p class="mb-4">First line</p>');
    expect(out).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(out).not.toContain('<script>');
  });
});
