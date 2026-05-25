# Configuração Inicial do Personal News

Este arquivo define as categorias e feeds que virão por padrão na aplicação.
O formato é rigoroso para permitir a sincronização automática.

---

# Configurações Globais

---

### Tema Padrão - Define a paleta de cores inicial da interface

- Tema Padrão: dark;
  Opções:
- `dark`: Modo escuro padrão
- `light`: Modo claro padrão

---

---

### Layout Global - Define como os artigos são organizados na grade

- Layout Global: masonry;
  Opções:
- `list`: Lista limpa estilo portal
- `masonry`: Cards com alturas variáveis
- `bento`: Grade moderna estilo Apple/Bento
- `magazine`: Layout editorial focado em texto
- `newspaper`: Estilo jornal clássico
- `gallery`: Focado em imagens grandes
- `compact`: Linhas densas para leitura rápida
- `minimal`: Apenas texto, sem distrações
- `immersive`: Estilo Netflix (dark background)
- `brutalist`: Design cru e negrito
- `timeline`: Ordem cronológica vertical
- `focus`: Um artigo por vez
- `split`: Visual em zigue-zague
- `cyberpunk`: Estética neon e futurista
- `terminal`: Estilo linha de comando (CLI)
- `pocketfeeds`: Minimalista focado em leitura
- `modern`: Portal moderno com cards flutuantes

---

---

### Header Global - Define o comportamento do cabeçalho de navegação

- Header Global: floating;
  Opções:
- `static`: Move junto com o scroll (topo da página)
- `sticky`: Fixado no topo enquanto você navega
- `floating`: Flutuante com transparência e desfoque
- `hidden`: Escondido por padrão

---

---

### Aparência do Header - Define dimensões e transparência iniciais

- Altura do Header: tiny;
- Opacidade do Header: 60;
- Blur do Header: 20;
- Tamanho do Logo: md;
- Filtros de Favoritos: inline;
  Opções:
- `ultra-compact`: Cabeçalho muito baixo
- `tiny`: Cabeçalho pequeno
- `compact`: Cabeçalho compacto
- `normal`: Cabeçalho padrão
- `spacious`: Cabeçalho amplo
- `sm`: Logo pequeno
- `md`: Logo médio
- `lg`: Logo grande
- `inline`: Filtros de Favoritos em faixa compacta no header
- `drawer`: Filtros de Favoritos em gaveta no header

---

---

### Formato Hora - Define como as datas e horas são exibidas

- Formato Hora: 24h;
  Opções:
- `12h`: Formato AM/PM
- `24h`: Formato militar/europeu

---

---

### Leitura e Atualização - Define paginação, destaques e cache

- Tipo de Paginação: numbered;
- Destaques Principais: 15;
- Intervalo de Atualização Automática: 15;
- Cache Temporário de Feeds: 15;
  Opções:
- `numbered`: Paginação numerada
- `loadMore`: Botão para carregar mais
- `infinite`: Rolagem infinita
- `0`: Desabilitado quando usado em intervalo/cache
- `5`, `10`, `15`, `20`: Valores válidos conforme o campo

---

---

### Cidade Padrão - Define o local para as informações de clima

- Cidade Padrão: São Paulo;

---

## Categorias

---

- Nome: Tecnologia;
- ID: tech;
- Cor: #0078D7;
- Layout: minimal;
- Pinned: false;
- Auto-Discovery: true;
- Descrição: Notícias sobre desenvolvimento, gadgets e o mundo tech.;

---

---

- Nome: Design;
- ID: design;
- Cor: #663399;
- Layout: gallery;
- Pinned: false;
- Auto-Discovery: true;
- Descrição: Inspiração visual, UX/UI e tendências de design.;

---

---

- Nome: Games;
- ID: games;
- Cor: #FFDA03;
- Layout: modern;
- Pinned: false;
- Auto-Discovery: true;
- Descrição: Lançamentos, reviews e cultura gamer.;

---

---

- Nome: Política;
- ID: politics;
- Cor: #E13111;
- Layout: newspaper;
- Pinned: false;
- Auto-Discovery: true;
- Descrição: Cobertura política nacional e internacional.;

