import { describe, expect, it } from "vitest";
import {
  extractYouTubeFeedFromHtml,
  parseYouTubeUrl,
  resolutionFromDirectDescriptor,
} from "../shared/youtubeFeedResolver";

describe("YouTube feed URL resolution", () => {
  it.each([
    [
      "https://www.youtube.com/channel/UC4CsqctrGOn4NTz09sAhXwQ/videos",
      "https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ",
    ],
    [
      "youtube.com/playlist?list=PL1234567890_example",
      "https://www.youtube.com/feeds/videos.xml?playlist_id=PL1234567890_example",
    ],
    [
      "https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ",
      "https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ",
    ],
  ])("derives canonical feeds from %s", (input, expected) => {
    const descriptor = parseYouTubeUrl(input);
    expect(descriptor).not.toBeNull();
    expect(resolutionFromDirectDescriptor(descriptor!)?.feedUrl).toBe(expected);
  });

  it.each([
    ["https://www.youtube.com/@MachoNachoProductions/videos", "handle"],
    ["https://www.youtube.com/user/legacy-user", "username"],
    ["https://www.youtube.com/c/LegacyCustom", "custom"],
    ["https://youtu.be/eqEc3WgZO9c", "video"],
    ["https://www.youtube.com/shorts/eqEc3WgZO9c", "video"],
  ])("recognizes %s as %s", (input, kind) => {
    expect(parseYouTubeUrl(input)?.kind).toBe(kind);
  });

  it("rejects lookalike and malformed hosts", () => {
    expect(parseYouTubeUrl("https://youtube.com.evil.example/@channel")).toBeNull();
    expect(parseYouTubeUrl("javascript:alert(1)")).toBeNull();
  });

  it("extracts the RSS link regardless of attribute order", () => {
    const html = `
      <html><head>
        <link href="https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ&amp;ignored=1"
          title="RSS" type="application/rss+xml" rel="alternate">
      </head></html>`;
    const resolution = extractYouTubeFeedFromHtml(html, "https://youtube.com/@test");
    expect(resolution).toMatchObject({
      feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ",
      method: "html-link",
      channelId: "UC4CsqctrGOn4NTz09sAhXwQ",
    });
  });

  it("falls back to a channelId embedded in JSON", () => {
    const html = `<script>var data = {"channelId":"UC4CsqctrGOn4NTz09sAhXwQ"};</script>`;
    expect(
      extractYouTubeFeedFromHtml(html, "https://youtube.com/@test"),
    ).toMatchObject({
      feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ",
      method: "html-channel-id",
    });
  });
});
