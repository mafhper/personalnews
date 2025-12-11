import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ExternalLink, Github, Image as ImageIcon, Link2, ImageDown, Monitor, FileText } from 'lucide-react';

// Assets helpers
const baseUrl = import.meta.env.BASE_URL;
const assetPath = (path: string) => `${baseUrl}${path.startsWith('/') ? path.slice(1) : path}`;

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};

// Projects data
const projects = [
  {
    id: 'aurawall',
    name: 'AuraWall',
    descKey: 'about.project_aurawall_desc',
    icon: ImageIcon,
    color: 'from-orange-500 to-amber-500',
    techs: ['React', 'Canvas API', 'SVG'],
    status: 'live',
    demoUrl: 'https://mafhper.github.io/aurawall/',
    githubUrl: 'https://github.com/mafhper/aurawall',
    image: 'assets/screenshots/aurawall-preview.jpg'
  },
  {
    id: 'spread',
    name: 'Spread',
    descKey: 'about.project_spread_desc',
    icon: Link2,
    color: 'from-violet-500 to-purple-500',
    techs: ['React', 'CSS', 'Design'],
    status: 'live',
    demoUrl: 'https://mafhper.github.io/spread/',
    githubUrl: 'https://github.com/mafhper/spread',
    image: null
  },
  {
    id: 'imaginizim',
    name: 'Imaginizim',
    descKey: 'about.project_imaginizim_desc',
    icon: ImageDown,
    color: 'from-emerald-500 to-teal-500',
    techs: ['JavaScript', 'WebP', 'Canvas'],
    status: 'live',
    demoUrl: 'https://mafhper.github.io/imaginizim/',
    githubUrl: 'https://github.com/mafhper/imaginizim',
    image: null
  },
  {
    id: 'fremit',
    name: 'Fremit',
    descKey: 'about.project_fremit_desc',
    icon: Monitor,
    color: 'from-blue-500 to-cyan-500',
    techs: ['React', 'CSS', 'Design'],
    status: 'live',
    demoUrl: 'https://mafhper.github.io/fremit/',
    githubUrl: 'https://github.com/mafhper/fremit',
    image: null
  },
  {
    id: 'marklee',
    name: 'Mark-Lee',
    descKey: 'about.project_marklee_desc',
    icon: FileText,
    color: 'from-amber-600 to-orange-600',
    techs: ['Tauri', 'React', 'Rust'],
    status: 'dev',
    demoUrl: null,
    githubUrl: 'https://github.com/mafhper/mark-lee',
    image: null
  },
  {
    id: 'lithium',
    name: 'Lithium CMS',
    descKey: 'about.project_lithium_desc',
    icon: FileText,
    color: 'from-rose-500 to-pink-500',
    techs: ['Node.js', 'Nunjucks', 'Markdown'],
    status: 'dev',
    demoUrl: null,
    githubUrl: 'https://github.com/mafhper/lithium',
    image: null
  },
];

// Add description for personal-news in translations
// Add description for personal-news in translations
const projectDescriptionsFallback: Record<string, string> = {};

