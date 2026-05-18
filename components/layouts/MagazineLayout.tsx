import React, { useState } from "react";
import { Article } from "../../types";
import { ArticleReaderModal } from "../ArticleReaderModal";
import { useAppearance } from "../../hooks/useAppearance";
import { useLanguage } from "../../hooks/useLanguage";
import { ArticleImage } from "../ArticleImage";
import { FavoriteButton } from "../FavoriteButton";
import { FeedInteractiveActions } from "../FeedInteractiveActions";
import { FeedResponsiveDate } from "../FeedResponsiveDate";
import { getVideoEmbed } from "../../utils/videoEmbed";
import { sanitizeArticleDescription } from "../../utils/sanitization";

interface MagazineLayoutProps {
  articles: Article[];
  timeFormat: "12h" | "24h";
}

const Bone: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`feed-skeleton-block rounded-xl ${className}`} />
);

export const MagazineSkeleton: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-[1040px] 2xl:max-w-[1120px] px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-12">
      {/* HERO SKELETON */}
      <div className="grid xl:grid-cols-12 gap-0 feed-skeleton-block rounded-2xl overflow-hidden h-[360px] sm:h-[400px] xl:h-[480px]">
        <div className="xl:col-span-7 feed-skeleton-block h-full" />
        <div className="xl:col-span-5 p-8 md:p-10 flex flex-col justify-center space-y-6">
          <Bone className="h-4 w-32" />
          <Bone className="h-10 w-full" />
          <Bone className="h-20 w-full" />
        </div>
      </div>

      {/* FEATURED SKELETON */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-4">
            <Bone className="aspect-video" />
            <Bone className="h-4 w-1/2" />
            <Bone className="h-6 w-full" />
          </div>
        ))}
      </div>

      {/* GRID SKELETON */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <div key={i} className="flex gap-4 items-center">
            <Bone className="w-24 h-24 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-3 w-1/2" />
              <Bone className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MagazineLayout: React.FC<MagazineLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  useAppearance();
  const { t } = useLanguage();

  const visibleArticles = articles;

  const handleOpenReader = (article: Article) => {
    setReadingArticle(article);
  };

  const handleNextArticle = () => {
    if (!readingArticle) return;
    const currentIndex = articles.findIndex(
      (a) => a.link === readingArticle.link,
    );
    if (currentIndex < articles.length - 1) {
      setReadingArticle(articles[currentIndex + 1]);
    }
  };

  const handlePrevArticle = () => {
    if (!readingArticle) return;
    const currentIndex = articles.findIndex(
      (a) => a.link === readingArticle.link,
    );
    if (currentIndex > 0) {
      setReadingArticle(articles[currentIndex - 1]);
    }
  };

  // Layout Slices - Magazine style with clear sections
  const heroArticle = visibleArticles[0];
  const heroAuthor =
    heroArticle?.author && heroArticle.author !== heroArticle.sourceTitle
      ? heroArticle.author
      : undefined;
  const featuredArticles = visibleArticles.slice(1, 7); // 6 featured below hero
  const gridArticles = visibleArticles.slice(7, 19); // 12 in grid

  if (!heroArticle)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-[rgb(var(--color-textSecondary))] text-lg">
          {t("feeds.empty") || "Nenhuma notícia para exibir."}
        </p>
      </div>
    );

  return (
    <div className="feed-page-frame min-h-screen py-12 pb-16 text-left animate-in fade-in duration-300">
      {/* Hero Section - Full Width */}
      <section className="mb-12">
        <article
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[rgb(var(--color-surface))]/90 text-left shadow-[0_30px_90px_-60px_rgba(0,0,0,0.8)]"
          onClick={() => handleOpenReader(heroArticle)}
        >
          <div className="grid xl:grid-cols-12 gap-0 items-stretch">
            {/* Hero Image */}
            <div className="relative h-[clamp(240px,34vw,420px)] xl:h-auto xl:col-span-7 xl:min-h-[380px] xl:max-h-[430px] overflow-hidden flex-1 self-stretch">
              <ArticleImage
                article={heroArticle}
                width={1200}
                height={800}
                fill={true}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent md:hidden" />
            </div>

            {/* Hero Content */}
            <div className="flex flex-col justify-between gap-8 border-t border-[rgb(var(--color-border))]/35 bg-gradient-to-br from-[rgb(var(--theme-surface-elevated))] to-[rgb(var(--color-background))] p-6 text-left md:p-10 xl:col-span-5 xl:border-l xl:border-t-0">
              <div className="feed-card-top-rail relative">
                <div className="feed-card-meta-stack">
                  <span className="feed-chip feed-chip-fit inline-flex w-fit max-w-full items-center px-3 py-1 shadow-sm shadow-black/15">
                    {heroArticle.sourceTitle}
                  </span>
                  <FeedResponsiveDate
                    date={heroArticle.pubDate}
                    className="text-sm font-bold text-[rgb(var(--theme-text-secondary-on-surface))]"
                  />
                </div>
                <div className="feed-card-action-rail absolute right-0 top-0">
                  {(() => {
                    const embedUrl = getVideoEmbed(heroArticle.link);
                    return (
                      <FeedInteractiveActions
                        articleLink={heroArticle.link}
                        onRead={() => handleOpenReader(heroArticle)}
                        showRead={!embedUrl}
                        showWatch={!!embedUrl}
                        showVisit={true}
                        compact
                        className="!mt-0"
                      />
                    );
                  })()}
                  <FavoriteButton
                    article={heroArticle}
                    size="small"
                    position="inline"
                    className="bg-[rgb(var(--color-surfaceElevated))]/80"
                  />
                </div>
              </div>

                <div className="feed-card-bottom-copy text-left">
                  <h1 className="feed-card-title-clamp font-serif text-2xl md:text-4xl font-bold text-[rgb(var(--theme-text-on-surface))] leading-tight mb-4 transition-colors">
                  {heroArticle.title}
                </h1>

                <p className="feed-desc feed-card-desc-clamp text-base md:text-lg leading-relaxed max-w-[48ch]">
                  {sanitizeArticleDescription(heroArticle.description, 420)}
                </p>

                {heroAuthor && (
                  <p className="mt-5 text-sm text-[rgb(var(--color-textSecondary))] italic">
                    {t("article.by") || "Por"} {heroAuthor}
                  </p>
                )}
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* Featured Section - 6 Cards */}
      {featuredArticles.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgb(var(--color-border))] to-transparent" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-[rgb(var(--color-textSecondary))]">
              Destaques
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgb(var(--color-border))] to-transparent" />
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {featuredArticles.map((article, i) => (
              <article
                key={i}
                className="feed-surface group cursor-pointer rounded-2xl p-5 text-left shadow-sm transition-all duration-300"
                onClick={() => handleOpenReader(article)}
              >
                <div className="feed-card-top-rail relative mb-3">
                  <div className="feed-card-meta-stack">
                    <span className="feed-chip feed-chip-fit w-fit max-w-full text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded shadow-sm shadow-black/15">
                      {article.sourceTitle}
                    </span>
                    <FeedResponsiveDate
                      date={article.pubDate}
                      className="text-[10px] font-bold text-[rgb(var(--theme-text-secondary-on-surface))] transition-colors"
                    />
                  </div>
                  <div className="feed-card-action-rail absolute right-0 top-0">
                    {(() => {
                      const embedUrl = getVideoEmbed(article.link);
                      return (
                        <FeedInteractiveActions
                          articleLink={article.link}
                          onRead={() => handleOpenReader(article)}
                          showRead={!embedUrl}
                          showWatch={!!embedUrl}
                          showVisit={true}
                          compact
                          className="!mt-0"
                        />
                      );
                    })()}
                    <FavoriteButton
                      article={article}
                      size="small"
                      position="inline"
                      className="bg-[rgb(var(--color-surfaceElevated))]/80"
                    />
                  </div>
                </div>

                <div className="relative aspect-[4/3] overflow-hidden rounded-xl mb-5 bg-[rgb(var(--color-background))]">
                  <ArticleImage
                    article={article}
                    width={600}
                    height={400}
                    fill={true}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
                </div>

                <div className="feed-card-bottom-copy !mt-0 text-left">
                  <h3 className="feed-card-title-clamp font-serif font-bold text-lg lg:text-xl text-[rgb(var(--theme-text-on-surface))] leading-tight group-hover:underline transition-all">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p
                      className="feed-desc feed-card-desc-clamp mt-3 text-sm leading-relaxed"
                      style={{ "--feed-desc-lines": 3 } as React.CSSProperties}
                    >
                      {sanitizeArticleDescription(article.description, 320)}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Grid Section - 12 Cards */}
      {gridArticles.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[rgb(var(--color-textSecondary))]">
              Radar editorial
            </h2>
            <div className="h-px flex-1 bg-[rgb(var(--color-border))]" />
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            {gridArticles.map((article, i) => (
              <article
                key={i}
                className="group grid cursor-pointer grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-3 rounded-xl border border-[rgb(var(--color-border))]/22 bg-[rgb(var(--theme-surface-readable))]/54 p-3 text-left transition-all hover:bg-[rgb(var(--theme-surface-elevated))]/84 sm:grid-cols-[7rem_minmax(0,1fr)]"
                onClick={() => handleOpenReader(article)}
              >
                <div className="relative h-24 overflow-hidden rounded-lg bg-[rgb(var(--color-background))] sm:h-28">
                  <ArticleImage
                    article={article}
                    width={260}
                    height={260}
                    fill={true}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <div className="flex min-w-0 flex-col items-start gap-1.5 self-stretch py-0.5">
                  <div className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-left">
                    <span className="feed-chip feed-chip-fit inline-flex w-fit max-w-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em]">
                      {article.sourceTitle}
                    </span>
                    <FeedResponsiveDate
                      date={article.pubDate}
                      className="feed-meta shrink-0 text-[10px] leading-none text-[rgb(var(--color-textSecondary))]"
                    />
                  </div>
                  <h3
                    className="feed-card-title-clamp w-full font-semibold text-sm leading-snug text-[rgb(var(--theme-text-on-surface))] transition-colors sm:text-base"
                    style={{ "--feed-title-lines": 3 } as React.CSSProperties}
                  >
                    {article.title}
                  </h3>
                  {article.description && (
                    <p
                      className="feed-desc feed-card-desc-clamp w-full text-xs leading-relaxed"
                      style={{ "--feed-desc-lines": 2 } as React.CSSProperties}
                    >
                      {sanitizeArticleDescription(article.description, 260)}
                    </p>
                  )}
                  <div className="mt-auto flex w-full justify-end pt-1">
                    <div className="feed-card-action-rail max-w-full justify-end">
                      {(() => {
                        const embedUrl = getVideoEmbed(article.link);
                        return (
                          <FeedInteractiveActions
                            articleLink={article.link}
                            onRead={() => handleOpenReader(article)}
                            showRead={!embedUrl}
                            showWatch={!!embedUrl}
                            showVisit={true}
                            compact
                            className="!mt-0"
                          />
                        );
                      })()}
                      <FavoriteButton
                        article={article}
                        size="small"
                        position="inline"
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Reader Modal */}
      {readingArticle && (
        <ArticleReaderModal
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={handleNextArticle}
          onPrev={handlePrevArticle}
          hasNext={
            articles.findIndex((a) => a.link === readingArticle.link) <
            articles.length - 1
          }
          hasPrev={
            articles.findIndex((a) => a.link === readingArticle.link) > 0
          }
        />
      )}
    </div>
  );
};
