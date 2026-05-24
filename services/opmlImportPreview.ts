import type { FeedCategory, FeedSource } from "../types";
import type { OpmlFeed } from "./rssParser";

export type ImportCandidateStatus =
  | "pending"
  | "ready"
  | "duplicate"
  | "duplicate-in-file"
  | "invalid-url"
  | "importing"
  | "imported"
  | "skipped"
  | "failed";

export interface ImportCandidate {
  id: string;
  url: string;
  normalizedUrl: string;
  suggestedTitle?: string;
  titleOverride?: string;
  suggestedCategoryName?: string;
  suggestedCategoryId?: string;
  categoryOverrideCleared?: boolean;
  categoryOverrideId?: string;
  categoryOverrideName?: string;
  hideFromAll?: boolean;
  isDuplicate: boolean;
  duplicateOfUrl?: string;
  isDuplicateInFile: boolean;
  duplicateInFileOfId?: string;
  decision: "import" | "ignore";
  status: ImportCandidateStatus;
  error?: string;
}

export interface BuildImportCandidatesParams {
  opmlFeeds: OpmlFeed[];
  currentFeeds: FeedSource[];
  categories: FeedCategory[];
}

export interface CommitImportCandidatesParams {
  candidates: ImportCandidate[];
  currentFeeds: FeedSource[];
  categories: FeedCategory[];
  categoryIdsByName?: Record<string, string>;
}

export interface CommitImportCandidatesResult {
  feedsToAdd: FeedSource[];
  categoriesToCreate: string[];
  skipped: ImportCandidate[];
  failed: ImportCandidate[];
}

export interface OpmlImportConfirmationFeed {
  id: string;
  title: string;
  url: string;
  categoryLabel: string;
}

export interface OpmlImportConfirmationGroup {
  categoryLabel: string;
  feeds: OpmlImportConfirmationFeed[];
}

export interface OpmlImportConfirmationSummary {
  importCount: number;
  ignoredCount: number;
  duplicateCount: number;
  duplicateInFileCount: number;
  invalidCount: number;
  hiddenFromAllCount: number;
  newCategories: string[];
  groupsByCategory: OpmlImportConfirmationGroup[];
  isLargeImport: boolean;
}

export const OPML_LARGE_IMPORT_THRESHOLD = 50;

export const normalizeCategoryName = (value?: string) =>
  (value || "").trim().replace(/\s+/g, " ").toLowerCase();

export const normalizeImportUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(
      trimmed.startsWith("//") ? `https:${trimmed}` : trimmed,
    );
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
};

const candidateId = (normalizedUrl: string, index: number) => {
  const safeUrl = normalizedUrl || `invalid-${index}`;
  let hash = 0;
  for (let i = 0; i < safeUrl.length; i += 1) {
    hash = (hash << 5) - hash + safeUrl.charCodeAt(i);
    hash |= 0;
  }
  return `opml-${index}-${Math.abs(hash).toString(36)}`;
};

const findCategory = (categories: FeedCategory[], categoryName?: string) => {
  const normalized = normalizeCategoryName(categoryName);
  if (!normalized) return undefined;
  return categories.find(
    (category) => normalizeCategoryName(category.name) === normalized,
  );
};

export function buildImportCandidates({
  opmlFeeds,
  currentFeeds,
  categories,
}: BuildImportCandidatesParams): ImportCandidate[] {
  const existingByUrl = new Map(
    currentFeeds
      .map((feed) => [normalizeImportUrl(feed.url), feed] as const)
      .filter(([normalizedUrl]) => Boolean(normalizedUrl)),
  );
  const firstCandidateByUrl = new Map<string, ImportCandidate>();

  return opmlFeeds.map((feed, index) => {
    const normalizedUrl = normalizeImportUrl(feed.url);
    const id = candidateId(normalizedUrl, index);
    const existingFeed = normalizedUrl
      ? existingByUrl.get(normalizedUrl)
      : undefined;
    const duplicateInFile = normalizedUrl
      ? firstCandidateByUrl.get(normalizedUrl)
      : undefined;
    const category = findCategory(categories, feed.category);

    const base: ImportCandidate = {
      id,
      url: feed.url.trim(),
      normalizedUrl,
      suggestedTitle: feed.title?.trim() || undefined,
      suggestedCategoryName: feed.category?.trim() || undefined,
      suggestedCategoryId: category?.id,
      categoryOverrideCleared: false,
      hideFromAll: false,
      isDuplicate: Boolean(existingFeed),
      duplicateOfUrl: existingFeed?.url,
      isDuplicateInFile: Boolean(duplicateInFile),
      duplicateInFileOfId: duplicateInFile?.id,
      decision: "import",
      status: "ready",
    };

    if (!normalizedUrl) {
      return {
        ...base,
        decision: "ignore",
        status: "invalid-url",
        error: "URL invalida",
      };
    }

    if (duplicateInFile) {
      return {
        ...base,
        decision: "ignore",
        status: "duplicate-in-file",
        error: "Duplicado dentro do arquivo OPML",
      };
    }

    if (existingFeed) {
      const candidate = {
        ...base,
        decision: "ignore" as const,
        status: "duplicate" as const,
        error: "Ja existe na colecao",
      };
      firstCandidateByUrl.set(normalizedUrl, candidate);
      return candidate;
    }

    firstCandidateByUrl.set(normalizedUrl, base);
    return base;
  });
}

