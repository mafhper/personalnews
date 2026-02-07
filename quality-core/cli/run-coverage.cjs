/**
 * Coverage Runner CLI
 * Adds standardized UI, quick/silent modes, and summary output.
 */
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const UI = require('./ui-helpers.cjs')
const History = require('./history.cjs')
const { refreshDashboardCache } = require('./dashboard-cache.cjs')

const args = process.argv.slice(2)
const isSilent = args.includes('--silent') || args.includes('-s')
const isQuiet = args.includes('--quiet') || args.includes('-q')
const isQuick = args.includes('--quick')

const executionLog = {
  startTime: Date.now(),
  errors: [],
}

const COVERAGE_DIR = path.join(process.cwd(), 'performance-reports', 'coverage')
const REPORT_PATH = path.join(COVERAGE_DIR, 'temp-vitest-report.json')
const LEGACY_COVERAGE_DIR = path.join(process.cwd(), 'coverage')
const FORCE_TIMEOUT_RESOLVE_MS = 5000
const SOFT_KILL_GRACE_MS = 800

const parsedTimeout = Number.parseInt(
  process.env.QC_COVERAGE_TIMEOUT_MS || process.env.COVERAGE_TIMEOUT_MS || '',
  10
)
const parsedHeartbeat = Number.parseInt(process.env.QC_COVERAGE_HEARTBEAT_SEC || '20', 10)
const COVERAGE_TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0
  ? parsedTimeout
  : isQuick
    ? 8 * 60 * 1000
    : 20 * 60 * 1000
const COVERAGE_HEARTBEAT_MS = Number.isFinite(parsedHeartbeat) && parsedHeartbeat > 0
  ? parsedHeartbeat * 1000
  : 20 * 1000

function resolveBunBinary() {
  if (process.env.BUN_PATH) return process.env.BUN_PATH
  if (process.versions && process.versions.bun && process.execPath) return process.execPath

  const home = process.env.HOME || process.env.USERPROFILE || ''
  const fallbackUnix = path.join(home, '.bun', 'bin', 'bun')
  if (home && fs.existsSync(fallbackUnix)) {
    return fallbackUnix
  }

  return process.platform === 'win32' ? 'bun.exe' : 'bun'
}

function withRuntimePath(baseEnv, runtimeBin) {
  const env = { ...baseEnv }
  const runtimeDir = runtimeBin ? path.dirname(runtimeBin) : ''
  if (!runtimeDir) return env

  const key = process.platform === 'win32' ? 'Path' : 'PATH'
  const current = env[key] || env.PATH || ''
  if (!current.split(path.delimiter).includes(runtimeDir)) {
    env[key] = current ? `${runtimeDir}${path.delimiter}${current}` : runtimeDir
  }

  return env
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function runDetached(cmd, cmdArgs) {
  return new Promise(resolve => {
    const killer = spawn(cmd, cmdArgs, {
      cwd: process.cwd(),
      shell: false,
      stdio: 'ignore',
    })

    killer.on('error', () => resolve(false))
    killer.on('close', () => resolve(true))
  })
}

function captureOutput(cmd, cmdArgs) {
  return new Promise(resolve => {
    const reader = spawn(cmd, cmdArgs, {
      cwd: process.cwd(),
      shell: false,
      stdio: ['ignore', 'pipe', 'ignore'],
    })

    let stdout = ''
    reader.stdout?.on('data', chunk => {
      stdout += String(chunk)
    })
    reader.on('error', () => resolve(''))
    reader.on('close', () => resolve(stdout))
  })
}

async function collectDescendantPids(rootPid) {
  const descendants = []
  const queue = [rootPid]
  const seen = new Set([rootPid])

  while (queue.length > 0) {
    const currentPid = queue.shift()
    const output = await captureOutput('ps', ['-o', 'pid=', '--ppid', String(currentPid)])
    const children = output
      .split(/\s+/)
      .map(value => Number.parseInt(value, 10))
      .filter(pid => Number.isFinite(pid) && pid > 0)

    for (const childPid of children) {
      if (seen.has(childPid)) continue
      seen.add(childPid)
      descendants.push(childPid)
      queue.push(childPid)
    }
  }

  return descendants
}

async function killProcessTree(child) {
  if (!child || !child.pid) return

  if (process.platform === 'win32') {
    await runDetached('taskkill', ['/PID', String(child.pid), '/T', '/F'])
    return
  }

  const descendants = await collectDescendantPids(child.pid)
  const orderedDescendants = [...descendants].reverse()
  for (const pid of orderedDescendants) {
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      // process already terminated
    }
  }

  try {
    process.kill(child.pid, 'SIGTERM')
  } catch {
    return
  }

  await wait(SOFT_KILL_GRACE_MS)

  for (const pid of orderedDescendants) {
    try {
      process.kill(pid, 0)
      process.kill(pid, 'SIGKILL')
    } catch {
      // process already terminated
    }
  }

  try {
    process.kill(child.pid, 0)
    process.kill(child.pid, 'SIGKILL')
  } catch {
    // process already terminated
  }
}

