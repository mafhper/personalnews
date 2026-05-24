#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const EXPECTED = {
  "nsis.headerImage": { width: 150, height: 57, extension: ".bmp" },
  "nsis.sidebarImage": { width: 164, height: 314, extension: ".bmp" },
  "nsis.uninstallerHeaderImage": { width: 150, height: 57, extension: ".bmp" },
  "wix.bannerPath": { width: 493, height: 58, extension: ".bmp" },
  "wix.dialogImagePath": { width: 493, height: 312, extension: ".bmp" },
};

const RECOMMENDED_NSIS = [
  "installerIcon",
  "uninstallerIcon",
  "headerImage",
  "sidebarImage",
  "uninstallerHeaderImage",
  "installMode",
  "startMenuFolder",
  "languages",
  "displayLanguageSelector",
  "installerHooks",
];

const RECOMMENDED_WIX = ["language", "bannerPath", "dialogImagePath"];

function usage() {
  console.log(`Usage:
  node scripts/validate-tauri-installer-assets.mjs [--repo <path>] [--strict]

Validates configured Tauri NSIS/WiX installer image assets.
Defaults to the current working directory when --repo is omitted.
Default mode reports missing recommended fields as warnings.
Strict mode exits non-zero on warnings or errors.`);
}

function parseArgs(argv) {
  const args = { repo: ".", strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--repo") {
      args.repo = argv[i + 1];
      i += 1;
    } else if (arg === "--strict") {
      args.strict = true;
    } else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function stripJsonComments(input) {
  let out = "";
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let i = 0; i < input.length; i += 1) {
    const current = input[i];
    const next = input[i + 1];

    if (inString) {
      out += current;
      if (escaped) {
        escaped = false;
      } else if (current === "\\") {
        escaped = true;
      } else if (current === quote) {
        inString = false;
      }
      continue;
    }

    if (current === '"' || current === "'") {
      inString = true;
      quote = current;
      out += current;
      continue;
    }

    if (current === "/" && next === "/") {
      while (i < input.length && input[i] !== "\n") i += 1;
      out += "\n";
      continue;
    }

    if (current === "/" && next === "*") {
      i += 2;
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/")) i += 1;
      i += 1;
      continue;
    }

    out += current;
  }

  return out.replace(/,\s*([}\]])/g, "$1");
}

function findTauriConfigs(repo) {
  const configs = [];
  const rootConfig = path.join(repo, "src-tauri", "tauri.conf.json");
  if (fs.existsSync(rootConfig)) configs.push(rootConfig);

  const appsDir = path.join(repo, "apps");
  if (fs.existsSync(appsDir)) {
    for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const candidate = path.join(appsDir, entry.name, "src-tauri", "tauri.conf.json");
      if (fs.existsSync(candidate)) configs.push(candidate);
    }
  }

  return configs;
}

function readConfig(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(stripJsonComments(raw));
}

function normalizeTargets(targets) {
  if (!targets) return new Set();
  if (targets === "all") return new Set(["all"]);
  if (Array.isArray(targets)) return new Set(targets.map(String));
  return new Set([String(targets)]);
}

function targetEnabled(targets, name) {
  return targets.has("all") || targets.has(name);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== "";
}

function readBmpInfo(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.length < 34 || buffer.toString("ascii", 0, 2) !== "BM") {
    throw new Error("not a BMP file");
  }

  const width = buffer.readInt32LE(18);
  const height = Math.abs(buffer.readInt32LE(22));
  const bitDepth = buffer.readUInt16LE(28);
  const compression = buffer.readUInt32LE(30);

  return { width, height, bitDepth, compression };
}

