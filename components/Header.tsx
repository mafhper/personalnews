import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { SearchFilters } from "./SearchBar";
import { Article, FeedCategory, FeedSource } from "../types";
import Logo from "./Logo";
import { HeaderIcons } from "./icons";
import FeedDropdown from "./FeedDropdown";
import { useAppearance } from "../hooks/useAppearance";
import { useLanguage } from "../hooks/useLanguage";
import { APP_BRAND_NAME } from "../config/brand";
import { FAVORITES_VIEW_ID, type PrimaryView } from "../hooks/usePrimaryView";

interface HeaderProps {
  onManageFeedsClick: () => void;
  onManageFeedsIconClick?: () => void;
  onRefreshClick: () => void;
  feedIssueCount?: number;
  selectedCategory: string;
  onNavigation: (category: string, feedUrl?: string) => void;
  categorizedFeeds: Record<string, FeedSource[]>;
  onOpenSettings: () => void;
  articles: Article[];
  onSearch: (query: string, filters: SearchFilters) => void;
  onSearchResultsChange?: (results: Article[]) => void;
  onOpenFavorites: () => void;
  categories: FeedCategory[];
  primaryView?: PrimaryView;
  onPrimaryViewChange?: (primaryView: PrimaryView) => void;
  onCategoryLayoutChange?: (
    categoryId: string,
    layoutMode: FeedCategory["layoutMode"] | undefined,
  ) => void;
  onGoHome?: () => void;
  onGoLanding?: () => void;
  onGoAll?: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { headerConfig } = useAppearance();
  const normalizedPositionInput = String(headerConfig.position || "")
    .trim()
    .toLowerCase();
  const headerPosition: "static" | "sticky" | "floating" | "hidden" = (() => {
    if (
      normalizedPositionInput === "static" ||
      normalizedPositionInput === "estatico" ||
      normalizedPositionInput === "estático" ||
      normalizedPositionInput.includes("static")
    ) {
      return "static";
    }
    if (
      normalizedPositionInput === "sticky" ||
      normalizedPositionInput === "fixed" ||
      normalizedPositionInput === "sticky-top" ||
      normalizedPositionInput === "fixed-top" ||
      normalizedPositionInput === "fixo" ||
      normalizedPositionInput.includes("sticky") ||
      normalizedPositionInput.includes("fix")
    ) {
      return "sticky";
    }
    if (
      normalizedPositionInput === "hidden" ||
      normalizedPositionInput === "oculto" ||
      normalizedPositionInput === "auto-hide" ||
      normalizedPositionInput.includes("hidden") ||
      normalizedPositionInput.includes("ocult")
    ) {
      return "hidden";
    }
    if (
      normalizedPositionInput === "floating" ||
      normalizedPositionInput === "flutuante" ||
      normalizedPositionInput.includes("float") ||
      normalizedPositionInput.includes("flutu")
    ) {
      return "floating";
    }
    return "floating";
  })();
  const { t } = useLanguage();
  const normalizeBrandTitle = (value?: string) => {
    const normalized = (value || "").trim();
    const compact = normalized.toLowerCase().replace(/\s+/g, "");
    const canonicalCompact = APP_BRAND_NAME.toLowerCase().replace(/\s+/g, "");
    const legacyLocalizedAliases = new Set([
      canonicalCompact,
      "noticiaspessoais",
      "notíciaspessoais",
      "personalnewsrss",
    ]);

    if (!normalized || legacyLocalizedAliases.has(compact)) {
      return APP_BRAND_NAME;
    }

    return normalized;
  };
  const resolvedBrandTitle = normalizeBrandTitle(
    headerConfig.customTitle || t("app.title"),
  );
  const [isHeaderVisible, setIsHeaderVisible] = useState(
    headerPosition !== 'hidden'
  );
  const effectiveHeaderVisible =
    headerPosition === "hidden" ? isHeaderVisible : true;
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLElement | null>(null);
  const desktopActionsRef = useRef<HTMLDivElement | null>(null);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null);
  const [desktopActionsOpen, setDesktopActionsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);

      // Hidden mode: show on scroll up, hide on scroll down after delay
      if (headerPosition === 'hidden') {
        if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
          // Scrolling up or near top - show header
          setIsHeaderVisible(true);
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          // Auto-hide after 3 seconds of no scrolling
          hideTimeoutRef.current = setTimeout(() => {
            if (window.scrollY > 50) setIsHeaderVisible(false);
          }, 3000);
        } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          // Scrolling down past threshold - hide header
          setIsHeaderVisible(false);
        }
        lastScrollY.current = currentScrollY;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [headerPosition]);

  // Update document title and favicon based on headerConfig
  useEffect(() => {
    document.title = resolvedBrandTitle;

    // Update favicon intelligently based on theme and header config
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    const base = `${import.meta.env.BASE_URL}`;
    const favLightSvg = `${base}icons/light/favicon.svg`;
    const favDarkSvg = `${base}icons/dark/favicon.svg`;
    const favLightIco = `${base}icons/light/favicon.ico`;
    const favDarkIco = `${base}icons/dark/favicon.ico`;
    const rootSvg = `${base}favicon.svg`;
    const rootIco = `${base}favicon.ico`;

    const setHref = (href: string) => {
      if (!link) return;
      link.href = href;
    };

    const updateSocialImages = (prefersDark: boolean) => {
      const ogTag = document.querySelector("meta[property='og:image']") as HTMLMetaElement | null;
      const twTag = document.querySelector("meta[name='twitter:image']") as HTMLMetaElement | null;
      if (!ogTag && !twTag) return;

      const ogLight = [
        `${base}icons/light/og-image.png`,
        `${base}og-image.png`,
      ];
      const ogDark = [
        `${base}icons/dark/og-image.png`,
        `${base}og-image.png`,
      ];
      const twLight = [
        `${base}icons/light/twitter-image.png`,
        `${base}twitter-image.png`,
      ];
      const twDark = [
        `${base}icons/dark/twitter-image.png`,
        `${base}twitter-image.png`,
      ];

      const resolveAndSet = (candidates: string[], setter: (value: string) => void) => {
        const img = new Image();
        let index = 0;
        const tryNext = () => {
          const next = candidates[index++];
          if (!next) return;
          img.onload = () => setter(next);
          img.onerror = () => tryNext();
          img.src = next;
        };
        tryNext();
      };

      if (ogTag) {
        resolveAndSet(prefersDark ? ogDark : ogLight, (value) => {
          ogTag.setAttribute('content', value);
        });
      }
      if (twTag) {
        resolveAndSet(prefersDark ? twDark : twLight, (value) => {
          twTag.setAttribute('content', value);
        });
      }
    };

    const applyFavicon = () => {
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      updateSocialImages(prefersDark);
      // Choose themed favicon with fallbacks
      const primary = prefersDark ? favDarkSvg : favLightSvg;
      const secondary = prefersDark ? favLightSvg : favDarkSvg;
      const tertiary = prefersDark ? favDarkIco : favLightIco;
      const candidates = [primary, secondary, tertiary, rootSvg, rootIco];

      const img = new Image();
      let index = 0;
      const tryNext = () => {
        const next = candidates[index++];
        if (!next) return;
        img.onload = () => setHref(next);
        img.onerror = () => tryNext();
        img.src = next;
      };
      tryNext();

    };

    applyFavicon();

    // Listen for theme changes
    let mq: MediaQueryList | null = null;
    if (typeof window !== 'undefined' && window.matchMedia) {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyFavicon();
      try { mq.addEventListener('change', handler); } catch { mq.addListener(handler); }
      return () => {
        if (mq) {
          try { mq.removeEventListener('change', handler); } catch { mq.removeListener(handler); }
        }
      };
    }
  }, [resolvedBrandTitle, t]);

  const headerPositionClasses = {
    static: "relative w-full",
    sticky: "fixed left-0 right-0 z-50 w-full",
    floating: "fixed left-1/2 -translate-x-1/2 w-[96%] max-w-7xl rounded-xl md:rounded-2xl border z-50",
    hidden: `fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out ${effectiveHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`,
  };

  const headerHeightClasses = {
    'ultra-compact': 'h-8 lg:h-10', // Minimal height
    tiny: 'h-10 lg:h-12',
    compact: 'h-12 lg:h-14',
    normal: 'h-14 lg:h-16',
    spacious: 'h-16 lg:h-20',
  };

  const isFloating = headerPosition === 'floating';
  const isCentered = headerConfig.style === 'centered';
  const handleLogoClick = props.onGoLanding || props.onGoHome;
  const handleTitleClick = props.onGoAll || props.onGoHome;
  const hasFeedIssues = (props.feedIssueCount || 0) > 0;
  const handleManageFeedsActionClick =
    props.onManageFeedsIconClick || props.onManageFeedsClick;
  const feedIssuesLabel = hasFeedIssues
    ? `${props.feedIssueCount} feed${props.feedIssueCount === 1 ? "" : "s"} com problema`
    : t('header.manage_feeds');

  const activeCategories = props.categories.filter(
    category => category.isPinned || (props.categorizedFeeds[category.id] || []).length > 0
  );
  const visibleCategories = useMemo(() => {
    if (props.primaryView !== "favorites") {
      return activeCategories;
    }

    const allCategory =
      activeCategories.find((category) => category.id === "all") ||
      props.categories.find((category) => category.id === "all");
    const favoritesCategory: FeedCategory = {
      id: FAVORITES_VIEW_ID,
      name: "Favoritos",
      color: allCategory?.color || "rgb(var(--color-accent))",
      description: "Favoritos",
      order: allCategory?.order || 0,
      isDefault: true,
      isPinned: true,
      layoutMode: allCategory?.layoutMode,
    };

    return [
      favoritesCategory,
      ...activeCategories.filter((category) => category.id !== "all"),
    ];
  }, [activeCategories, props.categories, props.primaryView]);
  const favoriteDropdownFeeds = useMemo<FeedSource[]>(() => {
    if (props.primaryView !== "favorites") return [];

    const feedsBySource = new Map<string, FeedSource>();
    props.articles.forEach((article) => {
      const sourceKey = (article.feedUrl || article.sourceTitle || "").trim();
      if (!sourceKey || feedsBySource.has(sourceKey)) return;

      feedsBySource.set(sourceKey, {
        url: sourceKey,
        categoryId: FAVORITES_VIEW_ID,
        customTitle: article.sourceTitle,
      });
    });

    return Array.from(feedsBySource.values());
  }, [props.articles, props.primaryView]);
  const hasManyCategories = visibleCategories.length >= 7;

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const closeDesktopActions = () => setDesktopActionsOpen(false);

  const drawerAdminShortcuts = [
    {
      label: "Gerenciar feeds",
      description: "Coleção, categorias e saúde",
      onClick: handleManageFeedsActionClick,
    },
    {
      label: "Adicionar fontes",
      description: "RSS, descoberta e OPML",
      onClick: handleManageFeedsActionClick,
    },
    {
      label: "Importar e exportar",
      description: "OPML e manutenção",
      onClick: handleManageFeedsActionClick,
    },
    {
      label: "Diagnóstico",
      description: "Feeds, backend e proxies",
      onClick: handleManageFeedsActionClick,
    },
  ];

  const drawerSettingsShortcuts = [
    {
      label: "Aparência",
      description: "Tema e cores",
      onClick: props.onOpenSettings,
    },
    {
      label: "Layout do feed",
      description: "Visual das notícias",
      onClick: props.onOpenSettings,
    },
    {
      label: "Leitura",
      description: "Fonte, densidade e tempo",
      onClick: props.onOpenSettings,
    },
    {
      label: "Sistema",
      description: "Preferências gerais",
      onClick: props.onOpenSettings,
    },
  ];

  const getFeedLabel = (feed: FeedSource) => {
    if (feed.customTitle) return feed.customTitle;
    try {
      return new URL(feed.url).hostname.replace(/^www\./, "");
    } catch {
      return feed.url;
    }
  };

  // Dynamic appearance styles
  const normalizedBgOpacity = headerConfig.bgOpacity
    ?? (typeof headerConfig.backgroundOpacity === "number"
      ? Math.min(1, Math.max(0, headerConfig.backgroundOpacity / 100))
      : 0.9);
  const borderOpacity = headerConfig.borderOpacity ?? 8;
  const bgColor = headerConfig.bgColor || headerConfig.backgroundColor || '#0a0a0c';
  const borderColor = headerConfig.borderColor ?? '#ffffff';
  const blurIntensityToPx: Record<NonNullable<typeof headerConfig.blurIntensity>, number> = {
    none: 0,
    light: 6,
    medium: 12,
    heavy: 20,
  };
  const blurValue = typeof headerConfig.blur === 'number'
    ? headerConfig.blur
    : blurIntensityToPx[headerConfig.blurIntensity || 'medium'];

  // Convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const getColorTriplet = (hex: string) => {
    if (!/^#?[0-9a-f]{6}$/i.test(hex)) {
      return '10 10 12';
    }

    const normalizedHex = hex.startsWith('#') ? hex : `#${hex}`;
    const r = parseInt(normalizedHex.slice(1, 3), 16);
    const g = parseInt(normalizedHex.slice(3, 5), 16);
    const b = parseInt(normalizedHex.slice(5, 7), 16);

    return `${r} ${g} ${b}`;
  };

  const getReadableTextTriplet = (hex: string) => {
    if (!/^#?[0-9a-f]{6}$/i.test(hex)) {
      return '248 250 252';
    }

    const normalizedHex = hex.startsWith('#') ? hex : `#${hex}`;
    const r = parseInt(normalizedHex.slice(1, 3), 16);
    const g = parseInt(normalizedHex.slice(3, 5), 16);
    const b = parseInt(normalizedHex.slice(5, 7), 16);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    return luminance > 0.58 ? '17 24 39' : '248 250 252';
  };

  const styleBgOpacity = headerConfig.style === 'minimal'
    ? Math.min(normalizedBgOpacity, 0.5)
    : normalizedBgOpacity;
  const headerBgStyle = hexToRgba(bgColor, styleBgOpacity);
  const headerBorderStyle = hexToRgba(borderColor, borderOpacity / 100);
  const headerBgTriplet = getColorTriplet(bgColor);
  const headerTextTriplet = getReadableTextTriplet(bgColor);
  const headerMutedTriplet =
    headerTextTriplet === '17 24 39' ? '71 85 105' : '203 213 225';

  // Category area styles
  const catBgColor = headerConfig.categoryBackgroundColor ?? '#ffffff';
  const catBgOpacity = headerConfig.categoryBackgroundOpacity ?? 3;
  const categoryBgStyle = hexToRgba(catBgColor, catBgOpacity / 100);
  const headerStyleVariant = headerConfig.style ?? 'default';
  const categoryContainerClass = headerStyleVariant === 'minimal'
    ? 'border border-transparent bg-transparent'
    : 'feed-header-category-shell';

  const mobileCategoryClasses = {
    base: 'flex-shrink-0 min-h-11 px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap snap-start',
    active: headerStyleVariant === 'minimal'
      ? 'feed-header-title border-b-2 border-[rgb(var(--color-primary))]'
      : 'feed-header-chip feed-header-chip--active',
    idle: headerStyleVariant === 'minimal'
      ? 'feed-header-muted border-b-2 border-transparent'
      : 'feed-header-chip',
  };
  const headerTextColor = `rgb(${headerTextTriplet})`;

  // Scroll Logic for Categories
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll, { passive: true });
    return () => window.removeEventListener('resize', checkScroll);
  }, [visibleCategories]);

  useEffect(() => {
    if (!desktopActionsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        desktopActionsRef.current &&
        !desktopActionsRef.current.contains(event.target as Node)
      ) {
        setDesktopActionsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [desktopActionsOpen]);

  useLayoutEffect(() => {
    const updateHeaderOffset = () => {
      if (!headerRef.current) return;
      const rect = headerRef.current.getBoundingClientRect();
      const viewportWidth =
        typeof window !== "undefined" ? window.innerWidth : 1280;
      const isMobileViewport = viewportWidth < 768;
      const isWideViewport = viewportWidth >= 1536;
      const isFixedMode = headerPosition !== 'static';
      const topGap =
        headerPosition === "floating"
          ? isMobileViewport
            ? 10
            : isWideViewport
              ? 16
              : 12
          : 0;
      // Gap entre menu e conteúdo: usa variável CSS --feed-header-content-gap (ex.: 1.3125rem em index.css)
      const gapPx = (() => {
        const cssGap = typeof getComputedStyle !== "undefined"
          ? getComputedStyle(document.documentElement).getPropertyValue("--feed-header-content-gap").trim()
          : "";
        if (cssGap && /^\d+(\.\d+)?(px|rem|em)$/.test(cssGap)) {
          if (cssGap.endsWith("px")) return parseFloat(cssGap) || 21;
          const rem = parseFloat(cssGap) || 1.3125;
          return Math.round(rem * 16);
        }
        return 21;
      })();
      // +2px safety buffer to avoid occasional overlap during dynamic reflow.
      const offset = isFixedMode ? Math.max(0, rect.height + 2) : 0;
      document.documentElement.style.setProperty('--feed-header-offset', `${Math.round(offset)}px`);
      document.documentElement.style.setProperty('--feed-header-gap', `${gapPx}px`);
      document.documentElement.style.setProperty('--feed-header-top-gap', `${Math.round(topGap)}px`);
    };

    updateHeaderOffset();
    const headerElement = headerRef.current;
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateHeaderOffset())
        : null;
    if (resizeObserver && headerElement) {
      resizeObserver.observe(headerElement);
    }
    window.addEventListener('resize', updateHeaderOffset, { passive: true });
    window.addEventListener('orientationchange', updateHeaderOffset, {
      passive: true,
    });
    return () => {
      window.removeEventListener('resize', updateHeaderOffset);
      window.removeEventListener('orientationchange', updateHeaderOffset);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      document.documentElement.style.setProperty('--feed-header-offset', '0px');
      document.documentElement.style.setProperty('--feed-header-gap', 'var(--feed-header-content-gap, 1.3125rem)');
      document.documentElement.style.setProperty('--feed-header-top-gap', '0px');
    };
  }, [
    headerPosition,
    isHeaderVisible,
    mobileMenuOpen,
    mobileCategoriesOpen,
    visibleCategories.length,
    headerConfig.height,
    headerConfig.showLogo,
    headerConfig.showTitle,
  ]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = direction === 'left'
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const desktopActionItems = [
    {
      key: "refresh",
      label: t("header.refresh"),
      onClick: props.onRefreshClick,
      icon: <HeaderIcons.Refresh showBackground={false} size="md" />,
    },
    {
      key: "favorites",
      label: t("header.favorites"),
      onClick: props.onOpenFavorites,
      icon: <HeaderIcons.Favorites showBackground={false} size="md" />,
    },
    {
      key: "settings",
      label: "Configurações",
      onClick: props.onOpenSettings,
      icon: <HeaderIcons.Settings showBackground={false} size="md" />,
    },
    {
      key: "feeds",
      label: feedIssuesLabel,
      onClick: handleManageFeedsActionClick,
      icon: <HeaderIcons.Feeds showBackground={false} size="md" />,
      hasBadge: hasFeedIssues,
    },
  ];

  const desktopFullActionsClass = hasManyCategories
    ? "hidden 2xl:flex"
    : "hidden xl:flex";
  const desktopOverflowClass = hasManyCategories
    ? "hidden md:flex 2xl:hidden"
    : "hidden md:flex xl:hidden";
  const renderDesktopActionButtons = () => (
    <>
      {desktopActionItems.map((item) => (
        <button
          key={item.key}
          onClick={item.onClick}
          className="feed-header-control relative"
          title={item.label}
          aria-label={item.label}
        >
          {item.icon}
          {item.hasBadge && (
            <span
              className="absolute right-0 top-0 block h-2.5 w-2.5 rounded-full border border-[rgb(var(--color-background))] bg-[rgb(var(--color-warning))]"
              aria-hidden="true"
            />
          )}
        </button>
      ))}
    </>
  );

  const renderCategoryRail = () => (
    <div className="feed-header-category-rail relative hidden min-w-0 items-center justify-center overflow-hidden md:flex group/scroll">
      <div className={`absolute left-0 z-10 transition-all duration-300 ${canScrollLeft ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'}`}>
        <button
          onClick={() => scroll('left')}
          className="feed-header-scroll-button"
          aria-label="Scroll left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className={`feed-header-category-scroll flex max-w-full items-center space-x-1 overflow-x-auto rounded-full p-1 text-xs font-medium transition-all no-scrollbar scroll-smooth ${categoryContainerClass} ${headerStyleVariant === 'minimal' ? 'px-0' : ''}`}
        style={{ ...(headerStyleVariant === 'minimal' ? {} : { backgroundColor: categoryBgStyle, borderColor: headerBorderStyle }), scrollbarWidth: 'none' }}
      >
              {visibleCategories.map((category) => {
                const isFavoritesSlot = category.id === FAVORITES_VIEW_ID;
                const dropdownFeeds = isFavoritesSlot
                  ? favoriteDropdownFeeds
                  : props.categorizedFeeds[category.id] || [];
                const layoutCategoryId = isFavoritesSlot ? "all" : category.id;

                return (
                  <div key={category.id} className="flex-shrink-0">
                    <FeedDropdown
                      category={category}
                      feeds={dropdownFeeds}
                      onSelectFeed={(feedUrl: string) => props.onNavigation(category.id, feedUrl)}
                      onSelectCategory={() => props.onNavigation(category.id)}
                      selectedCategory={props.selectedCategory}
                      onEditCategory={props.onManageFeedsClick}
                      isVirtual={isFavoritesSlot}
                      primaryViewActionLabel={
                        isFavoritesSlot
                          ? "Trocar por All"
                          : category.id === "all"
                            ? "Trocar por Favoritos"
                            : undefined
                      }
                      primaryViewActionIcon={
                        isFavoritesSlot
                          ? "feeds"
                          : category.id === "all"
                            ? "favorites"
                            : undefined
                      }
                      onPrimaryViewAction={
                        !props.onPrimaryViewChange
                          ? undefined
                          : isFavoritesSlot
                            ? () => props.onPrimaryViewChange?.("all")
                            : category.id === "all"
                              ? () => props.onPrimaryViewChange?.("favorites")
                              : undefined
                      }
                      onLayoutChange={
                        props.onCategoryLayoutChange
                          ? (layoutMode) =>
                              props.onCategoryLayoutChange?.(
                                layoutCategoryId,
                                layoutMode,
                              )
                          : undefined
                      }
                      variant={headerStyleVariant}
                    />
                  </div>
                );
              })}
      </div>

      <div className={`absolute right-0 z-10 transition-all duration-300 ${canScrollRight ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`}>
        <button
          onClick={() => scroll('right')}
          className="feed-header-scroll-button"
          aria-label="Scroll right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  const headerInlineStyle: React.CSSProperties &
    Record<
      | '--theme-header-text'
      | '--theme-control-text'
      | '--theme-text-secondary-readable'
      | '--theme-control-bg',
      string
    > = {
      backgroundColor: headerBgStyle,
      backdropFilter: blurValue > 0 ? `blur(${blurValue}px)` : undefined,
      WebkitBackdropFilter: blurValue > 0 ? `blur(${blurValue}px)` : undefined,
      position:
        headerPosition === 'floating' ||
        headerPosition === 'sticky' ||
        headerPosition === 'hidden'
          ? 'fixed'
          : undefined,
      top:
        headerPosition === 'floating'
          ? 'var(--feed-header-top-gap, 6px)'
          : headerPosition !== 'static'
            ? '0px'
            : undefined,
      marginTop: headerPosition === 'static' ? '0px' : undefined,
      marginBottom: headerPosition === 'static' ? '0px' : undefined,
      color: headerTextColor,
      '--theme-header-text': headerTextTriplet,
      '--theme-control-text': headerTextTriplet,
      '--theme-text-secondary-readable': headerMutedTriplet,
      '--theme-control-bg': headerBgTriplet,
      borderColor: headerPosition === 'floating' ? headerBorderStyle : undefined,
      borderBottomColor: isScrolled && !isFloating ? headerBorderStyle : 'transparent',
    };

  return (
    <>
      <header
        ref={headerRef}
        className={`app-system-font ${headerPositionClasses[headerPosition]} z-30 transition-[transform,opacity,top,margin,box-shadow,background-color,border-color] duration-300 ${
          isScrolled || isFloating ? (headerStyleVariant === 'minimal' ? 'shadow-sm' : 'shadow-lg') : ''
        } ${headerPosition === 'floating' ? '[background-clip:padding-box]' : ''} ${
          isScrolled && !isFloating ? 'border-b' : ''
        }`}
        style={headerInlineStyle}
      >
        <div
          className={`pointer-events-none absolute inset-0 rounded-[inherit] ${
            headerStyleVariant === 'centered'
              ? 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]'
              : headerStyleVariant === 'default'
                ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_65%)]'
                : ''
          }`}
        />
        <div className={`mx-auto px-3 sm:px-4 ${!isFloating ? 'container' : ''} ${isFloating ? 'rounded-xl md:rounded-2xl' : ''}`}>

          {/* Main header row - desktop/tablet shell. Phones use the compact category rail below. */}
          {/* Auto height when logo and title are both hidden */}
            <div className={`
            feed-header-layout ${hasManyCategories ? "feed-header-layout--many-categories" : ""} items-center gap-3 transition-all duration-300
            ${headerHeightClasses[headerConfig.height] || 'h-14 lg:h-16'}
            ${isCentered ? "feed-header-layout--centered" : ""}
            ${headerStyleVariant === "minimal" ? "feed-header-layout--minimal" : ""}
            hidden md:grid
          `}>

            {/* Left Section: Logo & Title */}
            <div className="feed-header-brand flex min-w-0 items-center space-x-2 md:space-x-3 group">
              {headerConfig.showLogo !== false && (
                <div
                  className="feed-header-brand-logo relative cursor-pointer group/logo pl-4"
                  onClick={handleLogoClick}
                  aria-label="Voltar para a Home"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-full opacity-0 group-hover:opacity-10 blur-sm transition-opacity duration-500"></div>
                  {handleLogoClick && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 opacity-0 group-hover/logo:opacity-100 group-hover/logo:translate-x-0 transition-all duration-300 text-[rgb(var(--color-textSecondary))] pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                  )}
                  <div className="relative z-10">
                    <Logo
                      size={headerConfig.logoSize}
                      isClickable={true}
                      onClick={handleLogoClick}
                    />
                  </div>
                </div>
              )}
              {headerConfig.showTitle ? (
                <h1
                  className="feed-header-title feed-header-brand-title min-w-0 cursor-pointer truncate pb-1 text-lg font-bold tracking-tight md:text-xl"
                  onClick={handleTitleClick}
                  style={{ color: headerTextColor }}
                >
                  <span className="notranslate" translate="no" lang="en">
                    {resolvedBrandTitle}
                  </span>
                </h1>
              ) : (
                <h1 className="sr-only">{t('app.title')}</h1>
              )}
            </div>

            {/* Center Section: Categories (Desktop) - Centralized between logo and actions */}
            {renderCategoryRail()}

            {/* Right Section: Actions */}
            <div className="feed-header-actions relative z-10 flex flex-shrink-0 items-center justify-end space-x-2" ref={desktopActionsRef}>

              {/* Desktop Actions */}
              <div className={`${desktopFullActionsClass} items-center space-x-1`}>
                {renderDesktopActionButtons()}
              </div>

              {/* Desktop compact overflow */}
              <div className={`${desktopOverflowClass} relative items-center`}>
                <button
                  onClick={() => setDesktopActionsOpen((open) => !open)}
                  className={`feed-header-control ${desktopActionsOpen ? "feed-header-control--filled" : ""}`}
                  aria-label="Menu de ações"
                  aria-expanded={desktopActionsOpen}
                >
                  <HeaderIcons.Menu
                    showBackground={false}
                    size="md"
                    isActive={desktopActionsOpen}
                  />
                  {hasFeedIssues && (
                    <span
                      className="absolute right-0 top-0 block h-2.5 w-2.5 rounded-full border border-[rgb(var(--color-background))] bg-[rgb(var(--color-warning))]"
                      aria-hidden="true"
                    />
                  )}
                </button>
                {desktopActionsOpen && (
                  <div className="feed-header-action-menu absolute right-0 top-[calc(100%+0.6rem)] z-50 w-56 rounded-2xl border border-[rgb(var(--color-border))]/20 bg-[rgb(var(--color-surface))]/95 p-1.5 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
                    {desktopActionItems.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          item.onClick();
                          closeDesktopActions();
                        }}
                        className="feed-header-action-menu__item"
                      >
                        <span className="relative inline-flex">
                          {item.icon}
                          {item.hasBadge && (
                            <span
                              className="absolute right-0 top-0 block h-2 w-2 rounded-full bg-[rgb(var(--color-warning))]"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <span className="min-w-0 truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MOBILE/TABLET: Categories (Second row) - always visible, expandable */}
          <div className="feed-header-mobile-bar md:hidden w-full py-1.5">
            <div className="flex items-center gap-1.5 px-2 sm:px-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`feed-header-control feed-header-control--filled shrink-0 ${mobileMenuOpen ? "ring-1 ring-[rgb(var(--color-primary))]/40" : ""}`}
                aria-label="Menu"
              >
                <HeaderIcons.Menu
                  showBackground={false}
                  size="md"
                  isActive={mobileMenuOpen}
                />
              </button>
              <div className="relative flex-1 min-w-0">
                <div className="overflow-x-auto no-scrollbar w-full" style={{ scrollbarWidth: 'none' }}>
                  <div className="flex items-center gap-1.5 pr-2 snap-x snap-mandatory">
                    {visibleCategories.map((category) => {
                      const isActive = props.selectedCategory === category.id;
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            props.onNavigation(category.id);
                            setMobileExpandedCategory(category.id);
                          }}
                          aria-current={isActive ? 'page' : undefined}
                          className={`rounded-full ${mobileCategoryClasses.base} ${
                            isActive ? mobileCategoryClasses.active : mobileCategoryClasses.idle
                          }`}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMobileCategoriesOpen((prev) => !prev)}
                className="feed-header-control feed-header-control--filled shrink-0"
                aria-label={mobileCategoriesOpen ? "Recolher categorias" : "Expandir categorias"}
              >
                <HeaderIcons.ChevronDown
                  size="sm"
                  className={`transition-transform ${mobileCategoriesOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {mobileCategoriesOpen && (
              <div className="feed-category-sheet fixed left-2 right-2 top-[3.75rem] z-50 animate-in fade-in slide-in-from-top-2">
                <div className="custom-scrollbar max-h-[min(62vh,30rem)] overflow-y-auto px-2 py-2">
                  {visibleCategories.map((category) => {
                    const isFavoritesSlot = category.id === FAVORITES_VIEW_ID;
                    const feeds = isFavoritesSlot
                      ? favoriteDropdownFeeds
                      : props.categorizedFeeds[category.id] || [];
                    const resolvedMobileExpandedCategory =
                      mobileExpandedCategory || props.selectedCategory || "all";
                    const isExpanded =
                      resolvedMobileExpandedCategory === category.id;
                    const isActive = props.selectedCategory === category.id;
                    return (
                      <div key={category.id} className="feed-category-sheet__group">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              props.onNavigation(category.id);
                              setMobileExpandedCategory(category.id);
                            }}
                            className={`feed-category-sheet__row min-w-0 flex-1 ${isActive ? "feed-category-sheet__row--active" : ""}`}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <span className="min-w-0 truncate">{category.name}</span>
                            <span className="feed-category-sheet__count">{feeds.length}</span>
                          </button>
                          <button
                            onClick={() =>
                              setMobileExpandedCategory((prev) =>
                                prev === category.id ? null : category.id
                              )
                            }
                            className="feed-category-sheet__toggle"
                            aria-label={isExpanded ? `Recolher ${category.name}` : `Expandir ${category.name}`}
                            aria-expanded={isExpanded}
                          >
                            <HeaderIcons.ChevronDown
                              size="xs"
                              className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="feed-category-sheet__feeds">
                            {feeds.length > 0 ? (
                              feeds.map((feed) => (
                                <button
                                  key={feed.url}
                                  onClick={() => {
                                    props.onNavigation(category.id, feed.url);
                                    setMobileCategoriesOpen(false);
                                  }}
                                  className="feed-category-sheet__feed"
                                  title={feed.customTitle || feed.url}
                                >
                                  {getFeedLabel(feed)}
                                </button>
                              ))
                            ) : (
                              <span className="feed-category-sheet__empty">
                                Sem feeds nesta categoria
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
      <div className="fixed inset-0 z-50 opacity-100 pointer-events-auto lg:hidden transition-opacity duration-300">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        ></div>

        {/* Drawer Content */}
        <div
          className="feed-header-drawer absolute top-0 right-0 bottom-0 w-[82%] max-w-sm translate-x-0 shadow-2xl transform transition-transform duration-300"
        >
          <div className="flex flex-col h-full">
            <div className="feed-header-drawer__top flex items-center justify-between p-4">
              <div className="feed-header-drawer-brand min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    handleLogoClick?.();
                    closeMobileMenu();
                  }}
                  className="bg-transparent p-0"
                  aria-label="Ir para a apresentação do Personal News"
                >
                  <Logo
                    size={headerConfig.logoSize || "md"}
                    customSrc={headerConfig.logoUrl}
                    useThemeColor={headerConfig.useThemeColor}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleTitleClick?.();
                    closeMobileMenu();
                  }}
                  className="min-w-0 bg-transparent p-0 text-left"
                  aria-label={`Recarregar ${resolvedBrandTitle}`}
                >
                  <span className="feed-header-title block truncate text-base font-bold">
                    {resolvedBrandTitle}
                  </span>
                  <span className="feed-header-muted block truncate text-[11px] font-semibold">
                    Feed pessoal
                  </span>
                </button>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="feed-header-control">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="custom-scrollbar p-4 space-y-5 overflow-y-auto flex-1">
              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    handleManageFeedsActionClick();
                    closeMobileMenu();
                  }}
                  className="feed-header-drawer-card feed-header-drawer-card--primary relative"
                  aria-label={feedIssuesLabel}
                >
                  <HeaderIcons.Feeds showBackground={false} size="md" />
                  {hasFeedIssues && (
                    <span
                      className="absolute right-3 top-3 block h-2.5 w-2.5 rounded-full border border-[rgb(var(--color-background))] bg-[rgb(var(--color-warning))]"
                      aria-hidden="true"
                    />
                  )}
                  <span className="mt-2 text-xs">Gerenciar</span>
                </button>
                <button
                  onClick={() => { props.onOpenFavorites(); closeMobileMenu(); }}
                  className="feed-header-drawer-card"
                >
                  <HeaderIcons.Favorites showBackground={false} size="md" />
                  <span className="mt-2 text-xs">{t('header.favorites')}</span>
                </button>
                <button
                  onClick={() => { props.onOpenSettings(); closeMobileMenu(); }}
                  className="feed-header-drawer-card"
                >
                  <HeaderIcons.Settings showBackground={false} size="md" />
                  <span className="mt-2 text-xs">{t('settings.title')}</span>
                </button>
                <button
                  onClick={() => { props.onRefreshClick(); closeMobileMenu(); }}
                  className="feed-header-drawer-card"
                >
                  <HeaderIcons.Refresh showBackground={false} size="md" />
                  <span className="mt-2 text-xs">{t('action.refresh')}</span>
                </button>
              </div>

              <div className="feed-header-drawer-shortcuts space-y-4">
                <section>
                  <h3 className="feed-header-drawer-section-title">Feeds</h3>
                  <div className="grid gap-2">
                    {drawerAdminShortcuts.map((shortcut) => (
                      <button
                        key={shortcut.label}
                        type="button"
                        onClick={() => {
                          shortcut.onClick();
                          closeMobileMenu();
                        }}
                        className="feed-header-drawer-link"
                      >
                        <span>{shortcut.label}</span>
                        <small>{shortcut.description}</small>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="feed-header-drawer-section-title">Configurações</h3>
                  <div className="grid gap-2">
                    {drawerSettingsShortcuts.map((shortcut) => (
                      <button
                        key={shortcut.label}
                        type="button"
                        onClick={() => {
                          shortcut.onClick();
                          closeMobileMenu();
                        }}
                        className="feed-header-drawer-link"
                      >
                        <span>{shortcut.label}</span>
                        <small>{shortcut.description}</small>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
};

export default Header;
