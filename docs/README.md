# 📘 Documentação Visual - Personal News

Este documento serve como um guia visual para as funcionalidades, layouts e fluxos do **Personal News Dashboard**. Use as marcações abaixo para inserir screenshots e ilustrar o sistema.

---

## 1. A Experiência Principal (Dashboard)

A tela inicial é o coração do aplicativo. Ela combina o **Aura Wall** (fundo dinâmico) com o layout selecionado para a categoria atual.

<!-- 
  INSTRUÇÃO PARA SCREENSHOT:
  Tire um print da tela inicial com o layout "Magazine" ou "Masonry" ativo.
  Certifique-se de que o fundo (Aura Wall) esteja visível e vibrante.
  O Header deve estar visível com as categorias.
-->
![Dashboard Principal - Visão Geral](./assets/dashboard-main.png)
> *A interface adapta-se ao conteúdo, oferecendo uma leitura sem distrações.*

---

## 2. Aura Wall: O Motor Generativo

O diferencial estético do projeto. O Aura Wall permite criar fundos únicos baseados em código, sem pesar no download.

<!-- 
  INSTRUÇÃO PARA SCREENSHOT:
  Abra o modal de Configurações -> Aba "Aparência".
  Foque na seção "Plano de Fundo" mostrando os controles de "Ruído", "Escala" e o botão "Randomize Aura".
  Mostre o preview do Aura Wall gerado.
-->
![Configurador Aura Wall](./assets/aura-wall-config.png)
> *Controles granulares para gerar arte vetorial em tempo real.*

### Presets Visuais
O sistema já vem com presets calibrados para contraste e legibilidade (Dark Blue, Neon, Aurora).

<!-- 
  INSTRUÇÃO PARA SCREENSHOT:
  Mostre a lista de presets de cores/fundo abertos ou aplicados lado a lado (montagem).
-->
![Presets do Aura Wall](./assets/aura-presets.png)

---

## 3. Layouts Adaptativos

O sistema suporta múltiplos modos de visualização. Aqui estão os destaques:

### Estilo "Newspaper" & "Magazine"
Focado em hierarquia tipográfica e leitura densa.

<!-- 
  INSTRUÇÃO PARA SCREENSHOT:
  Selecione o layout "Newspaper". Mostre o cabeçalho de data estilo jornal e as colunas de texto.
-->
![Layout Newspaper](./assets/layout-newspaper.png)

### Estilo "Polaroid" & "Gallery"
Focado em imagens grandes e apelo visual.

<!-- 
  INSTRUÇÃO PARA SCREENSHOT:
  Selecione o layout "Polaroid". Mostre os cards com aspecto de foto instantânea e a tipografia manuscrita (se houver).
-->
![Layout Polaroid](./assets/layout-polaroid.png)

### Estilo "Terminal" (CLI)
Para desenvolvedores e entusiastas de retro-computing.

<!-- 
  INSTRUÇÃO PARA SCREENSHOT:
  Selecione o layout "Terminal". Mostre o fundo preto, texto verde/monospaced e o cursor piscante simulado.
-->
![Layout Terminal](./assets/layout-terminal.png)

---

## 4. Leitura Imersiva (Reader Modal)

Ao clicar em um artigo, o leitor abre em um modal otimizado. No mobile, ele ocupa a tela inteira para maximizar a área útil.

<!-- 
  INSTRUÇÃO PARA SCREENSHOT:
  (Montagem: Desktop vs Mobile)
  Esquerda: O modal no Desktop (centralizado, com backdrop blur).
  Direita: O mesmo artigo no Mobile (tela cheia, barra de navegação "Prev/Next" fixa no rodapé).
-->
![Modal de Leitura Responsivo](./assets/reader-modal-responsive.png)
> *No mobile, a barra de navegação inferior garante que você possa transitar entre artigos com uma mão.*

---

## 5. Gerenciamento de Feeds

Adicionar conteúdo é simples e poderoso, com descoberta automática de RSS.

<!-- 
  INSTRUÇÃO PARA SCREENSHOT:
  Abra o modal "Gerenciar Feeds".
  Mostre o campo de input com uma URL sendo processada e o indicador de carregamento/sucesso.
  Abaixo, mostre a lista de feeds organizados em acordeões (Válidos, Com Erro).
-->
![Gerenciador de Feeds](./assets/feed-manager.png)

### Categorias Drag-and-Drop
Organize seus interesses arrastando feeds para pastas.

<!-- 
  INSTRUÇÃO PARA SCREENSHOT:
  Aba "Categorias" no gerenciador.
  Mostre o momento em que um feed está sendo arrastado de uma categoria para outra (ghost image).
-->
![Organização de Categorias](./assets/drag-drop-categories.png)

---

## 6. Personalização e Header

O cabeçalho pode ser configurado para desaparecer, flutuar ou ficar fixo.

<!-- 
  INSTRUÇÃO PARA SCREENSHOT:
  Mostre as opções de configuração do Header no modal de Settings:
  - Altura: "Mínima (Ultra)", "Normal", etc.
  - Estilo: "Vidro", "Sólido".
-->
![Opções de Header](./assets/header-options.png)

---

## 7. Performance e Mobile

O sistema foi otimizado para 60fps mesmo com fundos complexos.

<!-- 
  INSTRUÇÃO PARA SCREENSHOT:
  Print do DevTools (opcional) ou apenas uma tela limpa mostrando o indicador de "Swipe" no rodapé mobile.
-->
![Navegação Mobile](./assets/mobile-navigation.png)
> *Gestos de swipe para troca de páginas e layouts que respeitam a área segura do celular.*
