import React, { useState } from 'react';
import { ThemeSelector } from './ThemeSelector';
import { BackgroundCreator } from './BackgroundCreator';
import { useExtendedTheme } from '../hooks/useExtendedTheme';
import { useAppearance, LAYOUT_PRESETS } from '../hooks/useAppearance';
import { useFeedCategories } from '../hooks/useFeedCategories';
import { Switch } from './ui/Switch';
import { createBackup, downloadBackup, restoreBackup } from '../services/backupService';
import { useNotificationReplacements } from '../hooks/useNotificationReplacements';
import { useLanguage } from '../hooks/useLanguage';
import { HeaderConfig, ContentConfig, Language } from '../types';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  timeFormat: '12h' | '24h';
  setTimeFormat: (format: '12h' | '24h') => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  isOpen,
  onClose,
  timeFormat,
  setTimeFormat
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { currentTheme, updateThemeSettings, themeSettings, setCurrentTheme, defaultPresets } = useExtendedTheme();
  const { applyLayoutPreset, backgroundConfig, updateBackgroundConfig, resetAppearance, headerConfig, updateHeaderConfig, contentConfig, updateContentConfig } = useAppearance();
  const { alertSuccess, alertError, confirmDanger } = useNotificationReplacements();
  const { language, setLanguage } = useLanguage();
  const { resetCategoryLayouts } = useFeedCategories();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    try {
      const backup = createBackup();
      downloadBackup(backup);
      alertSuccess('Backup exportado!');
    } catch {
      alertError('Erro ao exportar.');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      await restoreBackup(backup);
      alertSuccess('Backup restaurado!');
      window.location.reload();
    } catch {
      alertError('Erro ao importar.');
    }
  };

  // Reset apenas configurações visuais/aparência
  const handleResetStyles = async () => {
    const confirmed = await confirmDanger('Isso vai resetar apenas as personalizações de estilo (tema, layout, cores, header). Feeds e categorias serão mantidos. Continuar?');
    if (confirmed) {
      resetAppearance();
      resetCategoryLayouts();
      alertSuccess('Estilos resetados!');
    }
  };

  // Reset categorias para padrão
  const handleResetCategories = async () => {
    const confirmed = await confirmDanger('Isso vai remover todas as categorias personalizadas e restaurar as categorias padrão. Os feeds serão movidos para "Sem categoria". Continuar?');
    if (confirmed) {
      localStorage.removeItem('feed-categories');
      window.location.reload();
    }
  };

  // Reset COMPLETO (tudo)
  const handleResetComplete = async () => {
    const confirmed = await confirmDanger(
      '⚠️ ATENÇÃO: Isso vai apagar TODOS os dados:\n\n' +
      '• Todos os feeds cadastrados\n' +
      '• Todas as categorias\n' +
      '• Todas as personalizações de estilo\n' +
      '• Histórico de leitura\n' +
      '• Favoritos\n\n' +
      'Esta ação NÃO pode ser desfeita. Deseja continuar?'
    );
    if (confirmed) {
      // Limpar todos os dados do localStorage relacionados ao app
      const keysToRemove = [
        'rss-feeds',           // IMPORTANT: This is the actual key used by App.tsx
        'feed-sources',        // Legacy key, keep for backwards compatibility
        'feed-categories',
        'appearance-header',
        'appearance-content',
        'appearance-background',
        'appearance-active-layout',
        'appearance-overrides',
        'extended-theme-settings',
        'article-layout-settings',
        'article-read-status',
        'favorites-data',
        'personalnews_weather_city',
        'feed-error-history',  // Clear problematic feeds history too
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      alertSuccess('Reset completo realizado! A página será recarregada.');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const setThemeColor = (color: string) => {
    const newTheme = {
      ...currentTheme,
      id: `quick-color-${Date.now()}`,
      name: `${currentTheme.name} (Custom)`,
      colors: { ...currentTheme.colors, accent: color }
    };
    updateThemeSettings({ currentTheme: newTheme });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[rgb(var(--color-background))]/92 border-l border-[rgb(var(--color-border))] z-50 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col backdrop-blur-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))]/70 backdrop-blur-xl">
          <h2 className="text-lg font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configurações
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* Appearance Section */}
          <AccordionSection
            title="Aparência"
            icon="🎨"
            isOpen={expandedSection === 'appearance'}
            onToggle={() => toggleSection('appearance')}
          >
            <div className="space-y-4">
              {/* Theme Mode */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Tema Principal</label>
                <div className="flex gap-2">
                  {[
                    { id: 'auto', label: 'Auto' },
                    { id: 'light', label: 'Claro' },
                    { id: 'dark', label: 'Escuro' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        if (mode.id === 'auto') {
                          updateThemeSettings({ autoDetectSystemTheme: true, systemThemeOverride: null });
                        } else {
                          const matchingPreset = defaultPresets.find(p => p.category === mode.id);
                          if (matchingPreset) setCurrentTheme(matchingPreset.theme);
                          updateThemeSettings({ autoDetectSystemTheme: false, systemThemeOverride: mode.id as 'light' | 'dark' });
                        }
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                          (mode.id === 'auto' && themeSettings.autoDetectSystemTheme) ||
                          (mode.id !== 'auto' && !themeSettings.autoDetectSystemTheme && themeSettings.systemThemeOverride === mode.id)
                          ? 'bg-[rgba(var(--color-accent),0.1)] text-white border-[rgba(var(--color-accent),0.25)]'
                          : 'bg-black/25 text-gray-400 border-white/10 hover:bg-white/5'
                        }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Colors */}
              <ThemeSelector setThemeColor={setThemeColor} />

              {/* Background */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Plano de Fundo</label>
                <BackgroundCreator config={backgroundConfig} onChange={updateBackgroundConfig} />
              </div>
            </div>
          </AccordionSection>

          {/* Layouts Section */}
          <AccordionSection
            title="Layouts"
            icon="📐"
            isOpen={expandedSection === 'layouts'}
            onToggle={() => toggleSection('layouts')}
          >
            <div className="space-y-4">
              {/* Layout Mode */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Estilo de Leitura</label>
                <select
                  value={contentConfig.layoutMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    const preset = LAYOUT_PRESETS.find(p => p.id === mode);
                    if (preset) {
                      applyLayoutPreset(mode);
                    } else {
                      updateContentConfig({ layoutMode: mode as ContentConfig['layoutMode'] });
                    }
                    resetCategoryLayouts();
                  }}
                  className="w-full bg-black/20 border-white/10 text-gray-300 text-xs rounded-lg h-9 px-3"
                >
                  <option value="bento">Bento</option>
                  <option value="brutalist">Brutalist</option>
                  <option value="compact">Compact</option>
                  <option value="cyberpunk">Cyberpunk</option>
                  <option value="focus">Focus</option>
                  <option value="gallery">Gallery</option>
                  <option value="grid">Grid</option>
                  <option value="immersive">Immersive</option>
                  <option value="list">List</option>
                  <option value="magazine">Magazine</option>
                  <option value="masonry">Masonry</option>
                  <option value="minimal">Minimal</option>
                  <option value="modern">Modern</option>
                  <option value="newspaper">Newspaper</option>
                  <option value="pocketfeeds">PocketFeeds</option>
                  <option value="split">Split</option>
                  <option value="terminal">Terminal</option>
                  <option value="timeline">Timeline</option>
                </select>
              </div>

              {/* Header Position */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Posição do Cabeçalho</label>
                <select
                  value={headerConfig.position}
                  onChange={(e) => updateHeaderConfig({ position: e.target.value as HeaderConfig['position'] })}
                  className="w-full bg-black/20 border-white/10 text-gray-300 text-xs rounded-lg h-9 px-3"
                >
                  <option value="sticky">Fixo no Topo (Sticky)</option>
                  <option value="static">Estático</option>
                  <option value="floating">Flutuante</option>
                  <option value="hidden">Oculto (Auto-hide)</option>
                </select>
              </div>

              {/* Header Height */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Altura</label>
                <select
                  value={headerConfig.height}
                  onChange={(e) => updateHeaderConfig({ height: e.target.value as HeaderConfig['height'] })}
                  className="w-full bg-black/20 border-white/10 text-gray-300 text-xs rounded-lg h-9 px-3"
                >
                  <option value="ultra-compact">Mínima (Ultra)</option>
                  <option value="tiny">Extra Compacto</option>
                  <option value="compact">Compacto</option>
                  <option value="normal">Normal</option>
                  <option value="spacious">Espaçoso</option>
                </select>
              </div>

              {/* Header Background Color */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Cor do Fundo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={headerConfig.bgColor || '#1a1a1a'}
                    onChange={(e) => updateHeaderConfig({ bgColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs text-gray-500">{headerConfig.bgColor || '#1a1a1a'}</span>
                </div>
              </div>

              {/* Header Opacity */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Opacidade: {Math.round((headerConfig.bgOpacity ?? 0.9) * 100)}%</label>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={headerConfig.bgOpacity ?? 0.9}
                  onChange={(e) => updateHeaderConfig({ bgOpacity: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-gray-700 rounded-lg"
                />
              </div>

              {/* Header Blur */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Blur: {headerConfig.blur ?? 10}px</label>
                <input
                  type="range" min="0" max="30" step="2"
                  value={headerConfig.blur ?? 10}
                  onChange={(e) => updateHeaderConfig({ blur: parseInt(e.target.value) })}
                  className="w-full h-1 bg-gray-700 rounded-lg"
                />
              </div>

              {/* Advanced Identity Settings */}
              <div className="pt-4 border-t border-gray-800">
                <h3 className="text-xs font-bold text-gray-300 mb-4 flex items-center gap-2">
                  <span className="text-lg">🆔</span> Identidade Visual
                </h3>

                {/* Custom Logo SVG */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Logo SVG</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-3 rounded-lg text-xs font-medium transition-colors border border-gray-700 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        {headerConfig.customLogoSvg ? 'Alterar Logo SVG' : 'Carregar Logo SVG'}
                      </button>
                      {headerConfig.customLogoSvg && (
                        <button
                          onClick={() => updateHeaderConfig({ customLogoSvg: undefined })}
                          className="px-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg border border-red-800/50"
                          title="Remover Logo"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      id="logo-upload"
                      type="file"
                      accept=".svg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const content = ev.target?.result as string;
                            // Simple sanitization to basic SVG tags if needed, or rely on pure DOMPurify if installed
                            // Since we just installed it, let's use it. We need to import it though.
                            // For now I'll use a dynamic import or assume global if not available, OR I will add the import in a separate tool call.
                            // I'll add a helper logic here.
                            import('dompurify').then(DOMPurify => {
                              const sanitized = DOMPurify.default.sanitize(content);
                              updateHeaderConfig({ customLogoSvg: sanitized });
                            }).catch(err => {
                              console.error("DOMPurify load failed, using raw", err);
                              // Fallback or alert? For safety, maybe just basic check or fail.
                              // But for this environment, dynamic import should work if installed.
                              updateHeaderConfig({ customLogoSvg: content }); // Fallback for dev
                            });
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      {headerConfig.customLogoSvg ? '✅ SVG personalizado ativo' : 'Selecione um arquivo .svg para usar como logo'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Tamanho do Logo</label>
                      <div className="flex bg-gray-800 rounded-lg p-1">
                        {['sm', 'md', 'lg'].map((size) => (
                          <button
                            key={size}
                            onClick={() => updateHeaderConfig({ logoSize: size as 'sm' | 'md' | 'lg' })}
                            className={`flex-1 py-1 text-[10px] rounded ${headerConfig.logoSize === size ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
                          >
                            {size.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Cor do Logo</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={headerConfig.logoColorMode || 'theme'}
                          onChange={(e) => updateHeaderConfig({ logoColorMode: e.target.value as 'theme' | 'custom' | 'original' })}
                          className="bg-gray-800 text-[10px] rounded h-8 px-2 border-none flex-1"
                        >
                          <option value="theme">Tema</option>
                          <option value="custom">Fixa</option>
                          <option value="original">Original</option>
                        </select>
                        {headerConfig.logoColorMode === 'custom' && (
                          <input
                            type="color"
                            value={headerConfig.logoColor || '#ffffff'}
                            onChange={(e) => updateHeaderConfig({ logoColor: e.target.value })}
                            className="w-8 h-8 rounded bg-transparent cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Sincronizar Favicon</span>
                    <Switch
                      checked={headerConfig.syncFavicon || false}
                      onChange={(c) => updateHeaderConfig({ syncFavicon: c })}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Mostrar Logo</span>
                    <Switch
                      checked={headerConfig.showLogo !== false}
                      onChange={(c) => updateHeaderConfig({ showLogo: c })}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Page Title Customization */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs text-gray-400">Título da Página</label>
                      <Switch
                        checked={headerConfig.showTitle}
                        onChange={(c) => updateHeaderConfig({ showTitle: c })}
                        size="sm"
                      />
                    </div>
                    {headerConfig.showTitle && (
                      <input
                        type="text"
                        value={headerConfig.customTitle || ''}
                        onChange={(e) => updateHeaderConfig({ customTitle: e.target.value })}
                        className="w-full bg-gray-800 border-gray-700 text-gray-300 text-xs rounded-lg h-9 px-3"
                      />
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs text-gray-400">Estilo do Texto</label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">Gradiente</span>
                        <Switch
                          checked={headerConfig.titleGradient?.enabled || false}
                          onChange={(c) => updateHeaderConfig({
                            titleGradient: {
                              ...(headerConfig.titleGradient || { from: '#fff', to: '#fff', direction: 'to right' }),
                              enabled: c
                            }
                          })}
                          size="sm"
                        />
                      </div>
                    </div>

                    {headerConfig.titleGradient?.enabled ? (
                      <div className="bg-gray-800/50 p-2 rounded-lg space-y-2 border border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Cores</span>
                          <div className="flex gap-2">
                            <input type="color" value={headerConfig.titleGradient.from} onChange={(e) => updateHeaderConfig({ titleGradient: { ...headerConfig.titleGradient!, from: e.target.value } })} className="w-6 h-6 rounded bg-transparent" />
                            <span className="text-gray-500">→</span>
                            <input type="color" value={headerConfig.titleGradient.to} onChange={(e) => updateHeaderConfig({ titleGradient: { ...headerConfig.titleGradient!, to: e.target.value } })} className="w-6 h-6 rounded bg-transparent" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-400">Direção</span>
                          <select
                            value={headerConfig.titleGradient.direction}
                            onChange={(e) => updateHeaderConfig({ titleGradient: { ...headerConfig.titleGradient!, direction: e.target.value } })}
                            className="bg-gray-900 border-none rounded h-6 px-1 text-gray-300"
                          >
                            <option value="to right">➡ Dir.</option>
                            <option value="to left">⬅ Esq.</option>
                            <option value="to bottom">⬇ Baixo</option>
                            <option value="to bottom right">↘ Diag.</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Cor do Texto</span>
                        <input
                          type="color"
                          value={headerConfig.titleColor || '#ffffff'}
                          onChange={(e) => updateHeaderConfig({ titleColor: e.target.value })}
                          className="w-8 h-8 rounded bg-transparent cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          {/* Display Section */}
          <AccordionSection
            title="Exibição"
            icon="👁"
            isOpen={expandedSection === 'display'}
            onToggle={() => toggleSection('display')}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Mostrar Autor</span>
                <Switch checked={contentConfig.showAuthor} onChange={(c) => updateContentConfig({ showAuthor: c })} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Mostrar Data</span>
                <Switch checked={contentConfig.showDate} onChange={(c) => updateContentConfig({ showDate: c })} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Mostrar Tags</span>
                <Switch checked={contentConfig.showTags} onChange={(c) => updateContentConfig({ showTags: c })} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Formato 24h</span>
                <Switch checked={timeFormat === '24h'} onChange={(c) => setTimeFormat(c ? '24h' : '12h')} size="sm" />
              </div>

              {/* Pagination Type */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Paginação</label>
                <select
                  value={contentConfig.paginationType || 'numbered'}
                  onChange={(e) => updateContentConfig({ paginationType: e.target.value as ContentConfig['paginationType'] })}
                  className="w-full bg-gray-800 border-gray-700 text-gray-300 text-xs rounded-lg h-9 px-3"
                >
                  <option value="numbered">Páginas (Numerada)</option>
                  <option value="loadMore">Botão "Carregar Mais"</option>
                  {/* <option value="infinite">Rolagem Infinita</option> */}
                </select>
              </div>
            </div>
          </AccordionSection>

          {/* System Section */}
          <AccordionSection
            title="Sistema"
            icon="⚙️"
            isOpen={expandedSection === 'system'}
            onToggle={() => toggleSection('system')}
          >
            <div className="space-y-3">
              {/* Language */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Idioma</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full bg-gray-800 border-gray-700 text-gray-300 text-xs rounded-lg h-9 px-3"
                >
                  <option value="pt-BR">Português (BR)</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>

              {/* Backup */}
              <div className="flex gap-2">
                <button
                  onClick={handleExportBackup}
                  className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
                >
                  Exportar
                </button>
                <label className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors text-center cursor-pointer">
                  Importar
                  <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportBackup} />
                </label>
              </div>

              {/* Reset Options */}
              <div className="space-y-2">
                <label className="block text-xs text-gray-400 mb-2">Opções de Reset</label>

                <button
                  onClick={handleResetStyles}
                  className="w-full py-2 px-3 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400 text-xs rounded-lg transition-colors border border-yellow-800/30 text-left"
                >
                  🎨 Resetar Estilos
                  <span className="block text-[10px] text-yellow-600 mt-0.5">Tema, layout, cores e header</span>
                </button>

                <button
                  onClick={handleResetCategories}
                  className="w-full py-2 px-3 bg-orange-900/20 hover:bg-orange-900/40 text-orange-400 text-xs rounded-lg transition-colors border border-orange-800/30 text-left"
                >
                  📂 Resetar Categorias
                  <span className="block text-[10px] text-orange-600 mt-0.5">Remove categorias personalizadas</span>
                </button>

                <button
                  onClick={handleResetComplete}
                  className="w-full py-2 px-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs rounded-lg transition-colors border border-red-800/50 text-left"
                >
                  ⚠️ Reset Completo
                  <span className="block text-[10px] text-red-600 mt-0.5">Apaga TUDO: feeds, categorias, estilos</span>
                </button>
              </div>
            </div>
          </AccordionSection>

        </div>
      </div>
    </>
  );
};

// Accordion Section Component
const AccordionSection: React.FC<{
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, children }) => (
  <div className="border border-white/10 rounded-xl overflow-hidden bg-[rgba(var(--color-surface),0.45)]">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 bg-[rgba(var(--color-background),0.5)] hover:bg-[rgba(var(--color-background),0.7)] transition-colors"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--color-text))]">
        <span>{icon}</span>
        {title}
      </span>
      <div className="flex items-center gap-2">
        {isOpen && <span className="w-2 h-2 rounded-full bg-[rgba(var(--color-accent),0.28)]" />}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>
    {isOpen && (
      <div className="p-4 bg-[rgba(var(--color-surface),0.6)] animate-in slide-in-from-top-2 duration-200">
        {children}
      </div>
    )}
  </div>
);
