import {
  LARGE_IMPORT_LIMITS,
  type LargeImportItemStatus,
  type LargeImportPlanItem,
} from "./largeImportPlanner";

export interface LargeImportValidationQueueOptions<T> {
  validate: (item: LargeImportPlanItem) => Promise<T>;
  getIsValid?: (result: T) => boolean;
  onStatus?: (item: LargeImportPlanItem, status: LargeImportItemStatus) => void;
  onResult?: (item: LargeImportPlanItem, result: T, isValid: boolean) => void;
  onError?: (item: LargeImportPlanItem, error: unknown) => void;
  onMetrics?: (metrics: {
    maxConcurrencyObserved: number;
    succeeded: number;
    failed: number;
    cancelled: boolean;
  }) => void;
  validationConcurrency?: number;
  podcastValidationConcurrency?: number;
  sameHostConcurrency?: number;
  batchDelayMs?: number;
}

export interface LargeImportValidationQueue {
  start: () => Promise<void>;
  cancel: () => void;
  isCancelled: () => boolean;
}

const wait = (delayMs: number) =>
  new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, delayMs);
  });

const waitUntilVisible = () =>
  new Promise<void>((resolve) => {
    if (typeof document === "undefined" || !document.hidden) {
      resolve();
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        resolve();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
  });

export const createLargeImportValidationQueue = <T>(
  items: LargeImportPlanItem[],
  options: LargeImportValidationQueueOptions<T>,
): LargeImportValidationQueue => {
  const queue = items
    .filter((item) => item.decision === "import" && item.status !== "skipped")
    .slice()
    .sort((a, b) => a.priority - b.priority || a.url.localeCompare(b.url));
  const active = new Set<Promise<void>>();
  const activeHosts = new Map<string, number>();
  let activePodcasts = 0;
  let cancelled = false;
  let succeeded = 0;
  let failed = 0;
  let maxConcurrencyObserved = 0;

  const validationConcurrency =
    options.validationConcurrency ?? LARGE_IMPORT_LIMITS.validationConcurrency;
  const podcastValidationConcurrency =
    options.podcastValidationConcurrency ??
    LARGE_IMPORT_LIMITS.podcastValidationConcurrency;
  const sameHostConcurrency =
    options.sameHostConcurrency ?? LARGE_IMPORT_LIMITS.sameHostConcurrency;
  const batchDelayMs =
    options.batchDelayMs ?? LARGE_IMPORT_LIMITS.validationBatchDelayMs;

  const getIsValid = options.getIsValid ?? ((result: T) => Boolean(result));

  const canStart = (item: LargeImportPlanItem) => {
    if (active.size >= validationConcurrency) return false;
    if (item.kind === "podcast" && activePodcasts >= podcastValidationConcurrency) {
      return false;
    }
    const activeHostCount = item.host ? activeHosts.get(item.host) || 0 : 0;
    return activeHostCount < sameHostConcurrency;
  };

  const findNextIndex = () => queue.findIndex(canStart);

  const markQueuedAsPending = () => {
    for (const item of queue) {
      options.onStatus?.(item, "validation-pending");
    }
  };

  const runItem = (item: LargeImportPlanItem) => {
    options.onStatus?.(item, "validating");
    if (item.host) activeHosts.set(item.host, (activeHosts.get(item.host) || 0) + 1);
    if (item.kind === "podcast") activePodcasts += 1;

    const task = options
      .validate(item)
      .then((result) => {
        const isValid = getIsValid(result);
        options.onStatus?.(item, isValid ? "valid" : "invalid");
        options.onResult?.(item, result, isValid);
        if (isValid) succeeded += 1;
        else failed += 1;
      })
      .catch((error) => {
        failed += 1;
        options.onStatus?.(item, "invalid");
        options.onError?.(item, error);
      })
      .finally(() => {
        active.delete(task);
        if (item.host) {
          const nextHostCount = Math.max(0, (activeHosts.get(item.host) || 1) - 1);
          if (nextHostCount === 0) activeHosts.delete(item.host);
          else activeHosts.set(item.host, nextHostCount);
        }
        if (item.kind === "podcast") {
          activePodcasts = Math.max(0, activePodcasts - 1);
        }
      });

    active.add(task);
    maxConcurrencyObserved = Math.max(maxConcurrencyObserved, active.size);
  };

  return {
    cancel: () => {
      cancelled = true;
    },
    isCancelled: () => cancelled,
    start: async () => {
      while (queue.length > 0 && !cancelled) {
        await waitUntilVisible();
        if (cancelled) break;

        const nextIndex = findNextIndex();
        if (nextIndex === -1) {
          if (active.size === 0) break;
          await Promise.race(Array.from(active));
          continue;
        }

        const [item] = queue.splice(nextIndex, 1);
        runItem(item);
        if (batchDelayMs > 0) {
          await wait(batchDelayMs);
        }
      }

      if (cancelled) {
        markQueuedAsPending();
      }

      await Promise.allSettled(Array.from(active));
      options.onMetrics?.({
        maxConcurrencyObserved,
        succeeded,
        failed,
        cancelled,
      });
    },
  };
};
