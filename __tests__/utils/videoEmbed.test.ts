import { describe, it, expect } from 'vitest';
import { getVideoEmbed } from '../../utils/videoEmbed';

describe('videoEmbed', () => {
  it('creates youtube embed url', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const embed = getVideoEmbed(url);
    expect(embed).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('creates vimeo embed url', () => {
    const url = 'https://vimeo.com/123456789';
    const embed = getVideoEmbed(url);
    expect(embed).toContain('player.vimeo.com/video/123456789');
  });

  it('returns null for unsupported urls', () => {
    expect(getVideoEmbed('https://example.com')).toBeNull();
  });
});
