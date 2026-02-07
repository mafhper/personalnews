/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  QualitySnapshot as MockSnapshot,
  currentSnapshot as defaultMockSnapshot
} from '../lib/mock-data';
import { toast } from 'sonner';

// Real schema types matching the backend QualitySnapshot
interface RealSnapshot {
  version: string;
  commitHash: string;
  timestamp: string;
  branch: string;
  healthScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  reportFile?: string;
  dataQuality?: {
    lighthouseValid: boolean;
    coverageComplete: boolean;
  };
  metrics: {
    tests: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
      duration: number; // ms
      suites: {
        name: string;
        tests: number;
        passed: number;
        failed: number;
        duration: number;
        status: 'passed' | 'failed' | 'flaky';
      }[];
    };
    coverage: {
      lines: number;
      statements: number;
      branches: number;
      functions: number;
      trend: 'up' | 'down' | 'stable';
    };
    performance: {
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
        lcp: number;
        cls: number;
        tbt: number;
      };
      bundleSize: number;
    };
    stability: {
      uptime: number;
      latency: number;
      lastCheck: string;
      status: 'online' | 'degraded' | 'offline';
    };
  };
}

interface HistoricalDataItem {
  date: string;
  healthScore: number;
  coverage: number;
  performance: number;
  performanceHome?: number;
  performanceFeed?: number;
  accessibility?: number;
  accessibilityHome?: number;
  accessibilityFeed?: number;
  bestPractices?: number;
  bestPracticesHome?: number;
  bestPracticesFeed?: number;
  seo?: number;
  seoHome?: number;
  seoFeed?: number;
  tests: { passed: number; failed: number; skipped?: number; duration?: number };
  lcp: number;
  cls: number;
  tbt: number;
  bundleSize: number;
  uptime?: number;
  latency?: number;
}

interface DashboardSummary {
  count: number;
  latestTimestamp: string | null;
  averages: {
    coverage: number;
    performance: number;
    bundleSize: number;
    testsPassRate: number;
    lcp: number;
    cls: number;
    tbt: number;
  };
  security?: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    passed: boolean;
    timestamp?: string;
    findings?: Array<{
      id: string;
      file: string;
      line: number;
      type: string;
      severity: 'critical' | 'high' | 'medium';
      preview?: string;
    }>;
    findingsTruncated?: boolean;
    findingsTotal?: number;
  } | null;
  securityHistory?: Array<{
    timestamp: string;
    total: number;
    critical: number;
    high: number;
    medium: number;
  }>;
  coverageSummary?: {
    lines: { total: number; covered: number; pct: number };
    statements: { total: number; covered: number; pct: number };
    branches: { total: number; covered: number; pct: number };
    functions: { total: number; covered: number; pct: number };
  };
  coverageDetails?: Array<{
    file: string;
    lines: { total: number; covered: number; pct: number; uncovered: number[] };
    statements: { total: number; covered: number; pct: number };
    branches: { total: number; covered: number; pct: number };
    functions: { total: number; covered: number; pct: number };
  }>;
  scripts?: Array<{
    id: string;
    runs: number;
    avgSeconds: number;
    lastSeconds: number;
  }>;
  scriptHistory?: Record<string, number[]>;
}

interface CommitItem {
  hash: string;
  message: string;
  author: string;
  date: string;
  healthScore: number;
  delta: number;
  reportFile?: string;
}

const round1 = (value: number) => (Number.isFinite(value) ? Number.parseFloat(value.toFixed(1)) : 0);

