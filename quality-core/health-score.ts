// quality-core/health-score.ts
import {
  PerformanceMetrics,
  TestMetrics,
  CoverageMetrics,
  StabilityMetrics,
  HealthScoreResult,
  ConfidenceLevel,
  QualitySnapshot
} from './quality-schema'
import { calculateDelta } from './regression'

const clamp = (value: number) => Math.max(0, Math.min(100, value))

/**
 * Calcula o Health Score do sistema com base em métricas normalizadas.
 * Incorpora detecção de regressão caso um snapshot anterior seja fornecido.
 * 
 * Pesos:
 * - Performance: 40%
 * - Tests: 30%
 * - Coverage: 20%
 * - Stability: 10%
 */
export function calculateHealthScore(
  performance: PerformanceMetrics,
  tests: TestMetrics,
  coverage: CoverageMetrics,
  stability: StabilityMetrics,
  previousSnapshot?: QualitySnapshot
): HealthScoreResult {
  const explanations: string[] = []
  let regressionPenalty = 0
  
  // 1. Performance Score (40%)
  const performanceScore = clamp(
    performance.lighthouse.performance - (performance.regressions.length * 5)
  )
  if (performance.regressions.length > 0) {
    explanations.push(`Performance regression detected (${performance.regressions.length} issues)`)
  }

  // 2. Tests Score (30%)
  const testPassRate = tests.total === 0 ? 100 : (tests.passed / tests.total) * 100
  const flakyRate = tests.flakyRate || 0
  const testsScore = clamp(testPassRate - (flakyRate * 100 * 2))
  
  if (tests.failed > 0) {
    explanations.push(`${tests.failed} test(s) failed`)
  }
  if (flakyRate > 0) {
    explanations.push(`Flaky tests rate at ${(flakyRate * 100).toFixed(1)}%`)
  }

  // 3. Coverage Score (20%)
  const coverageScore = clamp(
    (coverage.lines * 0.5) + (coverage.branches * 0.3) + (coverage.functions * 0.2)
  )
  if (coverageScore < 80) {
    explanations.push(`Low code coverage: ${Math.round(coverageScore)}% (target > 80%)`)
  }

  // 4. Stability Score (10%)
  const stabilityScore = clamp(stability.uptime)
  if (stabilityScore < 99) {
    explanations.push(`System stability below target: ${stabilityScore}%`)
  }

  // DETECÇÃO DE REGRESSÃO (Cross-Snapshot)
  if (previousSnapshot) {
    // Simulamos um snapshot atual parcial para o cálculo de delta
    // Using Partial<QualitySnapshot> would be cleaner, but calculateDelta likely expects strict shape.
    // We construct a strictly typed object that satisfies the structure required for regression logic.
    const currentSnapshotPartial: Pick<QualitySnapshot, 'metrics' | 'healthScore'> = {
      healthScore: 0, 
      metrics: {
        tests,
        coverage,
        performance,
        stability
      }
    };
    
    // We assume calculateDelta handles the comparison gracefully or we cast if necessary, 
    // but here we removed the explicit `any`. If `calculateDelta` is typed loosely, this works.
    // If it's strict, we might need `as QualitySnapshot` but that's better than `any`.
    const delta = calculateDelta(currentSnapshotPartial as QualitySnapshot, previousSnapshot);

    if (delta.coverage.lines < -1) {
      regressionPenalty += 5;
      explanations.push(`Coverage dropped by ${Math.abs(delta.coverage.lines).toFixed(1)}% since last commit`);
    }

    if (delta.tests.failed > 0) {
      regressionPenalty += 10;
      explanations.push(`${delta.tests.failed} new test failure(s) introduced`);
    }
  }

  // Cálculo Final Ponderado
  const finalScore = clamp(
    ((performanceScore * 0.4) +
    (testsScore * 0.3) +
    (coverageScore * 0.2) +
    (stabilityScore * 0.1)) - regressionPenalty
  )

  // Determinação do Nível de Confiança
  let confidence: ConfidenceLevel = 'high'
  const dataPoints = [
    performance.lighthouse.performance > 0,
    tests.total > 0,
    coverage.lines > 0,
    stability.uptime > 0
  ].filter(Boolean).length

  if (dataPoints <= 2) confidence = 'low'
  else if (dataPoints === 3) confidence = 'medium'

  return {
    score: Math.round(finalScore),
    confidence,
    breakdown: {
      performance: Math.round(performanceScore),
      tests: Math.round(testsScore),
      coverage: Math.round(coverageScore),
      stability: Math.round(stabilityScore)
    },
    explanations
  }
}