const canCommitCandidate = (candidate: ImportCandidate) =>
  candidate.decision === "import" &&
  Boolean(candidate.normalizedUrl) &&
  candidate.status !== "invalid-url" &&
  candidate.status !== "duplicate-in-file";

const getCandidateCategoryName = (candidate: ImportCandidate) => {
  if (candidate.categoryOverrideCleared) return undefined;
  return candidate.categoryOverrideName || candidate.suggestedCategoryName;
};

const getCandidateCategoryId = (candidate: ImportCandidate) => {
  if (candidate.categoryOverrideCleared) return undefined;
  return candidate.categoryOverrideId || candidate.suggestedCategoryId;
};

export function buildOpmlImportConfirmationSummary(
  candidates: ImportCandidate[],
  categories: FeedCategory[],
  threshold = OPML_LARGE_IMPORT_THRESHOLD,
): OpmlImportConfirmationSummary {
  const categoryById = new Map(
    categories.map((category) => [category.id, category] as const),
  );
  const existingCategoryNames = new Set(
    categories.map((category) => normalizeCategoryName(category.name)),
  );
  const newCategories = new Map<string, string>();
  const groupsByCategory = new Map<string, OpmlImportConfirmationFeed[]>();

  const importable = candidates.filter(canCommitCandidate);

  for (const candidate of importable) {
    const categoryId = getCandidateCategoryId(candidate);
    const categoryName = getCandidateCategoryName(candidate);
    const normalizedCategoryName = normalizeCategoryName(categoryName);
    const existingCategory = categoryId
      ? categoryById.get(categoryId)
      : undefined;

    let categoryLabel = "Sem categoria";
    if (existingCategory) {
      categoryLabel = existingCategory.name;
    } else if (categoryName?.trim()) {
      categoryLabel = categoryName.trim();
      if (!existingCategoryNames.has(normalizedCategoryName)) {
        newCategories.set(normalizedCategoryName, categoryName.trim());
      }
    }

    const feeds = groupsByCategory.get(categoryLabel) || [];
    feeds.push({
      id: candidate.id,
      title:
        candidate.titleOverride?.trim() ||
        candidate.suggestedTitle ||
        candidate.url,
      url: candidate.url,
      categoryLabel,
    });
    groupsByCategory.set(categoryLabel, feeds);
  }

  return {
    importCount: importable.length,
    ignoredCount: candidates.filter((candidate) => candidate.decision === "ignore")
      .length,
    duplicateCount: candidates.filter((candidate) => candidate.isDuplicate)
      .length,
    duplicateInFileCount: candidates.filter(
      (candidate) => candidate.isDuplicateInFile,
    ).length,
    invalidCount: candidates.filter(
      (candidate) => candidate.status === "invalid-url",
    ).length,
    hiddenFromAllCount: importable.filter((candidate) => candidate.hideFromAll)
      .length,
    newCategories: Array.from(newCategories.values()),
    groupsByCategory: Array.from(groupsByCategory.entries()).map(
      ([categoryLabel, feeds]) => ({
        categoryLabel,
        feeds,
      }),
    ),
    isLargeImport: importable.length >= threshold,
  };
}

export function commitImportCandidates({
  candidates,
  currentFeeds,
  categories,
  categoryIdsByName = {},
}: CommitImportCandidatesParams): CommitImportCandidatesResult {
  const existingByUrl = new Set(
    currentFeeds.map((feed) => normalizeImportUrl(feed.url)).filter(Boolean),
  );
  const existingCategories = new Set(
    categories.map((category) => normalizeCategoryName(category.name)),
  );
  const categoriesToCreate = new Map<string, string>();
  const failed: ImportCandidate[] = [];
  const skipped: ImportCandidate[] = [];
  const feedsToAdd: FeedSource[] = [];

  for (const candidate of candidates) {
    if (candidate.decision === "ignore") {
      skipped.push({ ...candidate, status: "skipped" });
      continue;
    }

    if (!canCommitCandidate(candidate)) {
      failed.push({
        ...candidate,
        status: "failed",
        error: candidate.error || "Candidato invalido",
      });
      continue;
    }

    if (existingByUrl.has(candidate.normalizedUrl) && !candidate.isDuplicate) {
      skipped.push({
        ...candidate,
        status: "skipped",
        error: "Ja existe na colecao",
      });
      continue;
    }

    const categoryName = getCandidateCategoryName(candidate);
    const normalizedCategoryName = normalizeCategoryName(categoryName);
    const categoryId =
      getCandidateCategoryId(candidate) || categoryIdsByName[normalizedCategoryName];

    if (
      normalizedCategoryName &&
      !categoryId &&
      !existingCategories.has(normalizedCategoryName)
    ) {
      categoriesToCreate.set(normalizedCategoryName, categoryName!.trim());
    }

    feedsToAdd.push({
      url: candidate.url,
      customTitle:
        candidate.titleOverride?.trim() ||
        candidate.suggestedTitle ||
        undefined,
      categoryId,
      hideFromAll: candidate.hideFromAll || undefined,
    });
    existingByUrl.add(candidate.normalizedUrl);
  }

  return {
    feedsToAdd,
    categoriesToCreate: Array.from(categoriesToCreate.values()),
    skipped,
    failed,
  };
}
