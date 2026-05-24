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
    installCta: string;
    installCtaAriaLabel?: string;
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
      "Teste a demonstração online funcional; instale no desktop para a experiência completa.",
    primaryCta: "Abrir feed",
    installCta: "Instalar app",
    installCtaAriaLabel: "Instalar app",
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
      "Magazine",
      "Editorial",
      "Galeria",
      "Brutalist",
      "Minimal",
      "Bento",
      "Foco",
    ],
    modes: [
      {
        id: "magazine",
        label: "Magazine",
        title: "Uma capa para abrir o dia.",
        description:
          "Manchete forte, módulos visuais e ritmo de revista para descobrir o que importa.",
      },
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
        id: "brutalist",
        label: "Brutalist",
        title: "Contraste sem delicadeza.",
        description:
          "Blocos densos e leitura direta quando você quer uma interface mais afirmativa.",
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
          { href: "#home", label: "Início" },
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
      "Try the working online demo; install the desktop app for the complete experience.",
    primaryCta: "Open feed",
    installCta: "Install app",
    installCtaAriaLabel: "Install app",
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
    title: "Read the way the day feels.",
    body:
      "Some days need big headlines. Some days need a clean list. The interface follows the moment.",
    layoutTags: [
      "Magazine",
      "Editorial",
      "Gallery",
      "Brutalist",
      "Minimal",
      "Bento",
      "Focus",
    ],
    modes: [
      {
        id: "magazine",
        label: "Magazine",
        title: "A cover to open the day.",
        description:
          "A strong lead, visual modules, and magazine rhythm for finding what matters.",
      },
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
        id: "brutalist",
        label: "Brutalist",
        title: "Contrast without delicacy.",
        description:
          "Dense blocks and direct reading when you want a more assertive interface.",
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
    title: "Start fast. Keep it on desktop.",
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
        title: "Install the desktop app.",
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

const es: PromoContent = {
  nav: {
    brandLabel: APP_BRAND_NAME,
    pages: {
      home: "Inicio",
      experience: "Experiencia",
      project: "Proyecto",
      faq: "FAQ",
    },
    openFeed: "Abrir feed",
    repo: "GitHub",
  },
  hero: {
    eyebrow: "Sin anuncios. Sin rastreadores. Solo tus fuentes.",
    title: "Noticias a tu ritmo.",
    lead:
      "Prueba la demo online funcional; instala la app de escritorio para la experiencia completa.",
    primaryCta: "Abrir feed",
    installCta: "Instalar app",
    installCtaAriaLabel: "Instalar app",
    imageAlt:
      "Interfaz de Personal News con tarjetas de noticias en un layout editorial oscuro.",
    stats: [
      { id: "rss", value: "RSS", label: "fuentes elegidas por ti" },
      { id: "layouts", value: "Layouts", label: "para cada ritmo de lectura" },
      { id: "stack", value: "Sin cuenta", label: "control desde el comienzo" },
    ],
  },
  proof: {
    eyebrow: "Tus fuentes, lectura limpia",
    title: "Un lector personal para tu rutina.",
    body:
      "Personal News te ayuda a seguir muchas fuentes sin convertir todo en exceso.",
    features: [
      {
        id: "curation",
        eyebrow: "01 / Curaduría",
        title: "Elige tus fuentes.",
        description:
          "Crea una colección con los sitios que te importan y deja el resto fuera.",
        tag: "fuentes propias",
      },
      {
        id: "density",
        eyebrow: "02 / Ritmo",
        title: "Cambia la forma de leer.",
        description:
          "Editorial, grilla, lista o compacto: cada layout cambia la cadencia de la página.",
        tag: "layouts vivos",
      },
      {
        id: "routine",
        eyebrow: "03 / Rutina",
        title: "Abre y empieza.",
        description:
          "Una homepage ligera para consultar todos los días, sin cuenta y sin ceremonia.",
        tag: "uso diario",
      },
    ],
  },
  readingModes: {
    eyebrow: "Experiencia",
    title: "Lee como el día lo pida.",
    body:
      "A veces quieres titulares grandes. A veces, solo una lista limpia. La interfaz acompaña ese momento.",
    layoutTags: [
      "Magazine",
      "Editorial",
      "Galería",
      "Brutalist",
      "Minimal",
      "Bento",
      "Foco",
    ],
    modes: [
      {
        id: "magazine",
        label: "Magazine",
        title: "Una portada para empezar el día.",
        description:
          "Titular fuerte, módulos visuales y ritmo de revista para encontrar lo importante.",
      },
      {
        id: "editorial",
        label: "Editorial",
        title: "Da peso a lo que importa.",
        description:
          "La noticia principal gana espacio, jerarquía y contexto para abrir la lectura.",
      },
      {
        id: "gallery",
        label: "Galería",
        title: "Más contexto de una vez.",
        description:
          "Bueno para comparar fuentes y temas sin perder respiro.",
      },
      {
        id: "brutalist",
        label: "Brutalist",
        title: "Contraste sin delicadeza.",
        description:
          "Bloques densos y lectura directa cuando quieres una interfaz más afirmativa.",
      },
    ],
    ctaLabel: "Probar layouts en el feed",
  },
  workflow: {
    eyebrow: "Tu espacio",
    title: "Hecho para permanecer bajo tu control.",
    body:
      "La experiencia es simple en la superficie y transparente por debajo: abierta, local y fácil de adaptar.",
    steps: [
      {
        id: "collect",
        title: "Elige",
        description: "Agrega las fuentes que realmente quieres seguir.",
      },
      {
        id: "shape",
        title: "Organiza",
        description: "Separa por temas, ajusta el visual y encuentra tu ritmo.",
      },
      {
        id: "read",
        title: "Lee",
        description: "Abre la página y ve directo a lo que importa.",
      },
      {
        id: "keep",
        title: "Llévalo contigo",
        description: "Úsalo en la web, ejecútalo localmente o instala el desktop.",
      },
    ],
    stackLabel: "Open source",
    stack: ["React + TypeScript", "Vite", "Bun", "Tauri", "Quality Core"],
  },
  versions: {
    eyebrow: "Versiones",
    title: "Empieza rápido. Úsalo a diario en desktop.",
    body:
      "La web es el camino más rápido para probar. La app de escritorio es la experiencia principal para uso diario.",
    items: [
      {
        id: "web",
        label: "Web",
        title: "Abrir en el navegador.",
        description: "La forma más rápida de sentir la experiencia.",
        href: PERSONAL_NEWS_WEB_URL,
        linkLabel: "Abrir versión web",
      },
      {
        id: "desktop",
        label: "Desktop",
        title: "Instalar la app de escritorio.",
        description:
          "Para convertir el feed en una herramienta diaria más estable y completa.",
        href: PERSONAL_NEWS_RELEASES_URL,
        linkLabel: "Ver todos los releases",
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
        label: "Repositorio",
        title: "Ejecutar y adaptar localmente.",
        description:
          "Para ajustar fuentes, temas y comportamiento con calma.",
        href: PERSONAL_NEWS_REPO_URL,
        linkLabel: "Ver código",
      },
    ],
  },
  project: {
    eyebrow: "Proyecto abierto",
    title: "Hecho para uso real. Abierto para evolucionar.",
    body:
      "Personal News nació como herramienta personal y sigue abierto para quien quiera leer, adaptar o aprender con el proyecto.",
    authorName: DEVELOPER_HANDLE,
    authorMeta: "GitHub, portafolio y proyectos propios",
    authorLinkLabel: "Visitar GitHub",
    projectsTitle: "Proyectos relacionados",
    allProjectsLabel: "Ver todos los proyectos en GitHub",
    projects: [
      {
        id: "mark-lee",
        title: "Mark-Lee",
        description:
          "Editor desktop para escritura enfocada, con una cadencia visual más calma.",
        href: MARK_LEE_URL,
        linkLabel: "Conocer Mark-Lee",
      },
      {
        id: "spread",
        title: "Spread",
        description:
          "Estudio visual para transformar enlaces y metadatos en composiciones compartibles.",
        href: SPREAD_PROJECTS_URL,
        linkLabel: "Ver Spread",
      },
      {
        id: "imaginizim",
        title: "Imaginizim",
        description:
          "Compresor de imágenes para reducir peso sin complicar el flujo de publicación.",
        href: "https://github.com/mafhper/imaginizim",
        linkLabel: "Ver Imaginizim",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Lo esencial antes de abrir el feed.",
    body: "Respuestas cortas, sin rodeos.",
    items: [
      {
        question: "¿Qué versión debería probar primero?",
        answer:
          "Empieza por la versión web. Si te gusta la idea, prueba desktop o ejecuta el proyecto localmente.",
      },
      {
        question: "¿Necesito crear una cuenta?",
        answer: "No. Puedes probar el proyecto sin registrarte.",
      },
      {
        question: "¿Puedo importar mis feeds?",
        answer:
          "Sí. Revisas las fuentes antes de confirmar la importación.",
      },
      {
        question: "¿La versión web funciona igual que desktop?",
        answer:
          "No exactamente. La web es excelente para conocer el proyecto; desktop es mejor para uso continuo.",
      },
    ],
  },
  footer: {
    blurb:
      "Proyecto open source para lectura personal, curaduría de fuentes y experimentación editorial.",
    copyright: `© 2026 · ${APP_BRAND_NAME} · MIT License`,
    columns: [
      {
        id: "product",
        title: "Producto",
        links: [
          { href: "#home", label: "Inicio" },
          { href: "#experience", label: "Experiencia" },
          { href: "#project", label: "Proyecto" },
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
          { href: PERSONAL_SITE_PROJECTS_URL, label: "Más proyectos" },
        ],
      },
    ],
  },
};

export const getPromoContent = (language: Language): PromoContent => {
  if (language === "pt-BR") return ptBR;
  if (language === "es") return es;
  return enUS;
};
