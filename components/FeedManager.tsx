import React, { useEffect, useRef, useState } from "react";
import pkg from "../package.json";
import {
  AlertTriangle,
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronRight,
  Check,
  CircleCheck,
  Database,
  Download,
  Eye,
  EyeOff,
  FileUp,
  FileText,
  Flag,
  FolderTree,
  GripVertical,
  Globe,
  Inbox,
  Key,
  Layers,
  LayoutGrid,
  Library,
  Menu,
  Monitor,
  Pencil,
  PlayCircle,
  Plus,
  Power,
  RefreshCw,
  RotateCcw,
  Rss,
  Search,
  Settings2,
  ShieldAlert,
  Tags,
  Trash2,
  Wifi,
  Wrench,
  X,
} from "lucide-react";
import type { FeedSource, Article, FeedCategory } from "../types";
import { detectEnvironment } from "../services/environmentDetector";
import { parseOpml } from "../services/rssParser";
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
import { useProxyConfig } from "../hooks/useProxyConfig";
import {
  useProxyDashboard,
  type ProxyDashboardRoute,
} from "../hooks/useProxyDashboard";
import { PROXY_CONFIGS } from "../config/proxyConfig";
import {
  ProxyManager,
  type ProxyRouteMode,
  type ProxyTestResult,
} from "../services/proxyManager";
import {
  resetToDefaultFeeds,
  addFeedsToCollection,
} from "../utils/feedMigration";
import {
  buildDeleteAllFeedsConfirmation,
  buildDeleteCategoryConfirmation,
  buildRemoveFeedConfirmation,
  buildReplaceCuratedCollectionConfirmation,
  buildResetCategoriesConfirmation,
  buildRestoreDefaultFeedsConfirmation,
} from "../utils/feedDangerConfirmation";
import { DEFAULT_FEEDS } from "../constants/curatedFeeds";
import { DEFAULT_CURATED_LISTS } from "../config/defaultConfig";
import { FeedDuplicateModal } from "./FeedDuplicateModal";
import { OpmlImportPreviewModal } from "./FeedManager/OpmlImportPreviewModal";
import { FeedToolsTab } from "./FeedManager/FeedToolsTab";
import {
  managerFieldClass,
  managerPrimaryButtonClass,
  managerSecondaryButtonClass,
  managerDangerButtonClass,
} from "./FeedManager/feedManagerStyles";
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

const appVersion = pkg.version;

interface FeedManagerProps {
  currentFeeds: FeedSource[];
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  closeModal: () => void;
  articles?: Article[];
  onRefreshFeeds?: () => void;
}

type FeedManagerArea =
  | "overview"
  | "sources"
  | "organization"
  | "maintenance"
  | "diagnostics";
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
  "feeds:overview": "overview",
  "feeds:list": "sources",
  "feeds:add": "sources",
  "feeds:categories": "organization",
  "feeds:quarantine": "sources",
  "operations:overview": "maintenance",
  "operations:io": "maintenance",
  "operations:curated": "maintenance",
  "operations:maintenance": "maintenance",
  "operations:risk": "maintenance",
  "diagnostics:overview": "diagnostics",
  "diagnostics:health": "diagnostics",
  "diagnostics:infra": "diagnostics",
  "diagnostics:reports": "diagnostics",
};

const canonicalizeFeedManagerRoute = (
  route: FeedManagerRoute,
): FeedManagerRoute => {
  if (route === "operations:curated") return "operations:io";
  if (route === "operations:risk") return "operations:maintenance";
  return route;
};

const areaContentMap: Record<
  FeedManagerArea,
  { title: string; description: string }
> = {
  overview: {
    title: "Visão geral",
    description: "Resumo da coleção e próximos passos.",
  },
  sources: {
    title: "Fontes",
    description: "Adicione, busque e organize seus feeds.",
  },
  organization: {
    title: "Organização",
    description: "Categorias e ordenação da sua biblioteca.",
  },
  maintenance: {
    title: "Manutenção",
    description: "Backup, reparos e ações destrutivas.",
  },
  diagnostics: {
    title: "Diagnóstico",
    description: "Saúde dos feeds, infraestrutura e relatórios.",
  },
};

type FeedManagerAccordionRoute =
  | "operations:io"
  | "operations:maintenance"
  | "diagnostics:health"
  | "diagnostics:infra"
  | "diagnostics:reports";

const feedManagerAccordionDefaults: Record<FeedManagerAccordionRoute, boolean> = {
  "operations:io": false,
  "operations:maintenance": false,
  "diagnostics:health": false,
  "diagnostics:infra": false,
  "diagnostics:reports": false,
};

const isFeedManagerAccordionRoute = (
  route: FeedManagerRoute,
): route is FeedManagerAccordionRoute =>
  Object.prototype.hasOwnProperty.call(feedManagerAccordionDefaults, route);

const getFeedManagerSectionId = (route: FeedManagerRoute) =>
  `feed-manager-section-${canonicalizeFeedManagerRoute(route).replace(":", "-")}`;

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
    return canonicalizeFeedManagerRoute(value);
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
            className={`${managerFieldClass} px-3 py-2`}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            value={value}
          />
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            className={managerSecondaryButtonClass}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className={managerPrimaryButtonClass}
            type="submit"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const FeedManagerTopbar: React.FC<{
  closeModal: () => void;
  mobileMenuButtonRef: React.RefObject<HTMLButtonElement | null>;
  mobileSidebarOpen: boolean;
  onAddSource: () => void;
  onOpenMobileNavigation: () => void;
  onRefreshFeeds?: () => void;
}> = ({
  closeModal,
  mobileMenuButtonRef,
  mobileSidebarOpen,
  onAddSource,
  onOpenMobileNavigation,
  onRefreshFeeds,
}) => (
  <header className="feed-manager-header">
    <div className="feed-manager-header-main">
      <button
        ref={mobileMenuButtonRef}
        type="button"
        onClick={onOpenMobileNavigation}
        className="feed-manager-icon-button feed-manager-icon-button--mobile"
        aria-controls="feed-manager-sidebar"
        aria-expanded={mobileSidebarOpen}
        aria-label="Abrir menu de navegação"
        title="Abrir menu de navegação"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>
      <div className="min-w-0">
        <h2 className="truncate text-[18px] font-semibold tracking-tight text-[rgb(var(--theme-text-readable))] sm:text-[22px]">
          Central da Coleção
        </h2>
        <p className="hidden max-w-xl truncate text-[13px] text-[rgb(var(--theme-text-secondary-readable))] opacity-78 sm:block">
          Fontes, categorias, integridade e manutenção da sua coleção de notícias.
        </p>
      </div>
    </div>

    <div className="feed-manager-header-actions">
      <button
        type="button"
        onClick={onAddSource}
        className={`${managerPrimaryButtonClass} feed-manager-header-action feed-manager-header-action--add h-9 px-3 text-[12.5px]`}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Adicionar fonte</span>
      </button>
      {onRefreshFeeds && (
        <button
          type="button"
          onClick={onRefreshFeeds}
          className={`${managerSecondaryButtonClass} feed-manager-header-action feed-manager-header-action--refresh hidden h-9 px-3 text-[12.5px] sm:inline-flex`}
        >
          <RefreshCw className="h-4 w-4" />
          Revalidar
        </button>
      )}
      <button
        onClick={closeModal}
        className="feed-manager-icon-button"
        aria-label="Fechar gerenciador de feeds"
        title="Fechar gerenciador de feeds"
        type="button"
      >
        <X className="h-4.5 w-4.5" />
      </button>
    </div>
  </header>
);

