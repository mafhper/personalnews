import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';

type StatusType = 'pass' | 'warn' | 'fail' | 'loading';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig = {
  pass: {
    icon: CheckCircle2,
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30',
    defaultLabel: 'PASS',
  },
  warn: {
    icon: AlertCircle,
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30',
    defaultLabel: 'WARN',
  },
  fail: {
    icon: XCircle,
    bg: 'bg-error/10',
    text: 'text-error',
    border: 'border-error/30',
    defaultLabel: 'FAIL',
  },
  loading: {
    icon: Loader2,
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-muted',
    defaultLabel: 'Loading',
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', status === 'loading' && 'animate-spin')} />
      {label || config.defaultLabel}
    </span>
  );
}
