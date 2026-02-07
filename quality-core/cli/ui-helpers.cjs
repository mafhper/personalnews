/**
 * CLI UI Enhancements
 * Provides better visual feedback for CLI scripts.
 */

const fs = require('fs')
const path = require('path')
const util = require('util')

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
}

const SYMBOLS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  arrow: '→',
  bullet: '•',
  check: '✓',
  cross: '✕',
  star: '⭐',
  clock: '⏱️',
  package: '📦',
  rocket: '🚀',
  folder: '📁',
  file: '📄',
  bar: '▓',
}

const OUTPUT_CONFIG_PATH = path.resolve(__dirname, '../config/cli-output.config.json')
const DEFAULT_OUTPUT_CONFIG = {
  levelPrefixes: ['|', '|-', '|--', '|---', '|----'],
  separatorWidth: 50,
  wrapWidth: 100,
  separators: {
    default: '─',
    header: '─',
    summary: '=',
  },
}

function loadOutputConfig() {
  try {
    if (!fs.existsSync(OUTPUT_CONFIG_PATH)) return DEFAULT_OUTPUT_CONFIG
    const raw = JSON.parse(fs.readFileSync(OUTPUT_CONFIG_PATH, 'utf8'))
    const prefixes = Array.isArray(raw.levelPrefixes) ? raw.levelPrefixes.filter(Boolean) : null
    const separatorWidth = Number.parseInt(raw.separatorWidth, 10)
    const wrapWidth = Number.parseInt(raw.wrapWidth, 10)
    const separators = raw.separators && typeof raw.separators === 'object' ? raw.separators : null

    return {
      levelPrefixes: prefixes && prefixes.length > 0 ? prefixes : DEFAULT_OUTPUT_CONFIG.levelPrefixes,
      separatorWidth:
        Number.isFinite(separatorWidth) && separatorWidth > 20
          ? separatorWidth
          : DEFAULT_OUTPUT_CONFIG.separatorWidth,
      wrapWidth:
        Number.isFinite(wrapWidth) && wrapWidth >= 60
          ? wrapWidth
          : DEFAULT_OUTPUT_CONFIG.wrapWidth,
      separators: {
        ...DEFAULT_OUTPUT_CONFIG.separators,
        ...(separators || {}),
      },
    }
  } catch {
    return DEFAULT_OUTPUT_CONFIG
  }
}

const OUTPUT_CONFIG = loadOutputConfig()

let spinnerIndex = 0
let spinnerInterval = null
let elapsedInterval = null
let elapsedActive = false

function getPrefix(level = 0) {
  const prefixes = OUTPUT_CONFIG.levelPrefixes || DEFAULT_OUTPUT_CONFIG.levelPrefixes
  const safeLevel = Number.isFinite(level) && level >= 0 ? Math.floor(level) : 0
  if (safeLevel < prefixes.length) {
    return prefixes[safeLevel]
  }

  const fallback = prefixes[prefixes.length - 1] || '|-'
  const extraDepth = safeLevel - prefixes.length + 1
  return `${fallback}${'-'.repeat(extraDepth)}`
}

function hierarchy(text, { level = 0, color = null, bold = false } = {}) {
  const prefix = getPrefix(level)
  const colorCode = color && c[color] ? c[color] : ''
  const weight = bold ? c.bold : ''
  return `${colorCode}${weight}${prefix} ${text}${c.reset}`
}

function wrapText(text, maxWidth = OUTPUT_CONFIG.wrapWidth) {
  const safe = String(text || '').trim()
  if (!safe) return ['']
  if (!Number.isFinite(maxWidth) || maxWidth < 20 || safe.length <= maxWidth) {
    return [safe]
  }

  const words = safe.split(/\s+/)
  const lines = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxWidth) {
      current = candidate
      continue
    }

    if (current) {
      lines.push(current)
      current = word
    } else {
      lines.push(word)
    }
  }

  if (current) lines.push(current)
  return lines
}

function printWrapped(text, { level = 1, color = null, bold = false } = {}) {
  const lines = wrapText(text)
  for (const line of lines) {
    console.log(hierarchy(line, { level, color, bold }))
  }
}

function separator(length = OUTPUT_CONFIG.separatorWidth, char = OUTPUT_CONFIG.separators.default) {
  return c.dim + String(char || '─').repeat(length) + c.reset
}

function hierarchySeparator({ level = 0, kind = 'default' } = {}) {
  const char = OUTPUT_CONFIG.separators[kind] || OUTPUT_CONFIG.separators.default || '─'
  return `${c.dim}${getPrefix(level)}${String(char).repeat(OUTPUT_CONFIG.separatorWidth)}${c.reset}`
}

