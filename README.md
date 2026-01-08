# Personal News Dashboard

## Introduction
Personal News Dashboard is a modern RSS feed aggregator developed to provide a centralized, secure, and highly customizable reading experience. The project prioritizes performance and design, allowing users to consume content from various sources in a fluid interface adaptable to different devices. Through a modular system, the application combines visual flexibility with a robust data processing engine.

## Installation
To set up the project locally, follow the instructions below. Using Bun is recommended for the best development experience and package management.

1. Clone the repository:
   ```bash
   git clone https://github.com/seu-usuario/personalnews.git
   cd personalnews
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development environment:
   ```bash
   bun dev
   ```

4. Build for production:
   ```bash
   bun run build
   ```

## Usage
The application is designed to be intuitive and powerful:
- Feed Management: Add new RSS, Atom, or YouTube channel feeds through the automatic discovery tool.
- Categorization: Organize your news sources into customizable categories, allowing specific layouts for each type of content.
- Advanced Navigation: Use keyboard shortcuts (Ctrl+K for search, Ctrl+R to refresh) and swipe gestures on mobile devices.
- Immersive Reader: Access a clean version of articles, optimized for reading and free of ads, with full control over typography and spacing.
- Backup and Portability: Export or import your complete collection of feeds and categories using the universal OPML standard.

## Feed Processing Technologies
The application uses a multi-layer architecture to ensure data availability and integrity:

- Parsing Engine: Custom implementation capable of processing RSS 2.0, Atom, and RDF. Includes recovery routines for malformed XML and metadata normalization between different syndication standards.
- Full Content Extraction: Integration with the Readability algorithm to identify and isolate the main content of articles, allowing users to read the complete article without leaving the application.
- Proxy System and Availability: Failover strategy with multiple proxy providers to bypass CORS restrictions and ensure content delivery even when direct sources are inaccessible.
- Security and Sanitization: Rigorous validation against external entity attacks (XXE) in the XML parser and deep sanitization via DOMPurify to prevent XSS, ensuring third-party content is rendered securely.
- Smart Cache and Performance: Stale-while-revalidate strategy with persistent storage in SmartCache, minimizing network requests and enabling instant interface loading.

## Contribution
Contributions are welcome and encouraged. To collaborate:
- Check reported issues in Issues or open a new report.
- Propose new visual layouts or accessibility improvements.
- Follow the development guidelines described in CONTRIBUTING.md, ensuring new features maintain strict typing and code quality standards.

## License
This project is licensed under the MIT License. See the LICENSE file included in the repository for the full license text.

---
Developed with ❤.