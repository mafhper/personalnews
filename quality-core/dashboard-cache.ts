import fs from 'fs/promises'
import path from 'path'
import { SnapshotStore } from './snapshots.store'
import { QualitySnapshot } from './quality-schema'

export const DASHBOARD_CACHE_DIR = path.join(
  process.cwd(),
  'performance-reports',
  'dashboard'
)
export const DASHBOARD_CACHE_FILE = path.join(
  DASHBOARD_CACHE_DIR,
  'dashboard-cache.json'
)

export interface DashboardCacheSecurity {
  total: number
  critical: number
  high: number
  medium: number
  passed: boolean
  timestamp?: string
  findings?: Array<{
    id: string
    file: string
    line: number
    type: string
    severity: 'critical' | 'high' | 'medium'
    preview?: string
  }>
  findingsTruncated?: boolean
  findingsTotal?: number
}

export interface DashboardCacheSecurityHistoryItem {
  timestamp: string
  total: number
  critical: number
  high: number
  medium: number
}

export interface DashboardCacheScript {
  id: string
  runs: number
  avgSeconds: number
  lastSeconds: number
}

export interface DashboardCacheSummary {
  count: number
  latestTimestamp: string | null
  averages: {
    coverage: number
    performance: number
    bundleSize: number
    testsPassRate: number
    lcp: number
    cls: number
    tbt: number
  }
  security?: DashboardCacheSecurity | null
  securityHistory?: DashboardCacheSecurityHistoryItem[]
  coverageSummary?: {
    lines: { total: number; covered: number; pct: number }
    statements: { total: number; covered: number; pct: number }
    branches: { total: number; covered: number; pct: number }
    functions: { total: number; covered: number; pct: number }
  }
  coverageDetails?: Array<{
    file: string
    lines: { total: number; covered: number; pct: number; uncovered: number[] }
    statements: { total: number; covered: number; pct: number }
    branches: { total: number; covered: number; pct: number }
    functions: { total: number; covered: number; pct: number }
  }>
  scripts?: DashboardCacheScript[]
  scriptHistory?: Record<string, number[]>
}

export interface DashboardCachePayload {
  success: true
  generatedAt: string
  summary: DashboardCacheSummary
  data: QualitySnapshot[]
}

const round1 = (value: number) =>
  Number.isFinite(value) ? Number.parseFloat(value.toFixed(1)) : 0

const average = (values: number[]) => {
  const filtered = values.filter(v => Number.isFinite(v))
  if (filtered.length === 0) return 0
  const total = filtered.reduce((sum, v) => sum + v, 0)
  return total / filtered.length
}

