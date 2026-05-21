import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  ChevronDown,
  CircleCheck,
  FileText,
  FileUp,
  Library,
  ListPlus,
  Menu,
  Plus,
  ServerCog,
  Settings2,
  ShieldAlert,
  Tags,
  Wrench,
  X,
} from "lucide-react";
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
  buildImportCandidates,
  commitImportCandidates,
  normalizeCategoryName,
  type ImportCandidate,
} from "../services/opmlImportPreview";
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
import {
  buildDeleteAllFeedsConfirmation,
  buildRemoveFeedConfirmation,
  buildReplaceCuratedCollectionConfirmation,
  buildRestoreDefaultFeedsConfirmation,
} from "../utils/feedDangerConfirmation";
import { DEFAULT_FEEDS } from "../constants/curatedFeeds";
import { DEFAULT_CURATED_LISTS } from "../config/defaultConfig";
import { FeedDuplicateModal } from "./FeedDuplicateModal";
import { FeedAddTab } from "./FeedManager/FeedAddTab";
import { FeedListTab } from "./FeedManager/FeedListTab";
import { OpmlImportPreviewModal } from "./FeedManager/OpmlImportPreviewModal";
import { FeedQuarantineTab } from "./FeedManager/FeedQuarantineTab";
import { FeedToolsTab } from "./FeedManager/FeedToolsTab";
import { FeedAnalytics } from "./FeedAnalytics";
import { Modal } from "./Modal";
import {
  type FeedErrorHistoryItem,
  isFeedActive,
  isFeedQuarantined,
  markFeedInactive,
  quarantineFeed,
  restoreQuarantinedFeed,
  shouldRecommendQuarantine,
  updateQuarantineAfterValidation,
} from "../utils/feedQuarantine";

interface FeedManagerProps {
  currentFeeds: FeedSource[];
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  closeModal: () => void;
  articles?: Article[];
  onRefreshFeeds?: () => void;
}

type CollectionView = "feeds" | "categories" | "add" | "quarantine";
type FeedManagerArea = "feeds" | "operations" | "diagnostics";
type FeedManagerRoute =
  | "feeds:overview"
  | "feeds:list"
  | "feeds:add"
  | "feeds:categories"
  | "feeds:quarantine"
  | "operations:overview"
  | "operations:io"
  | "operations:curated"
  | "operations:maintenance"
  | "operations:risk"
  | "diagnostics:overview"
  | "diagnostics:health"
  | "diagnostics:infra"
  | "diagnostics:reports";

const routeAreaMap: Record<FeedManagerRoute, FeedManagerArea> = {
  "feeds:overview": "feeds",
  "feeds:list": "feeds",
  "feeds:add": "feeds",
  "feeds:categories": "feeds",
  "feeds:quarantine": "feeds",
  "operations:overview": "operations",
  "operations:io": "operations",
  "operations:curated": "operations",
  "operations:maintenance": "operations",
  "operations:risk": "operations",
  "diagnostics:overview": "diagnostics",
  "diagnostics:health": "diagnostics",
  "diagnostics:infra": "diagnostics",
  "diagnostics:reports": "diagnostics",
};

const routeCollectionViewMap: Partial<Record<FeedManagerRoute, CollectionView>> =
  {
    "feeds:list": "feeds",
    "feeds:add": "add",
    "feeds:categories": "categories",
    "feeds:quarantine": "quarantine",
  };

const normalizePersistedRoute = (
  value?: string,
  section?: string,
  openProxySettings?: boolean,
): FeedManagerRoute => {
  if (openProxySettings || section === "proxy-health") {
    return "diagnostics:infra";
  }
  if (section === "feed-reports") return "diagnostics:reports";
  if (
    section === "diagnostics" ||
    section === "feed-status" ||
    section === "diagnosis" ||
    section === "affected"
  ) {
    return "diagnostics:health";
  }

  if (
    value === "feeds:overview" ||
    value === "feeds:list" ||
    value === "feeds:add" ||
    value === "feeds:categories" ||
    value === "feeds:quarantine" ||
    value === "operations:overview" ||
    value === "operations:io" ||
    value === "operations:curated" ||
    value === "operations:maintenance" ||
    value === "operations:risk" ||
    value === "diagnostics:overview" ||
    value === "diagnostics:health" ||
    value === "diagnostics:infra" ||
    value === "diagnostics:reports"
  ) {
    return value;
  }

  if (value === "diagnostics") return "diagnostics:health";
  if (
    value === "operations" ||
    value === "statistics" ||
    value === "functions"
  ) {
    return "operations:overview";
  }
  if (value === "add") return "feeds:add";
  if (value === "categories") return "feeds:categories";
  if (value === "quarantine") return "feeds:quarantine";

  return "feeds:overview";
};

