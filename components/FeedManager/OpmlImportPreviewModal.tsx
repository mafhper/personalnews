import React, { useMemo, useRef, useState } from "react";
import type { FeedCategory } from "../../types";
import type { ImportCandidate } from "../../services/opmlImportPreview";
import {
  buildLargeImportPlan,
  canImportCandidate,
  isLargeImportCount,
  type LargeImportPlan,
} from "../../services/largeImportPlanner";
import {
  buildOpmlImportConfirmationSummary,
  normalizeCategoryName,
} from "../../services/opmlImportPreview";
import { Modal } from "../Modal";

export type OpmlImportConfirmAction = "commit-only" | "validate-background";

interface OpmlImportPreviewModalProps {
  isOpen: boolean;
  candidates: ImportCandidate[];
  categories: FeedCategory[];
  onClose: () => void;
  onConfirm: (
    candidates: ImportCandidate[],
    action: OpmlImportConfirmAction,
  ) => void | Promise<void>;
}

type OpmlImportStep = "edit" | "confirm";

const statusLabels: Record<ImportCandidate["status"], string> = {
  pending: "pendente",
  ready: "novo",
  duplicate: "duplicado",
  "duplicate-in-file": "repetido no arquivo",
  "invalid-url": "URL invalida",
  importing: "importando",
  imported: "importado",
  skipped: "ignorado",
  failed: "falhou",
};

const statusClass = (status: ImportCandidate["status"]) => {
  if (status === "ready") {
    return "border-[rgba(var(--color-success),0.24)] bg-[rgba(var(--color-success),0.12)] text-[rgb(var(--color-success))]";
  }
  if (status === "duplicate" || status === "duplicate-in-file") {
    return "border-[rgba(var(--color-warning),0.24)] bg-[rgba(var(--color-warning),0.12)] text-[rgb(var(--color-warning))]";
  }
  if (status === "invalid-url" || status === "failed") {
    return "border-[rgba(var(--color-error),0.24)] bg-[rgba(var(--color-error),0.12)] text-[rgb(var(--color-error))]";
  }
  return "border-[rgb(var(--color-border))]/18 bg-[rgb(var(--theme-manager-control,var(--color-surface)))] text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]";
};

const candidateCategoryValue = (candidate: ImportCandidate) => {
  if (candidate.categoryOverrideCleared) return "";
  if (candidate.categoryOverrideId) return `id:${candidate.categoryOverrideId}`;
  if (candidate.categoryOverrideName) return `new:${candidate.categoryOverrideName}`;
  if (candidate.suggestedCategoryId) return `id:${candidate.suggestedCategoryId}`;
  if (candidate.suggestedCategoryName) return `new:${candidate.suggestedCategoryName}`;
  return "";
};

const candidateCategoryName = (candidate: ImportCandidate) => {
  if (candidate.categoryOverrideCleared) return undefined;
  return candidate.categoryOverrideName || candidate.suggestedCategoryName;
};

const hasDestinationCategory = (candidate: ImportCandidate) =>
  Boolean(
    !candidate.categoryOverrideCleared &&
      (candidate.categoryOverrideId ||
        candidate.suggestedCategoryId ||
        candidate.categoryOverrideName ||
        candidate.suggestedCategoryName),
  );

const shouldRecommendHideFromAll = (plan: LargeImportPlan): boolean =>
  isLargeImportCount(plan.importableCount) ||
  plan.warnings.includes("podcast-heavy-import");

const applyLargeImportVisibilityDefaults = (
  candidates: ImportCandidate[],
): ImportCandidate[] => {
  const plan = buildLargeImportPlan(candidates);
  if (!shouldRecommendHideFromAll(plan)) return candidates;

  return candidates.map((candidate) =>
    canImportCandidate(candidate) && hasDestinationCategory(candidate)
      ? { ...candidate, hideFromAll: true }
      : candidate,
  );
};

