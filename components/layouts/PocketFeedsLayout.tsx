import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Columns2,
  Disc3,
  Grid3X3,
  List,
  Music2,
  Pause,
  Play,
  X,
} from "lucide-react";
import { Article } from "../../types";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { LazyImage } from "../LazyImage";
import { ArticleReaderModal } from "../ArticleReaderModal";
import { FavoriteButton } from "../FavoriteButton";

interface PocketFeedsLayoutProps {
  articles: Article[];
  timeFormat?: "12h" | "24h";
}

type PocketFeedsViewMode = "single" | "double" | "grid" | "mixtape";

interface PodcastGroup {
  name: string;
  episodes: Article[];
  firstEpisode: Article;
  playableEpisode?: Article;
  recentCount: number;
}

const Bone: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`feed-skeleton-block ${className}`} />
);

const MAX_TIMELINE_EPISODES = 120;
const MAX_INLINE_EPISODES = 10;
const DOUBLE_LAYOUT_MIN_WIDTH = 760;
const POCKETFEEDS_VIEW_STORAGE_KEY = "pocketfeeds-view-mode";
const DEFAULT_POCKETFEEDS_VIEW_MODE: PocketFeedsViewMode = "double";

const VIEW_MODE_OPTIONS: Array<{
  id: PocketFeedsViewMode;
  label: string;
  shortLabel: string;
  title: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}> = [
  {
    id: "single",
    label: "1 coluna",
    shortLabel: "1",
    title: "Mostrar podcasts em uma coluna",
    Icon: List,
  },
  {
    id: "double",
    label: "2 colunas",
    shortLabel: "2",
    title: "Mostrar podcasts em duas colunas",
    Icon: Columns2,
  },
  {
    id: "grid",
    label: "Grid",
    shortLabel: "Grid",
    title: "Mostrar podcasts em grid",
    Icon: Grid3X3,
  },
  {
    id: "mixtape",
    label: "Mixtape",
    shortLabel: "Mix",
    title: "Mostrar podcasts em Mixtape",
    Icon: Disc3,
  },
];

const isPocketFeedsViewMode = (value: unknown): value is PocketFeedsViewMode =>
  VIEW_MODE_OPTIONS.some((option) => option.id === value);

const episodeLabel = (count: number) =>
  count === 1 ? "episódio" : "episódios";

const getEpisodeKey = (episode: Article, index: number) =>
  `${episode.feedUrl || episode.sourceTitle || "podcast"}:${episode.link || episode.title}:${index}`;

const getEpisodeByline = (episode: Article) =>
  episode.author && episode.author !== episode.sourceTitle
    ? `${episode.sourceTitle} • ${episode.author}`
    : episode.sourceTitle;

const getPodcastArtworkEpisode = (group: PodcastGroup) =>
  group.episodes.find((episode) => Boolean(episode.imageUrl)) ||
  group.firstEpisode;

const isRecentEpisode = (episode: Article) => {
  const dayAgo = new Date();
  dayAgo.setDate(dayAgo.getDate() - 7);
  return new Date(episode.pubDate) > dayAgo;
};