const computeCoverageScore = (snapshot: QualitySnapshot) => {
  const coverage = snapshot.metrics.coverage
  const coverageComplete = Boolean(snapshot.dataQuality?.coverageComplete)
  const values = [coverage.lines, coverage.statements]
    .filter(v => typeof v === 'number' && !Number.isNaN(v))

  if (coverageComplete || coverage.branches > 0) {
    values.push(coverage.branches)
  }
  if (coverageComplete || coverage.functions > 0) {
    values.push(coverage.functions)
  }

  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

const getPrimaryLighthouseScore = (snapshot: QualitySnapshot) => {
  const perf = snapshot.metrics.performance
  const scoreCandidates = [
    perf.lighthouseFeed?.performance,
    perf.lighthouseHome?.performance,
    perf.lighthouse.performance,
  ]
    .filter(value => typeof value === 'number' && Number.isFinite(value))
    .map(value => Number(value))
  const valid = scoreCandidates.find(value => value > 0)
  if (typeof valid === 'number') return valid
  return snapshot.dataQuality?.lighthouseValid ? scoreCandidates[0] || 0 : Number.NaN
}

const safeNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

const countCovered = (values: unknown[]) =>
  values.filter(value => typeof value === 'number' && value > 0).length

const computeMetric = (values: unknown[]) => {
  const total = values.length
  const covered = countCovered(values)
  const pct = total > 0 ? (covered / total) * 100 : 0
  return { total, covered, pct }
}

type CoverageStatementLocation = { start?: { line?: number } }
type CoverageStatementMap = Record<string, CoverageStatementLocation>
type CoverageCounts = Record<string, number>
type CoverageBranchCounts = Record<string, number[]>
interface CoverageEntry {
  s?: CoverageCounts
  f?: CoverageCounts
  b?: CoverageBranchCounts
  statementMap?: CoverageStatementMap
}

const computeLineCoverage = (statementMap: CoverageStatementMap, statementCounts: CoverageCounts) => {
  const lineHits: Record<number, number> = {}
  Object.entries(statementMap || {}).forEach(([id, loc]) => {
    const line = loc?.start?.line
    if (!line) return
    const count = safeNumber(statementCounts?.[id])
    lineHits[line] = Math.max(lineHits[line] || 0, count)
  })
  const entries = Object.entries(lineHits)
  const total = entries.length
  const covered = entries.filter(([, count]) => count > 0).length
  const uncovered = entries
    .filter(([, count]) => count === 0)
    .map(([line]) => Number(line))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  return {
    total,
    covered,
    pct: total > 0 ? (covered / total) * 100 : 0,
    uncovered,
  }
}

export async function buildDashboardCache(): Promise<DashboardCachePayload> {
  const snapshots = await SnapshotStore.list()
  const latest = snapshots[0]
  let security: DashboardCacheSecurity | null = null
  let securityHistory: DashboardCacheSecurityHistoryItem[] = []
  let scripts: DashboardCacheScript[] = []
  let scriptHistory: Record<string, number[]> = {}
  let coverageSummary: DashboardCacheSummary['coverageSummary']
  let coverageDetails: DashboardCacheSummary['coverageDetails']

  const coverageAvg = average(snapshots.map(computeCoverageScore))
  const performanceAvg = average(snapshots.map(getPrimaryLighthouseScore))
  const bundleAvg = average(snapshots.map(s => s.metrics.performance.bundleSize || 0))
  const testsPassAvg = average(
    snapshots.map(s => {
      const total = s.metrics.tests.total || 0
      if (!total) return 0
      return (s.metrics.tests.passed / total) * 100
    })
  )
  const vitals = snapshots.map(s => s.metrics.performance.webVitals)
  const lcpAvg = average(vitals.map(v => v?.lcp || 0))
  const clsAvg = average(vitals.map(v => v?.cls || 0))
  const tbtAvg = average(vitals.map(v => v?.tbt || 0))

  try {
    const securityPath = path.join(
      process.cwd(),
      'performance-reports',
      'security',
      'security-latest.json'
    )
    const raw = JSON.parse(await fs.readFile(securityPath, 'utf-8'))
    if (raw && typeof raw === 'object') {
      security = {
        total: Number(raw.total) || 0,
        critical: Number(raw.critical) || 0,
        high: Number(raw.high) || 0,
        medium: Number(raw.medium) || 0,
        passed: Boolean(raw.passed),
        timestamp: raw.timestamp || raw.generatedAt,
        findings: Array.isArray(raw.findings) ? raw.findings : [],
        findingsTruncated: Boolean(raw.findingsTruncated),
        findingsTotal: Number(raw.findingsTotal || 0),
      }
    }
  } catch {
    security = null
  }

  try {
    const securityDir = path.join(
      process.cwd(),
      'performance-reports',
      'security'
    )
    const files = (await fs.readdir(securityDir))
      .filter(file => file.startsWith('security-') && file.endsWith('.json'))
      .filter(file => file !== 'security-latest.json')

    const entries = await Promise.all(
      files.map(async file => {
        const raw = JSON.parse(
          await fs.readFile(path.join(securityDir, file), 'utf-8')
        )
        const match = file.match(/security-(\d+)\.json/)
        const fallbackTs = match ? Number(match[1]) : 0
        const timestamp =
          raw.timestamp ||
          raw.generatedAt ||
          (fallbackTs ? new Date(fallbackTs).toISOString() : new Date().toISOString())
        return {
          timestamp,
          total: Number(raw.total) || 0,
          critical: Number(raw.critical) || 0,
          high: Number(raw.high) || 0,
          medium: Number(raw.medium) || 0,
        }
      })
    )
    securityHistory = entries
      .filter(entry => entry.timestamp)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
  } catch {
    securityHistory = []
  }

  try {
    const historyPath = path.join(
      process.cwd(),
      'performance-reports',
      'logs',
      'execution_history.json'
    )
    const history = JSON.parse(await fs.readFile(historyPath, 'utf-8'))
    if (history && typeof history === 'object') {
      scripts = Object.entries(history).map(([id, list]) => {
        const entries = Array.isArray(list) ? list : []
        const runs = entries.length
        const avgMs = runs
          ? entries.reduce((sum, v) => sum + Number(v || 0), 0) / runs
          : 0
        const lastMs = runs ? Number(entries[entries.length - 1] || 0) : 0
        return {
          id,
          runs,
          avgSeconds: round1(avgMs / 1000),
          lastSeconds: round1(lastMs / 1000),
        }
      })
      scriptHistory = Object.entries(history).reduce<Record<string, number[]>>(
        (acc, [id, list]) => {
          const entries = Array.isArray(list) ? list : []
          acc[id] = entries.map(value => round1(Number(value || 0) / 1000))
          return acc
        },
        {}
      )
    }
  } catch {
    scripts = []
    scriptHistory = {}
  }

  try {
    const coveragePath = path.join(
      process.cwd(),
      'performance-reports',
      'coverage',
      'coverage-final.json'
    )
    const raw = JSON.parse(await fs.readFile(coveragePath, 'utf-8')) as Record<
      string,
      CoverageEntry
    >
    const entries = Object.entries(raw || {}) as Array<[string, CoverageEntry]>
    const details = entries.map(([file, entry]) => {
      const statementCounts = Object.values(entry?.s || {})
      const functionCounts = Object.values(entry?.f || {})
      const branchCounts = Object.values(entry?.b || {}).flat()
      const lines = computeLineCoverage(entry?.statementMap || {}, entry?.s || {})
      return {
        file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
        lines,
        statements: computeMetric(statementCounts),
        branches: computeMetric(branchCounts),
        functions: computeMetric(functionCounts),
      }
    })
    const totals = details.reduce(
      (acc, item) => {
        acc.lines.total += item.lines.total
        acc.lines.covered += item.lines.covered
        acc.statements.total += item.statements.total
        acc.statements.covered += item.statements.covered
        acc.branches.total += item.branches.total
        acc.branches.covered += item.branches.covered
        acc.functions.total += item.functions.total
        acc.functions.covered += item.functions.covered
        return acc
      },
      {
        lines: { total: 0, covered: 0 },
        statements: { total: 0, covered: 0 },
        branches: { total: 0, covered: 0 },
        functions: { total: 0, covered: 0 },
      }
    )
    coverageSummary = {
      lines: {
        total: totals.lines.total,
        covered: totals.lines.covered,
        pct: totals.lines.total > 0 ? (totals.lines.covered / totals.lines.total) * 100 : 0,
      },
      statements: {
        total: totals.statements.total,
        covered: totals.statements.covered,
        pct: totals.statements.total > 0 ? (totals.statements.covered / totals.statements.total) * 100 : 0,
      },
      branches: {
        total: totals.branches.total,
        covered: totals.branches.covered,
        pct: totals.branches.total > 0 ? (totals.branches.covered / totals.branches.total) * 100 : 0,
      },
      functions: {
        total: totals.functions.total,
        covered: totals.functions.covered,
        pct: totals.functions.total > 0 ? (totals.functions.covered / totals.functions.total) * 100 : 0,
      },
    }
    coverageDetails = details.sort((a, b) => a.file.localeCompare(b.file))
  } catch {
    coverageSummary = undefined
    coverageDetails = undefined
  }

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    summary: {
      count: snapshots.length,
      latestTimestamp: latest?.timestamp || null,
      averages: {
        coverage: round1(coverageAvg),
        performance: round1(performanceAvg),
        bundleSize: round1(bundleAvg),
        testsPassRate: round1(testsPassAvg),
        lcp: round1(lcpAvg),
        cls: round1(clsAvg),
        tbt: round1(tbtAvg),
      },
      security,
      securityHistory,
      coverageSummary,
      coverageDetails,
      scripts,
      scriptHistory,
    },
    data: snapshots,
  }
}

export async function writeDashboardCache(
  payload?: DashboardCachePayload
): Promise<DashboardCachePayload> {
  const data = payload ?? (await buildDashboardCache())
  await fs.mkdir(DASHBOARD_CACHE_DIR, { recursive: true })
  await fs.writeFile(DASHBOARD_CACHE_FILE, JSON.stringify(data, null, 2))
  return data
}

export async function readDashboardCache(): Promise<DashboardCachePayload | null> {
  try {
    const content = await fs.readFile(DASHBOARD_CACHE_FILE, 'utf-8')
    const parsed = JSON.parse(content)
    if (!parsed || !Array.isArray(parsed.data)) return null
    return parsed as DashboardCachePayload
  } catch {
    return null
  }
}
