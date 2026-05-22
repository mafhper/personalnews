import React, { useEffect, useRef, useState } from "react";
import pkg from "../package.json";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronRight,
  CircleCheck,
  Database,
  Download,
  Eye,
  EyeOff,
  FileUp,
  FolderTree,
  GripVertical,
  Inbox,
  LayoutGrid,
  Library,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Rss,
  Search,
  ShieldAlert,
  Tags,
  Trash2,
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
import { FeedListTab } from "./FeedManager/FeedListTab";
import { OpmlImportPreviewModal } from "./FeedManager/OpmlImportPreviewModal";
import { FeedToolsTab } from "./FeedManager/FeedToolsTab";
import {
  managerControlSurfaceClass,
  managerFieldClass,
  managerPrimaryButtonClass,
  managerSecondaryButtonClass,
  managerDangerButtonClass,
} from "./FeedManager/feedManagerStyles";
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

const routeContentMap: Record<
  FeedManagerRoute,
  { area: string; title: string; description: string }
> = {
  "feeds:overview": {
    area: "Visão geral",
    title: "Resumo da coleção",
    description: "Estado, ações recomendadas e atalhos da coleção.",
  },
  "feeds:list": {
    area: "Fontes",
    title: "Feeds cadastrados",
    description: "Busca, status, inclusão e quarentena das fontes.",
  },
  "feeds:add": {
    area: "Fontes",
    title: "Adicionar feed",
    description: "Inclua uma fonte, importe OPML ou abra listas prontas.",
  },
  "feeds:categories": {
    area: "Organização",
    title: "Categorias",
    description: "Categorias, propriedades e roteamento visual da coleção.",
  },
  "feeds:quarantine": {
    area: "Fontes",
    title: "Quarentena",
    description: "Feeds preservados fora da carga principal.",
  },
  "operations:overview": {
    area: "Manutenção",
    title: "Backup e manutenção",
    description: "Arquivos, listas, reparos e ações críticas.",
  },
  "operations:io": {
    area: "Manutenção",
    title: "Arquivos e listas",
    description: "OPML, backups e coleções prontas.",
  },
  "operations:curated": {
    area: "Manutenção",
    title: "Arquivos e listas",
    description: "OPML, backups e coleções prontas.",
  },
  "operations:maintenance": {
    area: "Manutenção",
    title: "Manutenção e risco",
    description: "Reparos, restauração e ações destrutivas.",
  },
  "operations:risk": {
    area: "Manutenção",
    title: "Manutenção e risco",
    description: "Reparos, restauração e ações destrutivas.",
  },
  "diagnostics:overview": {
    area: "Diagnóstico",
    title: "Diagnóstico em camadas",
    description: "Saúde, infraestrutura e relatórios da coleção.",
  },
  "diagnostics:health": {
    area: "Diagnóstico",
    title: "Saúde dos feeds",
    description: "Erros, impacto e status das fontes.",
  },
  "diagnostics:infra": {
    area: "Diagnóstico",
    title: "Backend, proxies e rotas",
    description: "Estado operacional das rotas de carregamento.",
  },
  "diagnostics:reports": {
    area: "Diagnóstico",
    title: "Relatórios",
    description: "Exportação de diagnóstico para suporte e auditoria.",
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
  routeContent: { area: string; title: string; description: string };
}> = ({
  closeModal,
  mobileMenuButtonRef,
  mobileSidebarOpen,
  onAddSource,
  onOpenMobileNavigation,
  onRefreshFeeds,
  routeContent,
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

    <div className="feed-manager-header-context order-3 col-span-2 lg:order-none lg:col-span-1">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] opacity-68">
        {routeContent.area}
      </p>
      <p className="truncate text-[13px] font-semibold text-[rgb(var(--theme-text-readable))]">
        {routeContent.title}
      </p>
      <p className="hidden truncate text-xs opacity-78 sm:block">
        {routeContent.description}
      </p>
    </div>

    <div className="feed-manager-header-actions">
      <button
        type="button"
        onClick={onAddSource}
        className={`${managerPrimaryButtonClass} h-9 px-3 text-[12.5px]`}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Adicionar fonte</span>
      </button>
      {onRefreshFeeds && (
        <button
          type="button"
          onClick={onRefreshFeeds}
          className={`${managerSecondaryButtonClass} hidden h-9 px-3 text-[12.5px] sm:inline-flex`}
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
    <div className={`${managerControlSurfaceClass} p-4`}>
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[rgb(var(--theme-text-secondary-readable))] opacity-65">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black leading-none ${toneClass}`}>
        {value}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))] opacity-78">
        {description}
      </p>
    </div>
  );
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
    </Component>
  );
};

