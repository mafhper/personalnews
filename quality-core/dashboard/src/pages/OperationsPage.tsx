import { Clock, Database, Loader2, Timer, Activity, AlertTriangle } from 'lucide-react';
import { useQualityData } from '@/contexts/QualityDataContext';
import { MiniSparkline } from '@/components/dashboard/MiniSparkline';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

const scriptLabels: Record<string, string> = {
  'quality-gate': 'Quality Gate',
  'quality-core': 'Quality Core',
  'analysis': 'Analysis',
  'coverage': 'Coverage',
  'coverage-quick': 'Coverage (Quick)',
  'lighthouse-feed-desktop': 'Lighthouse Feed (Desktop)',
  'lighthouse-feed-mobile': 'Lighthouse Feed (Mobile)',
  'lighthouse-home-desktop': 'Lighthouse Home (Desktop)',
  'lighthouse-home-mobile': 'Lighthouse Home (Mobile)',
  'security-scan': 'Security Scan',
  'build': 'Build',
  'test': 'Tests',
};

const formatScriptLabel = (id: string) => {
  if (scriptLabels[id]) return scriptLabels[id];
  if (!id.includes(':')) return id.replace(/-/g, ' ');
  const [base, mode] = id.split(':');
  const baseLabel = scriptLabels[base] || base.replace(/-/g, ' ');
  const modeLabel = mode.replace(/-/g, ' ');
  return `${baseLabel} · ${modeLabel}`;
};

export default function OperationsPage() {
  const { dashboardSummary, cacheUpdatedAt, isLoading, error, historicalData } = useQualityData();

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Carregando dados operacionais...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold">Erro ao carregar dados</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const summary = dashboardSummary;
  const cacheLabel = cacheUpdatedAt ? new Date(cacheUpdatedAt).toLocaleString() : null;
  const scripts = summary?.scripts || [];
  const scriptHistory = summary?.scriptHistory || {};
  const performanceSeries = historicalData.map(item => item.performance);
  const coverageSeries = historicalData.map(item => item.coverage);
  const bundleSeries = historicalData.map(item => item.bundleSize);

  const coreHistoryKeys = [
    'quality-gate',
    'quality-core',
    'analysis',
    'coverage',
    'coverage-quick',
    'security-scan',
    'build',
  ];
  const lighthouseHistoryKeys = [
    'lighthouse-home-desktop',
    'lighthouse-home-mobile',
    'lighthouse-feed-desktop',
    'lighthouse-feed-mobile',
  ];

  const resolveKeys = (keys: string[]) =>
    keys.filter(key => (scriptHistory[key]?.length || 0) > 0);

  const buildHistory = (keys: string[]) => {
    if (keys.length === 0) return [];
    const historyLength = Math.max(
      ...keys.map(key => scriptHistory[key]?.length || 0),
      0
    );
    return Array.from({ length: historyLength }, (_, index) => {
      const point: Record<string, number | string | null> = { run: index + 1 };
      keys.forEach(key => {
        const series = scriptHistory[key] || [];
        point[key] = series[index] ?? null;
      });
      return point;
    });
  };

  const resolvedCoreKeys = resolveKeys(coreHistoryKeys);
  const resolvedLighthouseKeys = resolveKeys(lighthouseHistoryKeys);
  const coreHistory = buildHistory(resolvedCoreKeys);
  const lighthouseHistory = buildHistory(resolvedLighthouseKeys);

  const lineColors: Record<string, string> = {
    'quality-gate': 'hsl(var(--chart-primary))',
    'quality-core': 'hsl(var(--chart-secondary))',
    'analysis': 'hsl(var(--chart-tertiary))',
    'coverage': 'hsl(var(--chart-quaternary))',
    'coverage-quick': 'hsl(var(--success))',
    'security-scan': 'hsl(var(--warning))',
    'build': 'hsl(var(--info))',
    'lighthouse-home-desktop': 'hsl(var(--chart-primary))',
    'lighthouse-home-mobile': 'hsl(var(--chart-secondary))',
    'lighthouse-feed-desktop': 'hsl(var(--chart-tertiary))',
    'lighthouse-feed-mobile': 'hsl(var(--chart-quaternary))',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Operações</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Saúde do pipeline, médias de execução e cache do dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="premium-card rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <Database className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Cache</span>
          </div>
          <p className="text-lg font-semibold text-card-foreground">Dashboard Cache</p>
          <p className="text-xs text-muted-foreground mt-2">
            Atualizado: {cacheLabel || 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground">
            Snapshots: {summary?.count ?? 0}
          </p>
          <MiniSparkline data={performanceSeries} tone="info" className="mt-3" />
        </div>
        <div className="premium-card rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <Activity className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Médias</span>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Performance</span>
              <span className="font-mono text-card-foreground">{summary?.averages.performance?.toFixed(1) ?? '0.0'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cobertura</span>
              <span className="font-mono text-card-foreground">{summary?.averages.coverage?.toFixed(1) ?? '0.0'}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Bundle</span>
              <span className="font-mono text-card-foreground">{summary?.averages.bundleSize?.toFixed(1) ?? '0.0'}KB</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pass Rate</span>
              <span className="font-mono text-card-foreground">{summary?.averages.testsPassRate?.toFixed(1) ?? '0.0'}%</span>
            </div>
          </div>
          <MiniSparkline data={coverageSeries} tone="success" className="mt-3" />
        </div>
        <div className="premium-card rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <Clock className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Último Snapshot</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {summary?.latestTimestamp ? new Date(summary.latestTimestamp).toLocaleString() : 'N/A'}
          </p>
          <MiniSparkline data={bundleSeries} tone="warning" className="mt-3" />
        </div>
      </div>

      <div className="premium-card rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Tempos Médios de Execução
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Timer className="h-4 w-4" />
            Atualizado com base em execuções recentes
          </div>
        </div>
        {scripts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem histórico de execução disponível.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Script</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Execuções</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Média (s)</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Última (s)</th>
                </tr>
              </thead>
              <tbody>
                {scripts.map(script => (
                  <tr key={script.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-card-foreground">
                      {formatScriptLabel(script.id)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-sm text-muted-foreground">{script.runs}</td>
                    <td className="py-3 px-4 text-center font-mono text-sm text-card-foreground">{script.avgSeconds.toFixed(1)}</td>
                    <td className="py-3 px-4 text-center font-mono text-sm text-muted-foreground">{script.lastSeconds.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="premium-card rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Histórico por Categoria
          </h3>
          <span className="text-xs text-muted-foreground">Execuções recentes</span>
        </div>
        {resolvedCoreKeys.length === 0 && resolvedLighthouseKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem histórico suficiente para exibir tendência.</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Core Pipeline</h4>
                <span className="text-[10px] text-muted-foreground">Duração (s)</span>
              </div>
              {coreHistory.length < 2 ? (
                <p className="text-sm text-muted-foreground">Sem histórico suficiente.</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={coreHistory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.5} />
                      <XAxis dataKey="run" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                      />
                      {resolvedCoreKeys.map(key => (
                        <Line key={key} type="monotone" dataKey={key} stroke={lineColors[key]} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lighthouse</h4>
                <span className="text-[10px] text-muted-foreground">Duração (s)</span>
              </div>
              {lighthouseHistory.length < 2 ? (
                <p className="text-sm text-muted-foreground">Sem histórico suficiente.</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lighthouseHistory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.5} />
                      <XAxis dataKey="run" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                      />
                      {resolvedLighthouseKeys.map(key => (
                        <Line key={key} type="monotone" dataKey={key} stroke={lineColors[key]} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
