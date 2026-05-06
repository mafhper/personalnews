import React, { useState } from 'react';
import pkg from '../package.json';
const version = pkg.version;

import { BackgroundCreator } from './BackgroundCreator';
import { useExtendedTheme } from '../hooks/useExtendedTheme';
import { useAppearance, LAYOUT_PRESETS } from '../hooks/useAppearance';
import { useFeedCategories } from '../hooks/useFeedCategories';
import { useArticleLayout } from '../hooks/useArticleLayout';
import { Switch } from './ui/Switch';
import { createBackup, downloadBackup, restoreBackup } from '../services/backupService';
import { useNotificationReplacements } from '../hooks/useNotificationReplacements';
import { useLanguage } from '../hooks/useLanguage';
import {
  createThemeSeedPair,
  findSeedThemeForMode,
  getSeedThemeSelection,
  hexToRgb,
  seedColorOptions,
} from '../services/themeUtils';
import type { SeedThemePair, ThemeSeedMode } from '../services/themeUtils';
import type { HeaderConfig, ContentConfig, Language } from '../types';
import { FEED_LAYOUT_GROUPS } from '../config/feedLayoutCatalog';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  timeFormat: '12h' | '24h';
  setTimeFormat: (format: '12h' | '24h') => void;
}

const rgbStringToHex = (rgb: string): string => {
  const values = rgb
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10));

  if (values.length !== 3 || values.some((value) => Number.isNaN(value))) {
    return '#2563eb';
  }

  return `#${values
    .map((value) => Math.min(255, Math.max(0, value)).toString(16).padStart(2, '0'))
    .join('')}`;
};

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  isOpen,
  onClose,
  timeFormat,
  setTimeFormat
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedSeedId, setSelectedSeedId] = useState(seedColorOptions[0].id);
  const [customSeedHex, setCustomSeedHex] = useState('#2563eb');
  const {
    currentTheme,
    customThemes,
    systemPreference,
    updateThemeSettings,
    themeSettings,
    setCurrentTheme,
    defaultPresets,
    allThemes,
  } = useExtendedTheme();
  const { applyLayoutPreset, backgroundConfig, updateBackgroundConfig, resetAppearance, headerConfig, updateHeaderConfig, contentConfig, updateContentConfig } = useAppearance();
  const { settings: articleLayoutSettings, updateSettings: updateArticleLayoutSettings } = useArticleLayout();
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
      'ATENCAO: Isso vai apagar TODOS os dados:\n\n' +
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
        'personalnews-feed-onboarding-dismissed',
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      alertSuccess('Reset completo realizado! A página será recarregada.');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const selectedSeedOption = seedColorOptions.find(
    (option) => option.id === selectedSeedId,
  );
  const selectedSeedRgb = selectedSeedOption
    ? selectedSeedOption.seed
    : hexToRgb(customSeedHex);
  const selectedSeedHex = selectedSeedOption
    ? rgbStringToHex(selectedSeedOption.seed)
    : customSeedHex;
  const selectedSeedName = selectedSeedOption?.label ?? 'Personalizada';
  const selectedSeedIdBase = selectedSeedOption?.id ?? `custom-seed-${customSeedHex.replace('#', '').toLowerCase()}`;
  const seedThemePair = createThemeSeedPair(
    selectedSeedRgb,
    selectedSeedName,
    selectedSeedIdBase,
  );
  const activeSeedMode =
    themeSettings.autoDetectSystemTheme && !themeSettings.systemThemeOverride
      ? systemPreference
      : themeSettings.systemThemeOverride ??
        (currentTheme.id.includes('light') ? 'light' : 'dark');
  const seedValidationSummary = seedThemePair.isValid
    ? 'Aplicado automaticamente'
    : seedThemePair.issues[0] ?? 'A cor precisa de ajuste';
  const activeSeedSelection = getSeedThemeSelection(currentTheme);
  const activeSeedStatus = activeSeedSelection
    ? `Cor-semente ativa: ${activeSeedSelection.label} (${activeSeedSelection.mode === 'light' ? 'Claro' : 'Escuro'})`
    : 'Tema padrão ativo';

  const resolveThemeForMode = (mode: 'light' | 'dark') => {
    return (
      findSeedThemeForMode(currentTheme, mode, allThemes) ??
      defaultPresets.find((preset) => preset.category === mode)?.theme
    );
  };

  const applySeedTheme = (
    pair: SeedThemePair,
    mode: ThemeSeedMode,
    options: { announce?: boolean } = {},
  ) => {
    if (!pair.isValid) {
      alertError(pair.issues[0] ?? 'A cor precisa de ajuste');
      return;
    }

    const nextCustomThemes = [
      ...customThemes.filter(
        (theme) =>
          theme.id !== pair.light.id &&
          theme.id !== pair.dark.id,
      ),
      pair.light,
      pair.dark,
    ];
    const nextTheme = pair[mode];

    setCurrentTheme(nextTheme);
    updateThemeSettings({
      currentTheme: nextTheme,
      customThemes: nextCustomThemes,
      autoDetectSystemTheme: false,
      systemThemeOverride: mode,
    });

    if (options.announce) {
      alertSuccess('Cor-semente aplicada.');
    }
  };

  const handleSeedOptionSelect = (option: (typeof seedColorOptions)[number]) => {
    setSelectedSeedId(option.id);
    setCustomSeedHex(rgbStringToHex(option.seed));
    const pair = createThemeSeedPair(option.seed, option.label, option.id);
    applySeedTheme(pair, activeSeedMode);
  };

  const handleCustomSeedChange = (hex: string) => {
    setSelectedSeedId('custom');
    setCustomSeedHex(hex);
    const pair = createThemeSeedPair(
      hexToRgb(hex),
      'Personalizada',
      `custom-seed-${hex.replace('#', '').toLowerCase()}`,
    );
    applySeedTheme(pair, activeSeedMode);
  };

  const fieldLabelClass =
    "block text-xs mb-2 text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]";
  const segmentedButtonClass =
    "flex h-9 items-center justify-center rounded-lg px-3 text-xs font-medium transition-all";
  const actionButtonClass =
    "inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-medium transition-colors";
  const surfaceInputClass =
    "w-full h-9 rounded-xl border-0 bg-[rgb(var(--color-surfaceElevated))]/70 px-3 text-xs text-[rgb(var(--color-text))] shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.08)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))]/25";
  const mutedButtonClass =
    "border-0 bg-[rgb(var(--color-surfaceElevated))]/60 text-[rgb(var(--color-textSecondary))] shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.06)] hover:bg-[rgb(var(--color-accent))]/10 hover:text-[rgb(var(--color-text))]";
  const surfaceButtonClass =
    "border-0 bg-[rgb(var(--color-surfaceElevated))]/70 text-[rgb(var(--color-text))] shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.08)] hover:bg-[rgb(var(--color-accent))]/10";
  const resetCardBaseClass =
    "w-full rounded-2xl border px-4 py-3 text-left transition-all shadow-[0_12px_32px_rgba(15,23,42,0.1)] hover:translate-y-[-1px]";

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 animate-in fade-in bg-black/70 backdrop-blur-sm duration-200"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="feed-header-drawer fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="feed-header-drawer__top flex items-center justify-between p-4">
          <h2 className="feed-header-drawer-brand text-lg font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configurações
          </h2>
          <button
            onClick={onClose}
            className="feed-header-control"
            aria-label="Fechar configurações"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">

          {/* Appearance Section */}
          <AccordionSection
            title="Aparência"
            isOpen={expandedSection === 'appearance'}
            onToggle={() => toggleSection('appearance')}
          >
            <div className="space-y-4">
              {/* Theme Mode */}
              <div>
                <label className={fieldLabelClass}>Tema Principal</label>
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
                          const matchingTheme = resolveThemeForMode(mode.id as 'light' | 'dark');
                          if (matchingTheme) setCurrentTheme(matchingTheme);
                          updateThemeSettings({ autoDetectSystemTheme: false, systemThemeOverride: mode.id as 'light' | 'dark' });
                        }
                      }}
                      className={`flex-1 border ${segmentedButtonClass} ${
                          (mode.id === 'auto' && themeSettings.autoDetectSystemTheme) ||
                          (mode.id !== 'auto' && !themeSettings.autoDetectSystemTheme && themeSettings.systemThemeOverride === mode.id)
                          ? 'bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))] border-[rgb(var(--color-accentSurface))] shadow-sm'
                          : mutedButtonClass
                        }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                  {themeSettings.autoDetectSystemTheme
                    ? 'Auto usa o tema completo do sistema.'
                    : activeSeedStatus}
                </p>
              </div>

              <div className="space-y-3 rounded-[1.05rem] bg-[rgb(var(--color-surfaceElevated))]/52 p-3 shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.07)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <label className={fieldLabelClass}>Cor-semente</label>
                    <p className="text-[11px] leading-relaxed text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                      Um toque aplica a marca visual e gera o par claro/escuro.
                    </p>
                  </div>
                  <span
                    className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-black ${
                      seedThemePair.isValid
                        ? 'bg-[rgba(var(--color-success),0.14)] text-[rgb(var(--color-success))]'
                        : 'bg-[rgba(var(--color-warning),0.14)] text-[rgb(var(--color-warning))]'
                    }`}
                  >
                    {seedThemePair.isValid ? 'AA validado' : 'Ajustar'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {seedColorOptions.map((option) => {
                    const isSelected = selectedSeedId === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-label={`Aplicar cor-semente ${option.label}`}
                        title={option.label}
                        onClick={() => handleSeedOptionSelect(option)}
                        className={`group flex h-10 w-10 items-center gap-2 overflow-hidden rounded-xl px-2.5 text-xs font-bold transition-all duration-200 hover:w-[6.85rem] focus-visible:w-[6.85rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-accent))]/35 ${
                          isSelected
                            ? 'bg-[rgb(var(--color-accent))]/12 text-[rgb(var(--color-text))] shadow-[inset_0_0_0_1px_rgb(var(--color-accent)/0.45)]'
                            : 'bg-[rgb(var(--color-surface))]/28 text-[rgb(var(--color-textSecondary))] shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.06)] hover:bg-[rgb(var(--color-accent))]/10 hover:text-[rgb(var(--color-text))]'
                        }`}
                      >
                        <span
                          className="h-5 w-5 flex-shrink-0 rounded-full shadow-sm"
                          style={{ backgroundColor: `rgb(${option.seed})` }}
                        />
                        <span
                          className="min-w-0 max-w-0 truncate whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-[4.25rem] group-hover:opacity-100 group-focus-visible:max-w-[4.25rem] group-focus-visible:opacity-100"
                        >
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-[rgb(var(--color-surface))]/20 p-2 shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.06)]">
                  <label className="relative flex h-9 w-12 cursor-pointer overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.09)]">
                    <span
                      className="absolute inset-0"
                      style={{ backgroundColor: selectedSeedHex }}
                    />
                    <input
                      aria-label="Cor-semente personalizada"
                      type="color"
                      value={selectedSeedHex}
                      onChange={(event) => handleCustomSeedChange(event.target.value)}
                      className="h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[rgb(var(--theme-text-on-surface,var(--color-text)))]">
                      {selectedSeedName}
                    </p>
                    <p className="truncate text-[10px] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                      {seedValidationSummary}
                    </p>
                  </div>
                </div>

              </div>

              {/* Background */}
              <div>
                <label className={fieldLabelClass}>Plano de Fundo</label>
                <BackgroundCreator config={backgroundConfig} onChange={updateBackgroundConfig} />
              </div>
            </div>
          </AccordionSection>

          {/* Layouts Section */}
          <AccordionSection
            title="Layouts"
            isOpen={expandedSection === 'layouts'}
            onToggle={() => toggleSection('layouts')}
          >
            <div className="space-y-4">
              {/* Layout Mode */}
              <div>
                <label className={fieldLabelClass}>Estilo de Leitura</label>
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
                  className={surfaceInputClass}
                >
                  {FEED_LAYOUT_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((layout) => (
                        <option key={layout.id} value={layout.id}>
                          {layout.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Header Position */}
              <div>
                <label className={fieldLabelClass}>Posição do Cabeçalho</label>
                <select
                  value={headerConfig.position}
                  onChange={(e) => updateHeaderConfig({ position: e.target.value as HeaderConfig['position'] })}
                  className={surfaceInputClass}
                >
                  <option value="sticky">Fixo no Topo (Sticky)</option>
                  <option value="static">Estático</option>
                  <option value="floating">Flutuante</option>
                  <option value="hidden">Oculto (Auto-hide)</option>
                </select>
              </div>

              {/* Header Height */}
              <div>
                <label className={fieldLabelClass}>Altura</label>
                <select
                  value={headerConfig.height}
                  onChange={(e) => updateHeaderConfig({ height: e.target.value as HeaderConfig['height'] })}
                  className={surfaceInputClass}
                >
                  <option value="ultra-compact">Mínima (Ultra)</option>
                  <option value="tiny">Extra Compacto</option>
                  <option value="compact">Compacto</option>
                  <option value="normal">Normal</option>
                  <option value="spacious">Espaçoso</option>
                </select>
              </div>

              {/* Header Opacity */}
              <div>
                <label className={fieldLabelClass}>Opacidade: {Math.round((headerConfig.bgOpacity ?? 0.9) * 100)}%</label>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={headerConfig.bgOpacity ?? 0.9}
                  onChange={(e) => updateHeaderConfig({ bgOpacity: parseFloat(e.target.value) })}
                  className="w-full h-1 rounded-lg bg-[rgb(var(--color-border))]/45"
                />
              </div>

              {/* Header Blur */}
              <div>
                <label className={fieldLabelClass}>Blur: {headerConfig.blur ?? 10}px</label>
                <input
                  type="range" min="0" max="30" step="2"
                  value={headerConfig.blur ?? 10}
                  onChange={(e) => updateHeaderConfig({ blur: parseInt(e.target.value) })}
                  className="w-full h-1 rounded-lg bg-[rgb(var(--color-border))]/45"
                />
              </div>

              {/* Identity Settings */}
              <div className="border-t border-[rgb(var(--color-border))]/24 pt-4">
                <h3 className="mb-4 text-xs font-bold text-[rgb(var(--theme-text-on-surface,var(--color-text)))]">
                  Identidade Visual
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className={fieldLabelClass}>Tamanho do Logo</label>
                    <div className="flex rounded-lg border border-[rgb(var(--color-border))]/28 bg-[rgb(var(--theme-surface-elevated,var(--color-surface)))]/82 p-1">
                      {['sm', 'md', 'lg'].map((size) => (
                        <button
                          key={size}
                          onClick={() => updateHeaderConfig({ logoSize: size as 'sm' | 'md' | 'lg' })}
                          className={`flex h-9 flex-1 items-center justify-center rounded-lg px-3 text-[10px] font-medium transition-all ${headerConfig.logoSize === size ? 'bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))] shadow-sm' : 'text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]'}`}
                        >
                          {size.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">Mostrar Logo</span>
                    <Switch
                      checked={headerConfig.showLogo !== false}
                      onChange={(c) => updateHeaderConfig({ showLogo: c })}
                      size="sm"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-xs text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">Título</label>
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
                        className={surfaceInputClass}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          {/* Display Section */}
          <AccordionSection
            title="Exibição"
            isOpen={expandedSection === 'display'}
            onToggle={() => toggleSection('display')}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                    <span className="text-xs text-[rgb(var(--theme-text-on-surface,var(--color-text)))]">Mostrar Autor</span>
                <Switch checked={contentConfig.showAuthor} onChange={(c) => updateContentConfig({ showAuthor: c })} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                    <span className="text-xs text-[rgb(var(--theme-text-on-surface,var(--color-text)))]">Mostrar Data</span>
                <Switch checked={contentConfig.showDate} onChange={(c) => updateContentConfig({ showDate: c })} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                    <span className="text-xs text-[rgb(var(--theme-text-on-surface,var(--color-text)))]">Mostrar Tags</span>
                <Switch checked={contentConfig.showTags} onChange={(c) => updateContentConfig({ showTags: c })} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                    <span className="text-xs text-[rgb(var(--theme-text-on-surface,var(--color-text)))]">Formato 24h</span>
                <Switch checked={timeFormat === '24h'} onChange={(c) => setTimeFormat(c ? '24h' : '12h')} size="sm" />
              </div>

              {/* Pagination Type */}
              <div>
                  <label className={fieldLabelClass}>Paginação</label>
                <select
                  value={contentConfig.paginationType || 'numbered'}
                  onChange={(e) => updateContentConfig({ paginationType: e.target.value as ContentConfig['paginationType'] })}
                    className={surfaceInputClass}
                >
                  <option value="numbered">Páginas (Numerada)</option>
                  <option value="loadMore">Botão "Carregar Mais"</option>
                  {/* <option value="infinite">Rolagem Infinita</option> */}
                </select>
              </div>

              <div>
                  <label className={fieldLabelClass}>Cache temporário de feeds</label>
                <select
                  value={articleLayoutSettings.feedCacheTtlMinutes}
                  onChange={(e) =>
                    updateArticleLayoutSettings({
                      feedCacheTtlMinutes: Number(e.target.value) as 0 | 5 | 10,
                    })
                  }
                    className={surfaceInputClass}
                >
                  <option value={10}>10 min</option>
                  <option value={5}>5 min</option>
                  <option value={0}>Desativado</option>
                </select>
                <p className="mt-2 text-[11px] leading-relaxed text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                  Evita recarregar feeds ao alternar categorias enquanto o cache do destino ainda estiver recente.
                </p>
              </div>
            </div>
          </AccordionSection>

          {/* System Section */}
          <AccordionSection
            title="Sistema"
            isOpen={expandedSection === 'system'}
            onToggle={() => toggleSection('system')}
          >
            <div className="space-y-3">
              {/* Version Label Debug */}
              <div className="flex items-center justify-between px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md mb-2">
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">DEBUG: v{version}</span>
                <span className="text-[9px] text-blue-400/60 uppercase tracking-widest">{pkg.name}</span>
              </div>


              {/* Language */}
              <div>
                <label className={fieldLabelClass}>Idioma</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className={surfaceInputClass}
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
                  className={`flex-1 ${actionButtonClass} ${surfaceButtonClass}`}
                >
                  Exportar
                </button>
                <label className={`flex-1 cursor-pointer ${actionButtonClass} ${surfaceButtonClass}`}>
                  Importar
                  <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportBackup} />
                </label>
              </div>

              {/* Reset Options */}
              <div className="space-y-3">
                <label className={fieldLabelClass}>Opções de Reset</label>

                <button
                  onClick={handleResetStyles}
                  className={`${resetCardBaseClass} border-[rgba(var(--color-warning),0.24)] bg-[linear-gradient(180deg,rgba(var(--color-warning),0.16),rgba(var(--theme-surface-elevated,var(--color-surface)),0.94))] hover:bg-[linear-gradient(180deg,rgba(var(--color-warning),0.22),rgba(var(--theme-surface-elevated,var(--color-surface)),0.98))]`}
                >
                  <span className="block text-sm font-semibold text-[rgb(var(--theme-text-on-surface,var(--color-text)))]">Resetar Estilos</span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-[rgb(var(--theme-text-secondary-on-surface,var(--color-textSecondary)))]">Restaura tema, layout, cores e header sem mexer em feeds ou categorias.</span>
                </button>

                <button
                  onClick={handleResetCategories}
                  className={`${resetCardBaseClass} border-[rgba(249,115,22,0.24)] bg-[linear-gradient(180deg,rgba(249,115,22,0.14),rgba(var(--theme-surface-elevated,var(--color-surface)),0.94))] hover:bg-[linear-gradient(180deg,rgba(249,115,22,0.2),rgba(var(--theme-surface-elevated,var(--color-surface)),0.98))]`}
                >
                  <span className="block text-sm font-semibold text-[rgb(var(--theme-text-on-surface,var(--color-text)))]">Resetar Categorias</span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-[rgb(var(--theme-text-secondary-on-surface,var(--color-textSecondary)))]">Remove categorias personalizadas e restaura a organização padrão.</span>
                </button>

                <button
                  onClick={handleResetComplete}
                  className={`${resetCardBaseClass} border-[rgba(var(--color-error),0.24)] bg-[linear-gradient(180deg,rgba(var(--color-error),0.15),rgba(var(--theme-surface-elevated,var(--color-surface)),0.94))] hover:bg-[linear-gradient(180deg,rgba(var(--color-error),0.2),rgba(var(--theme-surface-elevated,var(--color-surface)),0.98))]`}
                >
                  <span className="block text-sm font-semibold text-[rgb(var(--theme-text-on-surface,var(--color-text)))]">Reset Completo</span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-[rgb(var(--theme-text-secondary-on-surface,var(--color-textSecondary)))]">Apaga feeds, categorias, estilos, favoritos e histórico local. Use apenas quando quiser recomeçar do zero.</span>
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
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, isOpen, onToggle, children }) => (
  <div className="overflow-hidden rounded-[1.05rem] bg-[rgb(var(--color-surfaceElevated))]/58 shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.07),0_12px_26px_rgba(0,0,0,0.12)]">
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between p-3 transition-colors hover:bg-[rgb(var(--color-accent))]/10"
    >
      <span className="flex items-center gap-2 text-sm font-extrabold text-[rgb(var(--color-text))]">
        {title}
      </span>
      <div className="flex items-center gap-2">
        {isOpen && <span className="w-2 h-2 rounded-full bg-[rgba(var(--color-accent),0.28)]" />}
        <svg
          className={`h-4 w-4 text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>
    {isOpen && (
      <div className="animate-in slide-in-from-top-2 bg-[rgb(var(--color-surface))]/18 p-4 duration-200">
        {children}
      </div>
    )}
  </div>
);
