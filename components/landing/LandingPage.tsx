import React from "react";
import {
  ArrowRight,
  BookOpen,
  CircuitBoard,
  ChevronDown,
  Github,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { DEFAULT_HEADER_CONFIG } from "../../config/defaultConfig";
import type { HeaderConfig } from "../../types";
import Logo from "../Logo";

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

const formatCommitTitle = (message: string) => message.split("\n")[0]?.slice(0, 120);

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenFeed,
  onFooterVisible,
  onHomeDataReady,
}) => {
  const { t } = useLanguage();
  const [headerConfig] = useLocalStorage<HeaderConfig>(
    "appearance-header",
    DEFAULT_HEADER_CONFIG,
  );

  const [commits, setCommits] = React.useState<Commit[]>([]);
  const [commitsState, setCommitsState] = React.useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const commitsRef = React.useRef<HTMLDivElement | null>(null);
  const footerRef = React.useRef<HTMLElement | null>(null);
  const footerTriggeredRef = React.useRef(false);
  const homeReadyTriggeredRef = React.useRef(false);
  const [activeSection, setActiveSection] = React.useState("home");
  const [expandedTech, setExpandedTech] = React.useState<Set<string>>(
    () => new Set(),
  );

  const sections = React.useMemo(
    () => [
      { id: "home", label: t("landing.nav.home") },
      { id: "tech", label: t("landing.nav.tech") },
      { id: "custom", label: t("landing.nav.custom") },
      { id: "about", label: t("landing.nav.about") },
    ],
    [t],
  );

  const stacks = React.useMemo(
    () => [
      {
        id: "react",
        title: t("landing.tech.react.title"),
        summary: t("landing.tech.react.summary"),
        details: [
          t("landing.tech.react.detail1"),
          t("landing.tech.react.detail2"),
        ],
        icon: Sparkles,
      },
      {
        id: "vite",
        title: t("landing.tech.vite.title"),
        summary: t("landing.tech.vite.summary"),
        details: [
          t("landing.tech.vite.detail1"),
          t("landing.tech.vite.detail2"),
        ],
        icon: Zap,
      },
      {
        id: "feed",
        title: t("landing.tech.feed.title"),
        summary: t("landing.tech.feed.summary"),
        details: [
          t("landing.tech.feed.detail1"),
          t("landing.tech.feed.detail2"),
          t("landing.tech.feed.detail3"),
        ],
        icon: ShieldCheck,
      },
      {
        id: "quality",
        title: t("landing.tech.quality.title"),
        summary: t("landing.tech.quality.summary"),
        details: [
          t("landing.tech.quality.detail1"),
          t("landing.tech.quality.detail2"),
        ],
        icon: CircuitBoard,
      },
    ],
    [t],
  );

  const customizations = React.useMemo(
    () => [
      {
        title: t("landing.custom.layouts.title"),
        description: t("landing.custom.layouts.description"),
        icon: LayoutGrid,
      },
      {
        title: t("landing.custom.reading.title"),
        description: t("landing.custom.reading.description"),
        icon: BookOpen,
      },
      {
        title: t("landing.custom.motion.title"),
        description: t("landing.custom.motion.description"),
        icon: Wand2,
      },
    ],
    [t],
  );

  const projects = React.useMemo(
    () => [
      {
        id: "spread",
        title: "Spread",
        description: t("landing.projects.spread.description"),
        href: "https://mafhper.github.io/spread/",
        tags: [
          t("landing.tags.productivity"),
          t("landing.tags.react"),
          t("landing.tags.designSystem"),
        ],
      },
      {
        id: "aurawall",
        title: "AuraWall",
        description: t("landing.projects.aurawall.description"),
        href: "https://mafhper.github.io/aurawall/",
        tags: [
          t("landing.tags.wallpapers"),
          t("landing.tags.canvas"),
          t("landing.tags.motion"),
        ],
      },
    ],
    [t],
  );

  const notifyHomeDataReady = React.useCallback(() => {
    if (!onHomeDataReady || homeReadyTriggeredRef.current) return;
    homeReadyTriggeredRef.current = true;
    onHomeDataReady();
  }, [onHomeDataReady]);

  React.useEffect(() => {
    if (!onHomeDataReady) return;

    if (document.readyState === "complete") {
      notifyHomeDataReady();
      return;
    }

    window.addEventListener("load", notifyHomeDataReady, { once: true });
    return () => window.removeEventListener("load", notifyHomeDataReady);
  }, [onHomeDataReady, notifyHomeDataReady]);

  React.useEffect(() => {
    const node = commitsRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) {
          setCommitsState((prev) => (prev === "idle" ? "loading" : prev));
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (commitsState !== "loading") return;

    const controller = new AbortController();
    const globalScope = globalThis as typeof globalThis & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const runFetch = () => {
      fetch("https://api.github.com/repos/mafhper/personalnews/commits?per_page=3", {
        signal: controller.signal,
        headers: {
          Accept: "application/vnd.github+json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Commit fetch failed: ${response.status}`);
          }
          return response.json();
        })
        .then((data: Commit[]) => {
          setCommits(data.slice(0, 3));
          setCommitsState("ready");
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setCommitsState("error");
        });
    };

    if (typeof globalScope.requestIdleCallback === "function") {
      idleId = globalScope.requestIdleCallback(runFetch, { timeout: 1500 });
    } else {
      timeoutId = setTimeout(runFetch, 0);
    }

    return () => {
      controller.abort();
      if (idleId !== null && typeof globalScope.cancelIdleCallback === "function") {
        globalScope.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [commitsState]);

  React.useEffect(() => {
    if (commitsState !== "ready" && commitsState !== "error") return;
    notifyHomeDataReady();
  }, [commitsState, notifyHomeDataReady]);

  React.useEffect(() => {
    const sectionElements = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean) as HTMLElement[];

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        threshold: [0.2, 0.4, 0.6, 0.8],
        rootMargin: "-20% 0px -60% 0px",
      },
    );

    sectionElements.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [sections]);

  React.useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const node = footerRef.current;
    if (!node || !onFooterVisible) return;

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

    observer.observe(node);
    return () => observer.disconnect();
  }, [onFooterVisible]);

  const brandTitle = headerConfig.customTitle || t("app.title");
  const isGradientTitle = headerConfig.titleGradient?.enabled;
  const titleStyle = isGradientTitle
    ? {
        backgroundImage: `linear-gradient(${headerConfig.titleGradient?.direction || "to right"}, ${headerConfig.titleGradient?.from}, ${headerConfig.titleGradient?.to})`,
      }
    : { color: headerConfig.titleColor || "rgb(var(--color-text))" };

  const toggleTech = (id: string) => {
    setExpandedTech((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="landing-root text-white">
      <div className="landing-aurora" aria-hidden="true" />
      <div className="landing-aurora landing-aurora--secondary" aria-hidden="true" />
      <div className="landing-grid" aria-hidden="true" />

      <header className="landing-header">
        <div className="landing-container flex items-center justify-between gap-6">
          <a
            href="#home"
            className="flex min-h-11 items-center gap-3 py-1 text-sm font-semibold text-white/80"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Logo size="sm" useThemeColor={headerConfig.useThemeColor} />
            </span>
            <span
              className={`landing-brand-title ${isGradientTitle ? "landing-brand-title--gradient" : ""}`}
              style={titleStyle}
            >
              {brandTitle}
            </span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`landing-nav-link ${
                  activeSection === section.id ? "landing-nav-link--active" : ""
                }`}
                aria-current={activeSection === section.id ? "page" : undefined}
              >
                {section.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={onOpenFeed}
            className="landing-cta-button"
          >
            {t("landing.nav.feed")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="landing-container pb-24 pt-32 md:pb-32 md:pt-40">
        <section
          id="home"
          className="landing-section grid gap-12 md:grid-cols-[1.05fr_0.95fr]"
          data-reveal
        >
          <div className="space-y-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              {t("landing.hero.badge")}
            </p>
            <h1 className="landing-hero-title text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
              {t("landing.hero.title")}
            </h1>
            <p className="max-w-xl text-base text-white/70 md:text-lg">
              {t("landing.hero.description")}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenFeed}
                className="landing-primary-button"
              >
                {t("landing.hero.primary")}
                <ArrowRight className="h-4 w-4" />
              </button>
              <a href="#tech" className="landing-secondary-button">
                {t("landing.hero.secondary")}
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/50">
              <span>{t("landing.hero.metrics.performance")}</span>
              <span>{t("landing.hero.metrics.layouts")}</span>
              <span>{t("landing.hero.metrics.opensource")}</span>
              <span>{t("landing.hero.metrics.free")}</span>
              <span>{t("landing.hero.metrics.privacy")}</span>
              <span>{t("landing.hero.metrics.selfhosted")}</span>
            </div>
          </div>

          <div className="relative flex flex-col justify-end gap-6">
            <div className="landing-hero-card landing-float">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {brandTitle}
                  </p>
                  <h3 className="text-xl font-semibold text-white">
                    {t("landing.hero.card.title")}
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                  {t("landing.hero.card.live")}
                </span>
              </div>
              <div className="mt-6 grid gap-3">
                <div className="landing-pill">
                  {t("landing.hero.card.pill.cache")}
                </div>
                <div className="landing-pill">
                  {t("landing.hero.card.pill.layouts")}
                </div>
                <div className="landing-pill">
                  {t("landing.hero.card.pill.quality")}
                </div>
              </div>
            </div>
            <div className="landing-hero-panel">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 p-2">
                  <Sparkles className="h-full w-full text-teal-200" />
                </div>
                <div>
                  <p className="text-sm text-white/70">
                    {t("landing.hero.panel.title")}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenFeed}
                    className="inline-flex min-h-11 items-center rounded-lg px-2 text-base font-semibold text-white transition-colors hover:text-teal-200"
                  >
                    {t("landing.hero.panel.cta")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="tech"
          className="landing-section mt-24 grid gap-8 rounded-[32px] border border-white/10 bg-white/5 p-8 md:mt-32 md:p-12"
          data-reveal
        >
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              {t("landing.tech.label")}
            </p>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">
              {t("landing.tech.title")}
            </h2>
            <p className="max-w-2xl text-sm text-white/70 md:text-base">
              {t("landing.tech.description")}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {stacks.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedTech.has(item.id);
              const detailsId = `landing-tech-${item.id}`;
              return (
                <div key={item.id} className="landing-card landing-card--expand">
                  <button
                    type="button"
                    className="landing-card-toggle"
                    onClick={() => toggleTech(item.id)}
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                  >
                    <span className="landing-card-icon">
                      <Icon className="h-5 w-5 text-teal-200" />
                    </span>
                    <span className="flex-1 text-left">
                      <span className="block text-lg font-semibold text-white">
                        {item.title}
                      </span>
                      <span className="block text-sm text-white/65">
                        {item.summary}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-white/60 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div id={detailsId} className="landing-card-details">
                      {item.details.map((detail) => (
                        <p key={detail} className="text-sm text-white/60">
                          {detail}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section id="custom" className="landing-section mt-24 md:mt-32" data-reveal>
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                {t("landing.custom.label")}
              </p>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">
                {t("landing.custom.title")}
              </h2>
              <p className="max-w-xl text-sm text-white/70 md:text-base">
                {t("landing.custom.description")}
              </p>
            </div>
            <div className="grid gap-4">
              {customizations.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="landing-card landing-card--glow">
                    <div className="landing-card-icon">
                      <Icon className="h-5 w-5 text-teal-200" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {item.title}
                      </h3>
                      <p className="text-sm text-white/65">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="about"
          className="landing-section mt-24 grid gap-8 md:mt-32 md:grid-cols-[0.95fr_1.05fr]"
          data-reveal
        >
          <div className="landing-about">
            <div className="flex items-center gap-4">
              <img
                src="https://github.com/mafhper.png"
                alt={t("landing.about.avatarAlt")}
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white/20"
                loading="lazy"
                decoding="async"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  {t("landing.about.label")}
                </p>
                <h2 className="text-2xl font-semibold text-white">
                  {t("landing.about.title")}
                </h2>
                <p className="text-sm text-white/60">{t("landing.about.subtitle")}</p>
              </div>
            </div>
            <p className="text-sm text-white/70">{t("landing.about.description")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://github.com/mafhper/personalnews"
                target="_blank"
                rel="noreferrer"
                className="landing-secondary-button"
              >
                <Github className="h-4 w-4" />
                {t("landing.about.ctaRepo")}
              </a>
              <button
                type="button"
                onClick={onOpenFeed}
                className="landing-primary-button"
              >
                {t("landing.about.ctaFeed")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid gap-4">
            {projects.map((project) => (
              <a
                key={project.title}
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="landing-card landing-card--link"
              >
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {project.title}
                    </p>
                    <p className="text-xs text-white/60">
                      {project.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span key={tag} className="landing-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">
                    {t("landing.projects.cta")}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-white/60" />
              </a>
            ))}
          </div>
        </section>

        <section
          ref={commitsRef}
          className="landing-section mt-24 rounded-[32px] border border-white/10 bg-white/5 p-8 md:mt-32 md:p-12"
          data-reveal
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                {t("landing.commits.label")}
              </p>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">
                {t("landing.commits.title")}
              </h2>
            </div>
            <a
              href="https://github.com/mafhper/personalnews"
              target="_blank"
              rel="noreferrer"
              className="landing-secondary-button"
            >
              <Github className="h-4 w-4" />
              {t("landing.commits.cta")}
            </a>
          </div>

          <div className="mt-8 grid gap-4">
            {commitsState === "loading" && (
              <div className="landing-card">
                <p className="text-sm text-white/60">
                  {t("landing.commits.loading")}
                </p>
              </div>
            )}
            {commitsState === "error" && (
              <div className="landing-card">
                <p className="text-sm text-white/60">
                  {t("landing.commits.error")}
                </p>
              </div>
            )}
            {commitsState === "ready" &&
              commits.map((commit) => (
                <a
                  key={commit.sha}
                  href={commit.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="landing-card landing-card--link"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {formatCommitTitle(commit.commit.message)}
                    </p>
                    <p className="text-xs text-white/55">
                      {commit.commit.author.name} ·{" "}
                      {new Date(commit.commit.author.date).toLocaleDateString(
                        t("landing.locale") || "pt-BR",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}{" "}
                      · {commit.sha.slice(0, 7)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/60" />
                </a>
              ))}
          </div>
        </section>
      </main>

      <footer ref={footerRef} className="landing-footer" data-reveal>
        <div className="landing-container grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">
              {t("landing.footer.title")}
            </h3>
            <p className="max-w-lg text-sm text-white/65">
              {t("landing.footer.subtitle")}
            </p>
            <button
              type="button"
              onClick={onOpenFeed}
              className="landing-primary-button"
            >
              {t("landing.footer.cta")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-6 text-sm text-white/70 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                {t("landing.footer.links.title")}
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://github.com/mafhper/personalnews"
                  target="_blank"
                  rel="noreferrer"
                  className="landing-footer-link"
                >
                  {t("landing.footer.links.repo")}
                </a>
                <a
                  href="https://github.com/mafhper/personalnews/blob/main/README.md"
                  target="_blank"
                  rel="noreferrer"
                  className="landing-footer-link"
                >
                  {t("landing.footer.links.readme")}
                </a>
                <a
                  href="https://github.com/mafhper/personalnews/blob/main/README.pt-BR.md"
                  target="_blank"
                  rel="noreferrer"
                  className="landing-footer-link"
                >
                  {t("landing.footer.links.readmePt")}
                </a>
                <a
                  href="https://github.com/mafhper/personalnews/blob/main/README.es.md"
                  target="_blank"
                  rel="noreferrer"
                  className="landing-footer-link"
                >
                  {t("landing.footer.links.readmeEs")}
                </a>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                {t("landing.footer.links.community")}
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://github.com/mafhper/personalnews/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noreferrer"
                  className="landing-footer-link"
                >
                  {t("landing.footer.links.contributing")}
                </a>
                <a
                  href="https://x.com/mafhper"
                  target="_blank"
                  rel="noreferrer"
                  className="landing-footer-link"
                >
                  {t("landing.footer.links.twitter")}
                </a>
                <a
                  href="https://github.com/mafhper/personalnews/tree/main/quality-core"
                  target="_blank"
                  rel="noreferrer"
                  className="landing-footer-link"
                >
                  {t("landing.footer.links.quality")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
