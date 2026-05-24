import React, { useState } from 'react';
import pkg from '../package.json';
const version = pkg.version;

import {
  BookOpenCheck,
  Database,
  Palette,
  Rss,
  Star,
  Tags,
  type LucideIcon,
} from 'lucide-react';
import { BackgroundCreator } from './BackgroundCreator';
import { useExtendedTheme } from '../hooks/useExtendedTheme';
import { useAppearance, LAYOUT_PRESETS } from '../hooks/useAppearance';
import { useFeedCategories } from '../hooks/useFeedCategories';
import { useArticleLayout } from '../hooks/useArticleLayout';
import type { PrimaryView } from '../hooks/usePrimaryView';
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
import {
  applySelectedResetScopes,
  RESET_SCOPE_DEFINITIONS,
  type ResetScopeId,
} from '../utils/destructiveScopes';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  timeFormat: '12h' | '24h';
  setTimeFormat: (format: '12h' | '24h') => void;
  primaryView: PrimaryView;
  onPrimaryViewChange: (primaryView: PrimaryView) => void;
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
  setTimeFormat,
  primaryView,
  onPrimaryViewChange,
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
  const { alertSuccess, alertError, confirmDanger, confirmDangerScopes } = useNotificationReplacements();
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

  const reloadAfterLocalDataChange = () => {
    setTimeout(() => window.location.reload(), 1200);
  };

  const clearResetScopes = (scopeIds: ResetScopeId[]) => {
    applySelectedResetScopes(scopeIds);
  };

  // Restaura apenas configurações visuais/aparência
  const handleResetStyles = async () => {
    const confirmed = await confirmDanger({
      title: 'Restaurar aparência',
      message: 'Isso vai restaurar tema, layout, cores, header e plano de fundo. Feeds, favoritos e histórico de leitura serão mantidos.',
      impact: 'Layouts específicos de categorias também voltam ao padrão.',
      confirmText: 'Restaurar aparência',
      cancelText: 'Manter aparência',
    });
    if (confirmed) {
      resetAppearance();
      resetCategoryLayouts();
      alertSuccess('Aparência restaurada.');
    }
  };

  // Restaura categorias para padrão
  const handleResetCategories = async () => {
    const confirmed = await confirmDanger({
      title: 'Restaurar categorias',
      message: 'Isso vai remover categorias personalizadas e restaurar a organização padrão.',
      impact: 'Feeds vinculados a categorias removidas serão realocados pela organização padrão.',
      confirmText: 'Restaurar categorias',
      cancelText: 'Manter categorias',
    });
    if (confirmed) {
      clearResetScopes(['categories']);
      alertSuccess('Categorias restauradas. A página será recarregada.');
      reloadAfterLocalDataChange();
    }
  };

  const handleClearFeeds = async () => {
    const confirmed = await confirmDanger({
      title: 'Limpar feeds cadastrados',
      message: 'Isso vai remover todos os feeds cadastrados localmente.',
      impact: 'A coleção ficará vazia até que você adicione ou restaure feeds.',
      confirmText: 'Limpar feeds',
      cancelText: 'Manter feeds',
    });
    if (confirmed) {
      clearResetScopes(['feeds']);
      alertSuccess('Feeds cadastrados removidos. A página será recarregada.');
      reloadAfterLocalDataChange();
    }
  };

  const handleClearReadHistory = async () => {
    const confirmed = await confirmDanger({
      title: 'Limpar histórico de leitura',
      message: 'Isso vai remover os registros locais de artigos lidos.',
      impact: 'Artigos já lidos voltarão a aparecer como não lidos.',
      confirmText: 'Limpar histórico',
      cancelText: 'Manter histórico',
    });
    if (confirmed) {
      clearResetScopes(['read-history']);
      alertSuccess('Histórico de leitura limpo. A página será recarregada.');
      reloadAfterLocalDataChange();
    }
  };

  const handleClearFavorites = async () => {
    const confirmed = await confirmDanger({
      title: 'Limpar favoritos',
      message: 'Isso vai remover todos os favoritos salvos localmente.',
      impact: 'A lista Favoritos ficará vazia.',
      confirmText: 'Limpar favoritos',
      cancelText: 'Manter favoritos',
    });
    if (confirmed) {
      clearResetScopes(['favorites']);
      alertSuccess('Favoritos removidos. A página será recarregada.');
      reloadAfterLocalDataChange();
    }
  };

  // Redefinição local com escopos editáveis
  const handleResetComplete = async () => {
    const result = await confirmDangerScopes({
      title: 'Redefinir dados locais',
      message: 'Escolha quais dados locais serão removidos. Itens desmarcados serão preservados.',
      impact: 'Esta ação não pode ser desfeita pelo aplicativo.',
      scopesTitle: 'Dados que serão removidos',
      scopes: RESET_SCOPE_DEFINITIONS.map((scope) => ({
        id: scope.id,
        label: scope.label,
        description: scope.description,
        checkedByDefault: true,
      })),
      scopesSummary: 'Revise a lista antes de confirmar.',
      confirmText: 'Redefinir selecionados',
      cancelText: 'Cancelar',
    });

    if (result.confirmed && result.selectedScopeIds?.length) {
      clearResetScopes(result.selectedScopeIds as ResetScopeId[]);
      alertSuccess('Dados locais redefinidos. A página será recarregada.');
      reloadAfterLocalDataChange();
    }
  };

  const resetActions: Array<{
    id: string;
    label: string;
    description: string;
    icon: LucideIcon;
    tone: 'accent' | 'warning' | 'danger';
    onClick: () => void;
  }> = [
    {
      id: 'appearance',
      label: 'Restaurar aparência',
      description: 'Tema, layout, cores, header e plano de fundo voltam ao padrão.',
      icon: Palette,
      tone: 'accent',
      onClick: handleResetStyles,
    },
    {
      id: 'categories',
      label: 'Restaurar categorias',
      description: 'Remove categorias personalizadas e restaura a organização padrão.',
      icon: Tags,
      tone: 'warning',
      onClick: handleResetCategories,
    },
    {
      id: 'feeds',
      label: 'Limpar feeds cadastrados',
      description: 'Remove a coleção local de feeds sem mexer em favoritos ou histórico.',
      icon: Rss,
      tone: 'danger',
      onClick: handleClearFeeds,
    },
    {
      id: 'read-history',
      label: 'Limpar histórico de leitura',
      description: 'Artigos lidos voltam a aparecer como não lidos.',
      icon: BookOpenCheck,
      tone: 'warning',
      onClick: handleClearReadHistory,
    },
    {
      id: 'favorites',
      label: 'Limpar favoritos',
      description: 'Remove todos os favoritos salvos neste navegador.',
      icon: Star,
      tone: 'danger',
      onClick: handleClearFavorites,
    },
    {
      id: 'local-data',
      label: 'Redefinir dados locais',
      description: 'Escolha feeds, categorias, estilo, histórico e favoritos antes de confirmar.',
      icon: Database,
      tone: 'danger',
      onClick: handleResetComplete,
    },
  ];

  const getResetActionToneClass = (tone: 'accent' | 'warning' | 'danger') => {
    switch (tone) {
      case 'danger':
        return 'text-[rgb(var(--color-error))] bg-[rgb(var(--color-error))]/10';
      case 'warning':
        return 'text-[rgb(var(--color-warning))] bg-[rgb(var(--color-warning))]/10';
      case 'accent':
      default:
        return 'text-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10';
    }
  };

  const getResetActionHoverClass = (tone: 'accent' | 'warning' | 'danger') => {
    switch (tone) {
      case 'danger':
        return 'hover:bg-[rgb(var(--color-error))]/10';
      case 'warning':
        return 'hover:bg-[rgb(var(--color-warning))]/10';
      case 'accent':
      default:
        return 'hover:bg-[rgb(var(--color-accent))]/10';
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
  const resetActionButtonClass =
    "group flex w-full items-start gap-3 rounded-xl bg-[rgb(var(--theme-surface-elevated,var(--color-surface)))]/70 px-3 py-3 text-left shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.07)] transition-colors";

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 animate-in fade-in bg-black/70 backdrop-blur-sm duration-200"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="app-system-font feed-header-drawer fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col animate-in slide-in-from-right duration-300">

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

              <div>
                <label className={fieldLabelClass}>Filtros de Favoritos</label>
                <select
                  value={headerConfig.favoriteToolbarVariant || 'inline'}
                  onChange={(e) =>
                    updateHeaderConfig({
                      favoriteToolbarVariant: e.target.value as NonNullable<HeaderConfig['favoriteToolbarVariant']>,
                    })
                  }
                  className={surfaceInputClass}
                >
                  <option value="inline">Faixa inline</option>
                  <option value="drawer">Gaveta no header</option>
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
              <div>
                <label className={fieldLabelClass}>View inicial</label>
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'favorites', label: 'Favoritos' },
                  ].map((view) => (
                    <button
                      key={view.id}
                      type="button"
                      onClick={() => onPrimaryViewChange(view.id as PrimaryView)}
                      className={`flex-1 border ${segmentedButtonClass} ${
                        primaryView === view.id
                          ? 'bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))] border-[rgb(var(--color-accentSurface))] shadow-sm'
                          : mutedButtonClass
                      }`}
                    >
                      {view.label}
                    </button>
                  ))}
                </div>
              </div>

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
                  <option value="en-US">English</option>
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

              {/* Restoration and cleanup */}
              <div className="space-y-3">
                <label className={fieldLabelClass}>Restauração e limpeza</label>

                <div className="space-y-2 rounded-[1.05rem] bg-[rgb(var(--color-surfaceElevated))]/42 p-2 shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.06)]">
                  {resetActions.map((action) => {
                    const Icon = action.icon;

                    return (
                      <button
                        key={action.id}
                        onClick={action.onClick}
                        className={`${resetActionButtonClass} ${getResetActionHoverClass(action.tone)}`}
                        type="button"
                      >
                        <span
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${getResetActionToneClass(action.tone)}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-[rgb(var(--theme-text-on-surface,var(--color-text)))]">
                            {action.label}
                          </span>
                          <span className="mt-1 block text-[11px] leading-relaxed text-[rgb(var(--theme-text-secondary-on-surface,var(--color-textSecondary)))]">
                            {action.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
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
