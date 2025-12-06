# Personal News Dashboard 📰

> **Sua central de notícias personalizada, inteligente e visualmente imersiva.**

O **Personal News** é um agregador de feeds RSS de última geração ("Next-Gen"), construído para transformar a maneira como você consome conteúdo na web. Focando em **design**, **performance** e **personalização**, ele oferece uma experiência de leitura fluida, adaptável e esteticamente agradável.

## ✨ Principais Recursos

### 🎨 Aura Wall (Generative Backgrounds)
Esqueça os fundos estáticos. O **Aura Wall** utiliza algoritmos generativos para criar fundos animados, vetoriais e únicos baseados em ruído fractal e gradientes fluidos.
- **Zero Imagens Pesadas:** Tudo é gerado via código (SVG), garantindo carregamento instantâneo.
- **Totalmente Customizável:** Ajuste ruído, escala, cores e presets (Aurora, Neon, Dark, etc.).
- **Botão "Randomize":** Gere uma nova identidade visual para seu app com um clique.

### 📱 Layouts Adaptativos
O sistema oferece mais de **15 layouts de visualização**, que se adaptam automaticamente ao dispositivo (Mobile/Desktop) e à categoria do conteúdo:
- **Clássicos:** Magazine, Newspaper, List.
- **Visuais:** Masonry, Gallery, Polaroid, Immersive.
- **Modernos:** Bento Grid, Timeline, Split View.
- **Experimentais:** Cyberpunk, Terminal (CLI style), Brutalist.

### ⚡ Performance & UX
- **Carregamento Progressivo:** Os feeds são carregados em "chunks" para não travar a interface.
- **Background Layer Memoizado:** O fundo complexo é isolado da renderização principal, garantindo scroll suave (60fps).
- **Lazy Loading Inteligente:** Imagens carregam apenas quando entram na tela com transições suaves.
- **Mobile First:** Navegação por gestos (swipe), modais em tela cheia e headers ultra-compactos.

### 🛠️ Gerenciamento Avançado
- **Descoberta Automática:** Cole qualquer URL (site ou YouTube) e o sistema encontra o feed RSS automaticamente.
- **Categorias Drag-and-Drop:** Organize seus feeds arrastando-os entre categorias coloridas.
- **Importação/Exportação:** Suporte total a arquivos OPML para migração fácil.

## 🚀 Tecnologias

- **Core:** React 18, TypeScript, Vite.
- **Estilização:** Tailwind CSS, CSS Modules.
- **Estado & Persistência:** Custom Hooks, LocalStorage (Offline-first).
- **Algoritmos:** Simplex Noise (para Aura Wall), Fuzzy Search.

## 📦 Instalação e Uso

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/personalnews.git
    cd personalnews
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    bun install
    ```

3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

4.  **Build para produção:**
    ```bash
    npm run build
    ```

## 🤝 Contribuição

Contribuições são bem-vindas! Confira os issues abertos ou proponha novos layouts e features.

---

*Desenvolvido com foco em UX e Performance.*