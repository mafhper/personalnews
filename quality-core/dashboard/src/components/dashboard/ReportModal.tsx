import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, Download, Copy, Check, BarChart3, Package, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reportFile: string | undefined;
}

interface ReportMetrics {
  coverage: string;
  bundleSize: string;
  status: string;
  passed: number;
  total: number;
  date: string;
}

export function ReportModal({ isOpen, onOpenChange, reportFile }: ReportModalProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadReport = useCallback(async () => {
    if (!reportFile) return;
    console.log(`[report-debug] Loading report file: ${reportFile}`);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/reports/content?file=${encodeURIComponent(reportFile)}`);
      if (!response.ok) throw new Error(`Falha ao carregar o relatório: ${response.status}`);
      const text = await response.text();
      console.log(`[report-debug] Report loaded successfully (${text.length} chars)`);
      setContent(text);
    } catch (err) {
      console.error(`[report-debug] Error loading report:`, err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [reportFile]);

  useEffect(() => {
    if (isOpen && reportFile) {
      loadReport();
    }
  }, [isOpen, reportFile, loadReport]);

  const metrics = useMemo<ReportMetrics | null>(() => {
    if (!content) return null;

    const coverageMatch = content.match(/coverage:\s+([\d.]+)%/) || content.match(/Coverage:\*\* ([\d.]+)%/);
    const bundleMatch = content.match(/bundle_total_kb:\s+([\d.]+)/) || content.match(/Bundle Size:\*\* ([\d.]+) KB/);
    const statusMatch = content.match(/\*\*Status:\*\* (PASSED|FAILED|APROVADO|REPROVADO)/i);
    const dateMatch = content.match(/\*\*Date:\*\* (.*)/) || content.match(/Data:\*\* (.*)/);

    // Summary table parsing
    const passedMatch = content.match(/\| Passed \| (\d+) \|/) || content.match(/\| Sucesso \| (\d+) \|/);
    const totalMatch = content.match(/\| Total Steps \| (\d+) \|/) || content.match(/\| Total de Etapas \| (\d+) \|/);

    return {
      coverage: coverageMatch ? `${coverageMatch[1]}%` : 'N/A',
      bundleSize: bundleMatch ? `${bundleMatch[1]} KB` : 'N/A',
      status: statusMatch ? statusMatch[1].toUpperCase() : 'UNKNOWN',
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      total: totalMatch ? parseInt(totalMatch[1]) : 0,
      date: dateMatch ? dateMatch[1] : 'N/A'
    };
  }, [content]);

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = reportFile || 'report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Relatório copiado para a área de transferência');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-border bg-background shadow-2xl">
        <DialogDescription className="sr-only">
          Visualização detalhada do relatório de auditoria em Markdown.
        </DialogDescription>
        {/* Modern Header */}
        <DialogHeader className="p-0 border-b">
          <div className="bg-card/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Detalhes da Auditoria</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                    {reportFile}
                  </span>
                  {metrics && (
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                      (metrics.status.includes('PASS') || metrics.status.includes('APROV')) ? "bg-success/10 text-success" : "bg-error/10 text-error"
                    )}>
                      {metrics.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                <span className="hidden sm:inline">Copiar Markdown</span>
              </Button>
              <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>

          {/* Metrics Summary Strip */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 border-t divide-x">
              <div className="p-4 flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-medium">Cobertura</p>
                  <p className="text-sm font-bold font-mono">{metrics.coverage}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-medium">Bundle Size</p>
                  <p className="text-sm font-bold font-mono">{metrics.bundleSize}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-medium">Pass Rate</p>
                  <p className="text-sm font-bold font-mono">
                    {metrics.passed} / {metrics.total}
                    <span className="text-[10px] ml-1 text-muted-foreground font-normal">
                      ({metrics.total > 0 ? Math.round((metrics.passed / metrics.total) * 100) : 0}%)
                    </span>
                  </p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-3">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-medium">Geração</p>
                  <p className="text-sm font-bold truncate max-w-[120px]">{metrics.date}</p>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative bg-muted/20">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm z-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">Processando relatório...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <Activity className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-bold mb-1">Erro ao carregar</h3>
              <p className="text-muted-foreground mb-6 max-w-xs">{error}</p>
              <Button onClick={loadReport} variant="secondary">Tentar novamente</Button>
            </div>
          ) : (
            <ScrollArea className="h-full w-full">
              <div className="max-w-4xl mx-auto p-8 md:p-12">
                <div className="prose dark:prose-invert max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-3xl prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b
                  prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-primary/90
                  prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-2
                  prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-4
                  prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:text-sm
                  prose-th:bg-muted/50 prose-th:text-foreground prose-th:font-semibold prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-border
                  prose-td:p-3 prose-td:border prose-td:border-border
                  prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-zinc-950 prose-pre:p-6 prose-pre:rounded-xl prose-pre:border prose-pre:border-border/50 prose-pre:shadow-2xl prose-pre:my-8
                  prose-strong:text-foreground prose-strong:font-bold
                  prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                  prose-hr:my-12 prose-hr:border-border">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