---

---

- Nome: Podcasts;
- ID: podcasts;
- Cor: #FF8C00;
- Layout: pocketfeeds;
- Pinned: false;
- Auto-Discovery: true;
- Descrição: Seus podcasts preferidos direto no feed.;

---

---

- Nome: Vídeos;
- ID: youtube;
- Cor: #8B0000;
- Layout: brutalist;
- Pinned: false;
- Auto-Discovery: false;
- Descrição: Canais preferidos do Youtube.;

---

## Feeds Iniciais

### design

- B9: <https://www.b9.com.br/feed/>

### games

- Kotaku: <https://kotaku.com/rss>
- Jogabilidade: <https://jogabilida.de/feed/>
- IGN Brasil: <https://br.ign.com/feed.xml>

### politics

- Piauí: <https://piaui.folha.uol.com.br/feed/>
- The Intercept Brasil: <https://theintercept.com/brasil/feed/>
- Mídia Ninja: <https://midianinja.org/feed/>

### tech

- Ars Technica: <https://arstechnica.com/feed/>
- CNET: <http://www.cnet.com/rss/news/>
- Tecnoblog: <https://tecnoblog.net/feed/>
- The Next Web: <https://thenextweb.com/feed>
- XDA: <https://www.xda-developers.com/feed/>

### podcasts

- Medo e Delírio em Brasília: <https://www.spreaker.com/show/4711842/episodes/feed> | Hide-from-All: true
- Foro de Teresina: <https://feeds.megaphone.fm/NPP2619427256> | Hide-from-All: true
- RapaduraCast: <https://anchor.fm/s/f064cfa8/podcast/rss> | Hide-from-All: true
- MIDCast Política: <https://feeds.simplecast.com/kfPT8_s8> | Hide-from-All: true
- 99Vidas: <https://anchor.fm/s/f0480b34/podcast/rss> | Hide-from-All: true
- Tecnocast: <https://anchor.fm/s/1075f6ce0/podcast/rss> | Hide-from-All: true
- Compilado do Código Fonte TV: <https://anchor.fm/s/4f366e84/podcast/rss> | Hide-from-All: true
- Pouco Pixel: <https://anchor.fm/s/6cfe134/podcast/rss> | Hide-from-All: true
- Braincast: <https://www.omnycontent.com/d/playlist/651a251e-06e1-47e0-9336-ac5a00f41628/fc243b66-f34c-4656-9042-acd400edcca5/d4c8e398-446c-447a-ad41-acd400edccc1/podcast.rss> | Hide-from-All: true
- História em Meia Hora: <https://anchor.fm/s/122df228/podcast/rss> | Hide-from-All: true
- Ilustríssima Conversa: <https://www.omnycontent.com/d/playlist/2f6a79aa-d181-48a4-92e0-ac5d00c8eb1d/ec318888-d896-417d-ad48-ac61001abdf2/0076bab0-fc8d-4f81-b535-ac61001abe00/podcast.rss> | Hide-from-All: true
- Cinemático: <https://feeds.acast.com/public/shows/639392cb6c25ea001115e06a> | Hide-from-All: true
- MotherChip - Overloadr: <https://feeds.acast.com/public/shows/63cff75b688779001117ba6a> | Hide-from-All: true
- A Hora: <https://feeds.megaphone.fm/ADSMOVILESPAASL6537792662> | Hide-from-All: true
- Boletim Folha: <https://www.omnycontent.com/d/playlist/2f6a79aa-d181-48a4-92e0-ac5d00c8eb1d/3d46b2bc-0503-4d56-8c8a-ac5d0168cd1f/bd27a0a8-30b2-4cc8-b2e8-ac5d0168cd32/podcast.rss> | Hide-from-All: true
- Fabuloso Podcast: <https://anchor.fm/s/5c0806cc/podcast/rss> | Hide-from-All: true
- Giro do Loop: <https://loopmatinal.libsyn.com/rss> | Hide-from-All: true
- Lambda3 Podcast: <https://anchor.fm/s/1033521c8/podcast/rss> | Hide-from-All: true
- MacMagazine no Ar: <https://macmagazine.com.br/feed/podcast/> | Hide-from-All: true
- Mundo Freak Confidencial: <https://www.mundofreak.com.br/feed/podcast/> | Hide-from-All: true
- No Pé do Ouvido: <https://www.omnycontent.com/d/playlist/4dc4c11a-5a07-47d5-a5d5-b3b50010fd77/cf293613-84e5-44b6-9082-b42000d2f90a/e4397c51-35ca-4b3c-8f13-b42000d2f918/podcast.rss> | Hide-from-All: true
- O É da Coisa: <https://www.spreaker.com/show/4881239/episodes/feed> | Hide-from-All: true

