import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ScreenshotPlaceholder } from '../components/ScreenshotPlaceholder';

// Assets helpers
const baseUrl = import.meta.env.BASE_URL;
const appUrl = import.meta.env.MODE === 'production' ? `${baseUrl}app/` : 'http://localhost:5173/';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0 }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      {/* Hero Section */}
      <section className="section-feature section-feature--hero section-hero-aura relative overflow-hidden pt-32 pb-20">
        <div className="aura-wrapper">
          <div className="aura-blob aura-blob--1"></div>
          <div className="aura-blob aura-blob--2"></div>
          <div className="aura-blob aura-blob--3"></div>
          <div className="aura-overlay"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <motion.div 
            className="hero-content max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span 
              className="hero-label inline-block px-3 py-1 mb-6 text-sm font-medium rounded-full bg-white/10 text-primary border border-white/10"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              {t('hero.label')}
            </motion.span>
            <motion.h1 
              className="hero-title text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {t('hero.title')} <span className="text-gradient">{t('hero.titleHighlight')}</span>
            </motion.h1>
            <motion.p 
              className="hero-description text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {t('hero.description')}
            </motion.p>
            <motion.div 
              className="hero-actions flex flex-wrap gap-4 justify-center mb-20"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                aria-label={t('hero.cta_primary')}
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(99, 102, 241, 0.4)" }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('hero.cta_primary')}
              </motion.a>
              <motion.a
                href="https://github.com/mafhper/personalnews"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                aria-label={t('hero.cta_secondary')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                {t('hero.cta_secondary')}
              </motion.a>
            </motion.div>
          </motion.div>
          
          {/* Hero Image with animation */}
          <motion.div 
            className="hero-image-wrapper w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-surface/50 backdrop-blur-sm"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          >
             <div className="aspect-video bg-[#0a0a0a] flex items-center justify-center relative border border-white/5">
                <ScreenshotPlaceholder width={1280} height={720} label={t('hero.screenshot_alt')} />
             </div>
          </motion.div>
        </div>
      </section>

      <div className="section-divider h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full my-20"></div>

      {/* Feature: Layouts */}
      <section className="section-feature container mx-auto px-4 max-w-6xl mb-32">
        <div className="feature-row grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="feature-media screenshot-container rounded-xl overflow-hidden border border-white/10 shadow-2xl relative group"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInLeft}
            transition={{ duration: 0.7 }}
          >
            <div className="aspect-[16/10] bg-[#0a0a0a] relative border border-white/5">
               <ScreenshotPlaceholder width={1280} height={800} label={t('features.layouts_preview')} />
            </div>
          </motion.div>
          <motion.div 
            className="feature-content"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInRight}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('features.layouts_label')}</span>
            <h2 className="feature-title text-3xl md:text-4xl font-bold mb-6">{t('features.layouts_title')}</h2>
            <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed">
              {t('features.layouts_desc')}
            </p>
            <motion.ul 
              className="feature-list space-y-4 mb-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {['layouts_item1', 'layouts_item2', 'layouts_item3'].map((key, i) => (
                <motion.li 
                  key={key}
                  className="flex items-start gap-3"
                  variants={fadeInUp}
                  transition={{ delay: i * 0.1 }}
                >
                  <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-400">{t(`features.${key}`)}</span>
                </motion.li>
              ))}
            </motion.ul>
            <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
              <Link to="/layouts" className="btn-secondary inline-flex items-center gap-2">
                {t('features.layouts_cta')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="section-divider h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full my-20"></div>

      {/* Feature: Aura Wall */}
      <section className="section-feature container mx-auto px-4 max-w-6xl mb-32">
        <div className="feature-row grid md:grid-cols-2 gap-12 items-center">
           <motion.div 
             className="feature-media order-1 md:order-2 relative rounded-xl overflow-hidden border border-white/10 aspect-square bg-black"
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true, margin: "-100px" }}
             variants={fadeInRight}
             transition={{ duration: 0.7 }}
           >
              <div className="absolute inset-0 overflow-hidden">
                  <motion.div 
                    className="absolute w-[60%] h-[60%] bg-indigo-500/60 rounded-full blur-[40px] top-[10%] left-[10%]"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.6, 0.8, 0.6],
                      x: [0, 20, 0],
                      y: [0, -10, 0]
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  ></motion.div>
                  <motion.div 
                    className="absolute w-[50%] h-[50%] bg-purple-500/50 rounded-full blur-[40px] bottom-[10%] right-[10%]"
                    animate={{ 
                      scale: [1, 1.15, 1],
                      opacity: [0.5, 0.7, 0.5],
                      x: [0, -15, 0],
                      y: [0, 10, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  ></motion.div>
                  <motion.div 
                    className="absolute w-[40%] h-[40%] bg-amber-400/40 rounded-full blur-[30px] top-[40%] left-[50%]"
                    animate={{ 
                      scale: [1, 1.25, 1],
                      opacity: [0.4, 0.6, 0.4]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  ></motion.div>
              </div>
          </motion.div>
          
          <motion.div 
            className="feature-content order-2 md:order-1"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInLeft}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('features.aura_label')}</span>
            <h2 className="feature-title text-3xl md:text-4xl font-bold mb-6">{t('features.aura_title')}</h2>
            <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed">
              {t('features.aura_desc')}
            </p>
            <ul className="feature-list space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-zinc-400">{t('features.aura_item1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-zinc-400">{t('features.aura_item2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-zinc-400">{t('features.aura_item3')}</span>
              </li>
            </ul>
            <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
              <Link to="/customization" className="btn-secondary inline-flex items-center gap-2">
                {t('features.aura_cta')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="section-divider h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full my-20"></div>

      {/* Feature: Categories */}
      <section className="section-feature container mx-auto px-4 max-w-6xl mb-32">
        <div className="feature-row grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="feature-media screenshot-container rounded-xl overflow-hidden border border-white/10 shadow-2xl relative group"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInLeft}
              transition={{ duration: 0.7 }}
            >
                <div className="aspect-[16/10] bg-[#0a0a0a] relative border border-white/5">
                    <ScreenshotPlaceholder width={1280} height={800} label={t('features.categories_preview')} />
                </div>
            </motion.div>
            <motion.div 
              className="feature-content"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInRight}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
                <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('features.categories_label')}</span>
                <h2 className="feature-title text-3xl md:text-4xl font-bold mb-6">{t('features.categories_title')}</h2>
                <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed">
                    {t('features.categories_desc')}
                </p>
                <ul className="feature-list space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                        <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-zinc-400">{t('features.categories_item1')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-zinc-400">{t('features.categories_item2')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-zinc-400">{t('features.categories_item3')}</span>
                    </li>
                </ul>
                <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                  <Link to="/categories" className="btn-secondary inline-flex items-center gap-2">
                      {t('features.categories_cta')}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                  </Link>
                </motion.div>
            </motion.div>
        </div>
      </section>

      <div className="section-divider h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full my-20"></div>

      {/* CTA Final */}
      <motion.section 
        className="section-feature section-glow py-24 relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={scaleIn}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface/50 -z-10"></div>
        <div className="container mx-auto px-4 text-center">
            <motion.h2 
              className="feature-title text-3xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto"
              variants={fadeInUp}
            >
              {t('cta.title')}
            </motion.h2>
            <motion.p 
              className="feature-description text-xl text-text-secondary mb-10 max-w-2xl mx-auto"
              variants={fadeInUp}
              transition={{ delay: 0.1 }}
            >
              {t('cta.description')}
            </motion.p>
            <motion.div 
              className="flex gap-4 justify-center flex-wrap"
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
            >
              <motion.a 
                href={appUrl} 
                target="_blank" 
                className="btn-primary"
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(99, 102, 241, 0.4)" }}
                whileTap={{ scale: 0.98 }}
              >
                {t('cta.primary')}
              </motion.a>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link to="/contribute" className="btn-secondary">
                  {t('cta.secondary')}
                </Link>
              </motion.div>
            </motion.div>
        </div>
      </motion.section>
    </>
  );
}
