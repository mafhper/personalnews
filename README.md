# Personal News Aggregator

A modern, high-performance RSS feed aggregator designed to serve as a browser homepage. Built with React 19, TypeScript, and optimized with Bun runtime for superior performance and developer experience.

![Version](https://img.shields.io/badge/version-3.2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![Bun](https://img.shields.io/badge/Bun-optimized-orange.svg)

## Overview

This application provides a centralized interface for consuming RSS/Atom feeds with advanced features including intelligent caching, progressive loading, and comprehensive search capabilities. All data is stored locally using browser storage APIs, ensuring privacy and eliminating external dependencies.

![Preview: Dashboard](/public/assets/screen.png)

## New Features

### 🌍 Internationalization (i18n)
- **Multi-language Support:** The entire interface is now fully translated into Portuguese (BR), English, Spanish, French, Italian, Chinese, and Japanese.
- **Auto-Detection:** The app attempts to detect your system language automatically.
- **Quick Switch:** Change languages instantly via the Settings > Appearance tab.

### 🎥 YouTube Feed Discovery & Playback
- **Add Channels Easily:** Paste any YouTube video URL to automatically find and subscribe to the channel's RSS feed.
- **Inline Playback:** Watch videos directly within the dashboard using the **Brutalist** layout's specialized video player card.

### 🎨 Enhanced Category Management
- **Quick Actions:** Pin, Edit, Delete, and Change Layouts directly from the navigation bar dropdowns or the Manage Categories screen.
- **Custom Layouts per Category:** Assign specific visual styles (e.g., Gallery for photos, List for news) to individual categories.
- **Visual Feedback:** New progress indicators when adding feeds.

### 💾 Backup & Restore
- **Full Data Export:** Save your entire setup (feeds, categories, settings, favorites) to a JSON file.
- **Seamless Migration:** Restore your environment on any device with a single click in Settings > Advanced.

## Personalization Guide

### 1. Organizing Feeds & Categories
- **Feed Manager:** Use the "Manage Feeds" button to add new sources.
- **Categories:** Drag and drop feeds between categories to organize them.
- **Color Coding:** Assign colors to categories for quick visual identification.
- **Layouts:** In the Category Manager (Edit/Create), select a **Default Layout** that best suits the content type.

### 2. Appearance & Visuals
Access the **Settings** (gear icon) -> **Appearance** tab to tweak:
- **Theme:** Choose from presets (Light, Dark, Colorful) or create your own custom color scheme.
- **Header:** Customize the header style (Sticky, Floating, Minimal), logo, and blur effects.
- **Background:** Set a solid color, gradient (linear/radial), pattern, or custom image.

### 3. Layout Modes
Choose the best way to consume your content:
- **Auto (Category Default):** The recommended setting. Changes layout dynamically as you navigate categories.
- **Magazine Grid:** Classic 3-column layout with featured articles.
- **Masonry:** Pinterest-style cards, perfect for visual inspiration.
- **Portal/List:** High-density list with a sidebar, great for scanning headlines.
- **Immersive:** Netflix-style, focused on large imagery.
- **Minimal:** Text-focused, centered layout for distraction-free reading.
- **Brutalist:** High-contrast, raw aesthetic with inline video support.
- **New Layouts:** Newspaper, Focus, Gallery, Compact, Split, Cyberpunk, Terminal, Polaroid.

### 4. Data Portability
Don't lose your curated list!
1. Go to **Settings** -> **Advanced**.
2. Click **Export Backup** to download your data.
3. Use **Restore Backup** on any other device to sync your setup.

## Installation & Development

### Prerequisites
- Bun 1.0+ (recommended) or Node.js 18+
- Modern web browser with ES2022 support

### Setup
```bash
# Clone repository
git clone <repository-url>
cd personal-news

# Install dependencies
bun install

# Start development server
bun dev
```

### Build for Production
```bash
# Type checking
bun run type-check

# Production build
bun run build

# The build output in 'dist/' directory is ready for deployment
```

## License

MIT License. See [LICENSE](LICENSE) file for details.
