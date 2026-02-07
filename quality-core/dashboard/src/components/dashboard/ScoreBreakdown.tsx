import { cn } from '@/lib/utils';
import { FlaskConical, Gauge, FileCode, Server } from 'lucide-react';
import { MiniSparkline } from './MiniSparkline';

interface ScoreCategory {
  score: number;
  weight: number;
}

interface ScoreBreakdownProps {
  tests: ScoreCategory;
  performance: ScoreCategory;
  coverage: ScoreCategory;
  stability: ScoreCategory;
  history?: {
    tests?: number[];
    performance?: number[];
    coverage?: number[];
    stability?: number[];
  };
  className?: string;
}

const categories = [
  { key: 'tests', label: 'Testes', icon: FlaskConical },
  { key: 'performance', label: 'Performance', icon: Gauge },
  { key: 'coverage', label: 'Cobertura', icon: FileCode },
  { key: 'stability', label: 'Estabilidade', icon: Server },
] as const;

function getScoreColor(score: number) {
  if (score >= 90) return 'bg-score-excellent';
  if (score >= 75) return 'bg-score-good';
  if (score >= 50) return 'bg-score-medium';
  if (score >= 25) return 'bg-score-poor';
  return 'bg-score-critical';
}

function getTextColor(score: number) {
  if (score >= 90) return 'text-score-excellent';
  if (score >= 75) return 'text-score-good';
  if (score >= 50) return 'text-score-medium';
  if (score >= 25) return 'text-score-poor';
  return 'text-score-critical';
}

export function ScoreBreakdown({
  tests,
  performance,
  coverage,
  stability,
  history,
  className,
}: ScoreBreakdownProps) {
  const data = { tests, performance, coverage, stability };

  return (
    <div className={cn('premium-card rounded-xl border border-border bg-card p-5', className)}>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        Breakdown do Score
      </h3>
      
      <div className="space-y-4">
        {categories.map(({ key, label, icon: Icon }) => {
          const category = data[key];
          const trend = history?.[key];
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-card-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground">({category.weight}%)</span>
                </div>
                <span className={cn('text-sm font-bold font-mono', getTextColor(category.score))}>
                  {category.score}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', getScoreColor(category.score))}
                  style={{ width: `${category.score}%` }}
                />
              </div>
              {trend && trend.length > 1 && (
                <MiniSparkline
                  data={trend}
                  tone={category.score >= 75 ? 'success' : category.score >= 50 ? 'warning' : 'error'}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Weighted calculation explanation */}
      <div className="mt-5 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Score final = Σ (categoria × peso) / 100
        </p>
      </div>
    </div>
  );
}
