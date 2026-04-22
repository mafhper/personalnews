# Personal News

![Prévia da interface do Personal News](public/assets/screen.png)

Personal News é um leitor de feeds pensado para funcionar como página inicial pessoal na web e também como aplicativo desktop. A aplicação combina categorias curadas, layouts específicos por tipo de conteúdo, parsing resiliente e navegação com cache-first para manter conteúdo visível enquanto a atualização ocorre em background.

Também disponível em [inglês](README.md) e [espanhol](README.es.md).

## O que a aplicação faz

- Agrega feeds RSS, Atom, RDF e YouTube em uma única interface.
- Traz categorias prontas como Design, Games, Tecnologia, Política e Vídeos.
- Permite que cada categoria use um modo visual diferente, como bento, lista, imersivo e brutalista.
- Usa carregamento cache-first com revalidação em background para evitar telas vazias durante a navegação.
- Suporta descoberta de feeds, gerenciamento de categorias, importação/exportação, favoritos e empacotamento desktop.

## Destaques atuais

### Navegação cache-first

O feed prioriza conteúdo já armazenado localmente e atualiza os dados de rede em segundo plano. Isso deixa a troca entre categorias mais rápida e reduz a sensação de espera em conjuntos grandes de fontes.

### Modelo misto de conteúdo

O catálogo padrão combina feeds tradicionais de notícias com canais do YouTube. Categorias com foco em vídeo podem usar um sistema visual dedicado sem contaminar o restante da interface.

### Pipeline de leitura e sanitização

A aplicação normaliza dados vindos de fontes externas, extrai metadados úteis dos artigos e sanitiza o conteúdo renderizado antes de entregá-lo à UI. O objetivo é manter boa legibilidade sem confiar cegamente no markup de terceiros.

## Stack técnica

- React, TypeScript e Vite na aplicação principal
- Bun como gerenciador de pacotes e executor principal de scripts
- Vitest e Playwright para testes
- Tauri para empacotamento desktop
- Quality Core para validação e relatórios do repositório

As versões exatas das ferramentas e bibliotecas ficam em `package.json` e nos metadados do app desktop, mantendo este README focado no comportamento estável do projeto.

## Início rápido

### Requisitos

- Bun 1.2+
- Node.js 20+ para compatibilidade do ecossistema

### Rodando localmente

```bash
git clone https://github.com/mafhper/personalnews.git
cd personalnews
bun install
bun run dev
```

### Comandos úteis de validação

```bash
bun run lint
bun run type-check
bun run test
bun run test:all
bun run build
```

### Stack local com serviços auxiliares

```bash
bun run dev:local
```

Use esse fluxo quando quiser subir a aplicação junto com o stack local de apoio.

## Estrutura do projeto

- `components/`: blocos de UI e sistemas de layout.
- `hooks/`: hooks de estado da aplicação, incluindo o carregamento progressivo do feed.
- `services/`: parsing, cache, importação/exportação e processamento de conteúdo.
- `constants/`: categorias curadas e feeds iniciais.
- `apps/desktop/`: shell desktop e empacotamento.
- `docs/`: referência técnica para contribuidores e avaliadores.

## Documentação

- [Visão técnica da aplicação](docs/technical-overview.md)
- [Guia de scripts do package.json](docs/package-scripts-guia.md)
- [Como contribuir](CONTRIBUTING.md)

## Modelo de release

- Pushes em `main` atualizam o deploy no GitHub Pages.
- GitHub Releases e instaladores desktop só são criados quando uma tag de versão como `vX.Y.Z` é enviada.
- Se você fizer bump de versão da aplicação, mantenha a versão do pacote raiz e os metadados do desktop alinhados antes de enviar a tag `v*` correspondente.

## Contribuição

Issues e pull requests são bem-vindos. Se você pretende contribuir com código, comece por [CONTRIBUTING.md](CONTRIBUTING.md) e execute os comandos de validação antes de abrir um PR.

## Licença

Este projeto é distribuído sob a [Licença MIT](LICENSE).
