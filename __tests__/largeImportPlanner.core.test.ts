import { describe, expect, it } from "vitest";
import {
  buildLargeImportPlan,
  isLargeImportCount,
} from "../services/largeImportPlanner";
import type { ImportCandidate } from "../services/opmlImportPreview";

const makeCandidate = (
  index: number,
  url: string,
  overrides: Partial<ImportCandidate> = {},
): ImportCandidate => ({
  id: `candidate-${index}`,
  url,
  normalizedUrl: url,
  suggestedTitle: `Feed ${index}`,
  suggestedCategoryName: "Podcasts",
  suggestedCategoryId: "podcasts",
  hideFromAll: false,
  isDuplicate: false,
  isDuplicateInFile: false,
  decision: "import",
  status: "ready",
  ...overrides,
});

const repeatHost = (host: string, count: number, offset: number) =>
  Array.from({ length: count }, (_, index) =>
    makeCandidate(offset + index, `https://${host}/feed-${index}.xml`),
  );

const buildLargePodcastCandidates = () => [
  ...repeatHost("anchor.fm", 63, 0),
  ...repeatHost("www.spreaker.com", 25, 100),
  ...repeatHost("www.omnycontent.com", 23, 200),
  ...repeatHost("feeds.megaphone.fm", 16, 300),
  ...repeatHost("feeds.feedburner.com", 9, 400),
  ...repeatHost("audio.globoradio.globo.com", 6, 500),
  ...repeatHost("feeds.soundcloud.com", 4, 600),
  ...Array.from({ length: 58 }, (_, index) =>
    makeCandidate(700 + index, `https://example-${index}.com/feed.xml`, {
      suggestedCategoryName: "Tecnologia",
      suggestedCategoryId: "tech",
    }),
  ),
];

describe("largeImportPlanner", () => {
  it("uses an inclusive large import threshold", () => {
    expect(isLargeImportCount(49)).toBe(false);
    expect(isLargeImportCount(50)).toBe(true);
  });

  it("builds a safe plan for a 204 feed podcast-heavy import", () => {
    const plan = buildLargeImportPlan(buildLargePodcastCandidates(), "podcasts");

    expect(plan.importableCount).toBe(204);
    expect(plan.podcastLikelyCount).toBeGreaterThanOrEqual(146);
    expect(plan.recommendedAction).toBe("commit-only");
    expect(plan.warnings).toEqual(
      expect.arrayContaining([
        "large-import",
        "very-large-import",
        "podcast-heavy-import",
        "no-auto-warmup",
      ]),
    );
    expect(plan.hosts.slice(0, 3)).toEqual([
      { host: "anchor.fm", count: 63 },
      { host: "www.spreaker.com", count: 25 },
      { host: "www.omnycontent.com", count: 23 },
    ]);
    expect(plan.items[0]).toMatchObject({
      candidateId: "candidate-0",
      categoryId: "podcasts",
      categoryName: "Podcasts",
      kind: "podcast",
      priority: 0,
      status: "queued",
    });
  });

  it("keeps small imports on the normal warm-cache path", () => {
    const candidates = Array.from({ length: 12 }, (_, index) =>
      makeCandidate(index, `https://news-${index}.example.com/feed.xml`, {
        suggestedCategoryName: "Tecnologia",
        suggestedCategoryId: "tech",
      }),
    );

    const plan = buildLargeImportPlan(candidates);

    expect(plan.importableCount).toBe(12);
    expect(plan.recommendedAction).toBe("warm-cache-background");
    expect(plan.warnings).toEqual([]);
  });
});
