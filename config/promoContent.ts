import type { Language } from "../types";
import {
  APP_BRAND_NAME,
  DEVELOPER_HANDLE,
  MARK_LEE_URL,
  PERSONAL_NEWS_RELEASES_URL,
  PERSONAL_NEWS_REPO_URL,
  PERSONAL_NEWS_WEB_URL,
  PERSONAL_SITE_PROJECTS_URL,
  SPREAD_PROJECTS_URL,
} from "./brand";

export type PromoPageId = "home" | "experience" | "project" | "faq";

export const PROMO_PAGE_HASHES: Record<PromoPageId, string> = {
  home: "#home",
  experience: "#experience",
  project: "#project",
  faq: "#faq",
};

export const PROMO_PAGE_ORDER: PromoPageId[] = [
  "home",
  "experience",
  "project",
  "faq",
];

type PromoTag = {
  id: string;
  label: string;
};

type PromoLink = {
  href: string;
  label: string;
};

type FooterColumn = {
  id: string;
  title: string;
  links: PromoLink[];
};

type VersionCard = {
  id: string;
  label: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  icon: "repo" | "web" | "desktop";
};

type ExperienceFamily = {
  id: string;
  label: string;
  title: string;
  description: string;
  variant: "editorial" | "grid" | "minimal" | "immersive" | "split" | "compact" | "split-list";
};

type ExperiencePoint = {
  id: string;
  label: string;
};

type StackToken = {
  id: string;
  label: string;
};

