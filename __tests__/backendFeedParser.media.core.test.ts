import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAndParseFeed } from "../apps/backend/src/feedParser";

describe("backend feed parser podcast media extraction", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses podcast-specific images, author, summary and audio metadata", async () => {
    const feed = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:media="http://search.yahoo.com/mrss/">
        <channel>
          <title>Backend Podcast</title>
          <image><url>https://cdn.example.com/channel-art.jpg</url></image>
          <item>
            <title>Backend episode</title>
            <link>https://example.com/backend-episode</link>
            <pubDate>Sun, 17 May 2026 12:00:00 GMT</pubDate>
            <itunes:author>Backend Host</itunes:author>
            <itunes:summary>Backend podcast summary</itunes:summary>
            <itunes:image href="https://cdn.example.com/episode-art.jpg" />
            <media:thumbnail url="https://cdn.example.com/media-thumbnail.jpg" />
            <enclosure url="https://cdn.example.com/audio/backend.mp3" type="audio/mpeg" />
            <itunes:duration>42:12</itunes:duration>
          </item>
        </channel>
      </rss>`;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(feed, {
          status: 200,
          headers: { "content-type": "application/rss+xml" },
        }),
      ),
    );

    const result = await fetchAndParseFeed("https://feeds.example/podcast.xml", {
      validateUrl: async () => undefined,
    });

    expect(result.articles[0]).toMatchObject({
      title: "Backend episode",
      author: "Backend Host",
      description: "Backend podcast summary",
      imageUrl: "https://cdn.example.com/episode-art.jpg",
      audioUrl: "https://cdn.example.com/audio/backend.mp3",
      audioDuration: "42:12",
    });
  });

  it("falls back to channel artwork when an episode has no artwork", async () => {
    const feed = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
        <channel>
          <title>Backend Podcast</title>
          <image><url>https://cdn.example.com/channel-art.jpg</url></image>
          <item>
            <title>Backend episode without image</title>
            <link>https://example.com/backend-episode-no-image</link>
            <description>Episode summary</description>
            <enclosure url="https://cdn.example.com/audio/backend.mp3" type="audio/mpeg" />
          </item>
        </channel>
      </rss>`;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(feed, {
          status: 200,
          headers: { "content-type": "application/rss+xml" },
        }),
      ),
    );

    const result = await fetchAndParseFeed("https://feeds.example/podcast.xml", {
      validateUrl: async () => undefined,
    });

    expect(result.articles[0].imageUrl).toBe("https://cdn.example.com/channel-art.jpg");
  });

  it("keeps absolute podcast media URLs when the episode link falls back to a guid", async () => {
    const feed = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
        <channel>
          <title>Guid Podcast</title>
          <item>
            <title>Guid-only episode</title>
            <description>Episode summary</description>
            <guid isPermaLink="false">episode-guid</guid>
            <itunes:image href="https://cdn.example.com/guid-art.jpg" />
            <enclosure url="https://cdn.example.com/audio/guid.mp3?updated=123" type="audio/mpeg" />
          </item>
        </channel>
      </rss>`;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(feed, {
          status: 200,
          headers: { "content-type": "application/rss+xml" },
        }),
      ),
    );

    const result = await fetchAndParseFeed("https://feeds.example/podcast.xml", {
      validateUrl: async () => undefined,
    });

    expect(result.articles[0]).toMatchObject({
      link: "episode-guid",
      imageUrl: "https://cdn.example.com/guid-art.jpg",
      audioUrl: "https://cdn.example.com/audio/guid.mp3?updated=123",
    });
  });
});
