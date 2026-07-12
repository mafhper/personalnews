import { beforeEach, describe, expect, it, vi } from "vitest";
import { feedDiscoveryService } from "../services/feedDiscoveryService";
import { desktopBackendClient } from "../services/desktopBackendClient";

describe("FeedDiscoveryService - YouTube", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {},
      configurable: true,
    });
    vi.spyOn(desktopBackendClient, "isEnabled").mockReturnValue(true);
  });

  it("discovers a channel feed from a handle through the local backend", async () => {
    vi.spyOn(desktopBackendClient, "resolveYouTubeFeed").mockResolvedValue({
      originalUrl: "https://www.youtube.com/@MachoNachoProductions",
      feedUrl:
        "https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ",
      title: "Macho Nacho Productions",
      kind: "channel",
      method: "html-link",
      channelId: "UC4CsqctrGOn4NTz09sAhXwQ",
    });

    const result = await feedDiscoveryService.discoverFromWebsite(
      "https://www.youtube.com/@MachoNachoProductions",
    );

    expect(result.discoveredFeeds[0]).toMatchObject({
      url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ",
      title: "Macho Nacho Productions",
      type: "atom",
      discoveryMethod: "link-tag",
    });
  });

  it("validates a derived channel-id URL through the local backend", async () => {
    const backendSpy = vi.spyOn(desktopBackendClient, "resolveYouTubeFeed").mockResolvedValue({
      originalUrl: "https://www.youtube.com/channel/UC4CsqctrGOn4NTz09sAhXwQ/videos",
      feedUrl:
        "https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ",
      title: "Macho Nacho Productions",
      kind: "channel",
      method: "direct-channel-id",
      channelId: "UC4CsqctrGOn4NTz09sAhXwQ",
      validated: true,
    });
    const result = await feedDiscoveryService.discoverFromWebsite(
      "https://www.youtube.com/channel/UC4CsqctrGOn4NTz09sAhXwQ/videos",
    );

    expect(backendSpy).toHaveBeenCalledOnce();
    expect(result.discoveredFeeds[0]?.url).toBe(
      "https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ",
    );
  });
});
