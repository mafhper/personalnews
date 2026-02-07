// quality-core/regression.ts
import { QualitySnapshot } from './quality-schema'

export interface QualityDelta {
  score: number;
  tests: {
    passed: number;
    failed: number;
  };
  coverage: {
    lines: number;
    branches: number;
    functions: number;
  };
  performance: {
    score: number;
  };
}

/**
 * Calcula a diferença (delta) entre dois snapshots de qualidade.
 * Valores positivos indicam melhoria, negativos indicam regressão.
 */
export function calculateDelta(current: QualitySnapshot, previous: QualitySnapshot): QualityDelta {
  return {
    score: current.healthScore - previous.healthScore,
    tests: {
      passed: current.metrics.tests.passed - previous.metrics.tests.passed,
      failed: current.metrics.tests.failed - previous.metrics.tests.failed,
    },
    coverage: {
      lines: current.metrics.coverage.lines - previous.metrics.coverage.lines,
      branches: current.metrics.coverage.branches - previous.metrics.coverage.branches,
      functions: current.metrics.coverage.functions - previous.metrics.coverage.functions,
    },
    performance: {
      score: (current.metrics.performance.lighthouse.performance || 0) - (previous.metrics.performance.lighthouse.performance || 0),
    }
  }
}