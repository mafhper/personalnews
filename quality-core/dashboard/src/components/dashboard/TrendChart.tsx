import { useId, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TrendData {
  date: string;
  healthScore: number;
  coverage: number;
  performance: number;
  lcp?: number;
  cls?: number;
  tbt?: number;
  bundleSize?: number;
}

interface TrendChartProps {
  data: TrendData[];
  metrics?: Array<'healthScore' | 'coverage' | 'performance' | 'lcp' | 'cls' | 'tbt' | 'bundleSize'>;
  className?: string;
}

const metricConfigs = {
  healthScore: { color: 'hsl(160 84% 45%)', name: 'Health Score', gradient: 'healthGradient' },
  performance: { color: 'hsl(199 89% 55%)', name: 'Performance', gradient: 'perfGradient' },
  coverage: { color: 'hsl(38 92% 55%)', name: 'Cobertura', gradient: 'coverageGradient' },
  lcp: { color: 'hsl(280 84% 65%)', name: 'LCP', gradient: 'lcpGradient' },
  cls: { color: 'hsl(340 84% 65%)', name: 'CLS', gradient: 'clsGradient' },
  tbt: { color: 'hsl(20 84% 65%)', name: 'TBT', gradient: 'tbtGradient' },
  bundleSize: { color: 'hsl(200 10% 65%)', name: 'Bundle Size', gradient: 'bundleGradient' },
};

export function TrendChart({ 
  data, 
  metrics = ['healthScore', 'performance', 'coverage'],
  className 
}: TrendChartProps) {
  const id = useId().replace(/:/g, '');
  const metricList = metrics.filter((metric) => data.some((row) => row[metric] !== undefined));
  const chartHeight = 240;
  const chartWidth = 600;
  const paddingX = 24;
  const paddingY = 20;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const series = useMemo(() => {
    if (data.length < 2) return [];
    return metricList.map((metric) => {
      const values = data.map((row) => Number(row[metric] ?? 0));
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;
      const points = values.map((value, index) => {
        const x = paddingX + (index / (values.length - 1)) * innerWidth;
        const normalized = (value - min) / range;
        const y = chartHeight - paddingY - normalized * innerHeight;
        return { x, y, value };
      });
      const linePath = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
        .join(' ');
      const areaPath = `${linePath} L ${points[points.length - 1].x},${chartHeight - paddingY} L ${points[0].x},${chartHeight - paddingY} Z`;
      return {
        metric,
        points,
        linePath,
        areaPath,
        min,
        max,
      };
    });
  }, [data, metricList, innerWidth, innerHeight, chartHeight, paddingX, paddingY]);

  const xLabels = useMemo(() => {
    if (data.length < 2) return [];
    const lastIndex = data.length - 1;
    const midIndex = Math.floor(data.length / 2);
    const indexes = Array.from(new Set([0, midIndex, lastIndex]));
    return indexes.map((idx) => {
      const x = paddingX + (idx / (data.length - 1)) * innerWidth;
      const date = new Date(data[idx].date);
      return {
        x,
        label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      };
    });
  }, [data, innerWidth, paddingX]);

  if (data.length < 2) {
    return (
      <div className={cn('premium-card rounded-xl border border-border bg-card p-5', className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Tendência de Métricas
          </h3>
        </div>
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Sem dados suficientes para tendência.
        </div>
      </div>
    );
  }

  return (
    <div className={cn('premium-card rounded-xl border border-border bg-card p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Tendência de Métricas
        </h3>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
          normalizado
        </span>
      </div>

      <div className="h-64 w-full">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
          <defs>
            {metricList.map((metric) => (
              <linearGradient key={metric} id={`${metricConfigs[metric].gradient}-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={metricConfigs[metric].color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={metricConfigs[metric].color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {[0.25, 0.5, 0.75].map((ratio, idx) => {
            const y = paddingY + innerHeight * ratio;
            return (
              <line
                key={idx}
                x1={paddingX}
                x2={paddingX + innerWidth}
                y1={y}
                y2={y}
                stroke="hsl(222 30% 18%)"
                strokeDasharray="3 3"
              />
            );
          })}

          {series.map((metricSeries) => (
            <g key={metricSeries.metric}>
              <path
                d={metricSeries.areaPath}
                fill={`url(#${metricConfigs[metricSeries.metric].gradient}-${id})`}
              />
              <path
                d={metricSeries.linePath}
                fill="none"
                stroke={metricConfigs[metricSeries.metric].color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {xLabels.map((label) => (
            <text
              key={label.x}
              x={label.x}
              y={chartHeight - 4}
              textAnchor="middle"
              fontSize="11"
              fill="hsl(215 16% 47%)"
            >
              {label.label}
            </text>
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 pt-3">
        {metricList.map((metric) => {
          const latestValue = data[data.length - 1]?.[metric];
          return (
            <span
              key={metric}
              className="inline-flex items-center gap-2 text-[11px] px-2 py-1 rounded-full border border-border bg-muted/30"
            >
              <span
                className="inline-flex w-2 h-2 rounded-full"
                style={{ backgroundColor: metricConfigs[metric].color }}
              />
              <span className="uppercase tracking-widest text-muted-foreground">
                {metricConfigs[metric].name}
              </span>
              {latestValue !== undefined && (
                <span className="font-mono text-foreground">
                  {typeof latestValue === 'number' ? latestValue.toFixed(1) : latestValue}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
