// Quality Core Mock Data - Simulating real snapshot data

export interface QualitySnapshot {
  commitHash: string;
  timestamp: string;
  branch: string;
  healthScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  reportFile?: string;
  metrics: {
    tests: TestMetrics;
    coverage: CoverageMetrics;
    performance: PerformanceMetrics;
    stability: StabilityMetrics;
  };
}

export interface TestMetrics {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number; // ms
  suites: TestSuite[];
}

export interface TestSuite {
  name: string;
  tests: number;
  passed: number;
  failed: number;
  duration: number;
  status: 'passed' | 'failed' | 'flaky';
}

export interface CoverageMetrics {
  lines: number;
  statements: number;
  branches: number;
  functions: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PerformanceMetrics {
  lighthouse: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  lighthouseHome?: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  lighthouseFeed?: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  webVitals: {
    lcp: number; // ms
    cls: number;
    tbt: number; // ms
  };
  bundleSize: number; // KB
}

export interface StabilityMetrics {
  uptime: number; // percentage
  latency: number; // ms
  lastCheck: string;
  status: 'online' | 'degraded' | 'offline';
}

// Current snapshot
export const currentSnapshot: QualitySnapshot = {
  commitHash: 'a3f8d2e',
  timestamp: new Date().toISOString(),
  branch: 'main',
  healthScore: 87,
  confidenceLevel: 'high',
  metrics: {
    tests: {
      total: 142,
      passed: 138,
      failed: 2,
      skipped: 2,
      duration: 4250,
      suites: [
        { name: 'Core', tests: 45, passed: 44, failed: 1, duration: 1200, status: 'failed' },
        { name: 'UI Components', tests: 38, passed: 38, failed: 0, duration: 890, status: 'passed' },
        { name: 'Hooks', tests: 24, passed: 24, failed: 0, duration: 650, status: 'passed' },
        { name: 'Utils', tests: 18, passed: 17, failed: 1, duration: 420, status: 'failed' },
        { name: 'Integration', tests: 17, passed: 15, failed: 0, duration: 1090, status: 'passed' },
      ],
    },
    coverage: {
      lines: 78.5,
      statements: 76.2,
      branches: 68.4,
      functions: 82.1,
      trend: 'up',
    },
    performance: {
      lighthouse: {
        performance: 94,
        accessibility: 100,
        bestPractices: 92,
        seo: 100,
      },
      lighthouseHome: {
        performance: 92,
        accessibility: 100,
        bestPractices: 91,
        seo: 100,
      },
      lighthouseFeed: {
        performance: 94,
        accessibility: 100,
        bestPractices: 92,
        seo: 100,
      },
      webVitals: {
        lcp: 1240,
        cls: 0.05,
        tbt: 180,
      },
      bundleSize: 245,
    },
    stability: {
      uptime: 99.9,
      latency: 145,
      lastCheck: new Date().toISOString(),
      status: 'online',
    },
  },
};

// Historical data for trends
export const historicalSnapshots: Array<{
  date: string;
  healthScore: number;
  coverage: number;
  performance: number;
  tests: { passed: number; failed: number };
}> = [
  { date: '2025-01-20', healthScore: 82, coverage: 72.1, performance: 88, tests: { passed: 130, failed: 5 } },
  { date: '2025-01-21', healthScore: 84, coverage: 74.5, performance: 90, tests: { passed: 134, failed: 4 } },
  { date: '2025-01-22', healthScore: 81, coverage: 73.8, performance: 86, tests: { passed: 132, failed: 6 } },
  { date: '2025-01-23', healthScore: 85, coverage: 76.2, performance: 91, tests: { passed: 136, failed: 3 } },
  { date: '2025-01-24', healthScore: 86, coverage: 77.4, performance: 93, tests: { passed: 137, failed: 3 } },
  { date: '2025-01-25', healthScore: 85, coverage: 77.8, performance: 92, tests: { passed: 136, failed: 4 } },
  { date: '2025-01-26', healthScore: 87, coverage: 78.5, performance: 94, tests: { passed: 138, failed: 2 } },
];

// Recent commits for timeline
export const recentCommits = [
  { hash: 'a3f8d2e', message: 'feat: Add new dashboard components', author: 'dev', date: '2025-01-26 10:30', healthScore: 87, delta: 2 },
  { hash: 'b7c4e1f', message: 'fix: Resolve test flakiness in hooks', author: 'dev', date: '2025-01-25 16:45', healthScore: 85, delta: -1 },
  { hash: 'c9a2d3b', message: 'refactor: Improve coverage utils', author: 'dev', date: '2025-01-24 14:20', healthScore: 86, delta: 1 },
  { hash: 'd1e5f4c', message: 'feat: Implement health score engine', author: 'dev', date: '2025-01-23 11:15', healthScore: 85, delta: 4 },
  { hash: 'e3g6h7i', message: 'chore: Update dependencies', author: 'dev', date: '2025-01-22 09:00', healthScore: 81, delta: -3 },
];

// Failed tests details
export const failedTests = [
  {
    name: 'should calculate health score correctly',
    suite: 'Core',
    file: 'health-score.test.ts',
    error: "Expected: 85, Received: 84",
    duration: 45,
  },
  {
    name: 'should format date with locale',
    suite: 'Utils',
    file: 'date-utils.test.ts',
    error: "TypeError: Cannot read property 'format' of undefined",
    duration: 12,
  },
];

// Health score breakdown weights
export const healthScoreWeights = {
  tests: 40,
  performance: 30,
  coverage: 20,
  stability: 10,
};

// Calculate individual category scores
export function getCategoryScores(snapshot: QualitySnapshot) {
  const { metrics } = snapshot;
  
  // Test score: based on pass rate
  const testScore = Math.round((metrics.tests.passed / metrics.tests.total) * 100);
  
  // Performance score: lighthouse performance
  const performanceScore = metrics.performance.lighthouse.performance;
  
  // Coverage score: average of all coverage metrics
  const coverageScore = Math.round(
    (metrics.coverage.lines + metrics.coverage.statements + metrics.coverage.branches + metrics.coverage.functions) / 4
  );
  
  // Stability score: based on uptime
  const stabilityScore = Math.round(metrics.stability.uptime);
  
  return {
    tests: { score: testScore, weight: healthScoreWeights.tests },
    performance: { score: performanceScore, weight: healthScoreWeights.performance },
    coverage: { score: coverageScore, weight: healthScoreWeights.coverage },
    stability: { score: stabilityScore, weight: healthScoreWeights.stability },
  };
}

// Get score color based on value
export function getScoreColor(score: number): string {
  if (score >= 90) return 'score-excellent';
  if (score >= 75) return 'score-good';
  if (score >= 50) return 'score-medium';
  if (score >= 25) return 'score-poor';
  return 'score-critical';
}

// Get status from score
export function getScoreStatus(score: number): string {
  if (score >= 90) return 'Excelente';
  if (score >= 75) return 'Bom';
  if (score >= 50) return 'Médio';
  if (score >= 25) return 'Baixo';
  return 'Crítico';
}
