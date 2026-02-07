# Referencia Tecnica de Scripts do `package.json`

- Documento: Referencia Tecnica de Execucao de Scripts
- Projeto: `personal-news`
- Escopo: Catalogo operacional dos scripts definidos em `package.json`
- Versao: 1.1
- Status: Vigente
- Origem: `_dev/docs/package-scripts-guia.md`
- Publicacao recomendada: `docs/package-scripts-guia.md`

## Objetivo

Este documento descreve formalmente os scripts atualmente definidos no `package.json`, incluindo:

- o que cada script faz
- quando executar
- quais tipos de `errors`, `warnings` e `violations` ele detecta

## Convenções de resultado

- `Erro (error)`: falha que retorna `exit code != 0` e interrompe pipeline.
- `Warning`: achado nao-bloqueante (depende do script). Pode aparecer no resumo de qualidade.
- `Violation`: violacao de regra de threshold (bundle/performance/estrutura), normalmente reportada pelo Quality Core.

## Fluxos recomendados

### Fluxo rapido de desenvolvimento

1. `bun run dev`
2. `bun run lint:fast`
3. `bun run type-check`
4. `bun run test:core`
5. `bun run quality:gate:local-silent`

### Fluxo pre-PR

1. `bun run build`
2. `bun run quality:full`
3. `bun run quality:reports:all`

### Fluxo CI local (simular pipeline)

1. `bun run quality:ci`
2. Se estiver depurando desempenho: `bun run quality:ci:quick-silent`

### Fluxo de auditoria completa de scripts (silencioso e sem interrupcao)

1. `bun run scripts:audit:all`
2. Acompanhar no terminal:
   - cabecalho padronizado
   - tempo decorrido global
   - tempo decorrido por script + media historica por script
   - heartbeat de execucao (indica que nao travou)
   - resumo de problema quando houver `FAIL`/`TIMEOUT`
3. Ler o consolidado em:
   - `performance-reports/scripts-audit/scripts-audit-latest.json`
   - `performance-reports/scripts-audit/scripts-audit-latest.md`

Variantes uteis:

- `bun run scripts:audit:all:fail` (retorna erro no final se houver falhas)
- `bun run scripts:audit:area` (executa somente areas principais)
- `node quality-core/scripts/audit-package-scripts.cjs --include=quality:core,quality:gate --tail-lines=60`
- `node quality-core/scripts/audit-package-scripts.cjs --config=quality-core/config/scripts-audit.config.json`
- `node quality-core/scripts/audit-package-scripts.cjs --heartbeat-sec=20`
- `node quality-core/scripts/audit-package-scripts.cjs --no-dedupe`

Politicas por script (`scriptPolicies` em `quality-core/config/scripts-audit.config.json`):

- Contrato por script:
  - `timeoutMs`: timeout especifico para o script.
  - `env`: variaveis de ambiente injetadas somente na execucao daquele script.
  - `args`: argumentos extras passados em `bun run <script> -- ...`.
  - `requiresDist`: exige `dist` antes da execucao do script.
  - `prepareScript`: script de preflight para gerar `dist` quando necessario.
- Politicas atuais:
  - `test:feeds`: usa `FEED_TEST_LIMIT=2` e `timeoutMs=240000` durante `scripts:audit:*`.
  - `quality:core`, `quality:core:silent`, `quality:core:quick`, `quality:core:quick-silent`: executam com `--fail-on-error` no auditor.
  - `quality:lighthouse*`, `quality:reports:all*`, `perf:lighthouse*`: executam preflight automatico (`build:app`) quando `dist` nao existe.

Padrao de saida de terminal (TUI/CLI):

- Configuracao central: `quality-core/config/cli-output.config.json`.
- Hierarquia padrao:
  - nivel 0: `|`
  - nivel 1: `|-`
  - nivel 2: `|--`
- Aplicado em `scripts:audit:*`, `quality:core*`, `quality:lighthouse*` e `quality:coverage*`.
- Objetivo: padronizar blocos de `Header`, `Execution Plan`, `Execucao`, `Resumo` e `Problemas encontrados`.

Exclusoes padrao (documentadas em `quality-core/config/scripts-audit.config.json`):

