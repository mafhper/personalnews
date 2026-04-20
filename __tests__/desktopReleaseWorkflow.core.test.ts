import { readFileSync } from "node:fs";
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
});
