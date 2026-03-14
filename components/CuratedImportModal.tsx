import React from "react";
import type { FeedCategory, FeedSource } from "../types";

interface CuratedImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedListType: string;
  onSelectList: (listName: string) => void;
  onImport: (mode: "merge" | "replace") => void;
  curatedLists: Record<string, FeedSource[]>;
  categories: FeedCategory[];
  currentFeeds: FeedSource[];
}

interface ListSummary {
  name: string;
  feeds: FeedSource[];
  totalFeeds: number;
  categoryCount: number;
  existingCount: number;
  sourceCount: number;
  categoryLabels: string[];
  previewSources: Array<{
    title: string;
    domain: string;
  }>;
}

const CATEGORY_TINTS: Record<string, string> = {
  design:
    "bg-[rgba(120,192,255,0.12)] text-[rgb(var(--color-text))] border-[rgba(120,192,255,0.18)]",
  games:
    "bg-[rgba(255,170,90,0.12)] text-[rgb(var(--color-text))] border-[rgba(255,170,90,0.18)]",
  tech:
    "bg-[rgba(92,231,194,0.12)] text-[rgb(var(--color-text))] border-[rgba(92,231,194,0.18)]",
  politics:
    "bg-[rgba(255,124,124,0.12)] text-[rgb(var(--color-text))] border-[rgba(255,124,124,0.18)]",
  youtube:
    "bg-[rgba(255,102,132,0.12)] text-[rgb(var(--color-text))] border-[rgba(255,102,132,0.18)]",
};

const extractDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const getSourceHref = (url: string) => {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname.includes("youtube.com") &&
      parsed.pathname.includes("/feeds/videos.xml")
    ) {
      const channelId = parsed.searchParams.get("channel_id");
      if (channelId) {
        return `https://www.youtube.com/channel/${channelId}`;
      }
    }
    return parsed.origin;
  } catch {
    return url;
  }
};

const getCategoryLabel = (
  categoryId: string | undefined,
  categories: FeedCategory[],
) => {
  if (!categoryId) return "Geral";
  return categories.find((category) => category.id === categoryId)?.name || categoryId;
};

const getListTone = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("brasil")) {
    return "from-[rgba(101,199,255,0.18)] via-[rgba(101,199,255,0.05)] to-transparent";
  }
  if (normalized.includes("international")) {
    return "from-[rgba(92,231,194,0.18)] via-[rgba(92,231,194,0.05)] to-transparent";
  }
  return "from-[rgba(255,179,71,0.18)] via-[rgba(255,179,71,0.05)] to-transparent";
};

const getListNarrative = (name: string, categoryLabels: string[]) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("brasil")) {
    return "Uma base local para começar com repertório nacional e cobertura equilibrada.";
  }
  if (normalized.includes("international")) {
    return "Seleção internacional para quem quer ampliar repertório e acompanhar fontes globais.";
  }
  if (normalized.includes("global")) {
    return "Pacote misto para montar uma homepage mais ampla, com contraste entre fontes locais e externas.";
  }
  return `Lista curada com ${categoryLabels.length} frentes editoriais para começar mais rápido.`;
};

const ModalStep: React.FC<{
  index: number;
  title: string;
  description: string;
}> = ({ index, title, description }) => (
  <div className="grid gap-2 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/25 text-sm font-semibold text-[rgb(var(--color-text))]">
        {index}
      </div>
      <strong className="text-sm font-semibold text-[rgb(var(--color-text))]">
        {title}
      </strong>
    </div>
    <p className="text-sm leading-relaxed text-[rgb(var(--color-textSecondary))]">
      {description}
    </p>
  </div>
);

