import React, { useState } from 'react';
import { Modal } from './Modal';
import { ThemeSelector } from './ThemeSelector';
import { BackgroundCreator } from './BackgroundCreator';
import { useExtendedTheme } from '../hooks/useExtendedTheme';
import { useArticleLayout } from '../hooks/useArticleLayout';
import { useAppearance } from '../hooks/useAppearance';
import { useFeedCategories } from '../hooks/useFeedCategories';
import { Tabs } from './ui/Tabs';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Switch } from './ui/Switch';
import { logger, LogMessage } from '../services/logger';
import { createBackup, downloadBackup, restoreBackup } from '../services/backupService';
import { useNotificationReplacements } from '../hooks/useNotificationReplacements';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    timeFormat: '12h' | '24h';
    setTimeFormat: (format: '12h' | '24h') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    timeFormat,
    setTimeFormat
}) => {
    const [activeTab, setActiveTab] = useState<'appearance' | 'layouts' | 'display' | 'system'>('appearance');
    const { currentTheme, updateThemeSettings, themeSettings, setCurrentTheme, defaultPresets } = useExtendedTheme();
    const { settings: layoutSettings, updateSettings: updateLayoutSettings } = useArticleLayout();
    const { backgroundConfig, updateBackgroundConfig, resetAppearance, headerConfig, updateHeaderConfig, contentConfig, updateContentConfig } = useAppearance();
    const { alertSuccess, alertError, confirmDanger } = useNotificationReplacements();
    const { language, setLanguage, t } = useLanguage();
    const { resetCategoryLayouts } = useFeedCategories();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleExportBackup = () => {
        try {
            const backup = createBackup();
            downloadBackup(backup);
            alertSuccess('Backup exportado com sucesso!');
        } catch (error) {
            alertError('Falha ao exportar backup.');
            logger.error('Export Backup Error', error as Error);
        }
    };

    const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (await confirmDanger('Isso substituirá todas as suas configurações atuais, feeds e favoritos. Deseja continuar?')) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const content = event.target?.result as string;
                    const backup = JSON.parse(content);
                    
                    if (restoreBackup(backup)) {
                        await alertSuccess('Backup restaurado com sucesso! A página será recarregada.');
                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        await alertError('Arquivo de backup inválido ou corrompido.');
                    }
                } catch (error) {
                    await alertError('Erro ao processar arquivo de backup.');
                    logger.error('Import Backup Error', error as Error);
                }
            };
            reader.readAsText(file);
        }
        
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Log subscription removed since 'logs' tab is no longer in the type

    const setThemeColor = (color: string) => {
        const newTheme = {
            ...currentTheme,
            id: `quick-color-${Date.now()}`,
            name: `${currentTheme.name} (Custom)`,
            colors: { ...currentTheme.colors, accent: color }
        };
        updateThemeSettings({ currentTheme: newTheme });
        document.documentElement.style.setProperty('--color-accent', `rgb(${color})`);
    };

    const tabs = [
        { id: 'appearance', label: 'Aparência' },
        { id: 'layouts', label: 'Layouts' },
        { id: 'display', label: 'Exibição' },
        { id: 'system', label: 'Sistema' },
        // { id: 'logs', label: t('settings.tab.logs') },
    ];

    const allLayouts = [
      { category: 'Clássico', modes: [
        { value: 'magazine', label: 'Magazine' },
        { value: 'newspaper', label: 'Newspaper' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'compact', label: 'Compact' },
      ]},
      { category: 'Visual', modes: [
        { value: 'gallery', label: 'Gallery' },
        { value: 'polaroid', label: 'Polaroid' },
        { value: 'masonry', label: 'Masonry' },
        { value: 'immersive', label: 'Immersive' },
      ]},
      { category: 'Moderno', modes: [
        { value: 'bento', label: 'Bento Grid' },
        { value: 'timeline', label: 'Timeline' },
        { value: 'split', label: 'Split View' },
        { value: 'focus', label: 'Focus' },
      ]},
      { category: 'Experimental', modes: [
        { value: 'cyberpunk', label: 'Cyberpunk' },
        { value: 'terminal', label: 'Terminal' },
        { value: 'brutalist', label: 'Brutalist' },
      ]}
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} initialFocus="h2" ariaLabelledBy="settings-modal-title">
            <div className="space-y-6 max-h-[80vh] overflow-y-auto px-1 custom-scrollbar">
                {/* Header */}
                <div className="border-b border-white/10 pb-4 flex items-center justify-between sticky top-0 bg-[#0a0a0c] z-10 pt-2">
                    <h2 id="settings-modal-title" className="text-2xl font-bold text-white flex items-center gap-3" tabIndex={-1}>
                        <svg className="w-6 h-6 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('settings.title')}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        aria-label={t('action.back')}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as any)} variant="glass" />

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {activeTab === 'appearance' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            
                            {/* Premium Theme Selector (Auto/Light/Dark) */}
                            <section>
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Tema Principal</h3>
                                <div className="grid grid-cols-3 gap-4">
                                  {[
                                    { id: 'auto', label: 'Automatico', desc: 'Sincronizado com o sistema', active: themeSettings.autoDetectSystemTheme },
                                    { id: 'dark', label: 'Escuro', desc: 'Confortavel para a noite', active: !themeSettings.autoDetectSystemTheme && themeSettings.systemThemeOverride === 'dark' },
                                    { id: 'light', label: 'Claro', desc: 'Ideal para ambientes claros', active: !themeSettings.autoDetectSystemTheme && themeSettings.systemThemeOverride === 'light' },
                                  ].map((mode) => (
                                    <button
                                      key={mode.id}
                                      onClick={() => {
                                        if (mode.id === 'auto') {
                                          updateThemeSettings({ autoDetectSystemTheme: true, systemThemeOverride: null });
                                        } else {
                                          // Find a matching theme preset for the selected mode
                                          const matchingPreset = defaultPresets.find(p => p.category === mode.id);
                                          if (matchingPreset) {
                                            setCurrentTheme(matchingPreset.theme);
                                          }
                                          updateThemeSettings({ autoDetectSystemTheme: false, systemThemeOverride: mode.id as 'light' | 'dark' });
                                        }
                                      }}
                                      className={`relative group p-4 rounded-xl border transition-all duration-300 flex flex-col items-center text-center gap-2
                                        ${mode.active 
                                          ? 'bg-[rgb(var(--color-accent))]/10 border-[rgb(var(--color-accent))] shadow-[0_0_20px_rgba(var(--color-accent),0.2)]' 
                                          : 'bg-gray-800/30 border-white/5 hover:bg-gray-800/60 hover:border-white/20'
                                        }
                                      `}
                                    >
                                      <span className={`font-bold text-sm ${mode.active ? 'text-[rgb(var(--color-accent))]' : 'text-gray-200'}`}>{mode.label}</span>
                                      <span className="text-[10px] text-gray-400 leading-tight mt-1">{mode.desc}</span>
                                      
                                      {mode.active && (
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[rgb(var(--color-accent))]" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                            </section>

                            {/* Background Creator with Live Preview */}
                            <section>
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Plano de Fundo</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  <BackgroundCreator config={backgroundConfig} onChange={updateBackgroundConfig} />
                                  
                                  {/* Live Preview Box */}
                                  <div className="space-y-2">
                                    <h4 className="text-[10px] text-gray-400 uppercase tracking-wider">Preview</h4>
                                    <div 
                                      className="h-full min-h-[200px] rounded-xl border border-white/10 relative overflow-hidden shadow-2xl transition-all duration-500"
                                      style={{
                                        backgroundImage: backgroundConfig.type !== 'solid' ? backgroundConfig.value : undefined,
                                        backgroundColor: backgroundConfig.type === 'solid' ? backgroundConfig.value : `rgb(${currentTheme.colors.background})`,
                                        backgroundSize: backgroundConfig.type === 'pattern' ? 'auto' : 'cover',
                                        backgroundRepeat: backgroundConfig.type === 'pattern' ? 'repeat' : 'no-repeat',
                                        backgroundPosition: 'center',
                                      }}
                                    >
                                      {/* Content Overlay Simulation */}
                                      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                                      
                                      <div className="relative z-10 p-6 space-y-4">
                                        {/* Mock Header */}
                                        <div className="h-4 w-1/3 bg-white/20 rounded-full mb-6" />
                                        
                                        {/* Mock Cards */}
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="bg-[rgb(var(--color-surface))] rounded-lg p-3 shadow-lg border border-[rgb(var(--color-border))]">
                                            <div className="h-20 bg-[rgb(var(--color-background))] rounded mb-2 opacity-50" />
                                            <div className="h-3 w-3/4 bg-[rgb(var(--color-text))]/20 rounded mb-1" />
                                            <div className="h-2 w-1/2 bg-[rgb(var(--color-text))]/10 rounded" />
                                          </div>
                                           <div className="bg-[rgb(var(--color-surface))] rounded-lg p-3 shadow-lg border border-[rgb(var(--color-border))]">
                                            <div className="h-20 bg-[rgb(var(--color-background))] rounded mb-2 opacity-50" />
                                            <div className="h-3 w-3/4 bg-[rgb(var(--color-text))]/20 rounded mb-1" />
                                            <div className="h-2 w-1/2 bg-[rgb(var(--color-text))]/10 rounded" />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Cores do Sistema</h3>
                                <ThemeSelector setThemeColor={setThemeColor} />
                            </section>

                        </div>
                    )}

                    {activeTab === 'layouts' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                             {/* Header Config */}
                             <Card variant="glass" className="p-4 space-y-4">
                                <h3 className="text-xs font-medium text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                  Cabeçalho (Header)
                                </h3>
                                
                                {/* Row 1: Basic Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">{t('settings.header.title')}</label>
                                        <Input
                                            value={headerConfig.customTitle || ''}
                                            onChange={(e) => updateHeaderConfig({ customTitle: e.target.value })}
                                            placeholder="Personal News"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">{t('settings.header.logo')}</label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={headerConfig.logoUrl || ''}
                                                onChange={(e) => updateHeaderConfig({ logoUrl: e.target.value })}
                                                placeholder="https://..."
                                                className="h-8 text-sm"
                                            />
                                            <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-xs flex items-center justify-center min-w-[80px]">
                                                Upload
                                                <input type="file" accept=".svg" className="hidden" onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) updateHeaderConfig({ logoUrl: await file.text() });
                                                }} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Position & Style */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">Posição</label>
                                        <select
                                            value={headerConfig.position}
                                            onChange={(e) => updateHeaderConfig({ position: e.target.value as any })}
                                            className="w-full bg-gray-800 border-gray-700 text-gray-300 text-xs rounded-lg h-8 px-2 focus:ring-1 focus:ring-[rgb(var(--color-accent))]"
                                        >
                                            <option value="sticky">Sticky</option>
                                            <option value="static">Static</option>
                                            <option value="floating">Floating</option>
                                            <option value="hidden">Oculto (Auto-hide)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">Estilo</label>
                                        <select
                                            value={headerConfig.style}
                                            onChange={(e) => updateHeaderConfig({ style: e.target.value as any })}
                                            className="w-full bg-gray-800 border-gray-700 text-gray-300 text-xs rounded-lg h-8 px-2 focus:ring-1 focus:ring-[rgb(var(--color-accent))]"
                                        >
                                            <option value="default">Padrão</option>
                                            <option value="centered">Centralizado</option>
                                            <option value="minimal">Minimalista</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">Altura</label>
                                        <select
                                            value={headerConfig.height}
                                            onChange={(e) => updateHeaderConfig({ height: e.target.value as any })}
                                            className="w-full bg-gray-800 border-gray-700 text-gray-300 text-xs rounded-lg h-8 px-2 focus:ring-1 focus:ring-[rgb(var(--color-accent))]"
                                        >
                                            <option value="ultra-compact">Mínima (Ultra)</option>
                                            <option value="tiny">Extra Compacto</option>
                                            <option value="compact">Compacto</option>
                                            <option value="normal">Normal</option>
                                            <option value="spacious">Espaçoso</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">Blur</label>
                                        <select
                                            value={headerConfig.blurIntensity || 'medium'}
                                            onChange={(e) => updateHeaderConfig({ blurIntensity: e.target.value as any })}
                                            className="w-full bg-gray-800 border-gray-700 text-gray-300 text-xs rounded-lg h-8 px-2 focus:ring-1 focus:ring-[rgb(var(--color-accent))]"
                                        >
                                            <option value="none">Nenhum</option>
                                            <option value="light">Leve</option>
                                            <option value="medium">Médio</option>
                                            <option value="heavy">Intenso</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Row 3: Color Controls */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">Cor de Fundo</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="color" 
                                                value={headerConfig.backgroundColor || '#0a0a0c'}
                                                onChange={(e) => updateHeaderConfig({ backgroundColor: e.target.value })}
                                                className="w-8 h-8 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                                            />
                                            <Input
                                                value={headerConfig.backgroundColor || '#0a0a0c'}
                                                onChange={(e) => updateHeaderConfig({ backgroundColor: e.target.value })}
                                                className="h-8 text-xs font-mono flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">Opacidade: {headerConfig.backgroundOpacity ?? 95}%</label>
                                        <input 
                                            type="range" 
                                            min="0" max="100" 
                                            value={headerConfig.backgroundOpacity ?? 95}
                                            onChange={(e) => updateHeaderConfig({ backgroundOpacity: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[rgb(var(--color-accent))]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">Cor da Borda</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="color" 
                                                value={headerConfig.borderColor || '#ffffff'}
                                                onChange={(e) => updateHeaderConfig({ borderColor: e.target.value })}
                                                className="w-8 h-8 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                                            />
                                            <Input
                                                value={headerConfig.borderColor || '#ffffff'}
                                                onChange={(e) => updateHeaderConfig({ borderColor: e.target.value })}
                                                className="h-8 text-xs font-mono flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">Borda Opac: {headerConfig.borderOpacity ?? 8}%</label>
                                        <input 
                                            type="range" 
                                            min="0" max="100" 
                                            value={headerConfig.borderOpacity ?? 8}
                                            onChange={(e) => updateHeaderConfig({ borderOpacity: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[rgb(var(--color-accent))]"
                                        />
                                    </div>
                                </div>

                                {/* Row 4: Toggle Options */}
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700 min-w-[140px]">
                                        <span className="text-[10px] text-gray-400">Usar Cor do Tema</span>
                                        <Switch checked={headerConfig.useThemeColor || false} onChange={(c) => updateHeaderConfig({ useThemeColor: c })} size="sm" />
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700 min-w-[140px]">
                                        <span className="text-[10px] text-gray-400">Mostrar Título</span>
                                        <Switch checked={headerConfig.showTitle !== false} onChange={(c) => updateHeaderConfig({ showTitle: c })} size="sm" />
                                    </div>
                                </div>
                             </Card>

                             {/* Layout Selection Grid */}
                             <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                  <span>📰</span> Estilo de Leitura
                                </h3>
                                
                                {allLayouts.map((group) => (
                                  <div key={group.category}>
                                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 ml-1">{group.category}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      {group.modes.map((mode) => (
                                        <button
                                          key={mode.value}
                                          onClick={() => {
                                            updateContentConfig({ layoutMode: mode.value as any });
                                            resetCategoryLayouts(); // Reset category-specific layouts
                                          }}
                                          className={`relative p-3 rounded-lg text-left transition-all duration-200 border ${
                                            contentConfig.layoutMode === mode.value
                                              ? 'bg-[rgb(var(--color-accent))]/20 border-[rgb(var(--color-accent))] ring-1 ring-[rgb(var(--color-accent))]'
                                              : 'bg-gray-800/40 border-white/5 hover:bg-gray-800 hover:border-white/10'
                                          }`}
                                        >
                                            <span className={`text-sm font-medium block ${
                                              contentConfig.layoutMode === mode.value ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'
                                            }`}>
                                              {mode.label}
                                            </span>
                                            {contentConfig.layoutMode === mode.value && (
                                              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-accent))]" />
                                            )}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {activeTab === 'display' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <Card variant="glass" className="p-4 space-y-6">
                                {/* Top Stories */}
                                <div>
                                    <h3 className="text-xs font-medium text-gray-300 uppercase tracking-wider mb-2">{t('settings.display.top_stories')}</h3>
                                    <div className="flex gap-2">
                                        {[0, 5, 10, 15, 20].map((count) => (
                                            <button
                                                key={count}
                                                onClick={() => updateLayoutSettings({ topStoriesCount: count as any })}
                                                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                                                    layoutSettings.topStoriesCount === count
                                                        ? 'bg-[rgb(var(--color-accent))] text-white shadow-lg shadow-[rgb(var(--color-accent))]/20'
                                                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                                }`}
                                            >
                                                {count === 0 ? 'Off' : count}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Auto Refresh */}
                                <div>
                                    <h3 className="text-xs font-medium text-gray-300 uppercase tracking-wider mb-2">{t('settings.display.auto_refresh')}</h3>
                                    <div className="flex gap-2">
                                        {[
                                            { label: 'Off', value: 0 },
                                            { label: '15m', value: 15 },
                                            { label: '30m', value: 30 },
                                            { label: '1h', value: 60 },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => updateLayoutSettings({ autoRefreshInterval: option.value })}
                                                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                                                    layoutSettings.autoRefreshInterval === option.value
                                                        ? 'bg-[rgb(var(--color-accent))] text-white shadow-lg shadow-[rgb(var(--color-accent))]/20'
                                                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Time Format */}
                                    <div>
                                        <h3 className="text-xs font-medium text-gray-300 uppercase tracking-wider mb-2">{t('settings.display.time_format')}</h3>
                                        <div className="flex bg-gray-800 rounded-lg p-1">
                                            {['12h', '24h'].map((format) => (
                                                <button
                                                    key={format}
                                                    onClick={() => setTimeFormat(format as any)}
                                                    className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                                                        timeFormat === format
                                                            ? 'bg-[rgb(var(--color-accent))] text-white shadow-sm'
                                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                    }`}
                                                >
                                                    {format}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Language */}
                                    <div>
                                       <h3 className="text-xs font-medium text-gray-300 uppercase tracking-wider mb-2">{t('settings.language')}</h3>
                                       <select 
                                            value={language} 
                                            onChange={(e) => setLanguage(e.target.value as Language)}
                                            className="w-full bg-gray-800 border-gray-700 text-gray-300 text-xs rounded-lg h-8 px-2 focus:ring-[rgb(var(--color-accent))] focus:border-[rgb(var(--color-accent))]"
                                        >
                                            <option value="pt-BR">Português (BR)</option>
                                            <option value="en-US">English (US)</option>
                                            <option value="es">Español</option>
                                            <option value="fr">Français</option>
                                            <option value="it">Italiano</option>
                                            <option value="zh">中文</option>
                                            <option value="ja">日本語</option>
                                        </select>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                             {/* Backup & Restore */}
                             <Card variant="glass" className="p-4">
                                <h3 className="text-xs font-medium text-gray-300 uppercase tracking-wider mb-3">{t('settings.backup')}</h3>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleExportBackup}
                                        className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all text-xs flex items-center justify-center gap-2 group border border-white/5 hover:border-white/20"
                                    >
                                        <span className="text-lg group-hover:-translate-y-0.5 transition-transform">📤</span>
                                        <div className="text-left">
                                          <span className="block font-bold">Exportar</span>
                                          <span className="text-[10px] text-gray-400">Salvar configurações</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1 px-4 py-3 bg-[rgb(var(--color-accent))]/10 hover:bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))] rounded-xl transition-all text-xs flex items-center justify-center gap-2 border border-[rgb(var(--color-accent))]/30 group"
                                    >
                                         <span className="text-lg group-hover:-translate-y-0.5 transition-transform">📥</span>
                                        <div className="text-left">
                                          <span className="block font-bold">Importar</span>
                                          <span className="text-[10px] opacity-70">Restaurar backup</span>
                                        </div>
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".json"
                                        onChange={handleImportBackup}
                                    />
                                </div>
                            </Card>

                            {/* System Toggles */}
                            <Card variant="glass" className="p-4 space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <div className="pr-4">
                                        <span className="text-sm text-gray-200 block font-medium">{t('settings.system.transitions')}</span>
                                        <span className="text-[10px] text-gray-500">Animações suaves ao trocar de tema</span>
                                    </div>
                                    <Switch
                                        checked={themeSettings.themeTransitions}
                                        onChange={(e) => updateThemeSettings({ themeTransitions: e })}
                                        size="sm"
                                    />
                                </div>
                            </Card>

                            {/* Reset */}
                            <div className="pt-4">
                                <button
                                    onClick={async () => {
                                        if (await confirmDanger('Isso restaurará todas as configurações de aparência para os padrões. Continuar?')) {
                                            resetAppearance();
                                            alertSuccess('Configurações restauradas.');
                                        }
                                    }}
                                    className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors text-xs font-bold border border-red-500/20 flex items-center justify-center gap-2"
                                >
                                    <span>⚠️</span>
                                    {t('settings.reset.factory')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};