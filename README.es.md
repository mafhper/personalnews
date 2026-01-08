# Personal News Dashboard

## Introducción
Personal News Dashboard es un agregador moderno de feeds RSS desarrollado para proporcionar una experiencia de lectura centralizada, segura y altamente personalizable. El proyecto prioriza el rendimiento y el diseño, permitiendo a los usuarios consumir contenido de diversas fuentes en una interfaz fluida y adaptable a diferentes dispositivos. A través de un sistema modular, la aplicación combina flexibilidad visual con un motor robusto de procesamiento de datos.

## Instalación
Para configurar el proyecto localmente, siga las instrucciones a continuación. Se recomienda el uso de Bun para una mejor experiencia de desarrollo y gestión de paquetes.

1. Clone el repositorio:
   ```bash
   git clone https://github.com/seu-usuario/personalnews.git
   cd personalnews
   ```

2. Instale las dependencias:
   ```bash
   bun install
   ```

3. Inicie el entorno de desarrollo:
   ```bash
   bun dev
   ```

4. Construya para producción:
   ```bash
   bun run build
   ```

## Uso
La aplicación está diseñada para ser intuitiva y potente:
- Gestión de Feeds: Añada nuevos feeds RSS, Atom o canales de YouTube a través de la herramienta de descubrimiento automático.
- Categorización: Organice sus fuentes de noticias en categorías personalizables, permitiendo diseños específicos para cada tipo de contenido.
- Navegación Avanzada: Use atajos de teclado (Ctrl+K para búsqueda, Ctrl+R para actualizar) y gestos de deslizamiento en dispositivos móviles.
- Lector Inmersivo: Acceda a una versión limpia de los artículos, optimizada para la lectura y libre de anuncios, con control total sobre la tipografía y el espaciado.
- Copia de Seguridad y Portabilidad: Exporte o importe su colección completa de feeds y categorías utilizando el estándar universal OPML.

## Tecnologías de Procesamiento de Feeds
La aplicación utiliza una arquitectura de múltiples capas para garantizar la disponibilidad y la integridad de los datos:

- Motor de Análisis: Implementación personalizada capaz de procesar RSS 2.0, Atom y RDF. Incluye rutinas de recuperación para XML mal formado y normalización de metadatos entre diferentes estándares de sindicación.
- Extracción de Contenido Completo: Integración con el algoritmo Readability para identificar y aislar el contenido principal de los artículos, permitiendo al usuario leer el artículo completo sin salir de la aplicación.
- Sistema de Proxy y Disponibilidad: Estrategia de conmutación por error con múltiples proveedores de proxy para evitar restricciones de CORS y garantizar la entrega del contenido incluso cuando las fuentes directas son inaccesibles.
- Seguridad y Sanitización: Validación rigurosa contra ataques de entidades externas (XXE) en el analizador de XML y sanitización profunda a través de DOMPurify para prevenir XSS, asegurando que el contenido de terceros se renderice de forma segura.
- Caché Inteligente y Rendimiento: Estrategia de stale-while-revalidate con almacenamiento persistente en SmartCache, minimizando las solicitudes de red y permitiendo la carga instantánea de la interfaz.

## Contribución
Las contribuciones son bienvenidas y alentadas. Para colaborar:
- Verifique los problemas reportados en Issues o abra un nuevo reporte.
- Proponga nuevos diseños visuales o mejoras de accesibilidad.
- Siga las directrices de desarrollo descritas en CONTRIBUTING.md, asegurando que las nuevas funcionalidades mantengan la tipificación estricta y los estándares de calidad del código.

## Licencia
Este proyecto está licenciado bajo la Licencia MIT. Consulte el archivo LICENSE incluido en el repositorio para obtener el texto completo de la licencia.

---
Desarrollado con ❤.