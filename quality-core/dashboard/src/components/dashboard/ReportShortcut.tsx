import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReportShortcutProps {
  reportFile?: string;
  onOpenReport: (file: string) => void;
  className?: string;
}

export function ReportShortcut({ reportFile, onOpenReport, className }: ReportShortcutProps) {
  if (!reportFile) return null;

  return (
    <div className={cn(
      'absolute inset-0 rounded-lg bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer',
      className
    )}
      onClick={() => onOpenReport(reportFile)}
    >
      <Button
        size="sm"
        className="gap-2 bg-primary hover:bg-primary/80"
      >
        <FileText className="h-4 w-4" />
        <span>Ver Último Relatório</span>
      </Button>
    </div>
  );
}
