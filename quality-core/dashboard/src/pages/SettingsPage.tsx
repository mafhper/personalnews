import { Settings, Moon, Sun, Monitor, Save, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/components/ThemeProvider';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { githubUrl, setGithubUrl, saveSettings, isLoading } = useSettings();

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ] as const;

  const handleSave = async () => {
    try {
      await saveSettings();
      toast.success('Configurações salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar configurações.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configurações</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize o Quality Core Dashboard
        </p>
      </div>

      {/* Theme Settings */}
      <div className="premium-card rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Aparência
        </h3>
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-3 block">Tema</Label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                      theme === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                    )}
                  >
                    <Icon className={cn(
                      'h-6 w-6',
                      theme === option.value ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <span className={cn(
                      'text-sm font-medium',
                      theme === option.value ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Project Settings */}
      <div className="premium-card rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Integração & GitHub
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="github-url" className="text-sm font-medium mb-2 block">
              URL do GitHub Pages (Site Publicado)
            </Label>
            <Input
              id="github-url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://usuario.github.io/projeto"
              className="max-w-md font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Usado para verificações de latência e uptime.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="gap-2" onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4" />
          {isLoading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
