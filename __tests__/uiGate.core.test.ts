import { describe, expect, it } from "vitest";
import {
  createUiGateReport,
  evaluateUiGateReview,
  type UiGateReview,
} from "../quality-core/ui-gate";

const createReview = (
  overrides: Partial<UiGateReview> = {},
): UiGateReview => ({
  artifactId: "promo-home",
  artifactKind: "promo-page",
  artifactLabel: "Promo Home",
  board: "marketing-page",
  notes: [],
  evidence: [],
  scores: {
    purpose: 9.1,
    typography: 9.2,
    consistency: 9.1,
    hierarchy: 9.0,
    layoutDiscipline: 9.0,
    wcag: 9.3,
  },
  criticalFlags: [],
  ...overrides,
});

describe("ui gate", () => {
  it("approves an artifact when all thresholds pass", () => {
    const result = evaluateUiGateReview(createReview());

    expect(result.verdict).toBe("APPROVED_WITH_REMARKS");
    expect(result.blockReasons).toHaveLength(0);
    expect(result.weightedScore).toBeGreaterThanOrEqual(9);
  });

  it("blocks when a core score falls below the minimum", () => {
    const result = evaluateUiGateReview(
      createReview({
        scores: {
          purpose: 8.4,
          typography: 9.2,
          consistency: 9.1,
          hierarchy: 9.0,
          layoutDiscipline: 9.0,
          wcag: 9.3,
        },
      }),
    );

    expect(result.verdict).toBe("BLOCKED");
    expect(result.blockReasons.join(" ")).toContain("purpose score");
  });

  it("blocks when a critical flag is active", () => {
    const result = evaluateUiGateReview(
      createReview({
        criticalFlags: ["duplicate-cta"],
      }),
    );

    expect(result.verdict).toBe("BLOCKED");
    expect(result.blockReasons.join(" ")).toContain("Critical flags active");
  });

  it("creates a report summary with aggregate verdict counts", () => {
    const report = createUiGateReport([
      createReview(),
      createReview({
        artifactId: "promo-layouts",
        artifactLabel: "Promo Layouts",
        scores: {
          purpose: 8.2,
          typography: 8.9,
          consistency: 8.8,
          hierarchy: 8.7,
          layoutDiscipline: 8.6,
          wcag: 9.0,
        },
      }),
    ]);

    expect(report.summary.total).toBe(2);
    expect(report.summary.blocked).toBe(1);
    expect(report.summary.approvedWithRemarks).toBe(1);
  });
});
