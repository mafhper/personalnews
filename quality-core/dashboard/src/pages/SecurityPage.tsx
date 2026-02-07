import { AlertTriangle, ShieldCheck, ShieldAlert, Clock, Loader2, Download, Search } from 'lucide-react';
import { useQualityData } from '@/contexts/QualityDataContext';
import { cn } from '@/lib/utils';
import { MiniSparkline } from '@/components/dashboard/MiniSparkline';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';

export default function SecurityPage() {
  const { dashboardSummary, cacheUpdatedAt, isLoading, error } = useQualityData();

  const security = dashboardSummary?.security;
  const securityHistory = useMemo(() => dashboardSummary?.securityHistory ?? [], [dashboardSummary]);
  const cacheLabel = cacheUpdatedAt ? new Date(cacheUpdatedAt).toLocaleString() : null;
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [sortKey, setSortKey] = useState<'severity' | 'file' | 'type' | 'line'>('severity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const historyData = useMemo(
    () =>
      securityHistory.map(item => ({
        date: new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        critical: item.critical,
        high: item.high,
        medium: item.medium,
        total: item.total,
      })),
    [securityHistory]
  );

  const findings = useMemo(() => {
    const data = security?.findings ?? [];
    const filtered = data.filter(item => {
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
      if (!search) return true;
      const query = search.toLowerCase();
      return (
        item.file.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        String(item.line).includes(query) ||
        (item.preview || '').toLowerCase().includes(query)
      );
    });
    const severityRank: Record<string, number> = { critical: 3, high: 2, medium: 1 };
    const sorted = [...filtered].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'severity') {
        diff = (severityRank[a.severity] || 0) - (severityRank[b.severity] || 0);
      } else if (sortKey === 'file') {
        diff = a.file.localeCompare(b.file);
      } else if (sortKey === 'type') {
        diff = a.type.localeCompare(b.type);
      } else if (sortKey === 'line') {
        diff = (a.line || 0) - (b.line || 0);
      }
      return sortDir === 'asc' ? diff : -diff;
    });
    return sorted;
  }, [security?.findings, search, severityFilter, sortKey, sortDir]);

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Carregando dados de segurança...</p>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Segurança</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Resultados do Security Scan e indicadores críticos
        </p>
        {cacheLabel && (
          <p className="text-xs text-muted-foreground mt-2">Atualizado: {cacheLabel}</p>
        )}
      </div>

      {!security ? (
        <div className="premium-card rounded-xl border border-border bg-card p-6 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhum relatório de segurança encontrado. Execute <code className="text-primary">bun run security:scan</code>.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={cn('premium-card rounded-lg border p-4', security.critical > 0 ? 'border-error/40 bg-error/5' : 'border-border bg-card')}>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Críticos</span>
              </div>
              <p className={cn('text-3xl font-bold font-mono', security.critical > 0 ? 'text-error' : 'text-success')}>
                {security.critical}
              </p>
              <MiniSparkline
                data={securityHistory.map(item => item.critical)}
                tone={security.critical > 0 ? 'error' : 'success'}
                className="mt-3"
              />
            </div>
            <div className={cn('premium-card rounded-lg border p-4', security.high > 0 ? 'border-warning/40 bg-warning/5' : 'border-border bg-card')}>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <ShieldAlert className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Altos</span>
              </div>
              <p className={cn('text-3xl font-bold font-mono', security.high > 0 ? 'text-warning' : 'text-success')}>
                {security.high}
              </p>
              <MiniSparkline
                data={securityHistory.map(item => item.high)}
                tone={security.high > 0 ? 'warning' : 'success'}
                className="mt-3"
              />
            </div>
            <div className={cn('premium-card rounded-lg border p-4', security.medium > 0 ? 'border-warning/30 bg-warning/5' : 'border-border bg-card')}>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <ShieldAlert className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Médios</span>
              </div>
              <p className={cn('text-3xl font-bold font-mono', security.medium > 0 ? 'text-warning' : 'text-success')}>
                {security.medium}
              </p>
              <MiniSparkline
                data={securityHistory.map(item => item.medium)}
                tone={security.medium > 0 ? 'warning' : 'success'}
                className="mt-3"
              />
            </div>
            <div className="premium-card rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Total</span>
              </div>
              <p className="text-3xl font-bold font-mono text-card-foreground">{security.total}</p>
              <MiniSparkline
                data={securityHistory.map(item => item.total)}
                tone="info"
                className="mt-3"
              />
            </div>
          </div>

          <div className="premium-card rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Status Geral
                </h3>
                <p className="text-lg font-semibold text-card-foreground mt-2">
                  {security.passed ? 'Nenhum alerta crítico' : 'Atenção necessária'}
                </p>
              </div>
              <div className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border',
                security.passed ? 'border-success/40 text-success bg-success/10' : 'border-error/40 text-error bg-error/10'
              )}>
                {security.passed ? 'OK' : 'Riscos'}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
              <Clock className="h-4 w-4" />
              Última varredura: {security.timestamp ? new Date(security.timestamp).toLocaleString() : 'N/A'}
            </div>
          </div>

          <div className="premium-card rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Histórico por Categoria
              </h3>
              <span className="text-xs text-muted-foreground">Últimas execuções</span>
            </div>
            {historyData.length < 2 ? (
              <p className="text-sm text-muted-foreground">Sem histórico suficiente para exibir tendência.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
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
                    <Line type="monotone" dataKey="critical" stroke="hsl(var(--error))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="high" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="medium" stroke="hsl(var(--chart-secondary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--chart-primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="premium-card rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Evidências e Arquivos Afetados
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {security?.findingsTotal ?? findings.length} ocorrência(s) detectadas
                  {security?.findingsTruncated ? ' (lista reduzida)' : ''}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 self-start sm:self-center"
                onClick={() => {
                  const payload = {
                    generatedAt: cacheUpdatedAt,
                    findings,
                  };
                  const dataStr = JSON.stringify(payload, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'security-findings.json';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4" />
                Exportar JSON
              </Button>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por arquivo, tipo, linha..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {(['all', 'critical', 'high', 'medium'] as const).map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSeverityFilter(filter)}
                    className={cn(
                      'px-3 py-1 rounded-full border text-xs uppercase tracking-wide',
                      severityFilter === filter
                        ? 'border-primary/40 text-primary bg-primary/10'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {filter === 'all' ? 'Todos' : filter === 'critical' ? 'Críticos' : filter === 'high' ? 'Altos' : 'Médios'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Ordenar:</span>
                {(['severity', 'file', 'type', 'line'] as const).map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (sortKey === key) {
                        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortKey(key);
                        setSortDir('desc');
                      }
                    }}
                    className={cn(
                      'px-2 py-1 rounded-full border',
                      sortKey === key
                        ? 'border-primary/40 text-primary bg-primary/10'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {key === 'severity' ? 'Severidade' : key === 'file' ? 'Arquivo' : key === 'type' ? 'Tipo' : 'Linha'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="text-left py-3 px-4">Severidade</th>
                    <th className="text-left py-3 px-4">Tipo</th>
                    <th className="text-left py-3 px-4">Arquivo</th>
                    <th className="text-center py-3 px-4">Linha</th>
                    <th className="text-left py-3 px-4">Prévia</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Nenhum achado encontrado para os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    findings.map(item => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium border',
                              item.severity === 'critical'
                                ? 'border-error/40 text-error bg-error/10'
                                : item.severity === 'high'
                                  ? 'border-warning/40 text-warning bg-warning/10'
                                  : 'border-info/40 text-info bg-info/10'
                            )}
                          >
                            {item.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-card-foreground">{item.type}</td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {item.file}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                          {item.line || '-'}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {item.preview || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
