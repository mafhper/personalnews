import { FileCode, AlertTriangle, Loader2, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useQualityData } from '@/contexts/QualityDataContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Fragment, useMemo, useState } from 'react';
import { MiniSparkline } from '@/components/dashboard/MiniSparkline';

function getCoverageColor(value: number) {
  if (value >= 80) return 'text-success';
  if (value >= 60) return 'text-warning';
  return 'text-error';
}

function getCoverageBg(value: number) {
  if (value >= 80) return 'bg-success';
  if (value >= 60) return 'bg-warning';
  return 'bg-error';
}

const coverageMetrics = [
  { key: 'lines', label: 'Linhas' },
  { key: 'statements', label: 'Statements' },
  { key: 'branches', label: 'Branches' },
  { key: 'functions', label: 'Funções' },
] as const;

export default function CoveragePage() {
  const { currentSnapshot, historicalData, isLoading, error, dashboardSummary } = useQualityData();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'file' | 'lines' | 'statements' | 'branches' | 'functions' | 'uncovered'>('lines');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const coverageSummary = dashboardSummary?.coverageSummary;
  const coverageDetails = useMemo(() => dashboardSummary?.coverageDetails ?? [], [dashboardSummary]);
  const coverage = currentSnapshot?.metrics.coverage ?? {
    lines: 0,
    statements: 0,
    branches: 0,
    functions: 0,
    trend: 'stable' as const,
  };
  const hasBranchData = (coverageSummary?.branches.total ?? 0) > 0 || coverage.branches > 0;
  const hasFunctionData = (coverageSummary?.functions.total ?? 0) > 0 || coverage.functions > 0;
  const coverageValues = [coverage.lines, coverage.statements];
  if (hasBranchData) coverageValues.push(coverage.branches);
  if (hasFunctionData) coverageValues.push(coverage.functions);
  const avgCoverage = Math.round(
    coverageValues.length > 0
      ? coverageValues.reduce((acc, value) => acc + value, 0) / coverageValues.length
      : 0
  );
  const isCoveragePartial = !hasBranchData || !hasFunctionData;
  const coverageSeries = historicalData.map(item => item.coverage);

  const sortedCoverage = useMemo(() => {
    const filtered = coverageDetails.filter(item =>
      item.file.toLowerCase().includes(search.toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) => {
      const getValue = (item: typeof a) => {
        if (sortKey === 'file') return item.file;
        if (sortKey === 'lines') return item.lines.pct;
        if (sortKey === 'statements') return item.statements.pct;
        if (sortKey === 'branches') return item.branches.pct;
        if (sortKey === 'functions') return item.functions.pct;
        return item.lines.uncovered.length;
      };
      const valueA = getValue(a);
      const valueB = getValue(b);
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDir === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }
      const diff = Number(valueA) - Number(valueB);
      return sortDir === 'asc' ? diff : -diff;
    });
    return sorted;
  }, [coverageDetails, search, sortKey, sortDir]);

  const criticalFiles = [...sortedCoverage].sort((a, b) => a.lines.pct - b.lines.pct).slice(0, 3);

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Carregando dados de cobertura...</p>
      </div>
    );
  }

  if (error || !currentSnapshot) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold">Erro ao carregar dados</h3>
        <p className="text-muted-foreground">{error || 'Snapshots de cobertura não encontrados.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cobertura de Código</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Análise detalhada da cobertura de testes por módulo
          </p>
          {isCoveragePartial && (
            <p className="text-xs text-warning mt-2">
              Dados parciais: média calculada apenas com métricas disponíveis.
            </p>
          )}
        </div>
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
          coverage.trend === 'up' ? 'bg-success/10 text-success' : 
          coverage.trend === 'down' ? 'bg-error/10 text-error' : 'bg-muted text-muted-foreground'
        )}>
          {coverage.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          <span>Tendência: {coverage.trend === 'up' ? 'Subindo' : coverage.trend === 'down' ? 'Descendo' : 'Estável'}</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Score */}
        <div className="col-span-12 lg:col-span-4">
          <div className="premium-card rounded-xl border border-border bg-card p-6 h-full flex flex-col justify-center">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-6">
              Cobertura Média Global
            </h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className={cn('text-6xl font-bold font-mono', getCoverageColor(avgCoverage))}>
                {avgCoverage}
              </span>
              <span className="text-2xl text-muted-foreground font-medium">%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
              <div
                className={cn('h-full rounded-full transition-all duration-1000', getCoverageBg(avgCoverage))}
                style={{ width: `${avgCoverage}%` }}
              />
            </div>
            {coverageSeries.length > 1 && (
              <MiniSparkline
                data={coverageSeries.slice(-12)}
                tone={avgCoverage >= 80 ? 'success' : avgCoverage >= 60 ? 'warning' : 'error'}
                className="mt-2"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Meta do projeto: <span className="text-foreground font-medium">80%</span>
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-2 gap-4">
            {coverageMetrics.map(({ key, label }) => {
              const value = coverage[key];
              const unavailable =
                (key === 'branches' && !hasBranchData) ||
                (key === 'functions' && !hasFunctionData);
              return (
                <div key={key} className="premium-card rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
                    <FileCode className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                  <div className={cn('text-3xl font-bold font-mono mb-3', unavailable ? 'text-muted-foreground' : getCoverageColor(value))}>
                    {unavailable ? 'N/D' : `${value.toFixed(1)}%`}
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-1000', unavailable ? 'bg-muted-foreground/30' : getCoverageBg(value))}
                      style={{ width: `${unavailable ? 0 : value}%` }}
                    />
                  </div>
                  {coverageSeries.length > 1 && (
                    <MiniSparkline
                      data={coverageSeries.slice(-12)}
                      tone={
                        unavailable
                          ? 'warning'
                          : value >= 80
                            ? 'success'
                            : value >= 60
                              ? 'warning'
                              : 'error'
                      }
                      className="mt-3"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {coverageSummary && (
        <div className="premium-card rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Resumo Geral (Cobertura Real)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Linhas</div>
              <div className="text-lg font-bold font-mono">{coverageSummary.lines.pct.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {coverageSummary.lines.covered}/{coverageSummary.lines.total}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Statements</div>
              <div className="text-lg font-bold font-mono">{coverageSummary.statements.pct.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {coverageSummary.statements.covered}/{coverageSummary.statements.total}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Branches</div>
              <div className="text-lg font-bold font-mono">
                {coverageSummary.branches.total > 0 ? `${coverageSummary.branches.pct.toFixed(1)}%` : 'N/D'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {coverageSummary.branches.total > 0
                  ? `${coverageSummary.branches.covered}/${coverageSummary.branches.total}`
                  : 'sem dados'}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Funções</div>
              <div className="text-lg font-bold font-mono">
                {coverageSummary.functions.total > 0 ? `${coverageSummary.functions.pct.toFixed(1)}%` : 'N/D'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {coverageSummary.functions.total > 0
                  ? `${coverageSummary.functions.covered}/${coverageSummary.functions.total}`
                  : 'sem dados'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Critical Files Warning */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {criticalFiles.map(file => (
          <div key={file.file} className="p-4 rounded-xl border border-error/20 bg-error/5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-error truncate max-w-[200px]">
                {file.file.split('/').pop()}
              </h4>
              <p className="text-xs text-error/70 mt-1">Cobertura crítica: {file.lines.pct.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="premium-card rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Histórico de Cobertura
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="coverageGradientPage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="hsl(215 16% 47%)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis
                stroke="hsl(215 16% 47%)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222 47% 9%)',
                  border: '1px solid hsl(222 30% 18%)',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => new Date(value).toLocaleString('pt-BR')}
              />
              <Area
                type="monotone"
                dataKey="coverage"
                stroke="hsl(38 92% 55%)"
                fill="url(#coverageGradientPage)"
                strokeWidth={2}
                name="Cobertura %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Files Coverage Table */}
      <div className="premium-card rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Detalhamento por Arquivo
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {coverageDetails.length} arquivo(s) analisados
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar arquivos..."
                className="pl-10 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {(['file', 'lines', 'statements', 'branches', 'functions', 'uncovered'] as const).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (sortKey === key) {
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortKey(key);
                      setSortDir(key === 'file' ? 'asc' : 'desc');
                    }
                  }}
                  className={cn(
                    'px-2 py-1 rounded-full border',
                    sortKey === key
                      ? 'border-primary/40 text-primary bg-primary/10'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {key === 'file'
                    ? 'Arquivo'
                    : key === 'lines'
                      ? 'Linhas'
                      : key === 'statements'
                        ? 'Statements'
                        : key === 'branches'
                          ? 'Branches'
                          : key === 'functions'
                            ? 'Funções'
                            : 'Descobertas'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="text-left py-3 px-4">Arquivo</th>
                <th className="text-center py-3 px-4">Linhas</th>
                <th className="text-center py-3 px-4">Statements</th>
                <th className="text-center py-3 px-4">Branches</th>
                <th className="text-center py-3 px-4">Funções</th>
                <th className="text-center py-3 px-4">Linhas não cobertas</th>
              </tr>
            </thead>
            <tbody>
              {sortedCoverage.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground italic">
                    Nenhum arquivo encontrado para "{search}"
                  </td>
                </tr>
              ) : (
                sortedCoverage.map(item => (
                  <Fragment key={item.file}>
                    <tr
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setExpandedFile(expandedFile === item.file ? null : item.file)}
                    >
                      <td className="py-3 px-4 font-mono text-xs text-card-foreground">
                        {item.file}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        {item.lines.pct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        {item.statements.pct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        {item.branches.pct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        {item.functions.pct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                        {item.lines.uncovered.length}
                      </td>
                    </tr>
                    {expandedFile === item.file && item.lines.uncovered.length > 0 && (
                      <tr className="bg-muted/10">
                        <td colSpan={6} className="py-3 px-4 text-xs text-muted-foreground">
                          Linhas sem cobertura:
                          <span className="ml-2 font-mono text-[11px] text-foreground">
                            {item.lines.uncovered.slice(0, 40).join(', ')}
                            {item.lines.uncovered.length > 40 ? '…' : ''}
                          </span>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
