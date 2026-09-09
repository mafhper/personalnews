import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export function assertAlignedVersions(versions) {
  const entries = Object.entries(versions);
  if (entries.length === 0) {
    throw new Error("No release versions were provided.");
  }

  const uniqueVersions = new Set(entries.map(([, version]) => version));
  if (uniqueVersions.size !== 1) {
    const details = entries.map(([source, version]) => `${source}=${version}`).join(", ");
    throw new Error(`Release version mismatch: ${details}`);
  }

  return entries[0][1];
}

function readPackageJsonVersion() {
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  return pkg.version;
}

function readTauriVersion() {
  const tauri = JSON.parse(
    readFileSync(join(repoRoot, "apps", "desktop", "src-tauri", "tauri.conf.json"), "utf8"),
  );
  return tauri.version;
}

function readCargoVersion() {
  const cargoPath = join(repoRoot, "apps", "desktop", "src-tauri", "Cargo.toml");
  const match = readFileSync(cargoPath, "utf8").match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error("Could not determine the version from Cargo.toml");
  }
  return match[1];
}

export function readAlignedVersions() {
  return {
    "package.json": readPackageJsonVersion(),
    "tauri.conf.json": readTauriVersion(),
    "Cargo.toml": readCargoVersion(),
  };
}

function main() {
  try {
    const version = assertAlignedVersions(readAlignedVersions());
    console.log(`[release-version] aligned version: ${version}`);
  } catch (error) {
    console.error(`[release-version] ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}