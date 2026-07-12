import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../apps/backend/src/security", () => {
  class SecurityValidationError extends Error {
    constructor(
      message: string,
      readonly status = 400,
    ) {
      super(message);
    }
  }
  return {
    SecurityValidationError,
    validateTargetFeedUrl: async (url: string) => new URL(url),
  };
});

import {
  resolveYouTubeFeed,
  YouTubeResolutionError,
} from "../apps/backend/src/youtubeResolver";

const feedXml = `<?xml version="1.0"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>Macho Nacho Productions</title>
    <entry><title>Video</title></entry>
  </feed>`;

describe("backend YouTube resolver", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("resolves a handle from the RSS link and validates its Atom feed", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/@MachoNachoProductions")) {
        return new Response(
          `<link rel="alternate" type="application/rss+xml" href="https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ">`,
          { status: 200, headers: { "content-type": "text/html" } },
        );
      }
      if (url.includes("/feeds/videos.xml")) {
        return new Response(feedXml, {
          status: 200,
          headers: { "content-type": "application/atom+xml" },
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    await expect(
      resolveYouTubeFeed(
        "https://www.youtube.com/@MachoNachoProductions",
        fetchMock as typeof fetch,
      ),
    ).resolves.toMatchObject({
      feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ",
      title: "Macho Nacho Productions",
      method: "html-link",
    });
  });

  it("rejects non-YouTube URLs without making a request", async () => {
    const fetchMock = vi.fn();
    await expect(
      resolveYouTubeFeed("https://example.com/channel", fetchMock as typeof fetch),
    ).rejects.toMatchObject<Partial<YouTubeResolutionError>>({
      status: 400,
      code: "unsupported_youtube_url",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolves a video to its publisher and ignores channels merely mentioned on the page", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/oembed")) {
        return new Response(
          JSON.stringify({
            author_name: "STUDIOCANAL",
            author_url: "https://www.youtube.com/@studiocanalinternational",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (url.includes("/@studiocanalinternational")) {
        return new Response(
          `<link type="application/rss+xml" href="https://www.youtube.com/feeds/videos.xml?channel_id=UCwsZQonex0zei1ZRWdUU8QA">`,
          { status: 200, headers: { "content-type": "text/html" } },
        );
      }
      if (url.includes("/feeds/videos.xml")) {
        return new Response(feedXml.replace("Macho Nacho Productions", "STUDIOCANAL"), {
          status: 200,
          headers: { "content-type": "application/atom+xml" },
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const resolution = await resolveYouTubeFeed(
      "https://www.youtube.com/watch?v=fywNBuzD2SU",
      fetchMock as typeof fetch,
    );
    expect(resolution).toMatchObject({
      feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UCwsZQonex0zei1ZRWdUU8QA",
      title: "STUDIOCANAL",
    });
    expect(resolution.feedUrl).not.toContain("UClkMwShoqUJtuXEEhP8bH7w");
  });

  it("rejects oversized channel pages before reading them", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("small", {
        status: 200,
        headers: { "content-length": String(3 * 1024 * 1024) },
      }),
    );
    await expect(
      resolveYouTubeFeed("https://www.youtube.com/@oversized", fetchMock as typeof fetch),
    ).rejects.toMatchObject<Partial<YouTubeResolutionError>>({
      code: "response_too_large",
    });
  });
});