function formatTag(label = 'QC', level = 'info') {
  const colorMap = {
    info: c.blue,
    warn: c.yellow,
    error: c.red,
    success: c.green,
  }
  const color = colorMap[level] || c.blue
  const safeLabel = String(label).toUpperCase()
  return `${c.dim}[${color}${safeLabel}${c.dim}]${c.reset}`
}

function formatMessage(args) {
  return util.format(...args)
}

function createLogger({ tag = 'QC', silent = false, quiet = false } = {}) {
  const clearElapsed = () => {
    if (!elapsedActive || !process.stdout.isTTY) return
    clearLine()
  }
  return {
    info: (...args) => {
      if (silent || quiet) return
      clearElapsed()
      console.log(`${formatTag(tag, 'info')} ${formatMessage(args)}`)
    },
    warn: (...args) => {
      if (silent) return
      clearElapsed()
      console.warn(`${formatTag(tag, 'warn')} ${formatMessage(args)}`)
    },
    error: (...args) => {
      clearElapsed()
      console.error(`${formatTag(tag, 'error')} ${formatMessage(args)}`)
    },
    success: (...args) => {
      if (silent || quiet) return
      clearElapsed()
      console.log(`${formatTag(tag, 'success')} ${formatMessage(args)}`)
    },
    raw: (...args) => {
      if (silent || quiet) return
      clearElapsed()
      console.log(...args)
    },
  }
}

function title(text, style = 'blue') {
  const color = c[style] || ''
  return `${color}${c.bold}═══ ${text} ═══${c.reset}`
}

function printHeader({ title: headerTitle, modes = [], active = [] }) {
  console.log(hierarchy(`══════ ${headerTitle} ══════`, { level: 0, color: 'cyan', bold: true }))
  if (modes.length > 0) {
    console.log(hierarchy('Modes:', { level: 1, color: 'dim' }))
    for (const mode of modes) {
      for (const line of wrapText(mode)) {
        console.log(hierarchy(line, { level: 2, color: 'dim' }))
      }
    }
  }
  console.log(hierarchy('Active:', { level: 1, color: 'dim' }))
  if (active.length > 0) {
    for (const item of active) {
      for (const line of wrapText(item)) {
        console.log(hierarchy(line, { level: 2, color: 'yellow' }))
      }
    }
  } else {
    console.log(hierarchy('default', { level: 2, color: 'yellow' }))
  }
  console.log(hierarchySeparator({ level: 0, kind: 'header' }))
  console.log('')
}

function success(text, prefix = true) {
  return `${prefix ? `${c.green}${SYMBOLS.success}${c.reset} ` : ''}${c.green}${text}${c.reset}`
}

function error(text, prefix = true) {
  return `${prefix ? `${c.red}${SYMBOLS.error}${c.reset} ` : ''}${c.red}${text}${c.reset}`
}

function warning(text, prefix = true) {
  return `${prefix ? `${c.yellow}${SYMBOLS.warning}${c.reset} ` : ''}${c.yellow}${text}${c.reset}`
}

function info(text, prefix = true) {
  return `${prefix ? `${c.blue}${SYMBOLS.info}${c.reset} ` : ''}${c.blue}${text}${c.reset}`
}

function progressBar(current, total, width = 20) {
  const safeTotal = Math.max(total, 1)
  const percentage = Math.max(0, Math.min(1, current / safeTotal))
  const filled = Math.round(width * percentage)
  const empty = Math.max(0, width - filled)
  const bar = c.green + SYMBOLS.bar.repeat(filled) + c.dim + '░'.repeat(empty) + c.reset
  const percent = Math.round(percentage * 100)
  return `${bar} ${percent}%`
}

function startSpinner(message = 'Loading...') {
  spinnerIndex = 0
  spinnerInterval = setInterval(() => {
    process.stdout.write(`\r${c.cyan}${SYMBOLS.spinner[spinnerIndex % SYMBOLS.spinner.length]}${c.reset} ${message}`)
    spinnerIndex += 1
  }, 80)
}

function stopSpinner(finalMessage = '', ok = true) {
  if (spinnerInterval) {
    clearInterval(spinnerInterval)
    spinnerInterval = null
  }
  const symbol = ok ? SYMBOLS.success : SYMBOLS.error
  const color = ok ? c.green : c.red
  process.stdout.write(`\r${color}${symbol}${c.reset} ${finalMessage}\n`)
}