const readFeedErrorHistory = (): FeedErrorHistoryItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem("feed-error-history");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item?.url))
      .map((item) => ({
        url: String(item.url),
        failures: Number(item.failures || 1),
        lastError: Number(item.lastError || Date.now()),
        lastErrorType: String(item.lastErrorType || "unknown"),
      }));
  } catch {
    return [];
  }
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

const FeedManagerHeaderMetric: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "neutral" | "success" | "danger";
}> = ({ label, value, icon, tone = "neutral" }) => {
  const toneClass =
    tone === "success"
      ? "text-[rgb(var(--color-success))]"
      : tone === "danger"
        ? "text-[rgb(var(--color-error))]"
        : "text-[rgb(var(--theme-text-readable))]";

  return (
    <div className="flex min-w-[8.5rem] items-center gap-3 rounded-2xl bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--theme-manager-bg,var(--color-background)))] text-[rgb(var(--theme-text-secondary-readable))]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-[rgb(var(--theme-text-secondary-readable))] opacity-60">
          {label}
        </span>
        <span className={`block text-lg font-black leading-tight ${toneClass}`}>
          {value}
        </span>
      </span>
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
  metrics?: React.ReactNode;
}> = ({ eyebrow, title, description, actions, metrics }) => (
  <div className="sticky top-0 z-20 bg-[rgb(var(--theme-manager-surface,var(--color-surface)))]/95 px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:px-6">
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
      <div className="min-w-0">
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
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        {metrics && (
          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">{metrics}</div>
        )}
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  </div>
);

const FeedManagerSidebarButton: React.FC<{
  active: boolean;
  badge?: number;
  collapsed: boolean;
  description: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ active, badge, collapsed, description, icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={collapsed ? `${label}: ${description}` : undefined}
    aria-label={`${label}. ${description}`}
    className={`group flex w-full min-w-0 items-center gap-2.5 rounded-2xl text-left transition-all ${
      collapsed ? "justify-center px-2 py-2.5" : "px-2.5 py-2"
    } ${
      active
        ? "bg-[rgb(var(--theme-manager-bg,var(--color-background)))] text-[rgb(var(--theme-text-readable))] shadow-[0_12px_28px_rgba(0,0,0,0.14)]"
        : "text-[rgb(var(--theme-text-secondary-readable))] opacity-72 hover:bg-[rgb(var(--theme-manager-control))] hover:text-[rgb(var(--theme-text-readable))] hover:opacity-100"
    }`}
  >
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
        active
          ? "bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))]"
          : "bg-[rgb(var(--theme-manager-control))] text-[rgb(var(--theme-text-readable))]"
      }`}
    >
      {icon}
    </span>
    <span className={`min-w-0 flex-1 ${collapsed ? "sr-only" : ""}`}>
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-black">{label}</span>
        {typeof badge !== "undefined" && badge > 0 && (
          <span className="rounded-full bg-[rgba(var(--color-accent),0.14)] px-2 py-0.5 text-[10px] font-black text-[rgb(var(--color-accent))]">
            {badge}
          </span>
        )}
      </span>
      <span className="mt-0.5 block text-[11px] leading-snug opacity-72">
        {description}
      </span>
    </span>
  </button>
);

const FeedManagerInsight: React.FC<{
  label: string;
  value: React.ReactNode;
  description: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}> = ({ label, value, description, tone = "neutral" }) => {
  const toneClass =
    tone === "success"
      ? "text-[rgb(var(--color-success))]"
      : tone === "warning"
        ? "text-[rgb(var(--color-warning))]"
        : tone === "danger"
          ? "text-[rgb(var(--color-error))]"
          : "text-[rgb(var(--theme-text-readable))]";

  return (
    <div className="rounded-[24px] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[rgb(var(--theme-text-secondary-readable))] opacity-55">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black leading-none ${toneClass}`}>
        {value}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))] opacity-72">
        {description}
      </p>
    </div>
  );
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
  const { confirm, alertSuccess, alertError, confirmDanger, confirmWarning } =
    useNotificationReplacements();

  const [activeRoute, setActiveRoute] =
    useState<FeedManagerRoute>("feeds:overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedAreas, setExpandedAreas] = useState<
    Record<FeedManagerArea, boolean>
  >({
    feeds: true,
    operations: true,
    diagnostics: true,
  });
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
  const [showOpmlPreview, setShowOpmlPreview] = useState(false);
  const [opmlPreviewCandidates, setOpmlPreviewCandidates] = useState<
    ImportCandidate[]
  >([]);
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
  const activeFeeds = React.useMemo(
    () => currentFeeds.filter(isFeedActive),
    [currentFeeds],
  );
  const activeArea = routeAreaMap[activeRoute];
  const collectionView = routeCollectionViewMap[activeRoute] || "feeds";

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showImportModal && !selectedListType) {
      const firstList = Object.keys(DEFAULT_CURATED_LISTS)[0];
      if (!firstList) return;
      const frameId = requestAnimationFrame(() => {
        setSelectedListType(firstList);
      });
      return () => cancelAnimationFrame(frameId);
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

      const frameId = requestAnimationFrame(() => {
        setActiveRoute(
          normalizePersistedRoute(
            parsed.tab,
            parsed.section,
            parsed.openProxySettings,
          ),
        );
        if (parsed.openProxySettings) {
          setDiagnosticsFocus("proxy-health");
        } else if (parsed.section) {
          setDiagnosticsFocus(parsed.section);
        }
      });
      return () => cancelAnimationFrame(frameId);
    } catch {
      // Ignore malformed state.
    } finally {
      window.sessionStorage.removeItem("feed-manager-focus");
    }
  }, []);

  const validateAllFeeds = React.useCallback(async () => {
    if (isValidating) return;
    setIsValidating(true);
    const urls = activeFeeds.map((feed) => feed.url);

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
  }, [activeFeeds, isValidating, logger]);

  useEffect(() => {
    if (
      activeFeeds.length > 0 &&
      (activeArea === "feeds" || activeArea === "diagnostics")
    ) {
      const frameId = requestAnimationFrame(() => {
        void validateAllFeeds();
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [activeArea, activeFeeds.length, validateAllFeeds]);

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
    const feed = currentFeeds.find((item) => item.url === urlToRemove) || {
      url: urlToRemove,
    };
    if (await confirmDanger(buildRemoveFeedConfirmation(feed))) {
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
          buildReplaceCuratedCollectionConfirmation({
            currentFeeds,
            replacementFeeds: feedsToImport,
            listName: selectedListType,
          }),
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
    const defaultFeeds = resetToDefaultFeeds();
    if (
      await confirmDanger(
        buildRestoreDefaultFeedsConfirmation({
          currentFeeds,
          defaultFeeds,
        }),
      )
    ) {
      setFeeds(defaultFeeds);
      refreshAppearance();
      await alertSuccess("Feeds resetados com sucesso!");
    }
  };

  const handleDeleteAll = async () => {
    if (currentFeeds.length === 0) return;
    if (await confirmDanger(buildDeleteAllFeedsConfirmation(currentFeeds))) {
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
      if (opmlFeeds.length === 0) {
        await alertError("Nenhum feed encontrado neste arquivo OPML.");
        return;
      }

      const candidates = buildImportCandidates({
        opmlFeeds,
        currentFeeds,
        categories,
      });
      setOpmlPreviewCandidates(candidates);
      setShowOpmlPreview(true);
    } catch {
      await alertError("Falha ao processar arquivo OPML");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const getQuarantineReason = React.useCallback(
    (url: string) => {
      const validation = feedValidations.get(url);
      const history = readFeedErrorHistory().find((item) => item.url === url);
      const failures = history?.failures || 0;
      const detail =
        validation?.diagnostics?.summary ||
        validation?.error ||
        history?.lastErrorType ||
        "falhas recorrentes";
      const effectiveFailures = Math.max(1, failures);
      return {
        reason: `${effectiveFailures} falha${effectiveFailures === 1 ? "" : "s"}: ${detail}`,
        failureCountAtEntry: failures,
        lastErrorType: validation?.status || history?.lastErrorType,
        lastError: validation?.error || detail,
      };
    },
    [feedValidations],
  );

  const handleQuarantineFeed = React.useCallback(
    async (url: string) => {
      const feed = currentFeeds.find((item) => item.url === url);
      if (!feed || isFeedQuarantined(feed)) return;
      const confirmed = await confirmWarning(
        "Colocar este feed em quarentena? Ele sairá das categorias e do carregamento, mas poderá ser testado e restaurado depois.",
        "Quarentenar feed",
      );
      if (!confirmed) return;

      const reason = getQuarantineReason(url);
      setFeeds((prev) =>
        prev.map((item) =>
          item.url === url ? quarantineFeed(item, reason) : item,
        ),
      );
      await alertSuccess("Feed enviado para quarentena.");
    },
    [alertSuccess, confirmWarning, currentFeeds, getQuarantineReason, setFeeds],
  );

  const handleQuarantineFeeds = React.useCallback(
    (urls: string[]) => {
      const urlSet = new Set(urls);
      setFeeds((prev) =>
        prev.map((feed) =>
          urlSet.has(feed.url) && !isFeedQuarantined(feed)
            ? quarantineFeed(feed, getQuarantineReason(feed.url))
            : feed,
        ),
      );
    },
    [getQuarantineReason, setFeeds],
  );

  const handleValidateQuarantinedFeed = React.useCallback(
    async (url: string) => {
      const result = await validateSingleFeed(url);
      if (!result) {
        await alertError("Não foi possível validar este feed.");
        return;
      }

      let nextFeed: FeedSource | undefined;
      setFeeds((prev) =>
        prev.map((feed) => {
          if (feed.url !== url) return feed;
          nextFeed = updateQuarantineAfterValidation(feed, {
            isValid: result.isValid,
            status: result.status,
            error: result.error,
          });
          return nextFeed;
        }),
      );

      if (result.isValid) {
        const successes = (nextFeed?.quarantine?.recoverySuccesses || 0);
        if (successes >= 2) {
          await alertSuccess("Feed recuperado. Você já pode restaurá-lo.");
        } else {
          await alertSuccess("Feed validado. Mais uma validação libera a restauração recomendada.");
        }
        return;
      }

      await alertError("O feed ainda falhou na validação.");
    },
    [alertError, alertSuccess, setFeeds],
  );

  const handleRestoreQuarantinedFeed = React.useCallback(
    async (url: string) => {
      const confirmed = await confirmWarning(
        "Restaurar este feed para a coleção ativa?",
        "Restaurar feed",
      );
      if (!confirmed) return;
      setFeeds((prev) =>
        prev.map((feed) =>
          feed.url === url ? restoreQuarantinedFeed(feed) : feed,
        ),
      );
      await alertSuccess("Feed restaurado para a coleção ativa.");
    },
    [alertSuccess, confirmWarning, setFeeds],
  );

  const handleMarkFeedInactive = React.useCallback(
    async (url: string) => {
      const confirmed = await confirmWarning(
        "Marcar este feed como inativo? Ele continuará preservado, mas fora da circulação.",
        "Marcar inativo",
      );
      if (!confirmed) return;
      setFeeds((prev) =>
        prev.map((feed) => (feed.url === url ? markFeedInactive(feed) : feed)),
      );
      await alertSuccess("Feed marcado como inativo.");
    },
    [alertSuccess, confirmWarning, setFeeds],
  );

  const handleConfirmOpmlImport = async (candidates: ImportCandidate[]) => {
    const firstPass = commitImportCandidates({
      candidates,
      currentFeeds,
      categories,
    });
    const categoryIdsByName: Record<string, string> = {};

    firstPass.categoriesToCreate.forEach((categoryName) => {
      const createdCategory = createCategory(categoryName, "#6B7280");
      categoryIdsByName[normalizeCategoryName(categoryName)] =
        createdCategory.id;
    });

    const result = commitImportCandidates({
      candidates,
      currentFeeds,
      categories,
      categoryIdsByName,
    });

    if (result.feedsToAdd.length > 0) {
      setFeeds((prev) => [...prev, ...result.feedsToAdd]);
    }

    setShowOpmlPreview(false);
    setOpmlPreviewCandidates([]);
    await alertSuccess(
      `${result.feedsToAdd.length} feeds importados. ${result.skipped.length} ignorados. ${result.failed.length} falharam.`,
    );
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
        const fallbackTitle =
          newFeedTitle.trim() ||
          result.title ||
          (new URL(url).hostname.replace(/^www\./, "") === "science.org"
            ? "Science"
            : undefined);
        setFeeds((prev) => [
          ...prev,
          {
            url,
            customTitle: fallbackTitle,
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
    if (sectionId === "proxy-health") {
      setActiveRoute("diagnostics:infra");
    } else if (sectionId === "feed-reports") {
      setActiveRoute("diagnostics:reports");
    } else {
      setActiveRoute("diagnostics:health");
    }
    if (sectionId) {
      setDiagnosticsFocus(sectionId);
    }
  };

  const validCount = Array.from(feedValidations.values()).filter(
    (v) => v.isValid,
  ).length;
  const invalidCount = Array.from(feedValidations.values()).filter(
    (v) => !v.isValid,
  ).length;
  const quarantineCount = currentFeeds.filter(isFeedQuarantined).length;
  const quarantineRecommendedUrls = new Set(
    currentFeeds
      .filter((feed) =>
        shouldRecommendQuarantine({
          feed,
          history: readFeedErrorHistory().find((item) => item.url === feed.url),
          isValid: feedValidations.get(feed.url)?.isValid,
        }),
      )
      .map((feed) => feed.url),
  );
  const navigationGroups: Array<{
    id: FeedManagerArea;
    label: string;
    description: string;
    overviewRoute: FeedManagerRoute;
    icon: React.ReactNode;
    items: Array<{
      route: FeedManagerRoute;
      label: string;
      description: string;
      icon: React.ReactNode;
      badge?: number;
      focusSection?: string;
    }>;
  }> = [
    {
      id: "feeds",
      label: "Coleção",
      description: "Fontes, entrada e organização",
      overviewRoute: "feeds:overview",
      icon: <Library className="h-4 w-4" />,
      items: [
        {
          route: "feeds:list",
          label: "Feeds",
          description: "Lista, busca e status",
          icon: <Library className="h-4 w-4" />,
        },
        {
          route: "feeds:add",
          label: "Adicionar",
          description: "Novo feed e OPML",
          icon: <Plus className="h-4 w-4" />,
        },
        {
          route: "feeds:categories",
          label: "Categorias",
          description: "Organização visual",
          icon: <Tags className="h-4 w-4" />,
        },
        {
          route: "feeds:quarantine",
          label: "Quarentena",
          description: "Feeds preservados fora da carga",
          icon: <ShieldAlert className="h-4 w-4" />,
          badge: quarantineCount > 0 ? quarantineCount : undefined,
        },
      ],
    },
    {
      id: "operations",
      label: "Operações",
      description: "Intercâmbio, reparos e risco",
      overviewRoute: "operations:overview",
      icon: <Settings2 className="h-4 w-4" />,
      items: [
        {
          route: "operations:io",
          label: "Importar/Exportar",
          description: "OPML e backups de coleção",
          icon: <FileUp className="h-4 w-4" />,
        },
        {
          route: "operations:curated",
          label: "Listas curadas",
          description: "Coleções prontas",
          icon: <ListPlus className="h-4 w-4" />,
        },
        {
          route: "operations:maintenance",
          label: "Manutenção",
          description: "Reparos controlados",
          icon: <Wrench className="h-4 w-4" />,
        },
        {
          route: "operations:risk",
          label: "Zona de risco",
          description: "Ações destrutivas",
          icon: <AlertTriangle className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "diagnostics",
      label: "Diagnóstico",
      description: "Saúde, infraestrutura e relatórios",
      overviewRoute: "diagnostics:overview",
      icon: <BarChart3 className="h-4 w-4" />,
      items: [
        {
          route: "diagnostics:health",
          label: "Saúde dos feeds",
          description: "Erros, impacto e status",
          icon: <Activity className="h-4 w-4" />,
          badge: invalidCount > 0 ? invalidCount : undefined,
          focusSection: "feed-status",
        },
        {
          route: "diagnostics:infra",
          label: "Infraestrutura",
          description: "Backend, proxies e rotas",
          icon: <ServerCog className="h-4 w-4" />,
          focusSection: "proxy-health",
        },
        {
          route: "diagnostics:reports",
          label: "Relatórios",
          description: "Exportação de diagnóstico",
          icon: <FileText className="h-4 w-4" />,
          focusSection: "feed-reports",
        },
      ],
    },
  ];
  const routeContent: Record<
    FeedManagerRoute,
    { eyebrow: string; title: string; description: string }
  > = {
    "feeds:overview": {
      eyebrow: "Coleção",
      title: "Painel da coleção",
      description: "Resumo dos feeds, entrada, categorias e quarentena.",
    },
    "feeds:list": {
      eyebrow: "Coleção",
      title: "Feeds cadastrados",
      description: "Revise fontes, status, categorias e circulação no All.",
    },
    "feeds:add": {
      eyebrow: "Coleção",
      title: "Adicionar fonte",
      description: "Inclua uma URL, importe OPML ou abra listas curadas.",
    },
    "feeds:categories": {
      eyebrow: "Coleção",
      title: "Categorias",
      description: "Organize grupos, cores e layouts específicos.",
    },
    "feeds:quarantine": {
      eyebrow: "Coleção",
      title: "Quarentena",
      description: "Teste, restaure ou remova feeds fora da circulação.",
    },
    "operations:io": {
      eyebrow: "Operações",
      title: "Importação e exportação",
      description: "Intercâmbio de coleção via OPML e fluxos curados.",
    },
    "operations:overview": {
      eyebrow: "Operações",
      title: "Painel de operações",
      description: "Acesso direto aos fluxos de intercâmbio, manutenção e risco.",
    },
    "operations:curated": {
      eyebrow: "Operações",
      title: "Listas curadas",
      description: "Mescle ou substitua coleções prontas com confirmação.",
    },
    "operations:maintenance": {
      eyebrow: "Operações",
      title: "Manutenção",
      description: "Reparos e restauração da base inicial.",
    },
    "operations:risk": {
      eyebrow: "Operações",
      title: "Zona de risco",
      description: "Ações destrutivas permanecem isoladas e confirmadas.",
    },
    "diagnostics:health": {
      eyebrow: "Diagnóstico",
      title: "Saúde dos feeds",
      description: "Status de validação, causas prováveis e impacto.",
    },
    "diagnostics:overview": {
      eyebrow: "Diagnóstico",
      title: "Painel de diagnóstico",
      description: "Resumo de saúde, infraestrutura e relatórios de suporte.",
    },
    "diagnostics:infra": {
      eyebrow: "Diagnóstico",
      title: "Infraestrutura",
      description: "Backend local, proxies e rotas de conexão.",
    },
    "diagnostics:reports": {
      eyebrow: "Diagnóstico",
      title: "Relatórios",
      description: "Exportação de diagnóstico e dados de suporte.",
    },
  };
  const activeRouteContent = routeContent[activeRoute];
  const headerMetrics = (
    <>
      <FeedManagerHeaderMetric
        icon={<Boxes className="h-4 w-4" />}
        label="Total"
        value={currentFeeds.length}
      />
      <FeedManagerHeaderMetric
        icon={<CircleCheck className="h-4 w-4" />}
        label="Válidos"
        tone="success"
        value={validCount}
      />
      <FeedManagerHeaderMetric
        icon={<AlertTriangle className="h-4 w-4" />}
        label="Erros"
        tone="danger"
        value={invalidCount}
      />
      <FeedManagerHeaderMetric
        icon={<ShieldAlert className="h-4 w-4" />}
        label="Quarentena"
        value={quarantineCount}
      />
    </>
  );

  const selectAreaOverview = (group: {
    id: FeedManagerArea;
    overviewRoute: FeedManagerRoute;
  }) => {
    setActiveRoute(group.overviewRoute);
    setDiagnosticsFocus(null);
    setExpandedAreas((current) => ({
      ...current,
      [group.id]: true,
    }));
  };

  const toggleArea = (area: FeedManagerArea) => {
    setExpandedAreas((current) => ({
      ...current,
      [area]: !current[area],
    }));
  };

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
      <header className="flex h-auto shrink-0 flex-col gap-3 bg-[rgb(var(--theme-manager-surface,var(--color-surface)))]/95 px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:px-6 lg:min-h-[76px] lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--theme-text-secondary-readable))] opacity-55">
            Centro operacional
          </p>
          <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-[rgb(var(--theme-text-readable))]">
            Gerenciador de feeds
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))] opacity-70">
            Navegação recolhível, painéis por área e ações isoladas por tarefa.
          </p>
        </div>
      </header>

      <div
        className={`grid flex-1 grid-cols-1 overflow-hidden transition-[grid-template-columns] duration-200 lg:min-h-0 ${
          sidebarCollapsed
            ? "lg:grid-cols-[minmax(0,1fr)_5.25rem]"
            : "lg:grid-cols-[minmax(0,1fr)_22rem]"
        }`}
      >
        <main className="order-2 min-h-0 min-w-0 overflow-hidden lg:order-1">
        {activeArea === "feeds" && (
          <div className="flex flex-col lg:h-full lg:overflow-hidden">
            <ManagerAreaHeader
              eyebrow={activeRouteContent.eyebrow}
              title={activeRouteContent.title}
              description={activeRouteContent.description}
              metrics={headerMetrics}
              actions={
                <>
                  {activeRoute !== "feeds:add" && (
                    <CollectionModeButton
                      active={false}
                      onClick={() => setActiveRoute("feeds:add")}
                    >
                      Adicionar feed
                    </CollectionModeButton>
                  )}
                  {collectionView === "feeds" && onRefreshFeeds && (
                    <CollectionModeButton active={false} onClick={handleConfirmRefreshAll}>
                      Revalidar
                    </CollectionModeButton>
                  )}
                  {collectionView === "categories" && (
                    <CollectionModeButton
                      active={false}
                      onClick={() => setActiveRoute("feeds:overview")}
                    >
                      Voltar ao painel
                    </CollectionModeButton>
                  )}
                </>
              }
            />

            <div className="flex-1 overflow-visible lg:min-h-0 lg:overflow-hidden">
              {activeRoute === "feeds:overview" && (
                <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
                  <div className="mx-auto w-full max-w-[1480px] space-y-5">
                    <section className="rounded-[28px] bg-[rgb(var(--theme-manager-surface,var(--color-surface)))] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.13),inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-6">
                      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] xl:items-stretch">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable))] opacity-55">
                            Síntese
                          </p>
                          <h3 className="mt-1 text-xl font-black text-[rgb(var(--theme-text-readable))]">
                            Coleção em circulação
                          </h3>
                          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))] opacity-72">
                            A coleção está dividida entre fontes ativas, organização por categoria e uma área separada para feeds retirados da carga principal.
                          </p>
                          <div className="mt-5 flex flex-wrap gap-2">
                            <CollectionModeButton active={false} onClick={() => setActiveRoute("feeds:list")}>
                              Revisar feeds
                            </CollectionModeButton>
                            <CollectionModeButton active={false} onClick={() => setActiveRoute("feeds:add")}>
                              Adicionar fonte
                            </CollectionModeButton>
                            <CollectionModeButton active={false} onClick={() => setActiveRoute("feeds:categories")}>
                              Organizar categorias
                            </CollectionModeButton>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <FeedManagerInsight
                            label="Cobertura"
                            value={`${activeFeeds.length}/${currentFeeds.length}`}
                            description="feeds ativos em relação ao total salvo."
                          />
                          <FeedManagerInsight
                            label="Organização"
                            value={categories.length}
                            description="categorias disponíveis para roteamento."
                          />
                          <FeedManagerInsight
                            label="Atenção"
                            value={invalidCount}
                            description="feeds com validação problemática."
                            tone={invalidCount > 0 ? "danger" : "success"}
                          />
                          <FeedManagerInsight
                            label="Fora da carga"
                            value={quarantineCount}
                            description="feeds preservados em quarentena."
                            tone={quarantineCount > 0 ? "warning" : "neutral"}
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {activeRoute !== "feeds:overview" && collectionView === "feeds" && (
                <FeedListTab
                  feeds={activeFeeds}
                  validations={feedValidations}
                  categories={categories}
                  onRemove={handleRemoveFeed}
                  onRetry={validateSingleFeed}
                  onEdit={handleEditFeed}
                  onEditTitle={handleEditFeedTitle}
                  onShowError={handleShowError}
                  onMoveCategory={moveFeedToCategory}
                  onToggleHideFromAll={handleToggleHideFromAll}
                  onQuarantineFeed={(url) => void handleQuarantineFeed(url)}
                  quarantineRecommendedUrls={quarantineRecommendedUrls}
                  onRefreshAll={onRefreshFeeds}
                  onConfirmRefreshAll={handleConfirmRefreshAll}
                  articles={articles}
                />
              )}

              {activeRoute !== "feeds:overview" && collectionView === "add" && (
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

              {activeRoute !== "feeds:overview" && collectionView === "categories" && (
                <div className="overflow-visible p-4 sm:p-6 lg:h-full lg:overflow-y-auto custom-scrollbar">
                  <div className="mx-auto w-full max-w-[1480px]">
              <FeedCategoryManager
                feeds={currentFeeds}
                setFeeds={setFeeds}
                onClose={() => setActiveRoute("feeds:overview")}
              />
                  </div>
                </div>
              )}

              {activeRoute !== "feeds:overview" && collectionView === "quarantine" && (
                <FeedQuarantineTab
                  feeds={currentFeeds}
                  onValidate={(url) => void handleValidateQuarantinedFeed(url)}
                  onRestore={(url) => void handleRestoreQuarantinedFeed(url)}
                  onMarkInactive={(url) => void handleMarkFeedInactive(url)}
                  onRemove={(url) => void handleRemoveFeed(url)}
                />
              )}
            </div>
          </div>
        )}

        {activeArea === "operations" && (
          <div className="flex flex-col lg:h-full lg:overflow-hidden">
            <ManagerAreaHeader
              eyebrow={activeRouteContent.eyebrow}
              title={activeRouteContent.title}
              description={activeRouteContent.description}
              metrics={headerMetrics}
              actions={
                activeRoute === "operations:overview" ||
                activeRoute === "operations:io" ? (
                  <>
                  <CollectionModeButton active={false} onClick={handleExportOPML}>
                    Exportar OPML
                  </CollectionModeButton>
                  <CollectionModeButton active={false} onClick={() => fileInputRef.current?.click()}>
                    Importar OPML
                  </CollectionModeButton>
                  </>
                ) : null
              }
            />
            <div className="flex-1 overflow-visible lg:min-h-0 lg:overflow-hidden">
              <FeedToolsTab
                view={
                  activeRoute === "operations:io"
                    ? "io"
                    : activeRoute === "operations:curated"
                      ? "curated"
                      : activeRoute === "operations:maintenance"
                        ? "maintenance"
                        : activeRoute === "operations:risk"
                          ? "risk"
                          : "overview"
                }
                onExportOPML={handleExportOPML}
                onImportOPML={() => fileInputRef.current?.click()}
                onShowImportModal={() => setShowImportModal(true)}
                onResetDefaults={handleResetToDefaults}
                onCleanupErrors={() => setShowCleanupModal(true)}
                onDeleteAll={handleDeleteAll}
                onOpenIo={() => setActiveRoute("operations:io")}
                onOpenCurated={() => setActiveRoute("operations:curated")}
                onOpenMaintenance={() => setActiveRoute("operations:maintenance")}
                onOpenRisk={() => setActiveRoute("operations:risk")}
                feedCount={currentFeeds.length}
                validCount={validCount}
                invalidCount={invalidCount}
              />
            </div>
          </div>
        )}

        {activeArea === "diagnostics" && (
          <div className="flex flex-col lg:h-full lg:overflow-hidden">
            <ManagerAreaHeader
              eyebrow={activeRouteContent.eyebrow}
              title={activeRouteContent.title}
              description={activeRouteContent.description}
              metrics={headerMetrics}
              actions={
                <CollectionModeButton active={false} onClick={() => void validateAllFeeds()}>
                  Revalidar feeds
                </CollectionModeButton>
              }
            />
            <div className="flex-1 overflow-visible custom-scrollbar p-4 sm:p-6 lg:min-h-0 lg:overflow-y-auto">
              <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6">
                <FeedAnalytics
                  feeds={activeFeeds}
                  articles={articles}
                  feedValidations={feedValidations}
                  view={
                    activeRoute === "diagnostics:health"
                      ? "health"
                      : activeRoute === "diagnostics:infra"
                        ? "infra"
                        : activeRoute === "diagnostics:reports"
                          ? "reports"
                          : "overview"
                  }
                  focusSection={diagnosticsFocus || undefined}
                  onFocusConsumed={() => setDiagnosticsFocus(null)}
                  quarantineRecommendedUrls={quarantineRecommendedUrls}
                  onQuarantineFeed={(url) => void handleQuarantineFeed(url)}
                />
              </div>
            </div>
          </div>
        )}
        </main>

        <aside className="order-1 min-h-0 min-w-0 bg-[rgb(var(--theme-manager-surface,var(--color-surface)))]/92 shadow-[0_18px_44px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:order-2">
          <div className={`flex h-full flex-col gap-4 overflow-y-auto custom-scrollbar ${sidebarCollapsed ? "p-3" : "p-4 sm:p-5"}`}>
            <div className={`flex items-center gap-2 ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
              <div className={sidebarCollapsed ? "sr-only" : "min-w-0"}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable))] opacity-55">
                  Navegação
                </p>
                <p className="mt-1 truncate text-sm font-black text-[rgb(var(--theme-text-readable))]">
                  Áreas e funções
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((current) => !current)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] text-[rgb(var(--theme-text-secondary-readable))] transition hover:bg-[rgb(var(--theme-manager-soft,var(--color-surfaceElevated)))] hover:text-[rgb(var(--theme-text-readable))]"
                  aria-label={sidebarCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
                  title={sidebarCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
                >
                  <Menu className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={closeModal}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(var(--theme-manager-control))] text-[rgb(var(--theme-manager-text-secondary))] transition hover:bg-[rgb(var(--theme-manager-soft))] hover:text-[rgb(var(--theme-manager-text))] active:scale-95"
                  aria-label="Fechar gerenciador de feeds"
                  title="Fechar gerenciador de feeds"
                  type="button"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
            <nav className="flex flex-col gap-3" aria-label="Navegação do gerenciador de feeds">
              {navigationGroups.map((group) => (
                <section
                  key={group.id}
                  className={`rounded-[24px] bg-[rgb(var(--theme-manager-bg,var(--color-background)))]/55 ${
                    sidebarCollapsed ? "p-1.5" : "p-2"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => selectAreaOverview(group)}
                      title={sidebarCollapsed ? `${group.label}: ${group.description}` : undefined}
                      className={`group flex min-w-0 flex-1 items-center gap-3 rounded-[20px] px-3.5 py-3 text-left transition-all ${
                        activeArea === group.id &&
                        activeRoute === group.overviewRoute
                          ? "bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] text-[rgb(var(--theme-text-readable))] shadow-[0_14px_30px_rgba(0,0,0,0.16)]"
                          : "text-[rgb(var(--theme-text-secondary-readable))] hover:bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] hover:text-[rgb(var(--theme-text-readable))]"
                      } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                      aria-label={`${group.label}. ${group.description}`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          activeArea === group.id
                            ? "bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))]"
                            : "bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))]"
                        }`}
                      >
                        {group.icon}
                      </span>
                      <span className={`min-w-0 flex-1 ${sidebarCollapsed ? "sr-only" : ""}`}>
                        <span className="block text-[11px] font-black uppercase tracking-[0.18em]">
                          {group.label}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] opacity-70">
                          {group.description}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleArea(group.id)}
                      className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[rgb(var(--theme-text-secondary-readable))] transition hover:bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] hover:text-[rgb(var(--theme-text-readable))] lg:flex ${
                        sidebarCollapsed ? "sr-only" : ""
                      }`}
                      aria-expanded={expandedAreas[group.id]}
                      aria-label={`${expandedAreas[group.id] ? "Recolher" : "Expandir"} ${group.label}`}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expandedAreas[group.id] ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </button>
                  </div>
                  {expandedAreas[group.id] && (
                    <div
                      className={`mt-2 grid gap-1 ${
                        sidebarCollapsed
                          ? "grid-cols-1"
                          : "grid-cols-1 pl-4"
                      }`}
                    >
                      {group.items.map((item) => (
                        <FeedManagerSidebarButton
                          key={item.route}
                          active={activeRoute === item.route}
                          badge={item.badge}
                          collapsed={sidebarCollapsed}
                          description={item.description}
                          icon={item.icon}
                          label={item.label}
                          onClick={() => {
                            setActiveRoute(item.route);
                            setDiagnosticsFocus(item.focusSection || null);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </nav>
          </div>
        </aside>
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

      <OpmlImportPreviewModal
        isOpen={showOpmlPreview}
        candidates={opmlPreviewCandidates}
        categories={categories}
        onClose={() => {
          setShowOpmlPreview(false);
          setOpmlPreviewCandidates([]);
        }}
        onConfirm={(candidates) => void handleConfirmOpmlImport(candidates)}
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
        onQuarantineFeeds={handleQuarantineFeeds}
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
