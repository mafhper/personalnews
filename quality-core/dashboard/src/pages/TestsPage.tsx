import { FlaskConical, CheckCircle2, XCircle, AlertTriangle, Clock, Search, Filter, Loader2, PauseCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQualityData } from '@/contexts/QualityDataContext';
import { cn } from '@/lib/utils';
import { TestSuite } from '@/lib/mock-data';
import { MiniSparkline } from '@/components/dashboard/MiniSparkline';

interface FailedTest {
  name: string;
  suite: string;
  file: string;
  error: string;
  duration: number;
}

export default function TestsPage() {
  const { currentSnapshot, failedTests, isLoading, error, historicalData } = useQualityData();

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Carregando dados de testes...</p>
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
        <p className="text-muted-foreground">{error || 'Snapshots de teste não encontrados.'}</p>
      </div>
    );
  }

  const { tests } = currentSnapshot.metrics;
  const passRate = tests.total > 0 ? Math.round((tests.passed / tests.total) * 100) : 0;
  const safeFailedTests = failedTests as FailedTest[];
  const testSeries = historicalData.map(item => item.tests.passed + item.tests.failed + (item.tests.skipped ?? 0));
  const passedSeries = historicalData.map(item => item.tests.passed);
  const failedSeries = historicalData.map(item => item.tests.failed);
  const skippedSeries = historicalData.map(item => item.tests.skipped ?? 0);
  const durationSeries = historicalData.map(item => item.tests.duration ?? 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Testes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visão detalhada da suíte de testes Vitest
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar testes..." className="pl-10 w-64" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="premium-card rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <FlaskConical className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Total</span>
          </div>
          <p className="text-3xl font-bold font-mono text-card-foreground">{tests.total}</p>
          {testSeries.length > 1 && (
            <MiniSparkline data={testSeries.slice(-12)} tone="info" className="mt-3" />
          )}
        </div>
        <div className="premium-card rounded-lg border border-success/30 bg-success/5 p-4">
          <div className="flex items-center gap-2 text-success mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Passou</span>
          </div>
          <p className="text-3xl font-bold font-mono text-success">{tests.passed}</p>
          {passedSeries.length > 1 && (
            <MiniSparkline data={passedSeries.slice(-12)} tone="success" className="mt-3" />
          )}
        </div>
        <div className="premium-card rounded-lg border border-error/30 bg-error/5 p-4">
          <div className="flex items-center gap-2 text-error mb-2">
            <XCircle className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Falhou</span>
          </div>
          <p className="text-3xl font-bold font-mono text-error">{tests.failed}</p>
          {failedSeries.length > 1 && (
            <MiniSparkline data={failedSeries.slice(-12)} tone="error" className="mt-3" />
          )}
        </div>
        <div className="premium-card rounded-lg border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-center gap-2 text-warning mb-2">
            <PauseCircle className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Pulados</span>
          </div>
          <p className="text-3xl font-bold font-mono text-warning">{tests.skipped}</p>
          {skippedSeries.length > 1 && (
            <MiniSparkline data={skippedSeries.slice(-12)} tone="warning" className="mt-3" />
          )}
        </div>
        <div className="premium-card rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Duração</span>
          </div>
          <p className="text-3xl font-bold font-mono text-card-foreground">{(tests.duration / 1000).toFixed(1)}s</p>
          {durationSeries.length > 1 && (
            <MiniSparkline data={durationSeries.slice(-12)} tone="info" className="mt-3" />
          )}
        </div>
      </div>

      {/* Pass Rate Bar */}
      <div className="premium-card rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Taxa de Aprovação
          </h3>
          <span className={cn(
            'text-2xl font-bold font-mono',
            passRate >= 95 ? 'text-success' : passRate >= 80 ? 'text-warning' : 'text-error'
          )}>
            {passRate}%
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              passRate >= 95 ? 'bg-success' : passRate >= 80 ? 'bg-warning' : 'bg-error'
            )}
            style={{ width: `${passRate}%` }}
          />
        </div>
      </div>

      {/* Failed Tests Details */}
      {tests.failed > 0 && (
        <div className="premium-card rounded-xl border border-error/30 bg-error/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-error" />
            <h3 className="text-sm font-medium text-error uppercase tracking-wide">
              Testes com Falha ({tests.failed})
            </h3>
          </div>
          <div className="space-y-3">
            {safeFailedTests.map((test, index) => (
              <div key={index} className="premium-card rounded-lg bg-card border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-card-foreground truncate">{test.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {test.suite} • {test.file}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{test.duration}ms</span>
                </div>
                <div className="mt-3 p-3 rounded bg-muted/50 font-mono text-xs text-error overflow-x-auto">
                  {test.error}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Suites */}
      <div className="premium-card rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Suítes de Teste
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Suíte</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Passou</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Falhou</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Duração</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {tests.suites.map((suite: TestSuite) => (
                <tr key={suite.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-card-foreground">{suite.name}</td>
                  <td className="py-3 px-4 text-center font-mono text-sm">{suite.tests}</td>
                  <td className="py-3 px-4 text-center font-mono text-sm text-success">{suite.passed}</td>
                  <td className="py-3 px-4 text-center font-mono text-sm text-error">{suite.failed}</td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-muted-foreground">{suite.duration}ms</td>
                  <td className="py-3 px-4 text-center">
                    {suite.status === 'passed' && <CheckCircle2 className="h-4 w-4 text-success mx-auto" />}
                    {suite.status === 'failed' && <XCircle className="h-4 w-4 text-error mx-auto" />}
                    {suite.status === 'flaky' && <AlertTriangle className="h-4 w-4 text-warning mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
