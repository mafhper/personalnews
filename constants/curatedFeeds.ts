import { FeedSource } from "../types";

export const DEFAULT_FEEDS: FeedSource[] = [
  // Dev
  { url: "https://news.ycombinator.com/rss", categoryId: "dev", customTitle: "Hacker News" },
  { url: "https://developer.mozilla.org/en-US/blog/feed.xml", categoryId: "dev", customTitle: "MDN Web Docs" },
  { url: "https://adrenaline.com.br/feed/", categoryId: "dev", customTitle: "Adrenaline" },
  { url: "https://github.blog/feed/", categoryId: "dev", customTitle: "GitHub Blog" },
  { url: "https://tecnoblog.net/feed/", categoryId: "dev", customTitle: "Tecnoblog" },

  // Design
  { url: "https://www.nngroup.com/feed/rss/", categoryId: "design", customTitle: "Nielsen Norman Group" },
  { url: "https://uxdesign.cc/feed", categoryId: "design", customTitle: "UX Collective" },
  { url: "https://www.figma.com/blog/feed/", categoryId: "design", customTitle: "Figma Blog" },
  { url: "https://zupi.com.br/feed/", categoryId: "design", customTitle: "Revista Zupi" },
  { url: "https://designculture.com.br/feed", categoryId: "design", customTitle: "Design Culture" },

  // Ciência
  { url: "https://www.nature.com/subjects/news.rss", categoryId: "ciencia", customTitle: "Nature News" },
  { url: "https://www.nasa.gov/rss/", categoryId: "ciencia", customTitle: "NASA" },
  { url: "https://jornal.usp.br/feed/", categoryId: "ciencia", customTitle: "USP Notícias" },
  { url: "https://www.inovacaotecnologica.com.br/rss/", categoryId: "ciencia", customTitle: "Inovação Tecnológica" },
  { url: "https://www.scientificamerican.com/feed/", categoryId: "ciencia", customTitle: "Scientific American" },

  // Mundo
  { url: "https://www.reuters.com/rssFeed/worldNews", categoryId: "mundo", customTitle: "Reuters World" },
  { url: "http://feeds.bbci.co.uk/news/world/rss.xml", categoryId: "mundo", customTitle: "BBC World" },
  { url: "https://www.theverge.com/rss/index.xml", categoryId: "mundo", customTitle: "The Verge" },
  { url: "https://www.nexojornal.com.br/rss", categoryId: "mundo", customTitle: "Nexo Jornal" },
  { url: "https://feeds.folha.uol.com.br/emtempo/rss091.xml", categoryId: "mundo", customTitle: "Folha de S.Paulo" }
];

export const CURATED_FEEDS_BR: FeedSource[] = [
  // Dev
  { url: "https://tecnoblog.net/feed/", categoryId: "dev" },
  { url: "https://meiobit.com/feed/", categoryId: "dev" },
  { url: "https://macmagazine.com.br/feed/", categoryId: "dev" },
  { url: "https://manualdousuario.net/feed/", categoryId: "dev" },
  { url: "https://diolinux.com.br/feed", categoryId: "dev" },
  { url: "https://adrenaline.com.br/rss", categoryId: "dev" },
  { url: "https://canaltech.com.br/rss/", categoryId: "dev" },
  
  // Design
  { url: "https://zupi.com.br/feed/", categoryId: "design" },
  { url: "https://designculture.com.br/feed", categoryId: "design" },

  // Ciência
  { url: "https://jornal.usp.br/feed/", categoryId: "ciencia" },
  { url: "https://portal.fiocruz.br/rss", categoryId: "ciencia" },
  { url: "https://www.inovacaotecnologica.com.br/rss/", categoryId: "ciencia" },
  { url: "https://g1.globo.com/rss/g1/ciencia-e-saude/", categoryId: "ciencia" },
  { url: "https://www.uol.com.br/rss/", categoryId: "ciencia" },
  
  // Mundo
  { url: "https://feeds.folha.uol.com.br/emtempo/rss091.xml", categoryId: "mundo" },
  { url: "https://www.estadao.com.br/rss/ultimas/", categoryId: "mundo" },
  { url: "https://theintercept.com/br/feed/", categoryId: "mundo" },
  { url: "https://www.correiobraziliense.com.br/rss.xml", categoryId: "mundo" },
  { url: "https://oglobo.globo.com/rss.xml", categoryId: "mundo" }
];

export const CURATED_FEEDS_INTL: FeedSource[] = [
  // Dev
  { url: "https://www.theverge.com/rss/index.xml", categoryId: "dev" },
  { url: "https://www.wired.com/feed/rss", categoryId: "dev" },
  { url: "https://techcrunch.com/feed/", categoryId: "dev" },
  { url: "https://arstechnica.com/feed/", categoryId: "dev" },
  { url: "https://www.engadget.com/rss.xml", categoryId: "dev" },
  { url: "https://9to5mac.com/feed/", categoryId: "dev" },
  { url: "https://www.androidpolice.com/feed/", categoryId: "dev" },
  { url: "https://news.ycombinator.com/rss", categoryId: "dev" },
  
  // Design
  { url: "https://www.smashingmagazine.com/feed/", categoryId: "design" },
  { url: "https://css-tricks.com/feed/", categoryId: "design" },
  { url: "https://www.nngroup.com/feed/rss/", categoryId: "design" },
  { url: "https://uxdesign.cc/feed", categoryId: "design" },
  
  // Ciência
  { url: "https://www.nature.com/subjects/news.rss", categoryId: "ciencia" },
  { url: "https://www.nasa.gov/rss/", categoryId: "ciencia" },
  { url: "https://www.scientificamerican.com/feed/", categoryId: "ciencia" },
  { url: "https://www.esa.int/rssfeed/Our_Activities", categoryId: "ciencia" },
  { url: "https://www.sciencenews.org/feed", categoryId: "ciencia" },
  
  // Mundo
  { url: "https://www.reuters.com/rssFeed/worldNews", categoryId: "mundo" },
  { url: "http://feeds.bbci.co.uk/news/world/rss.xml", categoryId: "mundo" }
];
