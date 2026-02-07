import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Gauge,
  FileCode,
  Shield,
  Clock,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  RefreshCw,
  Download,
  Loader2,
  Sparkles,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Logo } from './Logo';
import { useQualityData } from '@/contexts/QualityDataContext';
import { toast } from 'sonner';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Painel' },
  { to: '/tests', icon: FlaskConical, label: 'Testes' },
  { to: '/performance', icon: Gauge, label: 'Performance' },
  { to: '/coverage', icon: FileCode, label: 'Cobertura' },
  { to: '/security', icon: Shield, label: 'Segurança' },
  { to: '/operations', icon: Timer, label: 'Operações' },
  { to: '/history', icon: Clock, label: 'Histórico' },
  { to: '/reports', icon: FileText, label: 'Relatórios' },
];

interface DashboardSidebarProps {
  onOpenQuickActions?: () => void;
}

export function DashboardSidebar({ onOpenQuickActions }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { runAction, isActionRunning, recentCommits } = useQualityData();
  const location = useLocation();

  const handleExportAll = () => {
    if (recentCommits.length === 0) {
      toast.error('Sem dados para exportar');
      return;
    }
    const dataStr = JSON.stringify(recentCommits, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'quality-snapshots-history.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Histórico exportado com sucesso');
  };

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-border bg-muted/20">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-tight">Dashboard</span>
              <span className="font-bold text-foreground tracking-tight">Quality Core</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <Logo className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          const linkContent = (
            <NavLink
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary-foreground')} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/80" />
              )}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.to} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.to}>{linkContent}</div>;
        })}
      </nav>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wide px-3 mb-2">
            Ações Rápidas
          </p>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => onOpenQuickActions?.()}
          >
            <Sparkles className="h-4 w-4" />
            Mais Ações
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => runAction('run-tests', 'Executar Testes')}
            disabled={isActionRunning}
          >
            {isActionRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Rodar Testes
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => runAction('generate-report', 'Gerar Snapshot')}
            disabled={isActionRunning}
          >
            {isActionRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Gerar Snapshot
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleExportAll}
          >
            <Download className="h-4 w-4" />
            Exportar JSON
          </Button>
        </div>
      )}

      {/* Settings & Collapse */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <NavLink
              to="/settings"
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors',
                location.pathname === '/settings' && 'bg-sidebar-accent text-sidebar-primary'
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </NavLink>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent',
              collapsed && 'mx-auto'
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

    </aside>
  );
}
