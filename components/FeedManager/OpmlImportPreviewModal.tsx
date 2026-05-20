import React, { useMemo, useState } from "react";
import type { FeedCategory } from "../../types";
import type { ImportCandidate } from "../../services/opmlImportPreview";
import { normalizeCategoryName } from "../../services/opmlImportPreview";
import { Modal } from "../Modal";

interface OpmlImportPreviewModalProps {
  isOpen: boolean;
  candidates: ImportCandidate[];
  categories: FeedCategory[];
  onClose: () => void;
  onConfirm: (candidates: ImportCandidate[]) => void | Promise<void>;
}

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
  if (candidate.categoryOverrideId) return `id:${candidate.categoryOverrideId}`;
  if (candidate.categoryOverrideName) return `new:${candidate.categoryOverrideName}`;
  if (candidate.suggestedCategoryId) return `id:${candidate.suggestedCategoryId}`;
  if (candidate.suggestedCategoryName) return `new:${candidate.suggestedCategoryName}`;
  return "";
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

  React.useEffect(() => {
    if (!isOpen) return;
    setDraftCandidates(candidates);
    setSelectedIds(
      new Set(
        candidates
          .filter((candidate) => candidate.decision === "import")
          .map((candidate) => candidate.id),
      ),
    );
    setCategoryToApply("");
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
      newCategories: new Set(
        draftCandidates
          .filter((candidate) => candidate.decision === "import")
          .map(
            (candidate) =>
              candidate.categoryOverrideName || candidate.suggestedCategoryName,
          )
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
              categoryOverrideId: categoryToApply,
              categoryOverrideName: undefined,
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
      });
      return;
    }

    if (value.startsWith("id:")) {
      updateCandidate(candidateId, {
        categoryOverrideId: value.slice(3),
        categoryOverrideName: undefined,
      });
      return;
    }

    updateCandidate(candidateId, {
      categoryOverrideId: undefined,
      categoryOverrideName: value.slice(4),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      title="Revisar OPML"
      description="Confirme quais feeds entram na coleção antes de gravar."
      tone="selection"
      zIndexClass="z-[9999]"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
            {summary.importing} de {summary.total} feeds marcados para importar.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[rgba(var(--color-border),0.24)] px-4 py-2 text-sm font-semibold text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] transition hover:bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void onConfirm(draftCandidates)}
              className="rounded-lg border border-[rgb(var(--color-accentSurface))] bg-[rgb(var(--color-accentSurface))] px-4 py-2 text-sm font-bold text-[rgb(var(--color-onAccent))] transition hover:brightness-110"
            >
              Importar selecionados
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-5">
          <PreviewStat label="Total" value={summary.total} />
          <PreviewStat label="Importar" value={summary.importing} />
          <PreviewStat label="Duplicados" value={summary.duplicates} />
          <PreviewStat label="Repetidos" value={summary.duplicateInFile} />
          <PreviewStat label="Novas categorias" value={summary.newCategories} />
        </div>

        {summary.invalid > 0 && (
          <div className="rounded-[16px] border border-[rgba(var(--color-error),0.22)] bg-[rgba(var(--color-error),0.1)] p-3 text-sm text-[rgb(var(--color-error))]">
            {summary.invalid} URLs invalidas foram mantidas fora da importacao.
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
              </div>
            );
          })}
        </div>
      </div>
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
