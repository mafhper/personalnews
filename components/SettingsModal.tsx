import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ThemeSelector } from './ThemeSelector';
import { BackgroundCreator } from './BackgroundCreator';
import { useExtendedTheme } from '../hooks/useExtendedTheme';
import { useArticleLayout } from '../hooks/useArticleLayout';
import { useAppearance, LAYOUT_PRESETS } from '../hooks/useAppearance';
import { Tabs } from './ui/Tabs';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Switch } from './ui/Switch';
import { logger, LogMessage } from '../services/logger';

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
    const [activeTab, setActiveTab] = useState<'appearance' | 'display' | 'logs' | 'advanced'>('appearance');
    const { currentTheme, updateThemeSettings, themeSettings } = useExtendedTheme();
    const { settings: layoutSettings, updateSettings: updateLayoutSettings } = useArticleLayout();
    const { applyLayoutPreset, activeLayoutId, backgroundConfig, updateBackgroundConfig, resetAppearance, headerConfig, updateHeaderConfig } = useAppearance();
    const [logs, setLogs] = useState<LogMessage[]>([]);

    useEffect(() => {
        if (activeTab === 'logs') {
            setLogs(logger.getLogs());
            const unsubscribe = logger.subscribe(setLogs);
            return unsubscribe;
        }
    }, [activeTab]);

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
        { id: 'display', label: 'Exibição' },
        { id: 'logs', label: 'Logs' },
        { id: 'advanced', label: 'Avançado' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} initialFocus="h2" ariaLabelledBy="settings-modal-title">
            <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-white/10 pb-4 flex items-center">
                    <button 
                        onClick={onClose}
                        className="mr-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        aria-label="Voltar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h2 id="settings-modal-title" className="text-2xl font-bold text-white" tabIndex={-1}>
                        Configurações
                    </h2>
                </div>

                {/* Tabs */}
                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as any)} variant="glass" />

                {/* Tab Content */}
                <div className="min-h-[350px]">
                    {activeTab === 'appearance' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Header Customization */}
                            <Card variant="glass" className="p-4 space-y-4">
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Identidade</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Título da Página</label>
                                        <Input
                                            value={headerConfig.customTitle || ''}
                                            onChange={(e) => updateHeaderConfig({ customTitle: e.target.value })}
                                            placeholder="Personal News"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">URL do Logo/Favicon</label>
                                        <Input
                                            value={headerConfig.logoUrl || ''}
                                            onChange={(e) => updateHeaderConfig({ logoUrl: e.target.value })}
                                            placeholder="https://... or paste SVG code"
                                        />
                                        <div className="mt-2">
                                            <label className="block text-xs text-gray-500 mb-1">Or upload SVG file</label>
                                            <input
                                                type="file"
                                                accept=".svg"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const text = await file.text();
                                                        updateHeaderConfig({ logoUrl: text });
                                                    }
                                                }}
                                                className="block w-full text-xs text-gray-400
                                                  file:mr-4 file:py-2 file:px-4
                                                  file:rounded-full file:border-0
                                                  file:text-xs file:font-semibold
                                                  file:bg-[rgb(var(--color-accent))]/10 file:text-[rgb(var(--color-accent))]
                                                  hover:file:bg-[rgb(var(--color-accent))]/20
                                                "
                                            />
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Logo Size</label>
                                                <input
                                                    type="range"
                                                    min="20"
                                                    max="100"
                                                    value={headerConfig.logoSize === 'sm' ? 24 : headerConfig.logoSize === 'md' ? 32 : headerConfig.logoSize === 'lg' ? 64 : 32}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        let size: 'sm' | 'md' | 'lg' = 'md';
                                                        if (val < 30) size = 'sm';
                                                        else if (val > 50) size = 'lg';
                                                        updateHeaderConfig({ logoSize: size });
                                                    }}
                                                    className="w-full"
                                                />
                                                <div className="flex justify-between text-[10px] text-gray-500">
                                                    <span>Small</span>
                                                    <span>Medium</span>
                                                    <span>Large</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <label className="text-sm text-gray-300">Use Theme Color</label>
                                                <Switch
                                                    checked={headerConfig.useThemeColor || false}
                                                    onChange={(checked) => updateHeaderConfig({ useThemeColor: checked })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Header Options */}
                            <Card variant="glass" className="p-4 space-y-4">
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Estilo do Header</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Posição</label>
                                        <select
                                            value={headerConfig.position}
                                            onChange={(e) => updateHeaderConfig({ position: e.target.value as any })}
                                            className="w-full bg-gray-800 border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-[rgb(var(--color-accent))] focus:border-[rgb(var(--color-accent))]"
                                        >
                                            <option value="sticky">Fixo (Sticky)</option>
                                            <option value="static">Estático</option>
                                            <option value="floating">Flutuante</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Altura</label>
                                        <select
                                            value={headerConfig.height}
                                            onChange={(e) => updateHeaderConfig({ height: e.target.value as any })}
                                            className="w-full bg-gray-800 border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-[rgb(var(--color-accent))] focus:border-[rgb(var(--color-accent))]"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="compact">Compacto</option>
                                            <option value="spacious">Espaçoso</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {/* Header Appearance Controls */}
                                <div className="border-t border-gray-700/50 pt-4 mt-4">
                                    <h4 className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Aparência do Header</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Cor de Fundo</label>
                                            <input
                                                type="color"
                                                value={headerConfig.backgroundColor ?? '#0a0a0c'}
                                                onChange={(e) => updateHeaderConfig({ backgroundColor: e.target.value })}
                                                className="w-full h-8 rounded cursor-pointer bg-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Opacidade: {headerConfig.backgroundOpacity ?? 95}%</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={headerConfig.backgroundOpacity ?? 95}
                                                onChange={(e) => updateHeaderConfig({ backgroundOpacity: parseInt(e.target.value) })}
                                                className="w-full accent-[rgb(var(--color-accent))]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Efeito Blur</label>
                                            <select
                                                value={headerConfig.blurIntensity ?? 'medium'}
                                                onChange={(e) => updateHeaderConfig({ blurIntensity: e.target.value as any })}
                                                className="w-full bg-gray-800 border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-[rgb(var(--color-accent))] focus:border-[rgb(var(--color-accent))]"
                                            >
                                                <option value="none">Nenhum</option>
                                                <option value="light">Leve</option>
                                                <option value="medium">Médio</option>
                                                <option value="heavy">Intenso</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Opacidade Borda: {headerConfig.borderOpacity ?? 8}%</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="50"
                                                value={headerConfig.borderOpacity ?? 8}
                                                onChange={(e) => updateHeaderConfig({ borderOpacity: parseInt(e.target.value) })}
                                                className="w-full accent-[rgb(var(--color-accent))]"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Category Area Appearance */}
                                <div className="border-t border-gray-700/50 pt-4 mt-4">
                                    <h4 className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Área de Categorias</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Cor de Fundo</label>
                                            <input
                                                type="color"
                                                value={headerConfig.categoryBackgroundColor ?? '#ffffff'}
                                                onChange={(e) => updateHeaderConfig({ categoryBackgroundColor: e.target.value })}
                                                className="w-full h-8 rounded cursor-pointer bg-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2">Opacidade: {headerConfig.categoryBackgroundOpacity ?? 3}%</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="30"
                                                value={headerConfig.categoryBackgroundOpacity ?? 3}
                                                onChange={(e) => updateHeaderConfig({ categoryBackgroundOpacity: parseInt(e.target.value) })}
                                                className="w-full accent-[rgb(var(--color-accent))]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Layout Presets */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Layouts</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {LAYOUT_PRESETS.map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyLayoutPreset(preset.id)}
                                            className={`p-3 rounded-lg text-left transition-all ${
                                                activeLayoutId === preset.id
                                                    ? 'bg-[rgb(var(--color-accent))] text-white ring-2 ring-white/30'
                                                    : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300'
                                            }`}
                                        >
                                            <span className="font-medium block text-sm">{preset.name}</span>
                                            <span className="text-xs opacity-70">{preset.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Colors */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Cores Rápidas</h3>
                                <ThemeSelector setThemeColor={setThemeColor} />
                            </div>

                            {/* Background */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Fundo</h3>
                                <BackgroundCreator config={backgroundConfig} onChange={updateBackgroundConfig} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'display' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Top Stories Count */}
                            <Card variant="glass" className="p-4">
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Top Stories</h3>
                                <div className="grid grid-cols-5 gap-2">
                                    {[0, 5, 10, 15, 20].map((count) => (
                                        <button
                                            key={count}
                                            onClick={() => updateLayoutSettings({ topStoriesCount: count as any })}
                                            className={`p-2 rounded-lg text-center transition-all ${
                                                layoutSettings.topStoriesCount === count
                                                    ? 'bg-[rgb(var(--color-accent))] text-white'
                                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                            }`}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>
                            </Card>

                            {/* Time Format */}
                            <Card variant="glass" className="p-4">
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Formato de Hora</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {['12h', '24h'].map((format) => (
                                        <button
                                            key={format}
                                            onClick={() => setTimeFormat(format as any)}
                                            className={`p-3 rounded-lg text-center transition-all ${
                                                timeFormat === format
                                                    ? 'bg-[rgb(var(--color-accent))] text-white'
                                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                            }`}
                                        >
                                            {format === '12h' ? '12h (AM/PM)' : '24h'}
                                        </button>
                                    ))}
                                </div>
                            </Card>

                            {/* Show Publication Time */}
                            <Card variant="glass" className="p-4">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-gray-300">Mostrar horário de publicação</span>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={layoutSettings.showPublicationTime}
                                            onChange={(e) => updateLayoutSettings({ showPublicationTime: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-accent))]"></div>
                                    </div>
                                </label>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Console Logs</h3>
                                <button onClick={() => logger.clearLogs()} className="text-xs text-red-400 hover:text-red-300">Limpar</button>
                            </div>
                            <div className="bg-black/50 rounded-lg p-4 h-[400px] overflow-y-auto font-mono text-xs space-y-2 border border-white/10">
                                {logs.length === 0 && <p className="text-gray-500 italic text-center mt-10">Nenhum log registrado.</p>}
                                {logs.map((log) => (
                                    <div key={log.id} className={`border-b border-white/5 pb-1 last:border-0 ${
                                        log.type === 'error' ? 'text-red-400' : 
                                        log.type === 'warn' ? 'text-yellow-400' : 
                                        'text-gray-300'
                                    }`}>
                                        <span className="opacity-50 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                        <span className="uppercase font-bold mr-2 text-[10px]">{log.type}</span>
                                        <span>{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'advanced' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Theme Auto-detect */}
                            <Card variant="glass" className="p-4">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-gray-300">Detectar tema do sistema</span>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={themeSettings.autoDetectSystemTheme}
                                            onChange={(e) => updateThemeSettings({ autoDetectSystemTheme: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-accent))]"></div>
                                    </div>
                                </label>
                            </Card>

                            {/* Theme Transitions */}
                            <Card variant="glass" className="p-4">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-gray-300">Transições suaves de tema</span>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={themeSettings.themeTransitions}
                                            onChange={(e) => updateThemeSettings({ themeTransitions: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-accent))]"></div>
                                    </div>
                                </label>
                            </Card>

                            {/* Reset */}
                            <Card variant="outline" className="p-4 border-red-500/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm text-gray-300 block">Resetar Aparência</span>
                                        <span className="text-xs text-gray-500">Restaura todas as configurações visuais</span>
                                    </div>
                                    <button
                                        onClick={resetAppearance}
                                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                                    >
                                        Resetar
                                    </button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-2 rounded-lg transition-all"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};