- `deploy` (evita commit/push automatico)
- `dev`, `preview`, `promo`, `dashboard`, `quality:dashboard`
- `test:watch`, `test:e2e:ui`, `test:e2e:headed`, `test:e2e:install`
- `system:start`, `cleanup`
- `scripts:audit:all`, `scripts:audit:all:fail`, `scripts:audit:area`

Observacao de seguranca operacional:

- `scripts:audit:all` **nao** executa `deploy` por padrao, portanto nao faz commit/push.
- Apenas executara algo de deploy se voce incluir explicitamente via `--include=deploy`.
- O auditor continua sem interromper na primeira falha e registra quais `scriptPolicies` foram aplicadas no relatorio final.

## Troubleshooting Operacional

### Snapshot mismatch em coverage/audit

- Sintoma: falha em `__tests__/Logo.snapshot.test.tsx` e cascata em `test:coverage:*`, `quality:coverage:*` e `audit:full`.
- Causa comum: mudanca esperada de markup/asset sem atualizar snapshot.
- Acao: atualizar snapshot do teste visual e reexecutar `bun run test:coverage:silent`.

### Falha transiente de Lighthouse

- Sintoma: erro em `quality:lighthouse:*`/`perf:lighthouse:*` com `runtimeError` (ex.: `NO_FCP`) ou conectividade de Chrome.
- Causa comum: instabilidade de renderizacao headless, inicializacao de Chrome ou timeout de protocolo.
- Acao: usar retries configurados (`LH_RETRY_COUNT`, `LH_RETRY_TRANSIENT_ONLY`) e validar o `reason` estruturado no resumo.

### Warning no Quality Gate por falta de Lighthouse valido

- Sintoma: etapa `Performance` sem score confiavel no `quality:gate`.
- Comportamento esperado: warning/skipped (nao falha dura) quando nao houver relatorio desktop valido.
- Acao: executar `bun run quality:lighthouse:home` ou `bun run quality:lighthouse:feed` e repetir o gate.

## Catalogo completo de scripts

## Desenvolvimento, build e deploy

| Script | Comando real | O que faz | Quando executar | Verifica/detecta |
|---|---|---|---|---|
| `dev` | `bun vite` | Sobe app em modo desenvolvimento | desenvolvimento diario | erros de compilacao em tempo real |
| `build:app` | `promo:changelog && config:sync && tsc --noEmit && vite build` | Build da aplicacao principal com pre-etapas | antes de validar artefato final do app | erros TS, erros de build, warnings do Vite (chunk/browserslist/etc.) |
| `build:dashboard` | `node quality-core/scripts/build-dashboard.cjs` | Build do dashboard do Quality Core | quando alterar dashboard ou antes de `build` completo | erros de build dashboard, warnings de bundle dashboard |
| `build` | `build:app && build:dashboard` | Build completo (app + dashboard) | pre-release, pre-deploy, validacao final | erros de qualquer etapa de build |
| `preview` | `bun vite preview` | Preview do build local | checar output de producao localmente | nao faz auditoria, apenas sobe artefato |
| `clean` | `rimraf dist node_modules/.vite` | limpa artefatos locais de build/cache Vite | quando cache corromper ou build inconsistente | n/a |
| `deploy` | `build && git add dist && git commit && git push` | faz deploy com commit/push | somente quando quiser publicar manualmente | falhas de build e de git |

## Testes unitarios/integracao/e2e