### youtube

- 1155 do ET: <https://www.youtube.com/feeds/videos.xml?channel_id=UCG-KRRI41P4TsaOMeAM9dug> | Hide-from-All: true
- Corridor Crew: <https://www.youtube.com/feeds/videos.xml?channel_id=UCSpFnDQr88xCZ80N-X7t0nQ> | Hide-from-All: true
- Diolinux: <https://www.youtube.com/feeds/videos.xml?channel_id=UCEf5U1dB5a2e2S-XUlnhxSA> | Hide-from-All: true
- Tecnologia e Classe: <https://www.youtube.com/feeds/videos.xml?channel_id=UCYVrkMZdrjq5eICOG6Rxiwg> | Hide-from-All: true


# Listas Curadas

Esta seção define listas de feeds agrupados que podem ser importados massivamente pelo usuário.
Formato: `## Nome da Lista` seguido pelos feeds agrupados por categoria (igual ao Feeds Iniciais).

## Brasil Mix

### design

- B9: <https://www.b9.com.br/feed/>

### games

- Adrenaline: <https://adrenaline.com.br/feed/>
- IGN Brasil: <https://br.ign.com/feed.xml>
- Jogabilidade: <https://jogabilida.de/feed/>

### politics

- Piauí: <https://piaui.folha.uol.com.br/feed/>
- The Intercept Brasil: <https://theintercept.com/brasil/feed/>
- ICL Notícias: <https://iclnoticias.com.br/feed/>

### tech

- Diolinux: <https://diolinux.com.br/feed>
- MacMagazine: <https://macmagazine.com.br/feed/>
- Meio Bit: <https://meiobit.com/feed/>
- Tecnoblog: <https://tecnoblog.net/feed/>

### podcasts

- Medo e Delírio em Brasília: <https://www.spreaker.com/show/4711842/episodes/feed> | Hide-from-All: true
- Foro de Teresina: <https://feeds.megaphone.fm/NPP2619427256> | Hide-from-All: true
- RapaduraCast: <https://anchor.fm/s/f064cfa8/podcast/rss> | Hide-from-All: true
- MIDCast Política: <https://feeds.simplecast.com/kfPT8_s8> | Hide-from-All: true
- 99Vidas: <https://anchor.fm/s/f0480b34/podcast/rss> | Hide-from-All: true
- Tecnocast: <https://anchor.fm/s/1075f6ce0/podcast/rss> | Hide-from-All: true

### youtube

- 1155 do ET: <https://www.youtube.com/feeds/videos.xml?channel_id=UCG-KRRI41P4TsaOMeAM9dug> | Hide-from-All: true
- Diolinux: <https://www.youtube.com/feeds/videos.xml?channel_id=UCEf5U1dB5a2e2S-XUlnhxSA> | Hide-from-All: true
- Tecnologia e Classe: <https://www.youtube.com/feeds/videos.xml?channel_id=UCYVrkMZdrjq5eICOG6Rxiwg> | Hide-from-All: true

## International Mix

### design

- UX Collective: <https://uxdesign.cc/feed>
- This is Colossal: <https://www.thisiscolossal.com/feed/>
- Thedieline: <https://thedieline.com/feed/>

### games

- Kotaku: <https://kotaku.com/rss>
- PC Gamer: <https://www.pcgamer.com/feeds.xml>
- Polygon: <https://www.polygon.com/feed/>

### tech

