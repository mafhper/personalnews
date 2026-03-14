#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  VITE_APP_BASE: "/",
};

const steps = [
  { cmd: "bun", args: ["run", "promo:changelog"] },
  { cmd: "bun", args: ["run", "config:sync"] },
  { cmd: "bunx", args: ["tsc", "--noEmit"] },
  { cmd: "bun", args: ["vite", "build"] },
];

for (const step of steps) {
  const label = `${step.cmd} ${step.args.join(" ")}`;
  console.log(`[build:app:desktop] ${label}`);
  const result = spawnSync(step.cmd, step.args, {
    stdio: "inherit",
    env,
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