| Script | Comando real | O que faz | Quando executar | Verifica/detecta |
|---|---|---|---|---|
| `test` | `vitest core config` | roda suite principal (core) | validacao padrao local | falhas de teste (`assert`, timeout, runtime) |
| `test:core` | idem `test` | alias da suite core | uso diario | mesmas verificacoes do `test` |
| `test:core:serial` | vitest core com `VITEST_MAX_THREADS=1` | execucao serial para reduzir flakiness | quando houver corrida/intermitencia | mesmas falhas de teste + maior estabilidade |
| `test:all` | `vitest minimal config` | suite mais ampla/minimal smoke config | validacao geral | falhas de teste |
| `test:all:serial` | `test:all` serial | suite ampla serial | depuracao de flakiness | falhas de teste |
| `test:fast` | `vitest minimal config` | atalho de teste rapido | feedback curto antes de commit | falhas de teste |
| `test:watch` | vitest watch | loop continuo de testes | TDD | falhas de teste em tempo real |
| `test:coverage` | `node quality-core/cli/run-coverage.cjs` | cobertura completa com TUI | medir cobertura e regressao | falhas de teste, coverage abaixo de expectativa (quando regra aplicada), warnings de cobertura |
| `test:coverage:quick` | coverage quick | cobertura em subset mais rapido | iteracao local | mesmas verificacoes com menor escopo |
| `test:coverage:quiet` | coverage quiet | menor output mantendo resumo | CI/local com economia de log | mesmas verificacoes do coverage |
| `test:coverage:quick-quiet` | coverage quick+quiet | quick + menos output | loop rapido de validacao | mesmas verificacoes do coverage quick |
| `test:coverage:silent` | coverage silent | output minimo (resumo final) | pipelines verbose-limited | mesmas verificacoes do coverage |
| `test:coverage:quick-silent` | coverage quick+silent | quick + output minimo | validacao mais barata | mesmas verificacoes do coverage quick |
| `test:e2e` | `playwright test` | e2e headless | validar fluxos reais de UI | falhas e2e, timeouts, seletor quebrado |
| `test:e2e:ui` | `playwright test --ui` | runner visual interativo | depurar e2e | mesmas falhas e2e com interface |
| `test:e2e:headed` | `playwright test --headed` | e2e com browser visivel | depurar problemas visuais | mesmas falhas e2e |
| `test:e2e:install` | `playwright install --with-deps` | instala browsers/deps de e2e | setup inicial de ambiente | falhas de instalacao |
| `test:feeds` | `bun quality-core/scripts/testFeeds.ts` | validacao de feeds/fontes | quando alterar feed sources/proxies | feed inválido, indisponibilidade, parse errors |

## Tipagem, lint, seguranca, i18n

| Script | Comando real | O que faz | Quando executar | Verifica/detecta |
|---|---|---|---|---|
| `type-check` | `tsc --noEmit ...` | checagem TypeScript sem gerar build | sempre antes de PR | erros de tipo, imports quebrados, incompatibilidade TS |
| `lint` | eslint repo | lint completo com cache | pre-PR e CI | erros de estilo/qualidade, warnings eslint, regras TS/React |
| `lint:fast` | `lint-changed.cjs` | lint somente de arquivos alterados | loop rapido local | erros/warnings de lint em changed files |
| `lint:components` | eslint pasta components | lint focado em UI | ao alterar componentes | erros/warnings de lint nessa area |
| `lint:services` | eslint services/hooks/utils/config | lint focado em logica/core | ao alterar servicos/hooks | erros/warnings de lint nessa area |
| `lint:quality-core` | eslint quality-core | lint da suite quality-core | ao alterar scripts/CLI/dashboard quality-core | erros/warnings de lint nessa area |
| `security:scan` | `node quality-core/scripts/security-scan.cjs` | varredura de padroes de segredo/vuln | pre-PR, pre-release | achados `critical/high/medium`, segredos expostos, warnings de risco |
| `i18n:audit` | `node quality-core/scripts/i18n-audit.cjs` | auditoria de traducao e hardcoded strings | ao mexer em textos/traducoes | chaves faltantes/sobrando, texto hardcoded, warnings criticos i18n |
| `i18n:sync` | `node quality-core/scripts/i18n-sync.cjs` | sincroniza arquivos de traducao | ao adicionar/remover chaves | inconsistencias de dicionario |

## Performance, lighthouse e analise

| Script | Comando real | O que faz | Quando executar | Verifica/detecta |
|---|---|---|---|---|
| `perf:lighthouse` | run-lighthouse (scripts/performance-gate) | lighthouse completo | auditoria perf manual | scores perf/a11y/bp/seo, erros de runtime Chrome |
| `perf:lighthouse:home` | lighthouse `--home` | audita home | otimizar landing/home | regressao de score da home |
| `perf:lighthouse:feed` | lighthouse `--feed` | audita feed | otimizar feed | regressao de score do feed |
| `perf:analyze` | analyze.cjs (performance-gate) | analise de thresholds/perf reports | apos gerar relatorios de perf | violations de threshold e diffs |
| `analysis` | `quality-core/cli/run-analysis.cjs` | analise bundle/deps | pre-release/otimizacao | tamanho de chunks, dependencia suspeita, warnings de peso |
| `analysis:bundle` | alias de `analysis` | idem | idem | idem |
| `analysis:silent` | analysis `--silent` | output minimo da analise | pipeline silencioso | mesmas verificacoes |

