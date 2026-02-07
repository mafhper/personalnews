import { useId, useMemo } from 'react';
import { cn } from '@/lib/utils';

type SparkTone = 'success' | 'warning' | 'error' | 'info' | 'muted';

interface MiniSparklineProps {
  data: number[];
  tone?: SparkTone;
  className?: string;
  height?: number;
}

const toneMap: Record<SparkTone, string> = {
  success: '--success',
  warning: '--warning',
  error: '--error',
  info: '--info',
  muted: '--muted-foreground',
};

export function MiniSparkline({
  data,
  tone = 'muted',
  className,
  height = 36,
}: MiniSparklineProps) {
  const id = useId().replace(/:/g, '');
  const gradientId = `spark-${id}`;
  const colorVar = toneMap[tone] ?? toneMap.muted;
  const stroke = `hsl(var(${colorVar}))`;
  const points = data.map((value, index) => ({ index, value }));

  const { linePath, areaPath } = useMemo(() => {
    if (points.length < 2) return { linePath: '', areaPath: '' };
    const width = 100;
    const heightPx = 36;
    const padding = 3;
    const innerHeight = heightPx - padding * 2;
    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const toX = (i: number) =>
      padding + (i / (points.length - 1)) * (width - padding * 2);
    const toY = (value: number) =>
      heightPx - padding - ((value - min) / range) * innerHeight;

    const coords = points.map((p, i) => [toX(i), toY(p.value)]);
    const line = coords
      .map((coord, i) => `${i === 0 ? 'M' : 'L'}${coord[0]},${coord[1]}`)
      .join(' ');

    const area = `${line} L ${coords[coords.length - 1][0]},${heightPx - padding} L ${coords[0][0]},${heightPx - padding} Z`;
    return { linePath: line, areaPath: area };
  }, [points]);

  if (points.length < 2) return null;

  return (
    <div className={cn('h-[36px] w-full', className)} style={{ height }}>
      <svg viewBox="0 0 100 36" className="w-full h-full" role="img" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
}
