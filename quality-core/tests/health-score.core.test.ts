// quality-core/health-score.core.test.ts
import { describe, it, expect } from 'vitest'
import { calculateHealthScore } from '../health-score'

describe('Health Score Engine', () => {
  it('should return 100 for a perfect system', () => {
    const result = calculateHealthScore(
      { lighthouse: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100 }, webVitals: { lcp: 2000, cls: 0, tbt: 0 }, regressions: [], bundleSize: 200 },
      { total: 100, passed: 100, failed: 0, skipped: 0, duration: 5000, suites: [] },
      { lines: 100, statements: 100, branches: 100, functions: 100, trend: 'stable' },
      { uptime: 100, latency: 0, lastCheck: '', status: 'online' }
    )

    expect(result.score).toBe(100)
    expect(result.confidence).toBe('high')
    expect(result.explanations.length).toBe(0)
  })

  it('should penalize performance regressions', () => {
    const result = calculateHealthScore(
      { lighthouse: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100 }, webVitals: { lcp: 2000, cls: 0, tbt: 0 }, regressions: ['LCP increase'], bundleSize: 200 },
      { total: 100, passed: 100, failed: 0, skipped: 0, duration: 5000, suites: [] },
      { lines: 100, statements: 100, branches: 100, functions: 100, trend: 'stable' },
      { uptime: 100, latency: 0, lastCheck: '', status: 'online' }
    )

    // Performance is 40% of score. lighthouse performance was 100, regressions (1 * 5) = 95.
    // Score should be (95 * 0.4) + (100 * 0.3) + (100 * 0.2) + (100 * 0.1) = 38 + 30 + 20 + 10 = 98
    expect(result.score).toBe(98)
    expect(result.explanations).toContain('Performance regression detected (1 issues)')
  })

  it('should penalize test failures', () => {
    const result = calculateHealthScore(
      { lighthouse: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100 }, webVitals: { lcp: 2000, cls: 0, tbt: 0 }, regressions: [], bundleSize: 200 },
      { total: 100, passed: 90, failed: 10, skipped: 0, duration: 5000, suites: [] },
      { lines: 100, statements: 100, branches: 100, functions: 100, trend: 'stable' },
      { uptime: 100, latency: 0, lastCheck: '', status: 'online' }
    )

    // Tests score: 90 (pass rate).
    // Final score: (100 * 0.4) + (90 * 0.3) + (100 * 0.2) + (100 * 0.1) = 40 + 27 + 20 + 10 = 97
    expect(result.score).toBe(97)
    expect(result.explanations).toContain('10 test(s) failed')
  })

  it('should penalize low coverage', () => {
    const result = calculateHealthScore(
      { lighthouse: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100 }, webVitals: { lcp: 2000, cls: 0, tbt: 0 }, regressions: [], bundleSize: 200 },
      { total: 100, passed: 100, failed: 0, skipped: 0, duration: 5000, suites: [] },
      { lines: 50, statements: 50, branches: 50, functions: 50, trend: 'stable' },
      { uptime: 100, latency: 0, lastCheck: '', status: 'online' }
    )

    // Coverage score: 50. Final: 40 + 30 + (50 * 0.2) + 10 = 40 + 30 + 10 + 10 = 90
    expect(result.score).toBe(90)
    expect(result.explanations[0]).toMatch(/Low code coverage/)
  })

  it('should set confidence to low when data points are missing', () => {
    const result = calculateHealthScore(
      { lighthouse: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 }, webVitals: { lcp: 0, cls: 0, tbt: 0 }, regressions: [], bundleSize: 0 },
      { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0, suites: [] },
      { lines: 100, statements: 100, branches: 100, functions: 100, trend: 'stable' },
      { uptime: 100, latency: 0, lastCheck: '', status: 'online' }
    )

    expect(result.confidence).toBe('low')
  })
})