export const OpmlImportPreviewModal: React.FC<OpmlImportPreviewModalProps> = ({
  isOpen,
  candidates,
  categories,
  onClose,
  onConfirm,
}) => {
  const [draftCandidates, setDraftCandidates] = useState(candidates);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () =>
      new Set(
        candidates
          .filter((candidate) => candidate.decision === "import")
          .map((candidate) => candidate.id),
      ),
  );
  const [categoryToApply, setCategoryToApply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<OpmlImportStep>("edit");
  const isSubmittingRef = useRef(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setDraftCandidates(applyLargeImportVisibilityDefaults(candidates));
    setSelectedIds(
      new Set(
        candidates
          .filter((candidate) => candidate.decision === "import")
          .map((candidate) => candidate.id),
      ),
    );
    setCategoryToApply("");
    setStep("edit");
    setIsSubmitting(false);
    isSubmittingRef.current = false;
  }, [candidates, isOpen]);

  const summary = useMemo(() => {
    const importable = draftCandidates.filter(
      (candidate) => candidate.decision === "import",
    );
    return {
      total: draftCandidates.length,
      importing: importable.length,
      duplicates: draftCandidates.filter((candidate) => candidate.isDuplicate)
        .length,
      duplicateInFile: draftCandidates.filter(
        (candidate) => candidate.isDuplicateInFile,
      ).length,
      invalid: draftCandidates.filter(
        (candidate) => candidate.status === "invalid-url",
      ).length,
      hiddenFromAll: draftCandidates.filter(
        (candidate) => candidate.decision === "import" && candidate.hideFromAll,
      ).length,
      newCategories: new Set(
        draftCandidates
          .filter((candidate) => candidate.decision === "import")
          .map(candidateCategoryName)
          .filter((name): name is string => Boolean(name?.trim()))
          .filter((name) => {
            const normalized = normalizeCategoryName(name);
            return !categories.some(
              (category) => normalizeCategoryName(category.name) === normalized,
            );
          }),
      ).size,
    };
  }, [categories, draftCandidates]);

  const largeImportPlan = useMemo(
    () => buildLargeImportPlan(draftCandidates),
    [draftCandidates],
  );

  const isLargeImport = isLargeImportCount(largeImportPlan.importableCount);
  const isPodcastHeavy =
    largeImportPlan.warnings.includes("podcast-heavy-import");
  const topHosts = largeImportPlan.hosts.slice(0, 4);

  const confirmationSummary = useMemo(
    () => buildOpmlImportConfirmationSummary(draftCandidates, categories),
    [categories, draftCandidates],
  );

  const updateCandidate = (
    candidateId: string,
    updates: Partial<ImportCandidate>,
  ) => {
    setDraftCandidates((current) =>
      current.map((candidate) =>
        candidate.id === candidateId ? { ...candidate, ...updates } : candidate,
      ),
    );
  };

  const toggleSelected = (candidateId: string, selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) next.add(candidateId);
      else next.delete(candidateId);
      return next;
    });
  };

  const setDecision = (
    candidateId: string,
    decision: ImportCandidate["decision"],
  ) => {
    updateCandidate(candidateId, { decision });
    toggleSelected(candidateId, decision === "import");
  };

  const applyCategoryToSelected = () => {
    if (!categoryToApply) return;
    setDraftCandidates((current) =>
      current.map((candidate) =>
        selectedIds.has(candidate.id)
          ? {
              ...candidate,
              categoryOverrideCleared: false,
              categoryOverrideId: categoryToApply,
              categoryOverrideName: undefined,
            }
          : candidate,
      ),
    );
  };

  const applyHideFromAllToSelected = (hideFromAll: boolean) => {
    if (selectedIds.size === 0) return;
    setDraftCandidates((current) =>
      current.map((candidate) =>
        selectedIds.has(candidate.id)
          ? {
              ...candidate,
              hideFromAll,
            }
          : candidate,
      ),
    );
  };

  const importAllNew = () => {
    setDraftCandidates((current) =>
      current.map((candidate) =>
        candidate.status === "ready"
          ? { ...candidate, decision: "import" }
          : candidate,
      ),
    );
    setSelectedIds(
      new Set(
        draftCandidates
          .filter((candidate) => candidate.status === "ready")
          .map((candidate) => candidate.id),
      ),
    );
  };

  const ignoreDuplicates = () => {
    setDraftCandidates((current) =>
      current.map((candidate) =>
        candidate.isDuplicate || candidate.isDuplicateInFile
          ? { ...candidate, decision: "ignore" }
          : candidate,
      ),
    );
    setSelectedIds(
      new Set(
        draftCandidates
          .filter(
            (candidate) =>
              candidate.decision === "import" &&
              !candidate.isDuplicate &&
              !candidate.isDuplicateInFile,
          )
          .map((candidate) => candidate.id),
      ),
    );
  };

  const handleCategoryChange = (candidateId: string, value: string) => {
    if (!value) {
      updateCandidate(candidateId, {
        categoryOverrideId: undefined,
        categoryOverrideName: undefined,
        categoryOverrideCleared: true,
      });
      return;
    }

    if (value.startsWith("id:")) {
      updateCandidate(candidateId, {
        categoryOverrideId: value.slice(3),
        categoryOverrideName: undefined,
        categoryOverrideCleared: false,
      });
      return;
    }

    updateCandidate(candidateId, {
      categoryOverrideId: undefined,
      categoryOverrideName: value.slice(4),
      categoryOverrideCleared: false,
    });
  };

  const handleConfirm = async (
    action: OpmlImportConfirmAction = "commit-only",
  ) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onConfirm(draftCandidates, action);
    } catch (error) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      throw error;
    }
  };

  const goToConfirmation = () => {
    setStep("confirm");
  };

  const goBackToEdit = () => {
    setStep("edit");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      title={step === "confirm" ? "Confirmar importação" : "Revisar OPML"}
      description={
        step === "confirm"
          ? "Revise o resumo final antes de gravar os feeds."
          : "Confirme quais feeds entram na coleção antes de gravar."
      }
      tone="selection"
      zIndexClass="z-[9999]"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
            {summary.importing} de {summary.total} feeds marcados para importar.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {step === "confirm" && (
              <button
                type="button"
                onClick={goBackToEdit}
                disabled={isSubmitting}
                className="rounded-lg border border-[rgba(var(--color-border),0.24)] px-4 py-2 text-sm font-semibold text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] transition hover:bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Voltar para editar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-[rgba(var(--color-border),0.24)] px-4 py-2 text-sm font-semibold text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] transition hover:bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            {step === "confirm" && isLargeImport && (
              <button
                type="button"
                onClick={() => void handleConfirm("commit-only")}
                disabled={isSubmitting || summary.importing === 0}
                className="rounded-lg border border-[rgba(var(--color-accent),0.34)] px-4 py-2 text-sm font-bold text-[rgb(var(--color-accent))] transition hover:bg-[rgba(var(--color-accent),0.1)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Importando..." : "Importar agora"}
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                step === "confirm"
                  ? void handleConfirm(
                      isLargeImport ? "validate-background" : "commit-only",
                    )
                  : goToConfirmation()
              }
              disabled={isSubmitting || summary.importing === 0}
              className="rounded-lg border border-[rgb(var(--color-accentSurface))] bg-[rgb(var(--color-accentSurface))] px-4 py-2 text-sm font-bold text-[rgb(var(--color-onAccent))] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Importando..."
                : step === "confirm"
                  ? isLargeImport
                    ? "Importar + Validar"
                    : "Confirmar importação"
                  : "Importar selecionados"}
            </button>
          </div>
        </div>
      }
    >
      {step === "confirm" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <PreviewStat label="Importar" value={confirmationSummary.importCount} />
            <PreviewStat label="Ignorados" value={confirmationSummary.ignoredCount} />
            <PreviewStat label="Duplicados" value={confirmationSummary.duplicateCount} />
            <PreviewStat label="Inválidos" value={confirmationSummary.invalidCount} />
            <PreviewStat
              label="Ocultos da All"
              value={confirmationSummary.hiddenFromAllCount}
            />
            <PreviewStat
              label="Novas categorias"
              value={confirmationSummary.newCategories.length}
            />
          </div>

          {confirmationSummary.isLargeImport && (
            <div className="rounded-[16px] border border-[rgba(var(--color-warning),0.28)] bg-[rgba(var(--color-warning),0.12)] p-3 text-sm text-[rgb(var(--color-warning))]">
              Esta importação tem 50 feeds ou mais. Para evitar travamentos, o
              padrão seguro é gravar a coleção sem carregar tudo imediatamente.
            </div>
          )}

          {isLargeImport && (
            <div className="rounded-[16px] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] p-3 text-sm text-[rgb(var(--theme-manager-text,var(--color-text)))]">
              <h3 className="font-bold">
                {isPodcastHeavy
                  ? "Provável coleção de podcasts"
                  : "Importação grande detectada"}
              </h3>
              <p className="mt-1 text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                {largeImportPlan.podcastLikelyCount} podcasts prováveis de{" "}
                {largeImportPlan.importableCount} feeds. A recomendação é
                importar primeiro e validar em segundo plano, sem aquecer cache
                automaticamente.
              </p>
              {topHosts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {topHosts.map((host) => (
                    <span
                      key={host.host}
                      className="rounded-full border border-[rgba(var(--color-border),0.2)] px-2.5 py-1 text-xs font-bold text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]"
                    >
                      {host.host} · {host.count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {confirmationSummary.newCategories.length > 0 && (
            <div className="rounded-[16px] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] p-3">
              <h3 className="text-sm font-bold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                Categorias que serão criadas
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {confirmationSummary.newCategories.map((categoryName) => (
                  <span
                    key={categoryName}
                    className="rounded-full border border-[rgba(var(--color-accent),0.22)] px-3 py-1 text-xs font-bold text-[rgb(var(--color-accent))]"
                  >
                    {categoryName}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
            {confirmationSummary.groupsByCategory.map((group) => (
              <section
                key={group.categoryLabel}
                className="rounded-[18px] border border-[rgba(var(--color-border),0.14)] bg-[rgb(var(--theme-manager-elevated,var(--color-surface)))] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                    {group.categoryLabel}
                  </h3>
                  <span className="rounded-full bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] px-2.5 py-1 text-xs font-bold text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                    {group.feeds.length} feeds
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {group.feeds.slice(0, 12).map((feed) => (
                    <li key={feed.id} className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                        {feed.title}
                      </div>
                      <div className="break-all font-mono text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                        {feed.url}
                      </div>
                    </li>
                  ))}
                </ul>
                {group.feeds.length > 12 && (
                  <p className="mt-3 text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                    Mais {group.feeds.length - 12} feeds nesta categoria.
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      ) : (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <PreviewStat label="Total" value={summary.total} />
          <PreviewStat label="Importar" value={summary.importing} />
          <PreviewStat label="Duplicados" value={summary.duplicates} />
          <PreviewStat label="Repetidos" value={summary.duplicateInFile} />
          <PreviewStat label="Ocultos da All" value={summary.hiddenFromAll} />
          <PreviewStat label="Novas categorias" value={summary.newCategories} />
        </div>

        {summary.invalid > 0 && (
          <div className="rounded-[16px] border border-[rgba(var(--color-error),0.22)] bg-[rgba(var(--color-error),0.1)] p-3 text-sm text-[rgb(var(--color-error))]">
            {summary.invalid} URLs invalidas foram mantidas fora da importacao.
          </div>
        )}

        {isLargeImport && (
          <div className="rounded-[18px] border border-[rgba(var(--color-warning),0.26)] bg-[rgba(var(--color-warning),0.1)] p-4 text-sm text-[rgb(var(--theme-manager-text,var(--color-text)))]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="font-bold">Importação grande detectada</h3>
                <p className="mt-1 text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                  {largeImportPlan.importableCount} feeds serão importados.{" "}
                  {largeImportPlan.podcastLikelyCount} parecem podcasts; eles
                  ficam ocultos da All por padrão para evitar recarregar tudo ao
                  abrir a página All.
                </p>
                {topHosts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topHosts.map((host) => (
                      <span
                        key={host.host}
                        className="rounded-full border border-[rgba(var(--color-border),0.22)] bg-[rgba(var(--color-surface),0.36)] px-2.5 py-1 text-xs font-bold"
                      >
                        {host.host} · {host.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--color-warning))]">
                Sem warmup automático
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-[18px] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={importAllNew}
              className="rounded-full border border-[rgba(var(--color-success),0.24)] bg-[rgba(var(--color-success),0.12)] px-3 py-2 text-xs font-bold text-[rgb(var(--color-success))]"
            >
              Importar novos
            </button>
            <button
              type="button"
              onClick={ignoreDuplicates}
              className="rounded-full border border-[rgba(var(--color-warning),0.24)] bg-[rgba(var(--color-warning),0.12)] px-3 py-2 text-xs font-bold text-[rgb(var(--color-warning))]"
            >
              Ignorar duplicados
            </button>
            <button
              type="button"
              onClick={() => applyHideFromAllToSelected(true)}
              disabled={selectedIds.size === 0}
              className="rounded-full border border-[rgba(var(--color-accent),0.24)] bg-[rgba(var(--color-accent),0.12)] px-3 py-2 text-xs font-bold text-[rgb(var(--color-accent))] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Ocultar selecionados da All
            </button>
            <button
              type="button"
              onClick={() => applyHideFromAllToSelected(false)}
              disabled={selectedIds.size === 0}
              className="rounded-full border border-[rgba(var(--color-border),0.24)] px-3 py-2 text-xs font-bold text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Mostrar selecionados na All
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={categoryToApply}
              onChange={(event) => setCategoryToApply(event.target.value)}
              className="rounded-lg border border-[rgba(var(--color-border),0.24)] bg-[rgb(var(--theme-manager-elevated,var(--color-surface)))] px-3 py-2 text-sm text-[rgb(var(--theme-manager-text,var(--color-text)))]"
            >
              <option value="">Categoria para selecionados</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyCategoryToSelected}
              disabled={!categoryToApply || selectedIds.size === 0}
              className="rounded-lg border border-[rgba(var(--color-accent),0.26)] px-3 py-2 text-xs font-bold text-[rgb(var(--color-accent))] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Aplicar
            </button>
          </div>
        </div>

        <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
          {draftCandidates.map((candidate) => {
            const categoryValue = candidateCategoryValue(candidate);
            const canImport =
              candidate.status !== "invalid-url" &&
              candidate.status !== "duplicate-in-file";

            return (
              <div
                key={candidate.id}
                className="rounded-[18px] border border-[rgba(var(--color-border),0.14)] bg-[rgb(var(--theme-manager-elevated,var(--color-surface)))] p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                    <input
                      type="checkbox"
                      checked={candidate.decision === "import"}
                      disabled={!canImport}
                      onChange={(event) =>
                        setDecision(
                          candidate.id,
                          event.target.checked ? "import" : "ignore",
                        )
                      }
                    />
                    Importar
                  </label>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusClass(
                          candidate.status,
                        )}`}
                      >
                        {statusLabels[candidate.status]}
                      </span>
                      {candidate.duplicateOfUrl && (
                        <span className="truncate text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                          ja existe: {candidate.duplicateOfUrl}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 break-all font-mono text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                      {candidate.url}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
                  <input
                    value={candidate.titleOverride ?? candidate.suggestedTitle ?? ""}
                    onChange={(event) =>
                      updateCandidate(candidate.id, {
                        titleOverride: event.target.value,
                      })
                    }
                    placeholder="Titulo do feed"
                    className="rounded-lg border border-[rgba(var(--color-border),0.24)] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] px-3 py-2 text-sm text-[rgb(var(--theme-manager-text,var(--color-text)))] outline-none"
                  />
                  <select
                    value={categoryValue}
                    onChange={(event) =>
                      handleCategoryChange(candidate.id, event.target.value)
                    }
                    className="rounded-lg border border-[rgba(var(--color-border),0.24)] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] px-3 py-2 text-sm text-[rgb(var(--theme-manager-text,var(--color-text)))] outline-none"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={`id:${category.id}`}>
                        {category.name}
                      </option>
                    ))}
                    {candidate.suggestedCategoryName &&
                      !candidate.suggestedCategoryId && (
                        <option value={`new:${candidate.suggestedCategoryName}`}>
                          Criar: {candidate.suggestedCategoryName}
                        </option>
                      )}
                  </select>
                </div>
                <label className="mt-3 flex items-start gap-2 rounded-lg bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] px-3 py-2 text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                  <input
                    type="checkbox"
                    checked={Boolean(candidate.hideFromAll)}
                    disabled={!canImport || candidate.decision !== "import"}
                    onChange={(event) =>
                      updateCandidate(candidate.id, {
                        hideFromAll: event.target.checked,
                      })
                    }
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-bold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                      Ocultar da All
                    </span>
                    <span>
                      Mantém este feed apenas na categoria escolhida e evita
                      carregamento automático na página All.
                    </span>
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </Modal>
  );
};

const PreviewStat: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => (
  <div className="rounded-[16px] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] p-3">
    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
      {label}
    </div>
    <div className="mt-1 text-lg font-bold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
      {value}
    </div>
  </div>
);
