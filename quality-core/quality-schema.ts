// quality-core/quality-schema.ts

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface TestSuite {
  name: string;
  tests: number;
  passed: number;
  failed: number;
  duration: number;
  status: 'passed' | 'failed' | 'flaky';
}

export interface TestMetrics {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number; // ms
  suites: TestSuite[];
  flakyRate?: number; // Added for health score calculation
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
  regressions: string[]; // Added back for compatibility
}

export interface StabilityMetrics {
  uptime: number; // percentage
  latency: number; // ms
  lastCheck: string;
  status: 'online' | 'degraded' | 'offline';
}

export interface HealthScoreResult {
  score: number;
  confidence: ConfidenceLevel;
  breakdown: {
    performance: number;
    tests: number;
    coverage: number;
    stability: number;
  };
  explanations: string[];
}

export interface QualitySnapshot {
  version: string;
  commitHash: string;
  timestamp: string;
  branch: string;
  healthScore: number;
  confidenceLevel: ConfidenceLevel;
  reportFile?: string;
  source?: 'json' | 'markdown';
  dataQuality?: {
    lighthouseValid: boolean;
    coverageComplete: boolean;
  };
  metrics: {
    tests: TestMetrics;
    coverage: CoverageMetrics;
    performance: PerformanceMetrics;
    stability: StabilityMetrics;
  };
}
