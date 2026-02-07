import React from 'react';
import type { Article } from '../types';

interface LCPHeroProps {
    article: Article;
}

export const LCPHero: React.FC<LCPHeroProps> = ({ article }) => {
    if (!article.imageUrl) return null;

    return (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8 mt-24 relative z-20 pointer-events-none">
            <article className="relative overflow-hidden rounded-xl shadow-2xl">
                <img
                    src={article.imageUrl}
                    alt={article.title}
                    width={1200}
                    height={675}
                    // Critical LCP attributes
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="w-full aspect-[16/9] object-cover bg-gray-900"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                    <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold leading-tight line-clamp-2 drop-shadow-lg">
                        {article.title}
                    </h1>
                </div>
            </article>
        </section>
    );
};