function filterDotOutput(output) {
  if (!output) return ''
  const lines = output.split(/\r?\n/)
  const filtered = lines.filter(line => {
    const trimmed = line.trim()
    if (!trimmed) return false
    return !/^[·.xX]+$/.test(trimmed)
  })
  return filtered.join('\n')
}

function extractFailureSummary(output, maxLines = 18) {
  if (!output) return null
  const lines = output.split(/\r?\n/)
  const blocks = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('FAIL ')) {
      const block = [lines[i]]
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j]
        const nextTrim = next.trim()
        if (nextTrim.startsWith('FAIL ') || nextTrim.startsWith('Test Files')) {
          i = j - 1
          break
        }
        if (nextTrim.startsWith('⎯')) {
          i = j
          break
        }
        block.push(next)
      }
      blocks.push(block.join('\n').trim())
    }
  }

  if (blocks.length > 0) {
    return blocks
      .slice(0, 2)
      .flatMap(block => block.split(/\r?\n/))
      .filter(Boolean)
      .slice(0, maxLines)
  }

  const summaryLine = lines.find(l => l.trim().startsWith('Test Files'))
  if (summaryLine) return [summaryLine.trim()]

  return null
}

function readVitestReport() {
  if (!fs.existsSync(REPORT_PATH)) return null
  try {
    return JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'))
  } catch (err) {
    executionLog.errors.push(`Failed to parse vitest report: ${err.message}`)
    return null
  }
}

function summarizeVitestFailures(report, maxTests = 4) {
  if (!report || !Array.isArray(report.testResults)) return null

  const failures = []
  for (const result of report.testResults) {
    const assertionResults = Array.isArray(result.assertionResults)
      ? result.assertionResults
      : []
    const failedAssertions = assertionResults.filter(a => a.status === 'failed')

    if (failedAssertions.length === 0 && result.status !== 'failed') continue

    failures.push(`FAIL ${result.name}`)
    if (failedAssertions.length > 0) {
      for (const assertion of failedAssertions) {
        failures.push(`- ${assertion.fullName || assertion.title}`)
        if (failures.length >= maxTests * 3) break
      }
    } else if (result.message) {
      const message = String(result.message).split(/\r?\n/).slice(0, 3)
      failures.push(...message.map(line => `- ${line}`))
    }

    if (failures.length >= maxTests * 3) break
  }

  return failures.length > 0 ? failures.slice(0, maxTests * 3) : null
}

function getCoverageSummaryPath() {
  const primary = path.join(COVERAGE_DIR, 'coverage-summary.json')
  if (fs.existsSync(primary)) return primary
  const legacy = path.join(LEGACY_COVERAGE_DIR, 'coverage-summary.json')
  if (fs.existsSync(legacy)) return legacy
  return null
}

function getCoverageFinalPath() {
  const primary = path.join(COVERAGE_DIR, 'coverage-final.json')
  if (fs.existsSync(primary)) return primary
  const legacy = path.join(LEGACY_COVERAGE_DIR, 'coverage-final.json')
  if (fs.existsSync(legacy)) return legacy
  return null
}

function copyCoverageArtifact(sourcePath, targetPath) {
  if (!sourcePath || !fs.existsSync(sourcePath)) return false
  try {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.copyFileSync(sourcePath, targetPath)
    return true
  } catch {
    return false
  }
}