- Ars Technica: <https://arstechnica.com/feed/>
- CNET: <http://www.cnet.com/rss/news/>
- Digital Trends: <https://www.digitaltrends.com/feed/>
- ElecTrek: <https://electrek.co/feed/>
- Engadget: <https://www.engadget.com/rss.xml>
- OMG! Ubuntu: <https://www.omgubuntu.co.uk/feed>
- The Decoder: <https://the-decoder.com/feed/>
- The Next Web: <https://thenextweb.com/feed>
- The Verge: <https://www.theverge.com/rss/index.xml>
- Tom's Guide: <https://www.tomsguide.com/feeds.xml>
- Tom's Hardware: <https://www.tomshardware.com/feeds.xml>
- WIRED Guides: <https://www.wired.com/feed/tag/wired-guide/latest/rss>
- XDA: <https://www.xda-developers.com/feed/>

### youtube

- Alex Ziskind: <https://www.youtube.com/feeds/videos.xml?channel_id=UCajiMK_CY9icRhLepS8_3ug> | Hide-from-All: true
- Benn Jordan: <https://www.youtube.com/feeds/videos.xml?channel_id=UCshObcm-nLhbu8MY50EZ5Ng> | Hide-from-All: true
- Bizly: <https://www.youtube.com/feeds/videos.xml?channel_id=UCMPGiQ8gwDXFYpwQhX6kK9A> | Hide-from-All: true
- Corridor Crew: <https://www.youtube.com/feeds/videos.xml?channel_id=UCSpFnDQr88xCZ80N-X7t0nQ> | Hide-from-All: true
- GreatScott!: <https://www.youtube.com/feeds/videos.xml?channel_id=UC6mIxFTvXkWQVEHPsEdflzQ> | Hide-from-All: true
- Macho Nacho: <https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ> | Hide-from-All: true
- News Rockstar: <https://www.youtube.com/feeds/videos.xml?channel_id=UC7yRILFFJ2QZCykymr8LPwA> | Hide-from-All: true
- Stuff Made Here: <https://www.youtube.com/feeds/videos.xml?channel_id=UCj1VqrHhDte54oLgPG4xpuQ> | Hide-from-All: true
- The Spiffing Brit: <https://www.youtube.com/feeds/videos.xml?channel_id=UCRHXUZ0BxbkU2MYZgsuFgkQ> | Hide-from-All: true

## Pacote Mix Global

### design

- UX Collective: <https://uxdesign.cc/feed>
- B9: <https://www.b9.com.br/feed/>
- This is Colossal: <https://www.thisiscolossal.com/feed/>
- Thedieline: <https://thedieline.com/feed/>

### games

- Adrenaline: <https://adrenaline.com.br/feed/>
- IGN Brasil: <https://br.ign.com/feed.xml>
- Jogabilidade (Não Games): <https://naogames.jogabilida.de/>
- Jogabilidade: <https://jogabilida.de/feed/>
- Kotaku: <https://kotaku.com/rss>
- PC Gamer: <https://www.pcgamer.com/feeds.xml>
- Polygon: <https://www.polygon.com/feed/>

### politics

- G1 Política: <https://g1.globo.com/rss/g1/politica/>
- Mídia Ninja: <https://midianinja.org/feed/>
- Piauí: <https://piaui.folha.uol.com.br/feed/>
- The Intercept Brasil: <https://theintercept.com/brasil/feed/>
- ICL Notícias: <https://iclnoticias.com.br/feed/>

### tech

