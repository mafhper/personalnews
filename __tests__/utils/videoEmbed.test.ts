import { describe, it, expect } from 'vitest';
import { getVideoEmbed, getVideoEmbedDetails } from '../../utils/videoEmbed';

describe('videoEmbed', () => {
  it('creates youtube embed url', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const embed = getVideoEmbedDetails(url);
    expect(embed?.provider).toBe('youtube');
    expect(embed?.id).toBe('dQw4w9WgXcQ');
    expect(embed?.embedUrl).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&modestbranding=1&rel=0',
    );
  });

  it('supports youtube shorts, live, embed and short links', () => {
    expect(getVideoEmbed('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&modestbranding=1&rel=0',
    );
    expect(getVideoEmbed('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&modestbranding=1&rel=0',
    );
    expect(getVideoEmbed('https://youtu.be/dQw4w9WgXcQ?si=test')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&modestbranding=1&rel=0',
    );
    expect(
      getVideoEmbedDetails('https://www.youtube.com/embed/dQw4w9WgXcQ')?.provider,
    ).toBe('youtube');
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