function startElapsedTimer({ avgLabel = null, label = 'Elapsed', extraText = '', level = 1 } = {}) {
  if (!process.stdout.isTTY) {
    return () => {}
  }

  elapsedActive = true
  const start = Date.now()
  const render = () => {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    const avgText = avgLabel ? ` | Avg: ${avgLabel}` : ''
    const extra = extraText ? ` ${extraText}` : ''
    clearLine()
    process.stdout.write(
      hierarchy(`${SYMBOLS.clock} ${label}: ${elapsed}s${avgText}${extra}`, {
        level,
        color: 'dim',
      })
    )
  }

  render()
  elapsedInterval = setInterval(render, 1000)

  return () => {
    if (elapsedInterval) {
      clearInterval(elapsedInterval)
      elapsedInterval = null
    }
    elapsedActive = false
    clearLine()
  }
}

function shouldLiveTimer() {
  return process.stdout.isTTY && process.env.QC_LIVE_TIMER === 'true'
}

function printTimingHeader({ avgLabel = null, modeLabel = null, live = false } = {}) {
  const avgText = avgLabel ? ` | Avg: ${avgLabel}` : ''
  const modeText = modeLabel ? ` | Mode: ${modeLabel}` : ''
  if (live) {
    return startElapsedTimer({ avgLabel, label: 'Elapsed', extraText: modeText, level: 1 })
  }
  console.log(hierarchy(`${SYMBOLS.clock} Elapsed: 0.0s${avgText}${modeText}`, { level: 1, color: 'dim' }))
  return null
}

function metric(label, value, unit = '', color = 'cyan') {
  const chosen = c[color] || c.cyan
  return `${label}: ${chosen}${c.bold}${value}${unit}${c.reset}`
}

function section(sectionTitle, level = 1) {
  return `\n${hierarchy(`── ${sectionTitle} ──`, { level, color: 'white', bold: true })}\n`
}

function table(data, options = {}) {
  const { headers = [], widths = [] } = options

  let output = '\n'

  if (headers.length > 0) {
    const headerRow = headers
      .map((h, i) => {
        const width = widths[i] || 20
        return h.padEnd(width)
      })
      .join(' ')
    output += `${c.bold}${c.cyan}${headerRow}${c.reset}\n`
    output += separator(50) + '\n'
  }

  data.forEach(row => {
    const rowStr = row
      .map((cell, i) => {
        const width = widths[i] || 20
        return String(cell).padEnd(width)
      })
      .join(' ')
    output += rowStr + '\n'
  })

  output += '\n'
  return output
}

function clearLine() {
  process.stdout.write('\x1b[2K\r')
}

function truncateOutput(output, maxLines = 15) {
  if (!output) return ''
  const lines = output.split('\n')
  if (lines.length <= maxLines) return output

  const head = lines.slice(0, Math.ceil(maxLines / 2))
  const tail = lines.slice(-Math.floor(maxLines / 2))

  return [...head, `... (${lines.length - maxLines} lines truncated) ...`, ...tail].join('\n')
}

function printPlan(tasks) {
  console.log('')
  console.log(hierarchy('══════ Execution Plan ══════', { level: 0, color: 'magenta', bold: true }))

  let totalSeconds = 0
  let totalCount = 0

  tasks.forEach((task, index) => {
    const avg = task.avg ? ` (avg ${task.avg})` : ''
    console.log(hierarchy(`${index + 1}. ${task.name}${avg}`, { level: 1, color: 'dim' }))

    if (task.avg) {
      const match = String(task.avg).match(/([\d.]+)/)
      if (match) {
        totalSeconds += Number.parseFloat(match[1])
        totalCount += 1
      }
    }
  })

  if (totalCount > 0) {
    console.log(hierarchy(`ETA (avg total): ${totalSeconds.toFixed(2)}s`, { level: 1, color: 'dim' }))
  }

  console.log(hierarchySeparator({ level: 0, kind: 'header' }))
}

function printScriptStart(name, index, total) {
  const progress = `[${index}/${total}]`
  const bar = progressBar(index - 1, total, 14)
  console.log('')
  console.log(hierarchy(`▶ ${progress} ${bar} [START] ${name}`, { level: 1, color: 'cyan', bold: true }))
}