## Dashboard e snapshots de qualidade

| Script | Comando real | O que faz | Quando executar | Verifica/detecta |
|---|---|---|---|---|
| `dashboard` | `bun quality-core/dashboard-server.ts` | sobe dashboard local | observar tendencia de qualidade | n/a (visualizacao) |
| `quality:dashboard` | alias do dashboard | idem | idem | idem |
| `quality:snapshot` | `bun quality-core/generate-snapshot.ts` | gera snapshot de qualidade | apos auditorias/testes | n/a (coleta/normalizacao) |
| `quality:dashboard:refresh` | refresh-dashboard-cache.ts | atualiza cache/resumo do dashboard | quando dados parecerem desatualizados | detecta inconsistencias de cache no refresh |

## Qualidade (Quality Core CLI) - execucoes base

| Script | Comando real | O que faz | Quando executar | Verifica/detecta |
|---|---|---|---|---|
| `quality:core` | `quality-core/cli/quality.cjs` | auditoria semantica principal | rotina de qualidade | violations de build/rules preset, warnings de threshold |
| `quality:core:quick` | `quality.cjs --quick` | auditoria reduzida | loop rapido | subset de violations/warnings |
| `quality:core:silent` | `quality.cjs --silent` | auditoria com output minimo | CI silencioso | mesmas verificacoes |
| `quality:core:quick-silent` | quick+silent | auditoria reduzida e silenciosa | pre-check rapido | subset de verificacoes |

## Cobertura via namespace `quality:*`

| Script | Comando real | O que faz | Quando executar | Verifica/detecta |
|---|---|---|---|---|
| `quality:coverage` | `run-coverage.cjs` | cobertura completa | governanca de testes | falhas de teste, coverage gaps, warnings |
| `quality:coverage:quick` | quick | cobertura reduzida | iteracao local | subset de coverage |
| `quality:coverage:quiet` | quiet | coverage com menos output | pipelines com pouco log | mesmas verificacoes |
| `quality:coverage:quick-quiet` | quick+quiet | coverage reduzida e limpa | loop rapido | subset |
| `quality:coverage:silent` | silent | resumo final apenas | CI silencioso | mesmas verificacoes |
| `quality:coverage:quick-silent` | quick+silent | reduzido + minimo output | pre-check | subset |

## Lighthouse via namespace `quality:*`

| Script | Comando real | O que faz | Quando executar | Verifica/detecta |
|---|---|---|---|---|
| `quality:lighthouse` | `run-lighthouse.cjs` | lighthouse (home/feed conforme config) | auditoria perf real | falhas de Chrome/runtime, scores baixos, warnings |
| `quality:lighthouse:home` | `run-lighthouse.cjs --home` | lighthouse apenas home | otimizar landing | regressao de home |
| `quality:lighthouse:feed` | `run-lighthouse.cjs --feed` | lighthouse apenas feed | otimizar feed | regressao de feed |
| `quality:lighthouse:silent` | `run-lighthouse.cjs --silent` | output minimo | CI/log reduzido | mesmas verificacoes |

## Gate/orquestracao de qualidade

| Script | Comando real | O que faz | Quando executar | Verifica/detecta |
|---|---|---|---|---|
| `quality:gate` | `quality-core/cli/run.cjs` | orquestrador do gate local/preset | gate padrao antes de PR | erros de lint/test/i18n/perf conforme configuracao, warnings/violations no resumo |
| `quality:gate:quick` | gate `--quick` | gate reduzido | iteracao rapida | subset do gate |
| `quality:gate:silent` | gate `--silent` | gate com resumo final | CI/log baixo | mesmas verificacoes |
| `quality:gate:quick-silent` | quick+silent | gate reduzido e silencioso | pre-check rapido | subset do gate |
| `quality:gate:local-silent` | gate `--local --silent` | gate local sem depender de contexto CI | rotina diaria recomendada | erros/warnings/violations do gate local |
| `quality:gate:local-silent:nolint` | gate local sem lint | debug quando lint nao e alvo | investigar gargalo/instabilidade | tudo do gate exceto lint |

