import React, { useEffect, useRef, useState } from "react";
import { Activity, Library, Settings2 } from "lucide-react";
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
import { FeedAddTab } from "./FeedManager/FeedAddTab";
import { FeedListTab } from "./FeedManager/FeedListTab";
import { FeedToolsTab } from "./FeedManager/FeedToolsTab";
import { FeedAnalytics } from "./FeedAnalytics";
import { Modal } from "./Modal";

interface FeedManagerProps {
  currentFeeds: FeedSource[];
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  closeModal: () => void;
  articles?: Article[];
  onRefreshFeeds?: () => void;
}

type FeedManagerTab = "feeds" | "operations" | "diagnostics";
type CollectionView = "feeds" | "categories" | "add";

const normalizePersistedTab = (value?: string): FeedManagerTab => {
  if (value === "diagnostics") return "diagnostics";
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
  if (openProxySettings) return true;
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

const EditFeedDialog: React.FC<{
  isOpen: boolean;
  title: string;
  value: string;
  placeholder: string;
  submitLabel: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}> = ({
  isOpen,
  title,
  value,
  placeholder,
  submitLabel,
  onChange,
  onClose,
  onSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={title}
      initialFocus="input"
      zIndexClass="z-[9999]"
      bodyClassName="p-0"
    >
      <form
        className="flex flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="px-5 py-5">
          <input
            autoFocus
            className="w-full rounded-lg border border-[rgba(var(--color-border),0.18)] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] px-3 py-2 text-sm text-[rgb(var(--theme-manager-text,var(--color-text)))] outline-none transition focus:border-[rgb(var(--color-accentSurface))] focus:ring-2 focus:ring-[rgba(var(--color-accent),0.22)]"
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            value={value}
          />
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            className="rounded-lg border border-[rgba(var(--color-border),0.28)] px-4 py-2 text-sm font-semibold text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] transition hover:bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))]"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="rounded-lg border border-[rgb(var(--color-accentSurface))] bg-[rgb(var(--color-accentSurface))] px-4 py-2 text-sm font-bold text-[rgb(var(--color-onAccent))] transition hover:brightness-110"
            type="submit"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const FeedManagerStat: React.FC<{
  label: string;
  value: number;
  tone?: "neutral" | "success" | "danger";
}> = ({ label, value, tone = "neutral" }) => {
  const toneClass =
    tone === "success"
      ? "text-[rgb(var(--color-success))]"
      : tone === "danger"
        ? "text-[rgb(var(--color-error))]"
        : "text-[rgb(var(--theme-text-readable))]";

  return (
    <div className="rounded-[18px] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[rgb(var(--theme-text-secondary-readable))] opacity-60">
        {label}
      </div>
      <div className={`mt-1 text-lg font-black ${toneClass}`}>{value}</div>
    </div>
  );
};

const CollectionModeButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-sm font-black transition ${
      active
        ? "bg-[rgb(var(--theme-manager-bg,var(--color-background)))] text-[rgb(var(--theme-text-readable))] ring-1 ring-[rgba(var(--color-accent),0.28)]"
        : "bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] text-[rgb(var(--theme-text-secondary-readable))] hover:bg-[rgb(var(--theme-manager-soft,var(--color-surfaceElevated)))] hover:text-[rgb(var(--theme-text-readable))]"
    }`}
  >
    {children}
  </button>
);

const ManagerAreaHeader: React.FC<{
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}> = ({ eyebrow, title, description, actions }) => (
  <div className="bg-[rgb(var(--theme-manager-surface,var(--color-surface)))] px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.08)] sm:px-6">
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable))] opacity-55">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-base font-black text-[rgb(var(--theme-text-readable))]">
          {title}
        </h3>
        <p className="text-xs text-[rgb(var(--theme-text-secondary-readable))] opacity-70">
          {description}
        </p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  </div>
);

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
  const [collectionView, setCollectionView] = useState<CollectionView>("feeds");
  const [diagnosticsFocus, setDiagnosticsFocus] = useState<string | null>(null);
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedTitle, setNewFeedTitle] = useState("");
  const [newFeedCategory, setNewFeedCategory] = useState<string>("");
  const [processingUrl, setProcessingUrl] = useState<string | null>(null);
  const [feedValidations, setFeedValidations] = useState<
    Map<string, FeedValidationResult>
  >(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [, setDiscoveryProgress] = useState<
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
  const [editingFeedTitleUrl, setEditingFeedTitleUrl] = useState<string | null>(null);
  const [editTitleDraft, setEditTitleDraft] = useState("");

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
      if (parsed.openProxySettings) {
        setDiagnosticsFocus("proxy-health");
      } else if (parsed.section) {
        setDiagnosticsFocus(parsed.section);
      }
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

  const handleEditFeedTitle = (feedUrl: string) => {
    const feed = currentFeeds.find((item) => item.url === feedUrl);
    setEditingFeedTitleUrl(feedUrl);
    setEditTitleDraft(feed?.customTitle || "");
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

  const handleCloseEditTitleDialog = () => {
    setEditingFeedTitleUrl(null);
    setEditTitleDraft("");
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

  const handleSubmitEditTitleDialog = async () => {
    if (!editingFeedTitleUrl) return;
    const nextTitle = editTitleDraft.trim();
    setFeeds((prev) =>
      prev.map((feed) =>
        feed.url === editingFeedTitleUrl
          ? { ...feed, customTitle: nextTitle || undefined }
          : feed,
      ),
    );
    handleCloseEditTitleDialog();
    await alertSuccess("Nome do feed atualizado.");
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
            customTitle: newFeedTitle.trim() || result.title,
            categoryId: newFeedCategory || undefined,
          },
        ]);
        setNewFeedUrl("");
        setNewFeedTitle("");
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
          {
            url,
            customTitle: newFeedTitle.trim() || undefined,
            categoryId: newFeedCategory || undefined,
          },
        ]);
        setNewFeedUrl("");
        setNewFeedTitle("");
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
  const tabs: Array<{
    id: FeedManagerTab;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: "feeds",
      label: "Coleção",
      description: "Feeds, adicionar e categorias",
      icon: <Library className="h-4 w-4" />,
    },
    {
      id: "operations",
      label: "Operações",
      description: "Importação, manutenção e risco",
      icon: <Settings2 className="h-4 w-4" />,
    },
    {
      id: "diagnostics",
      label: "Diagnóstico",
      description: "Saúde de feeds, proxies e backend",
      icon: <Activity className="h-4 w-4" />,
      badge: invalidCount > 0 ? invalidCount : undefined,
    },
  ];

  return (
    <div
      className="relative flex min-h-full w-full flex-col overflow-visible bg-[rgb(var(--theme-manager-bg,var(--color-background)))] text-[rgb(var(--theme-manager-text,var(--color-text)))] lg:h-full lg:overflow-hidden"
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
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
        <aside className="bg-[rgb(var(--theme-manager-surface,var(--color-surface)))] shadow-[0_18px_44px_rgba(0,0,0,0.12)] lg:w-[292px]">
          <div className="flex h-full flex-col gap-5 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--theme-text-secondary-readable))] opacity-55">
                  Feed Manager
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-[rgb(var(--theme-text-readable))]">
                  {t("feeds.title")}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--theme-text-secondary-readable))] opacity-70">
                  Gerencie colecao, entrada, organizacao e infraestrutura em areas separadas.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--theme-manager-control))] text-[rgb(var(--theme-manager-text-secondary))] shadow-md transition-all hover:bg-[rgb(var(--theme-manager-soft))] hover:text-[rgb(var(--theme-manager-text))] active:scale-90"
                aria-label="Fechar"
                type="button"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
              <FeedManagerStat label="Total" value={currentFeeds.length} />
              <FeedManagerStat label="Validos" value={validCount} tone="success" />
              <FeedManagerStat label="Erros" value={invalidCount} tone="danger" />
            </div>

            <nav className="grid grid-cols-3 gap-2 lg:flex lg:flex-col" aria-label="Areas do gerenciador de feeds">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id !== "diagnostics") setDiagnosticsFocus(null);
                      if (tab.id === "feeds") setCollectionView("feeds");
                    }}
                    className={`group relative flex min-w-0 flex-col items-start gap-2 rounded-[22px] p-3 text-left transition-all sm:flex-row sm:gap-3 lg:min-w-0 ${
                      isActive
                        ? "bg-[rgb(var(--theme-manager-bg,var(--color-background)))] text-[rgb(var(--theme-text-readable))] shadow-[0_18px_46px_rgba(0,0,0,0.2)] ring-1 ring-[rgba(var(--color-accent),0.28)]"
                        : "text-[rgb(var(--theme-text-secondary-readable))] opacity-75 hover:bg-[rgb(var(--theme-manager-control))] hover:opacity-100"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition sm:mt-0.5 ${
                        isActive
                          ? "bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))]"
                          : "bg-[rgb(var(--theme-manager-control))] text-[rgb(var(--theme-text-readable))]"
                      }`}
                    >
                      {tab.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-black">{tab.label}</span>
                        {typeof tab.badge !== "undefined" && (
                          <span className="rounded-full bg-[rgba(var(--color-accent),0.14)] px-2 py-0.5 text-[10px] font-black text-[rgb(var(--color-accent))]">
                            {tab.badge}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug opacity-75">
                        {tab.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-visible lg:min-h-0 lg:overflow-hidden">
        {activeTab === "feeds" && (
          <div className="flex flex-col lg:h-full lg:overflow-hidden">
            <ManagerAreaHeader
              eyebrow="Colecao"
              title="Gestao da colecao"
              description="Fontes, categorias e organizacao do feed."
              actions={
                <>
                  <CollectionModeButton
                    active={collectionView === "feeds"}
                    onClick={() => setCollectionView("feeds")}
                  >
                    Feeds
                  </CollectionModeButton>
                  <CollectionModeButton
                    active={collectionView === "categories"}
                    onClick={() => setCollectionView("categories")}
                  >
                    Categorias
                  </CollectionModeButton>
                  <button
                    type="button"
                    onClick={() => setCollectionView("add")}
                    className={`rounded-full px-4 py-2 text-sm font-black transition ${
                      collectionView === "add"
                        ? "bg-[rgb(var(--color-accentSurface))] text-slate-950 shadow-[0_14px_34px_rgba(0,0,0,0.2)]"
                        : "bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] text-[rgb(var(--theme-text-readable))] hover:bg-[rgb(var(--theme-manager-soft,var(--color-surfaceElevated)))]"
                    }`}
                  >
                    + Adicionar
                  </button>
                </>
              }
            />

            <div className="flex-1 overflow-visible lg:min-h-0 lg:overflow-hidden">
              {collectionView === "feeds" && (
                <FeedListTab
                  feeds={currentFeeds}
                  validations={feedValidations}
                  categories={categories}
                  onRemove={handleRemoveFeed}
                  onRetry={validateSingleFeed}
                  onEdit={handleEditFeed}
                  onEditTitle={handleEditFeedTitle}
                  onShowError={handleShowError}
                  onMoveCategory={moveFeedToCategory}
                  onToggleHideFromAll={handleToggleHideFromAll}
                  onRefreshAll={onRefreshFeeds}
                  onConfirmRefreshAll={handleConfirmRefreshAll}
                  articles={articles}
                />
              )}

              {collectionView === "add" && (
                <FeedAddTab
                  categories={categories}
                  newFeedUrl={newFeedUrl}
                  setNewFeedUrl={setNewFeedUrl}
                  newFeedTitle={newFeedTitle}
                  setNewFeedTitle={setNewFeedTitle}
                  newFeedCategory={newFeedCategory}
                  setNewFeedCategory={setNewFeedCategory}
                  processingUrl={processingUrl}
                  onSubmit={handleAddFeed}
                  onImportOPML={() => fileInputRef.current?.click()}
                  onShowImportModal={() => setShowImportModal(true)}
                  feedCount={currentFeeds.length}
                />
              )}

              {collectionView === "categories" && (
                <div className="overflow-visible p-4 sm:p-6 lg:h-full lg:overflow-y-auto custom-scrollbar">
                  <div className="mx-auto w-full max-w-[1480px]">
              <FeedCategoryManager
                feeds={currentFeeds}
                setFeeds={setFeeds}
                onClose={() => setCollectionView("feeds")}
              />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "operations" && (
          <div className="flex flex-col lg:h-full lg:overflow-hidden">
            <ManagerAreaHeader
              eyebrow="Operacoes"
              title="Manutencao e intercambio"
              description="Importacao, exportacao e manutencao."
              actions={
                <>
                  <CollectionModeButton active={false} onClick={handleExportOPML}>
                    Exportar OPML
                  </CollectionModeButton>
                  <CollectionModeButton active={false} onClick={() => fileInputRef.current?.click()}>
                    Importar OPML
                  </CollectionModeButton>
                </>
              }
            />
            <div className="flex-1 overflow-visible lg:min-h-0 lg:overflow-hidden">
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
              />
            </div>
          </div>
        )}

        {activeTab === "diagnostics" && (
          <div className="flex flex-col lg:h-full lg:overflow-hidden">
            <ManagerAreaHeader
              eyebrow="Diagnostico"
              title="Saude, impacto e infraestrutura"
              description="Feeds, relatorios e rotas de conexao."
              actions={
                <CollectionModeButton active={false} onClick={() => void validateAllFeeds()}>
                  Revalidar feeds
                </CollectionModeButton>
              }
            />
            <div className="flex-1 overflow-visible custom-scrollbar p-4 sm:p-6 lg:min-h-0 lg:overflow-y-auto">
              <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6">
                <FeedAnalytics
                  feeds={currentFeeds}
                  articles={articles}
                  feedValidations={feedValidations}
                  focusSection={diagnosticsFocus || undefined}
                  onFocusConsumed={() => setDiagnosticsFocus(null)}
                />
              </div>
            </div>
          </div>
        )}
        </main>
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
                customTitle: newFeedTitle.trim() || feed.title,
                categoryId: newFeedCategory || undefined,
              },
            ]);
            setShowDiscoveryModal(false);
            setCurrentDiscoveryResult(null);
            setNewFeedTitle("");
            setNewFeedCategory("");
            await alertSuccess("Feed adicionado!");
          }}
        />
      )}

      <EditFeedDialog
        isOpen={!!editingFeedUrl}
        onChange={setEditUrlDraft}
        onClose={handleCloseEditDialog}
        onSubmit={() => void handleSubmitEditDialog()}
        placeholder="https://site.com/rss"
        submitLabel="Salvar"
        title="Editar URL do feed"
        value={editUrlDraft}
      />

      <EditFeedDialog
        isOpen={!!editingFeedTitleUrl}
        onChange={setEditTitleDraft}
        onClose={handleCloseEditTitleDialog}
        onSubmit={() => void handleSubmitEditTitleDialog()}
        placeholder="Nome exibido do feed"
        submitLabel="Salvar nome"
        title="Editar nome do feed"
        value={editTitleDraft}
      />

      <FeedCleanupModal
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        feeds={currentFeeds}
        onRemoveFeeds={(urls) =>
          setFeeds((prev) => prev.filter((f) => !urls.includes(f.url)))
        }
      />

      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        size="md"
        title="Importar listas curadas"
        description="Escolha uma lista pronta e decida se ela deve ser mesclada ou substituir sua coleção."
        tone="selection"
        zIndexClass="z-[9999]"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setShowImportModal(false)}
              className="rounded-lg border border-[rgba(var(--color-border),0.24)] px-4 py-2 text-sm font-semibold text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] transition hover:bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))]"
              type="button"
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleImportCurated("merge")}
              className="rounded-lg border border-[rgba(var(--color-accent),0.32)] bg-[rgb(var(--color-accentSurface))] px-4 py-2 text-sm font-bold text-[rgb(var(--color-onAccent))] transition hover:brightness-110"
              type="button"
            >
              Mesclar
            </button>
            <button
              onClick={() => void handleImportCurated("replace")}
              className="rounded-lg border border-rose-500/30 bg-rose-600/15 px-4 py-2 text-sm font-bold text-rose-300 transition hover:bg-rose-600/20"
              type="button"
            >
              Substituir tudo
            </button>
          </div>
        }
      >
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
            Lista
          </span>
          <select
            value={selectedListType}
            onChange={(e) => setSelectedListType(e.target.value)}
            className="w-full rounded-lg border border-[rgba(var(--color-border),0.24)] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] p-3 text-sm text-[rgb(var(--theme-manager-text,var(--color-text)))] outline-none transition focus:border-[rgb(var(--color-accentSurface))] focus:ring-2 focus:ring-[rgba(var(--color-accent),0.22)]"
          >
            {Object.keys(DEFAULT_CURATED_LISTS).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
      </Modal>

      <Modal
        isOpen={showErrorModal && !!selectedErrorFeed}
        onClose={() => setShowErrorModal(false)}
        size="2xl"
        title="Detalhes do erro"
        description="Veja o erro registrado para este feed e acesse o diagnóstico completo se precisar investigar a causa."
        tone="warning"
        zIndexClass="z-[9999]"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigateToDiagnostics("feed-status")}
              className="rounded-full border border-[rgba(var(--color-accent),0.24)] bg-[rgb(var(--color-accentSurface))] px-4 py-2 text-sm font-semibold text-[rgb(var(--color-onAccent))]"
            >
              Abrir diagnóstico completo
            </button>
          </div>
        }
      >
        {selectedErrorFeed && (
          <div className="space-y-4">
            <p className="font-mono text-sm text-red-400">
              {selectedErrorFeed.validation.error}
            </p>
            <div className="rounded-lg bg-[rgb(var(--color-background))]/40 p-4 font-mono text-sm break-all text-[rgb(var(--color-textSecondary))]">
              {selectedErrorFeed.url}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