- 9to5Google: <https://9to5google.com/feed/>
- 9to5Linux: <https://9to5linux.com/feed/>
- 9to5Mac: <https://9to5mac.com/feed/>
- Ars Technica: <https://arstechnica.com/feed/>
- CNET: <http://www.cnet.com/rss/news/>
- Digital Trends: <https://www.digitaltrends.com/feed/>
- Diolinux: <https://diolinux.com.br/feed>
- ElecTrek: <https://electrek.co/feed/>
- Engadget: <https://www.engadget.com/rss.xml>
- MacMagazine: <https://macmagazine.com.br/feed/>
- Meio Bit: <https://meiobit.com/feed/>
- OMG! Linux: <https://www.omglinux.com/feed/>
- OMG! Ubuntu: <https://www.omgubuntu.co.uk/feed>
- Tecnoblog: <https://tecnoblog.net/feed/>
- The Decoder: <https://the-decoder.com/feed/>
- The Next Web: <https://thenextweb.com/feed>
- The Verge: <https://www.theverge.com/rss/index.xml>
- Tom's Guide: <https://www.tomsguide.com/feeds.xml>
- Tom's Hardware: <https://www.tomshardware.com/feeds.xml>
- WIRED AI: <https://www.wired.com/feed/tag/ai/latest/rss>
- WIRED Guides: <https://www.wired.com/feed/tag/wired-guide/latest/rss>
- WIRED Ideas: <https://www.wired.com/feed/category/ideas/latest/rss>
- XDA: <https://www.xda-developers.com/feed/>

### podcasts

- Medo e Delírio em Brasília: <https://www.spreaker.com/show/4711842/episodes/feed> | Hide-from-All: true
- Foro de Teresina: <https://feeds.megaphone.fm/NPP2619427256> | Hide-from-All: true
- RapaduraCast: <https://anchor.fm/s/f064cfa8/podcast/rss> | Hide-from-All: true
- MIDCast Política: <https://feeds.simplecast.com/kfPT8_s8> | Hide-from-All: true
- 99Vidas: <https://anchor.fm/s/f0480b34/podcast/rss> | Hide-from-All: true
- Tecnocast: <https://anchor.fm/s/1075f6ce0/podcast/rss> | Hide-from-All: true

### youtube

- 1155 do ET: <https://www.youtube.com/feeds/videos.xml?channel_id=UCG-KRRI41P4TsaOMeAM9dug> | Hide-from-All: true
- Alex Ziskind: <https://www.youtube.com/feeds/videos.xml?channel_id=UCajiMK_CY9icRhLepS8_3ug> | Hide-from-All: true
- Benn Jordan: <https://www.youtube.com/feeds/videos.xml?channel_id=UCshObcm-nLhbu8MY50EZ5Ng> | Hide-from-All: true
- Bizly: <https://www.youtube.com/feeds/videos.xml?channel_id=UCMPGiQ8gwDXFYpwQhX6kK9A> | Hide-from-All: true
- Corridor Crew: <https://www.youtube.com/feeds/videos.xml?channel_id=UCSpFnDQr88xCZ80N-X7t0nQ> | Hide-from-All: true
- Diolinux: <https://www.youtube.com/feeds/videos.xml?channel_id=UCEf5U1dB5a2e2S-XUlnhxSA> | Hide-from-All: true
- Gamera: <https://www.youtube.com/feeds/videos.xml?channel_id=UCpmygvQeXq1jz3fo9IP3Gzw> | Hide-from-All: true
- GreatScott!: <https://www.youtube.com/feeds/videos.xml?channel_id=UC6mIxFTvXkWQVEHPsEdflzQ> | Hide-from-All: true
- Macho Nacho: <https://www.youtube.com/feeds/videos.xml?channel_id=UC4CsqctrGOn4NTz09sAhXwQ> | Hide-from-All: true
- News Rockstar: <https://www.youtube.com/feeds/videos.xml?channel_id=UC7yRILFFJ2QZCykymr8LPwA> | Hide-from-All: true
- NORMOSE: <https://www.youtube.com/feeds/videos.xml?channel_id=UCqBY-VQ2BxHOWnVpuC7swrw> | Hide-from-All: true
- Stuff Made Here: <https://www.youtube.com/feeds/videos.xml?channel_id=UCj1VqrHhDte54oLgPG4xpuQ> | Hide-from-All: true
- Tecnologia e Classe: <https://www.youtube.com/feeds/videos.xml?channel_id=UCYVrkMZdrjq5eICOG6Rxiwg> | Hide-from-All: true
- The Spiffing Brit: <https://www.youtube.com/feeds/videos.xml?channel_id=UCRHXUZ0BxbkU2MYZgsuFgkQ> | Hide-from-All: true