export const CuratedImportModal: React.FC<CuratedImportModalProps> = ({
  isOpen,
  onClose,
  selectedListType,
  onSelectList,
  onImport,
  curatedLists,
  categories,
  currentFeeds,
}) => {
  const currentUrls = React.useMemo(
    () => new Set(currentFeeds.map((feed) => feed.url)),
    [currentFeeds],
  );

  const summaries = React.useMemo<ListSummary[]>(() => {
    return Object.entries(curatedLists).map(([name, feeds]) => {
      const categoryLabels = Array.from(
        new Set(feeds.map((feed) => getCategoryLabel(feed.categoryId, categories))),
      );
      const previewSources = feeds.slice(0, 5).map((feed) => ({
        title: feed.customTitle || extractDomain(feed.url),
        domain: extractDomain(feed.url),
      }));
      const existingCount = feeds.filter((feed) => currentUrls.has(feed.url)).length;
      const sourceCount = new Set(feeds.map((feed) => extractDomain(feed.url))).size;

      return {
        name,
        feeds,
        totalFeeds: feeds.length,
        categoryCount: categoryLabels.length,
        existingCount,
        sourceCount,
        categoryLabels,
        previewSources,
      };
    });
  }, [categories, curatedLists, currentUrls]);

  const selectedSummary =
    summaries.find((summary) => summary.name === selectedListType) || summaries[0];

  const groupedFeeds = React.useMemo(() => {
    if (!selectedSummary) return [];

    const groups = new Map<
      string,
      Array<FeedSource & { categoryLabel: string; domain: string; href: string }>
    >();

    selectedSummary.feeds.forEach((feed) => {
      const categoryLabel = getCategoryLabel(feed.categoryId, categories);
      const current = groups.get(categoryLabel) || [];
      current.push({
        ...feed,
        categoryLabel,
        domain: extractDomain(feed.url),
        href: getSourceHref(feed.url),
      });
      groups.set(categoryLabel, current);
    });

    return Array.from(groups.entries()).map(([label, feeds]) => ({
      label,
      feeds,
    }));
  }, [categories, selectedSummary]);

  if (!isOpen || !selectedSummary) return null;

  const newFeedsCount = selectedSummary.totalFeeds - selectedSummary.existingCount;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[rgb(var(--color-surface))]/96 text-[rgb(var(--color-text))] shadow-[0_40px_120px_-48px_rgba(0,0,0,0.9)]">
        <div className="grid border-b border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-3">
              <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-textSecondary))]">
                Onboarding de fontes
              </span>
              <div className="grid gap-2">
                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[rgb(var(--color-text))] sm:text-[2rem]">
                  Comece com uma lista curada e revise tudo antes de importar.
                </h3>
                <p className="max-w-3xl text-sm leading-relaxed text-[rgb(var(--color-textSecondary))] sm:text-base">
                  Escolha uma coleção, veja quais sites entram em cada categoria
                  e decida se quer mesclar com sua base atual ou substituir tudo.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/20 text-[rgb(var(--color-textSecondary))] transition-colors hover:border-white/20 hover:text-[rgb(var(--color-text))]"
              aria-label="Fechar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <ModalStep
              index={1}
              title="Escolha a coleção"
              description="Compare as listas prontas por volume, categorias e repertório."
            />
            <ModalStep
              index={2}
              title="Revise os sites"
              description="Abra os domínios disponíveis e confira a composição editorial antes de importar."
            />
            <ModalStep
              index={3}
              title="Defina o impacto"
              description="Mescle somente o que falta ou substitua a base atual por uma coleção limpa."
            />
          </div>
        </div>

        <div className="grid max-h-[calc(92vh-13.5rem)] overflow-hidden lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.3fr)]">
          <div className="overflow-y-auto border-b border-white/8 p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-textSecondary))]">
                  Coleções disponíveis
                </h4>
                <p className="mt-1 text-sm text-[rgb(var(--color-textSecondary))]">
                  Cada lista já vem organizada com feeds manuais por categoria.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-[rgb(var(--color-textSecondary))]">
                {summaries.length} listas
              </span>
            </div>

            <div className="grid gap-3">
              {summaries.map((summary) => {
                const isActive = summary.name === selectedSummary.name;
                return (
                  <button
                    key={summary.name}
                    onClick={() => onSelectList(summary.name)}
                    className={`grid gap-4 rounded-[1.4rem] border p-4 text-left transition-all duration-200 ${
                      isActive
                        ? "border-[rgba(var(--color-accent),0.32)] bg-[rgba(var(--color-accent),0.1)] shadow-[0_24px_64px_-42px_rgba(0,0,0,0.85)]"
                        : "border-white/8 bg-white/[0.028] hover:border-white/16 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div
                      className={`rounded-[1.15rem] border border-white/8 bg-gradient-to-br p-4 ${getListTone(summary.name)}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="grid gap-2">
                          <strong className="text-lg font-semibold leading-tight text-[rgb(var(--color-text))]">
                            {summary.name}
                          </strong>
                          <p className="text-sm leading-relaxed text-[rgb(var(--color-textSecondary))]">
                            {getListNarrative(summary.name, summary.categoryLabels)}
                          </p>
                        </div>
                        {isActive && (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(var(--color-accent),0.35)] bg-[rgba(var(--color-accent),0.16)] text-[rgb(var(--color-text))]">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="m5 13 4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                        <div className="text-[0.68rem] uppercase tracking-[0.16em] text-[rgb(var(--color-textSecondary))]">
                          Feeds
                        </div>
                        <strong className="mt-1 block text-base text-[rgb(var(--color-text))]">
                          {summary.totalFeeds}
                        </strong>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                        <div className="text-[0.68rem] uppercase tracking-[0.16em] text-[rgb(var(--color-textSecondary))]">
                          Categorias
                        </div>
                        <strong className="mt-1 block text-base text-[rgb(var(--color-text))]">
                          {summary.categoryCount}
                        </strong>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                        <div className="text-[0.68rem] uppercase tracking-[0.16em] text-[rgb(var(--color-textSecondary))]">
                          Sites
                        </div>
                        <strong className="mt-1 block text-base text-[rgb(var(--color-text))]">
                          {summary.sourceCount}
                        </strong>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                        <div className="text-[0.68rem] uppercase tracking-[0.16em] text-[rgb(var(--color-textSecondary))]">
                          Já na base
                        </div>
                        <strong className="mt-1 block text-base text-[rgb(var(--color-text))]">
                          {summary.existingCount}
                        </strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {summary.categoryLabels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[rgb(var(--color-textSecondary))]"
                        >
                          {label}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {summary.previewSources.map((source) => (
                        <span
                          key={`${summary.name}-${source.title}`}
                          className="rounded-full border border-white/8 bg-black/20 px-3 py-1 text-xs text-[rgb(var(--color-textSecondary))]"
                        >
                          {source.title}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid overflow-y-auto p-5 sm:p-6">
            <div className="grid gap-5">
              <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="grid gap-2">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-textSecondary))]">
                      Lista selecionada
                    </span>
                    <h4 className="text-2xl font-semibold tracking-[-0.04em] text-[rgb(var(--color-text))]">
                      {selectedSummary.name}
                    </h4>
                    <p className="max-w-2xl text-sm leading-relaxed text-[rgb(var(--color-textSecondary))]">
                      {getListNarrative(
                        selectedSummary.name,
                        selectedSummary.categoryLabels,
                      )}
                    </p>
                  </div>

                  <div className="grid gap-2 rounded-[1.15rem] border border-white/8 bg-black/20 p-4 text-sm">
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-[rgb(var(--color-textSecondary))]">
                        Entram ao mesclar
                      </span>
                      <strong className="text-[rgb(var(--color-text))]">
                        {newFeedsCount}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-[rgb(var(--color-textSecondary))]">
                        Total da lista
                      </span>
                      <strong className="text-[rgb(var(--color-text))]">
                        {selectedSummary.totalFeeds}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-[rgb(var(--color-textSecondary))]">
                        Feeds repetidos
                      </span>
                      <strong className="text-[rgb(var(--color-text))]">
                        {selectedSummary.existingCount}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.025] p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-textSecondary))]">
                      Sites e categorias
                    </h5>
                    <p className="mt-1 text-sm text-[rgb(var(--color-textSecondary))]">
                      Abra os domínios para conferir a identidade editorial antes de importar.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-[rgb(var(--color-textSecondary))]">
                    {selectedSummary.sourceCount} fontes
                  </span>
                </div>

                <div className="grid gap-4">
                  {groupedFeeds.map((group) => {
                    const categoryId = group.feeds[0]?.categoryId || "";
                    return (
                      <div
                        key={group.label}
                        className="rounded-[1.2rem] border border-white/8 bg-black/20 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                              CATEGORY_TINTS[categoryId] ||
                              "bg-white/[0.05] text-[rgb(var(--color-text))] border-white/10"
                            }`}
                          >
                            {group.label}
                          </span>
                          <span className="text-xs text-[rgb(var(--color-textSecondary))]">
                            {group.feeds.length} fontes
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          {group.feeds.map((feed) => {
                            const isExisting = currentUrls.has(feed.url);
                            return (
                              <a
                                key={`${group.label}-${feed.url}`}
                                href={feed.href}
                                target="_blank"
                                rel="noreferrer"
                                className={`group inline-flex min-h-11 items-center gap-3 rounded-full border px-3.5 py-2 text-sm transition-all ${
                                  isExisting
                                    ? "border-white/12 bg-white/[0.06] text-[rgb(var(--color-textSecondary))]"
                                    : "border-white/10 bg-white/[0.03] text-[rgb(var(--color-text))] hover:border-[rgba(var(--color-accent),0.24)] hover:bg-[rgba(var(--color-accent),0.08)]"
                                }`}
                                title={feed.url}
                              >
                                <span className="grid text-left leading-tight">
                                  <strong className="text-sm font-medium">
                                    {feed.customTitle || feed.domain}
                                  </strong>
                                  <span className="text-[0.72rem] text-[rgb(var(--color-textSecondary))]">
                                    {feed.domain}
                                  </span>
                                </span>
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-[rgb(var(--color-textSecondary))] transition-colors group-hover:text-[rgb(var(--color-text))]">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5h5m0 0v5m0-5L10 14" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 9v10h10" />
                                  </svg>
                                </span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5">
                <div className="grid gap-1">
                  <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-textSecondary))]">
                    Como aplicar
                  </h5>
                  <p className="text-sm text-[rgb(var(--color-textSecondary))]">
                    Escolha o impacto sobre sua coleção atual.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    onClick={() => onImport("merge")}
                    className="grid gap-2 rounded-[1.2rem] border border-[rgba(var(--color-accent),0.22)] bg-[rgba(var(--color-accent),0.1)] px-4 py-4 text-left transition-colors hover:border-[rgba(var(--color-accent),0.34)] hover:bg-[rgba(var(--color-accent),0.14)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-base font-semibold text-[rgb(var(--color-text))]">
                        Mesclar com a base atual
                      </strong>
                      <span className="rounded-full border border-[rgba(var(--color-accent),0.28)] px-2.5 py-1 text-xs text-[rgb(var(--color-text))]">
                        +{Math.max(newFeedsCount, 0)}
                      </span>
                    </div>
                    <span className="text-sm leading-relaxed text-[rgb(var(--color-textSecondary))]">
                      Adiciona apenas o que ainda não existe. Mantém seus feeds atuais intactos.
                    </span>
                  </button>

                  <button
                    onClick={() => onImport("replace")}
                    className="grid gap-2 rounded-[1.2rem] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-left transition-colors hover:border-rose-400/34 hover:bg-rose-500/14"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-base font-semibold text-[rgb(var(--color-text))]">
                        Substituir todos os feeds
                      </strong>
                      <span className="rounded-full border border-rose-400/26 px-2.5 py-1 text-xs text-rose-200">
                        reset
                      </span>
                    </div>
                    <span className="text-sm leading-relaxed text-[rgb(var(--color-textSecondary))]">
                      Limpa sua coleção atual e começa do zero com a lista selecionada.
                    </span>
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="mt-1 inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-[rgb(var(--color-textSecondary))] transition-colors hover:border-white/16 hover:text-[rgb(var(--color-text))]"
                >
                  Fechar por agora
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