const FeedManagerAreaButton: React.FC<{
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
    className={`feed-manager-sidebar-nav-item ${
      collapsed
        ? "feed-manager-sidebar-nav-item--collapsed"
        : "feed-manager-sidebar-nav-item--expanded"
    } ${active ? "feed-manager-sidebar-nav-item--active" : ""}`}
    aria-label={`${label}. ${description}`}
  >
    <span
      className={`feed-manager-sidebar-nav-icon feed-manager-sidebar-nav-icon--area ${
        active ? "feed-manager-sidebar-nav-icon--active" : ""
      }`}
    >
      {icon}
    </span>
    <span
      className={`feed-manager-sidebar-nav-copy min-w-0 flex-1 ${
        collapsed ? "sr-only" : ""
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium leading-tight">
            {label}
          </span>
          <span className="mt-0.5 block truncate text-[11px] leading-tight opacity-70">
            {description}
          </span>
        </span>
        {typeof badge !== "undefined" && badge > 0 && (
          <span className="rounded-full bg-[rgba(var(--color-accent),0.14)] px-2 py-0.5 text-[10px] font-black text-[rgb(var(--color-accent))]">
            {badge}
          </span>
        )}
      </span>
    </span>
  </button>
);

const getFeedManagerDrawerFocusableElements = (root: HTMLElement | null) => {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        '[tabindex]:not([tabindex="-1"])',
      ].join(","),
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.getAttribute("tabindex") !== "-1",
  );
};

const formatFeedManagerEnvironment = (
  environment: ReturnType<typeof detectEnvironment>,
) => {
  if (environment.isTauri) return "Desktop";
  if (environment.isDevelopment) return "Desenvolvimento";
  if (environment.isGitHubPages) return "GitHub Pages";
  if (environment.isProduction) return "Produção";
  return "Web";
};

type CuratedListMeta = {
  id: string;
  name: string;
  badge: string;
  description: string;
  feeds: FeedSource[];
};

const getCuratedListMeta = (
  name: string,
  feeds: FeedSource[],
): CuratedListMeta => {
  const normalized = name.toLowerCase();
  if (normalized.includes("brasil")) {
    return {
      id: "brasil-mix",
      name,
      badge: "PT-BR",
      description:
        "Seleção equilibrada de jornais e revistas brasileiros: economia, política, tecnologia e cultura.",
      feeds,
    };
  }
  if (normalized.includes("international") || normalized.includes("internacional")) {
    return {
      id: "internacional-mix",
      name,
      badge: "EN",
      description:
        "Cobertura global em inglês: notícias, ciência, tecnologia e análise internacional.",
      feeds,
    };
  }
  return {
    id: "pacote-mix-global",
    name,
    badge: "PT-BR + EN",
    description:
      "União curada de fontes nacionais e internacionais para ampliar a cobertura da coleção.",
    feeds,
  };
};

const getCuratedLists = () =>
  Object.entries(DEFAULT_CURATED_LISTS).map(([name, feeds]) =>
    getCuratedListMeta(name, feeds),
  );

const getCuratedIcon = (id: string) => {
  if (id === "brasil-mix") return Flag;
  if (id === "internacional-mix") return Globe;
  return Layers;
};

const FeedManagerPageTitle: React.FC<{
  title: string;
  description?: string;
}> = ({ title, description }) => (
  <div className="feed-manager-page-title">
    <h3>{title}</h3>
    {description && <p>{description}</p>}
  </div>
);

const FeedManagerLightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  danger?: boolean;
}> = ({ children, className = "", danger = false }) => (
  <div
    className={`feed-manager-light-card ${
      danger ? "feed-manager-light-card--danger" : ""
    } ${className}`}
  >
    {children}
  </div>
);

const FeedManagerLightRow: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}> = ({ title, description, icon, onClick, danger = false }) => {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`feed-manager-light-row ${
        onClick ? "feed-manager-light-row--interactive" : ""
      } ${danger ? "feed-manager-light-row--danger" : ""}`}
    >
      {icon && <span className="feed-manager-light-row__icon">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold">{title}</span>
        {description && (
          <span className="mt-0.5 block truncate text-xs opacity-72">
            {description}
          </span>
        )}
      </span>
      {onClick && (
        <ChevronRight className="h-4 w-4 shrink-0 text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] opacity-72" />
      )}
    </Component>
  );
};

const CollectionDialog: React.FC<{
  children: React.ReactNode;
  description?: string;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
}> = ({ children, description, footer, icon, isOpen, onClose, title, wide }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    size="4xl"
    ariaLabel={title}
    showCloseButton={false}
    zIndexClass="z-[9999]"
    contentClassName={`collection-central-dialog ${
      wide ? "collection-central-dialog--wide" : ""
    }`}
    bodyClassName="collection-central-dialog__body"
  >
    <div className="collection-central-dialog__header">
      <div className="min-w-0">
        <h2>
          {icon}
          {title}
        </h2>
        {description && <p>{description}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="feed-manager-icon-button"
        aria-label="Fechar"
        title="Fechar"
      >
        <X className="h-4.5 w-4.5" />
      </button>
    </div>
    <div className="collection-central-dialog__content">{children}</div>
    {footer && <div className="collection-central-dialog__footer">{footer}</div>}
  </Modal>
);

const FeedManagerCompactMetric: React.FC<{
  icon: React.ReactNode;
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  value: React.ReactNode;
}> = ({ icon, label, tone = "neutral", value }) => (
  <div className={`feed-manager-compact-metric feed-manager-compact-metric--${tone}`}>
    <span className="feed-manager-compact-metric__icon">{icon}</span>
    <span className="feed-manager-compact-metric__copy">
      <span>
        {label}
      </span>
      <strong>{value}</strong>
    </span>
  </div>
);

const CollectionDragHandle: React.FC<{
  label: string;
  onDragStart?: (event: React.DragEvent<HTMLSpanElement>) => void;
}> = ({ label, onDragStart }) => (
  <span
    aria-label={label}
    className="collection-central-drag-handle"
    draggable={!!onDragStart}
    onDragStart={onDragStart}
    role="button"
    tabIndex={0}
    title={label}
  >
    <GripVertical className="h-4 w-4" />
  </span>
);

const FeedManagerSourceIcon: React.FC<{ feed: FeedSource }> = ({ feed }) => {
  const [failed, setFailed] = React.useState(false);
  const favicon = feed.faviconUrl?.trim();

  React.useEffect(() => {
    setFailed(false);
  }, [favicon]);

  return (
    <span className="feed-manager-light-row__icon collection-central-source-icon">
      {favicon && !failed ? (
        <img
          src={favicon}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Rss className="h-[17px] w-[17px]" />
      )}
    </span>
  );
};

const FeedManagerOverviewPage: React.FC<{
  categoryCount: number;
  invalidCount: number;
  onNavigate: (route: FeedManagerRoute) => void;
  onRefreshFeeds?: () => void;
  quarantineCount: number;
  totalFeedCount: number;
  validCount: number;
}> = ({
  categoryCount,
  invalidCount,
  onNavigate,
  onRefreshFeeds,
  quarantineCount,
  totalFeedCount,
  validCount,
}) => (
  <div className="feed-manager-page feed-manager-page--narrow collection-central-page collection-central-page--overview">
    <section>
      <FeedManagerPageTitle title="Estado da coleção" />
      <div className="feed-manager-metric-strip">
        <FeedManagerCompactMetric
          icon={<Database className="h-4 w-4" />}
          label="Total"
          value={totalFeedCount}
        />
        <FeedManagerCompactMetric
          icon={<CircleCheck className="h-4 w-4" />}
          label="Válidos"
          tone="success"
          value={validCount}
        />
        <FeedManagerCompactMetric
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Erros"
          tone={invalidCount > 0 ? "danger" : "neutral"}
          value={invalidCount}
        />
        <FeedManagerCompactMetric
          icon={<ShieldAlert className="h-4 w-4" />}
          label="Quarentena"
          tone={quarantineCount > 0 ? "warning" : "neutral"}
          value={quarantineCount}
        />
        <FeedManagerCompactMetric
          icon={<Tags className="h-4 w-4" />}
          label="Categorias"
          value={categoryCount}
        />
      </div>
    </section>

    <section>
      <FeedManagerPageTitle title="Ações recomendadas" />
      <FeedManagerLightCard>
        <FeedManagerLightRow
          icon={<CircleCheck className="h-[18px] w-[18px]" />}
          title={
            invalidCount > 0 || quarantineCount > 0
              ? "A coleção precisa de revisão."
              : "A coleção está saudável."
          }
          description={
            invalidCount > 0 || quarantineCount > 0
              ? "Há fontes com erro ou preservadas fora do carregamento."
              : "Nenhum erro e nenhum feed em quarentena."
          }
          onClick={() => onNavigate("diagnostics:overview")}
        />
        <FeedManagerLightRow
          icon={<Download className="h-[18px] w-[18px]" />}
          title="Faça backup OPML da coleção."
          description="Recomendado após adicionar, mover ou remover fontes."
          onClick={() => onNavigate("operations:overview")}
        />
        <FeedManagerLightRow
          icon={<RefreshCw className="h-[18px] w-[18px]" />}
          title="Revalidar coleção"
          description="Confirme a disponibilidade das fontes salvas."
          onClick={onRefreshFeeds}
        />
      </FeedManagerLightCard>
    </section>

    <section>
      <FeedManagerPageTitle title="Atalhos" />
      <div className="feed-manager-shortcut-grid">
        <FeedManagerLightCard>
          <FeedManagerLightRow
            icon={<Library className="h-[18px] w-[18px]" />}
            title="Revisar feeds"
            description="Lista completa e status"
            onClick={() => onNavigate("feeds:list")}
          />
        </FeedManagerLightCard>
        <FeedManagerLightCard>
          <FeedManagerLightRow
            icon={<Plus className="h-[18px] w-[18px]" />}
            title="Adicionar fonte"
            description="URL, OPML ou listas"
            onClick={() => onNavigate("feeds:list")}
          />
        </FeedManagerLightCard>
        <FeedManagerLightCard>
          <FeedManagerLightRow
            icon={<FileUp className="h-[18px] w-[18px]" />}
            title="Importar OPML"
            description="Revisar antes de aplicar"
            onClick={() => onNavigate("operations:overview")}
          />
        </FeedManagerLightCard>
        <FeedManagerLightCard>
          <FeedManagerLightRow
            icon={<Tags className="h-[18px] w-[18px]" />}
            title="Organizar categorias"
            description={`${categoryCount} categorias`}
            onClick={() => onNavigate("feeds:categories")}
          />
        </FeedManagerLightCard>
        <FeedManagerLightCard>
          <FeedManagerLightRow
            icon={<BarChart3 className="h-[18px] w-[18px]" />}
            title="Abrir diagnóstico"
            description="Saúde e infraestrutura"
            onClick={() => onNavigate("diagnostics:overview")}
          />
        </FeedManagerLightCard>
        <FeedManagerLightCard>
          <FeedManagerLightRow
            icon={<Download className="h-[18px] w-[18px]" />}
            title="Exportar backup"
            description="OPML da coleção"
            onClick={() => onNavigate("operations:io")}
          />
        </FeedManagerLightCard>
      </div>
    </section>

    <section>
      <FeedManagerPageTitle title="Integridade" />
      <FeedManagerLightCard className="collection-central-integrity-panel">
        <div className="collection-central-integrity-grid">
          <div className="collection-central-integrity-item collection-central-integrity-item--wide">
            <span>Cobertura de validação</span>
            <strong className={invalidCount > 0 ? "text-[rgb(var(--color-warning))]" : "text-[rgb(var(--color-success))]"}>
              {totalFeedCount > 0 ? `${Math.round((validCount / totalFeedCount) * 100)}%` : "0%"}
            </strong>
            <div
              className="collection-central-integrity-progress"
              aria-label="Cobertura de validação"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={totalFeedCount > 0 ? Math.round((validCount / totalFeedCount) * 100) : 0}
              role="progressbar"
            >
              <span
                style={
                  {
                    "--coverage": `${totalFeedCount > 0 ? Math.round((validCount / totalFeedCount) * 100) : 0}%`,
                  } as React.CSSProperties
                }
              />
            </div>
          </div>
          <div className="collection-central-integrity-item">
            <span>Fontes ativas</span>
            <strong>{validCount}</strong>
            <small>de {totalFeedCount} cadastradas</small>
          </div>
          <div className="collection-central-integrity-item">
            <span>Fora de circulação</span>
            <strong>{quarantineCount}</strong>
            <small>{quarantineCount === 0 ? "nenhuma indisponível" : "em quarentena"}</small>
          </div>
          <div className="collection-central-integrity-item">
            <span>Categorias</span>
            <strong>{categoryCount}</strong>
            <small>rotas visuais</small>
          </div>
        </div>
      </FeedManagerLightCard>
    </section>
  </div>
);

const FeedManagerSourcesPage: React.FC<{
  activeFeeds: FeedSource[];
  articles: Article[];
  categories: FeedCategory[];
  currentFeedCount: number;
  feedValidations: Map<string, FeedValidationResult>;
  newFeedCategory: string;
  newFeedTitle: string;
  newFeedUrl: string;
  onImportOPML: () => void;
  onQuarantineFeed: (url: string) => void;
  onRemoveFeed: (url: string) => void;
  onRetryFeed: (url: string) => void;
  onShowCuratedLists: () => void;
  onShowError: (url: string, validation?: FeedValidationResult) => void;
  onSubmitFeed: (event: React.FormEvent) => void | Promise<void>;
  onToggleHideFromAll: (url: string) => void;
  onEditFeed: (url: string) => void;
  onEditFeedTitle: (url: string) => void;
  processingUrl: string | null;
  quarantineRecommendedUrls: Set<string>;
  setNewFeedCategory: (id: string) => void;
  setNewFeedTitle: (title: string) => void;
  setNewFeedUrl: (url: string) => void;
}> = ({
  activeFeeds,
  articles,
  categories,
  currentFeedCount,
  feedValidations,
  newFeedCategory,
  newFeedTitle,
  newFeedUrl,
  onImportOPML,
  onQuarantineFeed,
  onRemoveFeed,
  onRetryFeed,
  onShowCuratedLists,
  onShowError,
  onSubmitFeed,
  onToggleHideFromAll,
  onEditFeed,
  onEditFeedTitle,
  processingUrl,
  quarantineRecommendedUrls,
  setNewFeedCategory,
  setNewFeedTitle,
  setNewFeedUrl,
}) => {
  const isProcessing = processingUrl !== null;
  const [sourceQuery, setSourceQuery] = React.useState("");
  const [sourceFilter, setSourceFilter] = React.useState<
    "all" | "attention" | "pending" | "valid" | "quarantine" | "hidden"
  >("all");
  const curatedLists = React.useMemo(getCuratedLists, []);
  const categoryById = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const articlesByFeed = React.useMemo(() => {
    const counts = new Map<string, number>();
    articles.forEach((article) => {
      if (!article.feedUrl) return;
      counts.set(article.feedUrl, (counts.get(article.feedUrl) || 0) + 1);
    });
    return counts;
  }, [articles]);
  const getSourceStatus = (feed: FeedSource) => {
    const validation = feedValidations.get(feed.url);
    if (isFeedQuarantined(feed) || quarantineRecommendedUrls.has(feed.url)) {
      return "quarantine" as const;
    }
    if (feed.hideFromAll) return "hidden" as const;
    if (!validation || validation.status === "checking") return "pending" as const;
    if (validation.isValid) return "valid" as const;
    return "error" as const;
  };
  const getSourceTitle = (feed: FeedSource) =>
    feed.customTitle || feedValidations.get(feed.url)?.title || getFeedManagerFeedTitle(feed);
  const sourceRows = React.useMemo(() => {
    const query = sourceQuery.trim().toLowerCase();
    return activeFeeds
      .map((feed) => {
        const validation = feedValidations.get(feed.url);
        const category = feed.categoryId
          ? categoryById.get(feed.categoryId)?.name
          : undefined;
        const status = getSourceStatus(feed);
        const title = getSourceTitle(feed);
        return {
          feed,
          title,
          status,
          validation,
          category: category || "Sem categoria",
          articleCount: articlesByFeed.get(feed.url) || 0,
        };
      })
      .filter((row) => {
        const matchesFilter =
          sourceFilter === "all" ||
          (sourceFilter === "attention" &&
            (row.status === "error" || row.status === "quarantine")) ||
          row.status === sourceFilter;
        if (!matchesFilter) return false;
        if (!query) return true;
        return (
          row.title.toLowerCase().includes(query) ||
          row.feed.url.toLowerCase().includes(query) ||
          row.category.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  }, [
    activeFeeds,
    articlesByFeed,
    categoryById,
    feedValidations,
    quarantineRecommendedUrls,
    sourceFilter,
    sourceQuery,
  ]);
  const sourceGroups = [
    {
      id: "attention",
      title: "Atenção necessária",
      hint: "erros e quarentena",
      rows: sourceRows.filter(
        (row) => row.status === "error" || row.status === "quarantine",
      ),
    },
    {
      id: "pending",
      title: "Pendentes de validação",
      rows: sourceRows.filter((row) => row.status === "pending"),
    },
    {
      id: "valid",
      title: "Coleção válida",
      rows: sourceRows.filter(
        (row) => row.status === "valid" || row.status === "hidden",
      ),
    },
  ];
  const statusLabel = {
    valid: "Válido",
    error: "Erro",
    pending: "Pendente",
    quarantine: "Quarentena",
    hidden: "Oculto",
  } as const;
  const statusTone = {
    valid: "collection-central-status-dot--success",
    error: "collection-central-status-dot--danger",
    pending: "collection-central-status-dot--warning",
    quarantine: "collection-central-status-dot--warning",
    hidden: "collection-central-status-dot--muted",
  } as const;
  const filters = [
    { id: "all", label: "Todos" },
    { id: "attention", label: "Com erro" },
    { id: "pending", label: "Pendentes" },
    { id: "valid", label: "Válidos" },
    { id: "quarantine", label: "Quarentena" },
    { id: "hidden", label: "Ocultos" },
  ] as const;
  const renderSourceRow = (row: (typeof sourceRows)[number]) => (
    <div key={row.feed.url} className="collection-central-source-row">
      <FeedManagerSourceIcon feed={row.feed} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`collection-central-status-dot ${statusTone[row.status]}`}
            aria-hidden="true"
          />
          <p
            className={`truncate text-[13.5px] font-semibold ${
              row.feed.hideFromAll ? "line-through opacity-62" : ""
            }`}
          >
            {row.title}
          </p>
        </div>
        <p className="mt-0.5 truncate text-[11.5px] text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] opacity-76">
          {row.category} · {row.feed.url}
        </p>
      </div>
      <div className="collection-central-source-row__meta">
        <span className={`collection-central-status-pill collection-central-status-pill--${row.status}`}>
          {statusLabel[row.status]}
        </span>
        <span>{row.articleCount} arts.</span>
      </div>
      <div className="collection-central-feed-row__actions">
        {(row.status === "error" || row.status === "pending") && (
          <button
            type="button"
            onClick={() => onRetryFeed(row.feed.url)}
            aria-label={`Revalidar ${row.title}`}
            title="Revalidar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        {row.validation && !row.validation.isValid && (
          <button
            type="button"
            onClick={() => onShowError(row.feed.url, row.validation)}
            aria-label={`Ver erro de ${row.title}`}
            title="Ver erro"
          >
            <AlertTriangle className="h-4 w-4" />
          </button>
        )}
        {quarantineRecommendedUrls.has(row.feed.url) && (
          <button
            type="button"
            onClick={() => onQuarantineFeed(row.feed.url)}
            aria-label={`Quarentenar ${row.title}`}
            title="Quarentenar"
          >
            <ShieldAlert className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onToggleHideFromAll(row.feed.url)}
          aria-label={row.feed.hideFromAll ? "Mostrar em Todos" : "Ocultar de Todos"}
          title={row.feed.hideFromAll ? "Mostrar em Todos" : "Ocultar de Todos"}
        >
          {row.feed.hideFromAll ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => onEditFeedTitle(row.feed.url)}
          aria-label={`Editar nome de ${row.title}`}
          title="Editar nome"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onEditFeed(row.feed.url)}
          aria-label={`Editar URL de ${row.title}`}
          title="Editar URL"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemoveFeed(row.feed.url)}
          aria-label={`Excluir ${row.title}`}
          title="Excluir feed"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="feed-manager-page collection-central-page collection-central-page--sources">
      <section>
        <FeedManagerPageTitle
          title="Adicionar uma fonte"
          description="Três caminhos para crescer a coleção sem interromper a revisão."
        />
        <div className="collection-central-source-add-stack">
          <FeedManagerLightCard className="collection-central-source-add-card collection-central-source-add-card--manual">
            <form
              onSubmit={(event) => {
                void onSubmitFeed(event);
              }}
              className="collection-central-manual-source-form"
            >
              <div className="collection-central-source-add-card__intro">
                <span className="feed-manager-light-row__icon">
                  <Plus className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-[13.5px] font-semibold">
                    Adicionar manualmente
                  </h4>
                  <p className="text-xs opacity-72">
                    Cole RSS, Atom ou a página do site.
                  </p>
                </div>
              </div>
              <div className="collection-central-manual-source-form__fields">
                <input
                  type="url"
                  required
                  placeholder="https://exemplo.com/feed"
                  value={newFeedUrl}
                  onChange={(event) => setNewFeedUrl(event.target.value)}
                  disabled={isProcessing}
                  className={managerFieldClass}
                />
                <input
                  type="text"
                  placeholder="Nome opcional"
                  value={newFeedTitle}
                  onChange={(event) => setNewFeedTitle(event.target.value)}
                  disabled={isProcessing}
                  className={managerFieldClass}
                />
                <select
                  value={newFeedCategory}
                  onChange={(event) => setNewFeedCategory(event.target.value)}
                  disabled={isProcessing}
                  className={managerFieldClass}
                >
                  <option value="">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={managerPrimaryButtonClass}
                >
                  {isProcessing ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isProcessing ? "Validando..." : "Adicionar"}
                </button>
              </div>
            </form>
          </FeedManagerLightCard>

          <FeedManagerLightCard className="collection-central-source-add-card collection-central-source-add-card--opml">
            <div className="collection-central-source-add-card__intro">
              <span className="feed-manager-light-row__icon">
                <FileUp className="h-[18px] w-[18px]" />
              </span>
              <div>
                <h4 className="text-[13.5px] font-semibold">Importar OPML</h4>
                <p className="text-xs opacity-72">
                  Carregue um arquivo OPML. Você revisa antes de mesclar ou
                  substituir.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onImportOPML}
              className={`${managerSecondaryButtonClass} collection-central-source-add-card__action`}
            >
              <FileUp className="h-4 w-4" />
              Escolher arquivo
            </button>
            <p className="mt-2 text-[11.5px] opacity-64">
              Coleção atual: {currentFeedCount} feeds.
            </p>
          </FeedManagerLightCard>

          <FeedManagerLightCard className="collection-central-source-add-card collection-central-source-add-card--curated">
            <div className="collection-central-source-add-card__intro">
              <span className="feed-manager-light-row__icon">
                <Library className="h-[18px] w-[18px]" />
              </span>
              <div>
                <h4 className="text-[13.5px] font-semibold">Listas curadas</h4>
                <p className="text-xs opacity-72">
                  Coleções prontas para pré-visualizar e mesclar.
                </p>
              </div>
              <button
                type="button"
                onClick={onShowCuratedLists}
                className={`${managerSecondaryButtonClass} ml-auto h-8 px-3`}
              >
                Ver todas
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="collection-central-curated-preview">
              {curatedLists.slice(0, 3).map((list) => {
                const Icon = getCuratedIcon(list.id);
                return (
                <button
                  key={list.name}
                  type="button"
                  onClick={onShowCuratedLists}
                  className="collection-central-curated-preview-card"
                >
                  <span className="feed-manager-light-row__icon">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <strong>{list.name}</strong>
                    <small>
                      {list.feeds.length} fontes
                      <em>{list.badge}</em>
                    </small>
                    <small>{list.description}</small>
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                );
              })}
            </div>
          </FeedManagerLightCard>
        </div>
      </section>

      <section>
        <FeedManagerPageTitle title="Fontes da coleção" />
        <div className="collection-central-source-tools">
          <label className="collection-central-search-field">
            <Search className="h-4 w-4" />
            <input
              value={sourceQuery}
              onChange={(event) => setSourceQuery(event.target.value)}
              placeholder="Buscar por título, URL ou categoria"
            />
          </label>
          <div className="collection-central-filter-row">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSourceFilter(filter.id)}
                className={
                  sourceFilter === filter.id
                    ? "collection-central-filter-chip collection-central-filter-chip--active"
                    : "collection-central-filter-chip"
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {sourceGroups.map((group) => (
          <div key={group.id} className="collection-central-source-group">
            <div className="collection-central-group-heading">
              <h4>{group.title}</h4>
              <span>{group.hint || `${group.rows.length} fontes`}</span>
            </div>
            {group.rows.length > 0 ? (
              <FeedManagerLightCard className="overflow-hidden">
                {group.rows.map(renderSourceRow)}
              </FeedManagerLightCard>
            ) : group.id === "attention" ? (
              <FeedManagerLightCard className="p-5">
                <div className="flex items-center gap-3">
                  <span className="feed-manager-light-row__icon">
                    <CircleCheck className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold">
                      Sem feeds em atenção
                    </p>
                    <p className="text-[12px] opacity-72">
                      Nenhum erro e nenhum em quarentena.
                    </p>
                  </div>
                </div>
              </FeedManagerLightCard>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
};

const layoutOptions: Array<{
  value: NonNullable<FeedCategory["layoutMode"]>;
  label: string;
}> = [
  { value: "modern", label: "Modern" },
  { value: "newspaper", label: "Newspaper" },
  { value: "gallery", label: "Gallery" },
  { value: "compact", label: "Compact" },
  { value: "timeline", label: "Timeline" },
  { value: "pocketfeeds", label: "PocketFeeds" },
];

const getFeedManagerFeedTitle = (feed: FeedSource) => {
  if (feed.customTitle) return feed.customTitle;
  try {
    return new URL(feed.url).hostname.replace(/^www\./, "");
  } catch {
    return feed.url;
  }
};

type CuratedImportMode = "merge" | "replace";

const CuratedListsDialog: React.FC<{
  categories: FeedCategory[];
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    mode: CuratedImportMode,
    selectedFeeds: FeedSource[],
    listName: string,
  ) => void | Promise<void>;
}> = ({ categories, isOpen, onClose, onImport }) => {
  const curatedLists = React.useMemo(getCuratedLists, []);
  const [activeName, setActiveName] = React.useState(
    curatedLists[0]?.name || "",
  );
  const [query, setQuery] = React.useState("");
  const [disabledFeeds, setDisabledFeeds] = React.useState<
    Record<string, boolean>
  >({});
  const activeList =
    curatedLists.find((list) => list.name === activeName) || curatedLists[0];
  const ActiveIcon = getCuratedIcon(activeList?.id || "");
  const categoryNames = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const visibleFeeds = React.useMemo(() => {
    if (!activeList) return [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return activeList.feeds;
    return activeList.feeds.filter((feed) => {
      const title = getFeedManagerFeedTitle(feed).toLowerCase();
      const categoryName = feed.categoryId
        ? categoryNames.get(feed.categoryId)?.toLowerCase() || ""
        : "";
      return (
        title.includes(normalizedQuery) ||
        feed.url.toLowerCase().includes(normalizedQuery) ||
        categoryName.includes(normalizedQuery)
      );
    });
  }, [activeList, categoryNames, query]);

  React.useEffect(() => {
    if (!isOpen) return;
    setActiveName((current) => current || curatedLists[0]?.name || "");
    setQuery("");
  }, [curatedLists, isOpen]);

  const getKey = (feed: FeedSource) => `${activeList?.name || ""}::${feed.url}`;
  const selectedFeeds = activeList
    ? activeList.feeds.filter((feed) => !disabledFeeds[getKey(feed)])
    : [];
  const selectedCount = selectedFeeds.length;
  const handleImport = (mode: CuratedImportMode) => {
    if (!activeList || selectedFeeds.length === 0) return;
    void onImport(mode, selectedFeeds, activeList.name);
  };

  return (
    <CollectionDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Listas curadas"
      description="Pré-visualize os itens da lista e desmarque o que não quiser importar."
      icon={<Library className="h-4 w-4" />}
      wide
      footer={
        <>
          <p className="collection-central-dialog__count">
            <strong>{selectedCount}</strong> de {activeList?.feeds.length || 0}{" "}
            selecionados
          </p>
          <div className="collection-central-dialog__actions">
            <button
              type="button"
              onClick={onClose}
              className={`${managerSecondaryButtonClass} h-9 px-3`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleImport("merge")}
              disabled={selectedCount === 0}
              className={`${managerSecondaryButtonClass} h-9 px-3`}
            >
              Mesclar
            </button>
            <button
              type="button"
              onClick={() => handleImport("replace")}
              disabled={selectedCount === 0}
              className={`${managerPrimaryButtonClass} h-9 px-3`}
            >
              Substituir coleção
            </button>
          </div>
        </>
      }
    >
      <div className="collection-central-curated-dialog">
        <nav className="collection-central-curated-dialog__nav">
          {curatedLists.map((list) => {
            const Icon = getCuratedIcon(list.id);
            const active = list.name === activeList?.name;
            return (
              <button
                key={list.name}
                type="button"
                onClick={() => {
                  setActiveName(list.name);
                  setQuery("");
                }}
                className={
                  active
                    ? "collection-central-curated-list-option collection-central-curated-list-option--active"
                    : "collection-central-curated-list-option"
                }
              >
                <Icon className="h-4 w-4" />
                <span>
                  <strong>{list.name}</strong>
                  <small>{list.feeds.length} fontes</small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="collection-central-curated-dialog__main">
          <div className="collection-central-curated-dialog__intro">
            <span className="feed-manager-light-row__icon">
              <ActiveIcon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4>{activeList?.name}</h4>
                {activeList?.badge && (
                  <span className="collection-central-badge">
                    {activeList.badge}
                  </span>
                )}
              </div>
              <p>{activeList?.description}</p>
            </div>
          </div>

          <label className="collection-central-search-field collection-central-search-field--dialog">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar nesta lista"
            />
          </label>

          <ul className="collection-central-curated-feed-list">
            {visibleFeeds.map((feed) => {
              const key = getKey(feed);
              const disabled = !!disabledFeeds[key];
              const categoryName = feed.categoryId
                ? categoryNames.get(feed.categoryId) || "Sem categoria"
                : "Sem categoria";
              return (
                <li key={feed.url}>
                  <button
                    type="button"
                    onClick={() =>
                      setDisabledFeeds((current) => ({
                        ...current,
                        [key]: !current[key],
                      }))
                    }
                  >
                    <span
                      className={
                        disabled
                          ? "collection-central-check"
                          : "collection-central-check collection-central-check--active"
                      }
                    >
                      {!disabled && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <Rss className="h-4 w-4" />
                    <span className="min-w-0 flex-1">
                      <strong className={disabled ? "line-through opacity-60" : ""}>
                        {getFeedManagerFeedTitle(feed)}
                      </strong>
                      <small>
                        {categoryName} · {feed.url}
                      </small>
                    </span>
                  </button>
                </li>
              );
            })}
            {visibleFeeds.length === 0 && (
              <li className="collection-central-empty-row">
                Nada encontrado para "{query}".
              </li>
            )}
          </ul>
        </div>
      </div>
    </CollectionDialog>
  );
};

const FeedManagerCategoryEditor: React.FC<{
  category: FeedCategory;
  onCancel: () => void;
  onDelete: () => void;
  onSave: (updates: Partial<FeedCategory>) => void;
}> = ({ category, onCancel, onDelete, onSave }) => {
  const [name, setName] = React.useState(category.name);
  const [color, setColor] = React.useState(category.color);
  const [description, setDescription] = React.useState(category.description || "");
  const [layoutMode, setLayoutMode] = React.useState(category.layoutMode || "");
  const [autoDiscovery, setAutoDiscovery] = React.useState(
    category.autoDiscovery ?? true,
  );

  return (
    <form
      className="collection-central-category-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          name: name.trim() || category.name,
          color,
          description: description.trim() || undefined,
          layoutMode: layoutMode
            ? (layoutMode as FeedCategory["layoutMode"])
            : undefined,
          autoDiscovery,
        });
      }}
    >
      <label>
        <span>Nome</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={managerFieldClass}
        />
      </label>
      <label>
        <span>Cor</span>
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="collection-central-color-input"
          aria-label={`Cor de ${category.name}`}
        />
      </label>
      <label>
        <span>Layout</span>
        <select
          value={layoutMode}
          onChange={(event) => setLayoutMode(event.target.value)}
          className={managerFieldClass}
        >
          <option value="">Usar padrão global</option>
          {layoutOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="collection-central-category-editor__wide">
        <span>Descrição</span>
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={managerFieldClass}
          placeholder="Descrição opcional para orientar esta categoria"
        />
      </label>
      <label className="collection-central-category-toggle">
        <input
          type="checkbox"
          checked={autoDiscovery}
          onChange={(event) => setAutoDiscovery(event.target.checked)}
        />
        <span>Auto-descoberta de feeds ativa</span>
      </label>
      <div className="collection-central-category-editor__actions">
        <button type="submit" className={`${managerPrimaryButtonClass} h-9 px-3`}>
          Salvar
        </button>
        <button type="button" onClick={onCancel} className={`${managerSecondaryButtonClass} h-9 px-3`}>
          Cancelar
        </button>
        {!category.isDefault && (
          <button type="button" onClick={onDelete} className={`${managerDangerButtonClass} h-9 px-3`}>
            Excluir
          </button>
        )}
      </div>
    </form>
  );
};

const FeedManagerOrganizationPage: React.FC<{
  categories: FeedCategory[];
  createCategory: (
    name: string,
    color: string,
    description?: string,
    layoutMode?: FeedCategory["layoutMode"],
    autoDiscovery?: boolean,
  ) => FeedCategory;
  currentFeeds: FeedSource[];
  deleteCategory: (id: string) => void;
  onEditFeed: (url: string) => void;
  onEditFeedTitle: (url: string) => void;
  onRemoveFeed: (url: string) => void;
  onToggleHideFromAll: (url: string) => void;
  reorderCategories: (categoryIds: string[]) => void;
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  updateCategory: (id: string, updates: Partial<FeedCategory>) => void;
  confirmDanger: ReturnType<typeof useNotificationReplacements>["confirmDanger"];
  alertSuccess: ReturnType<typeof useNotificationReplacements>["alertSuccess"];
}> = ({
  categories,
  createCategory,
  currentFeeds,
  deleteCategory,
  onEditFeed,
  onEditFeedTitle,
  onRemoveFeed,
  onToggleHideFromAll,
  reorderCategories,
  setFeeds,
  updateCategory,
  confirmDanger,
  alertSuccess,
}) => {
  const [expandedCategoryId, setExpandedCategoryId] = React.useState<string | null>(
    categories.find((category) => !category.isDefault)?.id || categories[0]?.id || null,
  );
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(
    null,
  );
  const [dragOverCategoryId, setDragOverCategoryId] = React.useState<string | null>(
    null,
  );
  const [categoryDragOverId, setCategoryDragOverId] = React.useState<string | null>(
    null,
  );
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategoryColor, setNewCategoryColor] = React.useState(
    categories.find((category) => !category.isDefault)?.color || "#3B82F6",
  );
  const [creatingCategory, setCreatingCategory] = React.useState(false);

  const visibleCategories = React.useMemo(
    () => categories.filter((category) => category.id !== "all"),
    [categories],
  );
  const feedsByCategory = React.useMemo(() => {
    const result: Record<string, FeedSource[]> = { uncategorized: [] };
    visibleCategories.forEach((category) => {
      result[category.id] = [];
    });
    currentFeeds.filter(isFeedActive).forEach((feed) => {
      const key = feed.categoryId && result[feed.categoryId] ? feed.categoryId : "uncategorized";
      result[key].push(feed);
    });
    Object.values(result).forEach((items) =>
      items.sort((a, b) =>
        getFeedManagerFeedTitle(a).localeCompare(getFeedManagerFeedTitle(b), "pt-BR"),
      ),
    );
    return result;
  }, [currentFeeds, visibleCategories]);

  const moveFeedToCategoryId = React.useCallback(
    (feedUrl: string, categoryId: string) => {
      setFeeds((feeds) =>
        feeds.map((feed) =>
          feed.url === feedUrl
            ? {
                ...feed,
                categoryId: categoryId === "uncategorized" ? undefined : categoryId,
              }
            : feed,
        ),
      );
    },
    [setFeeds],
  );

  const moveCategoryToIndex = React.useCallback(
    (categoryId: string, targetIndex: number) => {
      const ids = visibleCategories.map((category) => category.id);
      const currentIndex = ids.indexOf(categoryId);
      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= ids.length ||
        currentIndex === targetIndex
      ) {
        return;
      }
      const nextIds = [...ids];
      const [moved] = nextIds.splice(currentIndex, 1);
      nextIds.splice(targetIndex, 0, moved);
      reorderCategories(nextIds);
    },
    [reorderCategories, visibleCategories],
  );

  const handleDeleteCategory = React.useCallback(
    async (category: FeedCategory) => {
      const feedsInCategory = feedsByCategory[category.id] || [];
      if (
        await confirmDanger(
          buildDeleteCategoryConfirmation({ category, feedsInCategory }),
        )
      ) {
        setFeeds((feeds) =>
          feeds.map((feed) =>
            feed.categoryId === category.id
              ? { ...feed, categoryId: undefined }
              : feed,
          ),
        );
        deleteCategory(category.id);
        setExpandedCategoryId(null);
        setEditingCategoryId(null);
        await alertSuccess(`Categoria "${category.name}" excluída.`);
      }
    },
    [alertSuccess, confirmDanger, deleteCategory, feedsByCategory, setFeeds],
  );

  const renderFeedRow = (feed: FeedSource) => (
    <div
      key={feed.url}
      className="collection-central-feed-row"
    >
      <CollectionDragHandle
        label={`Arrastar ${getFeedManagerFeedTitle(feed)}`}
        onDragStart={(event) => {
          event.dataTransfer.setData("text/feed-url", feed.url);
          event.dataTransfer.effectAllowed = "move";
        }}
      />
      <Rss className="h-4 w-4 text-[rgb(var(--theme-text-secondary-readable))]" />
      <span className="collection-central-status-dot" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[13px] font-medium ${feed.hideFromAll ? "line-through opacity-60" : ""}`}>
          {getFeedManagerFeedTitle(feed)}
        </p>
        <p className="truncate text-[11.5px] text-[rgb(var(--theme-text-secondary-readable))] opacity-76">
          {feed.url}
        </p>
      </div>
      <div className="collection-central-feed-row__actions">
        {feed.categoryId && (
          <button
            type="button"
            onClick={() => moveFeedToCategoryId(feed.url, "uncategorized")}
            aria-label={`Mover ${getFeedManagerFeedTitle(feed)} para sem categoria`}
            title="Mover para sem categoria"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onToggleHideFromAll(feed.url)}
          aria-label={feed.hideFromAll ? "Mostrar em Todos" : "Ocultar de Todos"}
          title={feed.hideFromAll ? "Mostrar em Todos" : "Ocultar de Todos"}
        >
          {feed.hideFromAll ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => onEditFeedTitle(feed.url)}
          aria-label={`Editar nome de ${getFeedManagerFeedTitle(feed)}`}
          title="Editar nome"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onEditFeed(feed.url)}
          aria-label={`Editar URL de ${getFeedManagerFeedTitle(feed)}`}
          title="Editar URL"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemoveFeed(feed.url)}
          aria-label={`Excluir ${getFeedManagerFeedTitle(feed)}`}
          title="Excluir feed"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderDropZone = (categoryId: string, children: React.ReactNode) => (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (dragOverCategoryId !== categoryId) setDragOverCategoryId(categoryId);
      }}
      onDragLeave={() => {
        if (dragOverCategoryId === categoryId) setDragOverCategoryId(null);
      }}
      onDrop={(event) => {
        event.preventDefault();
        const feedUrl = event.dataTransfer.getData("text/feed-url");
        if (feedUrl) moveFeedToCategoryId(feedUrl, categoryId);
        setDragOverCategoryId(null);
      }}
      className={dragOverCategoryId === categoryId ? "collection-central-drop-target" : ""}
    >
      {children}
    </div>
  );

  return (
    <div className="feed-manager-page collection-central-page collection-central-page--organization">
      <section>
        <div className="collection-central-section-heading">
          <div className="min-w-0">
            <FeedManagerPageTitle
              title="Categorias"
              description="Clique para expandir, ajuste propriedades e mova feeds entre categorias."
            />
          </div>
          {creatingCategory ? (
            <form
              className="collection-central-new-category"
              onSubmit={(event) => {
                event.preventDefault();
                const name = newCategoryName.trim();
                if (!name) return;
                const created = createCategory(name, newCategoryColor);
                setExpandedCategoryId(created.id);
                setEditingCategoryId(created.id);
                setNewCategoryName("");
                setCreatingCategory(false);
              }}
            >
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                className={managerFieldClass}
                placeholder="Nova categoria"
                aria-label="Nome da nova categoria"
              />
              <input
                type="color"
                value={newCategoryColor}
                onChange={(event) => setNewCategoryColor(event.target.value)}
                className="collection-central-color-input"
                aria-label="Cor da nova categoria"
              />
              <button type="submit" className={`${managerPrimaryButtonClass} h-9 px-3`}>
                <Plus className="h-4 w-4" />
                Criar
              </button>
            </form>
          ) : (
            <button
              type="button"
              className={`${managerPrimaryButtonClass} h-9 px-3`}
              onClick={() => setCreatingCategory(true)}
            >
              <Plus className="h-4 w-4" />
              Nova categoria
            </button>
          )}
        </div>

        <FeedManagerLightCard className="overflow-hidden">
          {visibleCategories.map((category, index) => {
            const feedsInCategory = feedsByCategory[category.id] || [];
            const expanded = expandedCategoryId === category.id;
            return (
              <div
                key={category.id}
                className={
                  categoryDragOverId === category.id
                    ? "collection-central-category-drop-target"
                    : undefined
                }
                onDragOver={(event) => {
                  if (!event.dataTransfer.types.includes("text/category-id")) return;
                  event.preventDefault();
                  if (categoryDragOverId !== category.id) {
                    setCategoryDragOverId(category.id);
                  }
                }}
                onDragLeave={() => {
                  if (categoryDragOverId === category.id) setCategoryDragOverId(null);
                }}
                onDrop={(event) => {
                  const sourceCategoryId = event.dataTransfer.getData("text/category-id");
                  if (!sourceCategoryId) return;
                  event.preventDefault();
                  event.stopPropagation();
                  moveCategoryToIndex(sourceCategoryId, index);
                  setCategoryDragOverId(null);
                }}
              >
                {index > 0 && <div className="feed-manager-divider" />}
                {renderDropZone(
                  category.id,
                  <>
                    <div className="collection-central-category-row">
                      <CollectionDragHandle
                        label={`Arrastar categoria ${category.name}`}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/category-id", category.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                      />
                      <button
                        type="button"
                        className="collection-central-category-row__main"
                        onClick={() =>
                          setExpandedCategoryId(expanded ? null : category.id)
                        }
                        aria-expanded={expanded}
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expanded ? "rotate-90" : ""
                          }`}
                        />
                        <span
                          className="collection-central-category-swatch"
                          style={{ "--category-color": category.color } as React.CSSProperties}
                        >
                          <FolderTree className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium">
                            {category.name}
                          </span>
                          <span className="block truncate text-[11.5px] text-[rgb(var(--theme-text-secondary-readable))] opacity-76">
                            {feedsInCategory.length} {feedsInCategory.length === 1 ? "feed" : "feeds"}
                            {category.layoutMode ? ` · ${category.layoutMode}` : ""}
                          </span>
                        </span>
                      </button>
                      <div className="collection-central-category-row__actions">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCategoryId(expanded ? null : category.id)
                          }
                          aria-label={`Expandir feeds de ${category.name}`}
                          title="Expandir feeds"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedCategoryId(category.id);
                            setEditingCategoryId(
                              editingCategoryId === category.id ? null : category.id,
                            );
                          }}
                          aria-label={`Editar ${category.name}`}
                          title="Editar categoria"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCategory(category)}
                          aria-label={`Excluir ${category.name}`}
                          title="Excluir categoria"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {expanded && (
                      <div className="collection-central-category-body">
                        {editingCategoryId === category.id && (
                          <FeedManagerCategoryEditor
                            category={category}
                            onCancel={() => setEditingCategoryId(null)}
                            onDelete={() => void handleDeleteCategory(category)}
                            onSave={(updates) => {
                              updateCategory(category.id, updates);
                              setEditingCategoryId(null);
                            }}
                          />
                        )}
                        <div className="collection-central-feed-list">
                          {feedsInCategory.length === 0 ? (
                            <p className="collection-central-empty-row">
                              Sem feeds nesta categoria. Arraste uma fonte para cá ou use
                              o seletor na lista de feeds.
                            </p>
                          ) : (
                            feedsInCategory.map(renderFeedRow)
                          )}
                        </div>
                      </div>
                    )}
                  </>,
                )}
              </div>
            );
          })}
        </FeedManagerLightCard>
      </section>

      <section>
        <FeedManagerPageTitle
          title="Feeds sem categoria"
          description="Feeds sem categoria continuam na coleção, mas não têm roteamento visual definido."
        />
        <FeedManagerLightCard className="overflow-hidden">
          {renderDropZone(
            "uncategorized",
            (feedsByCategory.uncategorized || []).length === 0 ? (
              <div className="collection-central-empty-row">
                <Inbox className="h-4 w-4" />
                Nenhum feed pendente de organização.
              </div>
            ) : (
              (feedsByCategory.uncategorized || []).map(renderFeedRow)
            ),
          )}
        </FeedManagerLightCard>
      </section>
    </div>
  );
};

const proxyRouteModeLabels: Record<
  ProxyRouteMode,
  { label: string; description: string }
> = {
  "full-local": {
    label: "Local",
    description: "Backend local sem fallback externo",
  },
  mixed: {
    label: "Misto",
    description: "Local primeiro, proxies depois",
  },
  "full-external-proxies": {
    label: "Web",
    description: "Ignora backend local para feeds",
  },
};

const proxyRouteModeOptions: ProxyRouteMode[] = [
  "full-local",
  "mixed",
  "full-external-proxies",
];

const getRuntimeRouteForCollectionProxy = (
  proxyId: string,
  proxyName: string,
  routes: ProxyDashboardRoute[],
) => {
  if (proxyId === "local-proxy") {
    return routes.find((route) => route.routeKind === "local-backend");
  }
  return routes.find(
    (route) => route.routeKind === "proxy" && route.name === proxyName,
  );
};

const getProxyStatus = (
  enabled: boolean,
  route?: ProxyDashboardRoute,
): "healthy" | "degraded" | "offline" | "idle" | "disabled" => {
  if (!enabled || route?.status === "disabled") return "disabled";
  return route?.status || "idle";
};

const proxyStatusLabel: Record<
  ReturnType<typeof getProxyStatus>,
  string
> = {
  healthy: "Saudável",
  degraded: "Instável",
  offline: "Erro",
  idle: "Sem uso",
  disabled: "Desativado",
};

const ProxyApiKeyDialog: React.FC<{
  draft: string;
  error?: string;
  isOpen: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  proxyName?: string;
}> = ({ draft, error, isOpen, onChange, onClose, onSave, proxyName }) => (
  <CollectionDialog
    isOpen={isOpen}
    onClose={onClose}
    title={`API key${proxyName ? ` — ${proxyName}` : ""}`}
    description="A chave é armazenada localmente e enviada apenas para o proxy correspondente."
    icon={<Key className="h-4 w-4" />}
    footer={
      <div className="collection-central-dialog__actions">
        <button
          type="button"
          onClick={onClose}
          className={`${managerSecondaryButtonClass} h-9 px-3`}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          className={`${managerPrimaryButtonClass} h-9 px-3`}
        >
          Salvar
        </button>
      </div>
    }
  >
    <div className="collection-central-api-key-form">
      <input
        type="text"
        value={draft}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Cole a chave aqui"
        className={managerFieldClass}
      />
      <p>Deixe em branco para remover a chave atual.</p>
      {error && <strong>{error}</strong>}
    </div>
  </CollectionDialog>
);

const CollectionCachePolicyDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [ttl, setTtl] = React.useState(10);
  const [maxSize, setMaxSize] = React.useState(50);
  const [respectEtag, setRespectEtag] = React.useState(true);
  const [staleWhileRevalidate, setStaleWhileRevalidate] = React.useState(true);
  const [offlineFallback, setOfflineFallback] = React.useState(true);

  const plannedTasks = [
    "Persistir TTL por coleção e por feed",
    "Aplicar stale-while-revalidate no fetch de feeds",
    "Adicionar limpeza manual e limites de armazenamento",
    "Registrar métricas de hit, miss e revalidação",
  ];
  const toggleRows = [
    {
      icon: <ShieldAlert className="h-4 w-4" />,
      title: "Respeitar ETag e Last-Modified",
      description: "Usa cabeçalhos condicionais para reduzir downloads.",
      checked: respectEtag,
      onChange: setRespectEtag,
    },
    {
      icon: <RefreshCw className="h-4 w-4" />,
      title: "Stale-while-revalidate",
      description: "Mostra cache recente enquanto revalida em segundo plano.",
      checked: staleWhileRevalidate,
      onChange: setStaleWhileRevalidate,
    },
    {
      icon: <Wifi className="h-4 w-4" />,
      title: "Fallback offline",
      description: "Mantém artigos disponíveis quando a rede falhar.",
      checked: offlineFallback,
      onChange: setOfflineFallback,
    },
  ];

  return (
    <CollectionDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Política de cache"
      description="Pré-visualização funcional das opções planejadas para o cache de feeds."
      icon={<Database className="h-4 w-4" />}
      wide
      footer={
        <div className="collection-central-dialog__actions">
          <button
            type="button"
            onClick={onClose}
            className={`${managerSecondaryButtonClass} h-9 px-3`}
          >
            Fechar
          </button>
        </div>
      }
    >
      <div className="collection-central-cache-policy">
        <div className="collection-central-cache-notice">
          <AlertTriangle className="h-4 w-4" />
          <p>
            Este painel é um placeholder de implementação: os controles abaixo
            não alteram o motor de cache atual.
          </p>
        </div>

        <div className="collection-central-cache-control">
          <div>
            <label htmlFor="collection-cache-ttl">Tempo de vida (TTL)</label>
            <span>{ttl} min</span>
          </div>
          <input
            id="collection-cache-ttl"
            type="range"
            min={1}
            max={60}
            value={ttl}
            onChange={(event) => setTtl(Number(event.target.value))}
          />
          <p>Duração padrão antes de revalidar uma fonte.</p>
        </div>

        <div className="feed-manager-light-card collection-central-cache-toggle-group">
          {toggleRows.map((row) => (
            <label key={row.title} className="collection-central-cache-toggle">
              <span className="feed-manager-light-row__icon">{row.icon}</span>
              <span className="min-w-0 flex-1">
                <strong>{row.title}</strong>
                <small>{row.description}</small>
              </span>
              <input
                type="checkbox"
                checked={row.checked}
                onChange={(event) => row.onChange(event.target.checked)}
              />
            </label>
          ))}
        </div>

        <div className="collection-central-cache-control">
          <div>
            <label htmlFor="collection-cache-size">Limite de armazenamento</label>
            <span>{maxSize} MB</span>
          </div>
          <input
            id="collection-cache-size"
            type="range"
            min={10}
            max={500}
            step={10}
            value={maxSize}
            onChange={(event) => setMaxSize(Number(event.target.value))}
          />
          <p>Limite previsto para retenção local de respostas e metadados.</p>
        </div>

        <div className="feed-manager-light-card collection-central-cache-tasks">
          <div className="collection-central-cache-tasks__header">
            <strong>Tarefas para acelerar implementação</strong>
            <span>preview</span>
          </div>
          {plannedTasks.map((task) => (
            <div key={task} className="collection-central-cache-task-row">
              <Check className="h-4 w-4" />
              <span>{task}</span>
            </div>
          ))}
        </div>
      </div>
    </CollectionDialog>
  );
};

const CollectionProxyPanel: React.FC = () => {
  const {
    apiKeys,
    validationErrors,
    routingMode,
    clientProxyOrder,
    setRoutingMode,
    moveClientProxy,
    setProxyEnabled,
    setApiKey,
    clearApiKey,
    getAllProxiesStatus,
    testProxy,
  } = useProxyConfig();
  const dashboard = useProxyDashboard();
  const snapshot = dashboard.snapshot;
  const [apiKeyTarget, setApiKeyTarget] = React.useState<string | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = React.useState("");
  const [testingProxy, setTestingProxy] = React.useState<string | null>(null);
  const [cacheDialogOpen, setCacheDialogOpen] = React.useState(false);
  const [testResults, setTestResults] = React.useState<
    Record<string, ProxyTestResult>
  >({});
  const proxies = React.useMemo(() => {
    const routeOrder = new Map(
      clientProxyOrder.map((proxyId, index) => [proxyId, index]),
    );
    return getAllProxiesStatus().sort((a, b) => {
      if (a.id === "local-proxy") return -1;
      if (b.id === "local-proxy") return 1;
      const aOrder = routeOrder.get(a.id);
      const bOrder = routeOrder.get(b.id);
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return a.name.localeCompare(b.name, "pt-BR");
    });
  }, [clientProxyOrder, getAllProxiesStatus]);
  const localProxy = proxies.find((proxy) => proxy.id === "local-proxy");
  const thirdParty = proxies.filter((proxy) => proxy.id !== "local-proxy");
  const enabledThirdParty = thirdParty.filter((proxy) => proxy.enabled).length;
  const targetProxy = apiKeyTarget
    ? proxies.find((proxy) => proxy.id === apiKeyTarget)
    : undefined;

  const handleOpenApiKey = (proxyId: string) => {
    setApiKeyTarget(proxyId);
    setApiKeyDraft(apiKeys[proxyId] || "");
  };
  const handleSaveApiKey = () => {
    if (!apiKeyTarget) return;
    const value = apiKeyDraft.trim();
    if (!value) {
      clearApiKey(apiKeyTarget);
      setApiKeyTarget(null);
      return;
    }
    if (setApiKey(apiKeyTarget, value)) {
      setApiKeyTarget(null);
    }
  };
  const handleTestProxy = async (proxyId: string) => {
    setTestingProxy(proxyId);
    try {
      const result = await testProxy(proxyId);
      setTestResults((current) => ({ ...current, [proxyId]: result }));
      await dashboard.refresh();
    } finally {
      setTestingProxy(null);
    }
  };

  const renderProxyRow = (
    proxy: (typeof proxies)[number],
    index: number,
    total: number,
  ) => {
    const metadata = PROXY_CONFIGS[proxy.id];
    const route = getRuntimeRouteForCollectionProxy(
      proxy.id,
      proxy.name,
      snapshot.routes,
    );
    const status = getProxyStatus(proxy.enabled, route);
    const isLocal = proxy.id === "local-proxy";
    const canMove = !isLocal && clientProxyOrder.includes(proxy.id);
    const routeOrder = clientProxyOrder.indexOf(proxy.id);
    const healthScore = route?.healthScore ?? proxy.health.score;
    const testResult = testResults[proxy.id];
    const canDisable = ProxyManager.canDisableRuntimeProxy(proxy.name);

    return (
      <div key={proxy.id} className="collection-central-proxy-row">
        <div
          className={`collection-central-proxy-row__order ${
            isLocal ? "collection-central-proxy-row__order--local" : ""
          }`}
        >
          {isLocal ? (
            <Monitor className="h-4 w-4" />
          ) : (
            <>
              <button
                type="button"
                onClick={() => moveClientProxy(proxy.id, "up")}
                disabled={!canMove || routeOrder <= 0}
                aria-label={`Subir prioridade de ${proxy.name}`}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <span>{index + 1}</span>
              <button
                type="button"
                onClick={() => moveClientProxy(proxy.id, "down")}
                disabled={!canMove || routeOrder === total - 1}
                aria-label={`Descer prioridade de ${proxy.name}`}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
        {!isLocal && (
          <span className="feed-manager-light-row__icon">
            <Globe className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="collection-central-proxy-row__title">
            <strong>{proxy.name}</strong>
            <span className={`collection-central-proxy-status collection-central-proxy-status--${status}`}>
              {proxyStatusLabel[status]}
            </span>
            {proxy.hasApiKey && (
              <span className="collection-central-badge">
                {proxy.isConfigured ? "API key" : "sem chave"}
              </span>
            )}
          </div>
          <p>{metadata?.description || proxy.health.recommendation}</p>
          <div className="collection-central-proxy-row__stats">
            <span>{healthScore}% saúde</span>
            <span>
              {route?.successRate !== null && route?.successRate !== undefined
                ? `${route.successRate}% sucesso`
                : "sem sessão"}
            </span>
            <span>
              {route?.avgResponseTime
                ? `${Math.round(route.avgResponseTime)} ms`
                : metadata?.responseTime || "sem latência"}
            </span>
            {isLocal && (
              <>
                <span>
                  backend {snapshot.backend.available ? "disponível" : "offline"}
                </span>
                <span>{snapshot.summary.totalRequests} requisições</span>
              </>
            )}
            {testResult && (
              <span>{testResult.success ? "teste ok" : "teste falhou"}</span>
            )}
          </div>
        </div>
        <div className="collection-central-proxy-row__actions">
          {proxy.hasApiKey && (
            <button
              type="button"
              onClick={() => handleOpenApiKey(proxy.id)}
              aria-label={`Configurar chave de ${proxy.name}`}
              title="Configurar API key"
            >
              <Key className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleTestProxy(proxy.id)}
            disabled={testingProxy === proxy.id || !proxy.enabled}
            aria-label={`Testar ${proxy.name}`}
            title="Testar proxy"
          >
            <PlayCircle
              className={`h-4 w-4 ${
                testingProxy === proxy.id ? "animate-spin" : ""
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setProxyEnabled(proxy.id, !proxy.enabled)}
            disabled={!canDisable}
            aria-label={
              proxy.enabled ? `Desativar ${proxy.name}` : `Ativar ${proxy.name}`
            }
            title={
              canDisable
                ? proxy.enabled
                  ? "Desativar proxy"
                  : "Ativar proxy"
                : "Obrigatório no runtime atual"
            }
          >
            <Power className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <section
      id="feed-manager-section-diagnostics-infra"
      className="collection-central-proxy-section"
    >
      <FeedManagerPageTitle
        title="Infraestrutura e proxies"
        description="A versão web depende de proxies de terceiros. A versão desktop pode usar o proxy local como padrão."
      />

      <FeedManagerLightCard className="collection-central-proxy-mode-card">
        <div className="flex min-w-0 items-center gap-3">
          <span className="feed-manager-light-row__icon">
            {routingMode === "full-external-proxies" ? (
              <Globe className="h-[18px] w-[18px]" />
            ) : (
              <Monitor className="h-[18px] w-[18px]" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold">
              Modo de execução: {proxyRouteModeLabels[routingMode].label}
            </p>
            <p className="text-[12px] opacity-72">
              {proxyRouteModeLabels[routingMode].description}
            </p>
          </div>
        </div>
        <div className="collection-central-proxy-mode-switch">
          {proxyRouteModeOptions.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setRoutingMode(mode)}
              className={routingMode === mode ? "is-active" : ""}
            >
              {mode === "full-external-proxies" ? (
                <Wifi className="h-3.5 w-3.5" />
              ) : (
                <Monitor className="h-3.5 w-3.5" />
              )}
              {proxyRouteModeLabels[mode].label}
            </button>
          ))}
        </div>
      </FeedManagerLightCard>

      {localProxy && (
        <FeedManagerLightCard className="collection-central-proxy-local-card">
          {renderProxyRow(localProxy, 0, 1)}
        </FeedManagerLightCard>
      )}

      <FeedManagerLightCard className="collection-central-proxy-list">
        <div className="collection-central-proxy-list__header">
          <div>
            <p>Proxies de terceiros</p>
            <span>
              Ordenados por prioridade · {enabledThirdParty} ativos de{" "}
              {thirdParty.length}
            </span>
          </div>
          <button
            type="button"
            className={managerSecondaryButtonClass}
            disabled
            title="Cadastro manual de proxy customizado ainda não está disponível."
          >
            <Settings2 className="h-4 w-4" />
            Adicionar proxy
          </button>
        </div>
        <div>
          {thirdParty.map((proxy, index) =>
            renderProxyRow(proxy, index, thirdParty.length),
          )}
        </div>
      </FeedManagerLightCard>

      <FeedManagerLightCard>
        <FeedManagerLightRow
          icon={<Database className="h-[18px] w-[18px]" />}
          title="Política de cache"
          description="TTL configurável · respeita cache local · stale-while-revalidate quando disponível"
          onClick={() => setCacheDialogOpen(true)}
        />
      </FeedManagerLightCard>

      <ProxyApiKeyDialog
        isOpen={!!apiKeyTarget}
        onClose={() => setApiKeyTarget(null)}
        proxyName={targetProxy?.name}
        draft={apiKeyDraft}
        onChange={setApiKeyDraft}
        onSave={handleSaveApiKey}
        error={apiKeyTarget ? validationErrors[apiKeyTarget] : undefined}
      />
      <CollectionCachePolicyDialog
        isOpen={cacheDialogOpen}
        onClose={() => setCacheDialogOpen(false)}
      />
    </section>
  );
};

const FeedManagerDiagnosticsPage: React.FC<{
  activeFeeds: FeedSource[];
  articles: Article[];
  categories: FeedCategory[];
  feedValidations: Map<string, FeedValidationResult>;
  focusSection?: string;
  onFocusConsumed?: () => void;
  onQuarantineFeed: (url: string) => void;
  onRefreshFeeds?: () => void;
  onRetryFeeds: (urls: string[]) => void | Promise<void>;
  onShowError: (url: string, validation?: FeedValidationResult) => void;
  quarantineRecommendedUrls: Set<string>;
}> = ({
  activeFeeds,
  articles,
  categories,
  feedValidations,
  focusSection,
  onFocusConsumed,
  onQuarantineFeed,
  onRefreshFeeds,
  onRetryFeeds,
  onShowError,
  quarantineRecommendedUrls,
}) => {
  React.useEffect(() => {
    if (!focusSection) return;
    if (focusSection !== "proxy-health" && focusSection !== "diagnostics:infra") {
      return;
    }
    window.setTimeout(() => {
      document
        .getElementById("feed-manager-section-diagnostics-infra")
        ?.scrollIntoView?.({ block: "start", behavior: "smooth" });
      onFocusConsumed?.();
    }, 60);
  }, [focusSection, onFocusConsumed]);

  const rows = React.useMemo(
    () =>
      activeFeeds
        .map((feed) => {
          const validation = feedValidations.get(feed.url);
          const title = validation?.title || getFeedManagerFeedTitle(feed);
          const host = (() => {
            try {
              return new URL(feed.url).hostname.replace(/^www\./, "");
            } catch {
              return feed.url;
            }
          })();
          return { feed, validation, title, host };
        })
        .sort((a, b) => a.title.localeCompare(b.title, "pt-BR")),
    [activeFeeds, feedValidations],
  );
  const invalidRows = rows.filter(
    (row) => row.validation && !row.validation.isValid,
  );
  const pendingRows = rows.filter((row) => !row.validation);
  const validRows = rows.filter((row) => row.validation?.isValid);
  const successRate =
    rows.length > 0 ? Math.round((validRows.length / rows.length) * 100) : 0;
  const averageLatency = React.useMemo(() => {
    const times = rows
      .map(
        (row) =>
          row.validation?.responseTime || row.validation?.totalValidationTime || 0,
      )
      .filter((time) => time > 0);
    if (times.length === 0) return 0;
    return Math.round(times.reduce((total, time) => total + time, 0) / times.length);
  }, [rows]);
  const latencyScore =
    averageLatency > 0
      ? Math.max(0, Math.min(100, Math.round(100 - averageLatency / 30)))
      : 0;
  const lastChecked = Math.max(
    0,
    ...rows.map((row) => row.validation?.lastChecked || 0),
  );
  const lastCheckedLabel =
    lastChecked > 0
      ? new Intl.DateTimeFormat("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(lastChecked))
      : "sem leitura";
  const retryUrls = invalidRows.map((row) => row.feed.url);
  const attentionRows = invalidRows.slice(0, 6);

  return (
    <div className="feed-manager-page collection-central-page collection-central-page--diagnostics">
      <section>
        <FeedManagerPageTitle
          title="Saúde dos feeds"
          description="Resultado da última varredura."
        />
        <FeedManagerLightCard className="collection-central-health-panel">
          <div className="collection-central-health-summary">
            <div className="collection-central-health-status">
              <span className="feed-manager-light-row__icon">
                {invalidRows.length > 0 ? (
                  <AlertTriangle className="h-[18px] w-[18px]" />
                ) : (
                  <CircleCheck className="h-[18px] w-[18px]" />
                )}
              </span>
              <div>
                <span>Status geral</span>
                <strong
                  className={
                    invalidRows.length > 0
                      ? "text-[rgb(var(--color-warning))]"
                      : "text-[rgb(var(--color-success))]"
                  }
                >
                  {invalidRows.length > 0 ? "Atenção" : "Saudável"}
                </strong>
                <small>
                  {invalidRows.length > 0
                    ? `${invalidRows.length} fontes pedem revisão.`
                    : "Nenhuma falha ativa detectada."}
                </small>
              </div>
            </div>
            <div className="collection-central-health-bars">
              <div className="collection-central-health-bar">
                <span>Disponibilidade</span>
                <strong>{successRate}%</strong>
                <i style={{ "--value": `${successRate}%` } as React.CSSProperties} />
                <small>{validRows.length}/{rows.length} fontes válidas</small>
              </div>
              <div className="collection-central-health-bar collection-central-health-bar--latency">
                <span>Latência média</span>
                <strong>{averageLatency > 0 ? `${averageLatency} ms` : "sem dados"}</strong>
                <i style={{ "--value": `${latencyScore}%` } as React.CSSProperties} />
                <small>{pendingRows.length} pendentes de leitura</small>
              </div>
            </div>
          </div>
          <div className="collection-central-health-actions">
            <button
              type="button"
              onClick={onRefreshFeeds}
              disabled={!onRefreshFeeds}
              className={`${managerPrimaryButtonClass} h-9 px-3 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <RefreshCw className="h-4 w-4" />
              Revalidar agora
            </button>
            <button
              type="button"
              onClick={() => void onRetryFeeds(retryUrls)}
              disabled={retryUrls.length === 0}
              className={`${managerSecondaryButtonClass} h-9 px-3 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Activity className="h-4 w-4" />
              Testar atenção
            </button>
          </div>
        </FeedManagerLightCard>
      </section>

      <section>
        <FeedManagerPageTitle
          title="Lista de atenção"
          description="Fontes com erro ou recomendação de quarentena."
        />
        {attentionRows.length > 0 ? (
          <FeedManagerLightCard className="overflow-hidden">
            {attentionRows.map((row) => (
              <div key={row.feed.url} className="collection-central-source-row">
                <span className="feed-manager-light-row__icon">
                  <AlertTriangle className="h-[17px] w-[17px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">
                    {row.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] opacity-72">
                    {row.host} · {row.validation?.error || row.validation?.status || "erro"}
                  </p>
                </div>
                <div className="collection-central-feed-row__actions">
                  <button
                    type="button"
                    onClick={() => void onRetryFeeds([row.feed.url])}
                    aria-label={`Testar ${row.title}`}
                    title="Testar agora"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  {row.validation && (
                    <button
                      type="button"
                      onClick={() => onShowError(row.feed.url, row.validation)}
                      aria-label={`Ver erro de ${row.title}`}
                      title="Ver erro"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  {quarantineRecommendedUrls.has(row.feed.url) && (
                    <button
                      type="button"
                      onClick={() => onQuarantineFeed(row.feed.url)}
                      aria-label={`Quarentenar ${row.title}`}
                      title="Quarentenar"
                    >
                      <ShieldAlert className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </FeedManagerLightCard>
        ) : (
          <FeedManagerLightCard className="p-5">
            <div className="flex items-center gap-3">
              <span className="feed-manager-light-row__icon">
                <CircleCheck className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold">
                  Nenhuma ação necessária
                </p>
                <p className="text-[12px] opacity-72">
                  Os feeds validados não apresentam falhas no momento.
                </p>
              </div>
            </div>
          </FeedManagerLightCard>
        )}
      </section>

      <CollectionProxyPanel />

      <section>
        <FeedManagerPageTitle title="Relatórios" />
        <FeedManagerLightCard>
          <FeedManagerLightRow
            icon={<BarChart3 className="h-[18px] w-[18px]" />}
            title="Relatório de validação"
            description={`${validRows.length}/${rows.length} fontes verificadas · última leitura ${lastCheckedLabel}`}
          />
          <FeedManagerLightRow
            icon={<Activity className="h-[18px] w-[18px]" />}
            title="Eventos recentes"
            description={
              invalidRows.length > 0
                ? `${invalidRows.length} eventos exigem revisão`
                : "Sem eventos críticos na última leitura"
            }
          />
          <FeedManagerLightRow
            icon={<FileText className="h-[18px] w-[18px]" />}
            title="Resumo da biblioteca"
            description={`${categories.length} categorias · ${articles.length} artigos carregados`}
          />
        </FeedManagerLightCard>
      </section>
    </div>
  );
};

const FeedManagerWorkspaceFooter: React.FC<{
  activeFeedCount: number;
  environmentLabel: string;
  invalidCount: number;
  quarantineCount: number;
  totalFeedCount: number;
}> = ({
  activeFeedCount,
  environmentLabel,
  invalidCount,
  quarantineCount,
  totalFeedCount,
}) => (
  <footer className="feed-manager-workspace-footer" aria-label="Resumo do gerenciador">
    <p className="text-sm leading-relaxed">
      <strong>Personal News v{appVersion}</strong>
      <span className="block text-xs opacity-75">Gerenciador de feeds</span>
    </p>
    <p className="text-sm leading-relaxed">
      <strong>{environmentLabel}</strong>
      <span className="block text-xs opacity-75">Ambiente atual</span>
    </p>
    <p className="text-sm leading-relaxed">
      <strong>
        {activeFeedCount}/{totalFeedCount} ativos
      </strong>
      <span className="block text-xs opacity-75">
        {invalidCount} com erro, {quarantineCount} em quarentena
      </span>
    </p>
  </footer>
);

export const FeedManager: React.FC<FeedManagerProps> = ({
  currentFeeds,
  setFeeds,
  closeModal,
  articles = [],
  onRefreshFeeds,
}) => {
  const logger = useLogger("FeedManager");
  const {
    categories,
    createCategory,
    deleteCategory,
    reorderCategories,
    resetToDefaults,
    updateCategory,
  } = useFeedCategories();
  const { refreshAppearance } = useAppearance();
  const { confirm, alertSuccess, alertError, confirmDanger, confirmWarning } =
    useNotificationReplacements();

  const [activeRoute, setActiveRoute] =
    useState<FeedManagerRoute>("feeds:overview");
  const [expandedAccordionRoutes, setExpandedAccordionRoutes] = useState<
    Record<FeedManagerAccordionRoute, boolean>
  >(feedManagerAccordionDefaults);
  const sidebarCollapsed = false;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedAreas, setExpandedAreas] = useState<
    Record<FeedManagerArea, boolean>
  >({
    overview: true,
    sources: true,
    organization: true,
    maintenance: true,
    diagnostics: false,
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
  const environmentLabel = React.useMemo(
    () => formatFeedManagerEnvironment(detectEnvironment()),
    [],
  );
  const activeArea = routeAreaMap[activeRoute];
  const activeAreaContent = areaContentMap[activeArea];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerCloseButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const closeMobileNavigation = React.useCallback(() => {
    setMobileSidebarOpen(false);
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      mobileMenuButtonRef.current?.focus();
    }, 0);
  }, []);

  const openMobileNavigation = React.useCallback(() => {
    setMobileSidebarOpen(true);
  }, []);

  useEffect(() => {
    if (!mobileSidebarOpen || typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        closeMobileNavigation();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFeedManagerDrawerFocusableElements(
        sidebarRef.current,
      );
      if (focusableElements.length === 0) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        event.stopPropagation();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        event.stopPropagation();
        firstElement.focus();
      }
    };

    const focusTimer = window.setTimeout(() => {
      mobileDrawerCloseButtonRef.current?.focus({ preventScroll: true });
    }, 80);

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [closeMobileNavigation, mobileSidebarOpen]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const closeDrawerOnDesktop = (event?: MediaQueryListEvent) => {
      if (event ? event.matches : query.matches) {
        setMobileSidebarOpen(false);
      }
    };

    closeDrawerOnDesktop();
    query.addEventListener?.("change", closeDrawerOnDesktop);
    return () => {
      query.removeEventListener?.("change", closeDrawerOnDesktop);
    };
  }, []);

  const openAccordionRoute = React.useCallback((route: FeedManagerRoute) => {
    const nextRoute = canonicalizeFeedManagerRoute(route);
    if (!isFeedManagerAccordionRoute(nextRoute)) return;

    setExpandedAccordionRoutes((current) =>
      current[nextRoute]
        ? current
        : {
            ...current,
            [nextRoute]: true,
          },
    );
  }, []);

  const toggleAccordionRoute = React.useCallback(
    (route: FeedManagerAccordionRoute) => {
      setExpandedAccordionRoutes((current) => ({
        ...current,
        [route]: !current[route],
      }));
    },
    [],
  );

  const navigateToRoute = React.useCallback(
    (route: FeedManagerRoute, focusSection?: string) => {
      const nextRoute = canonicalizeFeedManagerRoute(route);
      const nextArea = routeAreaMap[nextRoute];
      openAccordionRoute(nextRoute);
      setActiveRoute(nextRoute);
      setDiagnosticsFocus(focusSection || null);
      setExpandedAreas((current) => ({
        ...current,
        [nextArea]: true,
      }));
      const scrollContainer = contentScrollRef.current;
      if (typeof scrollContainer?.scrollTo === "function") {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [openAccordionRoute],
  );

  useEffect(() => {
    setExpandedAreas((current) =>
      current[activeArea]
        ? current
        : {
            ...current,
            [activeArea]: true,
          },
    );
  }, [activeArea]);

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
        const nextRoute = normalizePersistedRoute(
          parsed.tab,
          parsed.section,
          parsed.openProxySettings,
        );
        setActiveRoute(nextRoute);
        openAccordionRoute(nextRoute);
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
  }, [openAccordionRoute]);

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
      (activeArea === "overview" ||
        activeArea === "sources" ||
        activeArea === "diagnostics")
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
        feed.url === feedUrl
          ? {
              ...feed,
              categoryId:
                categoryId === "uncategorized" || categoryId === ""
                  ? undefined
                  : categoryId,
            }
          : feed,
      ),
    );
    void alertSuccess("Categoria atualizada!");
  };

  const moveFeedsToCategory = React.useCallback(
    async (feedUrls: string[], categoryId: string) => {
      const targetCategory = categories.find((category) => category.id === categoryId);
      if (!targetCategory || feedUrls.length === 0) return;
      const urlSet = new Set(feedUrls);
      setFeeds((prev) =>
        prev.map((feed) =>
          urlSet.has(feed.url) ? { ...feed, categoryId } : feed,
        ),
      );
      await alertSuccess(
        `${feedUrls.length} feed${feedUrls.length === 1 ? "" : "s"} movido${feedUrls.length === 1 ? "" : "s"} para ${targetCategory.name}.`,
      );
    },
    [alertSuccess, categories, setFeeds],
  );

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

  const handleImportCurated = async (
    mode: CuratedImportMode,
    selectedFeeds: FeedSource[],
    listName: string,
  ) => {
    if (selectedFeeds.length === 0) return;

    const feedsToImport = selectedFeeds;

    if (mode === "replace") {
      if (
        await confirmDanger(
          buildReplaceCuratedCollectionConfirmation({
            currentFeeds,
            replacementFeeds: feedsToImport,
            listName,
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

  const handleResetCategoriesToDefaults = async () => {
    if (
      await confirmDanger(
        buildResetCategoriesConfirmation({
          categories,
          feedCount: currentFeeds.length,
        }),
      )
    ) {
      resetToDefaults();
      setFeeds((feeds) =>
        feeds.map((feed) => ({ ...feed, categoryId: undefined })),
      );
      await alertSuccess("Categorias padrão restauradas.");
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
    async (urls: string[]) => {
      const urlSet = new Set(urls);
      const candidates = currentFeeds.filter(
        (feed) => urlSet.has(feed.url) && !isFeedQuarantined(feed),
      );
      if (candidates.length === 0) return;
      const confirmed = await confirmWarning(
        `Colocar ${candidates.length} feed${candidates.length === 1 ? "" : "s"} em quarentena? Eles sairão das categorias e do carregamento, mas poderão ser testados e restaurados depois.`,
        "Quarentenar selecionados",
      );
      if (!confirmed) return;

      setFeeds((prev) =>
        prev.map((feed) =>
          urlSet.has(feed.url) && !isFeedQuarantined(feed)
            ? quarantineFeed(feed, getQuarantineReason(feed.url))
            : feed,
        ),
      );
      await alertSuccess(
        `${candidates.length} feed${candidates.length === 1 ? "" : "s"} enviado${candidates.length === 1 ? "" : "s"} para quarentena.`,
      );
    },
    [alertSuccess, confirmWarning, currentFeeds, getQuarantineReason, setFeeds],
  );

  const handleValidateSelectedFeeds = React.useCallback(
    async (urls: string[]) => {
      if (urls.length === 0) return;
      const results = await Promise.all(urls.map((url) => validateSingleFeed(url)));
      const checkedCount = results.filter(Boolean).length;
      if (checkedCount === 0) {
        await alertError("Não foi possível testar os feeds selecionados.");
        return;
      }
      await alertSuccess(
        `${checkedCount} feed${checkedCount === 1 ? "" : "s"} testado${checkedCount === 1 ? "" : "s"}.`,
      );
    },
    [alertError, alertSuccess, validateSingleFeed],
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
      openAccordionRoute("diagnostics:infra");
      setActiveRoute("diagnostics:infra");
    } else if (sectionId === "feed-reports") {
      openAccordionRoute("diagnostics:reports");
      setActiveRoute("diagnostics:reports");
    } else {
      openAccordionRoute("diagnostics:health");
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
    badge?: number;
    focusSection?: string;
  }> = [
    {
      id: "overview",
      label: "Visão geral",
      description: "Resumo e próximos passos",
      overviewRoute: "feeds:overview",
      icon: <LayoutGrid className="h-4 w-4" />,
    },
    {
      id: "sources",
      label: "Fontes",
      description: "Feeds, busca e quarentena",
      overviewRoute: "feeds:list",
      icon: <Rss className="h-4 w-4" />,
      badge: quarantineCount > 0 ? quarantineCount : undefined,
    },
    {
      id: "organization",
      label: "Organização",
      description: "Categorias",
      overviewRoute: "feeds:categories",
      icon: <FolderTree className="h-4 w-4" />,
    },
    {
      id: "maintenance",
      label: "Manutenção",
      description: "Backup, reparos e risco",
      overviewRoute: "operations:overview",
      icon: <Wrench className="h-4 w-4" />,
    },
    {
      id: "diagnostics",
      label: "Diagnóstico",
      description: "Saúde e infraestrutura",
      overviewRoute: "diagnostics:overview",
      icon: <Activity className="h-4 w-4" />,
      badge: invalidCount > 0 ? invalidCount : undefined,
    },
  ];
  const selectAreaOverview = (group: {
    id: FeedManagerArea;
    overviewRoute: FeedManagerRoute;
    focusSection?: string;
  }) => {
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
    setExpandedAreas({
      overview: false,
      sources: false,
      organization: false,
      maintenance: false,
      diagnostics: false,
      [group.id]: true,
    });
    navigateToRoute(group.overviewRoute, group.focusSection);
  };

  return (
    <div
      className="feed-manager-shell"
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
      <FeedManagerTopbar
        closeModal={closeModal}
        mobileMenuButtonRef={mobileMenuButtonRef}
        mobileSidebarOpen={mobileSidebarOpen}
        onAddSource={() => navigateToRoute("feeds:add")}
        onOpenMobileNavigation={openMobileNavigation}
        onRefreshFeeds={onRefreshFeeds ? handleConfirmRefreshAll : undefined}
      />

      {mobileSidebarOpen && (
        <button
          type="button"
          className="feed-manager-mobile-backdrop"
          aria-label="Fechar menu de navegação"
          onClick={closeMobileNavigation}
        />
      )}

      <div
        className={`feed-manager-layout ${
          sidebarCollapsed
            ? "feed-manager-layout--collapsed"
            : "feed-manager-layout--expanded"
        }`}
      >
        <aside
          ref={sidebarRef}
          id="feed-manager-sidebar"
          className={`feed-manager-sidebar ${
            mobileSidebarOpen ? "feed-manager-sidebar--open" : ""
          }`}
          role={mobileSidebarOpen ? "dialog" : undefined}
          aria-modal={mobileSidebarOpen ? "true" : undefined}
          aria-label={
            mobileSidebarOpen
              ? "Menu de navegação do gerenciador de feeds"
              : undefined
          }
        >
          <div
            className={`flex h-full flex-col gap-3 overflow-y-auto custom-scrollbar ${
              sidebarCollapsed ? "p-3" : "p-3 sm:p-4"
            }`}
          >
            <div
              className={`feed-manager-sidebar-header flex items-start gap-2 px-2 pb-4 pt-3 ${
                sidebarCollapsed ? "justify-center" : "justify-between"
              }`}
            >
              <div className={sidebarCollapsed ? "sr-only" : "min-w-0"}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--theme-text-secondary-readable))] opacity-75">
                  Personal News
                </p>
                <p className="mt-1 text-[13px] font-semibold leading-tight text-[rgb(var(--theme-text-readable))]">
                  Central da Coleção
                </p>
              </div>
              <button
                ref={mobileDrawerCloseButtonRef}
                type="button"
                onClick={closeMobileNavigation}
                className="feed-manager-icon-button feed-manager-icon-button--mobile"
                aria-hidden={mobileSidebarOpen ? undefined : true}
                aria-label="Fechar menu de navegação"
                tabIndex={mobileSidebarOpen ? 0 : -1}
                title="Fechar menu de navegação"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <nav
              className="flex flex-col gap-1"
              aria-label="Navegação do gerenciador de feeds"
            >
              {navigationGroups.map((group) => (
                <FeedManagerAreaButton
                  key={group.id}
                  onClick={() => selectAreaOverview(group)}
                  active={activeArea === group.id}
                  badge={group.badge}
                  collapsed={sidebarCollapsed}
                  description={group.description}
                  icon={group.icon}
                  label={group.label}
                />
              ))}
            </nav>
            {!sidebarCollapsed && (
              <div className="feed-manager-sidebar-footer mt-auto px-2 py-4">
                <p className="text-[11px] text-[rgb(var(--theme-text-secondary-readable))] opacity-76">
                  Coleção local
                </p>
                <p className="mt-0.5 text-[12px] font-semibold text-[rgb(var(--theme-text-readable))]">
                  {activeFeeds.length}/{currentFeeds.length} feeds ativos
                </p>
              </div>
            )}
          </div>
        </aside>

        <main
          ref={contentScrollRef}
          className="feed-manager-workspace custom-scrollbar"
        >
          <div
            className={`feed-manager-workspace-inner feed-manager-workspace-inner--${activeArea}`}
          >
            <div className="feed-manager-workspace-heading">
              <h2>{activeAreaContent.title}</h2>
              <p>{activeAreaContent.description}</p>
            </div>
            {activeArea === "overview" && (
              <FeedManagerOverviewPage
                categoryCount={categories.length}
                invalidCount={invalidCount}
                onNavigate={navigateToRoute}
                onRefreshFeeds={
                  onRefreshFeeds ? handleConfirmRefreshAll : undefined
                }
                quarantineCount={quarantineCount}
                totalFeedCount={currentFeeds.length}
                validCount={validCount}
              />
            )}

            {activeArea === "sources" && (
              <FeedManagerSourcesPage
                activeFeeds={currentFeeds}
                articles={articles}
                categories={categories}
                currentFeedCount={currentFeeds.length}
                feedValidations={feedValidations}
                newFeedCategory={newFeedCategory}
                newFeedTitle={newFeedTitle}
                newFeedUrl={newFeedUrl}
                onImportOPML={() => fileInputRef.current?.click()}
                onQuarantineFeed={(url) => void handleQuarantineFeed(url)}
                onRemoveFeed={handleRemoveFeed}
                onRetryFeed={validateSingleFeed}
                onShowCuratedLists={() => setShowImportModal(true)}
                onShowError={handleShowError}
                onSubmitFeed={handleAddFeed}
                onToggleHideFromAll={handleToggleHideFromAll}
                onEditFeed={handleEditFeed}
                onEditFeedTitle={handleEditFeedTitle}
                processingUrl={processingUrl}
                quarantineRecommendedUrls={quarantineRecommendedUrls}
                setNewFeedCategory={setNewFeedCategory}
                setNewFeedTitle={setNewFeedTitle}
                setNewFeedUrl={setNewFeedUrl}
              />
            )}

            {activeArea === "organization" && (
              <FeedManagerOrganizationPage
                categories={categories}
                confirmDanger={confirmDanger}
                alertSuccess={alertSuccess}
                createCategory={createCategory}
                currentFeeds={currentFeeds}
                deleteCategory={deleteCategory}
                onEditFeed={handleEditFeed}
                onEditFeedTitle={handleEditFeedTitle}
                onRemoveFeed={handleRemoveFeed}
                onToggleHideFromAll={handleToggleHideFromAll}
                reorderCategories={reorderCategories}
                setFeeds={setFeeds}
                updateCategory={updateCategory}
              />
            )}

            {activeArea === "maintenance" && (
              <FeedToolsTab
                embedded
                view="all"
                onExportOPML={handleExportOPML}
                onImportOPML={() => fileInputRef.current?.click()}
                onShowImportModal={() => setShowImportModal(true)}
                onResetDefaults={handleResetToDefaults}
                onResetCategories={handleResetCategoriesToDefaults}
                onCleanupErrors={() => setShowCleanupModal(true)}
                onDeleteAll={handleDeleteAll}
                onOpenIo={() => navigateToRoute("operations:io")}
                onOpenCurated={() => navigateToRoute("operations:curated")}
                onOpenMaintenance={() => navigateToRoute("operations:maintenance")}
                onOpenRisk={() => navigateToRoute("operations:risk")}
                expandedSections={{
                  io: expandedAccordionRoutes["operations:io"],
                  maintenance: expandedAccordionRoutes["operations:maintenance"],
                }}
                onToggleSection={(section) =>
                  toggleAccordionRoute(
                    section === "io" ? "operations:io" : "operations:maintenance",
                  )
                }
                feedCount={currentFeeds.length}
              />
            )}

            {activeArea === "diagnostics" && (
              <FeedManagerDiagnosticsPage
                activeFeeds={activeFeeds}
                articles={articles}
                categories={categories}
                feedValidations={feedValidations}
                focusSection={diagnosticsFocus || undefined}
                onFocusConsumed={() => setDiagnosticsFocus(null)}
                onRefreshFeeds={
                  onRefreshFeeds ? handleConfirmRefreshAll : undefined
                }
                onRetryFeeds={(urls) => void handleValidateSelectedFeeds(urls)}
                onShowError={handleShowError}
                onQuarantineFeed={(url) => void handleQuarantineFeed(url)}
                quarantineRecommendedUrls={quarantineRecommendedUrls}
              />
            )}

            <div className="sr-only">
              <FeedManagerWorkspaceFooter
                activeFeedCount={activeFeeds.length}
                environmentLabel={environmentLabel}
                invalidCount={invalidCount}
                quarantineCount={quarantineCount}
                totalFeedCount={currentFeeds.length}
              />
            </div>
          </div>
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

      <CuratedListsDialog
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        categories={categories}
        onImport={handleImportCurated}
      />

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
              className={managerPrimaryButtonClass}
            >
              Abrir diagnóstico completo
            </button>
          </div>
        }
      >
        {selectedErrorFeed && (
          <div className="space-y-4">
            <p className="font-mono text-sm text-[rgb(var(--color-error))]">
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
