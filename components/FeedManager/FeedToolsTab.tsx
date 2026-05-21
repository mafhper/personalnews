import React from "react";
import {
  AlertCircle,
  Download,
  FileUp,
  ListPlus,
  RefreshCcw,
  RotateCcw,
  Trash2,
} from "lucide-react";

interface FeedToolsTabProps {
  view?: "overview" | "io" | "curated" | "maintenance" | "risk";
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
}

const WORKBENCH_CLASS =
  "rounded-[26px] bg-[rgb(var(--theme-manager-surface,var(--color-surface)))] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-6";
const GROUP_CLASS =
  "rounded-[26px] bg-[rgb(var(--theme-manager-surface,var(--color-surface)))] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-6";

export const FeedToolsTab: React.FC<FeedToolsTabProps> = ({
  view = "overview",
  onExportOPML,
  onImportOPML,
  onShowImportModal,
  onResetDefaults,
  onCleanupErrors,
  onDeleteAll,
  onOpenIo,
  onOpenCurated,
  onOpenMaintenance,
  onOpenRisk,
  feedCount,
  validCount,
  invalidCount,
}) => {
  const showOverview = view === "overview";
  const showIo = view === "io";
  const showCurated = view === "curated";
  const showMaintenance = view === "maintenance";
  const showRisk = view === "risk";

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
      <div className="mx-auto w-full max-w-[1480px] space-y-5">
        {showOverview && (
          <section className={WORKBENCH_CLASS}>
            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.28fr)] xl:items-stretch">
              <div className="flex flex-col justify-between gap-5">
                <SectionHeader
                  eyebrow="Síntese operacional"
                  title="Escolha o tipo de intervenção"
                  description="Operações ficam separadas por intenção: trocar dados com arquivos, abrir coleções prontas, reparar a base ou executar ações destrutivas."
                />

                <div className="rounded-[22px] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] p-4 text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))]">
                  <strong className="text-[rgb(var(--theme-text-readable))]">
                    Estado atual:
                  </strong>{" "}
                  {invalidCount > 0
                    ? `${invalidCount} feed(s) pedem revisão antes de manutenção pesada.`
                    : `${validCount} feed(s) validados; backup e importação podem seguir sem alerta ativo.`}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                <OperationAction
                  title="Importar/Exportar"
                  description="Backup, migração e entrada de OPML ficam em uma página própria."
                  icon={<FileUp className="h-5 w-5" />}
                  onClick={onOpenIo || onImportOPML}
                />
                <OperationAction
                  title="Listas curadas"
                  description="Abra coleções prontas com confirmação antes de mesclar ou substituir."
                  icon={<ListPlus className="h-5 w-5" />}
                  onClick={onOpenCurated || onShowImportModal}
                />
                <OperationAction
                  title="Manutenção"
                  description="Reparos controlados sem misturar com zona de risco."
                  icon={<RefreshCcw className="h-5 w-5" />}
                  onClick={onOpenMaintenance || onCleanupErrors}
                />
                <OperationAction
                  title="Zona de risco"
                  description="Ações destrutivas ficam isoladas em uma página dedicada."
                  icon={<AlertCircle className="h-5 w-5" />}
                  onClick={onOpenRisk || onDeleteAll}
                  warning
                />
              </div>
            </div>
          </section>
        )}

        {showIo && (
          <section className={GROUP_CLASS}>
            <SectionHeader
              eyebrow="Importar/Exportar"
              title="Intercâmbio da coleção"
              description="Backup e entrada de arquivos OPML com ações diretas."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
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
            </div>
          </section>
        )}

        {showCurated && (
          <section className={GROUP_CLASS}>
            <SectionHeader
              eyebrow="Listas curadas"
              title="Coleções prontas"
              description="Use listas selecionadas para acelerar a montagem da coleção."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <OperationAction
                title="Listas curadas"
                description="Mescle coleções prontas ou substitua tudo com confirmação."
                icon={<ListPlus className="h-5 w-5" />}
                onClick={onShowImportModal}
              />
            </div>
          </section>
        )}

        {(showMaintenance || showRisk) && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.46fr)]">
          {showMaintenance && (
          <section className={GROUP_CLASS}>
            <SectionHeader
              eyebrow="Manutenção"
              title="Reparos controlados"
              description="Use esta área para recuperar a coleção. Investigação detalhada de causa fica em Diagnóstico."
            />

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
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
          </section>
          )}

          {showRisk && (
          <section className="rounded-[26px] bg-[rgba(var(--color-error),0.08)] p-5 shadow-[0_18px_42px_rgba(127,29,29,0.12),inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-6">
            <div className="flex h-full flex-col justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(var(--color-error),0.12)] text-[rgb(var(--color-error))]">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--color-error))]">
                    Zona de risco
                  </p>
                  <h3 className="mt-1 text-lg font-black text-[rgb(var(--theme-text-readable))]">
                    Ações destrutivas
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))]">
                    Concentrada aqui para não disputar atenção com importação,
                    backup e reparos comuns.
                  </p>
                </div>
              </div>

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
          </section>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{
  eyebrow: string;
  title: string;
  description: string;
}> = ({ eyebrow, title, description }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable))] opacity-55">
      {eyebrow}
    </p>
    <h2 className="mt-1 text-xl font-black text-[rgb(var(--theme-text-readable))]">
      {title}
    </h2>
    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))] opacity-70">
      {description}
    </p>
  </div>
);

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
    className={`group flex min-h-[132px] flex-col items-start justify-between rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 sm:p-5 ${
      warning
        ? "border-transparent bg-[rgba(var(--color-warning),0.1)] text-[rgb(var(--theme-text-readable))] hover:bg-[rgba(var(--color-warning),0.14)]"
        : "border-transparent bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] text-[rgb(var(--theme-text-readable))] hover:bg-[rgb(var(--theme-manager-soft,var(--color-surfaceElevated)))]"
    }`}
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
      <span className="mt-1 block text-sm leading-relaxed opacity-70">
        {description}
      </span>
    </span>
  </button>
);
