import React from "react";
import Logo from "../Logo";
import { useLanguage } from "../../hooks/useLanguage";
import {
  APP_BRAND_NAME,
  DEVELOPER_GITHUB_URL,
  DEVELOPER_HANDLE,
} from "../../config/brand";
import {
  getPromoContent,
  PROMO_PAGE_HASHES,
  PROMO_PAGE_ORDER,
  type PromoPageId,
} from "../../config/promoContent";

type Commit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
};

interface LandingPageProps {
  onOpenFeed: () => void;
  onFooterVisible?: () => void;
  onHomeDataReady?: () => void;
}

const FALLBACK_COMMITS: Commit[] = [
  {
    sha: "2573e68",
    html_url:
      "https://github.com/mafhper/personalnews/commit/2573e68dae43f6d1bc4bb5a916714ab7c750bcd1",
    commit: {
      message:
        "Merge pull request #13 from mafhper/dependabot/npm_and_yarn/dompurify-3.3.2",
      author: {
        name: "Matheus :P Lima",
        date: "2026-03-07T20:56:17Z",
      },
    },
  },
  {
    sha: "75f59b6",
    html_url:
      "https://github.com/mafhper/personalnews/commit/75f59b6d5b036fed2cd92e6b8b90e26ee5245e27",
    commit: {
      message: "chore(deps): bump dompurify from 3.3.1 to 3.3.2",
      author: {
        name: "dependabot[bot]",
        date: "2026-03-07T20:55:54Z",
      },
    },
  },
  {
    sha: "0e33478",
    html_url:
      "https://github.com/mafhper/personalnews/commit/0e33478c72295cfbedcdf77980e834a812f02a4f",
    commit: {
      message:
        "Merge pull request #12 from mafhper/dependabot/npm_and_yarn/quality-core/dashboard/multi-dae47d5549",
      author: {
        name: "Matheus :P Lima",
        date: "2026-03-07T18:30:42Z",
      },
    },
  },
  {
    sha: "fdcbb66",
    html_url:
      "https://github.com/mafhper/personalnews/commit/fdcbb66e17ca35bf154a07b97ed28273c3e58157",
    commit: {
      message:
        "chore(deps): bump @tootallnate/once and jsdom in /quality-core/dashboard",
      author: {
        name: "dependabot[bot]",
        date: "2026-03-05T17:03:42Z",
      },
    },
  },
];

type IconProps = {
  className?: string;
};

const ArrowIcon = ({ className = "" }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M5 12H19"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M13 6L19 12L13 18"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronIcon = ({ className = "" }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M6 9L12 15L18 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ExternalIcon = ({ className = "" }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M14 5H19V10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 14L19 5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 14V18C19 18.5304 18.7893 19.0391 18.4142 19.4142C18.0391 19.7893 17.5304 20 17 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18V7C4 6.46957 4.21071 5.96086 4.58579 5.58579C4.96086 5.21071 5.46957 5 6 5H10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const VersionIcon = ({
  type,
  className = "",
}: IconProps & { type: "repo" | "web" | "desktop" }) => {
  if (type === "web") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M3.75 12H20.25"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M12 3.75C14.413 6.06867 15.7825 9.27598 15.7825 12.625C15.7825 15.974 14.413 19.1813 12 21.5C9.58703 19.1813 8.21753 15.974 8.21753 12.625C8.21753 9.27598 9.58703 6.06867 12 3.75Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "desktop") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
        <rect
          x="3.5"
          y="4.25"
          width="17"
          height="11.5"
          rx="2.25"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M9 19.5H15"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M12 15.75V19.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 5H5.5C4.94772 5 4.5 5.44772 4.5 6V18C4.5 18.5523 4.94772 19 5.5 19H18.5C19.0523 19 19.5 18.5523 19.5 18V10.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 5H18.5V9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14L18.5 5.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const resolvePromoPageFromHash = (): PromoPageId => {
  if (typeof window === "undefined") return "home";
  const hash = window.location.hash.toLowerCase();
  if (hash === PROMO_PAGE_HASHES.experience) return "experience";
  if (hash === PROMO_PAGE_HASHES.project) return "project";
  if (hash === PROMO_PAGE_HASHES.faq) return "faq";
  return "home";
};

const formatCommitTitle = (message: string) => {
  const lines = message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1 && lines[0].startsWith("Merge pull request")) {
    return lines[1];
  }

  return lines[0] ?? message;
};

const formatCommitDate = (value: string, language: string) =>
  new Intl.DateTimeFormat(language === "pt-BR" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const PageIntro = ({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) => (
  <section className="promo-page-intro promo-shell">
    <div className="promo-page-intro__copy">
      <div className="promo-eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  </section>
);

const HeroVisual = ({ src, alt }: { src: string; alt: string }) => (
  <div className="promo-hero-shot">
    <div className="promo-hero-shot__glow" aria-hidden="true" />
    <div className="promo-hero-shot__surface">
      <img src={src} alt={alt} loading="eager" />
    </div>
  </div>
);

const ReadingRhythmIllustration = () => (
  <div className="promo-illustration-card promo-reading-illustration" aria-hidden="true">
    <div className="promo-reading-illustration__header">
      <span />
      <span />
    </div>
    <div className="promo-reading-illustration__lead" />
    <div className="promo-reading-illustration__meta">
      <span />
      <span />
      <span />
    </div>
    <div className="promo-reading-illustration__grid">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index}>
          <span />
          <small />
        </div>
      ))}
    </div>
  </div>
);

