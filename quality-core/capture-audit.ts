import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'
import { SnapshotStore } from './snapshots.store'
import { QualitySnapshot } from './quality-schema'

async function captureAudit() {
  console.log('Capturing latest audit report as a quality snapshot...')

  try {
    const reportsDir = path.join(process.cwd(), 'performance-reports', 'reports')
    const files = await fs.readdir(reportsDir)
    const reportFiles = files
      .filter(f => f.startsWith('audit_report_') && f.endsWith('.md'))
      .sort()
      .reverse()

    if (reportFiles.length === 0) {
      console.error('[error] No audit reports found in performance-reports/reports')
      process.exit(1)
    }

    const latestReport = reportFiles[0]
    console.log(`Using latest report: ${latestReport}`)

    const content = await fs.readFile(path.join(reportsDir, latestReport), 'utf-8')
    const parsed = SnapshotStore.parseMarkdownReport(content)

    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
    
    let timestampStr = latestReport.replace('audit_report_', '').replace('.md', '')
    timestampStr = timestampStr.replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, 'T$1:$2:$3.$4Z')
    const timestamp = new Date(timestampStr).toISOString()

    const lighthouseFeed = await SnapshotStore.findMatchingLighthouse(new Date(timestamp).getTime(), 'feed', 'desktop')
    const lighthouseHome = await SnapshotStore.findMatchingLighthouse(new Date(timestamp).getTime(), 'home', 'desktop')
    const lighthouseDefault = await SnapshotStore.findMatchingLighthouse(new Date(timestamp).getTime(), 'any', 'desktop')
    const lighthousePrimary = lighthouseFeed || lighthouseHome || lighthouseDefault
    const testSuites = await SnapshotStore.getRealTestSuites()

    const snapshot: QualitySnapshot = {
      version: '1.1',
      commitHash,
      branch,
      timestamp,
      healthScore: SnapshotStore.calculateHealthScore(parsed, lighthousePrimary),
      confidenceLevel: 'high',
      reportFile: latestReport,
      source: 'markdown',
      dataQuality: {
        lighthouseValid: Boolean(lighthousePrimary),
        coverageComplete: parsed.coverage > 0,
      },
      metrics: {
        tests: {
          total: parsed.totalSteps,
          passed: parsed.passedSteps,
          failed: parsed.failedSteps,
          skipped: 0,
          duration: parsed.totalDuration * 1000,
          suites: testSuites
        },
        coverage: {
          lines: parsed.coverage,
          statements: parsed.coverage,
          branches: 0,
          functions: 0,
          trend: 'stable'
        },
        performance: {
          lighthouse: {
            performance: lighthousePrimary?.performance || 0,
            accessibility: lighthousePrimary?.accessibility || 0,
            bestPractices: lighthousePrimary?.bestPractices || 0,
            seo: lighthousePrimary?.seo || 0
          },
          lighthouseHome: lighthouseHome
            ? {
                performance: lighthouseHome.performance,
                accessibility: lighthouseHome.accessibility,
                bestPractices: lighthouseHome.bestPractices,
                seo: lighthouseHome.seo
              }
            : undefined,
          lighthouseFeed: lighthouseFeed
            ? {
                performance: lighthouseFeed.performance,
                accessibility: lighthouseFeed.accessibility,
                bestPractices: lighthouseFeed.bestPractices,
                seo: lighthouseFeed.seo
              }
            : undefined,
          webVitals: {
            lcp: lighthousePrimary?.lcp || 0,
            cls: lighthousePrimary?.cls || 0,
            tbt: lighthousePrimary?.tbt || 0
          },
          bundleSize: parsed.bundleSize || 0,
          regressions: []
        },
        stability: {
          uptime: 100,
          latency: 0,
          lastCheck: timestamp,
          status: 'online'
        }
      }
    }

    const savedPath = await SnapshotStore.save(snapshot)
    console.log(`Snapshot captured and saved to: ${savedPath}`)
    console.log(`Score: ${snapshot.healthScore}%`)
    console.log(`Bundle Size: ${snapshot.metrics.performance.bundleSize} KB`)
    console.log(`Coverage: ${snapshot.metrics.coverage.lines}%`)

  } catch (err) {
    console.error('[error] Failed to capture audit:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

captureAudit()
