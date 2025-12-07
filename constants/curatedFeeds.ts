import { FeedSource } from "../types";

export const DEFAULT_FEEDS: FeedSource[] = [
  // Dev
  { url: "https://news.ycombinator.com/rss", categoryId: "dev", customTitle: "Hacker News" },
  { url: "https://github.blog/feed/", categoryId: "dev", customTitle: "GitHub Blog" },
  { url: "https://tecnoblog.net/feed/", categoryId: "dev", customTitle: "Tecnoblog" },
  { url: "https://www.theverge.com/rss/index.xml", categoryId: "dev", customTitle: "The Verge" },
  { url: "https://techcrunch.com/feed/", categoryId: "dev", customTitle: "TechCrunch" },

  // Design
  { url: "https://uxdesign.cc/feed", categoryId: "design", customTitle: "UX Collective" },

  { url: "https://designculture.com.br/feed", categoryId: "design", customTitle: "Design Culture" },

  // Ciência
  { url: "https://www.sciencenews.org/feed", categoryId: "ciencia", customTitle: "Science News" },
  { url: "https://www.nasa.gov/news-release/feed/", categoryId: "ciencia", customTitle: "NASA News" },


  // Mundo
  { url: "http://feeds.bbci.co.uk/news/world/rss.xml", categoryId: "mundo", customTitle: "BBC World" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", categoryId: "mundo", customTitle: "NY Times World" },

];

export const CURATED_FEEDS_BR: FeedSource[] = [
  // Dev / Tech
  { url: "https://tecnoblog.net/feed/", categoryId: "dev", customTitle: "Tecnoblog" },
  { url: "https://canaltech.com.br/rss/", categoryId: "dev", customTitle: "Canaltech" },
  { url: "https://manualdousuario.net/feed/", categoryId: "dev", customTitle: "Manual do Usuário" },
  { url: "https://diolinux.com.br/feed", categoryId: "dev", customTitle: "Diolinux" },
  { url: "https://adrenaline.com.br/feed/", categoryId: "dev", customTitle: "Adrenaline" },
  { url: "https://meiobit.com/feed/", categoryId: "dev", customTitle: "Meio Bit" },
  { url: "https://macmagazine.com.br/feed/", categoryId: "dev", customTitle: "MacMagazine" },
  
  // Design
  { url: "https://designculture.com.br/feed", categoryId: "design", customTitle: "Design Culture" },
  { url: "https://zupi.com.br/feed/", categoryId: "design", customTitle: "Revista Zupi" },

  // Ciência
  { url: "https://jornal.usp.br/feed/", categoryId: "ciencia", customTitle: "Jornal USP" },
  { url: "https://g1.globo.com/rss/g1/ciencia-e-saude/", categoryId: "ciencia", customTitle: "G1 Ciência" },
  { url: "https://revistapesquisa.fapesp.br/feed/", categoryId: "ciencia", customTitle: "Revista Pesquisa FAPESP" },
  
  // Mundo / Notícias


  { url: "https://www.estadao.com.br/rss/ultimas.xml", categoryId: "mundo", customTitle: "Estadão" },
  { url: "https://theintercept.com/brasil/feed/", categoryId: "mundo", customTitle: "The Intercept Brasil" }
];

export const CURATED_FEEDS_INTL: FeedSource[] = [
  // Dev / Tech
  { url: "https://www.theverge.com/rss/index.xml", categoryId: "dev", customTitle: "The Verge" },
  { url: "https://www.wired.com/feed/rss", categoryId: "dev", customTitle: "Wired" },
  { url: "https://techcrunch.com/feed/", categoryId: "dev", customTitle: "TechCrunch" },
  { url: "https://arstechnica.com/feed/", categoryId: "dev", customTitle: "Ars Technica" },
  { url: "https://www.engadget.com/rss.xml", categoryId: "dev", customTitle: "Engadget" },
  { url: "https://9to5mac.com/feed/", categoryId: "dev", customTitle: "9to5Mac" },
  { url: "https://www.androidpolice.com/feed/", categoryId: "dev", customTitle: "Android Police" },
  { url: "https://news.ycombinator.com/rss", categoryId: "dev", customTitle: "Hacker News" },
  
  // Design

  { url: "https://css-tricks.com/feed/", categoryId: "design", customTitle: "CSS-Tricks" },
  { url: "https://www.nngroup.com/feed/rss/", categoryId: "design", customTitle: "Nielsen Norman Group" },
  { url: "https://uxdesign.cc/feed", categoryId: "design", customTitle: "UX Collective" },
  
  // Ciência
  { url: "https://www.sciencenews.org/feed", categoryId: "ciencia", customTitle: "Science News" },
  { url: "https://www.nasa.gov/news-release/feed/", categoryId: "ciencia", customTitle: "NASA News" },

  { url: "https://www.space.com/feeds/all", categoryId: "ciencia", customTitle: "Space.com" },
  { url: "https://phys.org/rss-feed/", categoryId: "ciencia", customTitle: "Phys.org" },
  
  // Mundo
  { url: "http://feeds.bbci.co.uk/news/world/rss.xml", categoryId: "mundo", customTitle: "BBC World" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", categoryId: "mundo", customTitle: "NY Times World" },
  { url: "https://www.theguardian.com/world/rss", categoryId: "mundo", customTitle: "The Guardian World" },
  { url: "https://feeds.npr.org/1001/rss.xml", categoryId: "mundo", customTitle: "NPR News" }
];
