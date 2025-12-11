import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GitCommit, ExternalLink } from 'lucide-react';
import { WindowMockup } from '../components/WindowMockup';

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
  html_url: string;
}

export default function Contribute() {
  const { t } = useTranslation();
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.github.com/repos/mafhper/personalnews/commits?per_page=3')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
          if (Array.isArray(data)) {
            setCommits(data);
          }
      })
      .catch(() => console.log('Failed to fetch commits'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="section-feature section-feature--hero section-hero-aura pt-32 pb-20 relative overflow-hidden">
        <div className="aura-wrapper aura-wrapper--contribute">
             <div className="aura-blob aura-blob--1 bg-emerald-500/20"></div>
             <div className="aura-blob aura-blob--2 bg-teal-500/20"></div>
             <div className="aura-blob aura-blob--3 bg-green-500/20"></div>
             <div className="aura-overlay"></div>
        </div>
        <div className="hero-content relative z-10 container mx-auto px-4 text-center">
            <span className="hero-label inline-block px-3 py-1 mb-6 text-sm font-medium rounded-full bg-white/10 text-primary border border-white/10">
              {t('contribute.hero_label')}
            </span>
            <h1 className="hero-title text-5xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
              {t('contribute.hero_title')}
            </h1>
            <p className="hero-description text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
                {t('contribute.hero_desc')}
            </p>
        </div>
      </section>

      <div className="section-divider h-px bg-white/5 w-full my-20"></div>

      {/* Setup Local - Left Image, Right Text */}
      <section className="section-feature container mx-auto px-4 max-w-6xl mb-32">
        <div className="feature-row grid md:grid-cols-2 gap-12 items-center">
             <div className="feature-media p-8 bg-surface rounded-2xl border border-white/5 shadow-2xl">
                 <WindowMockup title="Terminal" className="w-[95%] mx-auto">
                    <div className="flex flex-col gap-2 font-mono text-xs md:text-sm text-zinc-300">
                        <div><span className="text-zinc-500 select-none">$ </span>git clone github.com/mafhper/personalnews</div>
                        <div><span className="text-zinc-500 select-none">$ </span>cd personalnews</div>
                        <div><span className="text-zinc-500 select-none">$ </span>bun install</div>
                        <div><span className="text-zinc-500 select-none">$ </span>bun run dev</div>
                        <div className="text-emerald-500 mt-2 font-bold">{t('contribute.setup_ready')}</div>
                    </div>
                 </WindowMockup>
             </div>
             <div className="feature-content">
                <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('contribute.setup_label')}</span>
                <h2 className="feature-title text-3xl md:text-4xl font-bold mb-6">{t('contribute.setup_title')}</h2>
                <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed">
                    {t('contribute.setup_desc')}
                </p>
                <ul className="feature-list space-y-4">
                     <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                        <span className="text-zinc-400">{t('contribute.setup_item1')}</span>
                    </li>
                     <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                        <span className="text-zinc-400">{t('contribute.setup_item2')}</span>
                    </li>
                </ul>
             </div>
        </div>
      </section>

      <div className="section-divider h-px bg-white/5 w-full my-20"></div>

       {/* Formas de Contribuir - Right Image, Left Text (Zig-Zag) */}
      <section className="section-feature container mx-auto px-4 max-w-6xl mb-32">
         <div className="feature-row grid md:grid-cols-2 gap-12 items-center">
             <div className="feature-media p-8 bg-surface rounded-2xl border border-white/5 shadow-2xl order-1 md:order-2">
                 <div className="grid grid-cols-2 gap-4 w-[90%] mx-auto">
                     <div className="flex flex-col items-center gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                         <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                         </div>
                         <span className="font-semibold text-white">{t('contribute.ways_code')}</span>
                     </div>
                      <div className="flex flex-col items-center gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                         <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-500">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                         </div>
                         <span className="font-semibold text-white">{t('contribute.ways_docs')}</span>
                     </div>
                      <div className="flex flex-col items-center gap-3 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                         <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-500">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                         </div>
                         <span className="font-semibold text-white">{t('contribute.ways_translations')}</span>
                     </div>
                      <div className="flex flex-col items-center gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                         <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-500">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                         </div>
                         <span className="font-semibold text-white">{t('contribute.ways_bugs')}</span>
                     </div>
                 </div>
             </div>
             
             <div className="feature-content order-2 md:order-1">
                 <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('contribute.ways_label')}</span>
                 <h2 className="feature-title text-3xl md:text-4xl font-bold mb-6">{t('contribute.ways_title')}</h2>
                 <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed">
                     {t('contribute.ways_desc')}
                 </p>
                 <ul className="feature-list space-y-4">
                     <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                         <span className="text-zinc-400"><strong>{t('contribute.ways_code')}:</strong> {t('contribute.ways_code_desc')}</span>
                     </li>
                     <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                         <span className="text-zinc-400"><strong>{t('contribute.ways_docs')}:</strong> {t('contribute.ways_docs_desc')}</span>
                     </li>
                     <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                         <span className="text-zinc-400"><strong>{t('contribute.ways_translations')}:</strong> {t('contribute.ways_translations_desc')}</span>
                     </li>
                 </ul>
             </div>
         </div>
      </section>

      <div className="section-divider h-px bg-white/5 w-full my-20"></div>

       {/* Changelog - Left Image, Right Text */}
      <section className="section-feature container mx-auto px-4 max-w-6xl mb-32">
          <div className="feature-row grid md:grid-cols-2 gap-12 items-start">
              <div className="feature-media p-0 bg-transparent border-0 shadow-none">
                  {/* Inline Changelog List */}
                  <div className="space-y-3">
                     {loading ? (
                         <div className="p-4 rounded-xl bg-white/5 animate-pulse h-32"></div>
                     ) : (
                         commits.map((commit) => (
                             <a 
                               key={commit.sha}
                               href={commit.html_url}
                               target="_blank"
                               className="block p-4 rounded-xl bg-[#0d1117] border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group"
                             >
                                 <div className="flex items-start gap-3">
                                     <GitCommit size={18} className="text-zinc-500 group-hover:text-purple-400 mt-1 shrink-0 transition-colors" />
                                     <div>
                                         <p className="text-sm font-medium text-white line-clamp-2 md:line-clamp-1 group-hover:text-purple-200 transition-colors">
                                             {commit.commit.message}
                                         </p>
                                         <p className="text-xs text-zinc-500 mt-1">
                                             {new Date(commit.commit.author.date).toLocaleDateString()}
                                         </p>
                                     </div>
                                     <ExternalLink size={14} className="ml-auto text-zinc-600 group-hover:text-white shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
                                 </div>
                             </a>
                         ))
                     )}

                  </div>
              </div>

               <div className="feature-content pt-4">
                  <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('contribute.history_label')}</span>
                  <h2 className="feature-title text-3xl md:text-4xl font-bold mb-6">{t('contribute.history_title')}</h2>
                  <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed">
                      {t('contribute.history_desc')}
                  </p>
                  <Link to="/changes" className="btn-secondary inline-flex items-center gap-2">
                       <GitCommit size={18} />
                       {t('contribute.history_cta')}
                  </Link>
              </div>
          </div>
      </section>
      
      <div className="section-divider h-px bg-white/5 w-full my-20"></div>

       {/* CTA */}
      <section className="section-feature pb-20 pt-10 text-center bg-surface/30">
          <div className="container mx-auto px-4">
              <h2 className="feature-title text-3xl md:text-4xl font-bold mb-6 max-w-2xl mx-auto">
                  {t('contribute.cta_title')}
              </h2>
              <a href="https://github.com/mafhper/personalnews" target="_blank" className="btn-primary">
                  {t('contribute.cta_button')}
              </a>
          </div>
      </section>
    </>
  );
}
