import type { Language } from "../types";
import {
  APP_BRAND_NAME,
  DEVELOPER_GITHUB_URL,
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

type PromoLink = {
  href: string;
  label: string;
};

type PromoNav = {
  brandLabel: string;
  pages: Record<PromoPageId, string>;
  openFeed: string;
  repo: string;
};

type PromoStat = {
  id: string;
  label: string;
  value: string;
};

type PromoFeature = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  tag: string;
};

type PromoMode = {
  id: string;
  label: string;
  title: string;
  description: string;
};

type PromoWorkflowStep = {
  id: string;
  title: string;
  description: string;
};

type PromoVersion = {
  id: string;
  label: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  featured?: boolean;
  platformLinks?: PromoLink[];
};

type PromoProject = {
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

type FooterColumn = {
  id: string;
  title: string;
  links: PromoLink[];
};

type PromoContent = {
  nav: PromoNav;
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    primaryCta: string;
    secondaryCta: string;
    imageAlt: string;
    stats: PromoStat[];
  };
  proof: {
    eyebrow: string;
    title: string;
    body: string;
    features: PromoFeature[];
  };
  readingModes: {
    eyebrow: string;
    title: string;
    body: string;
    layoutTags: string[];
    modes: PromoMode[];
    ctaLabel: string;
  };
  workflow: {
    eyebrow: string;
    title: string;
    body: string;
    steps: PromoWorkflowStep[];
    stackLabel: string;
    stack: string[];
  };
  versions: {
    eyebrow: string;
    title: string;
    body: string;
    items: PromoVersion[];
  };
  project: {
    eyebrow: string;
    title: string;
    body: string;
    authorName: string;
    authorMeta: string;
    authorLinkLabel: string;
    projectsTitle: string;
    allProjectsLabel: string;
    projects: PromoProject[];
  };
  faq: {
    eyebrow: string;
    title: string;
    body: string;
    items: FaqItem[];
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
  hero: {
    eyebrow: "Sem anúncios. Sem rastreadores. Só suas fontes.",
    title: "Notícias no seu ritmo.",
    lead:
      "Organize suas fontes e leia em uma página rápida, bonita e sem distrações.",
    primaryCta: "Abrir feed",
    secondaryCta: "Ver experiência",
    imageAlt:
      "Interface do Personal News com cards de notícias em um layout editorial escuro.",
    stats: [
      { id: "rss", value: "RSS", label: "fontes escolhidas por você" },
      { id: "layouts", value: "Layouts", label: "para cada ritmo de leitura" },
      { id: "stack", value: "Sem conta", label: "controle desde o começo" },
    ],
  },
  proof: {
    eyebrow: "Fontes suas, leitura limpa",
    title: "Um leitor pessoal para a sua rotina.",
    body:
      "O Personal News ajuda você a acompanhar muita coisa sem transformar tudo em excesso.",
    features: [
      {
        id: "curation",
        eyebrow: "01 / Curadoria",
        title: "Escolha suas fontes.",
        description:
          "Monte uma coleção com os sites que importam e deixe o resto de fora.",
        tag: "fontes próprias",
      },
      {
        id: "density",
        eyebrow: "02 / Ritmo",
        title: "Mude o jeito de ler.",
        description:
          "Destaque, grade, lista ou compacto: cada layout muda a cadência da página.",
        tag: "layouts vivos",
      },
      {
        id: "routine",
        eyebrow: "03 / Rotina",
        title: "Abra e comece.",
        description:
          "Uma homepage leve para consultar todos os dias, sem cadastro e sem cerimônia.",
        tag: "uso diário",
      },
    ],
  },
  readingModes: {
    eyebrow: "Experiência",
    title: "Leia do jeito que o dia pede.",
    body:
      "Às vezes você quer manchetes grandes. Às vezes, só uma lista limpa. A interface acompanha esse momento.",
    layoutTags: [
      "Editorial",
      "Galeria",
      "Minimal",
      "Bento",
      "Jornal",
      "Timeline",
      "Foco",
    ],
    modes: [
      {
        id: "editorial",
        label: "Editorial",
        title: "Dê peso ao que importa.",
        description:
          "A notícia principal ganha espaço, hierarquia e contexto para abrir a leitura.",
      },
      {
        id: "gallery",
        label: "Galeria",
        title: "Mais contexto de uma vez.",
        description:
          "Bom para comparar fontes e assuntos sem perder o respiro.",
      },
      {
        id: "minimal",
        label: "Minimal",
        title: "Só o essencial.",
        description:
          "Títulos, fontes e velocidade quando você quer varrer o feed.",
      },
    ],
    ctaLabel: "Testar layouts no feed",
  },
  workflow: {
    eyebrow: "Seu espaço",
    title: "Feito para ficar sob seu controle.",
    body:
      "A experiência é simples na superfície e transparente por baixo: aberta, local e fácil de adaptar.",
    steps: [
      {
        id: "collect",
        title: "Escolha",
        description: "Adicione as fontes que você realmente quer acompanhar.",
      },
      {
        id: "shape",
        title: "Organize",
        description: "Separe por temas, ajuste o visual e encontre seu ritmo.",
      },
      {
        id: "read",
        title: "Leia",
        description: "Abra a página e vá direto ao que importa.",
      },
      {
        id: "keep",
        title: "Leve junto",
        description: "Use na web, rode localmente ou instale no desktop.",
      },
    ],
    stackLabel: "Open source",
    stack: ["React + TypeScript", "Vite", "Bun", "Tauri", "Quality Core"],
  },
  versions: {
    eyebrow: "Versões",
    title: "Comece fácil. Fique com a versão definitiva.",
    body:
      "A web é o caminho mais rápido para testar. O desktop é a experiência principal para usar todos os dias.",
    items: [
      {
        id: "web",
        label: "Web",
        title: "Abrir no navegador.",
        description:
          "A forma mais rápida de sentir a experiência.",
        href: PERSONAL_NEWS_WEB_URL,
        linkLabel: "Abrir versão web",
      },
      {
        id: "desktop",
        label: "Desktop",
        title: "Instalar a versão definitiva.",
        description:
          "Para transformar o feed em uma ferramenta diária, mais estável e completa.",
        href: PERSONAL_NEWS_RELEASES_URL,
        linkLabel: "Ver todos os releases",
        featured: true,
        platformLinks: [
          {
            label: "Windows",
            href: "https://github.com/mafhper/personalnews/releases/download/v1.10.2/PersonalNews_1.10.2_x64-setup.exe",
          },
          {
            label: "macOS",
            href: "https://github.com/mafhper/personalnews/releases/download/v1.10.2/PersonalNews_1.10.2_aarch64.dmg",
          },
          {
            label: "Linux",
            href: "https://github.com/mafhper/personalnews/releases/download/v1.10.2/PersonalNews_1.10.2_amd64.deb",
          },
        ],
      },
      {
        id: "repo",
        label: "Repositório",
        title: "Rodar e adaptar localmente.",
        description:
          "Para ajustar fontes, temas e comportamento com calma.",
        href: PERSONAL_NEWS_REPO_URL,
        linkLabel: "Ver código",
      },
    ],
  },
  project: {
    eyebrow: "Projeto aberto",
    title: "Feito para uso real. Aberto para evoluir.",
    body:
      "Personal News nasceu como ferramenta pessoal e segue aberto para quem quer ler, adaptar ou aprender com o projeto.",
    authorName: DEVELOPER_HANDLE,
    authorMeta: "GitHub, portfólio e projetos autorais",
    authorLinkLabel: "Visitar GitHub",
    projectsTitle: "Projetos relacionados",
    allProjectsLabel: "Ver todos os projetos no GitHub",
    projects: [
      {
        id: "mark-lee",
        title: "Mark-Lee",
        description:
          "Editor desktop para escrita focada, com uma cadência visual mais calma.",
        href: MARK_LEE_URL,
        linkLabel: "Conhecer Mark-Lee",
      },
      {
        id: "spread",
        title: "Spread",
        description:
          "Estúdio visual para transformar links e metadados em composições compartilháveis.",
        href: SPREAD_PROJECTS_URL,
        linkLabel: "Ver Spread",
      },
      {
        id: "imaginizim",
        title: "Imaginizim",
        description:
          "Compressor de imagens para reduzir peso sem complicar o fluxo de publicação.",
        href: "https://github.com/mafhper/imaginizim",
        linkLabel: "Ver Imaginizim",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "O essencial antes de abrir o feed.",
    body:
      "Respostas curtas, sem rodeio.",
    items: [
      {
        question: "Qual versão devo testar primeiro?",
        answer:
          "Comece pela versão web. Se gostar da ideia, experimente o desktop ou rode o projeto localmente.",
      },
      {
        question: "Preciso criar conta?",
        answer:
          "Não. Você pode experimentar o projeto sem cadastro.",
      },
      {
        question: "Posso importar meus feeds?",
        answer:
          "Sim. Você revisa as fontes antes de confirmar a importação.",
      },
      {
        question: "A versão web funciona igual ao desktop?",
        answer:
          "Não exatamente. A web é ótima para conhecer; o desktop é melhor para uso contínuo.",
      },
    ],
  },
  footer: {
    blurb:
      "Projeto open source para leitura pessoal, curadoria de fontes e experimentação editorial.",
    copyright: `© 2026 · ${APP_BRAND_NAME} · MIT License`,
    columns: [
      {
        id: "product",
        title: "Produto",
        links: [
          { href: "#home", label: "Inicio" },
          { href: "#experience", label: "Experiência" },
          { href: "#project", label: "Projeto" },
          { href: "#faq", label: "FAQ" },
        ],
      },
      {
        id: "code",
        title: "Código",
        links: [
          { href: PERSONAL_NEWS_REPO_URL, label: "GitHub" },
          { href: PERSONAL_NEWS_RELEASES_URL, label: "Releases" },
          { href: `${PERSONAL_NEWS_REPO_URL}/issues`, label: "Issues" },
        ],
      },
      {
        id: "author",
        title: "Autor",
        links: [
          { href: DEVELOPER_GITHUB_URL, label: "Perfil GitHub" },
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
  hero: {
    eyebrow: "No ads. No trackers. Just your sources.",
    title: "News at your pace.",
    lead:
      "Collect your favorite sources and read them in a fast, calm, distraction-free page.",
    primaryCta: "Open feed",
    secondaryCta: "See experience",
    imageAlt:
      "Personal News interface with news cards arranged in a dark editorial layout.",
    stats: [
      { id: "rss", value: "RSS", label: "sources chosen by you" },
      { id: "layouts", value: "Layouts", label: "for each reading rhythm" },
      { id: "stack", value: "No account", label: "control from the start" },
    ],
  },
  proof: {
    eyebrow: "Your sources, clean reading",
    title: "A personal reader for your routine.",
    body:
      "Personal News helps you follow a lot without making everything feel like too much.",
    features: [
      {
        id: "curation",
        eyebrow: "01 / Curation",
        title: "Choose your sources.",
        description:
          "Build a collection from the sites you care about and leave the rest out.",
        tag: "your sources",
      },
      {
        id: "density",
        eyebrow: "02 / Rhythm",
        title: "Change the way you read.",
        description:
          "Editorial, grid, list, or compact: each layout changes the page cadence.",
        tag: "living layouts",
      },
      {
        id: "routine",
        eyebrow: "03 / Routine",
        title: "Open and start.",
        description:
          "A lightweight homepage for daily checks, with no account and no ceremony.",
        tag: "daily use",
      },
    ],
  },
  readingModes: {
    eyebrow: "Experience",
    title: "Read the way the day asks.",
    body:
      "Some days need big headlines. Some days need a clean list. The interface follows the moment.",
    layoutTags: [
      "Editorial",
      "Gallery",
      "Minimal",
      "Bento",
      "Newspaper",
      "Timeline",
      "Focus",
    ],
    modes: [
      {
        id: "editorial",
        label: "Editorial",
        title: "Give weight to what matters.",
        description:
          "The lead story gets space, hierarchy, and context to open the reading session.",
      },
      {
        id: "gallery",
        label: "Gallery",
        title: "More context at once.",
        description:
          "Compare sources and topics without losing breathing room.",
      },
      {
        id: "minimal",
        label: "Minimal",
        title: "Only the essentials.",
        description:
          "Titles, sources, and speed when you want to scan the feed.",
      },
    ],
    ctaLabel: "Try layouts in the feed",
  },
  workflow: {
    eyebrow: "Your space",
    title: "Made to stay under your control.",
    body:
      "Simple on the surface, transparent underneath: open, local, and easy to adapt.",
    steps: [
      {
        id: "collect",
        title: "Choose",
        description: "Add the sources you actually want to follow.",
      },
      {
        id: "shape",
        title: "Organize",
        description: "Separate topics, tune the look, and find your pace.",
      },
      {
        id: "read",
        title: "Read",
        description: "Open the page and go straight to what matters.",
      },
      {
        id: "keep",
        title: "Keep it",
        description: "Use it on the web, run it locally, or install desktop.",
      },
    ],
    stackLabel: "Open source",
    stack: ["React + TypeScript", "Vite", "Bun", "Tauri", "Quality Core"],
  },
  versions: {
    eyebrow: "Versions",
    title: "Start easily. Stay with the definitive version.",
    body:
      "The web version is the fastest way to try it. Desktop is the main experience for daily use.",
    items: [
      {
        id: "web",
        label: "Web",
        title: "Open in the browser.",
        description:
          "The fastest way to feel the experience.",
        href: PERSONAL_NEWS_WEB_URL,
        linkLabel: "Open web version",
      },
      {
        id: "desktop",
        label: "Desktop",
        title: "Install the definitive version.",
        description:
          "For turning the feed into a steadier, more complete daily tool.",
        href: PERSONAL_NEWS_RELEASES_URL,
        linkLabel: "See all releases",
        featured: true,
        platformLinks: [
          {
            label: "Windows",
            href: "https://github.com/mafhper/personalnews/releases/download/v1.10.2/PersonalNews_1.10.2_x64-setup.exe",
          },
          {
            label: "macOS",
            href: "https://github.com/mafhper/personalnews/releases/download/v1.10.2/PersonalNews_1.10.2_aarch64.dmg",
          },
          {
            label: "Linux",
            href: "https://github.com/mafhper/personalnews/releases/download/v1.10.2/PersonalNews_1.10.2_amd64.deb",
          },
        ],
      },
      {
        id: "repo",
        label: "Repository",
        title: "Run and adapt locally.",
        description:
          "For tuning sources, themes, and behavior at your own pace.",
        href: PERSONAL_NEWS_REPO_URL,
        linkLabel: "See code",
      },
    ],
  },
  project: {
    eyebrow: "Open project",
    title: "Built for real use. Open to evolve.",
    body:
      "Personal News started as a personal tool and stays open for people who want to read, adapt, or learn from it.",
    authorName: DEVELOPER_HANDLE,
    authorMeta: "GitHub, portfolio, and authored projects",
    authorLinkLabel: "Visit GitHub",
    projectsTitle: "Related projects",
    allProjectsLabel: "See all projects on GitHub",
    projects: [
      {
        id: "mark-lee",
        title: "Mark-Lee",
        description:
          "A desktop editor for focused writing, with a calmer visual cadence.",
        href: MARK_LEE_URL,
        linkLabel: "See Mark-Lee",
      },
      {
        id: "spread",
        title: "Spread",
        description:
          "A visual studio for turning links and metadata into shareable compositions.",
        href: SPREAD_PROJECTS_URL,
        linkLabel: "See Spread",
      },
      {
        id: "imaginizim",
        title: "Imaginizim",
        description:
          "An image compressor for reducing file weight without complicating publishing.",
        href: "https://github.com/mafhper/imaginizim",
        linkLabel: "See Imaginizim",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "The essentials before opening the feed.",
    body: "Short answers, no detours.",
    items: [
      {
        question: "Which version should I try first?",
        answer:
          "Start with the web version. If the idea clicks, try desktop or run the project locally.",
      },
      {
        question: "Do I need an account?",
        answer:
          "No. You can try the project without creating an account.",
      },
      {
        question: "Can I import my feeds?",
        answer:
          "Yes. You review sources before confirming the import.",
      },
      {
        question: "Does the web version work like desktop?",
        answer:
          "Not exactly. The web version is great for exploring; desktop is better for daily use.",
      },
    ],
  },
  footer: {
    blurb:
      "Open source project for personal reading, source curation, and editorial experimentation.",
    copyright: `© 2026 · ${APP_BRAND_NAME} · MIT License`,
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
        id: "code",
        title: "Code",
        links: [
          { href: PERSONAL_NEWS_REPO_URL, label: "GitHub" },
          { href: PERSONAL_NEWS_RELEASES_URL, label: "Releases" },
          { href: `${PERSONAL_NEWS_REPO_URL}/issues`, label: "Issues" },
        ],
      },
      {
        id: "author",
        title: "Author",
        links: [
          { href: DEVELOPER_GITHUB_URL, label: "GitHub profile" },
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
