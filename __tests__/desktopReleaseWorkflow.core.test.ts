import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("desktop release workflow", () => {
  it("builds installers for Windows, Linux, and macOS release tags", () => {
    const workflow = readFileSync(
      join(repoRoot, ".github", "workflows", "release-desktop.yml"),
      "utf8",
    );
    const tauriConfig = readFileSync(
      join(
        repoRoot,
        "apps",
        "desktop",
        "src-tauri",
        "tauri.conf.json",
      ),
      "utf8",
    );

    expect(workflow).toContain("windows-latest");
    expect(workflow).toContain("ubuntu-22.04");
    expect(workflow).toContain("macos-latest");
    expect(workflow).toContain("nsis,msi");
    expect(workflow).toContain("deb");
    expect(workflow).toContain("dmg");
    expect(workflow).toContain("tauri-apps/tauri-action");

    const parsedConfig = JSON.parse(tauriConfig) as {
      bundle: { targets: string[] };
    };

    expect(parsedConfig.bundle.targets).toEqual(
      expect.arrayContaining(["nsis", "msi", "deb", "dmg"]),
    );
  });

  it("publishes compact image-led release notes without emojis", () => {
    const workflow = readFileSync(
      join(repoRoot, ".github", "workflows", "release-desktop.yml"),
      "utf8",
    );
    const releaseConfigPath = join(repoRoot, ".github", "release.yml");

expect(workflow).toContain("releaseId: ${{ steps.create-release.outputs.release_id }}");
    expect(workflow).toContain("generateReleaseNotes: false");
    expect(workflow).toContain("id: release-body");
    expect(workflow).toContain("id: create-release");
    expect(workflow).not.toContain("releaseBody:");
    expect(workflow).toContain(".github/release-notes/${TAG}.md");
    expect(workflow).toContain("releases/generate-notes");
    expect(workflow).toContain("## O que tem de novo nesta versão");
    expect(workflow).toContain('<p align="center">');
    expect(workflow).toContain(
      "https://raw.githubusercontent.com/${REPOSITORY}/${TAG}/${image_path}",
    );
    expect(workflow).toContain("docs/images/releases/release.webp");
    expect(workflow).not.toContain(
      "https://raw.githubusercontent.com/mafhper/personalnews/main/public/release-feed.png",
    );
    expect(workflow).not.toContain("generateReleaseNotes: true");
    expect(workflow).not.toContain("releaseBody: |");
    expect(workflow).toContain("## Instalação");
    expect(workflow).toContain("| Sistema | Arquivo recomendado | Uso |");
    expect(workflow).not.toMatch(/\p{Extended_Pictographic}/u);

    expect(existsSync(releaseConfigPath)).toBe(true);
    const releaseConfig = existsSync(releaseConfigPath)
      ? readFileSync(releaseConfigPath, "utf8")
      : "";
    expect(releaseConfig).toContain("title: Novidades e melhorias");
    expect(releaseConfig).toContain("title: Correções");
    expect(releaseConfig).toContain("title: Outras mudanças");
    expect(releaseConfig).toContain("- dependencies");
    expect(releaseConfig).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("validates the version tag against package.json, tauri.conf.json, and Cargo.toml", () => {
    const workflow = readFileSync(
      join(repoRoot, ".github", "workflows", "release-desktop.yml"),
      "utf8",
    );

    expect(workflow).toContain("id: version");
    expect(workflow).toContain("node scripts/release-version.mjs");
    expect(workflow).toContain("Expected format: vX.Y.Z");
    expect(workflow).toContain("does not match tag core version");
  });

  it("requires a single release.webp updated when the major.minor line changes", () => {
    const workflow = readFileSync(
      join(repoRoot, ".github", "workflows", "release-desktop.yml"),
      "utf8",
    );

    expect(workflow).toContain("id: release-image");
    expect(workflow).toContain("git diff --quiet \"$prev_tag\"..\"$TAG\" -- \"$image_path\"");
    expect(workflow).toContain("was not updated for the new major.minor line");
    expect(workflow).toContain("Same major.minor line; reusing the image (patch release)");
  });

  it("supports workflow_dispatch with an explicit version tag and idempotent re-release", () => {
    const workflow = readFileSync(
      join(repoRoot, ".github", "workflows", "release-desktop.yml"),
      "utf8",
    );

    expect(workflow).toContain("inputs:");
    expect(workflow).toContain("Existing version tag to release");
    expect(workflow).toContain("ref: ${{ github.event_name == 'workflow_dispatch' && inputs.tag || github.ref }}");
    expect(workflow).toContain("gh release edit \"$ref\"");
  });
});