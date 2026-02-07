import { describe, it, expect, vi, beforeEach } from 'vitest';
import { feedDiscoveryService } from '../services/feedDiscoveryService';
import { proxyManager } from '../services/proxyManager';

describe('FeedDiscoveryService - YouTube', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mocks if any
    global.fetch = vi.fn();
  });

  it('should discover feed from YouTube video URL by extracting channelId from meta tag', async () => {
    const videoUrl = 'https://www.youtube.com/watch?v=eqEc3WgZO9c';
    const channelId = 'UC34Qdd5Z5KN30A8aJ2eIMPA';
    const expectedFeedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    // Mock HTML content simulating a YouTube video page with meta tag
    const mockVideoPageHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta itemprop="channelId" content="${channelId}">
          <title>Test Video</title>
        </head>
        <body>
           <div>Some content</div>
        </body>
      </html>
    `;

    // Mock Feed XML content
    const mockFeedXml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Think Story</title>
        <entry>
          <title>Video 1</title>
        </entry>
      </feed>
    `;

    // Mock proxyManager to handle both requests
    vi.spyOn(proxyManager, 'tryProxiesWithFailover').mockImplementation(async (url) => {
      if (url.includes('watch?v=')) {
        return {
          content: mockVideoPageHtml,
          proxyUsed: 'TestProxy',
          attempts: []
        };
      } else if (url.includes('feeds/videos.xml')) {
        return {
          content: mockFeedXml,
          proxyUsed: 'TestProxy',
          attempts: []
        };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    // Mock fetch to fail so it falls back to proxyManager (or just let it fail if not mocked properly, but safer to mock)
    global.fetch = vi.fn().mockRejectedValue(new Error('Direct fetch failed'));

    const result = await feedDiscoveryService.discoverFromWebsite(videoUrl);

    expect(result.discoveredFeeds).toHaveLength(1);
    expect(result.discoveredFeeds[0].url).toBe(expectedFeedUrl);
    expect(result.discoveredFeeds[0].type).toBe('atom');
    expect(result.discoveredFeeds[0].title).toBe('Think Story');
  });

  it('should discover feed from YouTube video URL using JSON config fallback', async () => {
    const videoUrl = 'https://www.youtube.com/watch?v=anothervideo';
    const channelId = 'UC_AnotherChannelID';
    const expectedFeedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    // Mock HTML content with JSON config instead of meta tag
    const mockVideoPageHtml = `
      <html>
        <body>
        <script>
          var ytInitialPlayerResponse = {
            "microformat": {
              "playerMicroformatRenderer": {
                "channelId": "${channelId}"
              }
            }
          };
        </script>
        </body>
      </html>
    `;

    const mockFeedXml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Another Channel</title>
      </feed>
    `;

    vi.spyOn(proxyManager, 'tryProxiesWithFailover').mockImplementation(async (url) => {
      if (url.includes('watch?v=')) {
        return {
          content: mockVideoPageHtml,
          proxyUsed: 'TestProxy',
          attempts: []
        };
      } else if (url.includes('feeds/videos.xml')) {
        return {
          content: mockFeedXml,
          proxyUsed: 'TestProxy',
          attempts: []
        };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    global.fetch = vi.fn().mockRejectedValue(new Error('Direct fetch failed'));

    const result = await feedDiscoveryService.discoverFromWebsite(videoUrl);

    expect(result.discoveredFeeds).toHaveLength(1);
    expect(result.discoveredFeeds[0].url).toBe(expectedFeedUrl);
  });
});
