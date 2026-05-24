import React from "react";
import {
  AlertCircle,
  ChevronRight,
  Download,
  FileUp,
  ListPlus,
  RefreshCcw,
  RotateCcw,
  Trash2,
  Wrench,
} from "lucide-react";
import { FeedManagerAccordionSection } from "./FeedManagerAccordionSection";
import { FeedManagerSectionHeader } from "./FeedManagerSectionHeader";
import {
  managerActionCardClass,
  managerControlSurfaceClass,
  managerDangerButtonClass,
  managerDangerSurfaceClass,
  managerSurfaceClass,
  managerWarningActionCardClass,
} from "./feedManagerStyles";

type FeedToolsAccordionSection = "io" | "maintenance";

interface FeedToolsTabProps {
  view?: "overview" | "io" | "curated" | "maintenance" | "risk" | "all";
  expandedSections?: Partial<Record<FeedToolsAccordionSection, boolean>>;
  onExportOPML: () => void;
  onImportOPML: () => void;
  onShowImportModal: () => void;
  onResetDefaults: () => void;
  onResetCategories?: () => void;
  onCleanupErrors: () => void;
  onDeleteAll: () => void;
  onOpenIo?: () => void;
  onOpenCurated?: () => void;
  onOpenMaintenance?: () => void;
  onOpenRisk?: () => void;
  onToggleSection?: (section: FeedToolsAccordionSection) => void;
  feedCount: number;
  embedded?: boolean;
}

const WORKBENCH_CLASS = `${managerSurfaceClass} p-5 sm:p-6`;
const GROUP_CLASS = `${managerSurfaceClass} p-5 sm:p-6`;

const MaintenanceRow: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}> = ({ title, description, icon, onClick, danger = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`feed-manager-light-row feed-manager-light-row--interactive ${
      danger ? "feed-manager-light-row--danger" : ""
    }`}
  >
    <span className="feed-manager-light-row__icon">{icon}</span>
    <span className="min-w-0 flex-1">
      <span className="block text-[13.5px] font-semibold">{title}</span>
      <span className="mt-0.5 block truncate text-xs opacity-72">
        {description}
      </span>
    </span>
    <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
  </button>
);

