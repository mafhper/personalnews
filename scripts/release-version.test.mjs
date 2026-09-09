import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAlignedVersions,
  readAlignedVersions,
} from "./release-version.mjs";

test("accepts an aligned desktop version", () => {
  assert.equal(
    assertAlignedVersions({
      "package.json": "1.19.1",
      "tauri.conf.json": "1.19.1",
      "Cargo.toml": "1.19.1",
    }),
    "1.19.1",
  );
});

test("rejects a release when desktop versions diverge", () => {
  assert.throws(
    () =>
      assertAlignedVersions({
        "package.json": "1.19.0",
        "tauri.conf.json": "1.19.1",
        "Cargo.toml": "1.19.0",
      }),
    /package\.json=1\.19\.0, tauri\.conf\.json=1\.19\.1, Cargo\.toml=1\.19\.0/,
  );
});

test("rejects when no release versions are provided", () => {
  assert.throws(() => assertAlignedVersions({}), /No release versions were provided/);
});

test("reads aligned versions from the repository files", () => {
  const versions = readAlignedVersions();
  const unique = new Set(Object.values(versions));
  assert.equal(unique.size, 1);
  assert.match(versions["package.json"], /^\d+\.\d+\.\d+$/);
});