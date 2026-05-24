import {
  createLargeImportId,
  LARGE_IMPORT_LIMITS,
  type LargeImportPlan,
} from "./largeImportPlanner";

export interface LargeImportSession {
  id: string;
  startedAt: number;
  source: "opml";
  fileName?: string;
  total: number;
  committed: number;
  skipped: number;
  failed: number;
  pendingValidationUrls: string[];
  pendingWarmupUrls: string[];
  status: "committed" | "validating" | "warming-cache" | "completed" | "cancelled";
}

export interface LargeImportMetrics {
  sessionId: string;
  totalFeeds: number;
  podcastFeeds: number;
  standardFeeds: number;
  commitDurationMs: number;
  validationDurationMs: number;
  validationCancelled: boolean;
  validationSucceeded: number;
  validationFailed: number;
  warmupFeeds: number;
  warmupDurationMs: number;
  backendCircuitOpenedDuringSession: boolean;
  maxConcurrencyObserved: number;
  peakRequestsPerMinute: number;
}

const LARGE_IMPORT_SESSION_KEY = "personalnews-large-import-session-v1";

const getSessionStorage = (): Storage | null =>
  typeof window === "undefined" ? null : window.sessionStorage;

export const createLargeImportSession = (
  plan: LargeImportPlan,
  result: { committed: number; skipped: number; failed: number },
  options: { fileName?: string } = {},
): LargeImportSession => {
  const importableUrls = plan.items
    .filter((item) => item.status === "queued")
    .sort((a, b) => a.priority - b.priority)
    .map((item) => item.url);

  return {
    id: createLargeImportId("large-import-session"),
    startedAt: Date.now(),
    source: "opml",
    fileName: options.fileName,
    total: plan.importableCount,
    committed: result.committed,
    skipped: result.skipped,
    failed: result.failed,
    pendingValidationUrls: importableUrls,
    pendingWarmupUrls: importableUrls.slice(
      0,
      LARGE_IMPORT_LIMITS.maxAutoWarmupFeeds,
    ),
    status: "committed",
  };
};

export const saveLargeImportSession = (session: LargeImportSession): void => {
  getSessionStorage()?.setItem(LARGE_IMPORT_SESSION_KEY, JSON.stringify(session));
};

export const readLargeImportSession = (): LargeImportSession | null => {
  const raw = getSessionStorage()?.getItem(LARGE_IMPORT_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LargeImportSession;
    if (!parsed?.id || !Array.isArray(parsed.pendingValidationUrls)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearLargeImportSession = (): void => {
  getSessionStorage()?.removeItem(LARGE_IMPORT_SESSION_KEY);
};

export const updateLargeImportSession = (
  session: LargeImportSession,
  updates: Partial<LargeImportSession>,
): LargeImportSession => {
  const next = { ...session, ...updates };
  saveLargeImportSession(next);
  return next;
};

export const buildLargeImportWarmupUrls = (
  plan: LargeImportPlan,
  limit = LARGE_IMPORT_LIMITS.maxAutoWarmupFeeds,
): string[] =>
  plan.items
    .filter((item) => item.status === "queued")
    .sort((a, b) => a.priority - b.priority || a.url.localeCompare(b.url))
    .slice(0, limit)
    .map((item) => item.url);

export const createInitialLargeImportMetrics = (
  session: LargeImportSession,
  plan: LargeImportPlan,
  commitDurationMs: number,
): LargeImportMetrics => ({
  sessionId: session.id,
  totalFeeds: plan.importableCount,
  podcastFeeds: plan.podcastLikelyCount,
  standardFeeds: plan.standardLikelyCount,
  commitDurationMs,
  validationDurationMs: -1,
  validationCancelled: false,
  validationSucceeded: 0,
  validationFailed: 0,
  warmupFeeds: 0,
  warmupDurationMs: -1,
  backendCircuitOpenedDuringSession: false,
  maxConcurrencyObserved: 0,
  peakRequestsPerMinute: 0,
});

export const logLargeImportMetrics = (metrics: LargeImportMetrics): void => {
  console.info("[LargeImport] session metrics", metrics);
};
