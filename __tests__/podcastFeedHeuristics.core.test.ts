import { describe, expect, it } from "vitest";
import {
  classifyFeedKind,
  extractHost,
} from "../services/podcastFeedHeuristics";

describe("podcastFeedHeuristics", () => {
  it("classifies common podcast hosts from large OPML imports", () => {
    const podcastUrls = [
      "https://anchor.fm/s/abc/podcast/rss",
      "https://www.spreaker.com/show/123/episodes/feed",
      "https://www.omnycontent.com/d/playlist/show/podcast.rss",
      "https://feeds.megaphone.fm/ABC123",
      "https://feeds.soundcloud.com/users/123/sounds.rss",
      "https://audio.globoradio.globo.com/podcast/feed.xml",
      "https://rss.art19.com/meu-podcast",
      "https://feeds.transistor.fm/meu-show",
      "https://feeds.acast.com/public/shows/123",
    ];

    expect(podcastUrls.map((url) => classifyFeedKind(url))).toEqual(
      podcastUrls.map(() => "podcast"),
    );
  });

  it("uses category and title hints without forcing normal news feeds into podcast kind", () => {
    expect(classifyFeedKind("https://mynewsblog.com/feed.xml")).toBe("standard");
    expect(
      classifyFeedKind(
        "https://example.com/rss.xml",
        undefined,
        "Podcast de tecnologia",
      ),
    ).toBe("podcast");
  });

  it("extracts normalized hosts safely", () => {
    expect(extractHost("https://anchor.fm/s/abc")).toBe("anchor.fm");
    expect(extractHost("invalid-url")).toBe("");
  });
});
