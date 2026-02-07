import { useState } from 'react';
import { Bell, Search, RefreshCw, Play, Loader2, CheckCircle2, XCircle, Info, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { SearchModalSimple } from '@/components/dashboard/SearchModalSimple';
import { useQualityData } from '@/contexts/QualityDataContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

interface DashboardHeaderProps {
  projectName?: string;
}

export function DashboardHeader({ projectName = 'PersonalNews' }: DashboardHeaderProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const {
    currentSnapshot,
    runAction,
    isActionRunning,
    setConsoleOpen,
    notificationHistory,
    clearNotifications,
  } = useQualityData();

  const now = new Date();
  const formattedDate = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Determine overall status
  const overallStatus = !currentSnapshot ? 'warn' :
                        currentSnapshot.healthScore >= 80 ? 'pass' :
                        currentSnapshot.healthScore >= 50 ? 'warn' : 'fail';

  // Determine status message and problems
  const getStatusInfo = () => {
    if (!currentSnapshot) {
      return {
        message: 'Dados não carregados',
        problems: [],
        healthScore: 0,
      };
    }

    const health = currentSnapshot.healthScore;
    const problems: string[] = [];

    if (currentSnapshot.metrics.tests && currentSnapshot.metrics.tests.failed > 0) {
      problems.push(`${currentSnapshot.metrics.tests.failed} testes falhando`);
    }
    if (currentSnapshot.metrics.coverage && currentSnapshot.metrics.coverage.percentage < 50) {
      problems.push('Cobertura abaixo de 50%');
    }
    if (currentSnapshot.metrics.performance && currentSnapshot.metrics.performance.warnings > 0) {
      problems.push(`${currentSnapshot.metrics.performance.warnings} avisos de performance`);
    }

    let message = '';
    if (health >= 80) {
      message = 'Sistema saudável';
    } else if (health >= 50) {
      message = 'Atenção necessária';
    } else {
      message = 'Problemas críticos';
    }

    return { message, problems, healthScore: health };
  };

  const statusInfo = getStatusInfo();

  // Resolve project-specific logo path (slugified project name)
  const projectSlug = projectName
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const projectLogoPath = `/projects/${projectSlug}/logo${isDark ? '-dark' : ''}.svg`;
  const projectLogoDarkPath = `/projects/${projectSlug}/logo-dark.svg`;

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left: Project info */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border shadow-inner">
            <img
              src={typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? projectLogoDarkPath : projectLogoPath}
              alt={projectName}
              className="w-7 h-7 object-contain"
              onError={(e) => {
                // Try fallback to dashboard root logo, then external fallback
                const img = e.target as HTMLImageElement;
                if (img.src.endsWith('/logo-dark.svg')) {
                  img.src = projectLogoPath;
                  return;
                }
                if (img.src.endsWith('/logo.svg')) {
                  img.src = '/logo.svg';
                  return;
                }
                img.src = '/logo.svg';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">Projeto</span>
            </div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2 leading-none mt-0.5">
              {projectName}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <StatusBadge status={overallStatus} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2">
                      <div>
                        <p className="font-semibold text-sm">{statusInfo.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Score: <span className="font-mono font-bold">{statusInfo.healthScore.toFixed(0)}/100</span>
                        </p>
                      </div>
                      {statusInfo.problems.length > 0 && (
                        <div className="border-t pt-2">
                          <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Problemas:
                          </p>
                          <ul className="text-xs space-y-0.5">
                            {statusInfo.problems.map((problem, idx) => (
                              <li key={idx} className="text-muted-foreground">• {problem}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="border-t pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-blue-500 hover:text-blue-600"
                          onClick={() => {
                            // Navigation will be handled when we implement task routing
                            console.log('Navigate to metrics/report page');
                          }}
                        >
                          Ver detalhes completos →
                        </Button>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h1>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="relative w-full group"
          >
            <div className="flex items-center w-full px-3 py-2 rounded-md border border-border bg-muted/50 hover:bg-muted/70 transition-colors">
              <Search className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground flex-1 text-left">
                Buscar testes, relatórios, commits...
              </span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </button>
          <SearchModalSimple open={searchModalOpen} onOpenChange={setSearchModalOpen} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Actions Buttons */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hidden sm:flex"
            onClick={() => runAction('run-tests', 'Executar Testes')}
            disabled={isActionRunning}
          >
            {isActionRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Rodar Testes
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => runAction('generate-report', 'Gerar Relatório')}
            disabled={isActionRunning}
            title="Gerar Novo Relatório de Qualidade"
          >
            <RefreshCw className={`h-4 w-4 ${isActionRunning ? 'animate-spin' : ''}`} />
          </Button>

          {/* System time */}
          <div className="hidden lg:flex flex-col items-end text-xs text-muted-foreground ml-2 mr-2">
            <span className="font-mono">{formattedTime}</span>
            <span>{formattedDate}</span>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Bell className="h-4 w-4" />
                {notificationHistory.length > 0 && (
                  <span className={cn(
                    "absolute top-1.5 right-1.5 w-2 h-2 rounded-full",
                    isActionRunning ? "bg-blue-500 animate-pulse" : "bg-error"
                  )} />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                <h3 className="font-semibold text-sm">Notificações</h3>
                {notificationHistory.length > 0 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearNotifications}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <ScrollArea className="h-72">
                {notificationHistory.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">Sem atividades recentes</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notificationHistory.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 hover:bg-muted/50 cursor-pointer transition-colors group"
                        onClick={() => setConsoleOpen(true)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {n.status === 'running' ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> :
                             n.status === 'success' ? <CheckCircle2 className="h-4 w-4 text-success" /> :
                             <XCircle className="h-4 w-4 text-error" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none mb-1">{n.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(n.timestamp).toLocaleTimeString()} • {n.status === 'running' ? 'Executando...' : 'Finalizado'}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {notificationHistory.length > 0 && (
                <div className="p-2 border-t bg-muted/10 text-center">
                  <Button variant="link" size="sm" className="h-auto text-[10px]" onClick={() => setConsoleOpen(true)}>
                    Abrir Terminal Console
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