type ProjectHighlight = {
  id: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type FaqGroup = {
  id: string;
  title: string;
  items: FaqItem[];
};

type PromoContent = {
  nav: {
    brandLabel: string;
    pages: Record<PromoPageId, string>;
    openFeed: string;
    repo: string;
  };
  home: {
    eyebrow: string;
    title: string;
    lead: string;
    subtitle: string;
    tags: PromoTag[];
    ctaLabel: string;
    imageAlt: string;
    purposeEyebrow: string;
    purposeTitle: string;
    purposeBody: string;
    purposeSupport: string;
    availabilityEyebrow: string;
    availabilityTitle: string;
    availabilityBody: string;
    versions: VersionCard[];
  };
  experience: {
    eyebrow: string;
    title: string;
    subtitle: string;
    families: ExperienceFamily[];
    familiesCta: string;
    familiesCtaLabel: string;
    familiesOthers: string;
    tuningEyebrow: string;
    tuningTitle: string;
    tuningBody: string;
    tuningPoints: ExperiencePoint[];
    onboardingEyebrow: string;
    onboardingTitle: string;
    onboardingBody: string;
    onboardingSupport: string;
  };
  project: {
    eyebrow: string;
    title: string;
    subtitle: string;
    technologyEyebrow: string;
    technologyTitle: string;
    technologyBody: string;
    stackTokens: StackToken[];
    qualityEyebrow: string;
    qualityTitle: string;
    qualityBody: string;
    qualityPoints: ExperiencePoint[];
    commitsEyebrow: string;
    commitsTitle: string;
    commitsBody: string;
    commitsSyncing: string;
    commitsFallback: string;
    commitsLive: string;
    commitLinkLabel: string;
    projectsEyebrow: string;
    projectsTitle: string;
    projectsBody: string;
    projects: ProjectHighlight[];
    aboutEyebrow: string;
    aboutTitle: string;
    aboutBody: string;
    aboutSupport: string;
    aboutMeta: string;
    aboutLinkLabel: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    subtitle: string;
    groups: FaqGroup[];
  };
  footer: {
    blurb: string;
    copyright: string;
    columns: FooterColumn[];
  };
};

const ptBR: PromoContent = {
  nav: {
    brandLabel: APP_BRAND_NAME,
    pages: {
      home: "Início",
      experience: "Experiência",
      project: "Projeto",
      faq: "FAQ",
    },
    openFeed: "Abrir feed",
    repo: "GitHub",
  },
  home: {
    eyebrow: "Leitura focada e ambiente controlado",
    title: "Seu feed, suas regras. Uma leitura sem distrações.",
    lead: "Organize fontes, ajuste o layout e o tema, e leia apenas o que importa.",
    subtitle:
      "Disponível como app local, versão web ou aplicativo desktop completo.",
    tags: [
      { id: "open-source", label: "Open source" },
      { id: "wcag", label: "Contraste premium" },
      { id: "responsive", label: "Adapta do celular ao desktop" },
    ],
    ctaLabel: "Abrir feed",
    imageAlt:
      "Interface do Personal News mostrando cards de artigos organizados em um layout visual moderno e limpo.",
    purposeEyebrow: "Propósito",
    purposeTitle: "Cure suas fontes, refine a tipografia e encontre seu ritmo.",
    purposeBody:
      "O feed de notícias tradicional é barulhento. O Personal News transforma a sua leitura diária em uma página clara, organizada e visualmente calma.",
    purposeSupport:
      "A hierarquia é mantida mesmo quando o volume de notícias cresce.",
    availabilityEyebrow: "Disponibilidade",
    availabilityTitle: "Uma versão para cada necessidade sua.",
    availabilityBody:
      "Uma base flexível: explore pela web, edite pelo repositório ou instale o app desktop para a experiência mais imersiva e completa.",
    versions: [
      {
        id: "repo",
        label: "Local pelo repositório",
        title: "Bom para testar e ajustar.",
        description:
          "Ideal para configurar fontes e validar mudanças.",
        href: PERSONAL_NEWS_REPO_URL,
        linkLabel: "Abrir repositório",
        icon: "repo",
      },
      {
        id: "web",
        label: "Online no GitHub Pages",
        title: "Rápido para abrir no navegador.",
        description:
          "Útil para acessar e mostrar o projeto.",
        href: PERSONAL_NEWS_WEB_URL,
        linkLabel: "Abrir versão online",
        icon: "web",
      },
      {
        id: "desktop",
        label: "Aplicativo desktop",
        title: "A versão mais completa para uso diário.",
        description:
          "É onde a experiência fica mais estável para leitura e uso contínuo.",
        href: PERSONAL_NEWS_RELEASES_URL,
        linkLabel: "Ver releases",
        icon: "desktop",
      },
    ],
  },
  experience: {
    eyebrow: "Experiência visual",
    title: "Layouts flexíveis desenhados para não cansar a vista.",
    subtitle:
      "A interface adapta-se à densidade da sua leitura. Escolha o layout que dita o ritmo.",
    families: [
      {
        id: "editorial",
        label: "Editorial",
        title: "Destaque e peso visual para a notícia principal.",
        description:
          "Ideal para acompanhar poucas fontes com atenção aos grandes temas.",
        variant: "editorial",
      },
      {
        id: "gallery",
        label: "Gallery",
        title: "Equilíbrio entre múltiplos artigos no mesmo campo de visão.",
        description:
          "Um grid harmonioso, sem abrir mão do respiro entre os cards.",
        variant: "grid",
      },
      {
        id: "minimal",
        label: "Minimal",
        title: "Foque puramente no texto e na fonte da notícia.",
        description:
          "Sem imagens. Uma lista text-first extremamente rápida.",
        variant: "minimal",
      },
      {
        id: "split",
        label: "Split",
        title: "Coluna principal e lista lateral sempre visíveis.",
        description:
          "Um destaque à esquerda e uma fila de artigos à direita, para leitura densa com hierarquia.",
        variant: "split",
      },
      {
        id: "compact",
        label: "Compact",
        title: "Densidade máxima sem perder legibilidade.",
        description:
          "Cards enxutos em grade densa, para quem acompanha muitas fontes ao mesmo tempo.",
        variant: "compact",
      },
    ],
    familiesCta: "E ainda tem mais. Abra o app para explorar o Imersivo, o Split-List e outros.",
    familiesCtaLabel: "Abrir feed e testar layouts",
    familiesOthers: "Outros disponíveis no app: Imagem, Split-List, Article-View.",
    tuningEyebrow: "Harmonia visual",
    tuningTitle: "Controle absoluto sobre tipografia e densidade.",
    tuningBody:
      "Tema, espaçamento e o comportamento do cabeçalho andam juntos para compor um ambiente premium de leitura.",
    tuningPoints: [
      { id: "contrast", label: "Temas claro e escuro finamente ajustados para conforto ocular." },
      { id: "header", label: "Cabeçalho minimalista que se recolhe ao focar na leitura." },
      { id: "meta", label: "Uma régua visual estrita alinhando tags, fontes e datas." },
      { id: "screens", label: "Responsividade fluida desde pequenos celulares até ultra-wides." },
    ],
    onboardingEyebrow: "Cuidado e transparência",
    onboardingTitle: "Audite seus feeds antes de dar o primeiro passo.",
    onboardingBody:
      "Nenhuma surpresa na importação. O fluxo de onboarding apresenta cada fonte listada.",
    onboardingSupport:
      "Assim a importação fica previsível.",
  },
  project: {
    eyebrow: "Projeto open source",
    title: "Um projeto aberto para testar leitura com critério.",
    subtitle:
      "Tecnologia, qualidade, commits e autoria em um só lugar.",
    technologyEyebrow: "Tecnologia",
    technologyTitle: "React, Vite e Bun sustentam uma base leve.",
    technologyBody:
      "A base ajuda a testar feeds, temas e leitura sem perder estabilidade.",
    stackTokens: [
      { id: "react", label: "React + TypeScript" },
      { id: "vite", label: "Vite" },
      { id: "bun", label: "Bun" },
      { id: "quality", label: "Quality Core" },
    ],
    qualityEyebrow: "Qualidade esperada",
    qualityTitle: "Qualidade esperada, sem improviso.",
    qualityBody:
      "Cada mudança passa por contraste, tipografia, grid e comportamento.",
    qualityPoints: [
      { id: "type", label: "Tipografia com hierarquia clara." },
      { id: "layout", label: "Grid estável do hero à paginação." },
      { id: "states", label: "Estados previsíveis e fallbacks claros." },
      { id: "wcag", label: "Contraste revisto em claro e escuro." },
    ],
    commitsEyebrow: "Últimos commits",
    commitsTitle: "Desenvolvimento visível, sem esconder o que mudou.",
    commitsBody: "O histórico recente mostra a evolução real do projeto.",
    commitsSyncing: "Sincronizando com o GitHub.",
    commitsFallback: "Mostrando um recorte recente quando o GitHub atrasa.",
    commitsLive: "Atualizado diretamente do GitHub.",
    commitLinkLabel: "Ver no GitHub",
    projectsEyebrow: "Meus projetos",
    projectsTitle: "Outros projetos que desenvolvo",
    projectsBody:
      "O Personal News faz parte de um conjunto de projetos autorais onde busco alinhar interface e utilidade.",
    projects: [
      {
        id: "mark-lee",
        title: "Mark-Lee",
        description:
          "Um editor desktop para escrita focada, com ritmo visual calmo e mais espaço para o texto.",
        href: MARK_LEE_URL,
        linkLabel: "Conhecer o Mark-Lee",
      },
      {
        id: "spread",
        title: "Spread",
        description:
          "Um estúdio visual para transformar links e metadata em composições mais autorais e compartilháveis.",
        href: SPREAD_PROJECTS_URL,
        linkLabel: "Ver o Spread",
      },
    ],
    aboutEyebrow: "Sobre mim",
    aboutTitle: "mafhper desenvolve o Personal News.",
    aboutBody:
      "Sou um profissional multidisciplinar com experiência em desenvolvimento web, análise de dados e sistemas embarcados. Meu foco é construir soluções tecnológicas eficientes, bem estruturadas e open-source.",
    aboutSupport:
      "Acredito numa web livre, rápida e acessível. O Personal News compartilha dessa filosofia junto com outras ferramentas visuais que desenvolvo.",
    aboutMeta: "GitHub, portfolios e projetos",
    aboutLinkLabel: "Visitar meu perfil no GitHub",
  },
  faq: {
    eyebrow: "Perguntas frequentes",
    title: "Tire suas dúvidas antes de começar.",
    subtitle:
      "O essencial sobre versões, ajustes e uso do dia a dia.",
    groups: [
      {
        id: "getting-started",
        title: "Para começar",
        items: [
          {
            question: "Qual a melhor versão para começar?",
            answer:
              "Se quer apenas conhecer, abra a versão online pelo navegador. Para uso regular, o app desktop oferece mais estabilidade. Se quer controle total sobre fontes e temas, clone o repositório e rode localmente.",
          },
          {
            question: "Preciso instalar algo para usar?",
            answer:
              "Na versão web, não. Na versão local, basta clonar o repositório, instalar dependências e rodar o servidor. O app desktop tem instaladores prontos na aba de releases do GitHub.",
          },
          {
            question: "Posso importar meus feeds de outro leitor?",
            answer:
              "Sim. O onboarding mostra cada lista com seus respectivos sites antes de confirmar a importação, para que você revise antes de adicionar.",
          },
        ],
      },
      {
        id: "customization",
        title: "Personalização",
        items: [
          {
            question: "O que dá para personalizar?",
            answer:
              "Layout do feed, tema claro ou escuro, densidade de cards, categorias, cabeçalho e comportamento geral da interface. Tudo fica salvo localmente.",
          },
          {
            question: "Quantos layouts o feed oferece?",
            answer:
              "Quatro famílias de layout: Editorial (com destaque principal), Gallery (grid equilibrado), Minimal (título e fonte sem ornamento) e Imagem (cards visuais com contraste preservado).",
          },
        ],
      },
      {
        id: "network",
        title: "Feeds e rede",
        items: [
          {
            question: "Por que alguns feeds demoram ou falham?",
            answer:
              "Fontes externas nem sempre respondem bem. Algumas bloqueiam requisições diretas do navegador (CORS), outras mudam a estrutura do RSS ou saem do ar temporariamente. O proxy pode ajudar nesses casos.",
          },
          {
            question: "A versão web funciona igual ao app desktop?",
            answer:
              "Quase sempre, mas não necessariamente. A versão web depende das regras do navegador e da disponibilidade das fontes. O app desktop tende a ser mais estável e completo para uso contínuo.",
          },
        ],
      },
    ],
  },
  footer: {
    blurb:
      "Projeto open source para leitura pessoal e experimentação editorial.",
    copyright: `\u00A9 2026 \u00B7 ${APP_BRAND_NAME} \u00B7 MIT License`,
    columns: [
      {
        id: "product",
        title: "Produto",
        links: [
          { href: "#home", label: "Início" },
          { href: "#experience", label: "Experiência" },
          { href: "#project", label: "Projeto" },
          { href: "#faq", label: "FAQ" },
        ],
      },
      {
        id: "community",
        title: "Comunidade",
        links: [
          { href: PERSONAL_NEWS_REPO_URL, label: "GitHub" },
          { href: `${PERSONAL_NEWS_REPO_URL}/issues`, label: "Issues" },
          { href: `${PERSONAL_NEWS_REPO_URL}/blob/main/CONTRIBUTING.md`, label: "Contribuir" },
        ],
      },
      {
        id: "access",
        title: "Acesso",
        links: [
          { href: PERSONAL_NEWS_WEB_URL, label: "Versão web" },
          { href: PERSONAL_NEWS_RELEASES_URL, label: "Desktop" },
          { href: PERSONAL_SITE_PROJECTS_URL, label: "Mais projetos" },
        ],
      },
    ],
  },
};

const enUS: PromoContent = {
  nav: {
    brandLabel: APP_BRAND_NAME,
    pages: {
      home: "Home",
      experience: "Experience",
      project: "Project",
      faq: "FAQ",
    },
    openFeed: "Open feed",
    repo: "GitHub",
  },
  home: {
    eyebrow: "Focused reading, controlled environment",
    title: "Your feed, your rules. A distraction-free reading space.",
    lead: "Organize sources, adjust layouts, switch themes, and read only what matters.",
    subtitle:
      "Available as a local app, web version, or a full desktop application.",
    tags: [
      { id: "open-source", label: "Open source" },
      { id: "wcag", label: "Premium contrast" },
      { id: "responsive", label: "Scales from mobile to wide screens" },
    ],
    ctaLabel: "Open feed",
    imageAlt:
      "Personal News interface showing news cards organized in a clean, modern visual layout.",
    purposeEyebrow: "Purpose",
    purposeTitle: "Curate your sources, refine the typography, and find your pace.",
    purposeBody:
      "Traditional news feeds are noisy. Personal News transforms your daily reading into a clear, organized, and visually calm experience.",
    purposeSupport:
      "Visual hierarchy is strictly maintained, even when content volume grows.",
    availabilityEyebrow: "Availability",
    availabilityTitle: "A version tailored to your current need.",
    availabilityBody:
      "A flexible foundation: explore the web app, tweak the repository code, or install the desktop app for the most immersive experience.",
    versions: [
      {
        id: "repo",
        label: "Local from the repository",
        title: "Best for testing and tuning.",
        description:
          "Useful when you want control over sources and changes.",
        href: PERSONAL_NEWS_REPO_URL,
        linkLabel: "Open repository",
        icon: "repo",
      },
      {
        id: "web",
        label: "Online on GitHub Pages",
        title: "Quick to open in the browser.",
        description:
          "Useful to access and share the project.",
        href: PERSONAL_NEWS_WEB_URL,
        linkLabel: "Open web version",
        icon: "web",
      },
      {
        id: "desktop",
        label: "Desktop app",
        title: "The most complete version for everyday use.",
        description:
          "This is the primary destination for the product experience and long-term routine.",
        href: PERSONAL_NEWS_RELEASES_URL,
        linkLabel: "See releases",
        icon: "desktop",
      },
    ],
  },
  experience: {
    eyebrow: "Visual Experience",
    title: "Flexible layouts designed for reading comfort.",
    subtitle:
      "The interface adapts to your reading density. Choose the layout that sets the rhythm.",
    families: [
      {
        id: "editorial",
        label: "Editorial",
        title: "Emphasis and visual weight for top stories.",
        description:
          "Perfect for following a few sources and highlighting major themes.",
        variant: "editorial",
      },
      {
        id: "gallery",
        label: "Gallery",
        title: "Balanced display for multiple articles.",
        description:
          "A harmonious grid that retains breathing room between cards.",
        variant: "grid",
      },
      {
        id: "minimal",
        label: "Minimal",
        title: "Focus purely on typography and source headers.",
        description:
          "Imageless. An extremely fast text-first list.",
        variant: "minimal",
      },
      {
        id: "split",
        label: "Split",
        title: "Main column and sidebar always visible.",
        description:
          "A featured story on the left, a queue of articles on the right — dense reading with clear hierarchy.",
        variant: "split",
      },
      {
        id: "compact",
        label: "Compact",
        title: "Maximum density without sacrificing legibility.",
        description:
          "Tight cards in a dense grid, built for readers who follow many sources at once.",
        variant: "compact",
      },
    ],
    familiesCta: "There's even more. Open the app to explore Immersive, Split-List, and others.",
    familiesCtaLabel: "Open feed and try layouts",
    familiesOthers: "Also available in-app: Image-led, Split-List, Article-View.",
    tuningEyebrow: "Visual harmony",
    tuningTitle: "Absolute control over typography and density.",
    tuningBody:
      "Theme, spacing, and header behavior work in unison to provide a premium reading environment.",
    tuningPoints: [
      { id: "contrast", label: "Light and dark themes actively tuned for eye comfort." },
      { id: "header", label: "A minimalist header that recedes when you concentrate." },
      { id: "meta", label: "A strict visual spine aligning tags, sources, and dates." },
      { id: "screens", label: "Fluid responsiveness serving mobile devices to ultra-wide displays." },
    ],
    onboardingEyebrow: "Care & Transparency",
    onboardingTitle: "Audit your feeds before taking the first step.",
    onboardingBody:
      "No surprises during import. The onboarding flow presents every listed source.",
    onboardingSupport:
      "That makes each import easier to review.",
  },
  project: {
    eyebrow: "Open source project",
    title: "An open project for testing reading with care.",
    subtitle:
      "Technology, quality, commits, and authorship in one place.",
    technologyEyebrow: "Technology",
    technologyTitle: "React, Vite, and Bun support a lighter foundation.",
    technologyBody:
      "The foundation helps test feeds, themes, and reading without losing stability.",
    stackTokens: [
      { id: "react", label: "React + TypeScript" },
      { id: "vite", label: "Vite" },
      { id: "bun", label: "Bun" },
      { id: "quality", label: "Quality Core" },
    ],
    qualityEyebrow: "Expected quality",
    qualityTitle: "Expected quality, without improvisation.",
    qualityBody:
      "Each change is reviewed through contrast, typography, grid, and behavior.",
    qualityPoints: [
      { id: "type", label: "Typography with clear hierarchy." },
      { id: "layout", label: "Stable grid from hero to pagination." },
      { id: "states", label: "Predictable states and clear fallbacks." },
      { id: "wcag", label: "Contrast reviewed in light and dark themes." },
    ],
    commitsEyebrow: "Latest commits",
    commitsTitle: "Recent work stays visible.",
    commitsBody:
      "The latest history helps connect the page to the real state of the repository instead of pretending the product is static.",
    commitsSyncing: "Syncing with GitHub.",
    commitsFallback: "Showing a recent snapshot when GitHub does not answer in time.",
    commitsLive: "Updated directly from GitHub.",
    commitLinkLabel: "Open on GitHub",
    projectsEyebrow: "My projects",
    projectsTitle: "Other projects I develop",
    projectsBody:
      "Personal News is part of a series of personal projects where I explore the intersection of design and utility.",
    projects: [
      {
        id: "mark-lee",
        title: "Mark-Lee",
        description:
          "A desktop markdown editor built for focused writing and calmer visual rhythm.",
        href: MARK_LEE_URL,
        linkLabel: "See Mark-Lee",
      },
      {
        id: "spread",
        title: "Spread",
        description:
          "A visual studio for turning links and metadata into more authored and shareable outputs.",
        href: SPREAD_PROJECTS_URL,
        linkLabel: "See Spread",
      },
    ],
    aboutEyebrow: "About me",
    aboutTitle: "I am mafhper, and I developed Personal News.",
    aboutBody:
      "I use this project to test feeds, themes, performance, and reading patterns in public.",
    aboutSupport:
      "It sits beside my other open source work.",
    aboutMeta: "GitHub, personal site, and published projects",
    aboutLinkLabel: "Visit GitHub profile",
  },
  faq: {
    eyebrow: "Frequently asked questions",
    title: "Get answers before you start.",
    subtitle:
      "The essentials about versions, setup, and daily use.",
    groups: [
      {
        id: "getting-started",
        title: "Getting started",
        items: [
          {
            question: "Which version should I try first?",
            answer:
              "If you just want to explore, open the web version in your browser. For regular use, the desktop app is more stable. If you want full control over sources and themes, clone the repository and run it locally.",
          },
          {
            question: "Do I need to install anything?",
            answer:
              "Not for the web version. For local use, clone the repository, install dependencies, and start the dev server. The desktop app has ready-made installers in the GitHub releases tab.",
          },
          {
            question: "Can I import feeds from another reader?",
            answer:
              "Yes. The onboarding flow previews each list with its sites before you confirm, so you can review everything before importing.",
          },
        ],
      },
      {
        id: "customization",
        title: "Customization",
        items: [
          {
            question: "What can I customize?",
            answer:
              "Feed layout, light or dark theme, card density, categories, header behavior, and overall appearance. Everything is saved locally.",
          },
          {
            question: "How many feed layouts are available?",
            answer:
              "Four layout families: Editorial (strong highlight), Gallery (balanced grid), Minimal (title and source, no decoration), and Image-led (visual cards with preserved contrast).",
          },
        ],
      },
      {
        id: "network",
        title: "Feeds and network",
        items: [
          {
            question: "Why do some feeds load slowly or fail?",
            answer:
              "External sources do not always respond well. Some block direct browser requests (CORS), others change their RSS structure or go offline temporarily. The proxy can help in these cases.",
          },
          {
            question: "Does the web version work like the desktop app?",
            answer:
              "Almost always, but not necessarily. The web version depends on browser rules and source availability. The desktop app tends to be more stable and complete for ongoing use.",
          },
        ],
      },
    ],
  },
  footer: {
    blurb:
      "Open source project for personal reading, visual experimentation, and a calmer editorial experience.",
    copyright: `\u00A9 2026 \u00B7 ${APP_BRAND_NAME} \u00B7 MIT License`,
    columns: [
      {
        id: "product",
        title: "Product",
        links: [
          { href: "#home", label: "Home" },
          { href: "#experience", label: "Experience" },
          { href: "#project", label: "Project" },
          { href: "#faq", label: "FAQ" },
        ],
      },
      {
        id: "community",
        title: "Community",
        links: [
          { href: PERSONAL_NEWS_REPO_URL, label: "GitHub" },
          { href: `${PERSONAL_NEWS_REPO_URL}/issues`, label: "Issues" },
          { href: `${PERSONAL_NEWS_REPO_URL}/blob/main/CONTRIBUTING.md`, label: "Contribute" },
        ],
      },
      {
        id: "access",
        title: "Access",
        links: [
          { href: PERSONAL_NEWS_WEB_URL, label: "Web version" },
          { href: PERSONAL_NEWS_RELEASES_URL, label: "Desktop" },
          { href: PERSONAL_SITE_PROJECTS_URL, label: "More projects" },
        ],
      },
    ],
  },
};

export const getPromoContent = (language: Language): PromoContent => {
  if (language === "pt-BR") return ptBR;
  return enUS;
};
