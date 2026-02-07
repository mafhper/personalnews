import { GitCommit, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  healthScore: number;
  delta: number;
}

interface CommitTimelineProps {
  commits: Commit[];
  className?: string;
}

export function CommitTimeline({ commits, className }: CommitTimelineProps) {
  return (
    <div className={cn('premium-card rounded-xl border border-border bg-card p-5', className)}>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        Histórico de Commits
      </h3>

      <div className="space-y-3">
        {commits.map((commit, index) => (
          <div
            key={commit.hash}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer',
              index === 0 ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
            )}
          >
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                <GitCommit className="h-4 w-4" />
              </div>
              {index < commits.length - 1 && (
                <div className="w-0.5 h-6 bg-border mt-1" />
              )}
            </div>

            {/* Commit info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-primary">{commit.hash}</code>
                <span className="text-xs text-muted-foreground">{commit.date}</span>
              </div>
              <p className="text-sm font-medium text-card-foreground mt-1 truncate">
                {commit.message}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-muted-foreground">Score: {commit.healthScore}</span>
                <span className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  commit.delta > 0 ? 'text-success' : commit.delta < 0 ? 'text-error' : 'text-muted-foreground'
                )}>
                  {commit.delta > 0 ? (
                    <><TrendingUp className="h-3 w-3" />+{commit.delta}</>
                  ) : commit.delta < 0 ? (
                    <><TrendingDown className="h-3 w-3" />{commit.delta}</>
                  ) : (
                    <><Minus className="h-3 w-3" />0</>
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
