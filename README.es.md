# Personal News

![Vista previa de la interfaz de Personal News](public/assets/screen.png)

Personal News es un lector de feeds pensado para funcionar como página de inicio personal en la web y también como aplicación de escritorio. Combina categorías curadas, diseños por tipo de contenido, parsing resistente y navegación cache-first para mantener contenido visible mientras la actualización ocurre en segundo plano.

También disponible en [inglés](README.md) y [portugués](README.pt-BR.md).

## Qué hace la aplicación

- Agrega feeds RSS, Atom, RDF y YouTube en una sola interfaz.
- Incluye categorías preconfiguradas como Design, Games, Tecnología, Política y Vídeos.
- Permite que cada categoría use un modo visual diferente, como bento, lista, inmersivo y brutalista.
- Usa carga cache-first con revalidación en segundo plano para evitar pantallas vacías durante la navegación.
- Soporta descubrimiento de feeds, gestión de categorías, importación/exportación, favoritos y empaquetado desktop.

## Aspectos destacados

### Navegación cache-first

El feed prioriza contenido ya almacenado localmente y actualiza los datos de red en segundo plano. Esto hace que el cambio de categorías se sienta más rápido y reduce la percepción de espera en catálogos amplios.

### Modelo mixto de contenido

El catálogo predeterminado combina feeds tradicionales de noticias con canales de YouTube. Las categorías centradas en vídeo pueden usar un sistema visual específico sin contaminar el resto de la interfaz.

### Pipeline de lectura y sanitización

La aplicación normaliza datos de fuentes externas, extrae metadatos útiles de los artículos y sanitiza el contenido antes de renderizarlo. La idea es mantener la legibilidad sin confiar ciegamente en el marcado de terceros.

## Stack técnica

- React 19
- TypeScript 6
- Vite 8
- Bun como gestor de paquetes y ejecutor principal de scripts
- Vitest y Playwright para pruebas
- Tauri para empaquetado desktop
- Quality Core para validación y reportes del repositorio

## Inicio rápido

### Requisitos

- Bun 1.2+
- Node.js 20+ para compatibilidad del ecosistema

### Ejecutar localmente

```bash
git clone https://github.com/mafhper/personalnews.git
cd personalnews
bun install
bun run dev
```

### Comandos útiles de validación

```bash
bun run lint
bun run type-check
bun run test
bun run test:all
bun run build
```

### Stack local con servicios auxiliares

```bash
bun run dev:local
```

Use este flujo cuando quiera levantar la app junto con su stack local de apoyo.

## Estructura del proyecto

- `components/`: bloques de UI y sistemas de layout.
- `hooks/`: hooks de estado, incluida la carga progresiva del feed.
- `services/`: parsing, caché, importación/exportación y procesamiento de contenido.
- `constants/`: categorías curadas y feeds iniciales.
- `apps/desktop/`: shell de escritorio y empaquetado.
- `docs/`: referencia técnica para contribuidores y evaluadores.

## Documentación

- [Visión técnica de la aplicación](docs/technical-overview.md)
- [Guía de scripts de package.json](docs/package-scripts-guia.md)
- [Cómo contribuir](CONTRIBUTING.md)

## Modelo de release

- Los pushes a `main` actualizan el deploy de GitHub Pages.
- Las GitHub Releases y los instaladores desktop solo se crean cuando se envía una tag de versión como `v1.3.2`.
- Si haces bump de versión de la aplicación, envía también la tag `v*` correspondiente como parte del flujo de release.

## Contribución

Los issues y pull requests son bienvenidos. Si vas a contribuir con código, empieza por [CONTRIBUTING.md](CONTRIBUTING.md) y ejecuta los comandos de validación antes de abrir un PR.

## Licencia

Este proyecto se distribuye bajo la [Licencia MIT](LICENSE).
