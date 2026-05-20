import React from "react";
import { CheckCircle2, RefreshCw, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import type { FeedSource } from "../../types";
import { isFeedInactive, isFeedQuarantined, isQuarantineRecovered } from "../../utils/feedQuarantine";

interface FeedQuarantineTabProps {
  feeds: FeedSource[];
  onValidate: (url: string) => void | Promise<void>;
  onRestore: (url: string) => void | Promise<void>;
  onMarkInactive: (url: string) => void | Promise<void>;
  onRemove: (url: string) => void | Promise<void>;
}

const SURFACE_CLASS =
  "rounded-[26px] bg-[rgb(var(--theme-manager-surface,var(--color-surface)))] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.025)]";

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export const FeedQuarantineTab: React.FC<FeedQuarantineTabProps> = ({
  feeds,
  onValidate,
  onRestore,
  onMarkInactive,
  onRemove,
}) => {
  const trackedFeeds = feeds.filter(
    (feed) => isFeedQuarantined(feed) || isFeedInactive(feed),
  );
  const quarantinedCount = feeds.filter(isFeedQuarantined).length;
  const inactiveCount = feeds.filter(isFeedInactive).length;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
        <section className={SURFACE_CLASS}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable))] opacity-55">
                Observação
              </p>
              <h2 className="mt-1 text-xl font-black text-[rgb(var(--theme-text-readable))]">
                Quarentena
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))] opacity-72">
                Feeds em quarentena ficam fora das categorias e do carregamento,
                mas continuam preservados para teste, restauração ou remoção.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[18rem]">
              <Metric label="Quarentena" value={quarantinedCount} />
              <Metric label="Inativos" value={inactiveCount} />
            </div>
          </div>
        </section>

        {trackedFeeds.length === 0 ? (
          <section className={SURFACE_CLASS}>
            <div className="flex min-h-[18rem] flex-col items-center justify-center text-center">
              <ShieldAlert className="h-12 w-12 text-[rgb(var(--theme-text-secondary-readable))] opacity-35" />
              <h3 className="mt-4 text-lg font-black text-[rgb(var(--theme-text-readable))]">
                Nenhum feed em quarentena
              </h3>
              <p className="mt-2 max-w-md text-sm text-[rgb(var(--theme-text-secondary-readable))] opacity-72">
                Quando um feed acumular falhas, use a ação de quarentena para
                tirá-lo da circulação sem apagar a configuração.
              </p>
            </div>
          </section>
        ) : (
          <section className="space-y-3">
            {trackedFeeds.map((feed) => {
              const recovered = isQuarantineRecovered(feed);
              const inactive = isFeedInactive(feed);

              return (
                <article
                  key={feed.url}
                  className="rounded-[24px] bg-[rgb(var(--theme-manager-surface,var(--color-surface)))] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.025)]"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-black text-[rgb(var(--theme-text-readable))]">
                          {feed.customTitle || feed.url}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                            inactive
                              ? "bg-[rgba(var(--color-error),0.12)] text-[rgb(var(--color-error))]"
                              : recovered
                                ? "bg-[rgba(var(--color-success),0.12)] text-[rgb(var(--color-success))]"
                                : "bg-[rgba(var(--color-warning),0.12)] text-[rgb(var(--color-warning))]"
                          }`}
                        >
                          {inactive ? "inativo" : recovered ? "recuperado" : "em quarentena"}
                        </span>
                      </div>
                      <p className="mt-1 break-all font-mono text-xs text-[rgb(var(--theme-text-secondary-readable))] opacity-62">
                        {feed.url}
                      </p>
                      <div className="mt-3 grid gap-2 text-xs text-[rgb(var(--theme-text-secondary-readable))] sm:grid-cols-3">
                        <InfoPill label="Motivo" value={feed.quarantine?.reason || "—"} />
                        <InfoPill label="Entrada" value={formatDate(feed.quarantine?.enteredAt)} />
                        <InfoPill
                          label="Recuperação"
                          value={`${feed.quarantine?.recoverySuccesses || 0}/2 validações`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <ActionButton
                        icon={<RefreshCw className="h-4 w-4" />}
                        label="Testar"
                        onClick={() => onValidate(feed.url)}
                      />
                      <ActionButton
                        icon={<RotateCcw className="h-4 w-4" />}
                        label="Restaurar"
                        onClick={() => onRestore(feed.url)}
                        disabled={inactive}
                      />
                      <ActionButton
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        label="Marcar inativo"
                        onClick={() => onMarkInactive(feed.url)}
                        disabled={inactive}
                        warning
                      />
                      <ActionButton
                        icon={<Trash2 className="h-4 w-4" />}
                        label="Remover"
                        onClick={() => onRemove(feed.url)}
                        danger
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-[18px] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] px-4 py-3">
    <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[rgb(var(--theme-text-secondary-readable))] opacity-60">
      {label}
    </div>
    <div className="mt-1 text-xl font-black text-[rgb(var(--theme-text-readable))]">
      {value}
    </div>
  </div>
);

const InfoPill: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-[16px] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] px-3 py-2">
    <div className="text-[10px] font-black uppercase tracking-[0.14em] opacity-55">
      {label}
    </div>
    <div className="mt-1 truncate font-semibold text-[rgb(var(--theme-text-readable))]">
      {value}
    </div>
  </div>
);

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  warning?: boolean;
  danger?: boolean;
}> = ({ icon, label, onClick, disabled, warning, danger }) => (
  <button
    type="button"
    onClick={() => void onClick()}
    disabled={disabled}
    className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${
      danger
        ? "bg-[rgba(var(--color-error),0.12)] text-[rgb(var(--color-error))] hover:bg-[rgba(var(--color-error),0.18)]"
        : warning
          ? "bg-[rgba(var(--color-warning),0.12)] text-[rgb(var(--color-warning))] hover:bg-[rgba(var(--color-warning),0.18)]"
          : "bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] text-[rgb(var(--theme-text-readable))] hover:bg-[rgb(var(--theme-manager-soft,var(--color-surfaceElevated)))]"
    }`}
  >
    {icon}
    {label}
  </button>
);
