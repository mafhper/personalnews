import { useTranslation } from 'react-i18next';

// Assets helpers
const baseUrl = import.meta.env.BASE_URL;
const appUrl = import.meta.env.MODE === 'production' ? `${baseUrl}app/` : 'http://localhost:5173/';

export default function Categories() {
  const { t } = useTranslation();

  return (
    <>
      <section className="section-feature section-feature--hero section-hero-aura pt-32 pb-20 relative overflow-hidden">
        <div className="aura-wrapper aura-wrapper--categories">
             <div className="aura-blob aura-blob--1 bg-emerald-400/20"></div>
             <div className="aura-blob aura-blob--2 bg-blue-500/20"></div>
             <div className="aura-blob aura-blob--3"></div>
             <div className="aura-overlay"></div>
        </div>
        <div className="hero-content relative z-10 container mx-auto px-4 text-center">
            <span className="hero-label inline-block px-3 py-1 mb-6 text-sm font-medium rounded-full bg-white/10 text-primary border border-white/10">
              {t('categories.hero_label')}
            </span>
            <h1 className="hero-title text-5xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
              {t('categories.hero_title')}
            </h1>
            <p className="hero-description text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
                {t('categories.hero_desc')}
            </p>
        </div>
      </section>

      <div className="section-divider h-px bg-white/5 w-full my-20"></div>

      {/* Categories Mockup - Left Image, Right Text */}
      <section className="section-feature container mx-auto px-4 max-w-6xl mb-32">
        <div className="feature-row grid md:grid-cols-2 gap-12 items-center">
             <div className="feature-media p-8 bg-surface rounded-2xl border border-white/5 shadow-2xl">
                 <div className="flex flex-col gap-3 w-[90%] mx-auto py-4">
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-xl border-l-4 border-l-emerald-500 border-y border-r border-white/5 cursor-grab active:cursor-grabbing hover:bg-emerald-500/15 transition-colors">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" /></svg>
                        <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                        <span className="text-white font-medium">Tecnologia</span>
                        <span className="ml-auto text-xs text-zinc-500">Magazine Grid</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] text-zinc-400">12</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-xl border-l-4 border-l-blue-500 border-y border-r border-white/5 cursor-grab">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" /></svg>
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span className="text-white font-medium">Ciência</span>
                        <span className="ml-auto text-xs text-zinc-500">Timeline</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] text-zinc-400">8</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-purple-500/10 rounded-xl border-l-4 border-l-purple-500 border-y border-r border-white/5 cursor-grab">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" /></svg>
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                        <span className="text-white font-medium">Podcasts</span>
                        <span className="ml-auto text-xs text-zinc-500">PocketFeeds</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] text-zinc-400">5</span>
                    </div>
                 </div>
             </div>
             <div className="feature-content">
                <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('categories.management_label')}</span>
                <h2 className="feature-title text-3xl md:text-4xl font-bold mb-6">{t('categories.management_title')}</h2>
                <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed">
                    {t('categories.management_desc')}
                </p>
                <ul className="feature-list space-y-4">
                    <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                        <span className="text-zinc-400">{t('categories.management_item1')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                        <span className="text-zinc-400">{t('categories.management_item2')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                        <span className="text-zinc-400">{t('categories.management_item3')}</span>
                    </li>
                </ul>
             </div>
        </div>
      </section>

      <div className="section-divider h-px bg-white/5 w-full my-20"></div>

      {/* Feed Validation - Right Image, Left Text (Zig-Zag) */}
      <section className="section-feature container mx-auto px-4 max-w-6xl mb-32">
         <div className="feature-row grid md:grid-cols-2 gap-12 items-center">
             <div className="feature-media p-8 bg-surface rounded-2xl border border-white/5 shadow-2xl order-1 md:order-2">
                 <div className="flex flex-col gap-2 w-[90%] mx-auto py-2">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm text-zinc-400 flex-1 font-mono">techcrunch.com/feed</span>
                        <span className="text-xs text-emerald-500 font-bold uppercase">{t('categories.feeds_valid')}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm text-zinc-400 flex-1 font-mono">arstechnica.com/feed</span>
                        <span className="text-xs text-emerald-500 font-bold uppercase">{t('categories.feeds_valid')}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-zinc-400 flex-1 font-mono">example.com/broken</span>
                        <span className="text-xs text-red-500 font-bold uppercase">{t('categories.feeds_error')}</span>
                         <svg className="w-4 h-4 text-zinc-500 hover:text-white cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg opacity-60">
                         <div className="w-3 h-3 bg-zinc-600 rounded-full animate-pulse"></div>
                        <span className="text-sm text-zinc-400 flex-1 font-mono">newsfeed.com/rss</span>
                        <span className="text-xs text-zinc-500 font-bold uppercase">{t('categories.feeds_pending')}</span>
                    </div>
                 </div>
             </div>
             
             <div className="feature-content order-2 md:order-1">
                 <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('categories.feeds_label')}</span>
                 <h2 className="feature-title text-3xl md:text-4xl font-bold mb-6">{t('categories.feeds_title')}</h2>
                 <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed">
                     {t('categories.feeds_desc')}
                 </p>
                 <ul className="feature-list space-y-4">
                     <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                         <span className="text-zinc-400">{t('categories.feeds_item1')}</span>
                     </li>
                     <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                         <span className="text-zinc-400">{t('categories.feeds_item2')}</span>
                     </li>
                     <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                         <span className="text-zinc-400">{t('categories.feeds_item3')}</span>
                     </li>
                 </ul>
             </div>
         </div>
      </section>

      <div className="section-divider h-px bg-white/5 w-full my-20"></div>

      {/* OPML Import - Left Image, Right Text */}
      <section className="section-feature container mx-auto px-4 max-w-6xl mb-32">
        <div className="feature-row grid md:grid-cols-2 gap-12 items-center">
             <div className="feature-media p-8 bg-surface rounded-2xl border border-white/5 shadow-2xl">
                 <div className="flex flex-col items-center gap-6 py-8">
                     <div className="flex gap-4">
                         <div className="flex flex-col items-center gap-2 p-6 bg-blue-500/10 border border-blue-500/30 border-dashed rounded-xl hover:bg-blue-500/20 transition-colors w-32 h-32 justify-center">
                             <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                             <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{t('categories.opml_import')}</span>
                         </div>
                         <div className="flex flex-col items-center gap-2 p-6 bg-emerald-500/10 border border-emerald-500/30 border-dashed rounded-xl hover:bg-emerald-500/20 transition-colors w-32 h-32 justify-center">
                            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{t('categories.opml_export')}</span>
                         </div>
                     </div>
                     <code className="text-[10px] text-zinc-500 font-mono bg-white/5 py-2 px-4 rounded-lg border border-white/5">
                         &lt;opml version="2.0"&gt;...&lt;/opml&gt;
                     </code>
                 </div>
             </div>
             <div className="feature-content">
                <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('categories.opml_label')}</span>
                <h2 className="feature-title text-3xl md:text-4xl font-bold mb-6">{t('categories.opml_title')}</h2>
                <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed">
                    {t('categories.opml_desc')}
                </p>
                <ul className="feature-list space-y-4">
                    <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                        <span className="text-zinc-400">{t('categories.opml_item1')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                        <span className="text-zinc-400">{t('categories.opml_item2')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                        <span className="text-zinc-400">{t('categories.opml_item3')}</span>
                    </li>
                </ul>
             </div>
        </div>
      </section>

      <div className="section-divider h-px bg-white/5 w-full my-20"></div>

      {/* Progressive Loading - Right Image, Left Text (Zig-Zag) */}
      <section className="section-feature container mx-auto px-4 max-w-6xl mb-32">
         <div className="feature-row grid md:grid-cols-2 gap-12 items-center">
             <div className="feature-media p-8 bg-surface rounded-2xl border border-white/5 shadow-2xl order-1 md:order-2">
                 <div className="flex flex-col gap-4 w-[85%] mx-auto py-4">
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="w-[75%] h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-xs font-bold text-indigo-400">75%</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 text-center font-mono uppercase tracking-widest">{t('categories.loading_batch', { current: 3, total: 4 })}</div>
                    
                    {/* Skeletons Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="aspect-[4/3] bg-indigo-500/20 rounded animate-pulse"></div>
                        <div className="aspect-[4/3] bg-indigo-500/20 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="aspect-[4/3] bg-indigo-500/20 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="aspect-[4/3] bg-white/5 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                        <div className="aspect-[4/3] bg-white/5 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        <div className="aspect-[4/3] bg-white/5 rounded animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                 </div>
             </div>
             
             <div className="feature-content order-2 md:order-1">
                 <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('categories.loading_label')}</span>
                 <h2 className="feature-title text-3xl md:text-4xl font-bold mb-6">{t('categories.loading_title')}</h2>
                 <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed">
                     {t('categories.loading_desc')}
                 </p>
                 <ul className="feature-list space-y-4">
                     <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                         <span className="text-zinc-400">{t('categories.loading_item1')}</span>
                     </li>
                     <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                         <span className="text-zinc-400">{t('categories.loading_item2')}</span>
                     </li>
                     <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                         <span className="text-zinc-400">{t('categories.loading_item3')}</span>
                     </li>
                 </ul>
             </div>
         </div>
      </section>

      <div className="section-divider h-px bg-white/5 w-full my-20"></div>

       {/* CTA */}
       <section className="section-feature pb-20 pt-10 text-center bg-surface/30">
          <div className="container mx-auto px-4">
              <h2 className="feature-title text-3xl md:text-4xl font-bold mb-6 max-w-2xl mx-auto">
                  {t('categories.cta_title')}
              </h2>
              <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed max-w-md mx-auto">
                  {t('categories.cta_desc')}
              </p>
              <a href={appUrl} className="btn-primary inline-flex items-center gap-2">
                  {t('categories.cta_button')}
              </a>
          </div>
      </section>
    </>
  );
}
