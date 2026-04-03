import { describe, it, expect } from 'vitest';
import { getVideoEmbed, getVideoEmbedDetails } from '../../utils/videoEmbed';

describe('videoEmbed', () => {
  it('creates youtube embed url', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const embed = getVideoEmbed(url);
    expect(embed).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('supports youtube shorts, live, embed and short links', () => {
    expect(getVideoEmbed('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toContain(
      'youtube.com/embed/dQw4w9WgXcQ',
    );
    expect(getVideoEmbed('https://www.youtube.com/live/dQw4w9WgXcQ')).toContain(
      'youtube.com/embed/dQw4w9WgXcQ',
    );
    expect(getVideoEmbed('https://youtu.be/dQw4w9WgXcQ?si=test')).toContain(
      'youtube.com/embed/dQw4w9WgXcQ',
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
