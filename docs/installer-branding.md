# PersonalNews Installer Branding

## Objective

This document defines the Windows installer branding assets used by the Tauri NSIS and MSI/WiX bundles.

The scope is distribution UX only. Do not change the app onboarding, React UI, routes, backend, proxy behavior, updater, permissions, CSP, release targets, or Tauri custom installer templates as part of this work.

## Assets

All paths are relative to `apps/desktop/src-tauri/tauri.conf.json`.

| Installer surface | Config field | File | Size | Format |
| --- | --- | --- | ---: | --- |
| NSIS header | `bundle.windows.nsis.headerImage` | `windows/installer/personalnews-nsis-header.bmp` | 150x57 | BMP Windows classic, 24-bit RGB, uncompressed |
| NSIS sidebar | `bundle.windows.nsis.sidebarImage` | `windows/installer/personalnews-nsis-sidebar.bmp` | 164x314 | BMP Windows classic, 24-bit RGB, uncompressed |
| NSIS uninstall header | `bundle.windows.nsis.uninstallerHeaderImage` | `windows/installer/personalnews-nsis-header.bmp` | 150x57 | BMP Windows classic, 24-bit RGB, uncompressed |
| WiX banner | `bundle.windows.wix.bannerPath` | `windows/installer/personalnews-wix-banner.bmp` | 493x58 | BMP Windows classic, 24-bit RGB, uncompressed |
| WiX dialog | `bundle.windows.wix.dialogImagePath` | `windows/installer/personalnews-wix-dialog.bmp` | 493x312 | BMP Windows classic, 24-bit RGB, uncompressed |

## Export Rules

- Use 24-bit RGB BMP.
- Do not include an alpha channel.
- Do not use BMP compression.
- Keep artwork simple enough to remain legible at installer dimensions.
- Keep NSIS and WiX artwork visually related.
- Prefer the PersonalNews name, the project logo, and restrained contrast.
- Use `apps/desktop/src-tauri/icons/128x128.png` as the low-resolution logo source for installer BMPs.
- Match the app typography as closely as Windows installer BMPs allow: `Manrope`, then `Inter`, then `Segoe UI Variable Text`/`Segoe UI`.
- Match the dark theme palette instead of introducing a separate installer theme:
  - background: `rgb(26 32 44)`;
  - surface: `rgb(45 55 72)`;
  - elevated surface: `rgb(61 73 92)`;
  - text: `rgb(247 250 252)`;
  - secondary text: `rgb(160 174 192)`;
  - brand accent from the logo: `#F36C35`.

## Validation

Run the repo-local validator before building a release:

```powershell
bun run desktop:installer-assets:check
```

The validator checks configured NSIS/WiX assets for:

- file existence;
- `.bmp` extension;
- BMP signature;
- expected dimensions;
- 24-bit color depth;
- uncompressed BMP headers.

Use strict mode only after every recommended installer field is intentionally configured:

```powershell
bun run desktop:installer-assets:check:strict
```

## Build

Build desktop installers from the repository root:

```powershell
bun run desktop:build
```

Expected Windows output folders:

```text
apps/desktop/src-tauri/target/release/bundle/nsis/
apps/desktop/src-tauri/target/release/bundle/msi/
```

## Manual QA

- NSIS opens with the custom sidebar, not the default blue NSIS artwork.
- NSIS internal pages use the custom header.
- The desktop shortcut prompt appears after installation.
- The shortcut is created when accepted.
- Uninstall removes the desktop shortcut.
- MSI uses the custom banner and dialog image.
- Opening the installed app shows no runtime UI or onboarding change from this installer polish.

## Notes

- `uninstallerIcon` and `uninstallerHeaderImage` require `@tauri-apps/cli >= 2.11.0`; this repo pins the CLI above that threshold.
- `apps/desktop/src-tauri/windows/hooks.nsh` is ASCII-safe to avoid NSIS/ANSI codepage issues on Windows runners.
- `.codex/skills` is not a build, CI, or release dependency. Any skill guidance must point back to this repo-local validator.
