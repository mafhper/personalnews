import React, { useEffect, useMemo, useState } from "react";
import type { Article } from "../../types";
import { ArticleReaderModal } from "../ArticleReaderModal";
import { useLanguage } from "../../hooks/useLanguage";
import { FavoriteButton } from "../FavoriteButton";
import { FeedInteractiveActions } from "../FeedInteractiveActions";
import { FeedResponsiveDate } from "../FeedResponsiveDate";
import { getVideoEmbed } from "../../utils/videoEmbed";
import { sanitizeArticleDescription } from "../../utils/sanitization";

interface NewspaperLayoutProps {
  articles: Article[];
  timeFormat: "12h" | "24h";
  editionLabel?: string;
  editionColor?: string;
}

interface LeadResolution {
  key: string;
  article: Article | null;
  hasValidatedImage: boolean;
  isResolving: boolean;
}

const MAX_LEAD_IMAGE_CANDIDATES = 6;

const Bone: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`feed-skeleton-block ${className}`} />
);

const getResolutionKey = (articles: Article[]) =>
  articles
    .map((article) => `${article.link}|${article.imageUrl || ""}`)
    .join("||");

const initialResolution = (
  articles: Article[],
  key: string,
): LeadResolution => {
  const hasCandidate = articles.some((article) => Boolean(article.imageUrl));
  return {
    key,
    article: hasCandidate ? null : articles[0] || null,
    hasValidatedImage: false,
    isResolving: hasCandidate,
  };
};

const canLoadOriginalImage = (src: string) =>
  new Promise<boolean>((resolve) => {
    if (typeof Image === "undefined") {
      resolve(false);
      return;
    }

    const probe = new Image();
    probe.onload = () => resolve(true);
    probe.onerror = () => resolve(false);
    probe.src = src;
  });

const useResolvedLeadArticle = (articles: Article[]) => {
  const resolutionKey = useMemo(() => getResolutionKey(articles), [articles]);
  const [resolution, setResolution] = useState<LeadResolution>(() =>
    initialResolution(articles, resolutionKey),
  );
  const visibleResolution =
    resolution.key === resolutionKey
      ? resolution
      : initialResolution(articles, resolutionKey);

  useEffect(() => {
    let cancelled = false;
    const candidates = articles
      .filter((article) => Boolean(article.imageUrl))
      .slice(0, MAX_LEAD_IMAGE_CANDIDATES);
    const fallbackArticle = articles[0] || null;

    if (candidates.length === 0) {
      setResolution({
        key: resolutionKey,
        article: fallbackArticle,
        hasValidatedImage: false,
        isResolving: false,
      });
      return () => {
        cancelled = true;
      };
    }

    setResolution({
      key: resolutionKey,
      article: null,
      hasValidatedImage: false,
      isResolving: true,
    });

    const resolveLead = async () => {
      for (const candidate of candidates) {
        if (await canLoadOriginalImage(candidate.imageUrl!)) {
          if (!cancelled) {
            setResolution({
              key: resolutionKey,
              article: candidate,
              hasValidatedImage: true,
              isResolving: false,
            });
          }
          return;
        }
      }

      if (!cancelled) {
        setResolution({
          key: resolutionKey,
          article: fallbackArticle,
          hasValidatedImage: false,
          isResolving: false,
        });
      }
    };

    void resolveLead();
    return () => {
      cancelled = true;
    };
  }, [articles, resolutionKey]);

  return visibleResolution;
};

const ActionRail: React.FC<{
  article: Article;
  onRead: () => void;
}> = ({ article, onRead }) => {
  const embedUrl = getVideoEmbed(article.link);

  return (
    <div className="feed-card-action-rail newspaper-action-rail">
      <FeedInteractiveActions
        articleLink={article.link}
        onRead={onRead}
        showRead={!embedUrl}
        showWatch={Boolean(embedUrl)}
        showVisit
        compact
        className="!mt-0"
      />
    </div>
  );
};

