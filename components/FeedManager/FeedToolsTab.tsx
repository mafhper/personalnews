import React from "react";
import {
  AlertCircle,
  Download,
  FileUp,
  ListPlus,
  RefreshCcw,
  RotateCcw,
  Trash2,
  Wrench,
} from "lucide-react";
import { FeedManagerSectionHeader } from "./FeedManagerSectionHeader";
import {
  managerActionCardClass,
  managerControlSurfaceClass,
  managerDangerSurfaceClass,
  managerSurfaceClass,
  managerWarningActionCardClass,
} from "./feedManagerStyles";

interface FeedToolsTabProps {
  view?: "overview" | "io" | "curated" | "maintenance" | "risk" | "all";
  onExportOPML: () => void;
  onImportOPML: () => void;
  onShowImportModal: () => void;
  onResetDefaults: () => void;
  onCleanupErrors: () => void;
  onDeleteAll: () => void;
  onOpenIo?: () => void;
  onOpenCurated?: () => void;
  onOpenMaintenance?: () => void;
  onOpenRisk?: () => void;
  feedCount: number;
  validCount: number;
  invalidCount: number;
  embedded?: boolean;
}

const WORKBENCH_CLASS = `${managerSurfaceClass} p-5 sm:p-6`;
const GROUP_CLASS = `${managerSurfaceClass} p-5 sm:p-6`;

export const FeedToolsTab: React.FC<FeedToolsTabProps> = ({
  view = "overview",
  onExportOPML,
  onImportOPML,
  onShowImportModal,
  onResetDefaults,
  onCleanupErrors,
  onDeleteAll,
  onOpenIo,
  onOpenMaintenance,
  feedCount,
  validCount,
  invalidCount,
  embedded = false,
}) => {
  const normalizedView =
    view === "curated" ? "io" : view === "risk" ? "maintenance" : view;
  const showAll = view === "all";
  const showOverview = showAll || normalizedView === "overview";
  const showIo = showAll || normalizedView === "io";
  const showMaintenance = showAll || normalizedView === "maintenance";

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
                    Próximo passo:
                  </strong>{" "}
                  {invalidCount > 0
                    ? "revise a saúde dos feeds antes de manutenção pesada."
                    : feedCount === 0
                      ? "adicione ou importe fontes antes de configurar reparos."
                      : validCount > 0
                        ? "faça backup antes de alterações em lote."
                        : "revalide as fontes antes de ações em lote."}
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
          <section
            id="feed-manager-section-operations-io"
            className={`${GROUP_CLASS} feed-manager-anchor-section`}
          >
            <FeedManagerSectionHeader
              eyebrow="Arquivos e listas"
              title="Transporte da coleção"
              description="Backup, entrada de OPML e coleções prontas ficam em um fluxo único de arquivos e listas."
              icon={<FileUp className="h-5 w-5" />}
            />
            <div className="mt-5 grid gap-4 md:grid-cols-3">
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
          </section>
        )}

        {showMaintenance && (
          <section
            id="feed-manager-section-operations-maintenance"
            className={`${GROUP_CLASS} feed-manager-anchor-section`}
          >
            <FeedManagerSectionHeader
              eyebrow="Manutenção e risco"
              title="Reparos e ações críticas"
              description="Use esta área para recuperar a coleção, restaurar a base ou executar ações destrutivas com confirmação explícita."
              icon={<RefreshCcw className="h-5 w-5" />}
            />

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.46fr)]">
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
          </section>
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
