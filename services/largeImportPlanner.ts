import type { ImportCandidate } from "./opmlImportPreview";
import {
  classifyFeedKind,
  extractHost,
  type FeedKind,
} from "./podcastFeedHeuristics";

export const LARGE_IMPORT_LIMITS = {
  largeImportThreshold: 50,
  veryLargeImportThreshold: 150,
  podcastHeavyThreshold: 30,
  maxAutoWarmupFeeds: 25,
  validationConcurrency: 3,
  podcastValidationConcurrency: 2,
  cacheWarmupConcurrency: 2,
  podcastWarmupConcurrency: 1,
  sameHostConcurrency: 1,
  validationBatchDelayMs: 750,
  cacheWarmupBatchDelayMs: 1500,
} as const;

export type LargeImportAction =
  | "commit-only"
  | "validate-background"
  | "warm-cache-background";

export type LargeImportItemStatus =
  | "queued"
  | "committed"
  | "validation-pending"
  | "validating"
  | "valid"
  | "invalid"
  | "cache-pending"
  | "cache-warming"
  | "cache-warmed"
  | "skipped"
  | "failed";

export type LargeImportWarning =
  | "large-import"
  | "very-large-import"
  | "podcast-heavy-import"
  | "no-auto-warmup";

export interface LargeImportPlanItem {
  candidateId: string;
  url: string;
  normalizedUrl: string;
  title?: string;
  categoryId?: string;
  categoryName?: string;
  kind: FeedKind;
  host: string;
  priority: number;
  decision: "import" | "ignore";
  status: LargeImportItemStatus;
  error?: string;
}

export interface LargeImportPlan {
  id: string;
  createdAt: number;
  totalCandidates: number;
  importableCount: number;
  ignoredCount: number;
  duplicateCount: number;
  invalidCount: number;
  podcastLikelyCount: number;
  standardLikelyCount: number;
  hosts: Array<{ host: string; count: number }>;
  items: LargeImportPlanItem[];
  recommendedAction: LargeImportAction;
  warnings: LargeImportWarning[];
}

export const createLargeImportId = (prefix = "large-import"): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const isLargeImportCount = (count: number): boolean =>
  count >= LARGE_IMPORT_LIMITS.largeImportThreshold;

export const canImportCandidate = (candidate: ImportCandidate): boolean =>
  candidate.decision === "import" &&
  Boolean(candidate.normalizedUrl) &&
  candidate.status !== "invalid-url" &&
  candidate.status !== "duplicate-in-file";

const resolveCandidateTitle = (candidate: ImportCandidate): string | undefined =>
  candidate.titleOverride?.trim() ||
  candidate.suggestedTitle?.trim() ||
  undefined;

const resolveCandidateCategoryName = (
  candidate: ImportCandidate,
): string | undefined => {
  if (candidate.categoryOverrideCleared) return undefined;
  return (
    candidate.categoryOverrideName?.trim() ||
    candidate.suggestedCategoryName?.trim() ||
    undefined
  );
};

const resolveCandidateCategoryId = (
  candidate: ImportCandidate,
): string | undefined => {
  if (candidate.categoryOverrideCleared) return undefined;
  return candidate.categoryOverrideId || candidate.suggestedCategoryId;
};

const resolveRecommendedAction = (importableCount: number): LargeImportAction => {
  if (importableCount >= LARGE_IMPORT_LIMITS.veryLargeImportThreshold) {
    return "commit-only";
  }
  if (importableCount >= LARGE_IMPORT_LIMITS.largeImportThreshold) {
    return "validate-background";
  }
  return "warm-cache-background";
};

const buildWarnings = (
  importableCount: number,
  podcastLikelyCount: number,
): LargeImportWarning[] => {
  const warnings: LargeImportWarning[] = [];
  if (importableCount >= LARGE_IMPORT_LIMITS.largeImportThreshold) {
    warnings.push("large-import");
  }
  if (importableCount >= LARGE_IMPORT_LIMITS.veryLargeImportThreshold) {
    warnings.push("very-large-import");
  }
  if (podcastLikelyCount >= LARGE_IMPORT_LIMITS.podcastHeavyThreshold) {
    warnings.push("podcast-heavy-import");
  }
  if (importableCount >= LARGE_IMPORT_LIMITS.maxAutoWarmupFeeds) {
    warnings.push("no-auto-warmup");
  }
  return warnings;
};

export function buildLargeImportPlan(
  candidates: ImportCandidate[],
  activeCategoryId?: string,
): LargeImportPlan {
  const items: LargeImportPlanItem[] = candidates.map((candidate) => {
    const title = resolveCandidateTitle(candidate);
    const categoryName = resolveCandidateCategoryName(candidate);
    const categoryId = resolveCandidateCategoryId(candidate);
    const kind = classifyFeedKind(candidate.url, categoryName, title);
    const host = extractHost(candidate.url);
    const inActiveCategory = Boolean(
      activeCategoryId && categoryId === activeCategoryId,
    );
    const priority = inActiveCategory ? 0 : kind === "podcast" ? 2 : 1;

    return {
      candidateId: candidate.id,
      url: candidate.url,
      normalizedUrl: candidate.normalizedUrl,
      title,
      categoryId,
      categoryName,
      kind,
      host,
      priority,
      decision: candidate.decision,
      status: canImportCandidate(candidate) ? "queued" : "skipped",
      error: candidate.error,
    };
  });

  const importableItems = items.filter((item) => item.status === "queued");
  const hostCounts = new Map<string, number>();
  for (const item of importableItems) {
    if (!item.host) continue;
    hostCounts.set(item.host, (hostCounts.get(item.host) || 0) + 1);
  }

  const podcastLikelyCount = importableItems.filter(
    (item) => item.kind === "podcast",
  ).length;
  const standardLikelyCount = importableItems.filter(
    (item) => item.kind === "standard",
  ).length;

  return {
    id: createLargeImportId(),
    createdAt: Date.now(),
    totalCandidates: candidates.length,
    importableCount: importableItems.length,
    ignoredCount: candidates.filter((candidate) => candidate.decision === "ignore")
      .length,
    duplicateCount: candidates.filter((candidate) => candidate.isDuplicate)
      .length,
    invalidCount: candidates.filter(
      (candidate) => candidate.status === "invalid-url",
    ).length,
    podcastLikelyCount,
    standardLikelyCount,
    hosts: Array.from(hostCounts.entries())
      .map(([host, count]) => ({ host, count }))
      .sort((a, b) => b.count - a.count || a.host.localeCompare(b.host)),
    items,
    recommendedAction: resolveRecommendedAction(importableItems.length),
    warnings: buildWarnings(importableItems.length, podcastLikelyCount),
  };
}
