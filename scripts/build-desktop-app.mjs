#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const isSilent = args.includes("--silent") || args.includes("-s");
const isQuiet =
  args.includes("--quiet") ||
  args.includes("-q") ||
  (!isSilent && process.env.CI === "true");
const childStdio = isSilent ? ["ignore", "ignore", "inherit"] : "inherit";
const passthroughFlags = isSilent ? ["--silent"] : isQuiet ? ["--quiet"] : [];

const env = {
  ...process.env,
  VITE_APP_BASE: "/",
  VITE_TAURI: "true",
};

const steps = [
  { cmd: "bun", args: ["run", "promo:changelog", ...passthroughFlags] },
  { cmd: "bun", args: ["run", "config:sync", ...passthroughFlags] },
  { cmd: "bunx", args: ["tsc", "--noEmit"] },
  { cmd: "bun", args: ["vite", "build"] },
];

function logStep(label, index) {
  if (isSilent) return;
  const progress = `[${index}/${steps.length}]`;
  const mode = isQuiet ? "quiet" : "default";
  console.log(`[build:app:desktop] ${progress} ${label} (${mode})`);
}

for (const [index, step] of steps.entries()) {
  const label = `${step.cmd} ${step.args.join(" ")}`;
  logStep(label, index + 1);
  const result = spawnSync(step.cmd, step.args, {
    stdio: childStdio,
    env,
    shell: false,
  });

  if (result.status !== 0) {
    console.error(
      `[build:app:desktop] failed: ${label} exited with ${result.status ?? 1}`,
    );
    process.exit(result.status ?? 1);
  }
}

if (!isSilent) {
  console.log("[build:app:desktop] build completed.");
}
