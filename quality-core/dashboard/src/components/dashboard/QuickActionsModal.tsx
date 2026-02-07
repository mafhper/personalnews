import { useState, useMemo } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  command: string;
  icon: string;
  category: 'test' | 'build' | 'analysis' | 'maintenance' | 'other';
}

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'test', label: 'Testes', icon: '🧪' },
  { id: 'build', label: 'Build', icon: '🏗️' },
  { id: 'analysis', label: 'Análise', icon: '📊' },
  { id: 'maintenance', label: 'Manutenção', icon: '⚙️' },
  { id: 'other', label: 'Outros', icon: '🔧' },
];

export function QuickActionsModal({ isOpen, onClose }: QuickActionsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const actions: QuickAction[] = useMemo(() => {
    // Common build scripts from package.json
    const list: QuickAction[] = [
      {
        id: 'test-all',
        label: 'Executar Todos os Testes',
        description: 'Roda suite completa de testes com Vitest',
        command: 'bun run test:all',
        icon: '🧪',
        category: 'test'
      },
      {
        id: 'test-watch',
        label: 'Testes em Tempo Real',
        description: 'Monitora testes enquanto você trabalha',
        command: 'bun run test:watch',
        icon: '👁️',
        category: 'test'
      },
      {
        id: 'test-coverage',
        label: 'Cobertura de Testes',
        description: 'Analisa cobertura do código',
        command: 'bun run test:coverage',
        icon: '📊',
        category: 'test'
      },
      {
        id: 'build',
        label: 'Build Produção',
        description: 'Compila o código para produção',
        command: 'bun run build',
        icon: '🏗️',
        category: 'build'
      },
      {
        id: 'dev',
        label: 'Dev Server',
        description: 'Inicia servidor de desenvolvimento',
        command: 'bun run dev',
        icon: '⚡',
        category: 'build'
      },
      {
        id: 'type-check',
        label: 'Verificação de Tipos',
        description: 'Valida todos os tipos TypeScript',
        command: 'bunx tsc --noEmit',
        icon: '✓',
        category: 'analysis'
      },
      {
        id: 'lint',
        label: 'ESLint',
        description: 'Verifica padrão de código',
        command: 'bun run lint',
        icon: '🔍',
        category: 'analysis'
      },
      {
        id: 'lighthouse-feed',
        label: 'Lighthouse (Feed)',
        description: 'Auditoria Lighthouse focada no feed',
        command: 'bun run quality:lighthouse:feed',
        icon: '💡',
        category: 'analysis'
      },
      {
        id: 'lighthouse-home',
        label: 'Lighthouse (Home)',
        description: 'Auditoria Lighthouse focada na home',
        command: 'bun run quality:lighthouse:home',
        icon: '🏠',
        category: 'analysis'
      },
      {
        id: 'lighthouse-gate',
        label: 'Lighthouse (Gate)',
        description: 'Auditoria Lighthouse para performance gate',
        command: 'bun run perf:lighthouse',
        icon: '🧪',
        category: 'analysis'
      },
      {
        id: 'cleanup',
        label: 'Limpeza de Cache',
        description: 'Remove arquivos de cache e build temporários',
        command: 'bun run clean:cache',
        icon: '🧹',
        category: 'maintenance'
      },
      {
        id: 'dashboard-refresh',
        label: 'Atualizar Dashboard',
        description: 'Recalcula cache do dashboard',
        command: 'bun run quality:dashboard:refresh',
        icon: '♻️',
        category: 'maintenance'
      },
      {
        id: 'audit',
        label: 'Auditoria de Segurança',
        description: 'Verifica vulnerabilidades no projeto',
        command: 'bun run security:audit',
        icon: '🔒',
        category: 'maintenance'
      }
    ];

    const order: Array<QuickAction['category']> = ['test', 'build', 'analysis', 'maintenance', 'other'];
    return list.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
  }, []);

  const filtered = selectedCategory
    ? actions.filter(a => a.category === selectedCategory)
    : actions;

  const handleCopy = (command: string, id: string) => {
    navigator.clipboard.writeText(command).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-border animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-xl font-bold">Ações Rápidas</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Copie e execute comandos localmente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Category Filter */}
          <div className="p-6 border-b border-border bg-muted/10 space-y-3 sticky top-0">
            <p className="text-xs font-medium text-muted-foreground uppercase">Filtrar por categoria</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  selectedCategory === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                Todas
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all',
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <span>{cat.icon}</span>{cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions Grid */}
          <div className="p-6 space-y-3">
            {filtered.length > 0 ? (
              filtered.map(action => (
                <div
                  key={action.id}
                  className="p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{action.icon}</span>
                        <h3 className="font-medium text-foreground">{action.label}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{action.description}</p>
                      <code className="text-xs bg-black/20 px-2 py-1 rounded text-primary font-mono break-all block">
                        {action.command}
                      </code>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCopy(action.command, action.id)}
                      className="flex-shrink-0 gap-2"
                    >
                      {copiedId === action.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma ação disponível nesta categoria
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex gap-2 justify-end bg-muted/20">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
