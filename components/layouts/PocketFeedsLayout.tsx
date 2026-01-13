import React, { useState } from 'react';
import { Article } from '../../types';
import { LazyImage } from '../LazyImage';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { FavoriteButton } from '../FavoriteButton';

interface PocketFeedsLayoutProps {
  articles: Article[];
  timeFormat?: '12h' | '24h';
}

/* 8. PocketFeeds Layout - Podcast-focused with inline audio player */
export const PocketFeedsLayout: React.FC<PocketFeedsLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [expandedPodcast, setExpandedPodcast] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const { t } = useLanguage();

  // Group articles by sourceTitle (podcast name)
  const podcastGroups = React.useMemo(() => {
    const groups: Record<string, typeof articles> = {};
    articles.forEach(article => {
      const key = article.sourceTitle || 'Unknown Podcast';
      if (!groups[key]) groups[key] = [];
      groups[key].push(article);
    });
    return groups;
  }, [articles]);

  const podcastNames = Object.keys(podcastGroups);
  const hasFewPodcasts = podcastNames.length <= 4;

  // Format duration (e.g., "3600" -> "1:00:00" or "45:30" -> "45:30")
  const formatDuration = (duration?: string): string => {
    if (!duration) return '';
    // If already formatted (contains :), return as is
    if (duration.includes(':')) return duration;
    // If it's just seconds, convert
    const secs = parseInt(duration, 10);
    if (isNaN(secs)) return duration;
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${mins}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(() => {});
      }
      setPlayingAudio(audioUrl);
    }
  };

  const togglePodcast = (podcastName: string) => {
    setExpandedPodcast(expandedPodcast === podcastName ? null : podcastName);
  };

  return (
    <div className="min-h-screen bg-[rgba(var(--color-background),0.5)] p-6 md:p-8">
      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingAudio(null)}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-[rgb(var(--color-border))] pb-4">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <h1 className="text-xl font-bold text-[rgb(var(--color-text))]">PocketFeeds</h1>
          <span className="text-sm text-[rgb(var(--color-textSecondary))]">
            {podcastNames.length} {podcastNames.length === 1 ? 'podcast' : 'podcasts'} • {articles.length} {articles.length === 1 ? t('article.episode') || 'episódio' : t('article.episodes') || 'episódios'}
          </span>
        </div>
      </div>

      {hasFewPodcasts ? (
        /* Showcase mode for few podcasts */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {podcastNames.map(podcastName => {
            const episodes = podcastGroups[podcastName];
            const firstEp = episodes[0];
            const isExpanded = expandedPodcast === podcastName || podcastNames.length === 1;

            return (
              <div 
                key={podcastName} 
                className={`bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))] overflow-hidden transition-all duration-300 ${isExpanded || podcastNames.length === 1 ? 'lg:col-span-2' : ''}`}
              >
                {/* Podcast Header with large artwork */}
                <div 
                  className="flex items-start gap-4 p-5 cursor-pointer hover:bg-[rgba(var(--color-text),0.02)] transition-colors"
                  onClick={() => podcastNames.length > 1 && togglePodcast(podcastName)}
                >
                  {/* Artwork */}
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                    {firstEp.imageUrl ? (
                      <LazyImage src={firstEp.imageUrl} className="w-full h-full object-cover" alt={podcastName} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[rgb(var(--color-accent))] to-[rgb(var(--color-primary))] flex items-center justify-center">
                        <svg className="w-12 h-12 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Podcast info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg md:text-xl font-bold text-[rgb(var(--color-text))] mb-1 truncate">
                      {podcastName}
                    </h2>
                    <p className="text-sm text-[rgb(var(--color-textSecondary))] mb-3">
                      {episodes.length} {episodes.length === 1 ? 'episódio' : 'episódios'}
                    </p>
                    {podcastNames.length > 1 && (
                      <button className="text-xs font-medium text-[rgb(var(--color-accent))] flex items-center gap-1">
                        {isExpanded ? 'Recolher' : 'Ver episódios'}
                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Episodes list */}
                {(isExpanded || podcastNames.length === 1) && (
                  <div className="border-t border-[rgb(var(--color-border))]">
                    {episodes.slice(0, 10).map((episode, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-4 p-4 hover:bg-[rgba(var(--color-text),0.03)] transition-colors border-b border-[rgb(var(--color-border))] last:border-b-0"
                      >
                        {/* Play button */}
                        {episode.audioUrl ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePlayPause(episode.audioUrl!); }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              playingAudio === episode.audioUrl 
                                ? 'bg-[rgb(var(--color-accent))] text-white' 
                                : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-accent))] hover:text-white'
                            }`}
                          >
                            {playingAudio === episode.audioUrl ? (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            )}
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-background))] flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-[rgb(var(--color-textSecondary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}

                        {/* Episode info */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setReadingArticle(episode)}
                        >
                          <h3 className="font-medium text-[rgb(var(--color-text))] text-sm md:text-base line-clamp-1 hover:text-[rgb(var(--color-accent))] transition-colors">
                            {episode.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-textSecondary))] mt-1">
                            <span>{new Date(episode.pubDate).toLocaleDateString()}</span>
                            {episode.audioDuration && (
                              <>
                                <span className="opacity-40">•</span>
                                <span>{formatDuration(episode.audioDuration)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* More options */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <FavoriteButton 
                            article={episode} 
                            size="small" 
                            position="inline"
                            className="text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-accent))]"
                          />
                          <button
                            onClick={() => setReadingArticle(episode)}
                            className="p-2 text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-accent))] transition-colors"
                            title={t('action.preview')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {episodes.length > 10 && (
                      <div className="p-4 text-center text-sm text-[rgb(var(--color-textSecondary))]">
                        +{episodes.length - 10} {t('article.more_episodes') || 'mais episódios'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Library mode for many podcasts */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {podcastNames.map(podcastName => {
            const episodes = podcastGroups[podcastName];
            const firstEp = episodes[0];
            const newCount = episodes.filter(ep => {
              const dayAgo = new Date();
              dayAgo.setDate(dayAgo.getDate() - 7);
              return new Date(ep.pubDate) > dayAgo;
            }).length;

            return (
              <div 
                key={podcastName}
                className="group cursor-pointer"
                onClick={() => {
                  setExpandedPodcast(podcastName);
                }}
              >
                {/* Artwork */}
                <div className="aspect-square rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] relative">
                  {firstEp.imageUrl ? (
                    <LazyImage src={firstEp.imageUrl} className="w-full h-full object-cover" alt={podcastName} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[rgb(var(--color-accent))] to-[rgb(var(--color-primary))] flex items-center justify-center">
                      <svg className="w-12 h-12 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* New episodes badge */}
                  {newCount > 0 && (
                    <div className="absolute top-2 right-2 bg-[rgb(var(--color-accent))] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {newCount} novo{newCount > 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="mt-3 font-medium text-sm text-[rgb(var(--color-text))] line-clamp-2 group-hover:text-[rgb(var(--color-accent))] transition-colors">
                  {podcastName}
                </h3>
                <p className="text-xs text-[rgb(var(--color-textSecondary))] mt-1">
                  {episodes.length} ep.
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded podcast modal for library mode */}
      {expandedPodcast && !hasFewPodcasts && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
          onClick={() => setExpandedPodcast(null)}
        >
          <div 
            className="bg-[rgb(var(--color-surface))] w-full max-w-2xl max-h-[90vh] rounded-t-2xl md:rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center gap-4 p-5 border-b border-[rgb(var(--color-border))]">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                {podcastGroups[expandedPodcast][0].imageUrl ? (
                  <LazyImage src={podcastGroups[expandedPodcast][0].imageUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[rgb(var(--color-accent))] to-[rgb(var(--color-primary))] flex items-center justify-center">
                    <svg className="w-8 h-8 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-[rgb(var(--color-text))] truncate">{expandedPodcast}</h2>
                <p className="text-sm text-[rgb(var(--color-textSecondary))]">
                  {podcastGroups[expandedPodcast].length} episódios
                </p>
              </div>
              <button 
                onClick={() => setExpandedPodcast(null)}
                className="p-2 hover:bg-[rgba(var(--color-text),0.1)] rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-[rgb(var(--color-textSecondary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Episodes list */}
            <div className="overflow-y-auto max-h-[60vh]">
              {podcastGroups[expandedPodcast].map((episode, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-4 p-4 hover:bg-[rgba(var(--color-text),0.03)] transition-colors border-b border-[rgb(var(--color-border))] last:border-b-0"
                >
                  {episode.audioUrl ? (
                    <button
                      onClick={() => handlePlayPause(episode.audioUrl!)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        playingAudio === episode.audioUrl 
                          ? 'bg-[rgb(var(--color-accent))] text-white' 
                          : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-accent))] hover:text-white'
                      }`}
                    >
                      {playingAudio === episode.audioUrl ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-background))] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[rgb(var(--color-textSecondary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}

                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setReadingArticle(episode)}
                  >
                    <h3 className="font-medium text-[rgb(var(--color-text))] text-sm line-clamp-1 hover:text-[rgb(var(--color-accent))] transition-colors">
                      {episode.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-textSecondary))] mt-1">
                      <span>{new Date(episode.pubDate).toLocaleDateString()}</span>
                      {episode.audioDuration && (
                        <>
                          <span className="opacity-40">•</span>
                          <span>{formatDuration(episode.audioDuration)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Favorite Button */}
                  <FavoriteButton 
                    article={episode} 
                    size="small" 
                    position="inline"
                    className="text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-accent))]"
                  />
                </div>
              ))}
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
