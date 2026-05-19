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

- Layout Global: magazine;
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

- Altura do Header: compact;
- Opacidade do Header: 60;
- Blur do Header: 20;
- Tamanho do Logo: md;
  Opções:
- `ultra-compact`: Cabeçalho muito baixo
- `tiny`: Cabeçalho pequeno
- `compact`: Cabeçalho compacto
- `normal`: Cabeçalho padrão
- `spacious`: Cabeçalho amplo
- `sm`: Logo pequeno
- `md`: Logo médio
- `lg`: Logo grande

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
- Cache Temporário de Feeds: 10;
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
- Layout: masonry;
- Pinned: false;
- Auto-Discovery: true;
- Descrição: Notícias sobre desenvolvimento, gadgets e o mundo tech.;

---

---

- Nome: Design;
- ID: design;
- Cor: #663399;
- Layout: immersive;
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
- Layout: magazine;
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
- Awwwards: <https://www.awwwards.com/feed/>

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

- Foro de Teresina: <https://feeds.megaphone.fm/NPP2619427256> | Hide-from-All: true
- RapaduraCast: <https://anchor.fm/s/f064cfa8/podcast/rss> | Hide-from-All: true
- MIDCast Política: <https://feeds.simplecast.com/kfPT8_s8> | Hide-from-All: true

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

- Foro de Teresina: <https://feeds.megaphone.fm/NPP2619427256> | Hide-from-All: true
- RapaduraCast: <https://anchor.fm/s/f064cfa8/podcast/rss> | Hide-from-All: true

### youtube

- 1155 do ET: <https://www.youtube.com/feeds/videos.xml?channel_id=UCG-KRRI41P4TsaOMeAM9dug> | Hide-from-All: true
- Diolinux: <https://www.youtube.com/feeds/videos.xml?channel_id=UCEf5U1dB5a2e2S-XUlnhxSA> | Hide-from-All: true
- Tecnologia e Classe: <https://www.youtube.com/feeds/videos.xml?channel_id=UCYVrkMZdrjq5eICOG6Rxiwg> | Hide-from-All: true

## International Mix

### design

- UX Collective: <https://uxdesign.cc/feed>
- This is Colossal: <https://www.thisiscolossal.com/feed/>
- Awwwards: <https://www.awwwards.com/feed/>
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
- Awwwards: <https://www.awwwards.com/feed/>
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

- Medo e Delírio em Brasília: <https://www.central3.com.br/category/podcasts/medo-e-delirio/feed/podcast> | Hide-from-All: true
- Foro de Teresina: <https://feeds.megaphone.fm/NPP2619427256> | Hide-from-All: true
- RapaduraCast: <https://anchor.fm/s/f064cfa8/podcast/rss> | Hide-from-All: true

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
