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
});
