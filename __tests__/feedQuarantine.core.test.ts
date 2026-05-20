import { describe, expect, it } from "vitest";
import type { FeedSource } from "../types";
import {
  isQuarantineRecovered,
  markFeedInactive,
  quarantineFeed,
  restoreQuarantinedFeed,
  shouldRecommendQuarantine,
  updateQuarantineAfterValidation,
} from "../utils/feedQuarantine";

const baseFeed: FeedSource = {
  url: "https://example.com/feed.xml",
  categoryId: "tech",
  customTitle: "Example",
  hideFromAll: true,
};

describe("feedQuarantine", () => {
  it("quarantines a feed without losing its category or display preferences", () => {
    const quarantined = quarantineFeed(baseFeed, {
      reason: "Falhas recorrentes",
      failureCountAtEntry: 4,
      lastErrorType: "timeout",
      lastError: "Tempo esgotado",
      now: Date.UTC(2026, 4, 20, 12),
    });

    expect(quarantined).toMatchObject({
      url: baseFeed.url,
      categoryId: "tech",
      customTitle: "Example",
      hideFromAll: true,
      status: "quarantined",
      quarantine: {
        reason: "Falhas recorrentes",
        failureCountAtEntry: 4,
        recoverySuccesses: 0,
        lastErrorType: "timeout",
        lastError: "Tempo esgotado",
      },
    });
    expect(quarantined.quarantine?.nextCheckAt).toBeTruthy();
    expect(quarantined.quarantine?.inactiveAfter).toBeTruthy();
  });

  it("recommends quarantine only for active feeds with repeated failures", () => {
    expect(
      shouldRecommendQuarantine({
        feed: baseFeed,
        history: {
          url: baseFeed.url,
          failures: 3,
          lastError: Date.now(),
          lastErrorType: "network_error",
        },
        isValid: false,
      }),
    ).toBe(true);

    expect(
      shouldRecommendQuarantine({
        feed: { ...baseFeed, status: "quarantined" },
        history: {
          url: baseFeed.url,
          failures: 8,
          lastError: Date.now(),
          lastErrorType: "timeout",
        },
        isValid: false,
      }),
    ).toBe(false);
  });

  it("tracks recovery successes and restores only when explicitly requested", () => {
    const quarantined = quarantineFeed(baseFeed, {
      reason: "Falhas recorrentes",
      failureCountAtEntry: 3,
    });

    const firstSuccess = updateQuarantineAfterValidation(quarantined, {
      isValid: true,
    });
    expect(firstSuccess.status).toBe("quarantined");
    expect(isQuarantineRecovered(firstSuccess)).toBe(false);

    const secondSuccess = updateQuarantineAfterValidation(firstSuccess, {
      isValid: true,
    });
    expect(isQuarantineRecovered(secondSuccess)).toBe(true);

    expect(restoreQuarantinedFeed(secondSuccess)).toEqual(baseFeed);
  });

  it("resets recovery count on failed validation and can mark inactive", () => {
    const recoveredOnce = updateQuarantineAfterValidation(
      quarantineFeed(baseFeed, {
        reason: "Falhas recorrentes",
        failureCountAtEntry: 3,
      }),
      { isValid: true },
    );

    const failedAgain = updateQuarantineAfterValidation(recoveredOnce, {
      isValid: false,
      status: "parse_error",
      error: "Conteúdo inválido",
    });

    expect(failedAgain.quarantine?.recoverySuccesses).toBe(0);
    expect(failedAgain.quarantine?.lastErrorType).toBe("parse_error");

    const inactive = markFeedInactive(failedAgain);
    expect(inactive.status).toBe("inactive");
    expect(inactive.quarantine?.reason).toBe("Falhas recorrentes");
  });
});
