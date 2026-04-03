import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchFullContent } from "../services/articleFetcher";

describe("articleFetcher fallback handling", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns fallback metadata when the upstream page is a block screen", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        "<html><body><h1>Why have I been blocked?</h1><p>Cloudflare Ray ID: 123</p></body></html>",
        { status: 200, headers: { "content-type": "text/html" } },
      ),
    );

    const result = await fetchFullContent("https://tecnoblog.net/post");

    expect(result.content).toBeNull();
    expect(result.blocked).toBe(true);
    expect(result.usedFallback).toBe(true);
  });
});