function checkAsset({ configFile, baseDir, label, relativePath, expected, messages }) {
  const assetPath = path.resolve(baseDir, relativePath);
  const relToConfig = path.relative(path.dirname(configFile), assetPath);

  if (!fs.existsSync(assetPath)) {
    messages.errors.push(`${configFile}: ${label} points to missing file: ${relativePath}`);
    return;
  }

  const ext = path.extname(assetPath).toLowerCase();
  if (ext !== expected.extension) {
    messages.errors.push(`${configFile}: ${label} must be ${expected.extension}, got ${ext || "no extension"}: ${relToConfig}`);
    return;
  }

  try {
    const dims = readBmpInfo(assetPath);
    if (dims.width !== expected.width || dims.height !== expected.height) {
      messages.errors.push(
        `${configFile}: ${label} must be ${expected.width}x${expected.height}, got ${dims.width}x${dims.height}: ${relToConfig}`,
      );
    }
    if (dims.bitDepth !== 24) {
      messages.errors.push(`${configFile}: ${label} must be 24-bit BMP, got ${dims.bitDepth}-bit: ${relToConfig}`);
    }
    if (dims.compression !== 0) {
      messages.errors.push(`${configFile}: ${label} must be uncompressed BMP, got compression=${dims.compression}: ${relToConfig}`);
    }
  } catch (error) {
    messages.errors.push(`${configFile}: ${label} could not be read as BMP (${error.message}): ${relToConfig}`);
  }
}

function validateConfig(configFile) {
  const config = readConfig(configFile);
  const baseDir = path.dirname(configFile);
  const bundle = config.bundle ?? {};
  const windows = bundle.windows ?? {};
  const targets = normalizeTargets(bundle.targets);
  const nsis = windows.nsis ?? {};
  const wix = windows.wix ?? {};
  const messages = { info: [], warnings: [], errors: [] };

  const nsisEnabled = targetEnabled(targets, "nsis") || Object.keys(nsis).length > 0;
  const msiEnabled = targetEnabled(targets, "msi") || Object.keys(wix).length > 0;

  messages.info.push(`${configFile}: product=${config.productName ?? "unknown"} targets=${bundle.targets ? JSON.stringify(bundle.targets) : "unspecified"}`);

  if (nsisEnabled) {
    for (const key of RECOMMENDED_NSIS) {
      if (!hasValue(nsis[key])) {
        messages.warnings.push(`${configFile}: bundle.windows.nsis.${key} is recommended for polished Windows installers`);
      }
    }

    for (const [key, expected] of Object.entries(EXPECTED)) {
      if (!key.startsWith("nsis.")) continue;
      const field = key.slice("nsis.".length);
      if (hasValue(nsis[field])) {
        checkAsset({ configFile, baseDir, label: key, relativePath: nsis[field], expected, messages });
      }
    }
  }

  if (msiEnabled) {
    for (const key of RECOMMENDED_WIX) {
      if (!hasValue(wix[key])) {
        messages.warnings.push(`${configFile}: bundle.windows.wix.${key} is recommended for polished MSI installers`);
      }
    }

    for (const [key, expected] of Object.entries(EXPECTED)) {
      if (!key.startsWith("wix.")) continue;
      const field = key.slice("wix.".length);
      if (hasValue(wix[field])) {
        checkAsset({ configFile, baseDir, label: key, relativePath: wix[field], expected, messages });
      }
    }
  }

  if (!nsisEnabled && !msiEnabled) {
    messages.info.push(`${configFile}: no Windows NSIS/MSI target detected`);
  }

  return messages;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    usage();
    process.exit(2);
  }

  const repo = path.resolve(args.repo);
  if (!fs.existsSync(repo) || !fs.statSync(repo).isDirectory()) {
    console.error(`Error: --repo is not a directory: ${repo}`);
    process.exit(2);
  }

  const configs = findTauriConfigs(repo);
  if (configs.length === 0) {
    console.error(`Error: no Tauri config found under ${repo}`);
    process.exit(2);
  }

  const totals = { warnings: 0, errors: 0 };

  for (const configFile of configs) {
    const messages = validateConfig(configFile);
    for (const line of messages.info) console.log(`[info] ${line}`);
    for (const line of messages.warnings) console.warn(`[warn] ${line}`);
    for (const line of messages.errors) console.error(`[error] ${line}`);
    totals.warnings += messages.warnings.length;
    totals.errors += messages.errors.length;
  }

  console.log(`[summary] configs=${configs.length} warnings=${totals.warnings} errors=${totals.errors} strict=${args.strict}`);

  if (totals.errors > 0 || (args.strict && totals.warnings > 0)) {
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error(`[error] ${error.stack || error.message}`);
  process.exit(1);
}