function printScriptEnd(name, durationMs, avgDuration, ok) {
  const duration = `${(durationMs / 1000).toFixed(2)}s`
  const color = ok ? 'green' : 'red'
  const icon = ok ? SYMBOLS.success : SYMBOLS.error
  let stats = `Elapsed: ${duration}`
  if (avgDuration) {
    stats += ` | Avg: ${avgDuration}`
  }

  console.log(hierarchy(`${icon} [END] ${name} - ${stats}`, { level: 1, color }))
  console.log(hierarchySeparator({ level: 0, kind: 'header' }))
  console.log('')
}

function printQuietStepStart(name, index, total) {
  const progress = `[${index}/${total}]`
  console.log('')
  console.log(hierarchy(`▶ ${progress} running ${name}...`, { level: 1, color: 'dim' }))
}

function printQuietStepEnd(name, index, total, durationMs, avgDuration, ok) {
  const duration = `${(durationMs / 1000).toFixed(2)}s`
  const progress = `[${index}/${total}]`
  const icon = ok ? SYMBOLS.success : SYMBOLS.error
  const color = ok ? 'green' : 'red'
  let stats = `Elapsed: ${duration}`
  if (avgDuration) {
    stats += ` | Avg: ${avgDuration}`
  }
  console.log(hierarchy(`${icon} ${progress} ${name} - ${stats}`, { level: 1, color }))
  console.log('')
}

function printSummary({
  title: summaryTitle,
  metrics = [],
  timings = [],
  status = null,
  errors = [],
  warnings = [],
  duration = 0,
  reportDir = null,
  maxItems = 5,
}) {
  console.log('')
  console.log(hierarchySeparator({ level: 0, kind: 'summary' }))
  console.log(hierarchy(`📊 RESUMO DA EXECUÇÃO - ${summaryTitle}`, { level: 0, color: 'white', bold: true }))
  console.log(hierarchySeparator({ level: 0, kind: 'summary' }))

  if (status) {
    const statusIcon = status === 'pass' ? SYMBOLS.success : SYMBOLS.error
    const statusText = status === 'pass' ? 'PASSOU' : 'FALHOU'
    console.log(hierarchy(`${statusIcon} Status: ${statusText}`, { level: 1, color: status === 'pass' ? 'green' : 'red' }))
  }

  if (metrics.length > 0) {
    metrics.forEach(item => printWrapped(item, { level: 1, color: 'cyan' }))
  }

  if (timings.length > 0) {
    console.log(hierarchy(`${SYMBOLS.clock} Tempos por etapa:`, { level: 1, color: 'white' }))
    timings.forEach(item => printWrapped(item, { level: 2, color: 'dim' }))
  }

  if (warnings.length > 0) {
    console.log(hierarchy(`${SYMBOLS.warning} Avisos (${warnings.length}):`, { level: 1, color: 'yellow' }))
    const shown = warnings.slice(0, maxItems)
    shown.forEach(item => printWrapped(item, { level: 2, color: 'yellow' }))
    if (warnings.length > maxItems) {
      console.log(hierarchy(`... e mais ${warnings.length - maxItems}`, { level: 2, color: 'yellow' }))
    }
  }

  if (errors.length > 0) {
    console.log(hierarchy(`${SYMBOLS.error} Erros (${errors.length}):`, { level: 1, color: 'red' }))
    const shown = errors.slice(0, maxItems)
    shown.forEach(item => printWrapped(item, { level: 2, color: 'red' }))
    if (errors.length > maxItems) {
      console.log(hierarchy(`... e mais ${errors.length - maxItems}`, { level: 2, color: 'red' }))
    }
  }

  console.log(hierarchy(`${SYMBOLS.clock} Tempo de execução: ${duration}s`, { level: 1, color: 'dim' }))
  if (reportDir) {
    console.log(hierarchy(`${SYMBOLS.folder} Relatórios: ${reportDir}`, { level: 1, color: 'dim' }))
  }
  console.log(hierarchySeparator({ level: 0, kind: 'summary' }))
}

module.exports = {
  colors: c,
  symbols: SYMBOLS,
  outputConfig: OUTPUT_CONFIG,
  hierarchy,
  getPrefix,
  hierarchySeparator,
  printWrapped,
  wrapText,
  title,
  success,
  error,
  warning,
  info,
  formatTag,
  createLogger,
  progressBar,
  startSpinner,
  stopSpinner,
  separator,
  metric,
  section,
  table,
  clearLine,
  printSummary,
  printHeader,
  startElapsedTimer,
  printTimingHeader,
  shouldLiveTimer,
  truncateOutput,
  printPlan,
  printScriptStart,
  printScriptEnd,
  printQuietStepStart,
  printQuietStepEnd,
}
