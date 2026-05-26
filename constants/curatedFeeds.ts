/**
 * ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITE DIRETAMENTE
 * Edite config/initial-setup.md e rode 'bun run config:sync'
 */

import { FeedSource, FeedCategory } from "../types";

export const INITIAL_APP_CONFIG = {
  "theme": "dark",
  "layout": "masonry",
  "timeFormat": "24h",
  "headerHeight": "tiny",
  "headerOpacity": 0.6,
  "headerBlur": 20,
  "favoriteToolbarVariant": "inline",
  "logoSize": "md",
  "paginationType": "numbered",
  "topStoriesCount": 15,
  "autoRefreshInterval": 15,
  "feedCacheTtlMinutes": 10,
  "header": "floating",
  "weatherCity": "São Paulo"
};

export const DEFAULT_CATEGORIES: FeedCategory[] = [
  {
    "id": "all",
    "name": "All",
    "color": "#6B7280",
    "order": 0,
    "isDefault": true,
    "isPinned": true,
    "autoDiscovery": true
  },
  {
    "order": 1,
    "isDefault": true,
    "name": "Tecnologia",
    "id": "tech",
    "color": "#0078D7",
    "layoutMode": "minimal",
    "isPinned": false,
    "autoDiscovery": true,
    "description": "Notícias sobre desenvolvimento, gadgets e o mundo tech."
  },
  {
    "order": 2,
    "isDefault": true,
    "name": "Design",
    "id": "design",
    "color": "#663399",
    "layoutMode": "gallery",
    "isPinned": false,
    "autoDiscovery": true,
    "description": "Inspiração visual, UX/UI e tendências de design."
  },
  {
    "order": 3,
    "isDefault": true,
    "name": "Games",
    "id": "games",
    "color": "#FFDA03",
    "layoutMode": "modern",
    "isPinned": false,
    "autoDiscovery": true,
    "description": "Lançamentos, reviews e cultura gamer."
  },
  {
    "order": 4,
    "isDefault": true,
    "name": "Política",
    "id": "politics",
    "color": "#E13111",
    "layoutMode": "newspaper",
    "isPinned": false,
    "autoDiscovery": true,
    "description": "Cobertura política nacional e internacional."
  },
  {
    "order": 5,
    "isDefault": true,
    "name": "Podcasts",
    "id": "podcasts",
    "color": "#FF8C00",
    "layoutMode": "pocketfeeds",
    "isPinned": false,
    "autoDiscovery": true,
    "description": "Seus podcasts preferidos direto no feed."
  },
  {
    "order": 6,
    "isDefault": true,
    "name": "Vídeos",
    "id": "youtube",
    "color": "#8B0000",
    "layoutMode": "brutalist",
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
    "url": "https://kotaku.com/rss",
    "categoryId": "games",
    "customTitle": "Kotaku"
  },
  {
    "url": "https://jogabilida.de/feed/",
    "categoryId": "games",
    "customTitle": "Jogabilidade"
  },
  {
    "url": "https://br.ign.com/feed.xml",
    "categoryId": "games",
    "customTitle": "IGN Brasil"
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
    "url": "https://midianinja.org/feed/",
    "categoryId": "politics",
    "customTitle": "Mídia Ninja"
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
    "url": "https://www.xda-developers.com/feed/",
    "categoryId": "tech",
    "customTitle": "XDA"
  },
  {
    "url": "https://www.spreaker.com/show/4711842/episodes/feed",
    "categoryId": "podcasts",
    "customTitle": "Medo e Delírio em Brasília",
    "hideFromAll": true
  },
  {
    "url": "https://feeds.megaphone.fm/NPP2619427256",
    "categoryId": "podcasts",
    "customTitle": "Foro de Teresina",
    "hideFromAll": true
  },
  {
    "url": "https://anchor.fm/s/f064cfa8/podcast/rss",
    "categoryId": "podcasts",
    "customTitle": "RapaduraCast",
    "hideFromAll": true
  },
  {
    "url": "https://feeds.simplecast.com/kfPT8_s8",
    "categoryId": "podcasts",
    "customTitle": "MIDCast Política",
    "hideFromAll": true
  },
  {
    "url": "https://anchor.fm/s/f0480b34/podcast/rss",
    "categoryId": "podcasts",
    "customTitle": "99Vidas",
    "hideFromAll": true
  },
  {
    "url": "https://anchor.fm/s/1075f6ce0/podcast/rss",
    "categoryId": "podcasts",
    "customTitle": "Tecnocast",
    "hideFromAll": true
  },
  {
    "url": "https://anchor.fm/s/4f366e84/podcast/rss",
    "categoryId": "podcasts",
    "customTitle": "Compilado do Código Fonte TV",
    "hideFromAll": true
  },
  {
    "url": "https://anchor.fm/s/6cfe134/podcast/rss",
    "categoryId": "podcasts",
    "customTitle": "Pouco Pixel",
    "hideFromAll": true
  },
  {
    "url": "https://www.omnycontent.com/d/playlist/651a251e-06e1-47e0-9336-ac5a00f41628/fc243b66-f34c-4656-9042-acd400edcca5/d4c8e398-446c-447a-ad41-acd400edccc1/podcast.rss",
    "categoryId": "podcasts",
    "customTitle": "Braincast",
    "hideFromAll": true
  },
  {
    "url": "https://anchor.fm/s/122df228/podcast/rss",
    "categoryId": "podcasts",
    "customTitle": "História em Meia Hora",
    "hideFromAll": true
  },
  {
    "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCG-KRRI41P4TsaOMeAM9dug",
    "categoryId": "youtube",
    "customTitle": "1155 do ET",
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
    "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCYVrkMZdrjq5eICOG6Rxiwg",
    "categoryId": "youtube",
    "customTitle": "Tecnologia e Classe",
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
      "url": "https://jogabilida.de/feed/",
      "categoryId": "games",
      "customTitle": "Jogabilidade"
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
      "url": "https://iclnoticias.com.br/feed/",
      "categoryId": "politics",
      "customTitle": "ICL Notícias"
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
      "url": "https://www.spreaker.com/show/4711842/episodes/feed",
      "categoryId": "podcasts",
      "customTitle": "Medo e Delírio em Brasília",
      "hideFromAll": true
    },
    {
      "url": "https://feeds.megaphone.fm/NPP2619427256",
      "categoryId": "podcasts",
      "customTitle": "Foro de Teresina",
      "hideFromAll": true
    },
    {
      "url": "https://anchor.fm/s/f064cfa8/podcast/rss",
      "categoryId": "podcasts",
      "customTitle": "RapaduraCast",
      "hideFromAll": true
    },
    {
      "url": "https://feeds.simplecast.com/kfPT8_s8",
      "categoryId": "podcasts",
      "customTitle": "MIDCast Política",
      "hideFromAll": true
    },
    {
      "url": "https://anchor.fm/s/f0480b34/podcast/rss",
      "categoryId": "podcasts",
      "customTitle": "99Vidas",
      "hideFromAll": true
    },
    {
      "url": "https://anchor.fm/s/1075f6ce0/podcast/rss",
      "categoryId": "podcasts",
      "customTitle": "Tecnocast",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCG-KRRI41P4TsaOMeAM9dug",
      "categoryId": "youtube",
      "customTitle": "1155 do ET",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCEf5U1dB5a2e2S-XUlnhxSA",
      "categoryId": "youtube",
      "customTitle": "Diolinux",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCYVrkMZdrjq5eICOG6Rxiwg",
      "categoryId": "youtube",
      "customTitle": "Tecnologia e Classe",
      "hideFromAll": true
    }
  ],
  "International Mix": [
    {
      "url": "https://uxdesign.cc/feed",
      "categoryId": "design",
      "customTitle": "UX Collective"
    },
    {
      "url": "https://www.thisiscolossal.com/feed/",
      "categoryId": "design",
      "customTitle": "This is Colossal"
    },
    {
      "url": "https://thedieline.com/feed/",
      "categoryId": "design",
      "customTitle": "Thedieline"
    },
    {
      "url": "https://kotaku.com/rss",
      "categoryId": "games",
      "customTitle": "Kotaku"
    },
    {
      "url": "https://www.pcgamer.com/feeds.xml",
      "categoryId": "games",
      "customTitle": "PC Gamer"
    },
    {
      "url": "https://www.polygon.com/feed/",
      "categoryId": "games",
      "customTitle": "Polygon"
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
      "url": "https://www.omgubuntu.co.uk/feed",
      "categoryId": "tech",
      "customTitle": "OMG! Ubuntu"
    },
    {
      "url": "https://the-decoder.com/feed/",
      "categoryId": "tech",
      "customTitle": "The Decoder"
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
      "url": "https://www.wired.com/feed/tag/wired-guide/latest/rss",
      "categoryId": "tech",
      "customTitle": "WIRED Guides"
    },
    {
      "url": "https://www.xda-developers.com/feed/",
      "categoryId": "tech",
      "customTitle": "XDA"
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCajiMK_CY9icRhLepS8_3ug",
      "categoryId": "youtube",
      "customTitle": "Alex Ziskind",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCshObcm-nLhbu8MY50EZ5Ng",
      "categoryId": "youtube",
      "customTitle": "Benn Jordan",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCMPGiQ8gwDXFYpwQhX6kK9A",
      "categoryId": "youtube",
      "customTitle": "Bizly",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCSpFnDQr88xCZ80N-X7t0nQ",
      "categoryId": "youtube",
      "customTitle": "Corridor Crew",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC6mIxFTvXkWQVEHPsEdflzQ",
      "categoryId": "youtube",
      "customTitle": "GreatScott!",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ",
      "categoryId": "youtube",
      "customTitle": "Macho Nacho",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC7yRILFFJ2QZCykymr8LPwA",
      "categoryId": "youtube",
      "customTitle": "News Rockstar",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCj1VqrHhDte54oLgPG4xpuQ",
      "categoryId": "youtube",
      "customTitle": "Stuff Made Here",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCRHXUZ0BxbkU2MYZgsuFgkQ",
      "categoryId": "youtube",
      "customTitle": "The Spiffing Brit",
      "hideFromAll": true
    }
  ],
  "Pacote Mix Global": [
    {
      "url": "https://uxdesign.cc/feed",
      "categoryId": "design",
      "customTitle": "UX Collective"
    },
    {
      "url": "https://www.b9.com.br/feed/",
      "categoryId": "design",
      "customTitle": "B9"
    },
    {
      "url": "https://www.thisiscolossal.com/feed/",
      "categoryId": "design",
      "customTitle": "This is Colossal"
    },
    {
      "url": "https://thedieline.com/feed/",
      "categoryId": "design",
      "customTitle": "Thedieline"
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
      "url": "https://jogabilida.de/feed/",
      "categoryId": "games",
      "customTitle": "Jogabilidade"
    },
    {
      "url": "https://kotaku.com/rss",
      "categoryId": "games",
      "customTitle": "Kotaku"
    },
    {
      "url": "https://www.pcgamer.com/feeds.xml",
      "categoryId": "games",
      "customTitle": "PC Gamer"
    },
    {
      "url": "https://www.polygon.com/feed/",
      "categoryId": "games",
      "customTitle": "Polygon"
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
      "url": "https://iclnoticias.com.br/feed/",
      "categoryId": "politics",
      "customTitle": "ICL Notícias"
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
      "url": "https://the-decoder.com/feed/",
      "categoryId": "tech",
      "customTitle": "The Decoder"
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
      "url": "https://www.spreaker.com/show/4711842/episodes/feed",
      "categoryId": "podcasts",
      "customTitle": "Medo e Delírio em Brasília",
      "hideFromAll": true
    },
    {
      "url": "https://feeds.megaphone.fm/NPP2619427256",
      "categoryId": "podcasts",
      "customTitle": "Foro de Teresina",
      "hideFromAll": true
    },
    {
      "url": "https://anchor.fm/s/f064cfa8/podcast/rss",
      "categoryId": "podcasts",
      "customTitle": "RapaduraCast",
      "hideFromAll": true
    },
    {
      "url": "https://feeds.simplecast.com/kfPT8_s8",
      "categoryId": "podcasts",
      "customTitle": "MIDCast Política",
      "hideFromAll": true
    },
    {
      "url": "https://anchor.fm/s/f0480b34/podcast/rss",
      "categoryId": "podcasts",
      "customTitle": "99Vidas",
      "hideFromAll": true
    },
    {
      "url": "https://anchor.fm/s/1075f6ce0/podcast/rss",
      "categoryId": "podcasts",
      "customTitle": "Tecnocast",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCG-KRRI41P4TsaOMeAM9dug",
      "categoryId": "youtube",
      "customTitle": "1155 do ET",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCajiMK_CY9icRhLepS8_3ug",
      "categoryId": "youtube",
      "customTitle": "Alex Ziskind",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCshObcm-nLhbu8MY50EZ5Ng",
      "categoryId": "youtube",
      "customTitle": "Benn Jordan",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCMPGiQ8gwDXFYpwQhX6kK9A",
      "categoryId": "youtube",
      "customTitle": "Bizly",
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
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCpmygvQeXq1jz3fo9IP3Gzw",
      "categoryId": "youtube",
      "customTitle": "Gamera",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC6mIxFTvXkWQVEHPsEdflzQ",
      "categoryId": "youtube",
      "customTitle": "GreatScott!",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ",
      "categoryId": "youtube",
      "customTitle": "Macho Nacho",
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
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCj1VqrHhDte54oLgPG4xpuQ",
      "categoryId": "youtube",
      "customTitle": "Stuff Made Here",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCYVrkMZdrjq5eICOG6Rxiwg",
      "categoryId": "youtube",
      "customTitle": "Tecnologia e Classe",
      "hideFromAll": true
    },
    {
      "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCRHXUZ0BxbkU2MYZgsuFgkQ",
      "categoryId": "youtube",
      "customTitle": "The Spiffing Brit",
      "hideFromAll": true
    }
  ]
};

// Mantendo suporte para exportações legadas e mapeando para as novas listas
export const CURATED_FEEDS_BR = CURATED_LISTS['Brasil Tech & Ciência'] || DEFAULT_FEEDS;
export const CURATED_FEEDS_INTL = CURATED_LISTS['International Tech & Ciência'] || DEFAULT_FEEDS;
