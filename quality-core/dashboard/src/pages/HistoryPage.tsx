import { Clock, GitCommit, GitBranch, TrendingUp, TrendingDown, Minus, Filter, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { useQualityData } from '@/contexts/QualityDataContext';
import { cn } from '@/lib/utils';
import { MiniSparkline } from '@/components/dashboard/MiniSparkline';

export default function HistoryPage() {
  const { historicalData, recentCommits, isLoading, error, openReport, searchQuery } = useQualityData();

  console.log('[history-debug] Renderizando Histórico. Stats:', {
    historicalItems: historicalData.length,
    commitItems: recentCommits.length,
    isLoading
  });

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Carregando histórico...</p>
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

  const filteredCommits = recentCommits.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return c.hash.toLowerCase().includes(query) || 
           c.message.toLowerCase().includes(query) ||
           c.author.toLowerCase().includes(query);
  });

  const avgScore = historicalData.length > 0 
    ? Math.round(historicalData.reduce((sum, s) => sum + s.healthScore, 0) / historicalData.length)
    : 0;
  
  const maxScore = historicalData.length > 0 
    ? Math.max(...historicalData.map(s => s.healthScore))
    : 0;
    
  const minScore = historicalData.length > 0 
    ? Math.min(...historicalData.map(s => s.healthScore))
    : 0;
  const healthSeries = historicalData.map(item => item.healthScore);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Histórico</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Timeline de snapshots e evolução de métricas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <GitBranch className="h-4 w-4" />
            main
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Health Score Timeline Chart */}
      <div className="premium-card rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Evolução do Health Score
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="hsl(215 16% 47%)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value}
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
              />
              <Line
                type="monotone"
                dataKey="healthScore"
                stroke="hsl(160 84% 45%)"
                strokeWidth={3}
                dot={{ fill: 'hsl(160 84% 45%)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(160 84% 45%)' }}
                name="Health Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Commit Timeline */}
      <div className="premium-card rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-6">
          Commits Recentes {searchQuery && `(Filtrando por "${searchQuery}")`}
        </h3>
        {filteredCommits.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground italic">
            {searchQuery ? `Nenhum commit encontrado para "${searchQuery}"` : 'Nenhum commit processado ainda.'}
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            {/* Commits */}
            <div className="space-y-6">
              {filteredCommits.map((commit, index) => (
                <div key={commit.hash} className="relative flex gap-6 pl-10">
                  {/* Timeline dot */}
                  <div className={cn(
                    'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2',
                    index === 0 && !searchQuery
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-card border-border text-muted-foreground'
                  )}>
                    <GitCommit className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className={cn(
                    'flex-1 rounded-lg border p-4 transition-colors',
                    index === 0 && !searchQuery ? 'border-primary/30 bg-primary/5' : 'border-border bg-card hover:bg-muted/30'
                  )}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs font-mono text-primary">{commit.hash.substring(0, 7)}</code>
                          {index === 0 && !searchQuery && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase">
                              Atual
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-card-foreground">{commit.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {commit.date}
                          </span>
                          <span>por {commit.author}</span>
                        </div>
                      </div>

                      {/* Score & Delta */}
                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <div className="text-2xl font-bold font-mono text-card-foreground">
                            {commit.healthScore}
                          </div>
                          <div className={cn(
                            'flex items-center justify-end gap-1 text-sm font-medium mt-1',
                            commit.delta > 0 ? 'text-success' : commit.delta < 0 ? 'text-error' : 'text-muted-foreground'
                          )}>
                            {commit.delta > 0 ? (
                              <><TrendingUp className="h-3 w-3" />+{commit.delta}</>
                            ) : commit.delta < 0 ? (
                              <><TrendingDown className="h-3 w-3" />{commit.delta}</>
                            ) : (
                              <><Minus className="h-3 w-3" />0</>
                            )}
                          </div>
                        </div>
                        {commit.reportFile && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[10px] gap-1 px-2"
                            onClick={() => openReport(commit.reportFile!)}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver Relatório
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card rounded-lg border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Snapshots</div>
          <div className="text-2xl font-bold font-mono text-card-foreground">{historicalData.length}</div>
          {healthSeries.length > 1 && (
            <MiniSparkline data={healthSeries.slice(-12)} tone="info" className="mt-3" />
          )}
        </div>
        <div className="premium-card rounded-lg border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Score Médio</div>
          <div className="text-2xl font-bold font-mono text-card-foreground">
            {avgScore}
          </div>
          {healthSeries.length > 1 && (
            <MiniSparkline data={healthSeries.slice(-12)} tone="success" className="mt-3" />
          )}
        </div>
        <div className="premium-card rounded-lg border border-success/30 bg-success/5 p-4">
          <div className="text-xs text-success uppercase tracking-wide mb-1">Maior Score</div>
          <div className="text-2xl font-bold font-mono text-success">
            {maxScore}
          </div>
          {healthSeries.length > 1 && (
            <MiniSparkline data={healthSeries.slice(-12)} tone="success" className="mt-3" />
          )}
        </div>
        <div className="premium-card rounded-lg border border-error/30 bg-error/5 p-4">
          <div className="text-xs text-error uppercase tracking-wide mb-1">Menor Score</div>
          <div className="text-2xl font-bold font-mono text-error">
            {minScore}
          </div>
          {healthSeries.length > 1 && (
            <MiniSparkline data={healthSeries.slice(-12)} tone="error" className="mt-3" />
          )}
        </div>
      </div>
    </div>
  );
}
