/**
 * FeedContent.tsx
 *
 * Componente principal para exibição de artigos no Personal News Dashboard.
 * Gerencia a seleção e renderização dos layouts (Grid, Masonry, Minimal, Portal).
 *
 * @author Matheus Pereira
 * @version 3.0.0
 */

import React from "react";
import type { Article } from "../types";
import { withPerformanceTracking } from "../services/performanceUtils";
import { useAppearance } from "../hooks/useAppearance";
import { MasonryLayout } from "./layouts/MasonryLayout";
import { MinimalLayout } from "./layouts/MinimalLayout";
import { PortalLayout } from "./layouts/PortalLayout";
import { ImmersiveLayout } from "./layouts/ImmersiveLayout";
import { BrutalistLayout } from "./layouts/BrutalistLayout";
import { TimelineLayout } from "./layouts/TimelineLayout";
import { BentoLayout } from "./layouts/BentoLayout";
import { FeaturedArticle } from "./FeaturedArticle";
import { ArticleItem } from "./ArticleItem";
import { useArticleLayout } from "../hooks/useArticleLayout";

interface FeedContentProps {
  articles: Article[];
  timeFormat: "12h" | "24h";
}

const FeedContentComponent: React.FC<FeedContentProps> = ({
  articles,
  timeFormat,
}) => {
  const { contentConfig } = useAppearance();
  const { settings: layoutSettings } = useArticleLayout();

  if (articles.length === 0) {
    return null;
  }

  // Render different layouts based on configuration
  if (contentConfig.layoutMode === 'masonry') {
    return <MasonryLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (contentConfig.layoutMode === 'minimal') {
    return <MinimalLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (contentConfig.layoutMode === 'list') { // 'list' maps to Portal layout
    return <PortalLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (contentConfig.layoutMode === 'immersive') {
    return <ImmersiveLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (contentConfig.layoutMode === 'brutalist') {
    return <BrutalistLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (contentConfig.layoutMode === 'timeline') {
    return <TimelineLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (contentConfig.layoutMode === 'bento') {
    return <BentoLayout articles={articles} timeFormat={timeFormat} />;
  }

  // Default Grid Layout (Magazine)
  const featuredArticle = articles[0];
  const recentArticles = articles.slice(1, 7); // 6 recent articles
  const topStoriesArticles = articles.slice(7, 7 + layoutSettings.topStoriesCount);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Main Section: Featured + Recent Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Featured (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
           <div className="flex-1 min-h-[500px] h-full">
             <FeaturedArticle article={featuredArticle} timeFormat={timeFormat} />
           </div>
        </div>

        {/* Recent Grid (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[rgb(var(--color-accent))] uppercase tracking-wider">Últimas</h2>
                <span className="text-xs text-gray-500">{recentArticles.length} artigos</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {recentArticles.map((article, idx) => (
                    <div key={idx} className="bg-gray-800/30 rounded-lg p-3 border border-white/5 hover:bg-gray-800/50 transition-colors flex gap-3 h-24">
                        <div className="w-24 h-full rounded flex-shrink-0 overflow-hidden">
                            <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-[rgb(var(--color-accent))] uppercase truncate">{article.sourceTitle}</span>
                            <h3 className="text-sm font-medium text-gray-200 line-clamp-2 leading-tight hover:text-white cursor-pointer">
                                <a href={article.link} target="_blank" rel="noopener noreferrer">{article.title}</a>
                            </h3>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Top Stories Section */}
      {layoutSettings.topStoriesCount > 0 && (
        <section className="border-t border-white/10 pt-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-2 h-8 bg-[rgb(var(--color-accent))] mr-3 rounded-full"></span>
                Top Stories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {topStoriesArticles.map((article, idx) => (
                    <div key={idx} className="bg-gray-800/20 rounded-xl p-4 border border-white/5 hover:border-[rgb(var(--color-accent))]/30 transition-all hover:-translate-y-1 group">
                        <ArticleItem article={article} index={idx + 1} timeFormat={timeFormat} />
                    </div>
                ))}
            </div>
        </section>
      )}
    </div>
  );
};

export const FeedContent = withPerformanceTracking(
  FeedContentComponent,
  "FeedContent"
);
