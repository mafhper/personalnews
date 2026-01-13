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

import React, { useState, useRef, useEffect } from "react";
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
import { useLanguage } from "../contexts/LanguageContext";
import { FeedDuplicateModal } from "./FeedDuplicateModal";

// New Modular Tabs
import { FeedListTab } from "./FeedManager/FeedListTab";
import { FeedAddTab } from "./FeedManager/FeedAddTab";
import { FeedToolsTab } from "./FeedManager/FeedToolsTab";

interface FeedManagerProps {
  currentFeeds: FeedSource[];
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  closeModal: () => void;
  articles?: Article[];
  onRefreshFeeds?: () => void;
}

type TabType = 'feeds' | 'add' | 'categories' | 'tools' | 'analytics';

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
  const [activeTab, setActiveTab] = useState<TabType>("feeds");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedCategory, setNewFeedCategory] = useState<string>("");
  const [processingUrl, setProcessingUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation State
  const [feedValidations, setFeedValidations] = useState<Map<string, FeedValidationResult>>(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [editingFeed, setEditingFeed] = useState<string | null>(null);

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
    } catch (error) {
      return null;
    }
  };

  const handleEditFeed = (oldUrl: string) => {
    setEditingFeed(oldUrl);
    // Simple prompt for now, could be a modal
    const newUrl = prompt("Editar URL do feed:", oldUrl);
    if (newUrl && newUrl !== oldUrl) {
      handleSaveEdit(oldUrl, newUrl);
    } else {
      setEditingFeed(null);
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
    setEditingFeed(null);
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
      } catch (error) {
        await alertError('Falha ao processar arquivo OPML');
      }
    }
  };

  // --- Duplicate & Add Logic ---

  const checkForDuplicates = async (newUrl: string): Promise<DuplicateDetectionResult> => {
    try {
      return await feedDuplicateDetector.detectDuplicate(newUrl, currentFeeds);
    } catch (error) {
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
    } catch (error: any) {
      await alertError(`Erro: ${error.message}`);
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

  // --- Render ---

  const tabs = [
    { id: 'feeds', label: 'Meus Feeds', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'add', label: 'Adicionar', icon: 'M12 4v16m8-8H4' },
    { id: 'categories', label: t('feeds.tab.categories'), icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { id: 'tools', label: 'Ferramentas', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'analytics', label: t('feeds.tab.analytics'), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
  ];

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 overflow-hidden">

      {/* Clean Header */}
      <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <span className="p-2 bg-[rgb(var(--color-accent))]/20 rounded-lg text-[rgb(var(--color-accent))]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11c3.866 0 7 3.134 7 7m-7-7v7" />
              </svg>
            </span>
            {t('feeds.title')}
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 ml-11">
            {currentFeeds.length} {t('feeds.stats.monitored')}
          </p>
        </div>

        <button
          onClick={closeModal}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/15 hover:border-white/20 transition-all duration-200"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 bg-black/10 overflow-x-auto scrollbar-hide shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex-1 px-4 py-3 sm:py-4 text-sm font-medium transition-colors whitespace-nowrap min-w-[60px] sm:min-w-[100px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${activeTab === tab.id
              ? "text-[rgb(var(--color-accent))] border-b-2 border-[rgb(var(--color-accent))] bg-white/5"
              : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            title={tab.label}
          >
            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            <span className="text-[10px] sm:text-sm hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
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
          />
        )}

        {activeTab === 'add' && (
          <FeedAddTab
            newFeedUrl={newFeedUrl}
            setNewFeedUrl={setNewFeedUrl}
            newFeedCategory={newFeedCategory}
            setNewFeedCategory={setNewFeedCategory}
            categories={categories}
            onSubmit={handleAddFeed}
            processingUrl={processingUrl}
            discoveryProgress={discoveryProgress}
          />
        )}

        {activeTab === 'categories' && (
          <div className="flex-1 overflow-y-auto p-6 h-full">
            <FeedCategoryManager
              feeds={currentFeeds}
              setFeeds={setFeeds}
              onClose={() => setActiveTab("feeds")}
            />
          </div>
        )}

        {activeTab === 'tools' && (
          <FeedToolsTab
            onExportOPML={handleExportOPML}
            onImportOPML={() => fileInputRef.current?.click()}
            onShowImportModal={() => setShowImportModal(true)}
            onResetDefaults={handleResetToDefaults}
            onCleanupErrors={() => setShowCleanupModal(true)}
            onDeleteAll={handleDeleteAll}
            feedCount={currentFeeds.length}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar h-full">
            <FeedAnalytics
              feeds={currentFeeds}
              articles={articles}
              feedValidations={feedValidations}
            />
          </div>
        )}
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
            <div className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Importar Listas Curadas</h3>
              <select
                value={selectedListType}
                onChange={(e) => setSelectedListType(e.target.value)}
                className="w-full bg-black/30 text-white p-2 rounded mb-4 border border-white/10"
              >
                {Object.keys(DEFAULT_CURATED_LISTS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={() => handleImportCurated('merge')} className="flex-1 bg-blue-600 text-white py-2 rounded">Mesclar</button>
                <button onClick={() => handleImportCurated('replace')} className="flex-1 bg-red-600/20 text-red-400 py-2 rounded">Substituir Tudo</button>
              </div>
              <button onClick={() => setShowImportModal(false)} className="w-full mt-2 text-gray-500 py-2">Cancelar</button>
            </div>
          </div>,
          document.body
        )
      )}

      {/* Error Details Modal */}
      {showErrorModal && selectedErrorFeed && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between">
              <h3 className="text-white font-bold">Detalhes do Erro</h3>
              <button onClick={() => setShowErrorModal(false)} className="text-gray-400">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-red-400 font-mono mb-4">{selectedErrorFeed.validation.error}</p>
              <div className="bg-black/30 p-4 rounded text-sm text-gray-300 font-mono break-all">
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
