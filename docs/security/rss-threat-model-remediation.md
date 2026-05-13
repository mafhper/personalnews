# RSS Threat Model Remediation

Status: security sprint 01 for v1.11.0.

## Threat Model

RSS, Atom, OPML, article HTML, article images, discovered feed URLs, and cached feed API responses are hostile input. The primary attacker is a compromised or malicious feed source. The desktop renderer is treated as untrusted after any XSS.

## Inventory

| Surface | Status | Remediation |
|---|---|---|
| `services/rssParser.ts` RSS XML parser | safe | Uses `parseSecureRssXml`. |
| `services/rssParser.ts` OPML parser | safe | Uses `parseSecureOpmlXml`, limits depth to 5 and imported feeds to 500. |
| `services/productionRssParser.ts` XML parser | safe | Production fallback now uses `parseSecureRssXml`. |
| `services/unifiedRssParser.ts` OPML parser | safe | Uses `parseSecureOpmlXml` and caps returned URLs. |
| `services/opmlExportService.ts` OPML validation | safe | Validates generated/imported OPML with `parseSecureOpmlXml`. |
| `services/feedDiscoveryService.ts` feed metadata XML parser | safe | Uses `parseSecureRssXml`; malformed cleanup is retried through the same parser. |
| `services/feedDiscoveryService.ts` HTML page parser | safe | Remains `text/html` parsing for link discovery, not XML parsing. |
| `apps/backend/src/feedParser.ts` backend XML parser | safe | Enforces size limit, XXE pattern blocking, redirect URL validation, and Content-Type warning fallback. |
| `components/ArticleReaderModal.tsx` article HTML render | safe | Uses memoized `sanitizeFeedHtmlForRender` immediately before `dangerouslySetInnerHTML`. |
| `components/SearchBar.tsx` highlighted text render | safe | Uses plain-text sanitization before highlighting. |
| `components/Logo.tsx` configured SVG render | safe | Static configured asset path, not feed content. |
| `quality-core/dashboard/src/components/ui/chart.tsx` style render | safe | Internal generated CSS, not feed content. |
| `apps/desktop/src-tauri/src/main.rs` `open_external_url` | safe | Allows only `http`, `https`, and `mailto`. |
| `apps/desktop/src-tauri/src/main.rs` `restart_backend_sidecar` | safe | Enforces cooldown plus 5 restarts per hour. |
| `apps/desktop/src-tauri/src/main.rs` `append_frontend_log` | safe | Truncates and escapes control characters before writing local logs. |
| `apps/desktop/src-tauri/src/main.rs` `get_backend_auth_token` | defer | Token remains renderer-readable for v1.11.0; requests are logged. Real fix requires cookie/header architecture. |
| `apps/desktop/src-tauri/tauri.conf.json` CSP | safe | Non-null CSP with strict script policy and no `unsafe-eval`. |
| `service-worker.js` dynamic/API cache | safe | Cache names include sanitizer policy version and old caches are invalidated on policy change. |
| `marked` dependency | safe | Removed as unused supply-chain surface. |
| Remote image tracking | defer | Accepted residual risk for v1.11.0; a privacy proxy is a separate feature. |

## Release Gate

`v1.11.0` must not be tagged unless format, type-check, focused security tests, full core tests, build, security scan, and GitHub CI checks pass.

## Residual Risk

The backend token is still accessible to renderer JavaScript in the desktop app. CSP and final sanitization reduce the probability of renderer compromise, but they do not make renderer-readable secrets safe. The durable fix is to remove token access from renderer code, likely via `HttpOnly` cookie or equivalent Tauri-managed request authentication.