const formatDuration = (duration?: string): string => {
  if (!duration) return "";
  if (duration.includes(":")) return duration;

  const secs = parseInt(duration, 10);
  if (Number.isNaN(secs)) return duration;

  const hours = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${mins}:${seconds.toString().padStart(2, "0")}`;
};

const EpisodeArtwork: React.FC<{
  episode: Article;
  fallbackAlt: string;
  className?: string;
  priority?: boolean;
}> = ({
  episode,
  fallbackAlt,
  className = "h-11 w-11 sm:h-12 sm:w-12",
  priority = false,
}) => {
  if (!episode.imageUrl) return null;

  return (
    <div
      className={`${className} flex-shrink-0 overflow-hidden rounded-lg border border-[rgb(var(--color-border))] bg-[rgba(var(--color-text),0.04)]`}
    >
      <LazyImage
        src={episode.imageUrl}
        className="h-full w-full object-cover"
        alt={episode.title || fallbackAlt}
        priority={priority}
        aspectRatio="1/1"
      />
    </div>
  );
};

const PodcastArtwork: React.FC<{
  episode: Article;
  title: string;
  className?: string;
}> = ({ episode, title, className = "h-24 w-24 md:h-32 md:w-32" }) => (
  <div
    className={`${className} flex-shrink-0 overflow-hidden rounded-[var(--feed-card-radius)] bg-[rgba(var(--color-text),0.04)] shadow-lg`}
  >
    {episode.imageUrl ? (
      <LazyImage
        src={episode.imageUrl}
        className="h-full w-full object-cover"
        alt={title}
        priority
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[rgba(var(--color-accent),0.58)] to-[rgba(var(--color-primary),0.42)]">
        <Music2 className="h-10 w-10 text-white/80" aria-hidden />
      </div>
    )}
  </div>
);

export const PocketFeedsSkeleton: React.FC = () => {
  return (
    <div className="feed-top-clearance mx-auto w-full max-w-screen-2xl space-y-8 px-4 pb-8 sm:px-6 md:px-8">
      <div className="flex items-center justify-between border-b border-[rgb(var(--color-border))]/25 pb-4">
        <div className="flex gap-3">
          <div className="h-6 w-6 rounded feed-skeleton-block" />
          <div className="h-6 w-32 rounded feed-skeleton-block" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex h-[160px] gap-4 rounded-[var(--feed-card-radius)] p-5 feed-surface"
          >
            <div className="h-24 w-24 flex-shrink-0 rounded-[var(--feed-card-radius)] feed-skeleton-block md:h-32 md:w-32" />
            <div className="flex-1 space-y-4">
              <Bone className="h-6 w-3/4" />
              <Bone className="h-4 w-1/2" />
              <Bone className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* 8. PocketFeeds Layout - Podcast-focused with inline audio player */
export const PocketFeedsLayout: React.FC<PocketFeedsLayoutProps> = ({
  articles,
}) => {
  const layoutMeasureRef = useRef<HTMLDivElement | null>(null);
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<Article | null>(null);
  const [expandedPodcast, setExpandedPodcast] = useState<string | null>(null);
  const [expandedEpisodeKey, setExpandedEpisodeKey] = useState<string | null>(
    null,
  );
  const [isLayoutPickerOpen, setLayoutPickerOpen] = useState(false);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [storedViewMode, setStoredViewMode] =
    useLocalStorage<PocketFeedsViewMode>(
      POCKETFEEDS_VIEW_STORAGE_KEY,
      DEFAULT_POCKETFEEDS_VIEW_MODE,
    );
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedViewMode = isPocketFeedsViewMode(storedViewMode)
    ? storedViewMode
    : DEFAULT_POCKETFEEDS_VIEW_MODE;
  const canUseDoubleLayout =
    layoutWidth === 0 || layoutWidth >= DOUBLE_LAYOUT_MIN_WIDTH;
  const viewMode =
    selectedViewMode === "double" && !canUseDoubleLayout
      ? "single"
      : selectedViewMode;
  const availableViewModeOptions = VIEW_MODE_OPTIONS.filter(
    (option) => option.id !== "double" || canUseDoubleLayout,
  );
  const currentViewModeOption =
    VIEW_MODE_OPTIONS.find((option) => option.id === viewMode) ||
    VIEW_MODE_OPTIONS[1];
  const CurrentViewModeIcon = currentViewModeOption.Icon;

  useEffect(() => {
    if (!isPocketFeedsViewMode(storedViewMode)) {
      setStoredViewMode(DEFAULT_POCKETFEEDS_VIEW_MODE);
    }
  }, [setStoredViewMode, storedViewMode]);

  useEffect(() => {
    const element = layoutMeasureRef.current;
    if (!element) return;

    const updateLayoutWidth = () => {
      setLayoutWidth(element.getBoundingClientRect().width);
    };

    updateLayoutWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateLayoutWidth);
      return () => window.removeEventListener("resize", updateLayoutWidth);
    }

    const observer = new ResizeObserver(updateLayoutWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const podcastGroups = useMemo<PodcastGroup[]>(() => {
    const groups = new Map<string, Article[]>();
    articles.forEach((article) => {
      const key = article.sourceTitle || "Unknown Podcast";
      const group = groups.get(key) || [];
      group.push(article);
      groups.set(key, group);
    });

    return Array.from(groups.entries()).map(([name, groupArticles]) => {
      const episodes = groupArticles
        .slice()
        .sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
        );
      return {
        name,
        episodes,
        firstEpisode: episodes[0],
        playableEpisode: episodes.find((episode) => Boolean(episode.audioUrl)),
        recentCount: episodes.filter(isRecentEpisode).length,
      };
    });
  }, [articles]);

  const podcastMap = useMemo(
    () =>
      podcastGroups.reduce<Record<string, PodcastGroup>>((groups, group) => {
        groups[group.name] = group;
        return groups;
      }, {}),
    [podcastGroups],
  );

  const sortedEpisodes = useMemo(
    () =>
      articles
        .slice()
        .sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
        ),
    [articles],
  );
  const visibleTimelineEpisodes = sortedEpisodes.slice(0, MAX_TIMELINE_EPISODES);
  const timelineGroups = useMemo(() => {
    return visibleTimelineEpisodes.reduce<Record<string, Article[]>>(
      (groups, episode) => {
        const key = new Date(episode.pubDate).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        if (!groups[key]) groups[key] = [];
        groups[key].push(episode);
        return groups;
      },
      {},
    );
  }, [visibleTimelineEpisodes]);

  const formatPlaybackTime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = async (episode: Article) => {
    if (!episode.audioUrl) return;

    if (playingAudio === episode.audioUrl) {
      audioRef.current?.pause();
      setPlayingAudio(null);
      setPlaybackError(null);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (audio.src !== episode.audioUrl) {
      audio.src = episode.audioUrl;
      setCurrentTime(0);
      setDuration(0);
    }
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    setActiveEpisode(episode);
    setPlaybackError(null);

    try {
      await audio.play();
      setPlayingAudio(episode.audioUrl);
    } catch {
      setPlayingAudio(null);
      setPlaybackError(
        "Não foi possível iniciar o áudio. Verifique sua conexão ou tente outro episódio.",
      );
    }
  };

  const handleSeek = (nextTime: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleVolumeChange = (nextVolume: number) => {
    setVolume(nextVolume);
    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
    }
  };

  const handlePlaybackRateChange = (nextRate: number) => {
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const togglePodcast = (podcastName: string) => {
    setExpandedPodcast((current) =>
      current === podcastName ? null : podcastName,
    );
  };

  const renderPlayButton = (
    episode: Article | undefined,
    className = "h-10 w-10",
    label = "episódio",
  ) => {
    if (!episode?.audioUrl) {
      return (
        <button
          type="button"
          disabled
          aria-label={`Áudio indisponível para ${label}`}
          title="Áudio indisponível"
          className={`${className} flex flex-shrink-0 items-center justify-center rounded-full bg-[rgb(var(--color-background))] text-[rgb(var(--color-textSecondary))] opacity-70`}
        >
          <Play className="ml-0.5 h-5 w-5" aria-hidden />
        </button>
      );
    }

    const isPlaying = playingAudio === episode.audioUrl;
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void handlePlayPause(episode);
        }}
        aria-label={isPlaying ? `Pausar ${label}` : `Tocar ${label}`}
        className={`${className} flex flex-shrink-0 items-center justify-center rounded-full transition-all ${
          isPlaying
            ? "bg-[rgba(var(--color-accent),0.68)] text-white"
            : "bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] hover:bg-[rgba(var(--color-accent),0.45)] hover:text-white"
        }`}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" aria-hidden />
        ) : (
          <Play className="ml-0.5 h-5 w-5" aria-hidden />
        )}
      </button>
    );
  };

  const renderEpisodeRow = (
    episode: Article,
    index: number,
    options: { compact?: boolean; showArtwork?: boolean } = {},
  ) => (
    <div
      key={getEpisodeKey(episode, index)}
      className="group flex items-center gap-4 border-b border-[rgb(var(--color-border))] p-4 transition-colors last:border-b-0 hover:bg-[rgba(var(--color-text),0.03)]"
      data-testid="pocketfeeds-episode-row"
    >
      {renderPlayButton(episode, "h-10 w-10", "episódio")}

      {options.showArtwork && (
        <EpisodeArtwork
          episode={episode}
          fallbackAlt={episode.sourceTitle}
          priority
        />
      )}

      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => setReadingArticle(episode)}
        aria-label={`Abrir episódio ${episode.title}`}
      >
        <span
          className={`block font-medium text-[rgb(var(--color-text))] transition-colors hover:text-white ${
            options.compact
              ? "line-clamp-1 text-sm"
              : "line-clamp-2 text-sm md:text-base"
          }`}
        >
          {episode.title}
        </span>
        <span className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs text-[rgb(var(--color-textSecondary))]">
          <span>{new Date(episode.pubDate).toLocaleDateString()}</span>
          {episode.audioDuration && (
            <>
              <span className="opacity-40">•</span>
              <span>{formatDuration(episode.audioDuration)}</span>
            </>
          )}
          <span className="opacity-40">•</span>
          <span className="min-w-0 truncate">{getEpisodeByline(episode)}</span>
        </span>
        {episode.description && (
          <span
            className={`mt-1 text-xs leading-relaxed text-[rgb(var(--color-textSecondary))] ${
              options.compact ? "line-clamp-1" : "line-clamp-2"
            }`}
          >
            {episode.description}
          </span>
        )}
      </button>

      <FavoriteButton
        article={episode}
        size="small"
        position="inline"
        className="text-[rgb(var(--color-textSecondary))] opacity-0 transition-opacity hover:text-white group-hover:opacity-100 group-focus-within:opacity-100"
      />
    </div>
  );

  const renderInlineEpisodes = (
    group: PodcastGroup,
    options: { compact?: boolean; showArtwork?: boolean } = {},
  ) => (
    <div
      className="border-t border-[rgb(var(--color-border))]"
      data-testid={`pocketfeeds-inline-episodes-${group.name}`}
    >
      {group.episodes
        .slice(0, MAX_INLINE_EPISODES)
        .map((episode, index) => renderEpisodeRow(episode, index, options))}

      {group.episodes.length > MAX_INLINE_EPISODES && (
        <div className="p-4 text-center text-sm text-[rgb(var(--color-textSecondary))]">
          +{group.episodes.length - MAX_INLINE_EPISODES} episódios adicionais
        </div>
      )}
    </div>
  );

  const renderPodcastCard = (
    group: PodcastGroup,
    options: { compact?: boolean } = {},
  ) => {
    const isExpanded =
      expandedPodcast === group.name || podcastGroups.length === 1;
    const artworkEpisode = getPodcastArtworkEpisode(group);
    const artworkClass = options.compact
      ? "h-16 w-16 sm:h-24 sm:w-24"
      : "h-24 w-24 md:h-28 md:w-28";

    return (
      <article
        key={group.name}
        className="overflow-hidden rounded-[var(--feed-card-radius)] border border-[rgb(var(--color-border))] transition-all duration-300 feed-surface"
        data-testid="pocketfeeds-podcast-card"
      >
        <button
          type="button"
          className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-[rgba(var(--color-text),0.02)]"
          onClick={() => podcastGroups.length > 1 && togglePodcast(group.name)}
          aria-expanded={isExpanded}
        >
          <PodcastArtwork
            episode={artworkEpisode}
            title={group.name}
            className={artworkClass}
          />

          <span className="min-w-0 flex-1">
            <span className="block truncate text-lg font-bold text-[rgb(var(--color-text))]">
              {group.name}
            </span>
            <span className="mt-1 block text-sm text-[rgb(var(--color-textSecondary))]">
              {group.episodes.length} {episodeLabel(group.episodes.length)}
            </span>
            {podcastGroups.length > 1 && (
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[rgb(var(--color-accent))]">
                {isExpanded ? "Recolher" : "Ver episódios"}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              </span>
            )}
          </span>
        </button>

        {isExpanded &&
          renderInlineEpisodes(group, { compact: true, showArtwork: true })}
      </article>
    );
  };

  const renderGridLayout = () => (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      style={{
        gridTemplateColumns:
          "repeat(auto-fit, minmax(min(100%, 10.5rem), 1fr))",
      }}
      data-testid="pocketfeeds-grid-layout"
    >
      {podcastGroups.map((group) => (
        <button
          type="button"
          key={group.name}
          className="group cursor-pointer text-left"
          onClick={() => setExpandedPodcast(group.name)}
          aria-label={`Ver episódios de ${group.name}`}
        >
          <div className="relative aspect-square overflow-hidden rounded-[var(--feed-card-radius)] bg-[rgba(var(--color-text),0.04)] shadow-md transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl">
            {getPodcastArtworkEpisode(group).imageUrl ? (
              <LazyImage
                src={getPodcastArtworkEpisode(group).imageUrl}
                className="h-full w-full object-cover"
                alt={group.name}
                priority
                aspectRatio="1/1"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[rgba(var(--color-accent),0.6)] to-[rgba(var(--color-primary),0.6)]">
                <Music2 className="h-12 w-12 text-white/80" aria-hidden />
              </div>
            )}

            {group.recentCount > 0 && (
              <div className="absolute right-2 top-2 rounded-full bg-[rgba(var(--color-accent),0.7)] px-2 py-0.5 text-xs font-bold text-white">
                {group.recentCount} novo{group.recentCount > 1 ? "s" : ""}
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                <Play className="ml-1 h-6 w-6 text-black" aria-hidden />
              </div>
            </div>
          </div>

          <h3 className="mt-3 line-clamp-2 text-sm font-medium text-[rgb(var(--color-text))] transition-colors group-hover:text-white">
            {group.name}
          </h3>
          <p className="mt-1 text-xs text-[rgb(var(--color-textSecondary))]">
            {group.episodes.length} ep.
          </p>
        </button>
      ))}
    </div>
  );

  const renderMixtapeLayout = () => (
    <div
      className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12"
      data-testid="pocketfeeds-mixtape-layout"
    >
      {podcastGroups.map((group, index) => {
        const isExpanded =
          expandedPodcast === group.name || podcastGroups.length === 1;
        const featured = index % 5 === 0;
        const panelClass = featured ? "lg:col-span-7" : "lg:col-span-5";
        const latestEpisode = group.firstEpisode;
        const artworkEpisode = getPodcastArtworkEpisode(group);
        const playEpisode = group.playableEpisode;

        return (
          <article
            key={group.name}
            className={`${panelClass} overflow-hidden rounded-[calc(var(--feed-card-radius)*1.25)] border border-[rgb(var(--color-border))] feed-surface`}
            data-testid="pocketfeeds-mixtape-card"
          >
            <div className="grid gap-0 md:grid-cols-[minmax(12rem,17rem)_1fr]">
              <button
                type="button"
                className="relative aspect-square min-h-0 overflow-hidden text-left md:m-5 md:self-start md:rounded-[var(--feed-card-radius)]"
                onClick={() => togglePodcast(group.name)}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? "Recolher" : "Expandir"} ${group.name}`}
              >
                {artworkEpisode.imageUrl ? (
                  <LazyImage
                    src={artworkEpisode.imageUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    alt={group.name}
                    priority
                    aspectRatio="1/1"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[rgba(var(--color-accent),0.58)] to-[rgba(var(--color-primary),0.42)]">
                    <Disc3 className="h-16 w-16 text-white/80" aria-hidden />
                  </div>
                )}
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(var(--color-background),0.05),rgba(var(--color-background),0.78))]" />
                <span className="absolute bottom-4 left-4 right-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/78">
                    Mixtape {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 block text-xl font-bold leading-tight text-white">
                    {group.name}
                  </span>
                </span>
              </button>

              <div className="flex min-w-0 flex-col p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--color-accent))]">
                      {group.episodes.length} {episodeLabel(group.episodes.length)}
                    </p>
                    <h2 className="mt-2 line-clamp-2 text-lg font-bold text-[rgb(var(--color-text))]">
                      {latestEpisode.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[rgb(var(--color-textSecondary))]">
                      {latestEpisode.description ||
                        `Último episódio de ${group.name}.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[rgb(var(--color-border))] text-[rgb(var(--color-textSecondary))] transition hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
                    onClick={() => togglePodcast(group.name)}
                    aria-label={`${isExpanded ? "Recolher" : "Expandir"} episódios de ${group.name}`}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2">
                  {renderPlayButton(
                    playEpisode,
                    "h-11 w-11",
                    playEpisode?.title || latestEpisode.title,
                  )}
                  <button
                    type="button"
                    className="rounded-full bg-[rgba(var(--color-text),0.08)] px-3 py-2 text-sm font-medium text-[rgb(var(--color-text))] transition-colors hover:bg-[rgba(var(--color-accent),0.28)]"
                    onClick={() => setReadingArticle(latestEpisode)}
                    aria-label={`Abrir detalhes de ${latestEpisode.title}`}
                  >
                    Abrir detalhes
                  </button>
                  <FavoriteButton
                    article={latestEpisode}
                    size="small"
                    position="inline"
                    className="text-[rgb(var(--color-textSecondary))] hover:text-white"
                  />
                </div>
              </div>
            </div>

            {isExpanded &&
              renderInlineEpisodes(group, {
                compact: false,
                showArtwork: true,
              })}
          </article>
        );
      })}
    </div>
  );

  const renderSelectedLayout = () => {
    if (viewMode === "grid") return renderGridLayout();
    if (viewMode === "mixtape") return renderMixtapeLayout();

    return (
      <div
        className={
          viewMode === "single"
            ? "grid grid-cols-1 items-start gap-5"
            : "grid grid-cols-1 items-start gap-5 md:grid-cols-2"
        }
        style={
          viewMode === "double"
            ? { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }
            : undefined
        }
        data-testid={`pocketfeeds-${viewMode}-layout`}
      >
        {podcastGroups.map((group) =>
          renderPodcastCard(group, { compact: viewMode === "double" }),
        )}
      </div>
    );
  };

  const modalGroup =
    viewMode === "grid" && expandedPodcast ? podcastMap[expandedPodcast] : null;
  const layoutFrameClass =
    viewMode === "single"
      ? "mx-auto w-full max-w-4xl"
      : viewMode === "double"
        ? "mx-auto w-full max-w-6xl"
        : "mx-auto w-full max-w-screen-2xl";

  return (
    <div
      ref={layoutMeasureRef}
      className="feed-top-clearance w-full bg-[rgba(var(--color-background),0.5)] px-4 pb-8 sm:px-6 md:px-8"
      data-testid="pocketfeeds-layout-measure"
    >
      <audio
        ref={audioRef}
        onLoadedMetadata={(event) =>
          setDuration(event.currentTarget.duration || 0)
        }
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime || 0)
        }
        onEnded={() => {
          setPlayingAudio(null);
          setPlaybackError(null);
        }}
        onError={() => {
          setPlayingAudio(null);
          setPlaybackError("Não foi possível carregar o áudio deste episódio.");
        }}
        className="hidden"
      />

      <header
        className={`${layoutFrameClass} mb-8 flex flex-col gap-4 border-b border-[rgb(var(--color-border))] pb-4 lg:flex-row lg:items-center lg:justify-between`}
        data-testid="pocketfeeds-layout-header"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Music2
            className="h-6 w-6 flex-shrink-0 text-[rgb(var(--color-accent))]"
            aria-hidden
          />
          <h1 className="text-xl font-bold text-[rgb(var(--color-text))]">
            Podcasts
          </h1>
          <span className="truncate text-sm text-[rgb(var(--color-textSecondary))]">
            {podcastGroups.length}{" "}
            {podcastGroups.length === 1 ? "podcast" : "podcasts"} •{" "}
            {articles.length} {episodeLabel(articles.length)}
          </span>
        </div>

        <div
          className={`inline-flex overflow-hidden rounded-full border border-[rgb(var(--color-border))] bg-[rgba(var(--color-text),0.04)] p-1 transition-all ${
            isLayoutPickerOpen ? "w-full sm:w-auto" : "w-auto"
          }`}
          onMouseLeave={() => setLayoutPickerOpen(false)}
        >
          {isLayoutPickerOpen ? (
            <div
              className="inline-flex w-full sm:w-auto"
              aria-label="Modo de visualização dos podcasts"
              role="group"
            >
              {availableViewModeOptions.map(
                ({ id, label, shortLabel, title, Icon }) => {
                  const isActive = viewMode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`flex min-h-9 flex-1 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition-colors sm:flex-none ${
                        isActive
                          ? "bg-[rgba(var(--color-accent),0.22)] text-[rgb(var(--color-text))]"
                          : "text-[rgb(var(--color-textSecondary))] hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
                      }`}
                      onClick={() => setStoredViewMode(id)}
                      aria-pressed={isActive}
                      title={title}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      <span className="hidden md:inline">{label}</span>
                      <span className="md:hidden">{shortLabel}</span>
                    </button>
                  );
                },
              )}
            </div>
          ) : (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--color-textSecondary))] transition-colors hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
              onClick={() => setLayoutPickerOpen(true)}
              aria-label={`Alterar modo de visualização dos podcasts. Atual: ${currentViewModeOption.label}`}
              title={`Layout: ${currentViewModeOption.label}`}
            >
              <CurrentViewModeIcon className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </header>

      <div className={layoutFrameClass}>
        {visibleTimelineEpisodes.length > 1 && viewMode !== "mixtape" && (
          <section className="mb-8 rounded-2xl border border-[rgb(var(--color-border))] p-4 feed-surface md:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--color-textSecondary))]">
                  Linha do tempo
                </p>
                <h2 className="text-lg font-bold text-[rgb(var(--color-text))]">
                  Episódios por data
                </h2>
              </div>
              <p className="text-sm text-[rgb(var(--color-textSecondary))]">
                {visibleTimelineEpisodes.length} de {articles.length}{" "}
                {episodeLabel(articles.length)}
              </p>
            </div>

            <div className="space-y-5">
              {Object.entries(timelineGroups).map(([dateLabel, episodes]) => (
                <div key={dateLabel} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--color-textSecondary))]">
                    {dateLabel}
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-[rgb(var(--color-border))]">
                    {episodes.map((episode, index) => {
                      const episodeKey = getEpisodeKey(episode, index);
                      const isExpanded = expandedEpisodeKey === episodeKey;

                      return (
                        <article
                          key={episodeKey}
                          data-testid="pocketfeeds-timeline-episode"
                          className="border-b border-[rgb(var(--color-border))] bg-[rgba(var(--color-text),0.025)] last:border-b-0"
                        >
                          <div className="flex items-center gap-3 p-3 md:p-4">
                            {renderPlayButton(
                              episode,
                              "h-10 w-10",
                              episode.title,
                            )}

                            <EpisodeArtwork
                              episode={episode}
                              fallbackAlt={episode.sourceTitle}
                              priority
                            />

                            <button
                              type="button"
                              className="min-w-0 flex-1 text-left"
                              aria-expanded={isExpanded}
                              onClick={() =>
                                setExpandedEpisodeKey(
                                  isExpanded ? null : episodeKey,
                                )
                              }
                            >
                              <span className="block truncate text-sm font-semibold text-[rgb(var(--color-text))] md:text-base">
                                {episode.title}
                              </span>
                              <span className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs text-[rgb(var(--color-textSecondary))]">
                                <span className="min-w-0 truncate">
                                  {getEpisodeByline(episode)}
                                </span>
                                {episode.audioDuration && (
                                  <>
                                    <span className="opacity-40">•</span>
                                    <span>
                                      {formatDuration(episode.audioDuration)}
                                    </span>
                                  </>
                                )}
                              </span>
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-[rgb(var(--color-border))] px-3 pb-4 pt-3 md:px-4">
                              {episode.description && (
                                <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-[rgb(var(--color-textSecondary))]">
                                  {episode.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setReadingArticle(episode)}
                                  className="rounded-full bg-[rgba(var(--color-text),0.08)] px-3 py-1.5 text-sm font-medium text-[rgb(var(--color-text))] transition-colors hover:bg-[rgba(var(--color-accent),0.28)]"
                                >
                                  Abrir detalhes
                                </button>
                                <FavoriteButton
                                  article={episode}
                                  size="small"
                                  position="inline"
                                  className="text-[rgb(var(--color-textSecondary))] hover:text-white"
                                />
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {articles.length > MAX_TIMELINE_EPISODES && (
              <p className="mt-4 text-sm text-[rgb(var(--color-textSecondary))]">
                Mostrando os {MAX_TIMELINE_EPISODES} episódios mais recentes
                para manter a lista leve.
              </p>
            )}
          </section>
        )}

        {renderSelectedLayout()}
      </div>

      {activeEpisode?.audioUrl && (
        <div className="sticky bottom-4 z-40 mx-auto mt-8 max-w-screen-2xl rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <button
              type="button"
              onClick={() => handlePlayPause(activeEpisode)}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(var(--color-accent),0.75)] text-white transition-colors hover:bg-[rgb(var(--color-accent))]"
              aria-label={
                playingAudio === activeEpisode.audioUrl
                  ? "Pausar episódio"
                  : "Tocar episódio"
              }
            >
              {playingAudio === activeEpisode.audioUrl ? (
                <Pause className="h-5 w-5" aria-hidden />
              ) : (
                <Play className="ml-0.5 h-5 w-5" aria-hidden />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[rgb(var(--color-text))]">
                    {activeEpisode.title}
                  </p>
                  <p className="truncate text-xs text-[rgb(var(--color-textSecondary))]">
                    {activeEpisode.sourceTitle}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs tabular-nums text-[rgb(var(--color-textSecondary))]">
                  {formatPlaybackTime(currentTime)} /{" "}
                  {formatPlaybackTime(
                    duration || Number(activeEpisode.audioDuration) || 0,
                  )}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={1}
                value={duration ? Math.min(currentTime, duration) : 0}
                onChange={(event) =>
                  handleSeek(Number(event.currentTarget.value))
                }
                className="w-full accent-[rgb(var(--color-accent))]"
                aria-label="Posição da reprodução"
              />
              {playbackError && (
                <p className="mt-2 text-xs text-red-300" role="status">
                  {playbackError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-[rgb(var(--color-textSecondary))] sm:flex sm:items-center">
              <label className="flex items-center gap-2">
                <span>Volume</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(event) =>
                    handleVolumeChange(Number(event.currentTarget.value))
                  }
                  className="w-24 accent-[rgb(var(--color-accent))]"
                  aria-label="Volume"
                />
              </label>
              <label className="flex items-center gap-2">
                <span>Velocidade</span>
                <select
                  value={playbackRate}
                  onChange={(event) =>
                    handlePlaybackRateChange(Number(event.currentTarget.value))
                  }
                  className="rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] px-2 py-1 text-[rgb(var(--color-text))]"
                  aria-label="Velocidade de reprodução"
                >
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}x
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      )}

      {modalGroup && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
          onClick={() => setExpandedPodcast(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-t-2xl bg-[rgb(var(--color-surface))] md:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Episódios de ${modalGroup.name}`}
          >
            <div className="flex items-center gap-4 border-b border-[rgb(var(--color-border))] p-5">
              <PodcastArtwork
                episode={modalGroup.firstEpisode}
                title={modalGroup.name}
                className="h-16 w-16"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold text-[rgb(var(--color-text))]">
                  {modalGroup.name}
                </h2>
                <p className="text-sm text-[rgb(var(--color-textSecondary))]">
                  {modalGroup.episodes.length}{" "}
                  {episodeLabel(modalGroup.episodes.length)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedPodcast(null)}
                className="rounded-full p-2 text-[rgb(var(--color-textSecondary))] transition-colors hover:bg-[rgba(var(--color-text),0.1)] hover:text-[rgb(var(--color-text))]"
                aria-label="Fechar episódios"
              >
                <X className="h-6 w-6" aria-hidden />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {modalGroup.episodes.map((episode, index) =>
                renderEpisodeRow(episode, index, {
                  compact: true,
                  showArtwork: true,
                }),
              )}
            </div>
          </div>
        </div>
      )}

      {readingArticle && (
        <ArticleReaderModal
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={() => {}}
          onPrev={() => {}}
          hasNext={false}
          hasPrev={false}
        />
      )}
    </div>
  );
};
