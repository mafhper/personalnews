# Project Template (Core Export)

Este repositório contém o núcleo técnico exportado do projeto original, preservando a automação, scripts, workflows e estrutura base.

## 📂 Estrutura de Arquivos

Abaixo, a descrição funcional dos principais diretórios e arquivos:

### `scripts/` - Automação Centralizada
O "cérebro" do projeto. Scripts em Node.js para manutenção, auditoria e testes.

- **`scripts/audit/`**: Ferramentas de verificação de qualidade.
  - `audit-runner.cjs`: Core que executa o Lighthouse CI e valida métricas de performance/SEO.
  - `runner-scheduler.js`: Orquestrador para auditorias periódicas ou em batch.
- **`scripts/ops/`**: Operações de sistema e DevOps.
  - `export-template.cjs`: O script que gerou esta pasta.
- **`scripts/test/`**: Testes de integridade.
  - `test-i18n.cjs`: Valida chaves de tradução faltantes ou duplicadas.
  - `health.cjs`: Quick check do ambiente local.
- **`scripts/core/`**: Bibliotecas compartilhadas pelos scripts (logging, paths, utils).

### `website/` - Aplicação Front-end
O código-fonte da aplicação (Site Promo / Web App).
*(Estrutura típica Vite/React)*
- `src/`: Componentes, páginas e ganchos.
- `public/`: Assets estáticos.
- `index.html`: Ponto de entrada.

### `.github/workflows/` - CI/CD
Automação do GitHub Actions.
- `deploy.yml`: Workflow de build e deploy (geralmente para GitHub Pages). valida o build antes de publicar.

### `docs/` - Memória do Projeto
Documentação técnica e registros de decisão.
- `docs/tasks.md`: Controle de tarefas e backlog.
- `docs/change.log`: Histórico de mudanças.

---

## 🚀 Como Iniciar

### 1. Instalação
Este projeto utiliza scripts customizados na raiz que dependem de pacotes npm.
```bash
# 1. Instale as dependências da RAIZ (scripts de automação)
npm install

# 2. Instale as dependências da APLICAÇÃO (website)
cd website
npm install
cd ..
```

### 2. Verificação de Saúde
Rode o checklist rápido para garantir que o ambiente está pronto:
```bash
npm run health:fast
```

### 3. Desenvolvimento
Para rodar a aplicação localmente:
```bash
# Inicia o servidor de desenvolvimento (Vite)
npm run dev
```
*(Nota: verifique se o comando `dev` no `package.json` da raiz aponta para o workspace correto, ex: `npm run dev --prefix website`)*

---

## 🛠 Workflows e Padrões

### Repositório Unificado
Mantemos código da aplicação e scripts de automação no mesmo repo para facilitar a manutenção e CI/CD.

### Regras de Commit
- Use **Conventional Commits** (ex: `feat: add new logo`, `fix: typo in readme`).
- O workflow de deploy só é acionado em pushes para a branch `main` (configure no `.yml`).

### Performance Gate
Antes de commitar, é recomendado rodar:
```bash
npm run audit
```
Isso gera um relatório Lighthouse e avisa se a performance cair abaixo dos limites estabelecidos em `scripts/config/audit-config.json`.
