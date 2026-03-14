import path from "node:path";
import { uiGateReviews } from "../config/ui-gate.review";
import { createUiGateReport, writeUiGateReport } from "../ui-gate";

const report = createUiGateReport(uiGateReviews);
const outputDirectory = path.resolve(
  process.cwd(),
  "performance-reports",
  "quality",
);
const { jsonPath, markdownPath } = writeUiGateReport(report, outputDirectory);

console.log(`UI gate report written to ${jsonPath}`);
console.log(`UI gate markdown written to ${markdownPath}`);

report.results.forEach((result) => {
  console.log(
    `${result.verdict.padEnd(22)} ${result.artifactLabel.padEnd(18)} ${result.weightedScore.toFixed(2)}`,
  );
});

if (report.summary.blocked > 0) {
  process.exitCode = 1;
}
