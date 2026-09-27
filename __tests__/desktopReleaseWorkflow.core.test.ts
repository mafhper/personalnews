import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const readJson = (relative: string) =>
  JSON.parse(readFileSync(join(repoRoot, ...relative.split("/")), "utf8"));

const readText = (relative: string) =>
  readFileSync(join(repoRoot, ...relative.split("/")), "utf8");

const caller = () => readText(".github/workflows/release.yml");
const contract = () => readJson(".github/release.config.json");

/**
 * O workflow de release é o caller do release-core: ele só dispara, declara a
 * matrix e chama o protocolo compartilhado. Onde cada garantia mora mudou com a
 * adoção — estes testes protectem o novo lugar de cada uma, e o uso da
 * ferramenta de edição (e não o shell) para não corromper UTF-8.
 */
describe("desktop release workflow", () => {
  it("builds installers for Windows, Linux, and macOS release tags", () => {
    const workflow = caller();
    const tauriConfig = readJson("apps/desktop/src-tauri/tauri.conf.json");

    expect(workflow).toContain("windows-latest");
    expect(workflow).toContain("ubuntu-22.04");
    expect(workflow).toContain("macos-latest");
    expect(workflow).toContain("nsis,msi");
    expect(workflow).toContain("deb");
    expect(workflow).toContain("dmg");

    // a matrix é topologia do projeto, e por isso vive no caller
    expect(workflow).toContain(
      "mafhper/release-core/.github/workflows/release.yml@v1.2.5",
    );
    expect(contract().desktop).toMatchObject({
      enabled: true,
      project_path: "apps/desktop",
    });

    expect(tauriConfig.bundle.targets).toEqual(
      expect.arrayContaining(["nsis", "msi", "deb", "dmg"]),
    );
  });

  it("passes the whole tauri args string per matrix cell", () => {
    // o release-core repassa `args: ${{ matrix.args }}` direto ao tauri-action:
    // um campo "bundles" separado produziria `--bundles` vazio.
    const workflow = caller();

    expect(workflow).toContain("--bundles nsis,msi --verbose");
    expect(workflow).toContain("--bundles deb --verbose");
    expect(workflow).toContain("--bundles dmg --verbose");
    expect(workflow).not.toMatch(/^\s*bundles:/m);
    expect(workflow).not.toContain("${{ matrix.bundles }}");
  });

  it("declares the release identity, art, and sections in the contract", () => {
    const cfg = contract();

    expect(cfg.release.title).toBe("Personal News");
    expect(cfg.release.language).toBe("pt-BR");
    expect(cfg.release.image).toMatchObject({
      path: "docs/images/releases/release.webp",
      required: true,
      granularity: "minor",
      upload: true,
      // a arte carrega o wordmark: repetir o nome num H1 logo abaixo mostraria
      // o nome duas vezes
      title_in_body: false,
    });
    expect(cfg.release.sections.usage).toContain("## Instalação");
    expect(cfg.release.sections.usage).toContain(
      "| Sistema | Arquivo recomendado | Uso |",
    );
    expect(cfg.release.notes.granularity).toBe("minor");

    // corpo, idempotência e publicação pertencem ao release-core; o caller
    // não pode voltar a montar release por conta própria
    expect(caller()).not.toContain("gh release create");
    expect(caller()).not.toContain("tauri-apps/tauri-action");
    expect(caller()).not.toContain("generateReleaseNotes");
  });

  it("keeps the automatic changelog configured, without emojis", () => {
    const releaseYml = readText(".github/release.yml");

    expect(releaseYml).toContain("title: Novidades e melhorias");
    expect(releaseYml).toContain("title: Correções");
    expect(releaseYml).toContain("title: Outras mudanças");
    expect(releaseYml).toContain("- dependencies");
    expect(releaseYml).not.toMatch(/\p{Extended_Pictographic}/u);

    expect(contract().release.tagline ?? "").not.toMatch(/\p{Extended_Pictographic}/u);
    expect(contract().release.sections.usage).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(contract().release.sections.extra).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("validates the version tag against package.json, tauri.conf.json, and Cargo.toml", () => {
    // a validação é a mesma; quem a executa passou a ser o release-core,
    // dirigido pelas fontes declaradas no contrato
    expect(contract().versions.files).toEqual([
      {
        path: "apps/desktop/src-tauri/tauri.conf.json",
        format: "json",
        field: "version",
      },
      {
        path: "apps/desktop/src-tauri/Cargo.toml",
        format: "toml",
        field: "package.version",
      },
    ]);

    // o script local continua: serve ao release:check e ao teste dele
    const localCheck = readText("scripts/release-version.mjs");
    expect(localCheck).toContain("package.json");
    expect(localCheck).toContain("tauri.conf.json");
    expect(localCheck).toContain("Cargo.toml");
  });

  it("requires a single release.webp updated when the major.minor line changes", () => {
    // o hard gate passou a ser do release-core; o que o contrato precisa
    // declarar é que ele está ligado
    const cfg = contract();
    expect(cfg.release.image.required).toBe(true);
    expect(cfg.release.image.granularity).toBe("minor");

    expect(existsSync(join(repoRoot, "docs", "images", "releases", "release.webp"))).toBe(
      true,
    );
  });

  it("supports workflow_dispatch with an explicit version tag and idempotent re-release", () => {
    const workflow = caller();

    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("Existing version tag to release");
    expect(workflow).toContain("inputs.tag || github.ref_name");
    // re-run não pode cancelar um release em andamento
    expect(workflow).toContain("cancel-in-progress: false");
    expect(workflow).toContain("contents: write");
  });

  it("does not reference the retired image scheme", () => {
    // `public/releases/release-feed-*.png` foi aposentado; a arte vigente é
    // docs/images/releases/release.webp
    expect(caller()).not.toContain("public/releases");
    expect(JSON.stringify(contract())).not.toContain("public/releases");
    expect(readText(".github/release-notes/README.md")).not.toContain(
      "public/releases",
    );
  });

  it("keeps release notes per minor line, with the previous ones consolidated", () => {
    const cfg = contract();
    expect(cfg.release.notes.granularity).toBe("minor");

    // v1.19.3 usa a nota da linha, não uma por tag
    expect(existsSync(join(repoRoot, ".github/release-notes/v1.19.md"))).toBe(true);
    for (const perTag of ["v1.19.0.md", "v1.19.1.md", "v1.19.2.md"]) {
      expect(existsSync(join(repoRoot, ".github/release-notes", perTag))).toBe(
        false,
      );
    }

    // a granularidade escolhida fica declarada, como o release-core exige
    expect(readText(".github/release-notes/README.md")).toContain("minor");
  });
});
