#!/usr/bin/env node

import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const args = new Set(process.argv.slice(2));
const runPages = args.has("--all") || args.has("--pages") || args.size === 0;
const runDesktop = args.has("--all") || args.has("--desktop");

if (!runPages && !runDesktop) {
  console.error("Use --pages, --desktop, or --all.");
  process.exit(1);
}

const tempRoot = resolve(repoRoot, "tmp");
const worktreePath = join(tempRoot, "github-preflight");

const run = (command, commandArgs, options = {}) => {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

if (!existsSync(tempRoot)) {
  mkdirSync(tempRoot, { recursive: true });
}

if (existsSync(worktreePath)) {
  rmSync(worktreePath, { recursive: true, force: true });
}

run("git", ["worktree", "prune"], { cwd: repoRoot });
run("git", ["worktree", "add", "--detach", worktreePath, "HEAD"], { cwd: repoRoot });

try {
  console.log("[preflight] Installing dependencies in clean worktree");
  run("bun", ["install", "--no-cache"], { cwd: worktreePath });

  if (runPages) {
    console.log("[preflight] Running GitHub Pages checks");
    run("bun", ["tsc", "--noEmit", "-p", "tsconfig.json"], { cwd: worktreePath });
    run("bun", ["run", "test"], { cwd: worktreePath });
    run("bun", ["run", "security:scan"], { cwd: worktreePath });
    run("bun", ["vite", "build"], { cwd: worktreePath });
  }

  if (runDesktop) {
    console.log("[preflight] Running desktop release checks");
    run("bun", ["run", "build:app:desktop"], { cwd: worktreePath });
    run("node", ["scripts/prepare-backend.mjs"], { cwd: worktreePath });
  }
} finally {
  run("git", ["worktree", "remove", worktreePath, "--force"], { cwd: repoRoot });
}