export default function About() {
  const { t } = useTranslation();

  return (
    <>
      {/* Hero Section */}
      <section className="section-feature section-feature--hero section-hero-aura pt-32 pb-20 relative overflow-hidden">
        <div className="aura-wrapper aura-wrapper--about">
             <div className="aura-blob aura-blob--1 bg-indigo-500/20"></div>
             <div className="aura-blob aura-blob--2 bg-pink-500/20"></div>
             <div className="aura-blob aura-blob--3"></div>
             <div className="aura-overlay"></div>
        </div>
        <motion.div 
          className="hero-content relative z-10 container mx-auto px-4 text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
            <motion.span 
              className="hero-label inline-block px-3 py-1 mb-6 text-sm font-medium rounded-full bg-white/10 text-primary border border-white/10"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              {t('about.hero_label')}
            </motion.span>
            <motion.h1 
              className="hero-title text-5xl md:text-6xl font-bold mb-6 tracking-tight leading-tight"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {t('about.hero_title')}
            </motion.h1>
            <motion.p 
              className="hero-description text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
                {t('about.hero_desc')}
            </motion.p>
        </motion.div>
      </section>

      <div className="section-divider h-px bg-white/5 w-full my-20"></div>

      {/* Motivation Section - Left Image, Right Text */}
      <section className="section-feature container mx-auto px-4 max-w-5xl mb-32">
         <div className="feature-row grid md:grid-cols-2 gap-12 items-center">
             <motion.div 
               className="feature-media p-8 bg-surface rounded-2xl border border-white/5 shadow-lg relative overflow-hidden"
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true, margin: "-100px" }}
               variants={fadeInLeft}
               transition={{ duration: 0.6 }}
             >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                  <motion.div 
                    className="mockup-list flex flex-col gap-4 w-[80%] mx-auto relative z-10"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                  >
                       <motion.div 
                         className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 backdrop-blur-sm"
                         variants={fadeInUp}
                         whileHover={{ scale: 1.02, x: 5 }}
                         transition={{ duration: 0.2 }}
                       >
                           <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                           <span className="text-sm text-zinc-300">{t('about.motivation_feat1')}</span>
                       </motion.div>
                       <motion.div 
                         className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 backdrop-blur-sm ml-4"
                         variants={fadeInUp}
                         whileHover={{ scale: 1.02, x: 5 }}
                         transition={{ duration: 0.2 }}
                       >
                           <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                           <span className="text-sm text-zinc-300">{t('about.motivation_feat2')}</span>
                       </motion.div>
                       <motion.div 
                         className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 backdrop-blur-sm"
                         variants={fadeInUp}
                         whileHover={{ scale: 1.02, x: 5 }}
                         transition={{ duration: 0.2 }}
                       >
                           <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                           <span className="text-sm text-zinc-300">{t('about.motivation_feat3')}</span>
                       </motion.div>
                       <motion.div 
                         className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 backdrop-blur-sm ml-4"
                         variants={fadeInUp}
                         whileHover={{ scale: 1.02, x: 5 }}
                         transition={{ duration: 0.2 }}
                       >
                           <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                           <span className="text-sm text-zinc-300">{t('about.motivation_feat4')}</span>
                       </motion.div>
                  </motion.div>
             </motion.div>
             
             <motion.div 
               className="feature-content"
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true, margin: "-100px" }}
               variants={fadeInRight}
               transition={{ duration: 0.6, delay: 0.2 }}
             >
                 <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('about.motivation_label')}</span>
                 <h2 className="feature-title text-3xl font-bold mb-6">{t('about.motivation_title')}</h2>
                 <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed">
                     {t('about.motivation_desc')}
                 </p>
                 <motion.ul 
                   className="feature-list space-y-4"
                   variants={staggerContainer}
                   initial="hidden"
                   whileInView="visible"
                   viewport={{ once: true }}
                 >
                     {['motivation_item1', 'motivation_item2', 'motivation_item3'].map((key, i) => (
                       <motion.li 
                         key={key}
                         className="flex items-start gap-3"
                         variants={fadeInUp}
                         transition={{ delay: i * 0.1 }}
                       >
                           <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                           </svg>
                           <span className="text-zinc-400">{t(`about.${key}`)}</span>
                       </motion.li>
                     ))}
                 </motion.ul>
             </motion.div>
         </div>
      </section>

      <div className="section-divider h-px bg-white/5 w-full my-20"></div>

      {/* Author Section - Right Image, Left Text (Zig-Zag) */}
      <section className="section-feature container mx-auto px-4 max-w-5xl mb-32">
        <div className="feature-row grid md:grid-cols-2 gap-16 items-center">
             <motion.div 
               className="feature-media order-1 md:order-2 flex flex-col items-center justify-center p-8"
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true, margin: "-100px" }}
               variants={fadeInRight}
               transition={{ duration: 0.6 }}
             >
                 <motion.div 
                   className="relative group"
                   whileHover={{ scale: 1.05 }}
                   transition={{ duration: 0.4 }}
                 >
                     {/* Glow Effect */}
                     <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                     
                     {/* Image Frame */}
                     <div className="relative w-48 h-48 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-2xl">
                        <div className="w-full h-full rounded-full bg-black p-1 overflow-hidden relative">
                             <motion.img 
                               src="https://github.com/mafhper.png"
                               alt="@mafhper" 
                               className="w-full h-full rounded-full object-cover"
                               onError={(e) => {
                                 // Fallback if GitHub image fails
                                 e.currentTarget.src = 'https://ui-avatars.com/api/?name=Mafhper&background=0D8ABC&color=fff&size=256';
                               }}
                             />
                        </div>
                     </div>
                     
                     {/* Floating Badge (Optional - e.g.. Available for work) */}
                     <motion.div 
                        className="absolute bottom-2 right-2 w-8 h-8 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-zinc-800 shadow-lg"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                     >
                         <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                     </motion.div>
                 </motion.div>

                 <div className="mt-8 text-center">
                     <h3 className="text-3xl font-bold text-white mb-2">@mafhper</h3>
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"></span>
                        <span className="text-sm font-medium text-zinc-300">{t('about.author_role')}</span>
                     </div>
                 </div>
             </motion.div>
             
             <motion.div 
               className="feature-content order-2 md:order-1"
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true, margin: "-100px" }}
               variants={fadeInLeft}
               transition={{ duration: 0.6, delay: 0.2 }}
             >
                 <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('about.author_label')}</span>
                 <h2 className="feature-title text-3xl font-bold mb-6">{t('about.author_title')}</h2>
                 <p className="feature-description text-text-secondary text-lg mb-8 leading-relaxed">
                     {t('about.author_desc')}
                 </p>
                 <ul className="feature-list space-y-4 mb-8">
                     <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                         <span className="text-zinc-400">{t('about.author_item1')}</span>
                     </li>
                      <li className="flex items-start gap-3">
                         <svg className="icon-check w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                         <span className="text-zinc-400">{t('about.author_item2')}</span>
                     </li>
                 </ul>
                 <motion.a 
                   href="https://github.com/mafhper" 
                   target="_blank" 
                   className="btn-secondary inline-flex items-center gap-2"
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                 >
                     <Github size={18} />
                     {t('about.author_cta')}
                 </motion.a>
             </motion.div>
        </div>
      </section>
      
      <div className="section-divider h-px bg-white/5 w-full my-20"></div>

      {/* Projects Section (Premium Cards with Framer Motion) */}
      <section className="section-feature container mx-auto px-4 max-w-7xl mb-32">
           <motion.div 
             className="text-center mb-20"
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             variants={fadeInUp}
             transition={{ duration: 0.6 }}
           >
              <span className="feature-label text-primary font-bold uppercase tracking-wider text-xs mb-2 block">{t('about.projects_label')}</span>
              <h2 className="feature-title text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                  {t('about.projects_title')}
              </h2>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {projects.map((project, index) => (
                <motion.div 
                  key={project.id}
                  className="group relative bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-colors duration-500 flex flex-col h-full"
                  variants={scaleIn}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ 
                    y: -8, 
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    transition: { duration: 0.3 }
                  }}
                >
                  {/* Image/Gradient Header */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
                      <motion.div 
                        className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-20`}
                        whileHover={{ opacity: 0.4 }}
                        transition={{ duration: 0.3 }}
                      ></motion.div>
                      
                      {project.image ? (
                        <motion.img 
                            src={assetPath(project.image)} 
                            alt={project.name}
                            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                            whileHover={{ scale: 1.1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center opacity-30">
                             <project.icon size={64} className="text-white mix-blend-overlay" />
                         </div>
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent"></div>
                      
                      {/* Status Badge */}
                      <motion.div 
                        className="absolute top-4 right-4 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                          {project.status === 'live' ? t('about.project_status_live') : t('about.project_status_dev')}
                      </motion.div>

                      {/* Icon */}
                      <motion.div 
                        className={`absolute bottom-4 left-4 w-12 h-12 rounded-xl bg-gradient-to-br ${project.color} flex items-center justify-center shadow-lg`}
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                          <project.icon size={24} className="text-white" />
                      </motion.div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex flex-col flex-1 relative">
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all duration-300">
                          {project.name}
                      </h3>
                      <p className="text-zinc-400 text-base leading-relaxed mb-6">
                          {t(project.descKey) || projectDescriptionsFallback[project.id] || ''}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-8 mt-auto">
                           {project.techs.map((tech) => (
                             <span key={tech} className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 border border-white/5 bg-white/5 px-2 py-1 rounded">
                               {tech}
                             </span>
                           ))}
                      </div>

                      <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
                           {project.demoUrl ? (
                               <motion.a 
                                 href={project.demoUrl} 
                                 target="_blank"  
                                 rel="noreferrer"
                                 className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all border border-white/5 hover:border-white/20"
                                 whileHover={{ scale: 1.02 }}
                                 whileTap={{ scale: 0.98 }}
                               >
                                   <ExternalLink size={16} className="text-primary" />
                                   <span>{t('about.project_visit')}</span>
                               </motion.a>
                           ) : (
                               <button 
                                 disabled 
                                 className="w-full py-3 px-4 rounded-xl bg-white/5 text-zinc-600 font-semibold text-sm cursor-not-allowed border border-white/5"
                               >
                                   {t('about.project_soon')}
                               </button>
                           )}
                           
                           {project.githubUrl && (
                               <motion.a 
                                 href={project.githubUrl} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-transparent text-zinc-400 font-medium text-sm hover:text-white transition-all border border-transparent hover:bg-white/5 hover:border-white/10"
                                 whileHover={{ scale: 1.02 }}
                                 whileTap={{ scale: 0.98 }}
                               >
                                   <Github size={16} />
                                   <span>{t('about.project_code')}</span>
                               </motion.a>
                           )}
                      </div>
                  </div>
                </motion.div>
            ))}
          </motion.div>
      </section>

      <div className="section-divider h-px bg-white/5 w-full my-20"></div>

       {/* License Section */}
      <motion.section 
        className="section-feature pb-20 pt-10 text-center bg-surface/30"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
          <div className="container mx-auto px-4">
              <h2 className="feature-title text-2xl font-bold mb-4">{t('about.license_title')}</h2>
              <p className="feature-description text-text-secondary mb-6 max-w-lg mx-auto">
                  {t('about.license_desc')}
              </p>
              <motion.a 
                href="https://github.com/mafhper/personalnews" 
                target="_blank" 
                className="btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                  {t('about.license_cta')}
              </motion.a>
          </div>
      </motion.section>
    </>
  );
}
