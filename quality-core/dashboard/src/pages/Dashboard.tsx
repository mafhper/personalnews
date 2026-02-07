import { FlaskConical, Gauge, FileCode, Package, AlertTriangle, Loader2, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ScoreBreakdown } from '@/components/dashboard/ScoreBreakdown';
import { LighthouseCard } from '@/components/dashboard/LighthouseCard';
import { TestSuiteList } from '@/components/dashboard/TestSuiteList';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { CommitTimeline } from '@/components/dashboard/CommitTimeline';
import { SystemStatus } from '@/components/dashboard/SystemStatus';
import { useQualityData } from '@/contexts/QualityDataContext';
import { Button } from '@/components/ui/button';
import {
  getCategoryScores,
  getScoreStatus,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { currentSnapshot, historicalData, recentCommits, isLoading, error, openReport, dashboardSummary, cacheUpdatedAt } = useQualityData();

  console.log('[dashboard-debug] Renderizando Dashboard. State:', {
    isLoading,
    hasError: !!error,
    hasSnapshot: !!currentSnapshot,
    commit: currentSnapshot?.commitHash,
    testData: {
      total: currentSnapshot?.metrics?.tests?.total,
      passed: currentSnapshot?.metrics?.tests?.passed,
      failed: currentSnapshot?.metrics?.tests?.failed
    },
    healthScore: currentSnapshot?.healthScore
  });

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Carregando métricas de qualidade...</p>
      </div>
    );
  }

  if (error || !currentSnapshot) {
    console.warn('[dashboard-debug] Estado de erro ou snapshot ausente:', { error, currentSnapshot });
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold">Erro ao carregar dados</h3>
        <p className="text-muted-foreground max-w-md">
          {error || 'Não foi possível encontrar snapshots de qualidade. Execute os testes para gerar novos relatórios.'}
        </p>
      </div>
    );
  }

  console.log('[dashboard-debug] Calculando scores para commit:', currentSnapshot.commitHash);
  const categoryScores = getCategoryScores(currentSnapshot);
  const scoreStatus = getScoreStatus(currentSnapshot.healthScore);
  const previousScore = recentCommits[1]?.healthScore || 0;
  const coverageScore = categoryScores.coverage.score;
  const round1 = (value: number) => Number.parseFloat(value.toFixed(1));
  const lighthouseFeed = currentSnapshot.metrics.performance.lighthouseFeed;
  const lighthouseHome = currentSnapshot.metrics.performance.lighthouseHome;
  const primaryLighthouse =
    lighthouseFeed ||
    lighthouseHome ||
    currentSnapshot.metrics.performance.lighthouse;
  const lighthouseScopeLabel =
    lighthouseFeed ? 'Feed' : lighthouseHome ? 'Home' : 'Base';
  const averages = dashboardSummary?.averages;
  const security = dashboardSummary?.security;
  const scripts = dashboardSummary?.scripts || [];
  const orderedScripts = ['quality-gate', 'quality-core', 'analysis', 'coverage', 'coverage-quick', 'lighthouse-feed-desktop', 'lighthouse-home-desktop', 'security-scan'];
  const scriptLabels: Record<string, string> = {
    'quality-gate': 'Quality Gate',
    'quality-core': 'Quality Core',
    'analysis': 'Analysis',
    'coverage': 'Coverage',
    'coverage-quick': 'Coverage (Quick)',
    'lighthouse-feed-desktop': 'Lighthouse Feed (Desktop)',
    'lighthouse-home-desktop': 'Lighthouse Home (Desktop)',
    'security-scan': 'Security Scan',
  };
  const formatScriptLabel = (id: string) => {
    if (scriptLabels[id]) return scriptLabels[id];
    if (!id.includes(':')) return id.replace(/-/g, ' ');
    const [base, mode] = id.split(':');
    const baseLabel = scriptLabels[base] || base.replace(/-/g, ' ');
    const modeLabel = mode.replace(/-/g, ' ');
    return `${baseLabel} · ${modeLabel}`;
  };
  const scriptRows = scripts
    .sort((a, b) => orderedScripts.indexOf(a.id) - orderedScripts.indexOf(b.id))
    .filter(row => orderedScripts.includes(row.id))
    .slice(0, 6);
  const lastCacheLabel = cacheUpdatedAt ? new Date(cacheUpdatedAt).toLocaleString() : null;
  const sliceSparkline = (values: number[]) => values.slice(-12);
  const sparkHealth = sliceSparkline(historicalData.map(item => item.healthScore));
  const sparkTests = sliceSparkline(historicalData.map(item => item.tests.passed));
  const sparkPerformance = sliceSparkline(historicalData.map(item => item.performance));
  const sparkCoverage = sliceSparkline(historicalData.map(item => item.coverage));
  const sparkBundle = sliceSparkline(historicalData.map(item => item.bundleSize));
  const sparkPassRate = sliceSparkline(
    historicalData.map(item => {
      const total = item.tests.passed + item.tests.failed;
      return total > 0 ? (item.tests.passed / total) * 100 : 0;
    })
  );
  const sparkStability = sliceSparkline(historicalData.map(item => item.uptime ?? 0));
  const sparkLighthouseFeed = sliceSparkline(
    historicalData.map(item => item.performanceFeed ?? item.performance)
  );
  const sparkLighthouseHome = sliceSparkline(
    historicalData.map(item => item.performanceHome ?? item.performance)
  );

  // Trend calculations
  const prevSnapshot = historicalData[historicalData.length - 2];
  const calculateTrend = (current: number, previous?: number) => {
    if (previous === undefined || previous === 0) return null;
    return current - previous;
  };

  const lcpTrend = calculateTrend(currentSnapshot.metrics.performance.webVitals.lcp, prevSnapshot?.lcp);
  const clsTrend = calculateTrend(currentSnapshot.metrics.performance.webVitals.cls, prevSnapshot?.cls);
  const tbtTrend = calculateTrend(currentSnapshot.metrics.performance.webVitals.tbt, prevSnapshot?.tbt);

  // Calculate metric trends for small cards
  const testTrend = prevSnapshot ? currentSnapshot.metrics.tests.passed - prevSnapshot.tests.passed : null;
  const coverageTrend = prevSnapshot ? coverageScore - prevSnapshot.coverage : null;
  const bundleTrend = prevSnapshot ? round1(currentSnapshot.metrics.performance.bundleSize - prevSnapshot.bundleSize) : null;
  const bundleTrendValue = bundleTrend !== null ? Math.abs(bundleTrend) : null;
  const performanceTrend = prevSnapshot ? round1(primaryLighthouse.performance - prevSnapshot.performance) : null;

  // Test suites - always show all
  const testSuites = currentSnapshot.metrics.tests.suites;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Visão Geral</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Centro de comando do Quality Core • Commit: <code className="text-primary">{currentSnapshot.commitHash.substring(0, 7)}</code>
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
            {lastCacheLabel && (
              <span className="px-2 py-1 rounded-full border border-border bg-muted/40">
                Atualizado: {lastCacheLabel}
              </span>
            )}
            {dashboardSummary?.count != null && (
              <span className="px-2 py-1 rounded-full border border-border bg-muted/40">
                Snapshots: {dashboardSummary.count}
              </span>
            )}
            {dashboardSummary?.latestTimestamp && (
              <span className="px-2 py-1 rounded-full border border-border bg-muted/40">
                Último relatório: {new Date(dashboardSummary.latestTimestamp).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        {currentSnapshot.reportFile && (
          <Button
            variant="outline"
            className="gap-2 self-start sm:self-center"
            onClick={() => currentSnapshot.reportFile && openReport(currentSnapshot.reportFile)}
          >
            <FileText className="h-4 w-4" />
            Ver Relatório Completo
          </Button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Health Score & Breakdown */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <HealthScoreCard
            score={currentSnapshot.healthScore}
            previousScore={previousScore}
            confidenceLevel={currentSnapshot.confidenceLevel}
            status={scoreStatus}
            sparkline={sparkHealth}
          />
          <ScoreBreakdown
            {...categoryScores}
            history={{
              tests: sparkPassRate,
              performance: sparkPerformance,
              coverage: sparkCoverage,
              stability: sparkStability,
            }}
          />
        </div>

        {/* Center Column - Quick Metrics & Trend */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Quick Metrics Grid - Always visible */}
          <div className="grid grid-cols-2 gap-4 stagger-children">
            <MetricCard
              title="Testes"
              value={`${currentSnapshot.metrics.tests.passed}/${currentSnapshot.metrics.tests.total}`}
              subtitle={`${currentSnapshot.metrics.tests.failed} falhas`}
              icon={FlaskConical}
              sparkline={sparkTests}
              status={currentSnapshot.metrics.tests.failed === 0 ? 'success' : 'error'}
              trend={testTrend !== null ? { value: testTrend, isPositive: testTrend >= 0, unit: '', precision: 0 } : undefined}
              reportFile={currentSnapshot.reportFile}
              onOpenReport={openReport}
            />
            <MetricCard
              title="Performance"
              value={Math.round(primaryLighthouse.performance)}
              subtitle={`Lighthouse • ${lighthouseScopeLabel}`}
              icon={Gauge}
              sparkline={sparkPerformance}
              status={primaryLighthouse.performance >= 90 ? 'success' : 'warning'}
              trend={performanceTrend !== null ? { value: performanceTrend, isPositive: performanceTrend >= 0, unit: 'pt', precision: 0 } : undefined}
              reportFile={currentSnapshot.reportFile}
              onOpenReport={openReport}
            />
            <MetricCard
              title="Cobertura"
              value={`${coverageScore}%`}
              subtitle="Cobertura média"
              icon={FileCode}
              sparkline={sparkCoverage}
              status={coverageScore >= 80 ? 'success' : 'warning'}
              trend={coverageTrend !== null ? { value: round1(coverageTrend), isPositive: coverageTrend >= 0, unit: '%', precision: 1 } : undefined}
              reportFile={currentSnapshot.reportFile}
              onOpenReport={openReport}
            />
            <MetricCard
              title="Bundle Size"
              value={currentSnapshot.metrics.performance.bundleSize > 0 ? `${currentSnapshot.metrics.performance.bundleSize.toFixed(1)}KB` : 'N/A'}
              subtitle="Tamanho do build"
              icon={Package}
              sparkline={sparkBundle}
              status={currentSnapshot.metrics.performance.bundleSize <= 350 ? 'success' : 'warning'}
              trend={bundleTrendValue !== null ? { value: bundleTrendValue, isPositive: bundleTrend <= 0, unit: 'KB', precision: 1 } : undefined}
              reportFile={currentSnapshot.reportFile}
              onOpenReport={openReport}
            />
          </div>

          {/* Averages */}
          {averages && (
            <div className="premium-card rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Médias Recentes
                </h3>
                {dashboardSummary?.count != null && (
                  <span className="text-xs text-muted-foreground">Últimos {dashboardSummary.count} snapshots</span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Performance</div>
                  <div className="text-lg font-bold font-mono text-card-foreground">{averages.performance.toFixed(1)}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Cobertura</div>
                  <div className="text-lg font-bold font-mono text-card-foreground">{averages.coverage.toFixed(1)}%</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Bundle</div>
                  <div className="text-lg font-bold font-mono text-card-foreground">{averages.bundleSize.toFixed(1)}KB</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Pass Rate</div>
                  <div className="text-lg font-bold font-mono text-card-foreground">{averages.testsPassRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Trend Chart */}
          <TrendChart data={historicalData} metrics={['healthScore', 'performance', 'coverage']} />

          {/* Lighthouse Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lighthouseFeed && (
              <LighthouseCard scores={lighthouseFeed} label="Feed" sparkline={sparkLighthouseFeed} />
            )}
            {lighthouseHome && (
              <LighthouseCard scores={lighthouseHome} label="Home" sparkline={sparkLighthouseHome} />
            )}
            {!lighthouseFeed && !lighthouseHome && (
              <LighthouseCard
                scores={currentSnapshot.metrics.performance.lighthouse}
                label="Base"
                sparkline={sparkPerformance}
              />
            )}
          </div>
        </div>

        {/* Right Column - Timeline & Status */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <SystemStatus stability={currentSnapshot.metrics.stability} />
          <div className="premium-card rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Segurança
              </h3>
              <span className={cn(
                'text-xs px-2 py-1 rounded-full border',
                !security
                  ? 'border-border text-muted-foreground bg-muted/40'
                  : security.passed
                    ? 'border-success/40 text-success bg-success/10'
                    : 'border-error/40 text-error bg-error/10'
              )}>
                {security ? (security.passed ? 'OK' : 'Riscos') : 'Sem dados'}
              </span>
            </div>
            {security ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Críticos</span>
                  <span className={security.critical > 0 ? 'text-error font-semibold' : 'text-success'}>{security.critical}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Altos</span>
                  <span className={security.high > 0 ? 'text-warning font-semibold' : 'text-success'}>{security.high}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Médios</span>
                  <span className={security.medium > 0 ? 'text-warning font-semibold' : 'text-success'}>{security.medium}</span>
                </div>
                {security.timestamp && (
                  <div className="text-xs text-muted-foreground/80 pt-2">
                    Última varredura: {new Date(security.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Execute o scan de segurança para preencher os dados.</p>
            )}
          </div>
          <div className="premium-card rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Automação (Médias)
            </h3>
            {scriptRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem histórico de execução.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {scriptRows.map(row => (
                  <div key={row.id} className="flex items-center justify-between text-muted-foreground">
                    <span className="truncate">{formatScriptLabel(row.id)}</span>
                    <span className="font-mono text-card-foreground">{row.avgSeconds.toFixed(1)}s</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <CommitTimeline commits={recentCommits} />
        </div>
      </div>

      {/* Bottom Section - Test Suites */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <TestSuiteList
            suites={testSuites}
            totalDuration={currentSnapshot.metrics.tests.duration}
          />
        </div>
        <div className="col-span-12 lg:col-span-4">
          {/* Core Web Vitals */}
          <div className="premium-card rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Core Web Vitals
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground">LCP</p>
                  <p className="text-xs text-muted-foreground">Largest Contentful Paint</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-success">
                    {(currentSnapshot.metrics.performance.webVitals.lcp).toFixed(0)}ms
                  </div>
                  {lcpTrend !== null && (
                    <div className={cn("text-[10px] flex items-center justify-end gap-0.5", lcpTrend > 0 ? "text-error" : "text-success")}>
                      {lcpTrend > 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                      {Math.abs(lcpTrend).toFixed(0)}ms
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground">CLS</p>
                  <p className="text-xs text-muted-foreground">Cumulative Layout Shift</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-success">
                    {currentSnapshot.metrics.performance.webVitals.cls.toFixed(3)}
                  </div>
                  {clsTrend !== null && (
                    <div className={cn("text-[10px] flex items-center justify-end gap-0.5", clsTrend > 0 ? "text-error" : "text-success")}>
                      {clsTrend > 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                      {Math.abs(clsTrend).toFixed(3)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground">TBT</p>
                  <p className="text-xs text-muted-foreground">Total Blocking Time</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-success">
                    {Math.round(currentSnapshot.metrics.performance.webVitals.tbt)}ms
                  </div>
                  {tbtTrend !== null && (
                    <div className={cn("text-[10px] flex items-center justify-end gap-0.5", tbtTrend > 0 ? "text-error" : "text-success")}>
                      {tbtTrend > 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                      {Math.round(Math.abs(tbtTrend))}ms
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
