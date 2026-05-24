import { describe, expect, it, vi } from "vitest";
import {
  buildLargeImportWarmupUrls,
  createLargeImportSession,
  readLargeImportSession,
  saveLargeImportSession,
} from "../services/largeImportQueue";
import {
  buildLargeImportPlan,
  type LargeImportPlanItem,
} from "../services/largeImportPlanner";
import { createLargeImportValidationQueue } from "../services/largeImportValidationQueue";
import type { ImportCandidate } from "../services/opmlImportPreview";

const makeCandidate = (
  index: number,
  host: string,
  categoryId = "podcasts",
): ImportCandidate => ({
  id: `candidate-${index}`,
  url: `https://${host}/feed-${index}.xml`,
  normalizedUrl: `https://${host}/feed-${index}.xml`,
  suggestedTitle: `Feed ${index}`,
  suggestedCategoryName: categoryId === "podcasts" ? "Podcasts" : "Tecnologia",
  suggestedCategoryId: categoryId,
  hideFromAll: false,
  isDuplicate: false,
  isDuplicateInFile: false,
  decision: "import",
  status: "ready",
});

describe("largeImportQueue", () => {
  it("creates and restores a session from sessionStorage", () => {
    const plan = buildLargeImportPlan([
      makeCandidate(1, "anchor.fm"),
      makeCandidate(2, "news.example.com", "tech"),
    ]);

    const session = createLargeImportSession(plan, {
      committed: 2,
      skipped: 0,
      failed: 0,
    });
    saveLargeImportSession(session);

    expect(readLargeImportSession()).toMatchObject({
      id: session.id,
      source: "opml",
      total: 2,
      committed: 2,
      status: "committed",
      pendingValidationUrls: [
        "https://news.example.com/feed-2.xml",
        "https://anchor.fm/feed-1.xml",
      ],
    });
  });

  it("limits warmup URLs to the first prioritized feeds", () => {
    const plan = buildLargeImportPlan(
      Array.from({ length: 30 }, (_, index) =>
        makeCandidate(index, index % 2 === 0 ? "anchor.fm" : "news.example.com"),
      ),
    );

    expect(buildLargeImportWarmupUrls(plan)).toHaveLength(25);
  });
});

describe("largeImportValidationQueue", () => {
  it("respects total, podcast and same-host concurrency", async () => {
    const items: LargeImportPlanItem[] = [
      {
        candidateId: "a",
        url: "https://anchor.fm/a.xml",
        normalizedUrl: "https://anchor.fm/a.xml",
        kind: "podcast",
        host: "anchor.fm",
        priority: 1,
        decision: "import",
        status: "queued",
      },
      {
        candidateId: "b",
        url: "https://anchor.fm/b.xml",
        normalizedUrl: "https://anchor.fm/b.xml",
        kind: "podcast",
        host: "anchor.fm",
        priority: 1,
        decision: "import",
        status: "queued",
      },
      {
        candidateId: "c",
        url: "https://feeds.megaphone.fm/c.xml",
        normalizedUrl: "https://feeds.megaphone.fm/c.xml",
        kind: "podcast",
        host: "feeds.megaphone.fm",
        priority: 1,
        decision: "import",
        status: "queued",
      },
      {
        candidateId: "d",
        url: "https://news.example.com/d.xml",
        normalizedUrl: "https://news.example.com/d.xml",
        kind: "standard",
        host: "news.example.com",
        priority: 1,
        decision: "import",
        status: "queued",
      },
    ];
    const activeByHost = new Map<string, number>();
    let active = 0;
    let activePodcasts = 0;
    let maxActive = 0;
    let maxPodcasts = 0;
    let maxAnchor = 0;

    const queue = createLargeImportValidationQueue(items, {
      batchDelayMs: 1,
      validationConcurrency: 3,
      podcastValidationConcurrency: 2,
      sameHostConcurrency: 1,
      validate: async (item) => {
        active += 1;
        if (item.kind === "podcast") activePodcasts += 1;
        activeByHost.set(item.host, (activeByHost.get(item.host) || 0) + 1);
        maxActive = Math.max(maxActive, active);
        maxPodcasts = Math.max(maxPodcasts, activePodcasts);
        maxAnchor = Math.max(maxAnchor, activeByHost.get("anchor.fm") || 0);
        await new Promise((resolve) => setTimeout(resolve, 8));
        active -= 1;
        if (item.kind === "podcast") activePodcasts -= 1;
        activeByHost.set(item.host, (activeByHost.get(item.host) || 1) - 1);
        return { isValid: true };
      },
      getIsValid: (result) => result.isValid,
    });

    await queue.start();

    expect(maxActive).toBeLessThanOrEqual(3);
    expect(maxPodcasts).toBeLessThanOrEqual(2);
    expect(maxAnchor).toBe(1);
  });

  it("marks queued items as validation-pending after cancellation", async () => {
    const statuses = new Map<string, string>();
    let queue: ReturnType<typeof createLargeImportValidationQueue<{ isValid: boolean }>>;
    queue = createLargeImportValidationQueue(
      [makeCandidate(1, "anchor.fm"), makeCandidate(2, "anchor.fm")].map(
        (candidate) => buildLargeImportPlan([candidate]).items[0],
      ),
      {
        batchDelayMs: 1,
        sameHostConcurrency: 1,
        validate: async () => {
          queue.cancel();
          return { isValid: true };
        },
        getIsValid: (result) => result.isValid,
        onStatus: (item, status) => statuses.set(item.candidateId, status),
      },
    );

    await queue.start();

    expect(Array.from(statuses.values())).toContain("validation-pending");
  });

  it("reports queue metrics", async () => {
    const onMetrics = vi.fn();
    const queue = createLargeImportValidationQueue(
      [buildLargeImportPlan([makeCandidate(1, "anchor.fm")]).items[0]],
      {
        batchDelayMs: 0,
        validate: async () => ({ isValid: true }),
        getIsValid: (result) => result.isValid,
        onMetrics,
      },
    );

    await queue.start();

    expect(onMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        succeeded: 1,
        failed: 0,
        cancelled: false,
      }),
    );
  });
});
