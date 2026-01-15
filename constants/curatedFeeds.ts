/**
 * ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITE DIRETAMENTE
 * Edite config/initial-setup.md e rode 'bun run config:sync'
 */

import { FeedSource, FeedCategory } from "../types";

export const INITIAL_APP_CONFIG = {
  "theme": "dark-blue",
  "layout": "bento",
  "timeFormat": "24h",
  "header": "sticky",
  "weatherCity": "São Paulo"
};

export const DEFAULT_CATEGORIES: FeedCategory[] = [
  {
    "id": "all",
    "name": "All",
    "color": "#6B7280",
    "order": 0,
    "isDefault": true,
    "isPinned": true
  },
  {
    "order": 1,
    "isDefault": true,
    "name": "Design",
    "id": "design",
    "color": "#F0EEE9",
    "layoutMode": "gallery",
    "headerPosition": "sticky",
    "isPinned": false,
    "autoDiscovery": true,
    "description": "Inspiração visual, UX/UI e tendências de design."
  },
  {
    "order": 2,
    "isDefault": true,
    "name": "Games",
    "id": "games",
    "color": "#F59E0B",
    "layoutMode": "masonry",
    "headerPosition": "sticky",
    "isPinned": false,
    "autoDiscovery": true,
    "description": "Lançamentos, reviews e cultura gamer."
  },
  {
    "order": 3,
    "isDefault": true,
    "name": "Tecnologia",
    "id": "tech",
    "color": "#3B82F6",
    "layoutMode": "modern",
    "headerPosition": "sticky",
    "isPinned": false,
    "autoDiscovery": true,
    "description": "Notícias sobre desenvolvimento, gadgets e o mundo tech."
  },
  {
    "order": 4,
    "isDefault": true,
    "name": "Política",
    "id": "politics",
    "color": "#EF4444",
    "layoutMode": "list",
    "headerPosition": "sticky",
    "isPinned": false,
    "autoDiscovery": true,
    "description": "Cobertura política nacional e internacional."
  },
  {
    "order": 5,
    "isDefault": true,
    "name": "Vídeos",
    "id": "youtube",
    "color": "#C4302B",
    "layoutMode": "brutalist",
    "headerPosition": "sticky",
    "isPinned": false,
    "autoDiscovery": false,
    "description": "Canais preferidos do Youtube."
  }
];

