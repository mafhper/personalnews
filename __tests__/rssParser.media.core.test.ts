import { describe, expect, it } from "vitest";
import { parseXmlResponse } from "../services/rssParser";

describe("rssParser media extraction", () => {
  it("extracts Science-like media thumbnails and content images", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
        <channel>
          <title>Science</title>
          <item>
            <title>Research update</title>
            <link>https://www.science.org/content/article/research-update</link>
            <pubDate>Sun, 17 May 2026 12:00:00 GMT</pubDate>
            <description><![CDATA[<p>Resumo</p><img src="/cms/10.1126/science.sample/image.jpg" />]]></description>
            <media:thumbnail url="https://www.science.org/cms/asset/thumb.jpg" width="800" />
          </item>
        </channel>
      </rss>`;

    const result = parseXmlResponse(xml, "https://www.science.org/action/showFeed?feed=rss");

    expect(result.title).toBe("Science");
    expect(result.articles[0].imageUrl).toContain("science.org");
  });

  it("extracts podcast enclosure audio and duration", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
        <channel>
          <title>Podcast Feed</title>
          <item>
            <title>Episode one</title>
            <link>https://example.com/episode-one</link>
            <pubDate>Sun, 17 May 2026 12:00:00 GMT</pubDate>
            <description>Episode summary</description>
            <enclosure url="https://cdn.example.com/audio/episode-one.mp3" type="audio/mpeg" length="123" />
            <itunes:duration>42:12</itunes:duration>
          </item>
        </channel>
      </rss>`;

    const result = parseXmlResponse(xml, "https://example.com/podcast.rss");

    expect(result.articles[0]).toMatchObject({
      audioUrl: "https://cdn.example.com/audio/episode-one.mp3",
      audioDuration: "42:12",
    });
  });

  it("prefers episode itunes images and podcast summary metadata", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
        <channel>
          <title>Podcast Feed</title>
          <itunes:image href="https://cdn.example.com/channel-art.jpg" />
          <item>
            <title>Episode with artwork</title>
            <link>https://example.com/episode-with-artwork</link>
            <pubDate>Sun, 17 May 2026 12:00:00 GMT</pubDate>
            <itunes:author>Host Name</itunes:author>
            <itunes:summary>Podcast-specific summary</itunes:summary>
            <description><![CDATA[<p>Generic summary</p><img src="https://cdn.example.com/html-large.jpg" />]]></description>
            <itunes:image href="https://cdn.example.com/episode-art.jpg" />
            <enclosure url="https://cdn.example.com/audio/episode.mp3" type="audio/mpeg" />
            <itunes:duration>4174</itunes:duration>
          </item>
        </channel>
      </rss>`;

    const result = parseXmlResponse(xml, "https://example.com/podcast.rss");

    expect(result.articles[0]).toMatchObject({
      author: "Host Name",
      description: "Podcast-specific summary",
      imageUrl: "https://cdn.example.com/episode-art.jpg",
      audioDuration: "4174",
    });
  });

  it("falls back from media thumbnails to channel artwork for podcast images", () => {
    const withMediaThumbnail = `<?xml version="1.0"?>
      <rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:media="http://search.yahoo.com/mrss/">
        <channel>
          <title>Podcast Feed</title>
          <image><url>https://cdn.example.com/channel-art.jpg</url></image>
          <item>
            <title>Episode with media thumbnail</title>
            <link>https://example.com/episode-media</link>
            <description>Episode summary</description>
            <media:content url="https://cdn.example.com/media-content.jpg" medium="image" />
            <media:thumbnail url="https://cdn.example.com/media-thumbnail.jpg" />
            <enclosure url="https://cdn.example.com/audio/media.mp3" type="audio/mpeg" />
          </item>
        </channel>
      </rss>`;
    const withoutEpisodeImage = `<?xml version="1.0"?>
      <rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
        <channel>
          <title>Podcast Feed</title>
          <image><url>https://cdn.example.com/channel-art.jpg</url></image>
          <item>
            <title>Episode with channel fallback</title>
            <link>https://example.com/episode-channel</link>
            <description>Episode summary</description>
            <enclosure url="https://cdn.example.com/audio/channel.mp3" type="audio/mpeg" />
          </item>
        </channel>
      </rss>`;

    const mediaResult = parseXmlResponse(withMediaThumbnail, "https://example.com/podcast.rss");
    const channelResult = parseXmlResponse(withoutEpisodeImage, "https://example.com/podcast.rss");

    expect(mediaResult.articles[0].imageUrl).toBe("https://cdn.example.com/media-thumbnail.jpg");
    expect(channelResult.articles[0].imageUrl).toBe("https://cdn.example.com/channel-art.jpg");
  });

  it("reads channel artwork from direct children only", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
        <channel>
          <title>Podcast Feed</title>
          <image><url>https://cdn.example.com/channel-art.jpg</url></image>
          <item>
            <title>Episode with own art</title>
            <link>https://example.com/episode-own-art</link>
            <description>Episode summary</description>
            <itunes:image href="https://cdn.example.com/episode-art.jpg" />
            <enclosure url="https://cdn.example.com/audio/own-art.mp3" type="audio/mpeg" />
          </item>
          <item>
            <title>Episode with channel art</title>
            <link>https://example.com/episode-channel-art</link>
            <description>Episode summary</description>
            <enclosure url="https://cdn.example.com/audio/channel-art.mp3" type="audio/mpeg" />
          </item>
        </channel>
      </rss>`;

    const result = parseXmlResponse(xml, "https://example.com/podcast.rss");

    expect(result.articles[0].imageUrl).toBe("https://cdn.example.com/episode-art.jpg");
    expect(result.articles[1].imageUrl).toBe("https://cdn.example.com/channel-art.jpg");
  });

  it("tries the next podcast image when the preferred image is rejected", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:media="http://search.yahoo.com/mrss/">
        <channel>
          <title>Podcast Feed</title>
          <item>
            <title>Episode with rejected preferred art</title>
            <link>https://example.com/episode-rejected-art</link>
            <description>Episode summary</description>
            <itunes:image href="https://example.com/artwork" />
            <media:thumbnail url="https://cdn.example.com/media-thumbnail.jpg" />
            <enclosure url="https://cdn.example.com/audio/rejected-art.mp3" type="audio/mpeg" />
          </item>
        </channel>
      </rss>`;

    const result = parseXmlResponse(xml, "https://example.com/podcast.rss");

    expect(result.articles[0].imageUrl).toBe("https://cdn.example.com/media-thumbnail.jpg");
  });
});
