import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  FileText,
  FileUp,
  Library,
  ListPlus,
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
  | "feeds:list"
  | "feeds:add"
  | "feeds:categories"
  | "feeds:quarantine"
  | "operations:io"
  | "operations:curated"
  | "operations:maintenance"
  | "operations:risk"
  | "diagnostics:health"
  | "diagnostics:infra"
  | "diagnostics:reports";

const routeAreaMap: Record<FeedManagerRoute, FeedManagerArea> = {
  "feeds:list": "feeds",
  "feeds:add": "feeds",
  "feeds:categories": "feeds",
  "feeds:quarantine": "feeds",
  "operations:io": "operations",
  "operations:curated": "operations",
  "operations:maintenance": "operations",
  "operations:risk": "operations",
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
    value === "feeds:list" ||
    value === "feeds:add" ||
    value === "feeds:categories" ||
    value === "feeds:quarantine" ||
    value === "operations:io" ||
    value === "operations:curated" ||
    value === "operations:maintenance" ||
    value === "operations:risk" ||
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
    return "operations:io";
  }
  if (value === "add") return "feeds:add";
  if (value === "categories") return "feeds:categories";
  if (value === "quarantine") return "feeds:quarantine";

  return "feeds:list";
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

const FeedManagerSidebarButton: React.FC<{
  active: boolean;
  badge?: number;
  description: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ active, badge, description, icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex w-full min-w-0 items-start gap-3 rounded-[18px] px-3 py-2.5 text-left transition-all ${
      active
        ? "bg-[rgb(var(--theme-manager-bg,var(--color-background)))] text-[rgb(var(--theme-text-readable))] shadow-[0_14px_34px_rgba(0,0,0,0.16)] ring-1 ring-[rgba(var(--color-accent),0.26)]"
        : "text-[rgb(var(--theme-text-secondary-readable))] opacity-78 hover:bg-[rgb(var(--theme-manager-control))] hover:text-[rgb(var(--theme-text-readable))] hover:opacity-100"
    }`}
  >
    <span
      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
        active
          ? "bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))]"
          : "bg-[rgb(var(--theme-manager-control))] text-[rgb(var(--theme-text-readable))]"
      }`}
    >
      {icon}
    </span>
    <span className="min-w-0 flex-1">
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
    useState<FeedManagerRoute>("feeds:list");
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
      <header className="flex flex-col gap-3 border-b border-[rgba(var(--color-border),0.12)] bg-[rgb(var(--theme-manager-surface,var(--color-surface)))] px-4 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.08)] sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--theme-text-secondary-readable))] opacity-55">
            Gerenciamento
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[rgb(var(--theme-text-readable))]">
            Gerenciador de feeds
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))] opacity-72">
            Coleção, operações e diagnóstico em uma navegação única.
          </p>
        </div>
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--theme-manager-control))] text-[rgb(var(--theme-manager-text-secondary))] shadow-md transition-all hover:bg-[rgb(var(--theme-manager-soft))] hover:text-[rgb(var(--theme-manager-text))] active:scale-95 sm:right-6 lg:static"
          aria-label="Fechar gerenciador de feeds"
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
        <aside className="bg-[rgb(var(--theme-manager-surface,var(--color-surface)))] shadow-[0_18px_44px_rgba(0,0,0,0.12)] lg:w-[320px]">
          <div className="flex h-full flex-col gap-5 p-4 sm:p-5">

            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
              <FeedManagerStat label="Total" value={currentFeeds.length} />
              <FeedManagerStat label="Válidos" value={validCount} tone="success" />
              <FeedManagerStat label="Erros" value={invalidCount} tone="danger" />
            </div>

            <nav className="flex flex-col gap-5" aria-label="Navegação do gerenciador de feeds">
              {navigationGroups.map((group) => (
                <section key={group.id} className="space-y-2">
                  <div
                    className={`flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                      activeArea === group.id
                        ? "text-[rgb(var(--color-accent))]"
                        : "text-[rgb(var(--theme-text-secondary-readable))] opacity-55"
                    }`}
                  >
                    {group.id === "feeds" && <Library className="h-3.5 w-3.5" />}
                    {group.id === "operations" && <Settings2 className="h-3.5 w-3.5" />}
                    {group.id === "diagnostics" && <BarChart3 className="h-3.5 w-3.5" />}
                    {group.label}
                  </div>
                  <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                    {group.items.map((item) => (
                      <FeedManagerSidebarButton
                        key={item.route}
                        active={activeRoute === item.route}
                        badge={item.badge}
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
                </section>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-visible lg:min-h-0 lg:overflow-hidden">
        {activeArea === "feeds" && (
          <div className="flex flex-col lg:h-full lg:overflow-hidden">
            <ManagerAreaHeader
              eyebrow={activeRouteContent.eyebrow}
              title={activeRouteContent.title}
              description={activeRouteContent.description}
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
                      onClick={() => setActiveRoute("feeds:list")}
                    >
                      Voltar para feeds
                    </CollectionModeButton>
                  )}
                </>
              }
            />

            <div className="flex-1 overflow-visible lg:min-h-0 lg:overflow-hidden">
              {collectionView === "feeds" && (
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
                onClose={() => setActiveRoute("feeds:list")}
              />
                  </div>
                </div>
              )}

              {collectionView === "quarantine" && (
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

        {activeArea === "diagnostics" && (
          <div className="flex flex-col lg:h-full lg:overflow-hidden">
            <ManagerAreaHeader
              eyebrow={activeRouteContent.eyebrow}
              title={activeRouteContent.title}
              description={activeRouteContent.description}
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
