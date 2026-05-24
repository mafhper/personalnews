import { describe, expect, it } from "vitest";
import {
  buildOpmlImportConfirmationSummary,
  buildImportCandidates,
  commitImportCandidates,
  normalizeImportUrl,
} from "../services/opmlImportPreview";
import type { FeedCategory, FeedSource } from "../types";

const categories: FeedCategory[] = [
  { id: "tech", name: "Tecnologia", color: "#3B82F6", order: 1 },
];

const currentFeeds: FeedSource[] = [
  { url: "https://example.com/rss", customTitle: "Example" },
];

describe("opmlImportPreview", () => {
  it("normalizes URL keys without dropping query strings", () => {
    expect(normalizeImportUrl(" HTTPS://WWW.EXAMPLE.COM/feed/?a=1#top ")).toBe(
      "https://www.example.com/feed/?a=1",
    );
  });

  it("builds candidates with categories and existing duplicates", () => {
    const candidates = buildImportCandidates({
      opmlFeeds: [
        {
          url: "https://example.com/rss/",
          title: "Existing",
          category: "Tecnologia",
        },
        {
          url: "https://new.example.com/feed",
          title: "New",
          category: "Tecnologia",
        },
      ],
      currentFeeds,
      categories,
    });

    expect(candidates[0]).toMatchObject({
      status: "duplicate",
      decision: "ignore",
      duplicateOfUrl: "https://example.com/rss",
    });
    expect(candidates[1]).toMatchObject({
      status: "ready",
      decision: "import",
      suggestedCategoryId: "tech",
    });
  });

  it("detects duplicates inside the OPML file", () => {
    const candidates = buildImportCandidates({
      opmlFeeds: [
        { url: "https://same.example.com/feed", title: "First" },
        { url: "https://same.example.com/feed/", title: "Second" },
      ],
      currentFeeds: [],
      categories,
    });

    expect(candidates[0].status).toBe("ready");
    expect(candidates[1]).toMatchObject({
      status: "duplicate-in-file",
      decision: "ignore",
      duplicateInFileOfId: candidates[0].id,
    });
  });

  it("keeps invalid URLs out of the committed import", () => {
    const candidates = buildImportCandidates({
      opmlFeeds: [{ url: "not a url", title: "Broken" }],
      currentFeeds: [],
      categories,
    });
    const result = commitImportCandidates({
      candidates: candidates.map((candidate) => ({
        ...candidate,
        decision: "import",
      })),
      currentFeeds: [],
      categories,
    });

    expect(result.feedsToAdd).toHaveLength(0);
    expect(result.failed).toHaveLength(1);
  });

  it("commits partial imports and reports new categories", () => {
    const candidates = buildImportCandidates({
      opmlFeeds: [
        {
          url: "https://new.example.com/feed",
          title: "New",
          category: "Research",
        },
        {
          url: "https://skip.example.com/feed",
          title: "Skip",
        },
      ],
      currentFeeds: [],
      categories,
    }).map((candidate) =>
      candidate.url.includes("skip")
        ? { ...candidate, decision: "ignore" as const }
        : candidate,
    );

    const firstPass = commitImportCandidates({
      candidates,
      currentFeeds: [],
      categories,
    });
    const secondPass = commitImportCandidates({
      candidates,
      currentFeeds: [],
      categories,
      categoryIdsByName: { research: "custom-research" },
    });

    expect(firstPass.categoriesToCreate).toEqual(["Research"]);
    expect(secondPass.feedsToAdd).toEqual([
      {
        url: "https://new.example.com/feed",
        customTitle: "New",
        categoryId: "custom-research",
        hideFromAll: undefined,
      },
    ]);
    expect(secondPass.skipped).toHaveLength(1);
  });

  it("persists imports hidden from All without affecting category assignment", () => {
    const [candidate] = buildImportCandidates({
      opmlFeeds: [
        {
          url: "https://podcast.example.com/feed",
          title: "Podcast",
          category: "Podcasts",
        },
      ],
      currentFeeds: [],
      categories,
    });

    const result = commitImportCandidates({
      candidates: [{ ...candidate, hideFromAll: true }],
      currentFeeds: [],
      categories,
      categoryIdsByName: { podcasts: "podcasts" },
    });

    expect(result.feedsToAdd).toEqual([
      {
        url: "https://podcast.example.com/feed",
        customTitle: "Podcast",
        categoryId: "podcasts",
        hideFromAll: true,
      },
    ]);
  });

  it("honors clearing a suggested category during commit", () => {
    const [candidate] = buildImportCandidates({
      opmlFeeds: [
        {
          url: "https://uncategorized.example.com/feed",
          title: "Uncategorized",
          category: "Tecnologia",
        },
      ],
      currentFeeds: [],
      categories,
    });

    const result = commitImportCandidates({
      candidates: [{ ...candidate, categoryOverrideCleared: true }],
      currentFeeds: [],
      categories,
    });

    expect(result.categoriesToCreate).toEqual([]);
    expect(result.feedsToAdd[0]).toMatchObject({
      url: "https://uncategorized.example.com/feed",
      customTitle: "Uncategorized",
      categoryId: undefined,
    });
  });

  it("builds a final confirmation summary grouped by destination category", () => {
    const candidates = buildImportCandidates({
      opmlFeeds: [
        {
          url: "https://new.example.com/feed",
          title: "New",
          category: "Tecnologia",
        },
        {
          url: "https://research.example.com/feed",
          title: "Research",
          category: "Research",
        },
        {
          url: "not a url",
          title: "Broken",
        },
      ],
      currentFeeds: [],
      categories,
    });

    const summary = buildOpmlImportConfirmationSummary(candidates, categories);

    expect(summary.importCount).toBe(2);
    expect(summary.invalidCount).toBe(1);
    expect(summary.hiddenFromAllCount).toBe(0);
    expect(summary.newCategories).toEqual(["Research"]);
    expect(summary.groupsByCategory).toEqual([
      {
        categoryLabel: "Tecnologia",
        feeds: [
          {
            id: candidates[0].id,
            title: "New",
            url: "https://new.example.com/feed",
            categoryLabel: "Tecnologia",
          },
        ],
      },
      {
        categoryLabel: "Research",
        feeds: [
          {
            id: candidates[1].id,
            title: "Research",
            url: "https://research.example.com/feed",
            categoryLabel: "Research",
          },
        ],
      },
    ]);
  });

  it("marks confirmation summaries as large only above the configured threshold", () => {
    const candidates = buildImportCandidates({
      opmlFeeds: Array.from({ length: 3 }, (_, index) => ({
        url: `https://bulk.example.com/${index}.xml`,
        title: `Bulk ${index}`,
      })),
      currentFeeds: [],
      categories,
    });

    expect(buildOpmlImportConfirmationSummary(candidates, categories, 3).isLargeImport).toBe(
      false,
    );
    expect(buildOpmlImportConfirmationSummary(candidates, categories, 2).isLargeImport).toBe(
      true,
    );
  });
});
