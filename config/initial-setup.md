# Configuração Inicial do Personal News

Este arquivo define as categorias e feeds que virão por padrão na aplicação.
O formato é rigoroso para permitir a sincronização automática.

---

# Documentação

Esta seção serve como guia para as opções disponíveis. Não edite esta seção.

## Dicionário de Opções

Use os valores abaixo nos campos correspondentes para personalizar o setup inicial na seção de Configuração Ativa.

### Temas (ID do Tema)

- `dark-blue`: Azul Escuro (Padrão Dark)
- `dark-green`: Verde Escuro (Nature)
- `dark-purple`: Roxo Escuro (Cyber)
- `light-blue`: Azul Claro (Padrão Light)
- `light-pink`: Rosa Claro (Soft)
- `light-cyan`: Ciano Claro (Minimal)

### Layouts de Conteúdo (Modo)

- `grid`: Grade de revista clássica
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

### Posição do Cabeçalho (Header)

- `static`: Move junto com o scroll (topo da página)
- `sticky`: Fixado no topo enquanto você navega
- `floating`: Flutuante com transparência e desfoque
- `hidden`: Escondido por padrão

---

# Configuração Ativa

Edite as seções abaixo para alterar o comportamento da aplicação.

## Configurações Globais

- Tema Padrão: dark-blue
- Layout Global: masonry
- Formato Hora: 24h
- Cidade Padrão: São Paulo

## Categorias

Formato: `- [id] Nome | Cor: #HEX | Layout: modo | Header: pos | Pinned: true - Descrição`

- [design] Design | Cor: #f0eee9| Layout: gallery | Header: sticky | Pinned: false - Inspiração visual, UX/UI e tendências de design.
- [games] Games | Cor: #F59E0B | Layout: masonry | Header: sticky | Pinned: false - Lançamentos, reviews e cultura gamer.
- [tech] Tecnologia | Cor: #3B82F6 | Layout: modern | Header: sticky | Pinned: false - Notícias sobre desenvolvimento, gadgets e o mundo tech.
- [politics] Política | Cor: #EF4444 | Layout: list | Header: sticky | Pinned: false - Cobertura política nacional e internacional.
- [youtube] Vídeos| Cor: #c4302b| Layout: brutalist | Header: sticky | Pinned: false - Canais preferidos do Youtube.

## Feeds Iniciais

### design

- B9: <https://www.b9.com.br/feed/>
- CSS-Tricks: <https://css-tricks.com/feed/>
- Dezeen: <https://www.dezeen.com/feed/>
- UX Collective: <https://uxdesign.cc/feed>

### games

- Adrenaline: <https://adrenaline.com.br/feed/>
- Jogabilidade (Não Games): <https://naogames.jogabilida.de/>
- Kotaku: <https://kotaku.com/rss>
- Polygon.com: <https://www.polygon.com/feed/>

### politics

- G1 Política: <https://g1.globo.com/rss/g1/politica/>
- Mídia Ninja: <https://midianinja.org/feed/>
- Piauí: <https://piaui.folha.uol.com.br/feed/>
- The Intercept Brasil: <https://theintercept.com/brasil/feed/>

### tech

- 9to5Google: <https://9to5google.com/feed/>
- 9to5Linux: <https://9to5linux.com/feed/>
- 9to5Mac: <https://9to5mac.com/feed/>
- Ars Technica: <https://arstechnica.com/feed/>
- CNET: <http://www.cnet.com/rss/news/>
- Diolinux: <https://diolinux.com.br/feed>
- MacMagazine: <https://macmagazine.com.br/feed/>
- Meio Bit: <https://meiobit.com/feed/>
- Tecnoblog: <https://tecnoblog.net/feed/>
- The Next Web: <https://thenextweb.com/feed>
- The Verge: <https://www.theverge.com/rss/index.xml>
- Tom's Guide: <https://www.tomsguide.com/feeds.xml>
- XDA: <https://www.xda-developers.com/feed/>

### youtube

- 1155 do ET: <https://www.youtube.com/feeds/videos.xml?channel_id=UCG-KRRI41P4TsaOMeAM9dug>
- Corridor Crew: <https://www.youtube.com/feeds/videos.xml?channel_id=UCSpFnDQr88xCZ80N-X7t0nQ>
- News Rockstar: <https://www.youtube.com/feeds/videos.xml?channel_id=UC7yRILFFJ2QZCykymr8LPwA>
- NORMOSE: <https://www.youtube.com/feeds/videos.xml?channel_id=UCqBY-VQ2BxHOWnVpuC7swrw>
- Diolinux: <https://www.youtube.com/feeds/videos.xml?channel_id=UCEf5U1dB5a2e2S-XUlnhxSA>

# Listas Curadas

Esta seção define listas de feeds agrupados que podem ser importados massivamente pelo usuário.
Formato: `## Nome da Lista` seguido pelos feeds agrupados por categoria (igual ao Feeds Iniciais).

## Brasil Mix

### design

- B9: <https://www.b9.com.br/feed/>

### games

- Adrenaline: <https://adrenaline.com.br/feed/>
- IGN Brasil: <https://br.ign.com/feed.xml>
- Jogabilidade (Não Games): <https://naogames.jogabilida.de/>

### politics

- G1 Política: <https://g1.globo.com/rss/g1/politica/>
- Mídia Ninja: <https://midianinja.org/feed/>
- Piauí: <https://piaui.folha.uol.com.br/feed/>
- The Intercept Brasil: <https://theintercept.com/brasil/feed/>

### tech