export const DEFAULT_FEEDS: FeedSource[] = [
  {
    "url": "https://www.b9.com.br/feed/",
    "categoryId": "design",
    "customTitle": "B9"
  },
  {
    "url": "https://css-tricks.com/feed/",
    "categoryId": "design",
    "customTitle": "CSS-Tricks"
  },
  {
    "url": "https://www.dezeen.com/feed/",
    "categoryId": "design",
    "customTitle": "Dezeen"
  },
  {
    "url": "https://uxdesign.cc/feed",
    "categoryId": "design",
    "customTitle": "UX Collective"
  },
  {
    "url": "https://adrenaline.com.br/feed/",
    "categoryId": "games",
    "customTitle": "Adrenaline"
  },
  {
    "url": "https://naogames.jogabilida.de/",
    "categoryId": "games",
    "customTitle": "Jogabilidade (Não Games)"
  },
  {
    "url": "https://kotaku.com/rss",
    "categoryId": "games",
    "customTitle": "Kotaku"
  },
  {
    "url": "https://www.polygon.com/feed/",
    "categoryId": "games",
    "customTitle": "Polygon"
  },
  {
    "url": "https://www.pcgamer.com/feeds.xml",
    "categoryId": "games",
    "customTitle": "PC Gamer"
  },
  {
    "url": "https://g1.globo.com/rss/g1/politica/",
    "categoryId": "politics",
    "customTitle": "G1 Política"
  },
  {
    "url": "https://midianinja.org/feed/",
    "categoryId": "politics",
    "customTitle": "Mídia Ninja"
  },
  {
    "url": "https://piaui.folha.uol.com.br/feed/",
    "categoryId": "politics",
    "customTitle": "Piauí"
  },
  {
    "url": "https://theintercept.com/brasil/feed/",
    "categoryId": "politics",
    "customTitle": "The Intercept Brasil"
  },
  {
    "url": "https://9to5google.com/feed/",
    "categoryId": "tech",
    "customTitle": "9to5Google"
  },
  {
    "url": "https://9to5linux.com/feed/",
    "categoryId": "tech",
    "customTitle": "9to5Linux"
  },
  {
    "url": "https://9to5mac.com/feed/",
    "categoryId": "tech",
    "customTitle": "9to5Mac"
  },
  {
    "url": "https://arstechnica.com/feed/",
    "categoryId": "tech",
    "customTitle": "Ars Technica"
  },
  {
    "url": "http://www.cnet.com/rss/news/",
    "categoryId": "tech",
    "customTitle": "CNET"
  },
  {
    "url": "https://diolinux.com.br/feed",
    "categoryId": "tech",
    "customTitle": "Diolinux"
  },
  {
    "url": "https://macmagazine.com.br/feed/",
    "categoryId": "tech",
    "customTitle": "MacMagazine"
  },
  {
    "url": "https://meiobit.com/feed/",
    "categoryId": "tech",
    "customTitle": "Meio Bit"
  },
  {
    "url": "https://tecnoblog.net/feed/",
    "categoryId": "tech",
    "customTitle": "Tecnoblog"
  },
  {
    "url": "https://thenextweb.com/feed",
    "categoryId": "tech",
    "customTitle": "The Next Web"
  },
  {
    "url": "https://www.theverge.com/rss/index.xml",
    "categoryId": "tech",
    "customTitle": "The Verge"
  },
  {
    "url": "https://www.tomsguide.com/feeds.xml",
    "categoryId": "tech",
    "customTitle": "Tom's Guide"
  },
  {
    "url": "https://www.tomshardware.com/feeds.xml",
    "categoryId": "tech",
    "customTitle": "Tom's Hardware"
  },
  {
    "url": "https://www.xda-developers.com/feed/",
    "categoryId": "tech",
    "customTitle": "XDA"
  },
  {
    "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCG-KRRI41P4TsaOMeAM9dug",
    "categoryId": "youtube",
    "customTitle": "1155 do ET",
    "hideFromAll": true
  },
  {
    "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCshObcm-nLhbu8MY50EZ5Ng",
    "categoryId": "youtube",
    "customTitle": "Benn Jordan",
    "hideFromAll": true
  },
  {
    "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCshObcm-nLhbu8MY50EZ5Ng",
    "categoryId": "youtube",
    "customTitle": "Jimmy Diresta",
    "hideFromAll": true
  },
  {
    "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCSpFnDQr88xCZ80N-X7t0nQ",
    "categoryId": "youtube",
    "customTitle": "Corridor Crew",
    "hideFromAll": true
  },
  {
    "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCEf5U1dB5a2e2S-XUlnhxSA",
    "categoryId": "youtube",
    "customTitle": "Diolinux",
    "hideFromAll": true
  },
  {
    "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC7yRILFFJ2QZCykymr8LPwA",
    "categoryId": "youtube",
    "customTitle": "News Rockstar",
    "hideFromAll": true
  },
  {
    "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCqBY-VQ2BxHOWnVpuC7swrw",
    "categoryId": "youtube",
    "customTitle": "NORMOSE",
    "hideFromAll": true
  },
  {
    "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCRHXUZ0BxbkU2MYZgsuFgkQ",
    "categoryId": "youtube",
    "customTitle": "The Spiffing Brit",
    "hideFromAll": true
  }
];

