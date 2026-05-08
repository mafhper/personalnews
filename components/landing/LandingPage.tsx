import React from "react";
import Logo from "../Logo";
import { useLanguage } from "../../hooks/useLanguage";
import {
  APP_BRAND_NAME,
  DEVELOPER_GITHUB_URL,
  PERSONAL_NEWS_REPO_URL,
} from "../../config/brand";
import { PromoLiquidMeshBackdrop } from "./PromoLiquidMeshBackdrop";
import {
  getPromoContent,
  PROMO_PAGE_HASHES,
  PROMO_PAGE_ORDER,
  type PromoPageId,
} from "../../config/promoContent";
import type { Language } from "../../types";

interface LandingPageProps {
  onOpenFeed: () => void;
  onFooterVisible?: () => void;
  onHomeDataReady?: () => void;
}

type IconProps = {
  className?: string;
};

const PROMO_HASH_TO_PAGE = Object.entries(PROMO_PAGE_HASHES).reduce(
  (acc, [page, hash]) => {
    acc[hash] = page as PromoPageId;
    return acc;
  },
  {} as Record<string, PromoPageId>,
);

const PROMO_UI_TEXT: Record<
  Language,
  {
    navLabel: string;
    heroStatsLabel: string;
    layoutsLabel: string;
    openSourceSummary: string;
    repositoryLabel: string;
    downloadsLabel: string;
    githubListNote: string;
  }
> = {
  "pt-BR": {
    navLabel: "Navegação promocional",
    heroStatsLabel: "Resumo do Personal News",
    layoutsLabel: "Layouts disponíveis",
    openSourceSummary: "Código aberto para ler, adaptar e acompanhar.",
    repositoryLabel: "Ver repositório",
    downloadsLabel: "Downloads por sistema",
    githubListNote: "A lista ativa mora no perfil do GitHub.",
  },
  "en-US": {
    navLabel: "Promo navigation",
    heroStatsLabel: "Personal News facts",
    layoutsLabel: "Available layouts",
    openSourceSummary: "Open code to read, adapt, and follow.",
    repositoryLabel: "View repository",
    downloadsLabel: "Downloads by platform",
    githubListNote: "The active list lives on the GitHub profile.",
  },
  es: {
    navLabel: "Navegación promocional",
    heroStatsLabel: "Resumen de Personal News",
    layoutsLabel: "Layouts disponibles",
    openSourceSummary: "Código abierto para leer, adaptar y seguir.",
    repositoryLabel: "Ver repositorio",
    downloadsLabel: "Descargas por sistema",
    githubListNote: "La lista activa vive en el perfil de GitHub.",
  },
};

const getActiveSectionFromHash = (): PromoPageId => {
  if (typeof window === "undefined") return "home";
  return PROMO_HASH_TO_PAGE[window.location.hash.toLowerCase()] ?? "home";
};

const scrollToPromoSection = (
  section: PromoPageId,
  behavior: ScrollBehavior,
) => {
  if (typeof window === "undefined") return;

  const target = document.getElementById(section);
  if (!target) return;

  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 92);
  window.scrollTo({ top, behavior });
};

