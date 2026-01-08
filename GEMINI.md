# GEMINI.md - Referência de Agentes e Procedimentos

Este documento consolida o conhecimento da pasta `.gemini/skills/` e define as diretrizes de desenvolvimento específicas do usuário, permitindo que a IA assuma personas e siga procedimentos especializados com precisão.

---

## 1. Perfil de Desenvolvimento e Stack

### 🚀 Tecnologias Principais

- **Frontend:** React, JavaScript, Tailwind CSS, HTML5.
- **Desktop:** Exploração de aplicações com **Tauri**.
- **Gerenciador de Pacotes:** Preferência por **Bun** (substituindo NPM sempre que possível).
- **Internacionalização (i18n):** Inglês (EN), Português do Brasil (PT-BR) e Espanhol (ES).

### 🏗️ Arquitetura e Estrutura de Pastas

- **Modularização:** Evitar arquivos de código grandes; priorizar sistemas modulares e bem organizados.
- **Estrutura de Raiz:** A aplicação principal, o site promocional e arquivos relacionados convivem na raiz para facilitar o deploy unificado.
- **Pasta `_dev/`:** Localizada na raiz para arquivos temporários, reflexão, estudo, inspiração e logs. **Deve estar no `.gitignore`**.
- **Pasta `packages/`:** Contém a suíte de testes do projeto e ferramentas relacionadas.
- **Relatórios:** Pasta de logs e métricas de desempenho dos testes na raiz. **Deve estar no `.gitignore`**.

---

## 2. Catálogo de Agentes e Especialidades

### 🏗️ Arquitetura e Estrutura

- **backend-architect**: Desenho de APIs, modelagem de dados e escalabilidade com foco em performance.
- **frontend-developer**: Especialista em React/Tailwind e design modular.
- **tauri-specialist**: Auxílio na exploração e implementação de apps desktop com Tauri.
- **i18n-expert**: Gestão de traduções e suporte a EN/PT-BR/ES.

### 🛠️ Desenvolvimento e Linguagens

- **typescript-pro / javascript-pro**: Foco em código limpo, modular e tipagem avançada.
- **bun-pro**: Otimização de scripts e workflows usando o Bun runtime.
- **fullstack-developer**: Integração entre sistemas modulares.

### 🔍 Qualidade e Dashboard

- **test-engineer**: Gestão da suíte em `packages/` e integração com a Dashboard de métricas.
- **code-reviewer**: Checklist focado em modularização e legibilidade (evitar arquivos gigantes).
- **error-detective**: Root cause analysis com foco nos logs gerados pelos servidores.

---

## 3. Diretrizes de Execução e Workflow

### 🛠️ Comandos e Servidores

- **Servidores:** O usuário inicia os servidores manualmente para acompanhar os logs.
- **Unificação:** Priorizar a unificação de chamados de servidor para rodar múltiplos processos simultaneamente com logs claros.

### ⚠️ Controle de Versão (Git/GitHub)

- **Commits e Pushes:** A IA **NUNCA** deve tomar a iniciativa de realizar `commit` ou `push`. Essa decisão é exclusiva do usuário.
- **GitHub Pages:** Implementação via Actions e Workflows para deploy do sistema modular (app + promo site).

### 📋 Fluxo de Trabalho Integrado

1. **Fase 1: Contextualização (Context Manager)**
   - Identificar dependências e o estado atual na pasta `_dev/` ou logs de teste.
2. **Fase 2: Implementação (Persona Especializada)**
   - Aplicar modularização rigorosa. Usar Bun para scripts.
3. **Fase 3: Validação (Test Engineer / Code Reviewer)**
   - Verificar se as métricas da Dashboard de testes estão saudáveis.
4. **Fase 4: Preparação (Technical Writer)**
   - Documentar mudanças, mas aguardar o comando do usuário para qualquer ação de Git.

---

## 4. Diretrizes para Reutilização

Para novos ambientes:

1. Copie este `GEMINI.md` para a raiz ou pasta `.gemini/`.
2. Mantenha a pasta `.gemini/skills/` como fonte operacional.
3. **Sempre respeite as preferências de stack e a proibição de commits automáticos.**

---
*Este documento foi personalizado para alinhar a IA ao workflow do usuário, priorizando Bun, modularidade e controle manual de versão.*