## Pipelines compostos de qualidade

| Script | Comando real | O que faz | Quando executar | Verifica/detecta |
|---|---|---|---|---|
| `quality:check` | `run-p lint type-check test security:scan` | baseline de qualidade | pre-PR rapido | lint errors/warnings, TS errors, test failures, security findings |
| `quality:full` | `rimraf dist && run-p lint type-check test:core quality:core` | pipeline completo base | pre-merge/release | todos os erros das etapas + violations quality-core |
| `quality:full:silent` | idem com `quality:core:silent` | pipeline completo com menos logs | CI local silencioso | mesmas verificacoes |
| `quality:full:quick` | idem com `quality:core:quick` | pipeline completo mais rapido | iteracao intermediaria | subset quality-core |
| `quality:full:quick-silent` | quick + silent | pipeline rapido e pouco log | CI local economico | subset + resumo |
| `quality:reports:all` | `quality:core && quality:lighthouse && quality:snapshot && analysis` | gera todos relatorios | pre-release/performance review | violations/warnings cross-area |
| `quality:reports:all:silent` | versao silenciosa | idem com menos output | automacao | mesmas verificacoes |
| `quality:ci` | `quality:full && quality:reports:all` | simulacao de pipeline CI completo | validacao final local | falhas em qualquer etapa + violations |
| `quality:ci:quick-silent` | `build` + gates quick/silent + lighthouse + analysis silent | CI rapido e silencioso | smoke de pipeline completa | build failures, quality failures, lighthouse/runtime, analysis violations |

## Operacoes e utilitarios

| Script | Comando real | O que faz | Quando executar | Verifica/detecta |
|---|---|---|---|---|
| `promo` | `serve _dev/ideas/promo-site` | sobe site promo local | revisar material promo | n/a |
| `promo:changelog` | `generate-changelog.cjs` | gera changelog automatizado | antes de build/release | falhas de parse git/changelog |
| `config:sync` | `sync-config.ts` | sincroniza configs markdown -> TS/runtime | apos editar configs base | inconsistencias de config |
| `audit:full` | `full-quality-audit.cjs` | auditoria ampla custom | investigacao aprofundada | falhas multi-modulo |
| `audit:capture` | `capture-audit.ts` | captura estado de auditoria | baseline e comparacao historica | falhas de coleta |
| `cleanup` | `run-pwsh cleanup-servers.ps1` | limpeza de processos/servidores locais | quando portas ficam presas | falhas operacionais de script |
| `system:start` | `run-pwsh start-all.ps1` | start automatizado de componentes locais | setup rapido de ambiente | falhas de start de servicos |

## Sobre `quick`, `quiet`, `silent`

- `quick`: reduz escopo/tempo de execucao (menos checks ou subset).
- `quiet`: reduz verbosidade, mantendo informacao util de progresso e resumo.
- `silent`: minimo output, normalmente apenas resumo final.

## Tipos de check por familia

### `lint*`
- ESLint rules (React, TS, hooks, estilo, anti-patterns)
- Saida: `errors` bloqueantes e `warnings` nao-bloqueantes

### `type-check`
- TypeScript compiler (`tsc --noEmit`)
- Saida: apenas `errors` de tipo/resolucao

### `test*`
- Vitest/Playwright assertions, runtime, timeout
- Saida: `failed tests`, stack traces, coverage summary (quando cobertura)

### `security:scan`
- padroes de segredo e risco
- Saida: severidade (`critical/high/medium`) + arquivo/linha

### `quality:*`, `analysis*`, `perf:*`
- thresholds, bundle size, lighthouse score, regras semanticas de auditoria
- Saida: `warnings` e `violations` no resumo do Quality Core

## Localizacao dos relatorios

Os scripts de qualidade escrevem principalmente em:
- `performance-reports/logs`
- `performance-reports/quality`
- `performance-reports/lighthouse`
- `performance-reports/analysis`
- `performance-reports/coverage`
- `performance-reports/quality-snapshots`

## Observacoes importantes

- `deploy` faz `commit` e `push` automaticos: use apenas quando quiser publicar.
- Em ambiente local com pouca verbosidade, prefira `*-quiet` ou `*-silent`.
- Para diagnosticar gargalo de tempo, priorize `quality:gate:local-silent` e `quality:coverage:quick`.