export const FeedToolsTab: React.FC<FeedToolsTabProps> = ({
  view = "overview",
  expandedSections,
  onExportOPML,
  onImportOPML,
  onShowImportModal,
  onResetDefaults,
  onResetCategories,
  onCleanupErrors,
  onDeleteAll,
  onOpenIo,
  onOpenMaintenance,
  onToggleSection,
  feedCount,
  embedded = false,
}) => {
  const [localExpandedSections, setLocalExpandedSections] = React.useState<
    Record<FeedToolsAccordionSection, boolean>
  >({
    io: true,
    maintenance: true,
  });
  const normalizedView =
    view === "curated" ? "io" : view === "risk" ? "maintenance" : view;
  const showAll = view === "all";
  const showOverview = showAll || normalizedView === "overview";
  const showIo = showAll || normalizedView === "io";
  const showMaintenance = showAll || normalizedView === "maintenance";
  const isSectionOpen = (section: FeedToolsAccordionSection) =>
    expandedSections?.[section] ?? localExpandedSections[section];
  const toggleSection = (section: FeedToolsAccordionSection) => {
    if (onToggleSection) {
      onToggleSection(section);
      return;
    }

    setLocalExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  if (embedded && view === "all") {
    return (
      <div className="feed-manager-page collection-central-page collection-central-page--maintenance">
        <section>
          <div className="feed-manager-page-title">
            <h3>Backup e transporte</h3>
            <p>Mova e preserve sua coleção.</p>
          </div>
          <div className="feed-manager-light-card">
            <MaintenanceRow
              icon={<Download className="h-[18px] w-[18px]" />}
              title="Exportar OPML"
              description="Baixar um snapshot atual da coleção."
              onClick={onExportOPML}
            />
            <MaintenanceRow
              icon={<FileUp className="h-[18px] w-[18px]" />}
              title="Importar OPML"
              description="Você revisa antes de aplicar."
              onClick={onImportOPML}
            />
            <MaintenanceRow
              icon={<ListPlus className="h-[18px] w-[18px]" />}
              title="Listas curadas"
              description="Mescle coleções prontas ou substitua com confirmação."
              onClick={onShowImportModal}
            />
          </div>
        </section>

        <section>
          <div className="feed-manager-page-title">
            <h3>Reparos</h3>
            <p>Manutenções rotineiras da coleção.</p>
          </div>
          <div className="feed-manager-light-card">
            <MaintenanceRow
              icon={<RefreshCcw className="h-[18px] w-[18px]" />}
              title="Revalidar todos"
              description="Rechecar disponibilidade de cada feed."
              onClick={onOpenMaintenance || onCleanupErrors}
            />
            <MaintenanceRow
              icon={<Wrench className="h-[18px] w-[18px]" />}
              title="Limpar feeds com erro"
              description="Abra uma revisão segura antes de remover."
              onClick={onCleanupErrors}
            />
            <MaintenanceRow
              icon={<RotateCcw className="h-[18px] w-[18px]" />}
              title="Restaurar padrões"
              description="Voltar ao conjunto inicial sugerido."
              onClick={onResetDefaults}
            />
            {onResetCategories && (
              <MaintenanceRow
                icon={<ListPlus className="h-[18px] w-[18px]" />}
                title="Restaurar categorias"
                description="Retorna às categorias padrão e envia feeds para sem categoria."
                onClick={onResetCategories}
              />
            )}
          </div>
        </section>

        <section>
          <div className="feed-manager-page-title feed-manager-page-title--danger">
            <h3>Zona de risco</h3>
            <p>{feedCount} feeds cadastrados. Faça backup antes de ações destrutivas.</p>
          </div>
          <div className="feed-manager-light-card feed-manager-light-card--danger collection-central-risk-panel">
            <div className="collection-central-risk-panel__header">
              <span className="feed-manager-light-row__icon text-[rgb(var(--color-error))]">
                <AlertCircle className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p>Confirmação obrigatória</p>
                <span>Ações críticas continuam protegidas pelos diálogos destrutivos existentes.</span>
              </div>
            </div>
            <div className="collection-central-risk-panel__row">
              <span className="feed-manager-light-row__icon">
                <Download className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p>Backup recomendado</p>
                <span>Exporte um OPML antes de alterar a coleção em massa.</span>
              </div>
              <button
                type="button"
                onClick={onExportOPML}
                className="feed-manager-secondary-button inline-flex items-center justify-center gap-2 px-3 py-2 text-[12.5px] font-semibold"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>
            <div className="collection-central-risk-panel__row collection-central-risk-panel__row--danger">
              <span className="feed-manager-light-row__icon text-[rgb(var(--color-error))]">
                <Trash2 className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p>Excluir todos os feeds</p>
                <span>Remove todas as fontes. Categorias e configurações pessoais permanecem.</span>
              </div>
              <button
                type="button"
                onClick={onDeleteAll}
                disabled={feedCount === 0}
                aria-label="Excluir todos os feeds"
                className={`${managerDangerButtonClass} px-3 py-2 text-[12.5px] disabled:cursor-not-allowed disabled:opacity-45`}
              >
                <Trash2 className="h-4 w-4" />
                Excluir feeds
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "h-full overflow-y-auto custom-scrollbar p-4 sm:p-6"}>
      <div className="mx-auto w-full max-w-[1480px] space-y-5">
        {showOverview && (
          <section
            id="feed-manager-section-operations-overview"
            className={`${WORKBENCH_CLASS} feed-manager-anchor-section`}
          >
            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.28fr)] xl:items-stretch">
              <div className="flex flex-col justify-between gap-5">
                <FeedManagerSectionHeader
                  eyebrow="Síntese operacional"
                  title="Escolha o tipo de intervenção"
                  description="Operações ficam agrupadas em fluxos fortes: transporte e listas, ou reparos com ações críticas."
                  icon={<Wrench className="h-5 w-5" />}
                />

                <div className={`${managerControlSurfaceClass} p-4 text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))] opacity-86`}>
                  <strong className="text-[rgb(var(--theme-text-readable))]">
                    Como escolher:
                  </strong>{" "}
                  use Arquivos e listas para transportar, ampliar ou recuperar
                  coleções; use Manutenção e risco para reparar, restaurar ou
                  executar ações críticas com confirmação.
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <OperationAction
                  title="Arquivos e listas"
                  description="Exportação, importação OPML e listas curadas ficam juntas para transporte da coleção."
                  icon={<FileUp className="h-5 w-5" />}
                  onClick={onOpenIo || onImportOPML}
                />
                <OperationAction
                  title="Manutenção e risco"
                  description="Limpeza, restauração e exclusão ficam próximas, mas com perigo isolado visualmente."
                  icon={<RefreshCcw className="h-5 w-5" />}
                  onClick={onOpenMaintenance || onCleanupErrors}
                />
              </div>
            </div>
          </section>
        )}

        {showIo && (
          <FeedManagerAccordionSection
            id="feed-manager-section-operations-io"
            className={GROUP_CLASS}
            eyebrow="Arquivos e listas"
            title="Transporte da coleção"
            description="Backup, entrada de OPML e coleções prontas ficam em um fluxo único de arquivos e listas."
            icon={<FileUp className="h-5 w-5" />}
            isOpen={isSectionOpen("io")}
            onToggle={() => toggleSection("io")}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <OperationAction
                title="Exportar OPML"
                description="Baixe a coleção atual para backup ou migração."
                icon={<Download className="h-5 w-5" />}
                onClick={onExportOPML}
              />
              <OperationAction
                title="Importar OPML"
                description="Carregue um arquivo externo e preserve categorias quando existirem."
                icon={<FileUp className="h-5 w-5" />}
                onClick={onImportOPML}
              />
              <OperationAction
                title="Listas curadas"
                description="Mescle coleções prontas ou substitua tudo com confirmação."
                icon={<ListPlus className="h-5 w-5" />}
                onClick={onShowImportModal}
              />
            </div>
          </FeedManagerAccordionSection>
        )}

        {showMaintenance && (
          <FeedManagerAccordionSection
            id="feed-manager-section-operations-maintenance"
            className={GROUP_CLASS}
            eyebrow="Manutenção e risco"
            title="Reparos e ações críticas"
            description="Use esta área para recuperar a coleção, restaurar a base ou executar ações destrutivas com confirmação explícita."
            icon={<RefreshCcw className="h-5 w-5" />}
            isOpen={isSectionOpen("maintenance")}
            onToggle={() => toggleSection("maintenance")}
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.46fr)]">
              <div className="grid gap-4 lg:grid-cols-2">
                <OperationAction
                  title="Limpar feeds com erro"
                  description="Abra uma revisão segura dos feeds problemáticos antes de remover."
                  icon={<RefreshCcw className="h-5 w-5" />}
                  onClick={onCleanupErrors}
                />
                <OperationAction
                  title="Restaurar padrões"
                  description="Recria a base inicial do projeto depois de confirmação."
                  icon={<RotateCcw className="h-5 w-5" />}
                  onClick={onResetDefaults}
                  warning
                />
              </div>

              <div className={`${managerDangerSurfaceClass} p-5`}>
                <div className="flex h-full flex-col justify-between gap-5">
                  <FeedManagerSectionHeader
                    eyebrow="Zona de risco"
                    title="Ações destrutivas"
                    description="Fica dentro de manutenção, mas isolada por tom de perigo e confirmação forte."
                    icon={<AlertCircle className="h-5 w-5" />}
                    tone="danger"
                  />

                  <button
                    type="button"
                    onClick={onDeleteAll}
                    disabled={feedCount === 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--color-error))] px-4 py-3 text-sm font-black text-[rgb(var(--color-onAccent))] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir todos os feeds
                  </button>
                </div>
              </div>
            </div>
          </FeedManagerAccordionSection>
        )}
      </div>
    </div>
  );
};

const OperationAction: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  warning?: boolean;
}> = ({ title, description, icon, onClick, warning }) => (
  <button
    type="button"
    onClick={onClick}
    className={warning ? managerWarningActionCardClass : managerActionCardClass}
  >
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
        warning
          ? "bg-[rgba(var(--color-warning),0.14)] text-[rgb(var(--color-warning))]"
          : "bg-[rgb(var(--theme-manager-bg,var(--color-background)))] text-[rgb(var(--theme-text-readable))]"
      }`}
    >
      {icon}
    </span>
    <span>
      <span className="block text-base font-black">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed opacity-78">
        {description}
      </span>
    </span>
  </button>
);
