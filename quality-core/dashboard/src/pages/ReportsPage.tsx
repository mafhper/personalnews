import { FileText, Download, ExternalLink, Loader2, AlertTriangle, RefreshCw, Zap, Clock, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQualityData } from '@/contexts/QualityDataContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { recentCommits, isLoading, error, refreshData, currentSnapshot, runAction, isActionRunning, openReport, searchQuery } = useQualityData();

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Carregando relatórios...</p>
      </div>
    );
  }

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(recentCommits, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'quality-snapshots-history.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Histórico exportado com sucesso (JSON)');
  };

  const handleExportMarkdown = () => {
    if (!currentSnapshot) {
      toast.error('Nenhum dado atual para exportar');
      return;
    }

    let md = `# Relatório de Dados de Qualidade\n\n`;
    md += `**Commit:** ${currentSnapshot.commitHash}\n`;
    md += `**Data:** ${new Date(currentSnapshot.timestamp).toLocaleString()}\n`;
    md += `**Score:** ${currentSnapshot.healthScore}%\n\n`;
    md += `## Métricas Principais\n\n`;
    md += `- Cobertura: ${currentSnapshot.metrics.coverage.lines}%\n`;
    md += `- Bundle Size: ${currentSnapshot.metrics.performance.bundleSize} KB\n`;
    md += `- Testes: ${currentSnapshot.metrics.tests.passed}/${currentSnapshot.metrics.tests.total} passados\n\n`;

    const dataUri = 'data:text/markdown;charset=utf-8,'+ encodeURIComponent(md);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `quality-report-${currentSnapshot.commitHash}.md`);
    linkElement.click();
    toast.success('Relatório Markdown gerado com sucesso');
  };

  const handleQuickReport = () => {
    if (currentSnapshot?.reportFile) {
      openReport(currentSnapshot.reportFile);
    } else {
      toast.info('Nenhum relatório recente disponível para visualização rápida.');
    }
  };

  // Filter commits that actually have report files and match search query
  const availableReports = recentCommits.filter(c => {
    if (!c.reportFile) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return c.reportFile.toLowerCase().includes(query) ||
           c.hash.toLowerCase().includes(query) ||
           c.message.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Histórico de auditorias markdown detectadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={refreshData}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Atualizar
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => runAction('generate-report', 'Gerar Novo Relatório')}
            disabled={isActionRunning}
          >
            {isActionRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Gerar Novo
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-3">
          <AlertTriangle size={18} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Reports List */}
      <div className="premium-card rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Relatório (Arquivo)
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Commit
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Data de Geração
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tipo
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Saúde
                </th>
                <th className="text-right py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {availableReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground italic">
                    {searchQuery ? `Nenhum relatório encontrado para "${searchQuery}"` : 'Nenhum relatório markdown encontrado nos diretórios monitorados.'}
                  </td>
                </tr>
              ) : (
                availableReports.map((commit) => {
                  // Detect report type from filename
                  const filename = commit.reportFile?.toLowerCase() || '';
                  const getReportType = () => {
                    if (filename.includes('performance') || filename.includes('perf')) return { type: 'Performance', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
                    if (filename.includes('test') || filename.includes('vitest')) return { type: 'Testes', color: 'bg-green-500/10 text-green-400 border-green-500/20' };
                    if (filename.includes('coverage') || filename.includes('cover')) return { type: 'Cobertura', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
                    if (filename.includes('bundle') || filename.includes('size')) return { type: 'Bundle', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
                    if (filename.includes('lint') || filename.includes('eslint')) return { type: 'Lint', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
                    if (filename.includes('security') || filename.includes('audit')) return { type: 'Segurança', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
                    return { type: 'Geral', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
                  };

                  const reportType = getReportType();

                  return (
                    <tr key={commit.hash} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <FileText className="h-5 w-5" />
                          </div>
                          <span className="font-medium text-card-foreground font-mono text-xs truncate max-w-[200px]">
                            {commit.reportFile}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {commit.hash.substring(0, 7)}
                        </code>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {commit.date}
                      </td>
                      <td className="py-4 px-6">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                          reportType.color
                        )}>
                          {reportType.type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            commit.healthScore >= 80 ? "bg-success" : commit.healthScore >= 50 ? "bg-warning" : "bg-error"
                          )} />
                          <span className="text-sm font-mono">{commit.healthScore}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-primary"
                            onClick={() => commit.reportFile && openReport(commit.reportFile)}
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="hidden sm:inline">Visualizar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => {
                              if (commit.reportFile) {
                                toast.info(`Iniciando download de ${commit.reportFile}...`);
                                fetch(`/api/reports/content?file=${encodeURIComponent(commit.reportFile)}`)
                                  .then(r => r.text())
                                  .then(text => {
                                    const blob = new Blob([text], { type: 'text/markdown' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = commit.reportFile!;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  });
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Generate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={handleQuickReport}
          className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-left hover:bg-muted/30 hover:border-primary/50 transition-all group"
        >
          <Zap className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
          <h4 className="font-medium text-card-foreground mb-1 text-sm">Relatório Rápido</h4>
          <p className="text-[10px] text-muted-foreground">Ver snapshot atual detalhado</p>
        </button>
        <button
          onClick={handleExportMarkdown}
          className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-left hover:bg-muted/30 hover:border-primary/50 transition-all group"
        >
          <FileDown className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
          <h4 className="font-medium text-card-foreground mb-1 text-sm">Relatório Dados</h4>
          <p className="text-[10px] text-muted-foreground">Gerar Markdown detalhado</p>
        </button>
        <button
          onClick={handleExportJSON}
          className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-left hover:bg-muted/30 hover:border-primary/50 transition-all group"
        >
          <Download className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
          <h4 className="font-medium text-card-foreground mb-1 text-sm">Exportar Dados</h4>
          <p className="text-[10px] text-muted-foreground">Baixar histórico em JSON</p>
        </button>
        <button
          onClick={() => toast.info('Agendamento automático disponível via CLI (cron jobs). Interface em desenvolvimento.')}
          className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-left hover:bg-muted/30 hover:border-primary/50 transition-all group"
        >
          <Clock className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
          <h4 className="font-medium text-card-foreground mb-1 text-sm">Agendar Relatório</h4>
          <p className="text-[10px] text-muted-foreground">Configurar execuções periódicas</p>
        </button>
      </div>

      {/* Helper Info */}
      <div className="p-6 rounded-xl border border-dashed border-border bg-muted/10 text-center">
        <p className="text-sm text-muted-foreground">
          Os relatórios são extraídos automaticamente das pastas <code className="text-xs">performance-reports/reports</code> e <code className="text-xs">performance-reports/quality</code>.
        </p>
      </div>
    </div>
  );
}
