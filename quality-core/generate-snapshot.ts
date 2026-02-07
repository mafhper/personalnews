// quality-core/generate-snapshot.ts
import { execSync } from 'child_process'
import { VitestCollector } from './vitest.collector'
import { calculateHealthScore } from './health-score'
import { SnapshotStore } from './snapshots.store'
import { QualitySnapshot } from './quality-schema'

type LighthouseScore = {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
}

type LighthouseRun = LighthouseScore & {
  lcp: number
  cls: number
  tbt: number
}

function toLighthouseRun(
  source: LighthouseScore | null | undefined,
  vitals?: { lcp?: number; cls?: number; tbt?: number } | null
): LighthouseRun | null {
  if (!source) return null
  return {
    performance: source.performance || 0,
    accessibility: source.accessibility || 0,
    bestPractices: source.bestPractices || 0,
    seo: source.seo || 0,
    lcp: vitals?.lcp || 0,
    cls: vitals?.cls || 0,
    tbt: vitals?.tbt || 0,
  }
}

/**
 * Script principal para gerar um snapshot de qualidade para o commit atual.
 */
async function generateSnapshot() {
  console.log('🚀 Generating Quality Snapshot...')

  try {
    // 1. Obter informações do Git
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
    const timestamp = new Date().toISOString()
    
    // 2. Coletar métricas (MVP: Vitest)
    console.log('🧪 Collecting Test Metrics...')
    const { tests, coverage } = await VitestCollector.collect()

    // 3. Métricas de Performance (Lighthouse mais recente válido)
    const nowTs = Date.now()
    let lighthouseFeed = await SnapshotStore.findMatchingLighthouse(nowTs, 'feed', 'desktop')
    let lighthouseHome = await SnapshotStore.findMatchingLighthouse(nowTs, 'home', 'desktop')
    let lighthousePrimary = lighthouseFeed || lighthouseHome || await SnapshotStore.findMatchingLighthouse(nowTs, 'any', 'desktop')

    if (!lighthousePrimary) {
      const fallback = (await SnapshotStore.list()).find(
        (entry) =>
          (entry.metrics.performance.lighthouseFeed?.performance || 0) > 0 ||
          (entry.metrics.performance.lighthouseHome?.performance || 0) > 0 ||
          (entry.metrics.performance.lighthouse.performance || 0) > 0
      )
      if (fallback) {
        const fallbackVitals = fallback.metrics.performance.webVitals
        lighthouseFeed =
          toLighthouseRun(fallback.metrics.performance.lighthouseFeed, fallbackVitals) || lighthouseFeed
        lighthouseHome =
          toLighthouseRun(fallback.metrics.performance.lighthouseHome, fallbackVitals) || lighthouseHome
        lighthousePrimary =
          lighthouseFeed ||
          lighthouseHome ||
          toLighthouseRun(fallback.metrics.performance.lighthouse, fallbackVitals)
      }
    }

    const performance = {
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
            seo: lighthouseHome.seo,
          }
        : undefined,
      lighthouseFeed: lighthouseFeed
        ? {
            performance: lighthouseFeed.performance,
            accessibility: lighthouseFeed.accessibility,
            bestPractices: lighthouseFeed.bestPractices,
            seo: lighthouseFeed.seo,
          }
        : undefined,
      webVitals: {
        lcp: lighthousePrimary?.lcp || 0,
        cls: lighthousePrimary?.cls || 0,
        tbt: lighthousePrimary?.tbt || 0
      },
      bundleSize: 0,
      regressions: [] // Fixed: included property
    }

    // 4. Métricas de Estabilidade
    const stability = {
      uptime: 100,
      latency: 0,
      lastCheck: timestamp,
      status: 'online' as const
    }

    // 5. Calcular Health Score
    console.log('📊 Calculating Health Score...')
    const healthResult = calculateHealthScore(
      performance,
      tests,
      coverage,
      stability
    )

    // 6. Criar Snapshot (New Schema)
    const snapshot: QualitySnapshot = {
      version: '1.1',
      commitHash: commit,
      branch,
      timestamp,
      healthScore: healthResult.score,
      confidenceLevel: healthResult.confidence,
      source: 'json',
      dataQuality: {
        lighthouseValid: Boolean(lighthousePrimary),
        coverageComplete: coverage.branches > 0 && coverage.functions > 0,
      },
      metrics: {
        tests,
        coverage,
        performance,
        stability
      }
    }

    // 7. Salvar Snapshot
    await SnapshotStore.save(snapshot)
    console.log(`✅ Snapshot saved for commit ${commit}`)
    console.log(`📈 Score: ${snapshot.healthScore} (${snapshot.confidenceLevel} confidence)`)
    
    if (healthResult.explanations.length > 0) {
      console.log('⚠️ Explanations:')
      healthResult.explanations.forEach(e => console.log(`   - ${e}`))
    }

  } catch (err) {
    console.error('❌ Failed to generate snapshot:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

generateSnapshot()