function ensureCoverageArtifacts() {
  const summaryTarget = path.join(COVERAGE_DIR, 'coverage-summary.json')
  const finalTarget = path.join(COVERAGE_DIR, 'coverage-final.json')
  const summaryPath = getCoverageSummaryPath()
  const finalPath = getCoverageFinalPath()

  const summaryOk = summaryPath
    ? summaryPath === summaryTarget || copyCoverageArtifact(summaryPath, summaryTarget)
    : false
  const finalOk = finalPath
    ? finalPath === finalTarget || copyCoverageArtifact(finalPath, finalTarget)
    : false

  return {
    summaryOk,
    finalOk,
    summaryPath: summaryOk ? summaryTarget : summaryPath,
    finalPath: finalOk ? finalTarget : finalPath,
  }
}

function readCoverageSummary() {
  const summaryPath = getCoverageSummaryPath()
  if (!summaryPath) return null
  try {
    const data = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'))
    const total = data.total
    if (!total) return null
    return {
      lines: total.lines?.pct ?? null,
      statements: total.statements?.pct ?? null,
      functions: total.functions?.pct ?? null,
      branches: total.branches?.pct ?? null,
    }
  } catch (err) {
    executionLog.errors.push(`Failed to read coverage summary: ${err.message}`)
    return null
  }
}

function buildVitestArgs() {
  const vitestArgs = ['vitest', 'run', '--environment', 'jsdom', '--coverage']
  vitestArgs.push(
    '--coverage.enabled=true',
    '--coverage.reporter=json-summary',
    '--coverage.reporter=json',
    '--coverage.reportsDirectory=performance-reports/coverage'
  )
  if (isQuick) {
    vitestArgs.push('--config', 'quality-core/config/vitest.config.core.ts')
  }
  if (isSilent || isQuiet) {
    vitestArgs.push('--silent', '--reporter', 'json', '--outputFile', REPORT_PATH)
  }
  return vitestArgs
}

