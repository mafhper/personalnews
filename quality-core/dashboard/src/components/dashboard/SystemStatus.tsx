import { Wifi, WifiOff, Clock, Activity, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StabilityMetrics } from '@/lib/mock-data';
import { useQualityData } from '@/contexts/QualityDataContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Link } from 'react-router-dom';
import { MiniSparkline } from './MiniSparkline';

interface SystemStatusProps {
  stability: StabilityMetrics;
  className?: string;
}

export function SystemStatus({ stability, className }: SystemStatusProps) {
  const { realLatency, historicalData } = useQualityData();
  const { githubUrl } = useSettings();
  console.log('[status-debug] SystemStatus:', { status: stability.status, uptime: stability.uptime, realLatency });
  const latencySeries = historicalData
    .map(item => item.latency ?? 0)
    .filter(value => Number.isFinite(value) && value > 0);
  const uptimeSeries = historicalData
    .map(item => item.uptime ?? 0)
    .filter(value => Number.isFinite(value) && value > 0);
  const statusColor = {
    online: 'text-success',
    degraded: 'text-warning',
    offline: 'text-error',
  };

  const statusBg = {
    online: 'bg-success',
    degraded: 'bg-warning',
    offline: 'bg-error',
  };

  const statusLabel = {
    online: 'Online',
    degraded: 'Degradado',
    offline: 'Offline',
  };

  return (
    <div className={cn('premium-card rounded-xl border border-border bg-card p-5 group relative', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Status do Sistema
        </h3>
        <Link
          to="/settings"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-lg hover:bg-muted"
          title="Ir para configurações"
        >
          <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </Link>
      </div>

      <div className="space-y-4">
        {/* Site Information */}
        <div className="bg-muted/20 rounded-lg p-3 border border-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Site Configurado</p>
          <p className="text-sm font-medium text-foreground font-mono truncate">
            {githubUrl || 'Não configurado'}
          </p>
        </div>

        {/* Connection status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {stability.status === 'offline' ? (
              <WifiOff className="h-4 w-4 text-error" />
            ) : (
              <Wifi className={cn('h-4 w-4', statusColor[stability.status])} />
            )}
            <span className="text-sm text-card-foreground">Conexão</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('w-2 h-2 rounded-full pulse-live', statusBg[stability.status])} />
            <span className={cn('text-sm font-medium', statusColor[stability.status])}>
              {statusLabel[stability.status]}
            </span>
          </div>
        </div>

        {/* Latency */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-card-foreground">Latência Média</span>
          </div>
          <span className="text-sm font-mono font-medium text-card-foreground">
            {realLatency > 0 ? `${realLatency}ms` : 'Medindo...'}
          </span>
        </div>

        {/* Uptime */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-card-foreground">Uptime</span>
          </div>
          <span className={cn(
            'text-sm font-mono font-medium',
            stability.uptime >= 99 ? 'text-success' : stability.uptime >= 95 ? 'text-warning' : 'text-error'
          )}>
            {stability.uptime}%
          </span>
        </div>

        {/* Last check */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Última verificação:{' '}
            {new Date(stability.lastCheck).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        </div>
        {(latencySeries.length > 1 || uptimeSeries.length > 1) && (
          <div className="grid grid-cols-1 gap-3 pt-2">
            {latencySeries.length > 1 && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Latência</p>
                <MiniSparkline data={latencySeries.slice(-12)} tone="info" />
              </div>
            )}
            {uptimeSeries.length > 1 && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Uptime</p>
                <MiniSparkline data={uptimeSeries.slice(-12)} tone="success" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