const ArrowIcon = ({ className = "" }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M5 12H19"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
    <path
      d="M13 6L19 12L13 18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

const ExternalIcon = ({ className = "" }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M14 5H19V10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M10 14L19 5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M19 14V18C19 19.1046 18.1046 20 17 20H6C4.89543 20 4 19.1046 4 18V7C4 5.89543 4.89543 5 6 5H10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

const promoScreenAsset = (fileName: string) =>
  `${import.meta.env.BASE_URL}assets/promo/screens/${fileName}`;

const HERO_SCREENSHOTS = [
  promoScreenAsset("hero-narrow-01.webp"),
  promoScreenAsset("hero-narrow-02.webp"),
  promoScreenAsset("hero-narrow-03.webp"),
  promoScreenAsset("hero-narrow-04.webp"),
  promoScreenAsset("hero-narrow-05.webp"),
  promoScreenAsset("hero-narrow-06.webp"),
];

const LAYOUT_SCREENSHOTS: Record<string, string> = {
  magazine: promoScreenAsset("magazine_01.webp"),
  editorial: promoScreenAsset("editorial_02.webp"),
  gallery: promoScreenAsset("galeria_02.webp"),
  brutalist: promoScreenAsset("brutalist_01.webp"),
};

const SectionIntro = ({
  eyebrow,
  title,
  body,
  titleId,
  tone = "dark",
}: {
  eyebrow: string;
  title: string;
  body: string;
  titleId?: string;
  tone?: "dark" | "light";
}) => (
  <div className={`promo-section-intro promo-section-intro--${tone}`}>
    <div className="promo-eyebrow">{eyebrow}</div>
    <h2 id={titleId}>{title}</h2>
    <p>{body}</p>
  </div>
);

const LayoutPreview = ({
  variant,
  imageSrc,
}: {
  variant: string;
  imageSrc: string;
}) => (
  <figure
    className={`promo-layout-preview promo-layout-preview--${variant}`}
    aria-hidden="true"
  >
    <img src={imageSrc} alt="" loading="lazy" />
  </figure>
);

const ProductFrame = ({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [exitingIndex, setExitingIndex] = React.useState<number | null>(null);
  const [transitionStep, setTransitionStep] = React.useState(0);

  React.useEffect(() => {
    if (images.length <= 1 || typeof window === "undefined") return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (reduceMotion?.matches) return;

    let exitTimeoutId = 0;
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => {
        setExitingIndex(current);
        setTransitionStep((step) => step + 1);
        return (current + 1) % images.length;
      });

      window.clearTimeout(exitTimeoutId);
      exitTimeoutId = window.setTimeout(() => {
        setExitingIndex(null);
      }, 1850);
    }, 7600);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(exitTimeoutId);
    };
  }, [images.length]);

  return (
    <figure className="promo-product-frame promo-product-frame--rotating">
      {images.map((image, index) => (
        <img
          key={image}
          src={image}
          alt={index === activeIndex ? alt : ""}
          aria-hidden={index === activeIndex ? undefined : true}
          className={[
            index === activeIndex ? "is-active" : "",
            index === exitingIndex ? "is-exiting" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          loading={index === 0 ? "eager" : "lazy"}
        />
      ))}
      {transitionStep > 0 ? (
        <span
          key={transitionStep}
          className="promo-product-frame__transition"
          aria-hidden="true"
        />
      ) : null}
    </figure>
  );
};

const LandingPage = ({
  onOpenFeed,
  onFooterVisible,
  onHomeDataReady,
}: LandingPageProps) => {
  const { language } = useLanguage();
  const content = React.useMemo(() => getPromoContent(language), [language]);
  const uiText = PROMO_UI_TEXT[language];
  const [activeSection, setActiveSection] = React.useState<PromoPageId>(
    getActiveSectionFromHash,
  );
  const footerRef = React.useRef<HTMLElement | null>(null);
  const footerTriggeredRef = React.useRef(false);
  const homeReadyTriggeredRef = React.useRef(false);
  const featuredVersion = content.versions.items.find(
    (version) => version.featured,
  );
  const secondaryVersions = content.versions.items.filter(
    (version) => !version.featured,
  );

  const scrollToSection = React.useCallback((section: PromoPageId) => {
    if (typeof window === "undefined") return;

    const nextHash = PROMO_PAGE_HASHES[section];
    setActiveSection(section);

    if (window.location.hash.toLowerCase() !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }

    scrollToPromoSection(section, "smooth");
  }, []);

  const handleHashNavigation = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const page = PROMO_HASH_TO_PAGE[window.location.hash.toLowerCase()];
    if (!page) return;
    setActiveSection(page);
    scrollToPromoSection(page, "auto");
  }, []);

  React.useEffect(() => {
    window.addEventListener("hashchange", handleHashNavigation);
    handleHashNavigation();
    return () => window.removeEventListener("hashchange", handleHashNavigation);
  }, [handleHashNavigation]);

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;
        const section = visibleEntry.target.id as PromoPageId;
        if (PROMO_PAGE_ORDER.includes(section)) {
          setActiveSection(section);
        }
      },
      { rootMargin: "-32% 0px -55% 0px", threshold: [0.15, 0.35, 0.6] },
    );

    PROMO_PAGE_ORDER.forEach((section) => {
      const target = document.getElementById(section);
      if (target) observer.observe(target);
    });

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!onHomeDataReady || homeReadyTriggeredRef.current) return;
    homeReadyTriggeredRef.current = true;

    const rafId = window.requestAnimationFrame(() => {
      onHomeDataReady();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [onHomeDataReady]);

  React.useEffect(() => {
    if (!onFooterVisible || !footerRef.current) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (!isVisible || footerTriggeredRef.current) return;
        footerTriggeredRef.current = true;
        onFooterVisible();
        observer.disconnect();
      },
      { rootMargin: "0px 0px 80px 0px", threshold: 0.1 },
    );

    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, [onFooterVisible]);

  const handleFooterLink = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (href === "#feed") {
      event.preventDefault();
      onOpenFeed();
      return;
    }

    const page = PROMO_HASH_TO_PAGE[href.toLowerCase()];
    if (!page) return;
    event.preventDefault();
    scrollToSection(page);
  };

  return (
    <div className="promo-root">
      <header className="promo-header">
        <div className="promo-shell promo-header__inner">
          <a
            href={PROMO_PAGE_HASHES.home}
            className="promo-brand"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("home");
            }}
          >
            <span className="promo-brand__mark">
              <Logo size="sm" />
            </span>
            <span className="promo-brand__text">{content.nav.brandLabel}</span>
          </a>

          <nav
            className="promo-nav"
            aria-label={uiText.navLabel}
          >
            {PROMO_PAGE_ORDER.map((section) => (
              <a
                key={section}
                href={PROMO_PAGE_HASHES[section]}
                className={`promo-nav__link ${
                  activeSection === section ? "is-active" : ""
                }`}
                aria-current={activeSection === section ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(section);
                }}
              >
                {content.nav.pages[section]}
              </a>
            ))}
          </nav>

          <div className="promo-header__actions">
            <a
              href={DEVELOPER_GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="promo-header__repo"
            >
              {content.nav.repo}
            </a>
            <button
              type="button"
              className="promo-header__cta"
              onClick={onOpenFeed}
            >
              <span>{content.nav.openFeed}</span>
              <ArrowIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="promo-main">
        <PromoLiquidMeshBackdrop />
        <section
          id="home"
          className="promo-section promo-hero promo-shell"
          data-testid="promo-section-home"
        >
          <div className="promo-hero__copy">
            <div className="promo-eyebrow">{content.hero.eyebrow}</div>
            <h1>{content.hero.title}</h1>
            <p>{content.hero.lead}</p>
            <div className="promo-hero__actions">
              <button
                type="button"
                className="promo-primary-button"
                onClick={onOpenFeed}
              >
                <span>{content.hero.primaryCta}</span>
                <ArrowIcon />
              </button>
              <a
                href={PROMO_PAGE_HASHES.experience}
                className="promo-secondary-button"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("experience");
                }}
              >
                {content.hero.secondaryCta}
              </a>
            </div>
            <dl
              className="promo-hero__stats"
              aria-label={uiText.heroStatsLabel}
            >
              {content.hero.stats.map((stat) => (
                <div key={stat.id}>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="promo-hero__visual">
            <ProductFrame images={HERO_SCREENSHOTS} alt={content.hero.imageAlt} />
          </div>
        </section>

        <section className="promo-section promo-proof" aria-labelledby="promo-proof-title">
          <div className="promo-shell promo-proof__inner">
            <SectionIntro
              eyebrow={content.proof.eyebrow}
              title={content.proof.title}
              titleId="promo-proof-title"
              body={content.proof.body}
            />
            <div className="promo-proof__grid">
              {content.proof.features.map((feature) => (
                <article key={feature.id} className="promo-proof-card">
                  <span className="promo-proof-card__eyebrow">
                    {feature.eyebrow}
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <span className="promo-mono-tag">{feature.tag}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="experience"
          className="promo-section promo-reading"
          data-testid="promo-section-experience"
        >
          <div className="promo-shell">
            <SectionIntro
              eyebrow={content.readingModes.eyebrow}
              title={content.readingModes.title}
              body={content.readingModes.body}
            />
            <div
              className="promo-layout-tags"
              aria-label={uiText.layoutsLabel}
            >
              {content.readingModes.layoutTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="promo-reading__grid">
              {content.readingModes.modes.map((mode) => (
                <article key={mode.id} className="promo-mode-card">
                  <LayoutPreview
                    variant={mode.id}
                    imageSrc={LAYOUT_SCREENSHOTS[mode.id] ?? HERO_SCREENSHOTS[0]}
                  />
                  <span>{mode.label}</span>
                  <h3>{mode.title}</h3>
                  <p>{mode.description}</p>
                </article>
              ))}
            </div>
            <button
              type="button"
              className="promo-reading__cta promo-primary-button"
              onClick={onOpenFeed}
            >
              <span>{content.readingModes.ctaLabel}</span>
              <ArrowIcon />
            </button>
          </div>
        </section>

        <section className="promo-section promo-workflow">
          <div className="promo-shell promo-workflow__inner">
            <SectionIntro
              eyebrow={content.workflow.eyebrow}
              title={content.workflow.title}
              body={content.workflow.body}
            />
            <div className="promo-workflow__steps">
              {content.workflow.steps.map((step, index) => (
                <article key={step.id} className="promo-workflow-step">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
            <div className="promo-stack-strip" aria-label={content.workflow.stackLabel}>
              <div>
                <span>{content.workflow.stackLabel}</span>
                <strong>{uiText.openSourceSummary}</strong>
              </div>
              <div className="promo-stack-strip__meta">
                <ul>
                  {content.workflow.stack.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <a
                  href={PERSONAL_NEWS_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  {uiText.repositoryLabel}
                  <ExternalIcon />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="promo-section promo-versions">
          <div className="promo-shell">
            <SectionIntro
              eyebrow={content.versions.eyebrow}
              title={content.versions.title}
              body={content.versions.body}
              tone="light"
            />
            <div className="promo-versions__layout">
              {featuredVersion && (
                <article className="promo-version-card promo-version-card--featured">
                  <span>{featuredVersion.label}</span>
                  <h3>{featuredVersion.title}</h3>
                  <p>{featuredVersion.description}</p>
                  {featuredVersion.platformLinks && (
                    <div
                      className="promo-version-card__platforms"
                      aria-label={uiText.downloadsLabel}
                    >
                      {featuredVersion.platformLinks.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {link.label}
                          <ExternalIcon />
                        </a>
                      ))}
                    </div>
                  )}
                  <a
                    href={featuredVersion.href}
                    target="_blank"
                    rel="noreferrer"
                    className="promo-version-card__main-link"
                  >
                    {featuredVersion.linkLabel}
                    <ExternalIcon />
                  </a>
                </article>
              )}
              <div className="promo-versions__secondary">
                {secondaryVersions.map((version) => (
                  <article key={version.id} className="promo-version-card">
                    <span>{version.label}</span>
                    <h3>{version.title}</h3>
                    <p>{version.description}</p>
                    <a
                      href={version.href}
                      target="_blank"
                      rel="noreferrer"
                      className="promo-version-card__main-link"
                    >
                      {version.linkLabel}
                      <ExternalIcon />
                    </a>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="project"
          className="promo-section promo-project"
          data-testid="promo-section-project"
        >
          <div className="promo-shell promo-project__inner">
            <div>
              <SectionIntro
                eyebrow={content.project.eyebrow}
                title={content.project.title}
                body={content.project.body}
              />
              <div className="promo-author-card">
                <img
                  src="https://avatars.githubusercontent.com/u/563991?v=4"
                  alt={content.project.authorName}
                  loading="lazy"
                />
                <div>
                  <strong>{content.project.authorName}</strong>
                  <span>{content.project.authorMeta}</span>
                  <a
                    href={DEVELOPER_GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {content.project.authorLinkLabel}
                    <ExternalIcon />
                  </a>
                </div>
              </div>
            </div>

            <div className="promo-related-projects">
              <h3>{content.project.projectsTitle}</h3>
              {content.project.projects.map((project) => (
                <a
                  key={project.id}
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  className="promo-related-project"
                >
                  <div>
                    <strong>{project.title}</strong>
                    <p>{project.description}</p>
                  </div>
                  <span>
                    {project.linkLabel}
                    <ExternalIcon />
                  </span>
                </a>
              ))}
              <a
                href={DEVELOPER_GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="promo-related-project promo-related-project--more"
              >
                <div>
                  <strong>{content.project.allProjectsLabel}</strong>
                  <p>{uiText.githubListNote}</p>
                </div>
                <span>
                  GitHub
                  <ExternalIcon />
                </span>
              </a>
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="promo-section promo-faq promo-shell"
          data-testid="promo-section-faq"
        >
          <SectionIntro
            eyebrow={content.faq.eyebrow}
            title={content.faq.title}
            body={content.faq.body}
          />
          <div className="promo-faq__items">
            {content.faq.items.map((item) => (
              <details key={item.question} className="promo-faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer ref={footerRef} className="promo-footer">
        <PromoLiquidMeshBackdrop className="promo-liquid-mesh--footer" />
        <div className="promo-shell promo-footer__inner">
          <div className="promo-footer__brand">
            <Logo size="sm" />
            <div>
              <strong>{APP_BRAND_NAME}</strong>
              <p>{content.footer.blurb}</p>
              <small>{content.footer.copyright}</small>
            </div>
          </div>

          <div className="promo-footer__columns">
            {content.footer.columns.map((column) => (
              <div key={column.id} className="promo-footer__column">
                <span>{column.title}</span>
                {column.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                    onClick={(event) => handleFooterLink(event, link.href)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export { LandingPage };