const computeCoverageScore = (coverage?: RealSnapshot['metrics']['coverage']) => {
  if (!coverage) return 0;
  const values = [coverage.lines, coverage.statements, coverage.branches, coverage.functions]
    .filter(v => typeof v === 'number' && !Number.isNaN(v));
  if (values.length === 0) return 0;
  const coreCoverageOnly =
    coverage.branches <= 0 &&
    coverage.functions <= 0 &&
    (coverage.lines > 0 || coverage.statements > 0);
  if (coreCoverageOnly) {
    const coreValues = [coverage.lines, coverage.statements].filter(
      v => typeof v === 'number' && !Number.isNaN(v)
    );
    return coreValues.length > 0
      ? coreValues.reduce((sum, v) => sum + v, 0) / coreValues.length
      : 0;
  }
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

interface QualityDataContextType {
  currentSnapshot: MockSnapshot | null;
  historicalData: HistoricalDataItem[];
  recentCommits: CommitItem[];
  failedTests: unknown[];
  isLoading: boolean;
  error: string | null;
  realLatency: number;
  refreshData: () => Promise<void>;
  runAction: (action: 'run-tests' | 'generate-report', label: string) => Promise<void>;
  isActionRunning: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  consoleState: {
    isOpen: boolean;
    title: string;
    output: string;
    isFinished: boolean;
    isSuccess: boolean;
  };
  setConsoleOpen: (open: boolean) => void;
  reportModalState: {
    isOpen: boolean;
    reportFile: string | undefined;
  };
  openReport: (file: string) => void;
  setReportModalOpen: (open: boolean) => void;
  dashboardSummary: DashboardSummary | null;
  cacheUpdatedAt: string | null;
  notificationHistory: {
    id: string;
    title: string;
    timestamp: Date;
    status: 'running' | 'success' | 'error';
  }[];
  clearNotifications: () => void;
}

const QualityDataContext = createContext<QualityDataContextType | undefined>(undefined);

export const useQualityData = () => {
  const context = useContext(QualityDataContext);
  if (!context) {
    throw new Error('useQualityData must be used within a QualityDataProvider');
  }
  return context;
};

export const QualityDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSnapshot, setCurrentSnapshot] = useState<MockSnapshot | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataItem[]>([]);
  const [recentCommits, setRecentCommits] = useState<CommitItem[]>([]);
  const [failedTests, setFailedTests] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realLatency, setRealLatency] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [cacheUpdatedAt, setCacheUpdatedAt] = useState<string | null>(null);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(60000);

  const [isActionRunning, setIsActionRunning] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<QualityDataContextType['notificationHistory']>([]);
  const [consoleState, setConsoleState] = useState<QualityDataContextType['consoleState']>({
    isOpen: false,
    title: '',
    output: '',
    isFinished: false,
    isSuccess: false,
  });

  const [reportModalState, setReportModalState] = useState<QualityDataContextType['reportModalState']>({
    isOpen: false,
    reportFile: undefined,
  });

  const setConsoleOpen = (open: boolean) => setConsoleState(prev => ({ ...prev, isOpen: open }));

  const openReport = (file: string) => {
    console.log(`[report-debug] Opening global report: ${file}`);
    setReportModalState({
      isOpen: true,
      reportFile: file,
    });
  };

  const setReportModalOpen = (open: boolean) => {
    setReportModalState(prev => ({ ...prev, isOpen: open }));
  };

  const clearNotifications = () => setNotificationHistory([]);

  const runAction = async (action: 'run-tests' | 'generate-report', label: string) => {
    if (isActionRunning) return;

    console.log(`[action-debug] Starting action: ${action} (${label})`);
    const id = Math.random().toString(36).substring(7);
    const newNotification = { id, title: label, timestamp: new Date(), status: 'running' as const };
    setNotificationHistory(prev => [newNotification, ...prev].slice(0, 10));

    setIsActionRunning(true);
    setConsoleState({
      isOpen: true,
      title: label,
      output: `> bun run ${action === 'run-tests' ? 'test:all' : 'audit:full'}\n`,
      isFinished: false,
      isSuccess: false,
    });

    try {
      console.log(`[action-debug] Fetching /api/action for ${action}`);
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log(`[action-debug] Action ${action} response received:`, data.success ? 'Success' : 'Failed');

      setConsoleState(prev => ({
        ...prev,
        output: prev.output + (data.output || data.error || 'Sem output retornado.'),
        isFinished: true,
        isSuccess: data.success,
      }));

      setNotificationHistory(prev => prev.map(n =>
        n.id === id ? { ...n, status: data.success ? 'success' : 'error' } : n
      ));

      if (data.success) {
        toast.success(`${label} concluído com sucesso!`);
        await fetchData();
      } else {
        toast.error(`${label} falhou. Verifique os logs no console.`);
      }
    } catch (err) {
      console.error(`[action-debug] Action ${action} fatal error:`, err);
      setConsoleState(prev => ({
        ...prev,
        output: prev.output + `\nErro fatal de conexão: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        isFinished: true,
        isSuccess: false,
      }));
      setNotificationHistory(prev => prev.map(n =>
        n.id === id ? { ...n, status: 'error' } : n
      ));
      toast.error(`Erro de comunicação: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setIsActionRunning(false);
    }
  };

  const mapRealToMock = (real: RealSnapshot): MockSnapshot => {
    console.log('[mapping-debug] Transformando snapshot:', real.commitHash || 'sem hash');
    try {
      const perf = real.metrics.performance;
      const lighthouseHome = perf?.lighthouseHome;
      const lighthouseFeed = perf?.lighthouseFeed;
      const primaryLighthouse = lighthouseFeed || lighthouseHome || perf?.lighthouse;
      const safeLighthouse = primaryLighthouse || {
        performance: 0,
        accessibility: 0,
        bestPractices: 0,
        seo: 0,
      };
      // Ensure tests metrics are properly mapped
      const metrics = {
        ...real.metrics,
        tests: {
          ...real.metrics.tests,
          total: real.metrics.tests.total || 0,
          passed: real.metrics.tests.passed || 0,
          failed: real.metrics.tests.failed || 0,
          skipped: real.metrics.tests.skipped || 0,
          duration: real.metrics.tests.duration || 0,
          suites: (real.metrics.tests.suites && real.metrics.tests.suites.length > 0)
            ? real.metrics.tests.suites
            : [
                { name: 'All Tests', tests: real.metrics.tests.total, passed: real.metrics.tests.passed, failed: real.metrics.tests.failed, duration: real.metrics.tests.duration, status: real.metrics.tests.failed === 0 ? 'passed' : 'failed' }
              ]
        },
        performance: {
          ...real.metrics.performance,
          lighthouse: safeLighthouse,
          lighthouseHome: lighthouseHome || undefined,
          lighthouseFeed: lighthouseFeed || undefined,
          bundleSize: round1(real.metrics.performance?.bundleSize || 0),
        },
      };

      return {
        commitHash: real.commitHash,
        timestamp: real.timestamp,
        branch: real.branch,
        healthScore: real.healthScore,
        confidenceLevel: real.confidenceLevel,
        reportFile: real.reportFile,
        metrics
      };
    } catch (err) {
      console.error('[mapping-debug] Erro ao mapear snapshot:', err);
      throw err;
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log('[api-debug] Iniciando carregamento de dados...');
    try {
      // Fetch Real-time Latency
      fetch('/api/latency')
        .then(res => res.json())
        .then(d => {
          if (d.success) {
            console.log('[latency-debug] Latência recebida:', d.latency, 'ms');
            setRealLatency(d.latency);
          }
        })
        .catch(err => console.error('[latency-debug] Erro ao medir latência:', err));

      const response = await fetch('/api/snapshots');
      if (!response.ok) throw new Error('Failed to fetch snapshots');

      const json = await response.json();
      console.log('[api-debug] Snapshots recebidos:', json.data?.length || 0, 'itens');

      if (!json.success) throw new Error(json.error || 'Unknown error');

      const snapshots: RealSnapshot[] = json.data;

      if (json.summary) {
        setDashboardSummary(json.summary as DashboardSummary);
      } else {
        setDashboardSummary(null);
      }
      setCacheUpdatedAt(json.generatedAt || null);

      if (snapshots && snapshots.length > 0) {
        const latest = snapshots[0];
        console.log('[api-debug] Processando snapshot mais recente:', latest.commitHash);
        setCurrentSnapshot(mapRealToMock(latest));

        // Map history
        const history: HistoricalDataItem[] = snapshots.map(s => {
          const coverageScore = computeCoverageScore(s.metrics?.coverage);
          const snapshotPerf = s.metrics?.performance;
          const lighthouseHome = snapshotPerf?.lighthouseHome;
          const lighthouseFeed = snapshotPerf?.lighthouseFeed;
          const lighthouseBase = snapshotPerf?.lighthouse;
          const perfHome = lighthouseHome?.performance || 0;
          const perfFeed = lighthouseFeed?.performance || 0;
          const perfPrimary =
            lighthouseFeed?.performance ||
            lighthouseHome?.performance ||
            lighthouseBase?.performance ||
            0;
          const accessibilityHome = lighthouseHome?.accessibility || 0;
          const accessibilityFeed = lighthouseFeed?.accessibility || 0;
          const accessibilityPrimary =
            lighthouseFeed?.accessibility ||
            lighthouseHome?.accessibility ||
            lighthouseBase?.accessibility ||
            0;
          const bestPracticesHome = lighthouseHome?.bestPractices || 0;
          const bestPracticesFeed = lighthouseFeed?.bestPractices || 0;
          const bestPracticesPrimary =
            lighthouseFeed?.bestPractices ||
            lighthouseHome?.bestPractices ||
            lighthouseBase?.bestPractices ||
            0;
          const seoHome = lighthouseHome?.seo || 0;
          const seoFeed = lighthouseFeed?.seo || 0;
          const seoPrimary =
            lighthouseFeed?.seo ||
            lighthouseHome?.seo ||
            lighthouseBase?.seo ||
            0;
          return {
            date: s.timestamp,
            healthScore: s.healthScore,
            coverage: round1(coverageScore),
            performance: perfPrimary,
            performanceHome: perfHome || undefined,
            performanceFeed: perfFeed || undefined,
            accessibility: accessibilityPrimary,
            accessibilityHome: accessibilityHome || undefined,
            accessibilityFeed: accessibilityFeed || undefined,
            bestPractices: bestPracticesPrimary,
            bestPracticesHome: bestPracticesHome || undefined,
            bestPracticesFeed: bestPracticesFeed || undefined,
            seo: seoPrimary,
            seoHome: seoHome || undefined,
            seoFeed: seoFeed || undefined,
            tests: {
              passed: s.metrics?.tests?.passed || 0,
              failed: s.metrics?.tests?.failed || 0,
              skipped: s.metrics?.tests?.skipped || 0,
              duration: s.metrics?.tests?.duration || 0,
            },
            lcp: s.metrics?.performance?.webVitals?.lcp || 0,
            cls: s.metrics?.performance?.webVitals?.cls || 0,
            tbt: s.metrics?.performance?.webVitals?.tbt || 0,
            bundleSize: round1(s.metrics?.performance?.bundleSize || 0),
            uptime: s.metrics?.stability?.uptime || 0,
            latency: s.metrics?.stability?.latency || 0,
          };
        }).reverse();
        setHistoricalData(history);

        // Map recent commits
        const commits: CommitItem[] = snapshots.slice(0, 10).map((s, i, arr) => {
          const prevScore = arr[i + 1]?.healthScore || s.healthScore;
          return {
            hash: s.commitHash,
            message: 'Quality Snapshot',
            author: 'system',
            date: new Date(s.timestamp).toLocaleString(),
            healthScore: s.healthScore,
            delta: s.healthScore - prevScore,
            reportFile: s.reportFile
          };
        });
        setRecentCommits(commits);
        console.log('[api-debug] Histórico e commits mapeados com sucesso');

        setFailedTests([]);
      } else {
        console.warn('[api-debug] Nenhum snapshot retornado pela API. Usando dados mock como fallback.');
        console.log('[api-debug] Default mock snapshot:', {
          commit: defaultMockSnapshot.commitHash,
          testTotal: defaultMockSnapshot.metrics.tests.total,
          testPassed: defaultMockSnapshot.metrics.tests.passed,
          testFailed: defaultMockSnapshot.metrics.tests.failed,
          healthScore: defaultMockSnapshot.healthScore
        });
        // Use mock data as fallback
        setCurrentSnapshot(defaultMockSnapshot);
        setDashboardSummary(null);
        setCacheUpdatedAt(null);

        // Create mock historical data
        const mockHistory: HistoricalDataItem[] = [
          {
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            healthScore: 82,
            coverage: 76,
            performance: 89,
            accessibility: 91,
            bestPractices: 88,
            seo: 90,
            tests: { passed: 135, failed: 4, skipped: 1, duration: 84279 },
            lcp: 2100,
            cls: 0.08,
            tbt: 145,
            bundleSize: 285,
            uptime: 99.2,
            latency: 520
          },
          {
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            healthScore: 84,
            coverage: 77.2,
            performance: 91,
            accessibility: 92,
            bestPractices: 89,
            seo: 91,
            tests: { passed: 136, failed: 3, skipped: 0, duration: 96576 },
            lcp: 2000,
            cls: 0.075,
            tbt: 140,
            bundleSize: 290,
            uptime: 99.4,
            latency: 480
          },
          {
            date: new Date().toISOString(),
            healthScore: 87,
            coverage: 78.5,
            performance: 94,
            accessibility: 94,
            bestPractices: 92,
            seo: 93,
            tests: { passed: 138, failed: 2, skipped: 0, duration: 98633 },
            lcp: 1800,
            cls: 0.065,
            tbt: 125,
            bundleSize: 295,
            uptime: 99.7,
            latency: 430
          }
        ];
        setHistoricalData(mockHistory);

        // Create mock commit history
        const mockCommits: CommitItem[] = [
          {
            hash: 'a3f8d2e',
            message: 'Latest quality snapshot',
            author: 'system',
            date: new Date().toLocaleString(),
            healthScore: 87,
            delta: 3,
            reportFile: undefined
          },
          {
            hash: 'b2e7c1f',
            message: 'Previous quality snapshot',
            author: 'system',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString(),
            healthScore: 84,
            delta: 2,
            reportFile: undefined
          },
          {
            hash: 'c1d6b0g',
            message: 'Earlier quality snapshot',
            author: 'system',
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleString(),
            healthScore: 82,
            delta: 0,
            reportFile: undefined
          }
        ];
        setRecentCommits(mockCommits);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[api-debug] Erro fatal no carregamento:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config');
        if (!res.ok) return;
        const data = await res.json();
        const seconds = Number(data?.data?.refreshInterval || data?.refreshInterval);
        if (Number.isFinite(seconds) && seconds > 5) {
          setRefreshIntervalMs(seconds * 1000);
        }
      } catch {
        // ignore config errors
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchData();
    }, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [fetchData, refreshIntervalMs]);

  return (
    <QualityDataContext.Provider value={{
      currentSnapshot,
      historicalData,
      recentCommits,
      failedTests,
      isLoading,
      error,
      realLatency,
      refreshData: fetchData,
      runAction,
      isActionRunning,
      searchQuery,
      setSearchQuery,
      consoleState,
      setConsoleOpen,
      reportModalState,
      openReport,
      setReportModalOpen,
      dashboardSummary,
      cacheUpdatedAt,
      notificationHistory,
      clearNotifications
    }}>
      {children}
    </QualityDataContext.Provider>
  );
};
