import React, { Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import type { FeedSource, Article } from "../types";
import { parseOpml } from "../services/rssParser";
import { FeedCategoryManager } from "./FeedCategoryManager";
import { FeedDiscoveryModal } from "./FeedDiscoveryModal";
import { FeedCleanupModal } from "./FeedCleanupModal";
import { useLogger } from "../services/logger";
import {
  feedValidator,
  type FeedValidationResult,
} from "../services/feedValidator";
import { type DiscoveredFeed } from "../services/feedDiscoveryService";
import { OPMLExportService } from "../services/opmlExportService";
import {
  feedDuplicateDetector,
  type DuplicateDetectionResult,
} from "../services/feedDuplicateDetector";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
import { useFeedCategories } from "../hooks/useFeedCategories";
import { useAppearance } from "../hooks/useAppearance";
import {
  resetToDefaultFeeds,
  addFeedsToCollection,
} from "../utils/feedMigration";
import { DEFAULT_FEEDS } from "../constants/curatedFeeds";
import { DEFAULT_CURATED_LISTS } from "../config/defaultConfig";
import { useLanguage } from "../hooks/useLanguage";
import { FeedDuplicateModal } from "./FeedDuplicateModal";
import { FeedListTab } from "./FeedManager/FeedListTab";
import { FeedToolsTab } from "./FeedManager/FeedToolsTab";
import { FeedAnalytics } from "./FeedAnalytics";
import type { ProxySettingsProps } from "./ProxySettings";

type ProxySettingsModule = {
  default?: React.ComponentType<ProxySettingsProps>;
  ProxySettings?: React.ComponentType<ProxySettingsProps>;
};

const ProxySettingsFallback: React.FC<ProxySettingsProps> = () => null;

const ProxySettings = React.lazy<React.ComponentType<ProxySettingsProps>>(() =>
  import("./ProxySettings").then((mod: ProxySettingsModule) => ({
    default: mod.default ?? mod.ProxySettings ?? ProxySettingsFallback,
  })),
);

interface FeedManagerProps {
  currentFeeds: FeedSource[];
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  closeModal: () => void;
  articles?: Article[];
  onRefreshFeeds?: () => void;
}

type FeedManagerTab = "feeds" | "categories" | "operations" | "diagnostics";

const normalizePersistedTab = (value?: string): FeedManagerTab => {
  if (value === "diagnostics") return "diagnostics";
  if (value === "categories") return "categories";
  if (
    value === "operations" ||
    value === "statistics" ||
    value === "functions"
  ) {
    return "operations";
  }
  return "feeds";
};

const shouldOpenDiagnostics = (
  section?: string,
  openProxySettings?: boolean,
): boolean => {
  if (openProxySettings) return false;
  if (
    section === "diagnostics" ||
    section === "proxy-health" ||
    section === "feed-status" ||
    section === "feed-reports"
  ) {
    return true;
  }
  return false;
};

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
  const { confirm, alertSuccess, alertError, confirmDanger, confirmWarning } =
    useNotificationReplacements();

  const [activeTab, setActiveTab] = useState<FeedManagerTab>("feeds");
  const [diagnosticsFocus, setDiagnosticsFocus] = useState<string | null>(null);
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedCategory, setNewFeedCategory] = useState<string>("");
  const [processingUrl, setProcessingUrl] = useState<string | null>(null);
  const [feedValidations, setFeedValidations] = useState<
    Map<string, FeedValidationResult>
  >(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState<
    Map<string, { status: string; progress: number }>
  >(new Map());
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [currentDiscoveryResult, setCurrentDiscoveryResult] = useState<{
    originalUrl: string;
    discoveredFeeds: DiscoveredFeed[];
  } | null>(null);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedListType, setSelectedListType] = useState<string>("");
  const [showProxySettings, setShowProxySettings] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    show: boolean;
    result: DuplicateDetectionResult;
    newUrl: string;
  } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedErrorFeed, setSelectedErrorFeed] = useState<{
    url: string;
    validation: FeedValidationResult;
  } | null>(null);
  const [editingFeedUrl, setEditingFeedUrl] = useState<string | null>(null);
  const [editUrlDraft, setEditUrlDraft] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showImportModal && !selectedListType) {
      const firstList = Object.keys(DEFAULT_CURATED_LISTS)[0];
      if (firstList) setSelectedListType(firstList);
    }
  }, [showImportModal, selectedListType]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("feed-manager-focus");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        tab?: string;
        section?: string;
        openProxySettings?: boolean;
      };

      const nextTab = normalizePersistedTab(parsed.tab);
      setActiveTab(
        shouldOpenDiagnostics(parsed.section, parsed.openProxySettings)
          ? "diagnostics"
          : nextTab,
      );
      if (parsed.section) setDiagnosticsFocus(parsed.section);
      if (parsed.openProxySettings) setShowProxySettings(true);
    } catch {
      // Ignore malformed state.
    } finally {
      window.sessionStorage.removeItem("feed-manager-focus");
    }
  }, []);

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

  useEffect(() => {
    if (
      currentFeeds.length > 0 &&
      (activeTab === "feeds" || activeTab === "diagnostics")
    ) {
      void validateAllFeeds();
    }
  }, [activeTab, currentFeeds.length, validateAllFeeds]);

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
    setEditingFeedUrl(oldUrl);
    setEditUrlDraft(oldUrl);
  };

  const handleSaveEdit = async (oldUrl: string, newUrlStr: string) => {
    const validation = await validateSingleFeed(newUrlStr);
    if (validation && validation.status === "valid") {
      setFeeds((prev) =>
        prev.map((feed) =>
          feed.url === oldUrl ? { ...feed, url: newUrlStr } : feed,
        ),
      );
    } else {
      await alertError("O novo URL não é um feed RSS válido.");
    }
  };

  const handleCloseEditDialog = () => {
    setEditingFeedUrl(null);
    setEditUrlDraft("");
  };

  const handleSubmitEditDialog = async () => {
    if (!editingFeedUrl) return;
    const nextUrl = editUrlDraft.trim();
    if (!nextUrl || nextUrl === editingFeedUrl) {
      handleCloseEditDialog();
      return;
    }
    await handleSaveEdit(editingFeedUrl, nextUrl);
    handleCloseEditDialog();
  };

  const handleRemoveFeed = async (urlToRemove: string) => {
    if (await confirmDanger("Tem certeza que deseja remover este feed?")) {
      setFeeds((prev) => prev.filter((f) => f.url !== urlToRemove));
    }
  };

  const moveFeedToCategory = (feedUrl: string, categoryId: string) => {
    setFeeds((prev) =>
      prev.map((feed) =>
        feed.url === feedUrl ? { ...feed, categoryId } : feed,
      ),
    );
    void alertSuccess("Categoria atualizada!");
  };

  const handleToggleHideFromAll = (feedUrl: string) => {
    setFeeds((prev) =>
      prev.map((feed) =>
        feed.url === feedUrl
          ? { ...feed, hideFromAll: !feed.hideFromAll }
          : feed,
      ),
    );
  };

  const handleExportOPML = async () => {
    const opml = await OPMLExportService.generateOPML(currentFeeds, [], {
      includeCategories: false,
    });
    const blob = new Blob([opml], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personal_news_feeds_${new Date().toISOString().split("T")[0]}.opml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportCurated = async (mode: "merge" | "replace") => {
    const feedsToImport =
      DEFAULT_CURATED_LISTS[selectedListType] || DEFAULT_FEEDS;

    if (mode === "replace") {
      if (
        await confirmDanger(
          "Isso substituirá todos os seus feeds atuais. Continuar?",
        )
      ) {
        setFeeds(feedsToImport);
        resetToDefaults();
        await alertSuccess("Feeds substituídos!");
        setShowImportModal(false);
      }
      return;
    }

    const merged = addFeedsToCollection(currentFeeds, feedsToImport);
    const addedCount = merged.length - currentFeeds.length;
    if (addedCount === 0) {
      await alertSuccess("Todos os feeds já estão na coleção.");
    } else {
      setFeeds(merged);
      await alertSuccess(`${addedCount} novos feeds adicionados!`);
    }
    setShowImportModal(false);
  };

  const handleResetToDefaults = async () => {
    if (
      await confirmDanger(
        "Resetar para feeds padrão? Isso apagará seus feeds atuais.",
      )
    ) {
      const defaultFeeds = resetToDefaultFeeds();
      setFeeds(defaultFeeds);
      refreshAppearance();
      await alertSuccess("Feeds resetados com sucesso!");
    }
  };

  const handleDeleteAll = async () => {
    if (currentFeeds.length === 0) return;
    if (
      await confirmDanger(
        `Excluir TODOS os ${currentFeeds.length} feeds? Irreversível.`,
      )
    ) {
      setFeeds([]);
      await alertSuccess("Todos os feeds foram removidos.");
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    try {
      const opmlFeeds = parseOpml(content);
      const newFeeds: FeedSource[] = [];
      const categoriesToCreate = new Set<string>();

      opmlFeeds.forEach((feed) => {
        if (!currentFeeds.some((f) => f.url === feed.url)) {
          const newFeed: FeedSource = {
            url: feed.url,
            customTitle: feed.title,
          };
          if (feed.category) {
            const categoryId = feed.category
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-");
            newFeed.categoryId = categoryId;
            if (!categories.some((c) => c.id === categoryId)) {
              categoriesToCreate.add(feed.category);
            }
          }
          newFeeds.push(newFeed);
        }
      });

      categoriesToCreate.forEach((catName) =>
        createCategory(catName, "#6B7280"),
      );
      if (newFeeds.length > 0) setFeeds((prev) => [...prev, ...newFeeds]);
      await alertSuccess(`${newFeeds.length} feeds importados!`);
    } catch {
      await alertError("Falha ao processar arquivo OPML");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const checkForDuplicates = async (
    newUrl: string,
  ): Promise<DuplicateDetectionResult> => {
    try {
      return await feedDuplicateDetector.detectDuplicate(newUrl, currentFeeds);
    } catch {
      return { isDuplicate: false, confidence: 0, reason: "Error" };
    }
  };

  const proceedWithFeedAddition = async (url: string) => {
    setProcessingUrl(url);
    setDiscoveryProgress(
      (prev) =>
        new Map(prev.set(url, { status: "Validando...", progress: 10 })),
    );

    try {
      const result = await feedValidator.validateFeedWithDiscovery(
        url,
        (status, progress) => {
          setDiscoveryProgress(
            (prev) => new Map(prev.set(url, { status, progress })),
          );
        },
      );

      if (result.isValid) {
        setFeeds((prev) => [
          ...prev,
          {
            url: result.url,
            customTitle: result.title,
            categoryId: newFeedCategory || undefined,
          },
        ]);
        setNewFeedUrl("");
        setNewFeedCategory("");
        await alertSuccess("Feed adicionado com sucesso!");
        return;
      }

      if (result.requiresUserSelection && result.discoveredFeeds?.length) {
        setCurrentDiscoveryResult({
          originalUrl: url,
          discoveredFeeds: result.discoveredFeeds,
        });
        setShowDiscoveryModal(true);
        setNewFeedUrl("");
        return;
      }

      if (
        await confirm(
          `Validação falhou: ${result.error}\n\nDeseja adicionar mesmo assim?`,
        )
      ) {
        setFeeds((prev) => [
          ...prev,
          { url, categoryId: newFeedCategory || undefined },
        ]);
        setNewFeedUrl("");
        await alertSuccess("Feed adicionado (sem validação).");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await alertError(`Erro: ${message}`);
    } finally {
      setProcessingUrl(null);
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

    await proceedWithFeedAddition(url);
  };

  const handleDuplicateWarningAccept = () => {
    if (duplicateWarning) void proceedWithFeedAddition(duplicateWarning.newUrl);
    setDuplicateWarning(null);
  };

  const handleDuplicateWarningReplace = () => {
    if (!duplicateWarning?.result.duplicateOf) return;
    setFeeds((prev) =>
      prev.filter((f) => f.url !== duplicateWarning.result.duplicateOf!.url),
    );
    void proceedWithFeedAddition(duplicateWarning.newUrl);
    setDuplicateWarning(null);
  };

  const handleShowError = (url: string, validation?: FeedValidationResult) => {
    if (!validation) return;
    setSelectedErrorFeed({ url, validation });
    setShowErrorModal(true);
  };

  const handleConfirmRefreshAll = async () => {
    if (!onRefreshFeeds) return;
    const confirmed = await confirmWarning(
      "Deseja forçar a revalidação de todos os feeds? Isso pode levar alguns instantes.",
      "Revalidar feeds",
    );
    if (confirmed) onRefreshFeeds();
  };

  const navigateToDiagnostics = (sectionId?: string) => {
    setActiveTab("diagnostics");
    if (sectionId) setDiagnosticsFocus(sectionId);
  };

  const validCount = Array.from(feedValidations.values()).filter(
    (v) => v.isValid,
  ).length;
  const invalidCount = Array.from(feedValidations.values()).filter(
    (v) => !v.isValid,
  ).length;
  const pendingCount = Math.max(0, currentFeeds.length - feedValidations.size);

  const tabs: Array<{
    id: FeedManagerTab;
    label: string;
    badge?: number;
  }> = [
    {
      id: "feeds",
      label: "Feeds",
      badge: currentFeeds.length,
    },
    {
      id: "categories",
      label: t("feeds.tab.categories"),
    },
    {
      id: "operations",
      label: "Operações",
      badge: invalidCount > 0 ? invalidCount : undefined,
    },
  ];

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-[rgb(var(--theme-manager-bg,var(--color-background)))] text-[rgb(var(--theme-manager-text,var(--color-text)))]"
      style={
        {
          "--theme-surface-readable": "var(--theme-manager-surface)",
          "--theme-surface-elevated": "var(--theme-manager-elevated)",
          "--theme-control-bg": "var(--theme-manager-control)",
          "--theme-chip-bg": "var(--theme-manager-soft)",
          "--theme-text-readable": "var(--theme-manager-text)",
          "--theme-text-secondary-readable":
            "var(--theme-manager-text-secondary)",
          "--theme-text-on-surface": "var(--theme-manager-text)",
          "--theme-text-secondary-on-surface":
            "var(--theme-manager-text-secondary)",
          "--theme-control-text": "var(--theme-manager-text)",
        } as React.CSSProperties
      }
    >
      <header className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[rgb(var(--theme-text-readable))] sm:text-2xl">
                {t("feeds.title")}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[rgb(var(--theme-manager-control))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--theme-manager-text))] shadow-[0_10px_24px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.03)]">
                {currentFeeds.length} feeds
              </span>
              <button
                onClick={closeModal}
                className="rounded-full bg-[rgb(var(--theme-manager-control))] p-2 text-[rgb(var(--theme-manager-text-secondary))] shadow-[0_10px_24px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:bg-[rgb(var(--theme-manager-soft))] hover:text-[rgb(var(--theme-manager-text))]"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {tabs.map((tab) => {
              const isActive =
                tab.id === "operations"
                  ? activeTab === "operations" || activeTab === "diagnostics"
                  : activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== "diagnostics") setDiagnosticsFocus(null);
                  }}
                  className={`rounded-[20px] px-4 py-3 text-left shadow-[0_16px_36px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.025)] transition-all ${
                    isActive
                      ? "bg-[rgb(var(--theme-manager-surface))] ring-1 ring-[rgba(var(--color-accent),0.28)]"
                      : "bg-[rgb(var(--theme-manager-bg))] hover:bg-[rgb(var(--theme-manager-control))]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-[rgb(var(--theme-text-readable))]">
                      {tab.label}
                    </div>
                    {typeof tab.badge !== "undefined" && (
                      <span className="rounded-full bg-[rgb(var(--theme-manager-control))] px-2.5 py-1 text-[10px] font-semibold text-[rgb(var(--theme-manager-text-secondary))] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {activeTab === "feeds" && (
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
            onConfirmRefreshAll={handleConfirmRefreshAll}
            newFeedUrl={newFeedUrl}
            setNewFeedUrl={setNewFeedUrl}
            newFeedCategory={newFeedCategory}
            setNewFeedCategory={setNewFeedCategory}
            processingUrl={processingUrl}
            onSubmit={handleAddFeed}
            discoveryProgress={discoveryProgress}
          />
        )}

        {activeTab === "categories" && (
          <div className="h-full overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="mx-auto w-full max-w-[1480px]">
              <FeedCategoryManager
                feeds={currentFeeds}
                setFeeds={setFeeds}
                onClose={() => setActiveTab("feeds")}
              />
            </div>
          </div>
        )}

        {activeTab === "operations" && (
          <FeedToolsTab
            onExportOPML={handleExportOPML}
            onImportOPML={() => fileInputRef.current?.click()}
            onShowImportModal={() => setShowImportModal(true)}
            onResetDefaults={handleResetToDefaults}
            onCleanupErrors={() => setShowCleanupModal(true)}
            onDeleteAll={handleDeleteAll}
            onOpenDiagnostics={() => navigateToDiagnostics("feed-status")}
            onShowProxySettings={() => setShowProxySettings(true)}
            feedCount={currentFeeds.length}
            validCount={validCount}
            invalidCount={invalidCount}
            pendingCount={pendingCount}
          />
        )}

        {activeTab === "diagnostics" && (
          <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
            <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[rgb(var(--theme-manager-surface))] px-5 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.03)]">
                <button
                  type="button"
                  onClick={() => setActiveTab("operations")}
                  className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--theme-manager-control))] px-3 py-2 text-sm font-medium text-[rgb(var(--theme-manager-text))] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-all hover:bg-[rgb(var(--theme-manager-soft))]"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Operações
                </button>

                <div className="text-sm font-semibold text-[rgb(var(--theme-text-readable))]">
                  Diagnóstico
                </div>

                <button
                  type="button"
                  onClick={() => setShowProxySettings(true)}
                  className="rounded-full bg-[rgb(var(--theme-manager-control))] px-3 py-2 text-sm font-medium text-[rgb(var(--theme-manager-text))] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-all hover:bg-[rgb(var(--theme-manager-soft))]"
                >
                  Proxies
                </button>
              </div>

              <FeedAnalytics
                feeds={currentFeeds}
                articles={articles}
                feedValidations={feedValidations}
                focusSection={diagnosticsFocus || undefined}
                onFocusConsumed={() => setDiagnosticsFocus(null)}
              />
            </div>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept=".opml,.xml"
        onChange={handleFileImport}
        className="hidden"
      />

      <FeedDuplicateModal
        isOpen={!!duplicateWarning?.show}
        onClose={() => setDuplicateWarning(null)}
        onReplace={handleDuplicateWarningReplace}
        onAddAnyway={handleDuplicateWarningAccept}
        existingFeed={duplicateWarning?.result.duplicateOf || null}
        newFeedUrl={duplicateWarning?.newUrl || ""}
        confidence={duplicateWarning?.result.confidence || 0}
      />

      {showDiscoveryModal && currentDiscoveryResult && (
        <FeedDiscoveryModal
          isOpen={showDiscoveryModal}
          onClose={() => {
            setShowDiscoveryModal(false);
            setCurrentDiscoveryResult(null);
          }}
          originalUrl={currentDiscoveryResult.originalUrl}
          discoveredFeeds={currentDiscoveryResult.discoveredFeeds}
          onSelectFeed={async (feed) => {
            setFeeds((prev) => [
              ...prev,
              {
                url: feed.url,
                customTitle: feed.title,
                categoryId: newFeedCategory || undefined,
              },
            ]);
            setShowDiscoveryModal(false);
            setCurrentDiscoveryResult(null);
            await alertSuccess("Feed adicionado!");
          }}
        />
      )}

      <Dialog
        open={!!editingFeedUrl}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "rgb(var(--theme-manager-surface))",
            color: "rgb(var(--theme-manager-text))",
            border: "1px solid rgba(var(--color-border),0.18)",
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "rgb(var(--theme-manager-text))",
            borderBottom: "1px solid rgba(var(--color-border),0.18)",
          }}
        >
          Editar URL do feed
        </DialogTitle>
        <DialogContent sx={{ paddingTop: 3 }}>
          <TextField
            autoFocus
            fullWidth
            value={editUrlDraft}
            onChange={(event) => setEditUrlDraft(event.target.value)}
            placeholder="https://site.com/rss"
            variant="outlined"
            sx={{
              marginTop: 1,
              "& .MuiOutlinedInput-root": {
                color: "rgb(var(--theme-manager-text))",
                backgroundColor: "rgb(var(--theme-manager-control))",
                "& fieldset": { borderColor: "rgba(var(--color-border),0.18)" },
                "&:hover fieldset": {
                  borderColor: "rgba(var(--color-border),0.28)",
                },
                "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ padding: 3 }}>
          <Button
            onClick={handleCloseEditDialog}
            variant="outlined"
            sx={{ color: "#9ca3af", borderColor: "#4b5563" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleSubmitEditDialog()}
            variant="contained"
            sx={{
              backgroundColor: "#3b82f6",
              "&:hover": { backgroundColor: "#2563eb" },
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <FeedCleanupModal
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        feeds={currentFeeds}
        onRemoveFeeds={(urls) =>
          setFeeds((prev) => prev.filter((f) => !urls.includes(f.url)))
        }
      />

      {showImportModal &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-[rgb(var(--color-border))]/30 bg-[rgb(var(--theme-surface-readable))]/95 p-6 text-[rgb(var(--theme-text-readable))]">
              <h3 className="mb-4 text-xl font-bold text-[rgb(var(--theme-text-readable))]">
                Importar listas curadas
              </h3>
              <select
                value={selectedListType}
                onChange={(e) => setSelectedListType(e.target.value)}
                className="mb-4 w-full rounded border border-[rgb(var(--color-border))]/30 bg-[rgb(var(--theme-surface-readable))]/70 p-2 text-[rgb(var(--theme-text-readable))]"
              >
                {Object.keys(DEFAULT_CURATED_LISTS).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => void handleImportCurated("merge")}
                  className="flex-1 rounded border border-[rgba(var(--color-accent),0.3)] bg-[rgba(var(--color-accent),0.2)] py-2 text-[rgb(var(--theme-text-readable))]"
                >
                  Mesclar
                </button>
                <button
                  onClick={() => void handleImportCurated("replace")}
                  className="flex-1 rounded border border-rose-500/30 bg-rose-600/15 py-2 text-rose-300"
                >
                  Substituir tudo
                </button>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="mt-2 w-full py-2 text-[rgb(var(--color-textSecondary))]"
              >
                Cancelar
              </button>
            </div>
          </div>,
          document.body,
        )}

      {showProxySettings &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-[rgb(var(--color-border))]/30 bg-[rgb(var(--theme-surface-readable))]/95 text-[rgb(var(--theme-text-readable))] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[rgba(var(--color-border),0.15)] p-5">
                <h3 className="font-semibold text-[rgb(var(--theme-text-readable))]">
                  Proxies
                </h3>
                <button
                  onClick={() => setShowProxySettings(false)}
                  className="text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--theme-text-readable))]"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto p-6">
                <Suspense
                  fallback={
                    <div className="text-sm text-[rgb(var(--color-textSecondary))]">
                      Carregando configurações...
                    </div>
                  }
                >
                  <ProxySettings detailed />
                </Suspense>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showErrorModal &&
        selectedErrorFeed &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[rgb(var(--color-border))]/30 bg-[rgb(var(--theme-surface-readable))]/95 text-[rgb(var(--theme-text-readable))] shadow-2xl">
              <div className="flex justify-between border-b border-[rgba(var(--color-border),0.15)] p-6">
                <h3 className="font-bold text-[rgb(var(--theme-text-readable))]">
                  Detalhes do erro
                </h3>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="text-[rgb(var(--color-textSecondary))]"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto p-6">
                <p className="mb-4 font-mono text-red-400">
                  {selectedErrorFeed.validation.error}
                </p>
                <div className="rounded bg-[rgb(var(--color-background))]/40 p-4 font-mono text-sm break-all text-[rgb(var(--color-textSecondary))]">
                  {selectedErrorFeed.url}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigateToDiagnostics("feed-status")}
                    className="rounded-full border border-[rgba(var(--color-accent),0.24)] bg-[rgba(var(--color-accent),0.12)] px-4 py-2 text-sm font-semibold text-[rgb(var(--color-accent))]"
                  >
                    Abrir diagnóstico completo
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
