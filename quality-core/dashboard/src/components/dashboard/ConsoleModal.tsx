import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Terminal, Loader2, XCircle, CheckCircle2, Clock, Activity, Cpu, Copy, Check } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ConsoleModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  output: string;
  isFinished: boolean;
  isSuccess: boolean;
}

export function ConsoleModal({
  isOpen,
  onOpenChange,
  title,
  output,
  isFinished,
  isSuccess
}: ConsoleModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Auto-scroll to bottom as new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [output]);

  const stats = useMemo(() => {
    const lines = output.split('\n').filter(l => l.trim().length > 0);
    const errors = lines.filter(l => l.toLowerCase().includes('error') || l.toLowerCase().includes('failed') || l.includes('❌')).length;
    const warnings = lines.filter(l => l.toLowerCase().includes('warn') || l.includes('⚠️')).length;
    return { lines: lines.length, errors, warnings };
  }, [output]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Logs copiados com sucesso');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden border-zinc-800 bg-[#0c0c0c] text-zinc-300 shadow-2xl">
        <DialogDescription className="sr-only">
          Terminal de saída para execução de scripts e testes.
        </DialogDescription>
        {/* Header Terminal Style */}
        <DialogHeader className="p-0 border-b border-zinc-800 bg-zinc-900/50">
          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Terminal className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold uppercase tracking-widest text-zinc-100 font-mono">
                  Console Output
                </DialogTitle>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-tighter">
                  {title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pr-4 border-r border-zinc-800">
                {!isFinished ? (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20 animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    RUNNING
                  </div>
                ) : isSuccess ? (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                    <CheckCircle2 className="h-3 w-3" />
                    FINISHED OK
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/20">
                    <XCircle className="h-3 w-3" />
                    FAILED
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 gap-2"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span className="text-[10px] font-mono">COPY LOGS</span>
              </Button>
            </div>
          </div>

          {/* Console Stats Bar */}
          <div className="grid grid-cols-3 border-t border-zinc-800 bg-zinc-950/50 divide-x divide-zinc-800">
            <div className="px-4 py-2 flex items-center gap-2">
              <Activity className="h-3 w-3 text-zinc-600" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Lines:</span>
              <span className="text-[10px] font-mono font-bold text-zinc-300">{stats.lines}</span>
            </div>
            <div className="px-4 py-2 flex items-center gap-2">
              <XCircle className="h-3 w-3 text-rose-500/50" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Errors:</span>
              <span className={clsx("text-[10px] font-mono font-bold", stats.errors > 0 ? "text-rose-400" : "text-zinc-500")}>
                {stats.errors}
              </span>
            </div>
            <div className="px-4 py-2 flex items-center gap-2">
              <Clock className="h-3 w-3 text-zinc-600" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Live:</span>
              <span className="text-[10px] font-mono font-bold text-zinc-300">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Terminal Body */}
        <div className="flex-1 overflow-hidden relative group">
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded px-2 py-1">
              <Cpu className="h-3 w-3 text-blue-500" />
              <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">Live Output</span>
            </div>
          </div>

          <ScrollArea className="h-full w-full" ref={scrollRef}>
            <div className="p-6 font-mono text-[11px] leading-relaxed break-all selection:bg-blue-500/30">
              {output.split('\n').map((line, i) => (
                <div key={i} className={clsx(
                  "flex gap-4 border-l-2 border-transparent hover:bg-zinc-900/50 transition-colors px-2",
                  line.includes('error') || line.includes('FAILED') || line.includes('❌') ? "border-rose-500/50 bg-rose-500/5 text-rose-200" : 
                  line.includes('SUCCESS') || line.includes('OK') || line.includes('✅') ? "text-emerald-300" :
                  line.includes('⏳') || line.includes('START') ? "text-blue-300" : "text-zinc-400"
                )}>
                  <span className="w-8 shrink-0 text-zinc-700 text-right select-none">{i + 1}</span>
                  <span className="whitespace-pre-wrap">{line || ' '}</span>
                </div>
              ))}
              
              {!output && (
                <div className="flex items-center gap-2 text-zinc-600 animate-pulse italic">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Initializing shell environment...</span>
                </div>
              )}
              
              {isFinished && (
                <div className={clsx(
                  "mt-8 p-4 rounded border font-bold uppercase tracking-widest text-center text-[10px]",
                  isSuccess ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                  Process exited with code {isSuccess ? '0' : '1'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Utility to handle conditional classes without external dependency if not available
function clsx(...args: unknown[]) {
  return args.filter(Boolean).join(' ');
}