const ValidatedStoryMedia: React.FC<{ article: Article }> = ({ article }) => {
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCanRender(false);

    if (!article.imageUrl) {
      return () => {
        cancelled = true;
      };
    }

    void canLoadOriginalImage(article.imageUrl).then((loaded) => {
      if (!cancelled) {
        setCanRender(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [article.imageUrl]);

  if (!article.imageUrl || !canRender) {
    return null;
  }

  return (
    <div className="newspaper-story__media">
      <img
        src={article.imageUrl}
        alt={article.title}
        loading="lazy"
        onError={() => setCanRender(false)}
        className="absolute inset-0 h-full w-full object-cover object-center"
        width={720}
        height={480}
      />
    </div>
  );
};

export const NewspaperSkeleton: React.FC = () => (
  <div className="newspaper-page">
    <div className="newspaper-sheet">
      <div className="newspaper-edition-line">
        <Bone className="h-4 w-28" />
        <Bone className="h-4 w-24" />
      </div>
      <section className="newspaper-lead-skeleton">
        <Bone className="newspaper-lead-skeleton__media" />
        <div className="space-y-4">
          <Bone className="h-4 w-28" />
          <Bone className="h-14 w-full" />
          <Bone className="h-24 w-full" />
        </div>
      </section>
    </div>
  </div>
);

export const NewspaperLayout: React.FC<NewspaperLayoutProps> = ({
  articles,
  editionLabel,
  editionColor,
}) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [failedLeadMediaLink, setFailedLeadMediaLink] = useState<string | null>(
    null,
  );
  const { t } = useLanguage();
  const resolution = useResolvedLeadArticle(articles);
  const main = resolution.article;
  const showLeadMedia =
    resolution.hasValidatedImage && failedLeadMediaLink !== main?.link;
  const remaining = main
    ? articles.filter((article) => article.link !== main.link)
    : [];
  const latest = remaining.slice(0, 4);
  const storyFlow = remaining.slice(4);
  const mainExcerpt = main
    ? sanitizeArticleDescription(
        [main.description, main.content].filter(Boolean).join(" "),
        220,
      )
    : "";
  const currentDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="newspaper-page min-h-screen">
      <div className="newspaper-sheet">
        <header className="newspaper-edition-line">
          <div className="newspaper-edition-line__label">
            <span
              className="newspaper-edition-line__marker"
              style={{
                backgroundColor:
                  editionColor || "rgb(var(--color-accent))",
              }}
              aria-hidden="true"
            />
            <span>{editionLabel || "Edição geral"}</span>
          </div>
          <time dateTime={new Date().toISOString()}>{currentDate}</time>
        </header>

        {resolution.isResolving ? (
          <section
            className="newspaper-lead-skeleton"
            data-testid="newspaper-lead-skeleton"
            aria-label="Carregando manchete"
          >
            <Bone className="newspaper-lead-skeleton__media" />
            <div className="space-y-4">
              <Bone className="h-4 w-28" />
              <Bone className="h-14 w-full" />
              <Bone className="h-24 w-full" />
            </div>
          </section>
        ) : main ? (
          <>
            <section className="newspaper-desk">
              <article
                className={`newspaper-lead group ${
                  showLeadMedia
                    ? ""
                    : "newspaper-lead--text-only"
                }`}
                data-testid="newspaper-lead"
                onClick={() => setReadingArticle(main)}
              >
                {showLeadMedia && main.imageUrl && (
                  <div className="newspaper-lead__media">
                    <img
                      src={main.imageUrl}
                      alt={main.title}
                      loading="eager"
                      fetchPriority="high"
                      onError={() => setFailedLeadMediaLink(main.link)}
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      width={1600}
                      height={900}
                    />
                  </div>
                )}

                <div className="newspaper-lead__copy feed-card-bottom-copy">
                  <div className="newspaper-story-meta">
                    <span className="newspaper-source">{main.sourceTitle}</span>
                    <FeedResponsiveDate date={main.pubDate} />
                  </div>
                  <h1 className="newspaper-lead__title feed-card-title-clamp">
                    <button
                      type="button"
                      className="newspaper-story-link"
                      onClick={(event) => {
                        event.stopPropagation();
                        setReadingArticle(main);
                      }}
                    >
                      {main.title}
                    </button>
                  </h1>
                  <p className="newspaper-lead__excerpt">
                    {mainExcerpt || main.title}
                  </p>
                  <div className="newspaper-story-actions">
                    <ActionRail
                      article={main}
                      onRead={() => setReadingArticle(main)}
                    />
                    <FavoriteButton
                      article={main}
                      size="small"
                      position="inline"
                    />
                  </div>
                </div>
              </article>

              {latest.length > 0 && (
                <aside
                  className="newspaper-latest"
                  data-testid="newspaper-latest"
                  aria-label="Agora"
                >
                  <h2 className="newspaper-latest__heading">Agora</h2>
                  {latest.map((article) => (
                    <article
                      key={article.link}
                      className="newspaper-latest__story"
                      onClick={() => setReadingArticle(article)}
                    >
                      <div className="newspaper-story-meta">
                        <span className="newspaper-source">
                          {article.sourceTitle}
                        </span>
                        <FeedResponsiveDate date={article.pubDate} />
                      </div>
                      <h3 className="feed-card-title-clamp">
                        <button
                          type="button"
                          className="newspaper-story-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            setReadingArticle(article);
                          }}
                        >
                          {article.title}
                        </button>
                      </h3>
                    </article>
                  ))}
                </aside>
              )}
            </section>

            {storyFlow.length > 0 && (
              <section
                className="newspaper-story-flow"
                data-testid="newspaper-story-flow"
                aria-label="Mais noticias"
              >
                {storyFlow.map((article) => (
                  <article
                    key={article.link}
                    className="newspaper-story group"
                    onClick={() => setReadingArticle(article)}
                  >
                    <ValidatedStoryMedia article={article} />
                    <div className="newspaper-story__copy feed-card-bottom-copy">
                      <div className="newspaper-story-meta">
                        <span className="newspaper-source">
                          {article.sourceTitle}
                        </span>
                        <FeedResponsiveDate date={article.pubDate} />
                      </div>
                      <h2 className="feed-card-title-clamp">
                        <button
                          type="button"
                          className="newspaper-story-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            setReadingArticle(article);
                          }}
                        >
                          {article.title}
                        </button>
                      </h2>
                      {article.description && (
                        <p className="newspaper-story__excerpt">
                          {sanitizeArticleDescription(article.description, 260)}
                        </p>
                      )}
                      <div className="newspaper-story-actions">
                        <ActionRail
                          article={article}
                          onRead={() => setReadingArticle(article)}
                        />
                        <FavoriteButton
                          article={article}
                          size="small"
                          position="inline"
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        ) : null}

        <footer className="newspaper-footer">
          <p>{t("article.end") || "Fim da edição"}</p>
        </footer>
      </div>

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