- Diolinux: <https://diolinux.com.br/feed>
- MacMagazine: <https://macmagazine.com.br/feed/>
- Meio Bit: <https://meiobit.com/feed/>
- Tecnoblog: <https://tecnoblog.net/feed/>

### youtube

- 1155 do ET: <https://www.youtube.com/feeds/videos.xml?channel_id=UCG-KRRI41P4TsaOMeAM9dug>
- NORMOSE: <https://www.youtube.com/feeds/videos.xml?channel_id=UCqBY-VQ2BxHOWnVpuC7swrw>
- Diolinux: <https://www.youtube.com/feeds/videos.xml?channel_id=UCEf5U1dB5a2e2S-XUlnhxSA>

## International Mix

### design

- CSS-Tricks: <https://css-tricks.com/feed/>
- Dezeen: <https://www.dezeen.com/feed/>
- UX Collective: <https://uxdesign.cc/feed>

### games

- Kotaku: <https://kotaku.com/rss>
- Polygon.com: <https://www.polygon.com/feed/>

### tech

- 9to5Google: <https://9to5google.com/feed/>
- 9to5Linux: <https://9to5linux.com/feed/>
- 9to5Mac: <https://9to5mac.com/feed/>
- Ars Technica: <https://arstechnica.com/feed/>
- CNET: <http://www.cnet.com/rss/news/>
- Digital Trends: <https://www.digitaltrends.com/feed/>
- ElecTrek: <https://electrek.co/feed/>
- Engadget: <https://www.engadget.com/rss.xml>
- OMG! Linux: <https://www.omglinux.com/feed/>
- OMG! Ubuntu: <https://www.omgubuntu.co.uk/feed>
- The Next Web: <https://thenextweb.com/feed>
- The Verge: <https://www.theverge.com/rss/index.xml>
- Tom's Guide: <https://www.tomsguide.com/feeds.xml>
- WIRED AI: <https://www.wired.com/feed/tag/ai/latest/rss>
- WIRED Guides: <https://www.wired.com/feed/tag/wired-guide/latest/rss>
- WIRED Ideas: <https://www.wired.com/feed/category/ideas/latest/rss>
- XDA: <https://www.xda-developers.com/feed/>

### youtube

- bizlychannel: <https://www.youtube.com/feeds/videos.xml?channel_id=UCMPGiQ8gwDXFYpwQhX6kK9A>
- Corridor Crew: <https://www.youtube.com/feeds/videos.xml?channel_id=UCSpFnDQr88xCZ80N-X7t0nQ>
- GreatScott!: <https://www.youtube.com/feeds/videos.xml?channel_id=UC6mIxFTvXkWQVEHPsEdflzQ>
- News Rockstar: <https://www.youtube.com/feeds/videos.xml?channel_id=UC7yRILFFJ2QZCykymr8LPwA>
- Stuff Made Here: <https://www.youtube.com/feeds/videos.xml?channel_id=UCj1VqrHhDte54oLgPG4xpuQ>


## Pacote Mix Global

### design

- B9: <https://www.b9.com.br/feed/>
- CSS-Tricks: <https://css-tricks.com/feed/>
- Dezeen: <https://www.dezeen.com/feed/>
- UX Collective: <https://uxdesign.cc/feed>

### games

- Adrenaline: <https://adrenaline.com.br/feed/>
- IGN Brasil: <https://br.ign.com/feed.xml>
- Jogabilidade (Não Games): <https://naogames.jogabilida.de/>
- Kotaku: <https://kotaku.com/rss>
- Polygon.com: <https://www.polygon.com/feed/>

### politics

- G1 Política: <https://g1.globo.com/rss/g1/politica/>
- Mídia Ninja: <https://midianinja.org/feed/>
- Piauí: <https://piaui.folha.uol.com.br/feed/>
- The Intercept Brasil: <https://theintercept.com/brasil/feed/>

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
- The Next Web: <https://thenextweb.com/feed>
- The Verge: <https://www.theverge.com/rss/index.xml>
- Tom's Guide: <https://www.tomsguide.com/feeds.xml>
- WIRED AI: <https://www.wired.com/feed/tag/ai/latest/rss>
- WIRED Guides: <https://www.wired.com/feed/tag/wired-guide/latest/rss>
- WIRED Ideas: <https://www.wired.com/feed/category/ideas/latest/rss>
- XDA: <https://www.xda-developers.com/feed/>

### youtube

- 1155 do ET: <https://www.youtube.com/feeds/videos.xml?channel_id=UCG-KRRI41P4TsaOMeAM9dug>
- bizlychannel: <https://www.youtube.com/feeds/videos.xml?channel_id=UCMPGiQ8gwDXFYpwQhX6kK9A>
- Corridor Crew: <https://www.youtube.com/feeds/videos.xml?channel_id=UCSpFnDQr88xCZ80N-X7t0nQ>
- Diolinux: <https://www.youtube.com/feeds/videos.xml?channel_id=UCEf5U1dB5a2e2S-XUlnhxSA>
- GreatScott!: <https://www.youtube.com/feeds/videos.xml?channel_id=UC6mIxFTvXkWQVEHPsEdflzQ>
- News Rockstar: <https://www.youtube.com/feeds/videos.xml?channel_id=UC7yRILFFJ2QZCykymr8LPwA>
- NORMOSE: <https://www.youtube.com/feeds/videos.xml?channel_id=UCqBY-VQ2BxHOWnVpuC7swrw>
- Stuff Made Here: <https://www.youtube.com/feeds/videos.xml?channel_id=UCj1VqrHhDte54oLgPG4xpuQ>
