import { describe, expect, it } from "vitest";
import { feedDuplicateDetector } from "../services/feedDuplicateDetector";

describe("feedDuplicateDetector.detectUrlDuplicate", () => {
  it("detects canonical YouTube feeds without requesting content", () => {
    const feedUrl =
      "https://www.youtube.com/feeds/videos.xml?channel_id=UClkMwShoqUJtuXEEhP8bH7w";
    expect(
      feedDuplicateDetector.detectUrlDuplicate(feedUrl, [{ url: feedUrl }]),
    ).toMatchObject({
      isDuplicate: true,
      confidence: 1,
      reason: "Identical normalized URLs",
    });
  });

  it("returns immediately when no normalized URL matches", () => {
    expect(
      feedDuplicateDetector.detectUrlDuplicate(
        "https://www.youtube.com/feeds/videos.xml?channel_id=UClkMwShoqUJtuXEEhP8bH7w",
        [{ url: "https://example.com/feed.xml" }],
      ),
    ).toMatchObject({ isDuplicate: false, reason: "No normalized URL match" });
  });
});