const LayoutIllustration = ({
  variant,
}: {
  variant: "editorial" | "grid" | "minimal" | "immersive" | "split" | "compact" | "split-list";
}) => (
  <div className={`promo-layout-illustration promo-layout-illustration--${variant}`} aria-hidden="true">
    <div className="promo-layout-illustration__header">
      <span />
      <span />
      <span />
    </div>
    {variant === "editorial" && (
      <div className="promo-layout-illustration__editorial">
        <div className="promo-layout-illustration__hero" />
        <div className="promo-layout-illustration__rail">
          <span />
          <span />
          <span />
        </div>
      </div>
    )}
    {variant === "grid" && (
      <div className="promo-layout-illustration__grid">
        {Array.from({ length: 9 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
    )}
    {variant === "minimal" && (
      <div className="promo-layout-illustration__minimal">
        <div className="promo-layout-illustration__mini-hero" />
        <div className="promo-layout-illustration__list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index}>
              <span />
              <small />
            </div>
          ))}
        </div>
      </div>
    )}
    {variant === "immersive" && (
      <div className="promo-layout-illustration__immersive">
        <div className="promo-layout-illustration__hero" />
        <div className="promo-layout-illustration__overlay">
          <span />
          <small />
        </div>
      </div>
    )}
    {variant === "split" && (
      <div className="promo-layout-illustration__split">
        <div className="promo-layout-illustration__lead" />
        <div className="promo-layout-illustration__list">
          <div className="promo-layout-illustration__list-item"><span /><small /></div>
          <div className="promo-layout-illustration__list-item"><span /><small /></div>
          <div className="promo-layout-illustration__list-item"><span /><small /></div>
        </div>
      </div>
    )}
    {variant === "compact" && (
      <div className="promo-layout-illustration__compact">
        {Array.from({ length: 12 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
    )}
    {variant === "split-list" && (
      <div className="promo-layout-illustration__split">
        <div className="promo-layout-illustration__lead" />
        <div className="promo-layout-illustration__minimal">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index}><span /><small /></div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const ThemeIllustration = () => {
  return (
    <div className="promo-illustration-card promo-theme-illustration" aria-hidden="true">
      <div className="promo-theme-illustration__row">
        <div className="promo-theme-illustration__swatch promo-theme-illustration__swatch--dark">
          <span />
          <small />
          <small />
        </div>
        <div className="promo-theme-illustration__swatch promo-theme-illustration__swatch--light">
          <span />
          <small />
          <small />
        </div>
      </div>
      <div className="promo-theme-illustration__controls">
        <div className="promo-theme-illustration__slider">
          <small />
          <div>
            <i />
          </div>
        </div>
        <div className="promo-theme-illustration__slider">
          <small />
          <div>
            <i style={{ left: "60%" }} />
          </div>
        </div>
      </div>
      <div className="promo-theme-illustration__toggles">
        <span />
        <span className="promo-theme-illustration__toggles--active" />
      </div>
    </div>
  );
};

const OnboardingIllustration = () => {
  return (
    <div className="promo-illustration-card promo-onboarding-illustration" aria-hidden="true">
      <div className="promo-onboarding-illustration__modal">
        <div className="promo-onboarding-illustration__header">
          <span className="title" />
          <span className="badge" />
        </div>
        <div className="promo-onboarding-illustration__list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="promo-onboarding-illustration__row">
              <div className="promo-onboarding-illustration__check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 6L9 17l-5-5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="promo-onboarding-illustration__content">
                <span className="name" />
                <span className="url" />
              </div>
            </div>
          ))}
        </div>
        <div className="promo-onboarding-illustration__footer">
          <div className="promo-onboarding-illustration__status">
            <span />
            <small />
          </div>
          <div className="promo-onboarding-illustration__button" />
        </div>
      </div>
    </div>
  );
};

const StackIllustration = () => {
  return (
    <div className="promo-illustration-card promo-stack-illustration" aria-hidden="true">
      <div className="promo-stack-illustration__header">
        <span>personalnews</span>
        <small>React + Vite + Bun</small>
      </div>
      <div className="promo-stack-illustration__layers">
        <div className="promo-stack-illustration__layer promo-stack-illustration__layer--ui">
          <small>UI</small>
          <span>React + TypeScript</span>
        </div>
        <div className="promo-stack-illustration__layer promo-stack-illustration__layer--build">
          <small>Build</small>
          <span>Vite</span>
        </div>
        <div className="promo-stack-illustration__layer promo-stack-illustration__layer--runtime">
          <small>Runtime</small>
          <span>Bun</span>
        </div>
        <div className="promo-stack-illustration__layer promo-stack-illustration__layer--quality">
          <small>Quality</small>
          <span>Quality Core</span>
        </div>
      </div>
    </div>
  );
};

const QualityIllustration = () => {
  return (
    <div className="promo-illustration-card promo-quality-illustration" aria-hidden="true">
      <div className="promo-quality-illustration__header">
        <span />
        <small />
      </div>
      <div className="promo-quality-illustration__checks">
        {["Tipografia", "Grid", "Estados", "Contraste"].map((label) => (
          <div key={label} className="promo-quality-illustration__check-row">
            <div className="promo-quality-illustration__badge" />
            <div>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="promo-quality-illustration__bar">
        <div className="promo-quality-illustration__bar-fill" />
      </div>
    </div>
  );
};

const LandingPage = ({
  onOpenFeed,
  onFooterVisible,
  onHomeDataReady
}: LandingPageProps) => {
  const { language } = useLanguage();
  const content = React.useMemo(() => getPromoContent(language), [language]);
  const [activePage, setActivePage] = React.useState<PromoPageId>(
    resolvePromoPageFromHash,
  );
  const [commits, setCommits] = React.useState<Commit[]>(FALLBACK_COMMITS);
  const [commitStatus, setCommitStatus] = React.useState<
    "syncing" | "live" | "fallback"
  >("syncing");
  const footerRef = React.useRef<HTMLElement | null>(null);
  const footerTriggeredRef = React.useRef(false);
  const homeReadyTriggeredRef = React.useRef(false);
  const commitSyncStartedRef = React.useRef(false);
  const promoScreen = `${import.meta.env.BASE_URL}assets/screen.png`;
  const [openFaqId, setOpenFaqId] = React.useState<string | null>(null);

  const navigateToPromoPage = React.useCallback((page: PromoPageId) => {
    if (typeof window === "undefined") return;

    const nextHash = PROMO_PAGE_HASHES[page];
    if (window.location.hash.toLowerCase() === nextHash) {
      setActivePage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.location.hash = nextHash;
  }, []);

  React.useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.toLowerCase() === "#feed") return;
      setActivePage(resolvePromoPageFromHash());
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activePage]);

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

  React.useEffect(() => {
    if (commitSyncStartedRef.current) return;
    commitSyncStartedRef.current = true;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4500);

    const syncCommits = async () => {
      try {
        const response = (await fetch(
          "https://api.github.com/repos/mafhper/personalnews/commits?per_page=4",
          {
            headers: {
              Accept: "application/vnd.github+json",
            },
            signal: controller.signal,
          },
        )) as Response;

        if (!response.ok) {
          throw new Error(`Commit fetch failed: ${response.status}`);
        }

        const payload = (await response.json()) as Commit[];
        if (payload.length > 0) {
          setCommits(payload);
          setCommitStatus("live");
          return;
        }

        setCommitStatus("fallback");
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch landing commits", error);
        }
        setCommitStatus("fallback");
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    void syncCommits();

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, []);

  const renderHomePage = () => (
    <div className="promo-page promo-page--home" data-testid="promo-page-home">
      <section className="promo-home-hero promo-shell" data-testid="promo-hero">
        <div className="promo-home-hero__copy">
          <div className="promo-eyebrow">{content.home.eyebrow}</div>
          <h1>{content.home.title}</h1>
          <p className="promo-home-hero__lead">{content.home.lead}</p>
          <p className="promo-home-hero__subtitle">{content.home.subtitle}</p>
          <ul className="promo-tag-row" aria-label="Promo tags">
            {content.home.tags.map((tag) => (
              <li key={tag.id} className="promo-tag">
                {tag.label}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="promo-primary-button"
            onClick={onOpenFeed}
          >
            <span>{content.home.ctaLabel}</span>
            <ArrowIcon />
          </button>
        </div>

        <div className="promo-home-hero__visual">
          <HeroVisual src={promoScreen} alt={content.home.imageAlt} />
        </div>
      </section>

      <section className="promo-feature-row promo-shell">
        <div className="promo-feature-row__copy">
          <div className="promo-section__eyebrow">{content.home.purposeEyebrow}</div>
          <h2>{content.home.purposeTitle}</h2>
          <p>{content.home.purposeBody}</p>
          <p>{content.home.purposeSupport}</p>
        </div>
        <div className="promo-feature-row__visual">
          <ReadingRhythmIllustration />
        </div>
      </section>

      <section className="promo-versions promo-shell">
        <div className="promo-versions__copy">
          <div className="promo-section__eyebrow">{content.home.availabilityEyebrow}</div>
          <h2>{content.home.availabilityTitle}</h2>
          <p>{content.home.availabilityBody}</p>
        </div>

        <div className="promo-versions__grid">
          {content.home.versions.map((version) => (
            <a
              key={version.id}
              href={version.href}
              target="_blank"
              rel="noreferrer"
              className="promo-version-card"
            >
              <div className="promo-version-card__icon">
                <VersionIcon type={version.icon} />
              </div>
              <div className="promo-version-card__label">{version.label}</div>
              <strong>{version.title}</strong>
              <p>{version.description}</p>
              <span className="promo-link-inline">
                {version.linkLabel}
                <ExternalIcon />
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );

  const renderExperiencePage = () => (
    <div
      className="promo-page promo-page--experience"
      data-testid="promo-page-experience"
    >
      <PageIntro
        eyebrow={content.experience.eyebrow}
        title={content.experience.title}
        subtitle={content.experience.subtitle}
      />

      <section className="promo-layout-gallery promo-shell">
        {content.experience.families.map((family) => (
          <article key={family.id} className="promo-layout-family-card">
            <div className="promo-layout-family-card__copy min-h-[160px] flex flex-col justify-start">
              <span className="promo-layout-family-card__label">{family.label}</span>
              <h2>{family.title}</h2>
              <p className="line-clamp-3">{family.description}</p>
            </div>
            <LayoutIllustration variant={family.variant} />
          </article>
        ))}
      </section>

      <section className="promo-layouts-cta promo-shell">
        <div className="promo-layouts-cta__text">
          <p>{content.experience.familiesCta}</p>
          <small>{content.experience.familiesOthers}</small>
        </div>
        <button
          type="button"
          className="promo-primary-button"
          onClick={onOpenFeed}
        >
          <span>{content.experience.familiesCtaLabel}</span>
          <ArrowIcon />
        </button>
      </section>

      <section className="promo-feature-row promo-shell">
        <div className="promo-feature-row__copy">
          <div className="promo-section__eyebrow">{content.experience.tuningEyebrow}</div>
          <h2>{content.experience.tuningTitle}</h2>
          <p>{content.experience.tuningBody}</p>
          <ul className="promo-bullet-list" aria-label="Customização">
            {content.experience.tuningPoints.map((point) => (
              <li key={point.id}>{point.label}</li>
            ))}
          </ul>
        </div>
        <div className="promo-feature-row__visual">
          <ThemeIllustration />
        </div>
      </section>

      <section className="promo-feature-row promo-feature-row--reverse promo-shell">
        <div className="promo-feature-row__copy">
          <div className="promo-section__eyebrow">{content.experience.onboardingEyebrow}</div>
          <h2>{content.experience.onboardingTitle}</h2>
          <p>{content.experience.onboardingBody}</p>
          <p>{content.experience.onboardingSupport}</p>
        </div>
        <div className="promo-feature-row__visual">
          <OnboardingIllustration />
        </div>
      </section>
    </div>
  );

  const renderProjectPage = () => (
    <div className="promo-page promo-page--project" data-testid="promo-page-project">
      <PageIntro
        eyebrow={content.project.eyebrow}
        title={content.project.title}
        subtitle={content.project.subtitle}
      />

      <section className="promo-feature-row promo-shell">
        <div className="promo-feature-row__copy">
          <div className="promo-section__eyebrow">{content.project.technologyEyebrow}</div>
          <h2>{content.project.technologyTitle}</h2>
          <p>{content.project.technologyBody}</p>
          <ul className="promo-tag-row promo-tag-row--stack" aria-label="Stack">
            {content.project.stackTokens.map((token) => (
              <li key={token.id} className="promo-tag promo-tag--stack">
                {token.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="promo-feature-row__visual">
          <StackIllustration />
        </div>
      </section>

      <section className="promo-feature-row promo-feature-row--reverse promo-shell">
        <div className="promo-feature-row__copy">
          <div className="promo-section__eyebrow">{content.project.qualityEyebrow}</div>
          <h2>{content.project.qualityTitle}</h2>
          <p>{content.project.qualityBody}</p>
          <ul className="promo-bullet-list" aria-label="Qualidade">
            {content.project.qualityPoints.map((point) => (
              <li key={point.id}>{point.label}</li>
            ))}
          </ul>
        </div>
        <div className="promo-feature-row__visual">
          <QualityIllustration />
        </div>
      </section>

      <section
        className="promo-commits promo-shell"
        data-testid="promo-commits-section"
      >
        <div className="promo-commits__copy">
          <div className="promo-section__eyebrow">{content.project.commitsEyebrow}</div>
          <h2>{content.project.commitsTitle}</h2>
          <p>{content.project.commitsBody}</p>
          <div className="promo-commits__status">
            {commitStatus === "syncing" && content.project.commitsSyncing}
            {commitStatus === "fallback" && content.project.commitsFallback}
            {commitStatus === "live" && content.project.commitsLive}
          </div>
        </div>

        <div className="promo-commit-list">
          {commits.map((commit) => (
            <a
              key={commit.sha}
              href={commit.html_url}
              target="_blank"
              rel="noreferrer"
              className="promo-commit-card"
            >
              <div className="promo-commit-card__meta">
                <span>{commit.commit.author.name}</span>
                <small>{formatCommitDate(commit.commit.author.date, language)}</small>
              </div>
              <strong>{formatCommitTitle(commit.commit.message)}</strong>
              <span className="promo-link-inline">
                {content.project.commitLinkLabel}
                <ExternalIcon />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="promo-projects promo-shell">
        <div className="promo-projects__copy">
          <div className="promo-section__eyebrow">{content.project.projectsEyebrow}</div>
          <h2>{content.project.projectsTitle}</h2>
          <p>{content.project.projectsBody}</p>
        </div>

        <div className="promo-projects__grid">
          {content.project.projects.map((project) => (
            <a
              key={project.id}
              href={project.href}
              target="_blank"
              rel="noreferrer"
              className="promo-project-card"
            >
              <div>
                <strong>{project.title}</strong>
                <p>{project.description}</p>
              </div>
              <span className="promo-link-inline">
                {project.linkLabel}
                <ExternalIcon />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="promo-about promo-shell">
        <div className="promo-about__copy">
          <div className="promo-section__eyebrow">{content.project.aboutEyebrow}</div>
          <h2>{content.project.aboutTitle}</h2>
          <p>{content.project.aboutBody}</p>
          <p>{content.project.aboutSupport}</p>
        </div>

        <div className="promo-about-card">
          <div className="promo-about-card__identity">
            <img
              src="https://avatars.githubusercontent.com/u/563991?v=4"
              alt={DEVELOPER_HANDLE}
              loading="lazy"
            />
            <div>
              <span>{DEVELOPER_HANDLE}</span>
              <strong>{APP_BRAND_NAME}</strong>
              <small>{content.project.aboutMeta}</small>
            </div>
          </div>
          <a
            href={DEVELOPER_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="promo-about-card__link"
          >
            <span>{content.project.aboutLinkLabel}</span>
            <ExternalIcon />
          </a>
        </div>
      </section>
    </div>
  );

  const toggleFaqItem = (id: string) => {
    setOpenFaqId((current) => (current === id ? null : id));
  };

  const renderFaqPage = () => (
    <div className="promo-page promo-page--faq" data-testid="promo-page-faq">
      <PageIntro
        eyebrow={content.faq.eyebrow}
        title={content.faq.title}
        subtitle={content.faq.subtitle}
      />

      <section className="promo-faq promo-shell">
        {content.faq.groups.map((group) => (
          <article key={group.id} className="promo-faq-group">
            <div className="promo-faq-group__head">
              <div className="promo-section__eyebrow">{group.title}</div>
            </div>
            <div className="promo-faq-group__items">
              {group.items.map((item) => {
                const itemId = `${group.id}-${item.question}`;
                const isOpen = openFaqId === itemId;
                return (
                  <div
                    key={item.question}
                    className={`promo-faq-item ${isOpen ? "is-open" : ""}`}
                  >
                    <button
                      type="button"
                      className="promo-faq-item__trigger"
                      aria-expanded={isOpen}
                      onClick={() => toggleFaqItem(itemId)}
                    >
                      <span>{item.question}</span>
                      <ChevronIcon className="promo-faq-item__chevron" />
                    </button>
                    <div className="promo-faq-item__content">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </div>
  );

  const renderActivePage = () => {
    switch (activePage) {
      case "experience":
        return renderExperiencePage();
      case "project":
        return renderProjectPage();
      case "faq":
        return renderFaqPage();
      case "home":
      default:
        return renderHomePage();
    }
  };

  return (
    <div className="promo-root">
      <div className="promo-aurora promo-aurora--primary" aria-hidden="true" />
      <div className="promo-aurora promo-aurora--secondary" aria-hidden="true" />
      <div className="promo-grid" aria-hidden="true" />

      <header className="promo-header">
        <div className="promo-shell promo-header__inner">
          <a
            href={PROMO_PAGE_HASHES.home}
            className="promo-brand"
            onClick={(event) => {
              event.preventDefault();
              navigateToPromoPage("home");
            }}
          >
            <span className="promo-brand__mark">
              <Logo size="sm" />
            </span>
            <span className="promo-brand__text">
              <strong>{content.nav.brandLabel}</strong>
            </span>
          </a>

          <nav className="promo-nav" aria-label="Promo navigation">
            {PROMO_PAGE_ORDER.map((page) => (
              <a
                key={page}
                href={PROMO_PAGE_HASHES[page]}
                className={`promo-nav__link ${activePage === page ? "is-active" : ""}`}
                aria-current={activePage === page ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  navigateToPromoPage(page);
                }}
              >
                {content.nav.pages[page]}
              </a>
            ))}
          </nav>

          <div className="promo-header__actions">
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

      <main className="promo-main">{renderActivePage()}</main>

      <footer ref={footerRef} className="promo-footer">
        <div className="promo-shell promo-footer__inner">
          <div className="promo-footer__brand">
            <div className="promo-footer__brand-mark">
              <Logo size="sm" />
            </div>
            <div>
              <strong>{APP_BRAND_NAME}</strong>
              <p>{content.footer.blurb}</p>
              <small>{content.footer.copyright}</small>
            </div>
          </div>

          <div className="promo-footer__columns">
            {content.footer.columns.map((column) => (
              <div key={column.id} className="promo-footer__column">
                <div className="promo-footer__column-title">{column.title}</div>
                {column.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                    onClick={
                      !link.href.startsWith("http")
                        ? (event) => {
                            event.preventDefault();
                            const hash = link.href.replace("#", "") as import("../../config/promoContent").PromoPageId;
                            navigateToPromoPage(hash);
                          }
                        : undefined
                    }
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
