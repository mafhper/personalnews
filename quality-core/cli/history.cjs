/**
 * Execution History Manager
 * Manages the storage and retrieval of script execution times to calculate averages.
 */
const fs = require('fs')
const path = require('path')

const HISTORY_DIR = path.join(process.cwd(), 'performance-reports', 'logs')
const HISTORY_FILE = path.join(HISTORY_DIR, 'execution_history.json')
const MAX_HISTORY_ENTRIES = 20 // Keep last 20 runs for average calculation

/**
 * Ensure the directory exists
 */
function ensureDir() {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true })
  }
}

/**
 * Load execution history
 * @returns {Object} History object { scriptName: [durations] }
 */
function loadHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return {}
    }
    const data = fs.readFileSync(HISTORY_FILE, 'utf8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

function buildKey(scriptName, mode) {
  const safeMode = mode ? String(mode).trim() : ''
  if (!safeMode) return String(scriptName)
  return `${scriptName}:${safeMode}`
}

/**
 * Save execution stats
 * @param {string} scriptName
 * @param {number} durationMs
 * @param {string} [mode] */
function saveExecutionTime(scriptName, durationMs, mode) {
  ensureDir()
  const history = loadHistory()
  const keys = new Set([String(scriptName), buildKey(scriptName, mode)])

  keys.forEach((key) => {
    if (!history[key]) {
      history[key] = []
    }
    history[key].push(durationMs)
    if (history[key].length > MAX_HISTORY_ENTRIES) {
      history[key] = history[key].slice(-MAX_HISTORY_ENTRIES)
    }
  })

  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
  } catch {
    // Ignore write errors to avoid breaking the pipeline
  }
}

/**
 * Get average duration for a script
 * @param {string} scriptName
 * @param {string} [mode]
 * @returns {string|null} Formatted average time or null if no history
 */
function getAverageDuration(scriptName, mode) {
  const history = loadHistory()
  const key = buildKey(scriptName, mode)
  const times = history[key] || history[scriptName]

  if (!times || times.length === 0) {
    return null
  }

  const avgMs = times.reduce((a, b) => a + b, 0) / times.length
  return (avgMs / 1000).toFixed(2) + 's'
}

module.exports = {
  saveExecutionTime,
  getAverageDuration,
  buildKey,
}
