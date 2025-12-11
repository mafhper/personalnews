import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { ScreenshotPlaceholder } from '../components/ScreenshotPlaceholder';

type LayoutDetail = {
  id: string;
  nameKey: string;
  descKey: string;
  longDescKey: string;
  featuresKeys: string[];
  icon: React.ReactNode;
};

const layoutsData: LayoutDetail[] = [
  {
    id: 'bento',
    nameKey: 'layouts.layout_bento_name',
    descKey: 'layouts.layout_bento_desc',
    longDescKey: 'layouts.layout_bento_long',
    featuresKeys: ['layouts.layout_bento_feat1', 'layouts.layout_bento_feat2', 'layouts.layout_bento_feat3'],
    icon: (
      <svg className="w-16 h-16 text-text-secondary opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    )
  },
  {
    id: 'brutalist',
    nameKey: 'layouts.layout_brutalist_name',
    descKey: 'layouts.layout_brutalist_desc',
    longDescKey: 'layouts.layout_brutalist_long',
    featuresKeys: ['layouts.layout_brutalist_feat1', 'layouts.layout_brutalist_feat2', 'layouts.layout_brutalist_feat3'],
    icon: (
        <svg className="w-16 h-16 text-text-secondary opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    )
  },
  {
    id: 'pocketfeeds',
    nameKey: 'layouts.layout_pocketfeeds_name',
    descKey: 'layouts.layout_pocketfeeds_desc',
    longDescKey: 'layouts.layout_pocketfeeds_long',
    featuresKeys: ['layouts.layout_pocketfeeds_feat1', 'layouts.layout_pocketfeeds_feat2', 'layouts.layout_pocketfeeds_feat3'],
    icon: (
        <svg className="w-16 h-16 text-text-secondary opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
    )
  },
  {
    id: 'immersive',
    nameKey: 'layouts.layout_immersive_name',
    descKey: 'layouts.layout_immersive_desc',
    longDescKey: 'layouts.layout_immersive_long',
    featuresKeys: ['layouts.layout_immersive_feat1', 'layouts.layout_immersive_feat2', 'layouts.layout_immersive_feat3'],
    icon: (
        <svg className="w-16 h-16 text-text-secondary opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
    )
  },
  {
    id: 'magazine',
    nameKey: 'layouts.layout_magazine_name',
    descKey: 'layouts.layout_magazine_desc',
    longDescKey: 'layouts.layout_magazine_long',
    featuresKeys: ['layouts.layout_magazine_feat1', 'layouts.layout_magazine_feat2'],
    icon: <div className="w-10 h-10 border-2 border-zinc-700 rounded flex items-center justify-center">MG</div>
  },
  {
    id: 'masonry',
    nameKey: 'layouts.layout_masonry_name',
    descKey: 'layouts.layout_masonry_desc',
    longDescKey: 'layouts.layout_masonry_long',
    featuresKeys: ['layouts.layout_masonry_feat1', 'layouts.layout_masonry_feat2'],
    icon: <div className="w-10 h-10 border-2 border-zinc-700 rounded flex items-center justify-center">MS</div>
  }, 
  {
    id: 'timeline',
    nameKey: 'layouts.layout_timeline_name',
    descKey: 'layouts.layout_timeline_desc',
    longDescKey: 'layouts.layout_timeline_long',
    featuresKeys: ['layouts.layout_timeline_feat1', 'layouts.layout_timeline_feat2'],
    icon: <div className="w-10 h-10 border-2 border-zinc-700 rounded flex items-center justify-center">TL</div>
  },
  {
    id: 'newspaper',
    nameKey: 'layouts.layout_newspaper_name',
    descKey: 'layouts.layout_newspaper_desc',
    longDescKey: 'layouts.layout_newspaper_long',
    featuresKeys: ['layouts.layout_newspaper_feat1', 'layouts.layout_newspaper_feat2'],
    icon: <div className="w-10 h-10 border-2 border-zinc-700 rounded flex items-center justify-center">NP</div>
  },
  {
     id: 'minimal',
     nameKey: 'layouts.layout_minimal_name',
     descKey: 'layouts.layout_minimal_desc',
     longDescKey: 'layouts.layout_minimal_long',
     featuresKeys: ['layouts.layout_minimal_feat1', 'layouts.layout_minimal_feat2'],
     icon: <div className="w-10 h-10 border-2 border-zinc-700 rounded flex items-center justify-center">MN</div>
   },
   {
      id: 'focus',
      nameKey: 'layouts.layout_focus_name',
      descKey: 'layouts.layout_focus_desc',
      longDescKey: 'layouts.layout_focus_long',
      featuresKeys: ['layouts.layout_focus_feat1', 'layouts.layout_focus_feat2'],
      icon: <div className="w-10 h-10 border-2 border-zinc-700 rounded flex items-center justify-center">FC</div>
    }
];

export default function Layouts() {
  const { t } = useTranslation();
  const [selectedLayout, setSelectedLayout] = useState<LayoutDetail | null>(null);

  const featuredLayouts = layoutsData.slice(0, 4);
  const otherLayouts = layoutsData.slice(4);

  return (
    <>
      {/* Hero Section */}
      <section className="section-feature section-feature--hero section-hero-aura pt-32 pb-10 text-center">
        <div className="aura-wrapper aura-wrapper--layouts">
           <div className="aura-blob aura-blob--1 bg-blue-500/20"></div>
           <div className="aura-blob aura-blob--2 bg-purple-500/20"></div>
        </div>
        <div className="hero-content relative z-10 max-w-4xl mx-auto">
            <span className="hero-label inline-block px-3 py-1 mb-6 text-sm font-medium rounded-full bg-white/10 text-primary border border-white/10">
              {t('layouts.hero_label')}
            </span>
            <h1 className="hero-title text-5xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
              {t('layouts.hero_title')}
            </h1>
            <p className="hero-description text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
               {t('layouts.hero_desc')}
            </p>
        </div>
      </section>

      <div className="section-divider h-px bg-white/5 w-full my-10"></div>

      {/* Featured Layouts (Big Panels) */}
      {featuredLayouts.map((layout, index) => (
        <div key={layout.id} className="container mx-auto px-4 max-w-6xl mb-24">
            <section className="section-feature">
                <div className="feature-row grid md:grid-cols-2 gap-12 items-center">
                   <div className={`feature-media aspect-[16/10] bg-[#0a0a0a] rounded-2xl border border-white/5 relative overflow-hidden group ${index % 2 !== 0 ? 'order-1 md:order-2' : 'order-1'}`}>
                        <ScreenshotPlaceholder width={1920} height={1200} label={`${t(layout.nameKey)} Preview`} />
                   </div>
                   
                   <div className={`feature-content ${index % 2 !== 0 ? 'order-2 md:order-1' : 'order-2'}`}>
                       <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">
                           {t('layouts.featured_label')}
                       </span>
                       <h2 className="feature-title text-3xl md:text-4xl font-bold mb-6">
                           {t(layout.nameKey)}
                       </h2>
                       <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed">
                           {t(layout.longDescKey)}
                       </p>
                       <ul className="feature-list space-y-4 mb-8">
                           {layout.featuresKeys?.map((featKey, i) => (
                               <li key={i} className="flex items-start gap-3">
                                   <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                   </svg>
                                   <span className="text-zinc-400 font-medium">{t(featKey)}</span>
                               </li>
                           ))}
                       </ul>
                   </div>
                </div>
            </section>
            <div className="section-divider h-px bg-white/5 w-full my-20"></div>
        </div>
      ))}

      {/* Other Layouts Grid */}
      <section className="section-feature container mx-auto px-4 max-w-6xl mb-32 pb-20">
          <div className="text-center mb-16">
              <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('layouts.more_label')}</span>
              <h2 className="feature-title text-3xl md:text-4xl font-bold">
                  {t('layouts.more_title')}
              </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherLayouts.map((layout) => (
                  <div 
                    key={layout.id} 
                    className="layout-card bg-surface border border-border rounded-xl p-6 cursor-pointer hover:border-primary transition-all hover:transform hover:-translate-y-1 hover:shadow-lg"
                    onClick={() => setSelectedLayout(layout)}
                  >
                        <div className="layout-preview aspect-[16/10] bg-[#0a0a0a] rounded-lg mb-4 overflow-hidden border border-white/5">
                             <ScreenshotPlaceholder width={800} height={500} label={t(layout.nameKey)} />
                        </div>
                        <span className="layout-name block font-bold text-white mb-1">{t(layout.nameKey)}</span>
                        <span className="layout-desc block text-sm text-text-secondary">{t(layout.descKey)}</span>
                  </div>
              ))}
          </div>
      </section>

      {/* Modal / Overflow */}
      {selectedLayout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedLayout(null)}></div>
            <div className="relative bg-surface border border-border rounded-2xl max-w-2xl w-full p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <button 
                  onClick={() => setSelectedLayout(null)}
                  className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
                
                <h2 className="text-3xl font-bold mb-2">{t(selectedLayout.nameKey)}</h2>
                <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                    {t(selectedLayout.descKey)}
                </span>
                
                <div className="aspect-video bg-[#0a0a0a] rounded-xl mb-6 border border-white/5 overflow-hidden">
                    <ScreenshotPlaceholder width={1920} height={1080} label={`${t(selectedLayout.nameKey)} Detailed Preview`} />
                </div>

                <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                    {t(selectedLayout.longDescKey)}
                </p>

                <div className="bg-background rounded-xl p-6">
                    <h3 className="text-sm font-bold uppercase text-zinc-500 mb-4">{t('layouts.main_features')}</h3>
                    <ul className="grid sm:grid-cols-2 gap-4">
                        {selectedLayout.featuresKeys?.map((featKey, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                                {t(featKey)}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                         onClick={() => setSelectedLayout(null)}
                         className="btn-secondary"
                    >
                        {t('layouts.close')}
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
