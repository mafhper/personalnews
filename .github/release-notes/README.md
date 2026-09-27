# Notas de release

Este repositório adota granularidade por **linha de versão**: a nota manual fica em `v<X.Y>.md`
(`v1.19.md`, `v1.20.md`, ...), e vale para todas as tags daquela linha.

- `minor`: uma nota por linha `major.minor`, usada nas tags `v1.19.0`, `v1.19.1`, `v1.19.2`, ...
  É a granularidade do **release-core** para projetos desktop, e a adotada aqui.
- A nota é **opcional**. Sem o arquivo, a release é publicada com a arte, a tagline, as seções e
  o changelog automático — sem a seção de novidades.

Exemplo de conteúdo (sem emoji):

```markdown
- **Descrição objetiva da mudança.** O que muda para quem usa.
- **Correção específica.** O sintoma e a causa.
- **Sem mudança de comportamento.** Para quem já usa, nada muda.
```

O corpo final da release combina a nota manual com o changelog automático gerado pelo GitHub
(a partir de `.github/release.yml`), montado pelo `release-core`.

## Antes da migração

Até a `v1.19.2` as notas eram por **tag** (`v1.19.0.md`, `v1.19.1.md`, `v1.19.2.md`). Os três
arquivos foram consolidados em `v1.19.md` — sem perder nenhum item — no mesmo commit que adotou o
`release-core`. Ver `.dev/tasks/completed/PNW2-analise-arquetipo-release-core.md` e a tarefa ativa
da adoção.
