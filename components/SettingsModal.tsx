
import React, { useState } from 'react';
import { Modal } from './Modal';
import { ThemeSelector } from './ThemeSelector';
import { BackgroundSelector } from './BackgroundSelector';
import { ThemeCustomizer } from './ThemeCustomizer';
import { useExtendedTheme } from '../hooks/useExtendedTheme';
import { useArticleLayout } from '../hooks/useArticleLayout';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    setBackgroundImage: (imageDataUrl: string | null) => void;
    timeFormat: '12h' | '24h';
    setTimeFormat: (format: '12h' | '24h') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    setBackgroundImage,
    timeFormat,
    setTimeFormat
}) => {
    const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
    const { currentTheme, updateThemeSettings, themeSettings } = useExtendedTheme();
    const { settings: layoutSettings, updateSettings: updateLayoutSettings } = useArticleLayout();

    // Enhanced theme color setter that integrates with the extended theme system
    const setThemeColor = (color: string) => {
        // Create a new theme based on current theme with updated accent color
        const newTheme = {
            ...currentTheme,
            id: `quick-color-${Date.now()}`,
            name: `${currentTheme.name} (Cor Personalizada)`,
            colors: {
                ...currentTheme.colors,
                accent: color,
            }
        };

        // Apply the new theme through the extended theme system
        updateThemeSettings({ currentTheme: newTheme });

        // Also set the CSS variable for immediate visual feedback
        document.documentElement.style.setProperty('--color-accent', `rgb(${color})`);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} initialFocus="h2" ariaLabelledBy="settings-modal-title">
                <div className="space-y-8">
                    {/* Header */}
                    <div className="border-b border-white/10 pb-6">
                        <h2 id="settings-modal-title" className="text-3xl font-bold text-white tracking-tight" tabIndex={-1}>
                            Configurações
                        </h2>
                        <p className="text-base text-gray-400 mt-2">
                            Personalize sua experiência no dashboard
                        </p>
                    </div>

                    {/* Seção Theme */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-200 flex items-center">
                            <span className="p-2 rounded-lg bg-[rgb(var(--color-accent))]/10 mr-3">
                                <svg className="w-5 h-5 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                </svg>
                            </span>
                            Tema e Aparência
                        </h3>

                        <div className="bg-gray-800/40 backdrop-blur-md border border-white/5 rounded-xl p-6 space-y-6 hover:border-white/10 transition-colors duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Tema atual</p>
                                    <p className="text-lg font-medium text-white flex items-center">
                                        <span className="w-3 h-3 rounded-full bg-[rgb(var(--color-accent))] mr-2 shadow-[0_0_10px_rgb(var(--color-accent))]"></span>
                                        {currentTheme.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsThemeCustomizerOpen(true)}
                                    className="w-full sm:w-auto bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/90 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-lg shadow-[rgb(var(--color-accent))]/20 hover:shadow-[rgb(var(--color-accent))]/40 hover:-translate-y-0.5"
                                >
                                    Configurações Avançadas
                                </button>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <h4 className="text-sm font-medium mb-4 text-gray-300 uppercase tracking-wider">Cores Rápidas</h4>
                                <ThemeSelector setThemeColor={setThemeColor} />
                            </div>

                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <label className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={themeSettings.autoDetectSystemTheme}
                                            onChange={(e) => updateThemeSettings({ autoDetectSystemTheme: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-accent))]"></div>
                                    </div>
                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Detectar tema do sistema automaticamente</span>
                                </label>

                                <label className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={themeSettings.themeTransitions}
                                            onChange={(e) => updateThemeSettings({ themeTransitions: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-accent))]"></div>
                                    </div>
                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Ativar transições suaves de tema</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Seção Background */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-200 flex items-center">
                            <span className="p-2 rounded-lg bg-[rgb(var(--color-accent))]/10 mr-3">
                                <svg className="w-5 h-5 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </span>
                            Imagem de Fundo
                        </h3>
                        <div className="bg-gray-800/40 backdrop-blur-md border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors duration-300">
                            <BackgroundSelector setBackgroundImage={setBackgroundImage} />
                        </div>
                    </div>

                    {/* Seção Layout */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-200 flex items-center">
                            <span className="p-2 rounded-lg bg-[rgb(var(--color-accent))]/10 mr-3">
                                <svg className="w-5 h-5 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </span>
                            Layout dos Artigos
                        </h3>

                        <div className="bg-gray-800/40 backdrop-blur-md border border-white/5 rounded-xl p-6 space-y-6 hover:border-white/10 transition-colors duration-300">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3 uppercase tracking-wider">
                                    Quantidade de Top Stories
                                </label>
                                <p className="text-xs text-gray-400 mb-4">
                                    Escolha quantos artigos mostrar na seção Top Stories.
                                </p>
                                <fieldset>
                                    <legend className="sr-only">Escolha o número de top stories</legend>
                                    <div className="grid grid-cols-5 gap-3">
                                        {[0, 5, 10, 15, 20].map((count) => (
                                            <label key={count} className={`flex flex-col items-center p-3 border rounded-xl transition-all cursor-pointer ${layoutSettings.topStoriesCount === count ? 'border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10 shadow-[0_0_15px_rgba(var(--color-accent),0.2)]' : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}`}>
                                                <input
                                                    type="radio"
                                                    className="sr-only"
                                                    name="topStoriesCount"
                                                    value={count}
                                                    checked={layoutSettings.topStoriesCount === count}
                                                    onChange={() => updateLayoutSettings({ topStoriesCount: count as 0 | 5 | 10 | 15 | 20 })}
                                                />
                                                <span className={`text-lg font-bold ${layoutSettings.topStoriesCount === count ? 'text-[rgb(var(--color-accent))]' : 'text-gray-400'}`}>{count}</span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                                <div className="mt-4 p-4 bg-black/20 rounded-lg border border-white/5">
                                    <p className="text-xs text-gray-400 flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Total de artigos por página: <strong className="text-white">{layoutSettings.articlesPerPage}</strong> (1 destaque + 5 recentes + {layoutSettings.topStoriesCount} top stories)</span>
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <label className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={layoutSettings.showPublicationTime}
                                            onChange={(e) => updateLayoutSettings({ showPublicationTime: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-accent))]"></div>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors block">Mostrar horário de publicação com a data</span>
                                        <span className="text-xs text-gray-500">Exibe data e hora nos cards de notícia</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Seção Time Format */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-200 flex items-center">
                            <span className="p-2 rounded-lg bg-[rgb(var(--color-accent))]/10 mr-3">
                                <svg className="w-5 h-5 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            Formato de Hora
                        </h3>

                        <div className="bg-gray-800/40 backdrop-blur-md border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors duration-300">
                            <fieldset>
                                <legend className="sr-only">Escolha o formato de hora</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className={`flex items-center p-4 border rounded-xl transition-all cursor-pointer group ${timeFormat === '12h' ? 'border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10' : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}`}>
                                        <input
                                            type="radio"
                                            className="sr-only"
                                            name="timeFormat"
                                            value="12h"
                                            checked={timeFormat === '12h'}
                                            onChange={() => setTimeFormat('12h')}
                                        />
                                        <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${timeFormat === '12h' ? 'border-[rgb(var(--color-accent))]' : 'border-gray-500'}`}>
                                            {timeFormat === '12h' && <div className="w-2.5 h-2.5 rounded-full bg-[rgb(var(--color-accent))]"></div>}
                                        </div>
                                        <div>
                                            <span className={`block font-medium ${timeFormat === '12h' ? 'text-white' : 'text-gray-300'}`}>12h (AM/PM)</span>
                                            <p className="text-xs text-gray-500">Formato americano</p>
                                        </div>
                                    </label>
                                    <label className={`flex items-center p-4 border rounded-xl transition-all cursor-pointer group ${timeFormat === '24h' ? 'border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10' : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}`}>
                                        <input
                                            type="radio"
                                            className="sr-only"
                                            name="timeFormat"
                                            value="24h"
                                            checked={timeFormat === '24h'}
                                            onChange={() => setTimeFormat('24h')}
                                        />
                                        <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${timeFormat === '24h' ? 'border-[rgb(var(--color-accent))]' : 'border-gray-500'}`}>
                                            {timeFormat === '24h' && <div className="w-2.5 h-2.5 rounded-full bg-[rgb(var(--color-accent))]"></div>}
                                        </div>
                                        <div>
                                            <span className={`block font-medium ${timeFormat === '24h' ? 'text-white' : 'text-gray-300'}`}>24h</span>
                                            <p className="text-xs text-gray-500">Formato militar</p>
                                        </div>
                                    </label>
                                </div>
                            </fieldset>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end pt-6 border-t border-white/10">
                        <button
                            onClick={onClose}
                            className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-8 py-3 rounded-lg transition-all duration-200 border border-gray-700 hover:border-gray-600 shadow-lg hover:shadow-xl"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </Modal>

            <ThemeCustomizer
                isOpen={isThemeCustomizerOpen}
                onClose={() => setIsThemeCustomizerOpen(false)}
            />
        </>
    );
};
