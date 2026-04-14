import { describe, it, expect, vi, beforeEach } from "vitest";
import { getVideoEmbed, getVideoEmbedDetails } from "../../utils/videoEmbed";

describe("videoEmbed", () => {
  beforeEach(() => {
    // Mock window.location to have a null origin to avoid origin param in default tests
    vi.stubGlobal("window", {
      location: {
        origin: null,
        protocol: "http:",
        hostname: "localhost"
      }
    });
  });
  it("creates youtube embed url", () => {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const embed = getVideoEmbedDetails(url);
    expect(embed?.provider).toBe("youtube");
    expect(embed?.id).toBe("dQw4w9WgXcQ");
    expect(embed?.embedUrl).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&enablejsapi=1&playsinline=1&rel=0",
    );
    expect(embed?.mayRequireExternalFallback).toBe(false);
  });

  it("supports youtube shorts, live, embed and short links", () => {
    expect(getVideoEmbed("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&enablejsapi=1&playsinline=1&rel=0",
    );
    expect(getVideoEmbed("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&enablejsapi=1&playsinline=1&rel=0",
    );
    expect(getVideoEmbed("https://youtu.be/dQw4w9WgXcQ?si=test")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&enablejsapi=1&playsinline=1&rel=0",
    );
    expect(
      getVideoEmbedDetails("https://www.youtube.com/embed/dQw4w9WgXcQ")
        ?.provider,
    ).toBe("youtube");
  });

  it("adds origin metadata and desktop fallback hints when context requires it", () => {
    const embed = getVideoEmbedDetails("https://youtu.be/dQw4w9WgXcQ", {
      origin: "https://personalnews.example",
      runtime: "desktop",
    });

    expect(embed?.embedUrl).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&enablejsapi=1&playsinline=1&rel=0&origin=https%3A%2F%2Fpersonalnews.example",
    );
    expect(embed?.mayRequireExternalFallback).toBe(true);
    expect(embed?.externalUrl).toBe("https://youtu.be/dQw4w9WgXcQ");
  });

  it("creates vimeo embed url", () => {
    const url = "https://vimeo.com/123456789";
    const embed = getVideoEmbed(url);
    expect(embed).toContain("player.vimeo.com/video/123456789");
  });

  it("returns null for unsupported urls", () => {
    expect(getVideoEmbed("https://example.com")).toBeNull();
  });
});
