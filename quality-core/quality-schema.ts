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

export type UiGateBoard = 'marketing-page' | 'ui-release';
export type UiGateArtifactKind = 'promo-page' | 'feed-layout';
export type UiGateVerdict = 'APPROVED' | 'APPROVED_WITH_REMARKS' | 'BLOCKED';
export type UiGateDimension =
  | 'purpose'
  | 'typography'
  | 'consistency'
  | 'hierarchy'
  | 'layoutDiscipline'
  | 'wcag';
export type UiGateCriticalFlag =
  | 'duplicate-cta'
  | 'decorative-numbering'
  | 'competing-secondary-column'
  | 'subtitle-axis-break'
  | 'hero-image-cropping'
  | 'brand-spelling'
  | 'purposeless-illustration';

export interface UiGateReview {
  artifactId: string;
  artifactKind: UiGateArtifactKind;
  artifactLabel: string;
  board: UiGateBoard;
  notes?: string[];
  evidence?: string[];
  scores: Record<UiGateDimension, number>;
  criticalFlags: UiGateCriticalFlag[];
}

export interface UiGateReviewResult extends UiGateReview {
  weightedScore: number;
  verdict: UiGateVerdict;
  blockReasons: string[];
}

export interface UiGateReport {
  generatedAt: string;
  version: 1;
  weights: Record<UiGateDimension, number>;
  threshold: {
    minimumAverage: number;
    minimumCoreScore: number;
    minimumWcagScore: number;
  };
  results: UiGateReviewResult[];
  summary: {
    total: number;
    approved: number;
    approvedWithRemarks: number;
    blocked: number;
  };
}
