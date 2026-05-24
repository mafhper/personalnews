import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Columns2,
  Disc3,
  Grid3X3,
  List,
  Maximize2,
  Minimize2,
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
const DOUBLE_LAYOUT_PREVIEW_EPISODES = 3;
const DOUBLE_LAYOUT_MIN_WIDTH = 760;
const DOUBLE_LAYOUT_MIN_PODCASTS = 2;
const DOUBLE_LAYOUT_MAX_PODCASTS = 6;
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
  const layoutPickerRef = useRef<HTMLDivElement | null>(null);
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<Article | null>(null);
  const [expandedPodcast, setExpandedPodcast] = useState<string | null>(null);
  const [activeMixtapePodcast, setActiveMixtapePodcast] = useState<
    string | null
  >(null);
  const [hoveredMixtapePodcast, setHoveredMixtapePodcast] = useState<
    string | null
  >(null);
  const [hoveredMixtapeEpisode, setHoveredMixtapeEpisode] =
    useState<Article | null>(null);
  const [expandedEpisodeKey, setExpandedEpisodeKey] = useState<string | null>(
    null,
  );
  const [isLayoutPickerOpen, setLayoutPickerOpen] = useState(false);
  const [isPlayerMinimized, setPlayerMinimized] = useState(false);
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

  useEffect(() => {
    if (!isLayoutPickerOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        layoutPickerRef.current?.contains(target)
      ) {
        return;
      }
      setLayoutPickerOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLayoutPickerOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLayoutPickerOpen]);

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

  const canUseDoubleLayoutByWidth =
    layoutWidth === 0 || layoutWidth >= DOUBLE_LAYOUT_MIN_WIDTH;
  const canUseDoubleLayoutByPodcastCount =
    podcastGroups.length >= DOUBLE_LAYOUT_MIN_PODCASTS &&
    podcastGroups.length <= DOUBLE_LAYOUT_MAX_PODCASTS;
  const canUseDoubleLayout =
    canUseDoubleLayoutByWidth && canUseDoubleLayoutByPodcastCount;
  const doubleLayoutFallback: PocketFeedsViewMode = !canUseDoubleLayoutByWidth
    ? "single"
    : podcastGroups.length > DOUBLE_LAYOUT_MAX_PODCASTS
      ? "grid"
      : "single";
  const viewMode =
    selectedViewMode === "double" && !canUseDoubleLayout
      ? doubleLayoutFallback
      : selectedViewMode;
  const availableViewModeOptions = VIEW_MODE_OPTIONS.filter(
    (option) => option.id !== "double" || canUseDoubleLayout,
  );
  const currentViewModeOption =
    VIEW_MODE_OPTIONS.find((option) => option.id === viewMode) ||
    VIEW_MODE_OPTIONS[1];
  const CurrentViewModeIcon = currentViewModeOption.Icon;

  useEffect(() => {
    if (viewMode !== "mixtape") return;

    const firstPodcast = podcastGroups[0]?.name || null;
    if (!firstPodcast) {
      setActiveMixtapePodcast(null);
      setHoveredMixtapePodcast(null);
      setHoveredMixtapeEpisode(null);
      return;
    }

    if (!activeMixtapePodcast || !podcastMap[activeMixtapePodcast]) {
      setActiveMixtapePodcast(firstPodcast);
    }
  }, [activeMixtapePodcast, podcastGroups, podcastMap, viewMode]);

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

  const closePlayer = () => {
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.removeAttribute("src");
    }
    setPlayingAudio(null);
    setActiveEpisode(null);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackError(null);
    setPlayerMinimized(false);
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
    setPlayerMinimized(false);

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
    options: { compact?: boolean; spanWide?: boolean } = {},
  ) => {
    const isExpanded =
      expandedPodcast === group.name || podcastGroups.length === 1;
    const hasMorePreviewEpisodes =
      group.episodes.length > DOUBLE_LAYOUT_PREVIEW_EPISODES;
    const canToggleEpisodes =
      podcastGroups.length > 1 &&
      (!options.compact || hasMorePreviewEpisodes);
    const visibleDoubleEpisodes = group.episodes.slice(
      0,
      isExpanded ? MAX_INLINE_EPISODES : DOUBLE_LAYOUT_PREVIEW_EPISODES,
    );
    const artworkEpisode = getPodcastArtworkEpisode(group);
    const artworkClass = options.compact
      ? "h-16 w-16 sm:h-20 sm:w-20"
      : "h-24 w-24 md:h-28 md:w-28";

    return (
      <article
        key={group.name}
        className={`overflow-hidden rounded-[var(--feed-card-radius)] border border-[rgb(var(--color-border))] transition-all duration-300 feed-surface ${
          options.spanWide ? "md:col-span-2" : ""
        }`}
        data-testid="pocketfeeds-podcast-card"
      >
        <button
          type="button"
          className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-[rgba(var(--color-text),0.02)]"
          onClick={() => canToggleEpisodes && togglePodcast(group.name)}
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
            {options.compact && group.firstEpisode.title && (
              <span className="mt-3 block line-clamp-2 text-sm font-medium text-[rgb(var(--color-text))]">
                {group.firstEpisode.title}
              </span>
            )}
            {canToggleEpisodes && (
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[rgb(var(--color-accent))]">
                {options.compact
                  ? isExpanded
                    ? "Mostrar menos"
                    : "Mais episódios"
                  : isExpanded
                    ? "Recolher"
                    : "Ver episódios"}
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

        {options.compact ? (
          <div
            className="border-t border-[rgb(var(--color-border))]"
            data-testid={`pocketfeeds-double-episodes-${group.name}`}
          >
            {visibleDoubleEpisodes.map((episode, index) =>
              renderEpisodeRow(episode, index, {
                compact: true,
                showArtwork: true,
              }),
            )}

            {group.episodes.length > MAX_INLINE_EPISODES && isExpanded && (
              <div className="p-4 text-center text-sm text-[rgb(var(--color-textSecondary))]">
                +{group.episodes.length - MAX_INLINE_EPISODES} episódios
                adicionais
              </div>
            )}
          </div>
        ) : (
          isExpanded &&
          renderInlineEpisodes(group, { compact: true, showArtwork: true })
        )}
      </article>
    );
  };

  const renderGridLayout = () => (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns:
          podcastGroups.length === 1
            ? "minmax(min(100%, 18rem), 18rem)"
            : "repeat(auto-fit, minmax(min(100%, 10.5rem), 1fr))",
        justifyContent: podcastGroups.length === 1 ? "start" : "stretch",
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

  const renderMixtapeLayout = () => {
    const activeGroup =
      (activeMixtapePodcast && podcastMap[activeMixtapePodcast]) ||
      podcastGroups[0];
    if (!activeGroup) return null;

    const previewGroup =
      (hoveredMixtapePodcast && podcastMap[hoveredMixtapePodcast]) ||
      activeGroup;
    const activeIndex = Math.max(
      0,
      podcastGroups.findIndex((group) => group.name === activeGroup.name),
    );
    const activeArtworkEpisode = getPodcastArtworkEpisode(activeGroup);
    const previewArtworkEpisode =
      hoveredMixtapeEpisode || getPodcastArtworkEpisode(previewGroup);
    const latestEpisode = activeGroup.firstEpisode;
    const playEpisode = activeGroup.playableEpisode;
    const highlightedEpisodes = activeGroup.episodes.slice(0, 3);

    const setPreviewGroup = (groupName: string | null) => {
      setHoveredMixtapePodcast(groupName);
      setHoveredMixtapeEpisode(null);
    };

    return (
      <div className="space-y-4" data-testid="pocketfeeds-mixtape-layout">
        <nav
          className="custom-scrollbar flex gap-2 overflow-x-auto rounded-[var(--feed-card-radius)] border border-[rgb(var(--color-border))] bg-[rgba(var(--color-surface),0.52)] p-2"
          aria-label="Feeds da Mixtape"
          data-testid="pocketfeeds-mixtape-strip"
        >
          {podcastGroups.map((group, index) => {
            const isActive = group.name === activeGroup.name;
            const artworkEpisode = getPodcastArtworkEpisode(group);
            const trackNumber = String(index + 1).padStart(2, "0");

            return (
              <button
                type="button"
                key={group.name}
                className={`group flex min-w-[10rem] items-center gap-3 rounded-[calc(var(--feed-card-radius)*0.72)] border px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--color-accent),0.7)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--color-background))] sm:min-w-[12rem] ${
                  isActive
                    ? "border-[rgba(var(--color-accent),0.62)] bg-[rgba(var(--color-accent),0.14)] text-[rgb(var(--color-text))]"
                    : "border-transparent bg-[rgba(var(--color-text),0.03)] text-[rgb(var(--color-textSecondary))] hover:bg-[rgba(var(--color-text),0.06)] hover:text-[rgb(var(--color-text))]"
                }`}
                onClick={() => setActiveMixtapePodcast(group.name)}
                onMouseEnter={() => setPreviewGroup(group.name)}
                onMouseLeave={() => setPreviewGroup(null)}
                onFocus={() => setPreviewGroup(group.name)}
                onBlur={() => setPreviewGroup(null)}
                aria-pressed={isActive}
                data-testid="pocketfeeds-mixtape-track"
              >
                <span className="font-mono text-xs font-semibold text-[rgb(var(--color-accent))]">
                  {trackNumber}
                </span>
                <PodcastArtwork
                  episode={artworkEpisode}
                  title={group.name}
                  className="h-10 w-10"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {group.name}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs">
                    <span>{group.episodes.length} ep.</span>
                    {group.recentCount > 0 && (
                      <span className="rounded-full bg-[rgba(var(--color-accent),0.16)] px-1.5 py-0.5 font-bold text-[rgb(var(--color-text))]">
                        {group.recentCount} novo
                        {group.recentCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(20rem,0.64fr)]">
          <section
            className="relative overflow-hidden rounded-[calc(var(--feed-card-radius)*1.25)] border border-[rgb(var(--color-border))] bg-[rgba(var(--color-surface),0.58)]"
            data-testid="pocketfeeds-mixtape-stage"
            data-active-podcast={activeGroup.name}
            data-preview-podcast={previewGroup.name}
            data-preview-episode={previewArtworkEpisode.title}
            data-backdrop-episode={activeArtworkEpisode.title}
          >
            {activeArtworkEpisode.imageUrl ? (
              <LazyImage
                src={activeArtworkEpisode.imageUrl}
                className="absolute inset-0 h-full w-full scale-105 object-cover opacity-[0.18] blur-2xl"
                alt=""
                priority
                fill
              />
            ) : (
              <div className="absolute inset-0 bg-[rgba(var(--color-accent),0.1)]" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(var(--color-background),0.94),rgba(var(--color-background),0.84)_48%,rgba(var(--color-surface),0.66))]" />

            <div className="relative grid grid-cols-[minmax(6.5rem,9rem)_minmax(0,1fr)] gap-4 p-4 lg:grid-cols-[minmax(11rem,14rem)_minmax(0,1fr)]">
              <div className="space-y-3">
                <div className="relative aspect-square max-w-[9rem] overflow-hidden rounded-[calc(var(--feed-card-radius)*1.05)] border border-[rgb(var(--color-border))] bg-[rgba(var(--color-text),0.04)] shadow-xl lg:max-w-[14rem]">
                  {activeArtworkEpisode.imageUrl ? (
                    <LazyImage
                      src={activeArtworkEpisode.imageUrl}
                      className="h-full w-full object-cover"
                      alt={activeGroup.name}
                      priority
                      aspectRatio="1/1"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[rgba(var(--color-accent),0.16)]">
                      <Disc3
                        className="h-16 w-16 text-[rgb(var(--color-text))]"
                        aria-hidden
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {renderPlayButton(
                    playEpisode,
                    "h-11 w-11",
                    playEpisode?.title || latestEpisode.title,
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--color-accent))]">
                      No palco
                    </p>
                    <p className="truncate text-sm font-bold text-[rgb(var(--color-text))]">
                      {playEpisode?.audioUrl
                        ? "Tocar episódio recente"
                        : "Sem áudio disponível"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--color-accent))]">
                    Mixtape {String(activeIndex + 1).padStart(2, "0")} •{" "}
                    {activeGroup.episodes.length}{" "}
                    {episodeLabel(activeGroup.episodes.length)}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold leading-tight text-[rgb(var(--color-text))]">
                    {activeGroup.name}
                  </h2>
                  <div className="mt-3 border-l border-[rgba(var(--color-accent),0.42)] pl-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--color-textSecondary))]">
                      Mais recente
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-[rgb(var(--color-text))] sm:text-lg">
                      {latestEpisode.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-[rgb(var(--color-textSecondary))]">
                      {latestEpisode.description ||
                        `Último episódio de ${activeGroup.name}.`}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-[rgba(var(--color-accent),0.35)] bg-[rgba(var(--color-accent),0.14)] px-4 py-2 text-sm font-bold text-[rgb(var(--color-text))] transition-colors hover:bg-[rgba(var(--color-accent),0.22)]"
                      onClick={() => setReadingArticle(latestEpisode)}
                      aria-label={`Abrir detalhes de ${latestEpisode.title}`}
                    >
                      Abrir detalhes
                    </button>
                    <FavoriteButton
                      article={latestEpisode}
                      size="small"
                      position="inline"
                      className="text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))]"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--color-textSecondary))]">
                    Episódios em destaque
                  </p>
                  <div className="custom-scrollbar flex gap-2 overflow-x-auto sm:grid sm:grid-cols-3 sm:overflow-visible">
                    {highlightedEpisodes.map((episode, index) => (
                      <div
                        key={getEpisodeKey(episode, index)}
                        className="group flex min-w-[11rem] items-center gap-2 rounded-[calc(var(--feed-card-radius)*0.82)] border border-[rgb(var(--color-border))] bg-[rgba(var(--color-text),0.035)] p-2 transition-colors hover:bg-[rgba(var(--color-text),0.065)] sm:min-w-0"
                        onMouseEnter={() => setHoveredMixtapeEpisode(episode)}
                        onMouseLeave={() => setHoveredMixtapeEpisode(null)}
                        data-testid="pocketfeeds-mixtape-highlight"
                      >
                        {renderPlayButton(episode, "h-8 w-8", episode.title)}
                        <EpisodeArtwork
                          episode={episode}
                          fallbackAlt={activeGroup.name}
                          className="h-10 w-10"
                          priority
                        />
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setReadingArticle(episode)}
                          onFocus={() => setHoveredMixtapeEpisode(episode)}
                          onBlur={() => setHoveredMixtapeEpisode(null)}
                          aria-label={`Abrir episódio ${episode.title}`}
                        >
                          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--color-accent))]">
                            Recente {index + 1}
                          </span>
                          <span className="mt-0.5 block truncate text-xs font-bold text-[rgb(var(--color-text))]">
                            {episode.title}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside
            className="overflow-hidden rounded-[calc(var(--feed-card-radius)*1.05)] border border-[rgb(var(--color-border))] bg-[rgba(var(--color-surface),0.58)] xl:sticky xl:top-[calc(var(--feed-layout-top-clearance)+var(--space-6))]"
            data-testid="pocketfeeds-mixtape-episode-panel"
            data-active-podcast={activeGroup.name}
          >
            <div className="flex items-end justify-between gap-3 border-b border-[rgb(var(--color-border))] p-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--color-accent))]">
                  Episódios
                </p>
                <h3 className="mt-1 truncate text-lg font-bold text-[rgb(var(--color-text))]">
                  {activeGroup.name}
                </h3>
              </div>
              <span className="flex-shrink-0 text-xs font-semibold text-[rgb(var(--color-textSecondary))]">
                {activeGroup.episodes.length} faixas
              </span>
            </div>

            <div className="custom-scrollbar max-h-[min(32rem,calc(100vh-var(--space-20)))] overflow-y-auto">
              {activeGroup.episodes.map((episode, index) => (
                <div
                  key={getEpisodeKey(episode, index)}
                  className="group flex items-center gap-3 border-b border-[rgb(var(--color-border))] p-3 last:border-b-0 hover:bg-[rgba(var(--color-text),0.04)]"
                  onMouseEnter={() => setHoveredMixtapeEpisode(episode)}
                  onMouseLeave={() => setHoveredMixtapeEpisode(null)}
                  data-testid="pocketfeeds-mixtape-panel-episode"
                >
                  <span className="w-6 flex-shrink-0 text-right font-mono text-xs text-[rgb(var(--color-textSecondary))]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {renderPlayButton(episode, "h-9 w-9", episode.title)}
                  <EpisodeArtwork
                    episode={episode}
                    fallbackAlt={activeGroup.name}
                    className="h-10 w-10"
                  />
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setReadingArticle(episode)}
                    onFocus={() => setHoveredMixtapeEpisode(episode)}
                    onBlur={() => setHoveredMixtapeEpisode(null)}
                    aria-label={`Abrir episódio ${episode.title}`}
                  >
                    <span className="block truncate text-sm font-bold text-[rgb(var(--color-text))]">
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
                    </span>
                  </button>
                  <FavoriteButton
                    article={episode}
                    size="small"
                    position="inline"
                    className="text-[rgb(var(--color-textSecondary))] opacity-0 transition-opacity hover:text-[rgb(var(--color-text))] group-hover:opacity-100 group-focus-within:opacity-100"
                  />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    );
  };

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
        {podcastGroups.map((group, index) =>
          renderPodcastCard(group, {
            compact: viewMode === "double",
            spanWide:
              viewMode === "double" &&
              podcastGroups.length % 2 === 1 &&
              index === podcastGroups.length - 1,
          }),
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
        className={`${layoutFrameClass} mb-8 flex items-center justify-between gap-4 border-b border-[rgb(var(--color-border))] pb-4`}
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

        <div ref={layoutPickerRef} className="relative flex flex-shrink-0 justify-end">
          <button
            type="button"
            className={`flex h-12 w-12 items-center justify-center rounded-full border border-[rgb(var(--color-border))] transition-colors ${
              isLayoutPickerOpen
                ? "bg-[rgba(var(--color-accent),0.16)] text-[rgb(var(--color-text))]"
                : "bg-[rgba(var(--color-text),0.04)] text-[rgb(var(--color-textSecondary))] hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
            }`}
            onClick={() => setLayoutPickerOpen((current) => !current)}
            aria-expanded={isLayoutPickerOpen}
            aria-haspopup="true"
            aria-label={`Alterar modo de visualização dos podcasts. Atual: ${currentViewModeOption.label}`}
            title={`Layout: ${currentViewModeOption.label}`}
          >
            <CurrentViewModeIcon className="h-4 w-4" aria-hidden />
          </button>

          {isLayoutPickerOpen && (
            <div
              className="absolute right-0 top-14 z-20 inline-flex max-w-[calc(100vw-2rem)] rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]/95 p-1.5 shadow-xl backdrop-blur-xl"
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
                      className={`flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[rgba(var(--color-accent),0.22)] text-[rgb(var(--color-text))]"
                          : "text-[rgb(var(--color-textSecondary))] hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
                      }`}
                      onClick={() => {
                        setStoredViewMode(id);
                        setLayoutPickerOpen(false);
                      }}
                      aria-pressed={isActive}
                      title={title}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{shortLabel}</span>
                    </button>
                  );
                },
              )}
            </div>
          )}
        </div>
      </header>

      <div className={layoutFrameClass}>
        {visibleTimelineEpisodes.length > 1 && viewMode === "single" && (
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
        <div
          className={`sticky bottom-4 z-40 mx-auto mt-8 border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]/95 shadow-2xl backdrop-blur-xl ${
            isPlayerMinimized
              ? "max-w-3xl rounded-full p-2"
              : "max-w-screen-2xl rounded-2xl p-4"
          }`}
          data-testid={
            isPlayerMinimized
              ? "pocketfeeds-player-minimized"
              : "pocketfeeds-player-expanded"
          }
        >
          {isPlayerMinimized ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handlePlayPause(activeEpisode)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(var(--color-accent),0.75)] text-white transition-colors hover:bg-[rgb(var(--color-accent))]"
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
                <p className="truncate text-sm font-bold text-[rgb(var(--color-text))]">
                  {activeEpisode.title}
                </p>
                <p className="truncate text-xs text-[rgb(var(--color-textSecondary))]">
                  {activeEpisode.sourceTitle} •{" "}
                  {formatPlaybackTime(currentTime)}
                </p>
              </div>

              <div className="flex flex-shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPlayerMinimized(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--color-textSecondary))] transition-colors hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
                  aria-label="Expandir player"
                  title="Expandir player"
                >
                  <Maximize2 className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={closePlayer}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--color-textSecondary))] transition-colors hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
                  aria-label="Fechar player e parar reprodução"
                  title="Fechar player e parar reprodução"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ) : (
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

              <div className="flex flex-shrink-0 items-center gap-1 self-end lg:self-auto">
                <button
                  type="button"
                  onClick={() => setPlayerMinimized(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--color-textSecondary))] transition-colors hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
                  aria-label="Minimizar player"
                  title="Minimizar player"
                >
                  <Minimize2 className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={closePlayer}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--color-textSecondary))] transition-colors hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
                  aria-label="Fechar player e parar reprodução"
                  title="Fechar player e parar reprodução"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          )}
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
