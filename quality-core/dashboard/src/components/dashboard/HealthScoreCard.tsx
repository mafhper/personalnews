import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MiniSparkline } from './MiniSparkline';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HealthScoreCardProps {
  score: number;
  previousScore?: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  status: string;
  sparkline?: number[];
  className?: string;
}

export function HealthScoreCard({
  score,
  previousScore = 0,
  confidenceLevel,
  status,
  sparkline,
  className,
}: HealthScoreCardProps) {
  console.log('[ui-debug] HealthScoreCard:', { score, confidenceLevel, status });
  const delta = score - previousScore;
  
  const scoreColorClass = useMemo(() => {
    if (score >= 90) return 'text-score-excellent';
    if (score >= 75) return 'text-score-good';
    if (score >= 50) return 'text-score-medium';
    if (score >= 25) return 'text-score-poor';
    return 'text-score-critical';
  }, [score]);

  const ringColorClass = useMemo(() => {
    if (score >= 90) return 'stroke-score-excellent';
    if (score >= 75) return 'stroke-score-good';
    if (score >= 50) return 'stroke-score-medium';
    if (score >= 25) return 'stroke-score-poor';
    return 'stroke-score-critical';
  }, [score]);

  const glowClass = useMemo(() => {
    if (score >= 75) return 'glow-success';
    if (score >= 50) return 'glow-warning';
    return 'glow-error';
  }, [score]);

  const confidenceBadge = {
    high: { label: 'Alta Confiança', color: 'bg-success/20 text-success' },
    medium: { label: 'Média Confiança', color: 'bg-warning/20 text-warning' },
    low: { label: 'Baixa Confiança', color: 'bg-error/20 text-error' },
  };

  // SVG circle properties
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      className={cn(
        'premium-card relative rounded-xl border border-border bg-card p-6',
        glowClass,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Health Score
          </h3>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground/50" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-sm">
                Score calculado com base em: Testes (40%), Performance (30%), Cobertura (20%), Estabilidade (10%)
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <span className={cn('text-xs font-medium px-2 py-1 rounded-full', confidenceBadge[confidenceLevel].color)}>
          {confidenceBadge[confidenceLevel].label}
        </span>
      </div>

      {/* Score Circle */}
      <div className="flex items-center justify-center py-4">
        <div className="relative">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth="8"
              className="stroke-muted"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={cn('score-ring transition-all duration-1000', ringColorClass)}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-4xl font-bold font-mono', scoreColorClass)}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground mt-1">{status}</span>
          </div>
        </div>
      </div>

      {/* Delta indicator */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {delta > 0 ? (
          <>
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">+{delta} pts</span>
          </>
        ) : delta < 0 ? (
          <>
            <TrendingDown className="h-4 w-4 text-error" />
            <span className="text-sm font-medium text-error">{delta} pts</span>
          </>
        ) : (
          <>
            <Minus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Sem alteração</span>
          </>
        )}
        <span className="text-xs text-muted-foreground">vs commit anterior</span>
      </div>

      {sparkline && sparkline.length > 1 && (
        <div className="mt-4">
          <MiniSparkline
            data={sparkline}
            tone={score >= 75 ? 'success' : score >= 50 ? 'warning' : 'error'}
          />
        </div>
      )}
    </div>
  );
}