async function runCoverage() {
  const historyKey = 'coverage'
  const modeLabel = [
    isQuick ? 'quick' : 'full',
    isSilent ? 'silent' : isQuiet ? 'quiet' : 'default',
  ].join('-')
  if (!fs.existsSync(COVERAGE_DIR)) {
    fs.mkdirSync(COVERAGE_DIR, { recursive: true })
  }
  let stopTimer = null
  if (!isSilent) {
    UI.printHeader({
      title: 'QUALITY CORE - COVERAGE',
      modes: ['--quick', '--silent', '--quiet'],
      active: [
        isQuick ? 'quick' : null,
        isSilent ? 'silent' : null,
        isQuiet ? 'quiet' : null,
      ].filter(Boolean),
    })
    const avgHeader = History.getAverageDuration(historyKey, modeLabel)
    stopTimer = UI.printTimingHeader({
      avgLabel: avgHeader,
      modeLabel,
      live: UI.shouldLiveTimer() && !isQuiet,
    })
    if (!isQuiet) {
      UI.printWrapped('Legenda:', { level: 1, color: 'dim' })
      UI.printWrapped('✅ PASS: testes de cobertura concluídos + artefatos completos.', { level: 2, color: 'green' })
      UI.printWrapped('❌ FAIL: erro de teste, timeout ou artefato de cobertura ausente.', { level: 2, color: 'red' })
      UI.printWrapped('⏱️ Heartbeat mostra progresso sem poluir o log.', { level: 2, color: 'dim' })
      console.log('')
    }
  }

  const avg = History.getAverageDuration(historyKey, modeLabel)

  if (!isSilent && !isQuiet) {
    UI.printPlan([
      {
        name: isQuick ? 'Coverage (core tests)' : 'Coverage (full tests)',
        avg,
      },
    ])
  }

  if (!isSilent && !isQuiet) {
    UI.printScriptStart('coverage', 1, 1)
  } else if (isQuiet) {
    UI.printQuietStepStart('coverage', 1, 1)
  }

  const vitestArgs = buildVitestArgs()
  const bunBin = resolveBunBinary()
  const child = spawn(bunBin, vitestArgs, {
    stdio: isSilent || isQuiet ? 'pipe' : 'inherit',
    shell: false,
    env: withRuntimePath(process.env, bunBin),
  })

  let stdout = ''
  let stderr = ''
  let settled = false
  let timedOut = false
  let timeoutForceTimer = null
  let timeoutHandle = null
  let heartbeat = null
  const startedAt = Date.now()

  const finalizeOnce = async (code) => {
    if (settled) return
    settled = true
    if (heartbeat) clearInterval(heartbeat)
    if (timeoutForceTimer) clearTimeout(timeoutForceTimer)
    if (timeoutHandle) clearTimeout(timeoutHandle)

    const durationMs = Date.now() - executionLog.startTime
    History.saveExecutionTime(historyKey, durationMs, modeLabel)
    const avgDuration = History.getAverageDuration(historyKey, modeLabel)
    const success = code === 0 && !timedOut

    if (!success) {
      const report = readVitestReport()
      const vitestSummary = summarizeVitestFailures(report)
      if (vitestSummary && vitestSummary.length > 0) {
        executionLog.errors.push(...vitestSummary)
      } else {
        const rawOutput = [stdout, stderr].filter(Boolean).join('\n')
        const filteredOutput = filterDotOutput(rawOutput)
        const summary = extractFailureSummary(filteredOutput)
        if (summary && summary.length > 0) {
          executionLog.errors.push(...summary)
        } else {
          const output = UI.truncateOutput(filteredOutput, 16)
          if (output) {
            executionLog.errors.push(...output.split('\n'))
          }
        }
      }
    }

    const coverageArtifacts = ensureCoverageArtifacts()
    const artifactsComplete = coverageArtifacts.summaryOk && coverageArtifacts.finalOk
    const finalSuccess = success && artifactsComplete

    if (!isSilent && !isQuiet) {
      UI.printScriptEnd('coverage', durationMs, avgDuration, finalSuccess)
    } else if (isQuiet) {
      UI.printQuietStepEnd('coverage', 1, 1, durationMs, avgDuration, finalSuccess)
    }
    if (stopTimer) stopTimer()

    if (isSilent || isQuiet) {
      const summary = readCoverageSummary()
      const metrics = []
      if (summary) {
        const parts = [
          summary.lines != null ? `Lines ${summary.lines}%` : null,
          summary.statements != null ? `Stmts ${summary.statements}%` : null,
          summary.functions != null ? `Funcs ${summary.functions}%` : null,
          summary.branches != null ? `Branches ${summary.branches}%` : null,
        ].filter(Boolean)
        if (parts.length > 0) {
          metrics.push(`Coverage: ${parts.join(' | ')}`)
        }
      }
      if (!artifactsComplete) {
        executionLog.errors.push(
          `Coverage artifacts incompletos: summary=${coverageArtifacts.summaryOk ? 'ok' : 'missing'} final=${coverageArtifacts.finalOk ? 'ok' : 'missing'}`
        )
      }
      UI.printSummary({
        title: 'COVERAGE',
        status: finalSuccess ? 'pass' : 'fail',
        metrics,
        errors: executionLog.errors.slice(0, 5),
        duration: (durationMs / 1000).toFixed(2),
        reportDir: coverageArtifacts.summaryPath
          ? path.dirname(coverageArtifacts.summaryPath)
          : COVERAGE_DIR,
      })
    }

    await refreshDashboardCache({ silent: isSilent || isQuiet })
    process.exitCode = finalSuccess ? 0 : 1
  }

  if (isSilent || isQuiet) {
    child.stdout.on('data', data => {
      stdout += data.toString()
    })
    child.stderr.on('data', data => {
      stderr += data.toString()
    })
  }

  child.on('error', err => {
    executionLog.errors.push(err.message)
    finalizeOnce(1)
  })

  heartbeat = setInterval(() => {
    if (isSilent) return
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)
    console.log(UI.info(`[coverage] Em execução: ${elapsed}s`))
  }, COVERAGE_HEARTBEAT_MS)

  timeoutHandle = setTimeout(() => {
    timedOut = true
    executionLog.errors.push(`Coverage timeout excedido (${COVERAGE_TIMEOUT_MS}ms)`)
    timeoutForceTimer = setTimeout(() => {
      finalizeOnce(1)
    }, FORCE_TIMEOUT_RESOLVE_MS)

    killProcessTree(child).catch(() => {
      // ignore kill errors
    })
  }, COVERAGE_TIMEOUT_MS)

  child.on('close', async code => {
    await finalizeOnce(code)
  })
}

runCoverage().catch(err => {
  console.error('[COVERAGE - ERROR] Failed to run coverage:', err.message)
  process.exitCode = 1
})
