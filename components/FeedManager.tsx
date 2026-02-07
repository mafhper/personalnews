/**
 * FeedManager.tsx
 *
 * Componente principal para gerenciamento de feeds RSS.
 * Atua como container e controlador de estado, delegando a renderização
 * para componentes especializados por aba.
 *
 * @author Matheus Pereira
 * @version 3.0.0 (Modular Refactor)
 */

import React, { useState, useRef, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import type { FeedSource, Article } from "../types";
import { parseOpml } from "../services/rssParser";
import { FeedCategoryManager } from "./FeedCategoryManager";
import { FeedDiscoveryModal } from "./FeedDiscoveryModal";
import { FeedCleanupModal } from "./FeedCleanupModal";
import { useLogger } from "../services/logger";
import { feedValidator, type FeedValidationResult } from "../services/feedValidator";
import { type DiscoveredFeed } from "../services/feedDiscoveryService";
import { OPMLExportService } from "../services/opmlExportService";
import { feedDuplicateDetector, type DuplicateDetectionResult } from "../services/feedDuplicateDetector";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
import { useFeedCategories } from "../hooks/useFeedCategories";
import { useAppearance } from "../hooks/useAppearance";
import { resetToDefaultFeeds, addFeedsToCollection } from "../utils/feedMigration";
import { DEFAULT_FEEDS } from "../constants/curatedFeeds";
import { DEFAULT_CURATED_LISTS } from "../config/defaultConfig";
import { FeedAnalytics } from "./FeedAnalytics";
import { useLanguage } from "../hooks/useLanguage";
import { FeedDuplicateModal } from "./FeedDuplicateModal";
import type { ProxySettingsProps } from "./ProxySettings";

// New Modular Tabs
import { FeedListTab } from "./FeedManager/FeedListTab";
import { FeedToolsTab } from "./FeedManager/FeedToolsTab";
type ProxySettingsModule = {
  default?: React.ComponentType<ProxySettingsProps>;
  ProxySettings?: React.ComponentType<ProxySettingsProps>;
};

const ProxySettingsFallback: React.FC<ProxySettingsProps> = () => null;

const ProxySettings = React.lazy<React.ComponentType<ProxySettingsProps>>(() =>
  import("./ProxySettings").then((mod: ProxySettingsModule) => ({
    default: mod.default ?? mod.ProxySettings ?? ProxySettingsFallback,
  }))
);

interface FeedManagerProps {
  currentFeeds: FeedSource[];
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  closeModal: () => void;
  articles?: Article[];
  onRefreshFeeds?: () => void;
}

type TabType = 'functions' | 'feeds' | 'categories' | 'statistics';

export const FeedManager: React.FC<FeedManagerProps> = ({
  currentFeeds,
  setFeeds,
  closeModal,
  articles = [],
  onRefreshFeeds,
}) => {
  const logger = useLogger("FeedManager");
  const { categories, createCategory, resetToDefaults } = useFeedCategories();
  const { refreshAppearance } = useAppearance();
  const { t } = useLanguage();

  // State
  const [activeTab, setActiveTab] = useState<TabType>("functions");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedCategory, setNewFeedCategory] = useState<string>("");
  const [processingUrl, setProcessingUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation State
  const [feedValidations, setFeedValidations] = useState<Map<string, FeedValidationResult>>(new Map());
  const [isValidating, setIsValidating] = useState(false);

  // Notification Hooks
  const { confirm, alertSuccess, alertError, confirmDanger } = useNotificationReplacements();

  // Discovery State
  const [discoveryProgress, setDiscoveryProgress] = useState<Map<string, { status: string; progress: number }>>(new Map());
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [currentDiscoveryResult, setCurrentDiscoveryResult] = useState<{ originalUrl: string; discoveredFeeds: DiscoveredFeed[] } | null>(null);

  // Modals State
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedListType, setSelectedListType] = useState<string>('');
  const [showProxySettings, setShowProxySettings] = useState(false);
  const [analyticsFocus, setAnalyticsFocus] = useState<string | null>(null);

  // Duplicate Detection State
  const [duplicateWarning, setDuplicateWarning] = useState<{ show: boolean; result: DuplicateDetectionResult; newUrl: string } | null>(null);

  // Error Modal State
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedErrorFeed, setSelectedErrorFeed] = useState<{ url: string; validation: FeedValidationResult } | null>(null);

  // Initialize defaults
  useEffect(() => {
    if (showImportModal && !selectedListType) {
      const firstList = Object.keys(DEFAULT_CURATED_LISTS)[0];
      if (firstList) setSelectedListType(firstList);
    }
  }, [showImportModal, selectedListType]);

  const validateAllFeeds = React.useCallback(async () => {
    if (isValidating) return;
    setIsValidating(true);
    const urls = currentFeeds.map((feed) => feed.url);

    try {
      const results = await feedValidator.validateFeeds(urls);
      const validationMap = new Map<string, FeedValidationResult>();
      results.forEach((result) => validationMap.set(result.url, result));
      setFeedValidations(validationMap);
    } catch (error) {
      logger.error("Feed validation failed", error as Error);
    } finally {
      setIsValidating(false);
    }
  }, [currentFeeds, isValidating, logger]);

  // Auto-validate feeds on load (only when in feeds tab)
  useEffect(() => {
    if (currentFeeds.length > 0 && activeTab === "feeds") {
      validateAllFeeds();
    }
  }, [activeTab, validateAllFeeds, currentFeeds.length]);

  const validateSingleFeed = async (url: string) => {
    try {
      const result = await feedValidator.validateFeed(url);
      setFeedValidations((prev) => new Map(prev.set(url, result)));
      return result;
    } catch {
      return null;
    }
  };

  const handleEditFeed = (oldUrl: string) => {
    // Simple prompt for now, could be a modal
    const newUrl = prompt("Editar URL do feed:", oldUrl);
    if (newUrl && newUrl !== oldUrl) {
      handleSaveEdit(oldUrl, newUrl);
    }
  };

  const handleSaveEdit = async (oldUrl: string, newUrlStr: string) => {
    const validation = await validateSingleFeed(newUrlStr);
    if (validation && validation.status === "valid") {
      setFeeds((prev) =>
        prev.map((feed) =>
          feed.url === oldUrl ? { ...feed, url: newUrlStr } : feed
        )
      );
    } else {
      await alertError("O novo URL não é um feed RSS válido.");
    }
  };

  const handleRemoveFeed = async (urlToRemove: string) => {
    if (await confirmDanger("Tem certeza que deseja remover este feed?")) {
      setFeeds((prev) => prev.filter((f) => f.url !== urlToRemove));
    }
  };

  const moveFeedToCategory = (feedUrl: string, categoryId: string) => {
    setFeeds((prev) =>
      prev.map((feed) => {
        if (feed.url === feedUrl) {
          return { ...feed, categoryId };
        }
        return feed;
      })
    );
    alertSuccess("Categoria atualizada!");
  };

  const handleToggleHideFromAll = (feedUrl: string) => {
    setFeeds((prev) =>
      prev.map((feed) => {
        if (feed.url === feedUrl) {
          return { ...feed, hideFromAll: !feed.hideFromAll };
        }
        return feed;
      })
    );
  };

  const handleExportOPML = async () => {
    const opml = await OPMLExportService.generateOPML(currentFeeds, [], { includeCategories: false });
    const blob = new Blob([opml], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personal_news_feeds_${new Date().toISOString().split('T')[0]}.opml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportCurated = async (mode: 'merge' | 'replace') => {
    const feedsToImport = DEFAULT_CURATED_LISTS[selectedListType] || DEFAULT_FEEDS;

    if (mode === 'replace') {
      if (await confirmDanger("Isso substituirá todos os seus feeds atuais. Continuar?")) {
        setFeeds(feedsToImport);
        resetToDefaults();
        await alertSuccess("Feeds substituídos!");
        setShowImportModal(false);
      }
    } else {
      const merged = addFeedsToCollection(currentFeeds, feedsToImport);
      const addedCount = merged.length - currentFeeds.length;
      if (addedCount === 0) await alertSuccess("Todos os feeds já estão na coleção.");
      else {
        setFeeds(merged);
        await alertSuccess(`${addedCount} novos feeds adicionados!`);
      }
      setShowImportModal(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (await confirmDanger("Resetar para feeds padrão? Isso apagará seus feeds atuais.")) {
      const defaultFeeds = resetToDefaultFeeds();
      setFeeds(defaultFeeds);
      refreshAppearance();
      await alertSuccess("Feeds resetados com sucesso!");
    }
  };

  const handleDeleteAll = async () => {
    if (currentFeeds.length === 0) return;
    if (await confirmDanger(`Excluir TODOS os ${currentFeeds.length} feeds? Irreversível.`)) {
      setFeeds([]);
      await alertSuccess("Todos os feeds foram removidos.");
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const content = await file.text();
      try {
        const opmlFeeds = parseOpml(content);
        const newFeeds: FeedSource[] = [];
        const categoriesToCreate = new Set<string>();

        opmlFeeds.forEach(feed => {
          if (!currentFeeds.some(f => f.url === feed.url)) {
            const newFeed: FeedSource = { url: feed.url, customTitle: feed.title };
            if (feed.category) {
              const categoryId = feed.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
              newFeed.categoryId = categoryId;
              if (!categories.some(c => c.id === categoryId)) categoriesToCreate.add(feed.category);
            }
            newFeeds.push(newFeed);
          }
        });

        categoriesToCreate.forEach(catName => createCategory(catName, '#6B7280'));
        if (newFeeds.length > 0) setFeeds((prev) => [...prev, ...newFeeds]);
        await alertSuccess(`${newFeeds.length} feeds importados!`);
      } catch {
        await alertError('Falha ao processar arquivo OPML');
      }
    }
  };

  // --- Duplicate & Add Logic ---

  const checkForDuplicates = async (newUrl: string): Promise<DuplicateDetectionResult> => {
    try {
      return await feedDuplicateDetector.detectDuplicate(newUrl, currentFeeds);
    } catch {
      // Fallback logic could go here
      return { isDuplicate: false, confidence: 0, reason: "Error" };
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedUrl.trim()) {
      await alertError("Insira uma URL válida.");
      return;
    }

    const url = newFeedUrl.trim();
    const duplicateResult = await checkForDuplicates(url);

    if (duplicateResult.isDuplicate) {
      setDuplicateWarning({ show: true, result: duplicateResult, newUrl: url });
      return;
    }

    proceedWithFeedAddition(url);
  };

  const proceedWithFeedAddition = async (url: string) => {
    setProcessingUrl(url);
    setDiscoveryProgress((prev) => new Map(prev.set(url, { status: "Validando...", progress: 10 })));

    try {
      const result = await feedValidator.validateFeedWithDiscovery(url, (status, progress) => {
        setDiscoveryProgress((prev) => new Map(prev.set(url, { status, progress })));
      });

      if (result.isValid) {
        setFeeds((prev) => [...prev, { url: result.url, customTitle: result.title, categoryId: newFeedCategory || undefined }]);
        setNewFeedUrl("");
        setNewFeedCategory("");
        await alertSuccess("Feed adicionado com sucesso!");
      } else if (result.requiresUserSelection && result.discoveredFeeds?.length) {
        setCurrentDiscoveryResult({ originalUrl: url, discoveredFeeds: result.discoveredFeeds });
        setShowDiscoveryModal(true);
        setNewFeedUrl("");
      } else {
        // Offer force add
        if (await confirm(`Validação falhou: ${result.error}\n\nDeseja adicionar mesmo assim?`)) {
          setFeeds((prev) => [...prev, { url: url, categoryId: newFeedCategory || undefined }]);
          setNewFeedUrl("");
          await alertSuccess("Feed adicionado (sem validação).");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await alertError(`Erro: ${message}`);
    } finally {
      setProcessingUrl(null);
    }
  };

  const handleDuplicateWarningAccept = () => {
    if (duplicateWarning) proceedWithFeedAddition(duplicateWarning.newUrl);
    setDuplicateWarning(null);
  };

  const handleDuplicateWarningReplace = () => {
    if (!duplicateWarning?.result.duplicateOf) return;
    setFeeds((prev) => prev.filter((f) => f.url !== duplicateWarning.result.duplicateOf!.url));
    proceedWithFeedAddition(duplicateWarning.newUrl);
    setDuplicateWarning(null);
  };

  const handleShowError = (url: string, validation?: FeedValidationResult) => {
    if (validation) {
      setSelectedErrorFeed({ url, validation });
      setShowErrorModal(true);
    }
  };

  const navigateToAnalytics = (sectionId?: string) => {
    setActiveTab('statistics');
    if (sectionId) {
      setAnalyticsFocus(sectionId);
    }
  };

  const handleAnalyticsFocusConsumed = () => {
    setAnalyticsFocus(null);
  };

  // --- Render ---

  const validCount = Array.from(feedValidations.values()).filter(v => v.isValid).length;
  const invalidCount = Array.from(feedValidations.values()).filter(v => !v.isValid).length;
  const pendingCount = Math.max(0, currentFeeds.length - feedValidations.size);

  const tabs = [
    { id: 'functions', label: 'Funções', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'feeds', label: 'Meus Feeds', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', badge: currentFeeds.length },
    { id: 'categories', label: t('feeds.tab.categories'), icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { id: 'statistics', label: 'Estatísticas', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', badge: invalidCount > 0 ? invalidCount : undefined }
  ];

  return (
    <div className="relative flex flex-col h-full w-full bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_55%)]" />

      {/* Clean Header */}
      <div className="border-b border-white/10 bg-[rgb(var(--color-surface))]/30 shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--color-text))] flex items-center gap-3">
              <span className="p-2 bg-[rgba(var(--color-accent),0.1)] rounded-lg feed-accent-text">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11c3.866 0 7 3.134 7 7m-7-7v7" />
                </svg>
              </span>
              {t('feeds.title')}
            </h2>
            <p className="text-[rgb(var(--color-textSecondary))] text-xs sm:text-sm mt-1 ml-11">
              {currentFeeds.length} {t('feeds.stats.monitored')}
            </p>
          </div>

          <button
            onClick={closeModal}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] hover:bg-white/12 hover:border-white/20 transition-all duration-200"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/10 bg-[rgb(var(--color-surface))]/15 overflow-x-auto scrollbar-hide shrink-0">
        <div className="max-w-6xl mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 px-4 py-3 sm:py-4 text-sm font-medium transition-colors whitespace-nowrap min-w-[60px] sm:min-w-[110px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${activeTab === tab.id
              ? "text-[rgb(var(--color-text))] border-b-2 border-[rgba(var(--color-accent),0.28)] bg-[rgba(255,255,255,0.05)]"
              : "text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] hover:bg-[rgba(255,255,255,0.035)]"
                }`}
              title={tab.label}
            >
              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="text-[10px] sm:text-sm hidden sm:inline">{tab.label}</span>
              {typeof tab.badge !== "undefined" && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    tab.id === "statistics" && tab.badge
                    ? "border-rose-400/30 text-rose-200/90 bg-rose-500/10"
                    : "border-white/10 text-[rgb(var(--color-text))]/80 bg-white/5"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/3 via-transparent to-transparent" />
        <div className="relative h-full">
        {activeTab === 'feeds' && (
          <FeedListTab
            feeds={currentFeeds}
            validations={feedValidations}
            categories={categories}
            onRemove={handleRemoveFeed}
            onRetry={validateSingleFeed}
            onEdit={handleEditFeed}
            onShowError={handleShowError}
            onMoveCategory={moveFeedToCategory}
            onToggleHideFromAll={handleToggleHideFromAll}
            onRefreshAll={onRefreshFeeds}
            newFeedUrl={newFeedUrl}
            setNewFeedUrl={setNewFeedUrl}
            newFeedCategory={newFeedCategory}
            setNewFeedCategory={setNewFeedCategory}
            processingUrl={processingUrl}
            onSubmit={handleAddFeed}
            discoveryProgress={discoveryProgress}
          />
        )}

        {activeTab === 'categories' && (
          <div className="flex-1 overflow-y-auto p-6 h-full">
            <div className="max-w-6xl mx-auto w-full">
              <FeedCategoryManager
                feeds={currentFeeds}
                setFeeds={setFeeds}
                onClose={() => setActiveTab("feeds")}
              />
            </div>
          </div>
        )}

        {activeTab === 'functions' && (
          <FeedToolsTab
            onExportOPML={handleExportOPML}
            onImportOPML={() => fileInputRef.current?.click()}
            onShowImportModal={() => setShowImportModal(true)}
            onResetDefaults={handleResetToDefaults}
            onCleanupErrors={() => setShowCleanupModal(true)}
            onDeleteAll={handleDeleteAll}
            feedCount={currentFeeds.length}
            validCount={validCount}
            invalidCount={invalidCount}
            pendingCount={pendingCount}
            onShowReports={() => navigateToAnalytics('feed-reports')}
            onShowProxySettings={() => setShowProxySettings(true)}
            onShowProxyHealth={() => navigateToAnalytics('proxy-health')}
            onShowFeedStatus={() => navigateToAnalytics('feed-status')}
          />
        )}

        {activeTab === 'statistics' && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar h-full">
            <div className="max-w-6xl mx-auto w-full">
              <FeedAnalytics
                feeds={currentFeeds}
                articles={articles}
                feedValidations={feedValidations}
                focusSection={analyticsFocus || undefined}
                onFocusConsumed={handleAnalyticsFocusConsumed}
              />
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".opml,.xml"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* --- Modals --- */}

      <FeedDuplicateModal
        isOpen={!!duplicateWarning?.show}
        onClose={() => setDuplicateWarning(null)}
        onReplace={handleDuplicateWarningReplace}
        onAddAnyway={handleDuplicateWarningAccept}
        existingFeed={duplicateWarning?.result.duplicateOf || null}
        newFeedUrl={duplicateWarning?.newUrl || ''}
        confidence={duplicateWarning?.result.confidence || 0}
      />

      {showDiscoveryModal && currentDiscoveryResult && (
        <FeedDiscoveryModal
          isOpen={showDiscoveryModal}
          onClose={() => { setShowDiscoveryModal(false); setCurrentDiscoveryResult(null); }}
          originalUrl={currentDiscoveryResult.originalUrl}
          discoveredFeeds={currentDiscoveryResult.discoveredFeeds}
          onSelectFeed={async (feed) => {
            // Quick implementation of select logic
            setFeeds((prev) => [...prev, { url: feed.url, customTitle: feed.title, categoryId: newFeedCategory || undefined }]);
            setShowDiscoveryModal(false);
            setCurrentDiscoveryResult(null);
            await alertSuccess("Feed adicionado!");
          }}
        />
      )}

      <FeedCleanupModal
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        feeds={currentFeeds}
        onRemoveFeeds={(urls) => setFeeds(prev => prev.filter(f => !urls.includes(f.url)))}
      />

      {showImportModal && (
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-[rgb(var(--color-surface))]/95 text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))]/30 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-[rgb(var(--color-text))] mb-4">Importar Listas Curadas</h3>
              <select
                value={selectedListType}
                onChange={(e) => setSelectedListType(e.target.value)}
                className="w-full bg-[rgb(var(--color-surface))]/70 text-[rgb(var(--color-text))] p-2 rounded mb-4 border border-[rgb(var(--color-border))]/30"
              >
                {Object.keys(DEFAULT_CURATED_LISTS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={() => handleImportCurated('merge')} className="flex-1 bg-[rgba(var(--color-accent),0.2)] text-[rgb(var(--color-text))] py-2 rounded border border-[rgba(var(--color-accent),0.3)]">Mesclar</button>
                <button onClick={() => handleImportCurated('replace')} className="flex-1 bg-rose-600/15 text-rose-300 py-2 rounded border border-rose-500/30">Substituir Tudo</button>
              </div>
              <button onClick={() => setShowImportModal(false)} className="w-full mt-2 text-[rgb(var(--color-textSecondary))] py-2">Cancelar</button>
            </div>
          </div>,
          document.body
        )
      )}

      {showProxySettings && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-[rgb(var(--color-surface))]/95 text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))]/30 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-[rgb(var(--color-text))] font-semibold">Configuração de Proxies</h3>
              <button onClick={() => setShowProxySettings(false)} className="text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))]">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <Suspense fallback={<div className="text-[rgb(var(--color-textSecondary))] text-sm">Carregando configurações...</div>}>
                <ProxySettings detailed />
              </Suspense>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Error Details Modal */}
      {showErrorModal && selectedErrorFeed && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-[rgb(var(--color-surface))]/95 text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))]/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between">
              <h3 className="text-[rgb(var(--color-text))] font-bold">Detalhes do Erro</h3>
              <button onClick={() => setShowErrorModal(false)} className="text-[rgb(var(--color-textSecondary))]">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-red-400 font-mono mb-4">{selectedErrorFeed.validation.error}</p>
              <div className="bg-[rgb(var(--color-background))]/40 p-4 rounded text-sm text-[rgb(var(--color-textSecondary))] font-mono break-all">
                {selectedErrorFeed.url}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
