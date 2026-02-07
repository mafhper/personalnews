import { CheckCircle2, XCircle, AlertTriangle, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TestSuite } from '@/lib/mock-data';

interface TestSuiteListProps {
  suites: TestSuite[];
  totalDuration: number;
  className?: string;
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function TestSuiteList({ suites = [], totalDuration, className }: TestSuiteListProps) {
  console.log('[tests-debug] TestSuiteList:', {
    suitesCount: suites.length,
    totalDuration,
    firstSuite: suites[0],
    allSuites: suites
  });
  const statusIcon = {
    passed: <CheckCircle2 className="h-4 w-4 text-success" />,
    failed: <XCircle className="h-4 w-4 text-error" />,
    flaky: <AlertTriangle className="h-4 w-4 text-warning" />,
  };

  const totalTests = suites.reduce((sum, s) => sum + s.tests, 0);
  const totalPassed = suites.reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = suites.reduce((sum, s) => sum + s.failed, 0);

  return (
    <div className={cn('premium-card rounded-xl border border-border bg-card p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Suítes de Teste
        </h3>
        {suites.length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-success">
              <CheckCircle2 className="h-3 w-3" />
              {totalPassed}
            </span>
            <span className="flex items-center gap-1 text-error">
              <XCircle className="h-3 w-3" />
              {totalFailed}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(totalDuration)}
            </span>
          </div>
        )}
      </div>

      {suites.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/10 rounded-lg border border-dashed">
           <Info className="h-8 w-8 text-muted-foreground/40 mb-2" />
           <p className="text-sm text-muted-foreground italic">Nenhuma suíte encontrada para os filtros atuais.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {suites.map((suite) => (
            <div
              key={suite.name}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-colors',
                suite.status === 'failed' ? 'bg-error/5 border border-error/20' : 'bg-muted/30 hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-3">
                {statusIcon[suite.status]}
                <span className="font-medium text-sm text-card-foreground">{suite.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{suite.passed}/{suite.tests} passed</span>
                <span className="font-mono">{formatDuration(suite.duration)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary bar */}
      {suites.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="h-2 bg-muted rounded-full overflow-hidden flex">
            <div
              className="h-full bg-success transition-all"
              style={{ width: `${totalTests > 0 ? (totalPassed / totalTests) * 100 : 0}%` }}
            />
            <div
              className="h-full bg-error transition-all"
              style={{ width: `${totalTests > 0 ? (totalFailed / totalTests) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {totalPassed} de {totalTests} testes passaram ({totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%)
          </p>
        </div>
      )}
    </div>
  );
}