const FeedManagerCompactMetric: React.FC<{
  icon: React.ReactNode;
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  value: React.ReactNode;
}> = ({ icon, label, tone = "neutral", value }) => (
  <div className={`feed-manager-compact-metric feed-manager-compact-metric--${tone}`}>
    <span>{icon}</span>
    <span className="min-w-0">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] opacity-68">
        {label}
      </span>
      <strong>{value}</strong>
    </span>
  </div>
);

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
  <div className="feed-manager-page feed-manager-page--narrow">
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
      <FeedManagerLightCard className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeedManagerInsight
            label="Cobertura"
            value={totalFeedCount > 0 ? `${Math.round((validCount / totalFeedCount) * 100)}%` : "0%"}
            description="fontes validadas na última leitura."
            tone={invalidCount > 0 ? "warning" : "success"}
          />
          <FeedManagerInsight
            label="Fontes ativas"
            value={validCount}
            description={`de ${totalFeedCount} cadastradas.`}
          />
          <FeedManagerInsight
            label="Fora da carga"
            value={quarantineCount}
            description="fontes em quarentena."
            tone={quarantineCount > 0 ? "warning" : "neutral"}
          />
          <FeedManagerInsight
            label="Categorias"
            value={categoryCount}
            description="rotas visuais disponíveis."
          />
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
  onConfirmRefreshAll: () => void | Promise<void>;
  onImportOPML: () => void;
  onMoveCategory: (feedUrl: string, categoryId: string) => void;
  onQuarantineFeed: (url: string) => void;
  onRefreshFeeds?: () => void;
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
  onConfirmRefreshAll,
  onImportOPML,
  onMoveCategory,
  onQuarantineFeed,
  onRefreshFeeds,
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

  return (
    <div className="feed-manager-page">
      <section>
        <FeedManagerPageTitle
          title="Adicionar uma fonte"
          description="Três caminhos para crescer a coleção sem interromper a revisão."
        />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(220px,0.75fr)_minmax(220px,0.75fr)]">
          <FeedManagerLightCard className="p-4">
            <form
              onSubmit={(event) => {
                void onSubmitFeed(event);
              }}
              className="grid gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="feed-manager-light-row__icon">
                  <Plus className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-[13.5px] font-semibold">Por URL</h4>
                  <p className="text-xs opacity-72">Cole RSS, Atom ou a página do site.</p>
                </div>
              </div>
              <input
                type="url"
                required
                placeholder="https://exemplo.com/feed"
                value={newFeedUrl}
                onChange={(event) => setNewFeedUrl(event.target.value)}
                disabled={isProcessing}
                className={managerFieldClass}
              />
              <div className="grid gap-2 sm:grid-cols-2">
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
              </div>
              <button
                type="submit"
                disabled={isProcessing}
                className={`${managerPrimaryButtonClass} w-full`}
              >
                {isProcessing ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isProcessing ? "Validando..." : "Adicionar"}
              </button>
            </form>
          </FeedManagerLightCard>

          <FeedManagerLightCard className="p-4">
            <FeedManagerLightRow
              icon={<FileUp className="h-[18px] w-[18px]" />}
              title="Importar OPML"
              description="Você revisa antes de confirmar."
            />
            <button
              type="button"
              onClick={onImportOPML}
              className={`${managerSecondaryButtonClass} mt-3 w-full`}
            >
              Escolher arquivo
            </button>
            <p className="mt-2 text-[11.5px] opacity-64">
              Coleção atual: {currentFeedCount} feeds.
            </p>
          </FeedManagerLightCard>

          <FeedManagerLightCard className="p-4">
            <FeedManagerLightRow
              icon={<Library className="h-[18px] w-[18px]" />}
              title="Listas curadas"
              description="Mescle coleções prontas ao acervo."
            />
            <button
              type="button"
              onClick={onShowCuratedLists}
              className={`${managerSecondaryButtonClass} mt-3 w-full`}
            >
              Abrir listas
            </button>
            <p className="mt-2 text-[11.5px] opacity-64">
              Nada é aplicado sem confirmação.
            </p>
          </FeedManagerLightCard>
        </div>
      </section>

      <section>
        <FeedManagerPageTitle title="Fontes da coleção" />
        <FeedListTab
          embedded
          feeds={activeFeeds}
          validations={feedValidations}
          categories={categories}
          onRemove={onRemoveFeed}
          onRetry={onRetryFeed}
          onEdit={onEditFeed}
          onEditTitle={onEditFeedTitle}
          onShowError={onShowError}
          onMoveCategory={onMoveCategory}
          onToggleHideFromAll={onToggleHideFromAll}
          onQuarantineFeed={onQuarantineFeed}
          quarantineRecommendedUrls={quarantineRecommendedUrls}
          onRefreshAll={onRefreshFeeds}
          onConfirmRefreshAll={onConfirmRefreshAll}
          articles={articles}
        />
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
  resetCategoriesToDefaults: () => void;
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
  resetCategoriesToDefaults,
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
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategoryColor, setNewCategoryColor] = React.useState(
    categories.find((category) => !category.isDefault)?.color || "#3B82F6",
  );

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

  const moveCategory = React.useCallback(
    (categoryId: string, direction: -1 | 1) => {
      const ids = visibleCategories.map((category) => category.id);
      const currentIndex = ids.indexOf(categoryId);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= ids.length) return;
      const nextIds = [...ids];
      [nextIds[currentIndex], nextIds[nextIndex]] = [
        nextIds[nextIndex],
        nextIds[currentIndex],
      ];
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
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/feed-url", feed.url);
        event.dataTransfer.effectAllowed = "move";
      }}
    >
      <GripVertical className="h-4 w-4 text-[rgb(var(--theme-text-secondary-readable))] opacity-45" />
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
      <select
        value={feed.categoryId || "uncategorized"}
        onChange={(event) => moveFeedToCategoryId(feed.url, event.target.value)}
        className="collection-central-feed-row__select"
        aria-label={`Categoria de ${getFeedManagerFeedTitle(feed)}`}
      >
        <option value="uncategorized">Sem categoria</option>
        {visibleCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <div className="collection-central-feed-row__actions">
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
              Nova categoria
            </button>
          </form>
        </div>

        <FeedManagerLightCard className="overflow-hidden">
          {visibleCategories.map((category, index) => {
            const feedsInCategory = feedsByCategory[category.id] || [];
            const expanded = expandedCategoryId === category.id;
            return (
              <div key={category.id}>
                {index > 0 && <div className="feed-manager-divider" />}
                {renderDropZone(
                  category.id,
                  <>
                    <div className="collection-central-category-row">
                      <div className="collection-central-category-row__order">
                        <button
                          type="button"
                          onClick={() => moveCategory(category.id, -1)}
                          disabled={index === 0}
                          aria-label={`Subir ${category.name}`}
                          title="Subir categoria"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCategory(category.id, 1)}
                          disabled={index === visibleCategories.length - 1}
                          aria-label={`Descer ${category.name}`}
                          title="Descer categoria"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
                        {!category.isDefault && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteCategory(category)}
                            aria-label={`Excluir ${category.name}`}
                            title="Excluir categoria"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {expanded && (
                      <div className="collection-central-category-body">
                        {(editingCategoryId === category.id || !category.isDefault) && (
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

      <section>
        <FeedManagerPageTitle
          title="Restaurar organização"
          description="Retorne às categorias padrão quando a estrutura atual deixar de representar a coleção."
        />
        <FeedManagerLightCard className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="feed-manager-light-row__icon">
                <LayoutGrid className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold">Categorias padrão</p>
                <p className="text-xs opacity-72">
                  A restauração remove categorias personalizadas e devolve os feeds para
                  a fila sem categoria.
                </p>
              </div>
            </div>
            <button
              type="button"
              className={`${managerSecondaryButtonClass} h-9 px-3`}
              onClick={async () => {
                if (
                  await confirmDanger(
                    buildResetCategoriesConfirmation({
                      categories: visibleCategories,
                      feedCount: currentFeeds.length,
                    }),
                  )
                ) {
                  resetCategoriesToDefaults();
                  setFeeds((feeds) =>
                    feeds.map((feed) => ({ ...feed, categoryId: undefined })),
                  );
                  setExpandedCategoryId(null);
                  setEditingCategoryId(null);
                  await alertSuccess("Categorias padrão restauradas.");
                }
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar padrão
            </button>
          </div>
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
  const environmentLabel = React.useMemo(
    () => formatFeedManagerEnvironment(detectEnvironment()),
    [],
  );
  const activeArea = routeAreaMap[activeRoute];
  const activeRouteContent = routeContentMap[activeRoute];

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
      icon: <Library className="h-4 w-4" />,
    },
    {
      id: "sources",
      label: "Fontes",
      description: "Feeds, entrada e quarentena",
      overviewRoute: "feeds:list",
      icon: <FileUp className="h-4 w-4" />,
      badge: quarantineCount > 0 ? quarantineCount : undefined,
    },
    {
      id: "organization",
      label: "Organização",
      description: "Categorias e roteamento visual",
      overviewRoute: "feeds:categories",
      icon: <Tags className="h-4 w-4" />,
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
      description: "Saúde, infraestrutura e relatórios",
      overviewRoute: "diagnostics:overview",
      icon: <BarChart3 className="h-4 w-4" />,
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
        routeContent={activeRouteContent}
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
              className={`feed-manager-sidebar-header flex items-center gap-2 p-2 ${
                sidebarCollapsed ? "justify-center" : "justify-between"
              }`}
            >
              <div className={sidebarCollapsed ? "sr-only" : "min-w-0"}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable))] opacity-65">
                  Navegação
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
              className="flex flex-col gap-2"
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
          </div>
        </aside>

        <main
          ref={contentScrollRef}
          className="feed-manager-workspace custom-scrollbar"
        >
          <div className="mx-auto w-full max-w-[1400px] space-y-5">
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
                activeFeeds={activeFeeds}
                articles={articles}
                categories={categories}
                currentFeedCount={currentFeeds.length}
                feedValidations={feedValidations}
                newFeedCategory={newFeedCategory}
                newFeedTitle={newFeedTitle}
                newFeedUrl={newFeedUrl}
                onConfirmRefreshAll={handleConfirmRefreshAll}
                onImportOPML={() => fileInputRef.current?.click()}
                onMoveCategory={moveFeedToCategory}
                onQuarantineFeed={(url) => void handleQuarantineFeed(url)}
                onRefreshFeeds={onRefreshFeeds}
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
                resetCategoriesToDefaults={resetToDefaults}
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
              <FeedAnalytics
                embedded
                feeds={activeFeeds}
                articles={articles}
                feedValidations={feedValidations}
                view="all"
                focusSection={diagnosticsFocus || undefined}
                onFocusConsumed={() => setDiagnosticsFocus(null)}
                quarantineRecommendedUrls={quarantineRecommendedUrls}
                onQuarantineFeed={(url) => void handleQuarantineFeed(url)}
                categories={categories}
                onRetryFeeds={(urls) => void handleValidateSelectedFeeds(urls)}
                onQuarantineFeeds={(urls) => void handleQuarantineFeeds(urls)}
                onMoveFeedsCategory={(urls, categoryId) =>
                  void moveFeedsToCategory(urls, categoryId)
                }
                expandedSections={{
                  health: expandedAccordionRoutes["diagnostics:health"],
                  infra: expandedAccordionRoutes["diagnostics:infra"],
                  reports: expandedAccordionRoutes["diagnostics:reports"],
                }}
                onToggleSection={(section) =>
                  toggleAccordionRoute(`diagnostics:${section}`)
                }
              />
            )}

            <FeedManagerWorkspaceFooter
              activeFeedCount={activeFeeds.length}
              environmentLabel={environmentLabel}
              invalidCount={invalidCount}
              quarantineCount={quarantineCount}
              totalFeedCount={currentFeeds.length}
            />
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
              className={managerSecondaryButtonClass}
              type="button"
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleImportCurated("merge")}
              className={managerPrimaryButtonClass}
              type="button"
            >
              Mesclar
            </button>
            <button
              onClick={() => void handleImportCurated("replace")}
              className={managerDangerButtonClass}
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
            className={`${managerFieldClass} p-3`}
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
