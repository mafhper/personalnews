import React from "react";
import { FileUp, ListPlus, PlusCircle, Rss, Send } from "lucide-react";
import type { FeedCategory } from "../../types";
import {
  managerFieldClass,
  managerPrimaryButtonClass,
  managerSectionBandClass,
  managerSurfaceClass,
} from "./feedManagerStyles";

interface FeedAddTabProps {
  categories: FeedCategory[];
  newFeedUrl: string;
  setNewFeedUrl: (url: string) => void;
  newFeedTitle: string;
  setNewFeedTitle: (title: string) => void;
  newFeedCategory: string;
  setNewFeedCategory: (id: string) => void;
  processingUrl: string | null;
  onSubmit: (event: React.FormEvent) => void | Promise<void>;
  onImportOPML: () => void;
  onShowImportModal: () => void;
  feedCount: number;
  embedded?: boolean;
}

const PANEL_CLASS = managerSurfaceClass;

const FIELD_CLASS = managerFieldClass;

export const FeedAddTab: React.FC<FeedAddTabProps> = ({
  categories,
  newFeedUrl,
  setNewFeedUrl,
  newFeedTitle,
  setNewFeedTitle,
  newFeedCategory,
  setNewFeedCategory,
  processingUrl,
  onSubmit,
  onImportOPML,
  onShowImportModal,
  feedCount,
  embedded = false,
}) => {
  const isProcessing = processingUrl !== null;

  return (
    <div className={embedded ? "" : "h-full overflow-y-auto custom-scrollbar p-4 sm:p-6"}>
      <div className="mx-auto grid w-full max-w-[1480px] gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className={`${PANEL_CLASS} overflow-hidden p-0`}>
          <div className={`${managerSectionBandClass} rounded-none px-6 py-5`}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))]">
                <Rss className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                  Adicionar feed
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                  Cole uma URL RSS ou a página de um site. Se houver múltiplas fontes, o sistema abre a seleção antes de adicionar.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={(event) => {
              void onSubmit(event);
            }}
            className="grid gap-5 p-6"
          >
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                URL do feed ou site
              </span>
              <input
                type="url"
                required
                placeholder="https://exemplo.com/rss"
                value={newFeedUrl}
                onChange={(event) => setNewFeedUrl(event.target.value)}
                disabled={isProcessing}
                className={FIELD_CLASS}
              />
            </label>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                  Nome de exibição
                </span>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={newFeedTitle}
                  onChange={(event) => setNewFeedTitle(event.target.value)}
                  disabled={isProcessing}
                  className={FIELD_CLASS}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                  Categoria
                </span>
                <select
                  value={newFeedCategory}
                  onChange={(event) => setNewFeedCategory(event.target.value)}
                  disabled={isProcessing}
                  className={FIELD_CLASS}
                >
                  <option value="">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-[rgba(var(--color-border),0.12)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                A coleção atual tem <strong className="text-[rgb(var(--theme-manager-text,var(--color-text)))]">{feedCount}</strong> feeds. Duplicatas e descoberta automática são tratadas antes da inclusão.
              </p>
              <button
                type="submit"
                disabled={isProcessing}
                className={`${managerPrimaryButtonClass} px-6 py-3`}
              >
                {isProcessing ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isProcessing ? "Validando..." : "Adicionar"}
              </button>
            </div>
          </form>
        </section>

        <aside className="grid gap-5">
          <section className={`${PANEL_CLASS} p-5`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                <FileUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                  Importar OPML
                </h4>
                <p className="text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                  Traga uma lista externa sem mexer manualmente em cada feed.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onImportOPML}
              className="w-full rounded-2xl bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] px-4 py-3 text-sm font-bold text-[rgb(var(--theme-manager-text,var(--color-text)))] transition hover:bg-[rgb(var(--theme-manager-soft,var(--color-surfaceElevated)))]"
            >
              Escolher arquivo OPML
            </button>
          </section>

          <section className={`${PANEL_CLASS} p-5`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                <ListPlus className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                  Listas curadas
                </h4>
                <p className="text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                  Comece com coleções prontas e decida entre mesclar ou substituir.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onShowImportModal}
              className={`${managerPrimaryButtonClass} w-full py-3`}
            >
              <PlusCircle className="h-4 w-4" />
              Abrir listas
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};
