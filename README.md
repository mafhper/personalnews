# Personal News Dashboard

## Introdução
O Personal News Dashboard é um agregador de feeds RSS moderno, desenvolvido para oferecer uma experiência de leitura centralizada, segura e altamente personalizável. O projeto prioriza a performance e o design, permitindo que os usuários consumam conteúdo de diversas fontes em uma interface fluida e adaptável a diferentes dispositivos. Através de um sistema modular, a aplicação combina flexibilidade visual com um motor de processamento de dados robusto.

## Instalação
Para configurar o projeto localmente, siga as instruções abaixo. Recomenda-se o uso do Bun para uma melhor experiência de desenvolvimento e gerenciamento de pacotes.

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/personalnews.git
   cd personalnews
   ```

2. Instale as dependências:
   ```bash
   bun install
   ```

3. Inicie o ambiente de desenvolvimento:
   ```bash
   bun dev
   ```

4. Realize o build para produção:
   ```bash
   bun run build
   ```

## Uso
A aplicação foi desenhada para ser intuitiva e poderosa:
- Gerenciamento de Feeds: Adicione novos feeds RSS, Atom ou links de canais do YouTube através da ferramenta de descoberta automática.
- Categorização: Organize suas fontes de notícias em categorias customizáveis, permitindo layouts específicos para cada tipo de conteúdo.
- Navegação Avançada: Utilize atalhos de teclado (Ctrl+K para busca, Ctrl+R para atualizar) e gestos de swipe em dispositivos móveis.
- Leitor Imersivo: Acesse uma versão limpa dos artigos, otimizada para leitura e livre de anúncios, com controle total sobre tipografia e espaçamento.
- Backup e Portabilidade: Exporte ou importe sua coleção completa de feeds e categorias utilizando o padrão universal OPML.

## Tecnologias de Processamento de Feeds
A aplicação utiliza uma arquitetura de múltiplas camadas para garantir a disponibilidade e a integridade dos dados:

- Motor de Parsing: Implementação customizada capaz de processar RSS 2.0, Atom e RDF. Inclui rotinas de recuperação para XML malformado e normalização de metadados entre diferentes padrões de sindicação.
- Extração de Conteúdo Completo: Integração com o algoritmo Readability para identificar e isolar o conteúdo principal dos artigos, permitindo que o usuário leia a matéria completa sem sair da aplicação.
- Sistema de Proxies e Disponibilidade: Estratégia de failover com múltiplos provedores de proxy para contornar restrições de CORS e garantir a entrega do conteúdo mesmo quando fontes diretas estão inacessíveis.
- Segurança e Sanitização: Validação rigorosa contra ataques de entidades externas (XXE) no parser de XML e sanitização profunda via DOMPurify para prevenir XSS, garantindo que o conteúdo de terceiros seja renderizado de forma segura.
- Cache Inteligente e Performance: Estratégia de stale-while-revalidate com armazenamento persistente em SmartCache, minimizando requisições de rede e permitindo o carregamento instantâneo da interface.

## Contribuição
Contribuições são bem-vindas e incentivadas. Para colaborar:
- Verifique os problemas relatados nas Issues ou abra um novo reporte.
- Proponha novos layouts visuais ou melhorias de acessibilidade.
- Siga as diretrizes de desenvolvimento descritas em CONTRIBUTING.md, garantindo que novas funcionalidades mantenham a tipagem rigorosa e os padrões de qualidade de código.

## Licença
Este projeto está licenciado sob a Licença MIT. Consulte o arquivo LICENSE incluído no repositório para obter o texto completo da licença.

---
Desenvolvido com ❤.