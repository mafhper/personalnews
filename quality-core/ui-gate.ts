import fs from "node:fs";
import path from "node:path";
import type {
  UiGateDimension,
  UiGateReport,
  UiGateReview,
  UiGateReviewResult,
  UiGateVerdict,
} from "./quality-schema";

export type {
  UiGateDimension,
  UiGateReport,
  UiGateReview,
  UiGateReviewResult,
  UiGateVerdict,
} from "./quality-schema";

export const UI_GATE_WEIGHTS: Record<UiGateDimension, number> = {
  purpose: 0.25,
  typography: 0.2,
  consistency: 0.2,
  hierarchy: 0.15,
  layoutDiscipline: 0.1,
  wcag: 0.1,
};

export const UI_GATE_THRESHOLD = {
  minimumAverage: 9,
  minimumCoreScore: 8.5,
  minimumWcagScore: 9,
};

const roundScore = (value: number) => Math.round(value * 100) / 100;

const ensureScoreRange = (
  artifactLabel: string,
  scores: Record<UiGateDimension, number>,
) => {
  (Object.entries(scores) as Array<[UiGateDimension, number]>).forEach(
    ([dimension, score]) => {
      if (score < 0 || score > 10) {
        throw new Error(
          `Invalid ${dimension} score for ${artifactLabel}: ${score}. Expected value between 0 and 10.`,
        );
      }
    },
  );
};

export const evaluateUiGateReview = (
  review: UiGateReview,
): UiGateReviewResult => {
  ensureScoreRange(review.artifactLabel, review.scores);

  const weightedScore = roundScore(
    (Object.entries(UI_GATE_WEIGHTS) as Array<[UiGateDimension, number]>).reduce(
      (accumulator, [dimension, weight]) =>
        accumulator + review.scores[dimension] * weight,
      0,
    ),
  );

  const blockReasons: string[] = [];

  if (weightedScore < UI_GATE_THRESHOLD.minimumAverage) {
    blockReasons.push(
      `Weighted score ${weightedScore.toFixed(2)} is below ${UI_GATE_THRESHOLD.minimumAverage.toFixed(1)}.`,
    );
  }

  (["purpose", "typography", "consistency"] as const).forEach((dimension) => {
    if (review.scores[dimension] < UI_GATE_THRESHOLD.minimumCoreScore) {
      blockReasons.push(
        `${dimension} score ${review.scores[dimension].toFixed(2)} is below ${UI_GATE_THRESHOLD.minimumCoreScore.toFixed(1)}.`,
      );
    }
  });

  if (review.scores.wcag < UI_GATE_THRESHOLD.minimumWcagScore) {
    blockReasons.push(
      `wcag score ${review.scores.wcag.toFixed(2)} is below ${UI_GATE_THRESHOLD.minimumWcagScore.toFixed(1)}.`,
    );
  }

  if (review.criticalFlags.length > 0) {
    blockReasons.push(
      `Critical flags active: ${review.criticalFlags.join(", ")}.`,
    );
  }

  const verdict: UiGateVerdict =
    blockReasons.length > 0
      ? "BLOCKED"
      : weightedScore >= 9.4
        ? "APPROVED"
        : "APPROVED_WITH_REMARKS";

  return {
    ...review,
    weightedScore,
    verdict,
    blockReasons,
  };
};

export const createUiGateReport = (reviews: UiGateReview[]): UiGateReport => {
  const results = reviews.map(evaluateUiGateReview);
  return {
    generatedAt: new Date().toISOString(),
    version: 1,
    weights: UI_GATE_WEIGHTS,
    threshold: UI_GATE_THRESHOLD,
    results,
    summary: {
      total: results.length,
      approved: results.filter((result) => result.verdict === "APPROVED").length,
      approvedWithRemarks: results.filter(
        (result) => result.verdict === "APPROVED_WITH_REMARKS",
      ).length,
      blocked: results.filter((result) => result.verdict === "BLOCKED").length,
    },
  };
};

export const reportToMarkdown = (report: UiGateReport) => {
  const lines: string[] = [
    "# UI Gate Report",
    "",
    `Generated at: ${report.generatedAt}`,
    "",
    `Total artifacts: ${report.summary.total}`,
    `Approved: ${report.summary.approved}`,
    `Approved with remarks: ${report.summary.approvedWithRemarks}`,
    `Blocked: ${report.summary.blocked}`,
    "",
  ];

  report.results.forEach((result) => {
    lines.push(`## ${result.artifactLabel}`);
    lines.push(`- Board: ${result.board}`);
    lines.push(`- Kind: ${result.artifactKind}`);
    lines.push(`- Verdict: ${result.verdict}`);
    lines.push(`- Weighted score: ${result.weightedScore.toFixed(2)}`);
    lines.push(
      `- Scores: purpose ${result.scores.purpose.toFixed(2)}, typography ${result.scores.typography.toFixed(2)}, consistency ${result.scores.consistency.toFixed(2)}, hierarchy ${result.scores.hierarchy.toFixed(2)}, layout ${result.scores.layoutDiscipline.toFixed(2)}, wcag ${result.scores.wcag.toFixed(2)}`,
    );
    if (result.criticalFlags.length > 0) {
      lines.push(`- Critical flags: ${result.criticalFlags.join(", ")}`);
    }
    if (result.blockReasons.length > 0) {
      lines.push(`- Block reasons: ${result.blockReasons.join(" | ")}`);
    }
    if (result.notes && result.notes.length > 0) {
      lines.push(`- Notes: ${result.notes.join(" | ")}`);
    }
    if (result.evidence && result.evidence.length > 0) {
      lines.push(`- Evidence: ${result.evidence.join(" | ")}`);
    }
    lines.push("");
  });

  return lines.join("\n");
};

export const writeUiGateReport = (
  report: UiGateReport,
  outputDirectory: string,
) => {
  fs.mkdirSync(outputDirectory, { recursive: true });

  const jsonPath = path.join(outputDirectory, "ui-gate-report.json");
  const markdownPath = path.join(outputDirectory, "ui-gate-report.md");

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownPath, reportToMarkdown(report));

  return { jsonPath, markdownPath };
};