export const CURATED_LISTS: Record<string, FeedSource[]> = {
  "Brasil Mix": [
    {
      "url": "https://www.b9.com.br/feed/",
      "categoryId": "design",
      "customTitle": "B9"
    },
    {
      "url": "https://adrenaline.com.br/feed/",
      "categoryId": "games",
      "customTitle": "Adrenaline"
    },
    {
      "url": "https://br.ign.com/feed.xml",
      "categoryId": "games",
      "customTitle": "IGN Brasil"
    },
    {
      "url": "https://naogames.jogabilida.de/",
      "categoryId": "games",
      "customTitle": "Jogabilidade (Não Games)"
    },
    {
      "url": "https://g1.globo.com/rss/g1/politica/",
      "categoryId": "politics",
      "customTitle": "G1 Política"
    },
    {
      "url": "https://midianinja.org/feed/",
      "categoryId": "politics",
      "customTitle": "Mídia Ninja"
    },
    {
      "url": "https://piaui.folha.uol.com.br/feed/",
      "categoryId": "politics",
      "customTitle": "Piauí"
    },
    {
      "url": "https://theintercept.com/brasil/feed/",
      "categoryId": "politics",
      "customTitle": "The Intercept Brasil"
    },
    {
      "url": "https://diolinux.com.br/feed",
      "categoryId": "tech",
      "customTitle": "Diolinux"
    },
    {
      "url": "https://macmagazine.com.br/feed/",
      "categoryId": "tech",
      "customTitle": "MacMagazine"
    },
    {
      "url": "https://meiobit.com/feed/",
      "categoryId": "tech",
      "customTitle": "Meio Bit"
    },
    {
      "url": "https://tecnoblog.net/feed/",
      "categoryId": "tech",
      "customTitle": "Tecnoblog"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCG-KRRI41P4TsaOMeAM9dug",
      "categoryId": "youtube",
      "customTitle": "1155 do ET"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCqBY-VQ2BxHOWnVpuC7swrw",
      "categoryId": "youtube",
      "customTitle": "NORMOSE"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCEf5U1dB5a2e2S-XUlnhxSA",
      "categoryId": "youtube",
      "customTitle": "Diolinux"
    }
  ],
  "International Mix": [
    {
      "url": "https://css-tricks.com/feed/",
      "categoryId": "design",
      "customTitle": "CSS-Tricks"
    },
    {
      "url": "https://www.dezeen.com/feed/",
      "categoryId": "design",
      "customTitle": "Dezeen"
    },
    {
      "url": "https://uxdesign.cc/feed",
      "categoryId": "design",
      "customTitle": "UX Collective"
    },
    {
      "url": "https://kotaku.com/rss",
      "categoryId": "games",
      "customTitle": "Kotaku"
    },
    {
      "url": "https://www.polygon.com/feed/",
      "categoryId": "games",
      "customTitle": "Polygon"
    },
    {
      "url": "https://www.pcgamer.com/feeds.xml",
      "categoryId": "games",
      "customTitle": "PC Gamer"
    },
    {
      "url": "https://9to5google.com/feed/",
      "categoryId": "tech",
      "customTitle": "9to5Google"
    },
    {
      "url": "https://9to5linux.com/feed/",
      "categoryId": "tech",
      "customTitle": "9to5Linux"
    },
    {
      "url": "https://9to5mac.com/feed/",
      "categoryId": "tech",
      "customTitle": "9to5Mac"
    },
    {
      "url": "https://arstechnica.com/feed/",
      "categoryId": "tech",
      "customTitle": "Ars Technica"
    },
    {
      "url": "http://www.cnet.com/rss/news/",
      "categoryId": "tech",
      "customTitle": "CNET"
    },
    {
      "url": "https://www.digitaltrends.com/feed/",
      "categoryId": "tech",
      "customTitle": "Digital Trends"
    },
    {
      "url": "https://electrek.co/feed/",
      "categoryId": "tech",
      "customTitle": "ElecTrek"
    },
    {
      "url": "https://www.engadget.com/rss.xml",
      "categoryId": "tech",
      "customTitle": "Engadget"
    },
    {
      "url": "https://www.omglinux.com/feed/",
      "categoryId": "tech",
      "customTitle": "OMG! Linux"
    },
    {
      "url": "https://www.omgubuntu.co.uk/feed",
      "categoryId": "tech",
      "customTitle": "OMG! Ubuntu"
    },
    {
      "url": "https://thenextweb.com/feed",
      "categoryId": "tech",
      "customTitle": "The Next Web"
    },
    {
      "url": "https://www.theverge.com/rss/index.xml",
      "categoryId": "tech",
      "customTitle": "The Verge"
    },
    {
      "url": "https://www.tomsguide.com/feeds.xml",
      "categoryId": "tech",
      "customTitle": "Tom's Guide"
    },
    {
      "url": "https://www.tomshardware.com/feeds.xml",
      "categoryId": "tech",
      "customTitle": "Tom's Hardware"
    },
    {
      "url": "https://www.wired.com/feed/tag/ai/latest/rss",
      "categoryId": "tech",
      "customTitle": "WIRED AI"
    },
    {
      "url": "https://www.wired.com/feed/tag/wired-guide/latest/rss",
      "categoryId": "tech",
      "customTitle": "WIRED Guides"
    },
    {
      "url": "https://www.wired.com/feed/category/ideas/latest/rss",
      "categoryId": "tech",
      "customTitle": "WIRED Ideas"
    },
    {
      "url": "https://www.xda-developers.com/feed/",
      "categoryId": "tech",
      "customTitle": "XDA"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCMPGiQ8gwDXFYpwQhX6kK9A",
      "categoryId": "youtube",
      "customTitle": "Bizly"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCSpFnDQr88xCZ80N-X7t0nQ",
      "categoryId": "youtube",
      "customTitle": "Corridor Crew"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC6mIxFTvXkWQVEHPsEdflzQ",
      "categoryId": "youtube",
      "customTitle": "GreatScott!"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC7yRILFFJ2QZCykymr8LPwA",
      "categoryId": "youtube",
      "customTitle": "News Rockstar"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCj1VqrHhDte54oLgPG4xpuQ",
      "categoryId": "youtube",
      "customTitle": "Stuff Made Here"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCRHXUZ0BxbkU2MYZgsuFgkQ",
      "categoryId": "youtube",
      "customTitle": "The Spiffing Brit"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCshObcm-nLhbu8MY50EZ5Ng",
      "categoryId": "youtube",
      "customTitle": "Benn Jordan"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCshObcm-nLhbu8MY50EZ5Ng",
      "categoryId": "youtube",
      "customTitle": "Jimmy Diresta"
    }
  ],
  "Pacote Mix Global": [
    {
      "url": "https://www.b9.com.br/feed/",
      "categoryId": "design",
      "customTitle": "B9"
    },
    {
      "url": "https://css-tricks.com/feed/",
      "categoryId": "design",
      "customTitle": "CSS-Tricks"
    },
    {
      "url": "https://www.dezeen.com/feed/",
      "categoryId": "design",
      "customTitle": "Dezeen"
    },
    {
      "url": "https://uxdesign.cc/feed",
      "categoryId": "design",
      "customTitle": "UX Collective"
    },
    {
      "url": "https://adrenaline.com.br/feed/",
      "categoryId": "games",
      "customTitle": "Adrenaline"
    },
    {
      "url": "https://br.ign.com/feed.xml",
      "categoryId": "games",
      "customTitle": "IGN Brasil"
    },
    {
      "url": "https://naogames.jogabilida.de/",
      "categoryId": "games",
      "customTitle": "Jogabilidade (Não Games)"
    },
    {
      "url": "https://kotaku.com/rss",
      "categoryId": "games",
      "customTitle": "Kotaku"
    },
    {
      "url": "https://www.polygon.com/feed/",
      "categoryId": "games",
      "customTitle": "Polygon"
    },
    {
      "url": "https://www.pcgamer.com/feeds.xml",
      "categoryId": "games",
      "customTitle": "PC Gamer"
    },
    {
      "url": "https://g1.globo.com/rss/g1/politica/",
      "categoryId": "politics",
      "customTitle": "G1 Política"
    },
    {
      "url": "https://midianinja.org/feed/",
      "categoryId": "politics",
      "customTitle": "Mídia Ninja"
    },
    {
      "url": "https://piaui.folha.uol.com.br/feed/",
      "categoryId": "politics",
      "customTitle": "Piauí"
    },
    {
      "url": "https://theintercept.com/brasil/feed/",
      "categoryId": "politics",
      "customTitle": "The Intercept Brasil"
    },
    {
      "url": "https://9to5google.com/feed/",
      "categoryId": "tech",
      "customTitle": "9to5Google"
    },
    {
      "url": "https://9to5linux.com/feed/",
      "categoryId": "tech",
      "customTitle": "9to5Linux"
    },
    {
      "url": "https://9to5mac.com/feed/",
      "categoryId": "tech",
      "customTitle": "9to5Mac"
    },
    {
      "url": "https://arstechnica.com/feed/",
      "categoryId": "tech",
      "customTitle": "Ars Technica"
    },
    {
      "url": "http://www.cnet.com/rss/news/",
      "categoryId": "tech",
      "customTitle": "CNET"
    },
    {
      "url": "https://www.digitaltrends.com/feed/",
      "categoryId": "tech",
      "customTitle": "Digital Trends"
    },
    {
      "url": "https://diolinux.com.br/feed",
      "categoryId": "tech",
      "customTitle": "Diolinux"
    },
    {
      "url": "https://electrek.co/feed/",
      "categoryId": "tech",
      "customTitle": "ElecTrek"
    },
    {
      "url": "https://www.engadget.com/rss.xml",
      "categoryId": "tech",
      "customTitle": "Engadget"
    },
    {
      "url": "https://macmagazine.com.br/feed/",
      "categoryId": "tech",
      "customTitle": "MacMagazine"
    },
    {
      "url": "https://meiobit.com/feed/",
      "categoryId": "tech",
      "customTitle": "Meio Bit"
    },
    {
      "url": "https://www.omglinux.com/feed/",
      "categoryId": "tech",
      "customTitle": "OMG! Linux"
    },
    {
      "url": "https://www.omgubuntu.co.uk/feed",
      "categoryId": "tech",
      "customTitle": "OMG! Ubuntu"
    },
    {
      "url": "https://tecnoblog.net/feed/",
      "categoryId": "tech",
      "customTitle": "Tecnoblog"
    },
    {
      "url": "https://thenextweb.com/feed",
      "categoryId": "tech",
      "customTitle": "The Next Web"
    },
    {
      "url": "https://www.theverge.com/rss/index.xml",
      "categoryId": "tech",
      "customTitle": "The Verge"
    },
    {
      "url": "https://www.tomsguide.com/feeds.xml",
      "categoryId": "tech",
      "customTitle": "Tom's Guide"
    },
    {
      "url": "https://www.tomshardware.com/feeds.xml",
      "categoryId": "tech",
      "customTitle": "Tom's Hardware"
    },
    {
      "url": "https://www.wired.com/feed/tag/ai/latest/rss",
      "categoryId": "tech",
      "customTitle": "WIRED AI"
    },
    {
      "url": "https://www.wired.com/feed/tag/wired-guide/latest/rss",
      "categoryId": "tech",
      "customTitle": "WIRED Guides"
    },
    {
      "url": "https://www.wired.com/feed/category/ideas/latest/rss",
      "categoryId": "tech",
      "customTitle": "WIRED Ideas"
    },
    {
      "url": "https://www.xda-developers.com/feed/",
      "categoryId": "tech",
      "customTitle": "XDA"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCG-KRRI41P4TsaOMeAM9dug",
      "categoryId": "youtube",
      "customTitle": "1155 do ET"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCMPGiQ8gwDXFYpwQhX6kK9A",
      "categoryId": "youtube",
      "customTitle": "Bizly"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCSpFnDQr88xCZ80N-X7t0nQ",
      "categoryId": "youtube",
      "customTitle": "Corridor Crew"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCEf5U1dB5a2e2S-XUlnhxSA",
      "categoryId": "youtube",
      "customTitle": "Diolinux"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC6mIxFTvXkWQVEHPsEdflzQ",
      "categoryId": "youtube",
      "customTitle": "GreatScott!"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC7yRILFFJ2QZCykymr8LPwA",
      "categoryId": "youtube",
      "customTitle": "News Rockstar"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCqBY-VQ2BxHOWnVpuC7swrw",
      "categoryId": "youtube",
      "customTitle": "NORMOSE"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCj1VqrHhDte54oLgPG4xpuQ",
      "categoryId": "youtube",
      "customTitle": "Stuff Made Here"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCRHXUZ0BxbkU2MYZgsuFgkQ",
      "categoryId": "youtube",
      "customTitle": "The Spiffing Brit"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCshObcm-nLhbu8MY50EZ5Ng",
      "categoryId": "youtube",
      "customTitle": "Benn Jordan"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCshObcm-nLhbu8MY50EZ5Ng",
      "categoryId": "youtube",
      "customTitle": "Jimmy Diresta"
    }
  ]
};

// Mantendo suporte para exportações legadas e mapeando para as novas listas
export const CURATED_FEEDS_BR = CURATED_LISTS['Brasil Tech & Ciência'] || DEFAULT_FEEDS;
export const CURATED_FEEDS_INTL = CURATED_LISTS['International Tech & Ciência'] || DEFAULT_FEEDS;
