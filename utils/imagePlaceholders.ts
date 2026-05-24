const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const splitLines = (value: string, maxLength: number, maxLines: number) => {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxLength || currentLine.length === 0) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, maxLines);
};

const sourcePalettes = [
  {
    start: "#0f172a",
    mid: "#312e81",
    end: "#0891b2",
    accent: "#22d3ee",
    accentAlt: "#f97316",
  },
  {
    start: "#111827",
    mid: "#065f46",
    end: "#0e7490",
    accent: "#34d399",
    accentAlt: "#facc15",
  },
  {
    start: "#18181b",
    mid: "#7f1d1d",
    end: "#be123c",
    accent: "#fb7185",
    accentAlt: "#38bdf8",
  },
  {
    start: "#172554",
    mid: "#6d28d9",
    end: "#c026d3",
    accent: "#a78bfa",
    accentAlt: "#2dd4bf",
  },
  {
    start: "#1f2937",
    mid: "#92400e",
    end: "#b45309",
    accent: "#fbbf24",
    accentAlt: "#60a5fa",
  },
] as const;

const hashString = (value: string) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const getHostLabel = (value?: string) => {
  if (!value) return "";

  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const getSourceInitials = (value: string) => {
  const normalized = value
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "PN";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0] ?? "P"}${words[1][0] ?? "N"}`.toUpperCase();
};

const tonePalette = {
  brand: {
    start: "#071421",
    end: "#111c2d",
    accent: "#82e6d5",
    accentSoft: "rgba(130, 230, 213, 0.18)",
    line: "rgba(255,255,255,0.08)",
    text: "#f7fbff",
    subtext: "#99abc1",
  },
  neutral: {
    start: "#141923",
    end: "#202632",
    accent: "#8eb6ff",
    accentSoft: "rgba(142, 182, 255, 0.16)",
    line: "rgba(255,255,255,0.08)",
    text: "#f4f7fb",
    subtext: "#9faec1",
  },
} as const;

export interface ImagePlaceholderOptions {
  width: number;
  height: number;
  label: string;
  eyebrow?: string;
  feedUrl?: string;
  headline?: string;
  tone?: keyof typeof tonePalette;
  variant?: "editorial" | "ambient";
}

export const buildImagePlaceholderDataUri = ({
  width,
  height,
  label,
  eyebrow = "Visual local",
  feedUrl,
  headline,
  tone = "brand",
  variant = "editorial",
}: ImagePlaceholderOptions) => {
  const palette = tonePalette[tone];
  const safeLabel = escapeXml(label.trim().slice(0, 48) || "Personal News");
  const safeEyebrow = escapeXml(eyebrow.trim().slice(0, 28) || "Visual local");
  const headlineLines = (headline?.trim()
    ? splitLines(headline.trim(), 24, 2)
    : []
  ).map(escapeXml);

  const eyebrowFontSize = Math.max(11, Math.round(width * 0.014));
  const labelFontSize = Math.max(11, Math.round(width * 0.018));
  const headlineFontSize = Math.max(16, Math.round(width * 0.031));
  const lineStep = Math.round(headlineFontSize * 1.16);
  const cardX = Math.round(width * 0.08);
  const cardWidth = Math.round(width * 0.44);
  const cardY = Math.round(height * 0.66);
  const headlineX = cardX + Math.round(width * 0.03);
  const headlineStartY = cardY + Math.round(height * 0.11);
  const pillY = Math.round(height * 0.1);
  const frameX = Math.round(width * 0.08);
  const frameY = Math.round(height * 0.18);
  const frameWidth = Math.round(width * 0.84);
  const frameHeight = Math.round(height * 0.34);

  const headlineMarkup = headlineLines
    .map(
      (line, index) => `
        <text
          x="${headlineX}"
          y="${headlineStartY + lineStep * index}"
          fill="${palette.text}"
          font-family="Manrope, Segoe UI, Arial, sans-serif"
          font-size="${headlineFontSize}"
          font-weight="700"
          letter-spacing="-0.6"
        >${line}</text>
      `,
    )
    .join("");

  if (variant === "ambient") {
    const feedHost = getHostLabel(feedUrl);
    const seed = hashString(`${label}|${feedHost}|${tone}`);
    const sourcePalette = sourcePalettes[seed % sourcePalettes.length];
    const safeAmbientLabel = escapeXml(label.trim().slice(0, 32) || "Personal News");
    const safeHost = escapeXml(feedHost || "Fonte local");
    const sourceInitials = escapeXml(getSourceInitials(label || feedHost || "Personal News"));
    const ambientLabelSize = Math.max(11, Math.round(width * 0.015));
    const ambientMetaSize = Math.max(10, Math.round(width * 0.011));
    const ambientStatusSize = Math.max(12, Math.round(width * 0.013));
    const ambientPadding = Math.round(width * 0.065);
    const badgeSize = Math.max(58, Math.round(Math.min(width, height) * 0.18));
    const badgeX = Math.round(width * 0.08);
    const badgeY = Math.round(height * 0.16);
    const cardWidth = Math.round(width * 0.56);
    const cardHeight = Math.round(height * 0.34);
    const cardX = Math.round(width * 0.36);
    const cardY = Math.round(height * 0.22);
    const statusX = ambientPadding;
    const statusY = Math.round(height * 0.86);

    const ambientMarkup = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${sourcePalette.start}" />
            <stop offset="52%" stop-color="${sourcePalette.mid}" />
            <stop offset="100%" stop-color="${sourcePalette.end}" />
          </linearGradient>
          <radialGradient id="glowA" cx="16%" cy="18%" r="58%">
            <stop offset="0%" stop-color="${sourcePalette.accent}" stop-opacity="0.46" />
            <stop offset="100%" stop-color="${sourcePalette.accent}" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="glowB" cx="86%" cy="28%" r="52%">
            <stop offset="0%" stop-color="${sourcePalette.accentAlt}" stop-opacity="0.34" />
            <stop offset="100%" stop-color="${sourcePalette.accentAlt}" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.24)" />
            <stop offset="100%" stop-color="rgba(255,255,255,0.06)" />
          </linearGradient>
          <linearGradient id="accentBar" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${sourcePalette.accent}" stop-opacity="0.95" />
            <stop offset="100%" stop-color="${sourcePalette.accentAlt}" stop-opacity="0.75" />
          </linearGradient>
          <pattern id="dots" x="0" y="0" width="34" height="34" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="1" fill="rgba(255,255,255,0.16)" />
            <circle cx="22" cy="18" r="1" fill="rgba(255,255,255,0.08)" />
            <circle cx="13" cy="30" r="1" fill="rgba(255,255,255,0.06)" />
          </pattern>
          <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="${Math.max(16, Math.round(width * 0.018))}" />
          </filter>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="${Math.max(10, Math.round(height * 0.025))}" stdDeviation="${Math.max(10, Math.round(width * 0.012))}" flood-color="#020617" flood-opacity="0.28" />
          </filter>
        </defs>
        <rect width="100%" height="100%" rx="28" fill="url(#bg)" />
        <rect width="100%" height="100%" rx="28" fill="url(#dots)" opacity="0.7" />
        <ellipse cx="${Math.round(width * 0.16)}" cy="${Math.round(height * 0.18)}" rx="${Math.round(width * 0.28)}" ry="${Math.round(height * 0.2)}" fill="url(#glowA)" filter="url(#blur)" />
        <ellipse cx="${Math.round(width * 0.86)}" cy="${Math.round(height * 0.28)}" rx="${Math.round(width * 0.24)}" ry="${Math.round(height * 0.22)}" fill="url(#glowB)" filter="url(#blur)" />
        <path d="M-${Math.round(width * 0.05)} ${Math.round(height * 0.66)} C ${Math.round(width * 0.18)} ${Math.round(height * 0.5)}, ${Math.round(width * 0.36)} ${Math.round(height * 0.58)}, ${Math.round(width * 0.56)} ${Math.round(height * 0.72)} S ${Math.round(width * 0.9)} ${Math.round(height * 0.92)}, ${Math.round(width * 1.05)} ${Math.round(height * 0.66)}" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="${Math.max(14, Math.round(width * 0.028))}" stroke-linecap="round" filter="url(#blur)" />
        <g filter="url(#shadow)">
          <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="24" fill="url(#card)" stroke="rgba(255,255,255,0.2)" />
          <rect x="${cardX + Math.round(cardWidth * 0.07)}" y="${cardY + Math.round(cardHeight * 0.16)}" width="${Math.round(cardWidth * 0.52)}" height="${Math.max(10, Math.round(cardHeight * 0.075))}" rx="999" fill="rgba(255,255,255,0.36)" />
          <rect x="${cardX + Math.round(cardWidth * 0.07)}" y="${cardY + Math.round(cardHeight * 0.32)}" width="${Math.round(cardWidth * 0.78)}" height="${Math.max(10, Math.round(cardHeight * 0.075))}" rx="999" fill="rgba(255,255,255,0.22)" />
          <rect x="${cardX + Math.round(cardWidth * 0.07)}" y="${cardY + Math.round(cardHeight * 0.5)}" width="${Math.round(cardWidth * 0.64)}" height="${Math.max(10, Math.round(cardHeight * 0.075))}" rx="999" fill="rgba(255,255,255,0.16)" />
          <rect x="${cardX + Math.round(cardWidth * 0.07)}" y="${cardY + Math.round(cardHeight * 0.74)}" width="${Math.round(cardWidth * 0.38)}" height="${Math.max(8, Math.round(cardHeight * 0.065))}" rx="999" fill="url(#accentBar)" />
        </g>
        <g filter="url(#shadow)">
          <rect x="${badgeX}" y="${badgeY}" width="${badgeSize}" height="${badgeSize}" rx="${Math.round(badgeSize * 0.28)}" fill="rgba(255,255,255,0.92)" />
          <rect x="${badgeX + Math.round(badgeSize * 0.12)}" y="${badgeY + Math.round(badgeSize * 0.12)}" width="${Math.round(badgeSize * 0.76)}" height="${Math.round(badgeSize * 0.76)}" rx="${Math.round(badgeSize * 0.22)}" fill="url(#accentBar)" />
          <text
            x="${badgeX + Math.round(badgeSize * 0.5)}"
            y="${badgeY + Math.round(badgeSize * 0.6)}"
            fill="#ffffff"
            text-anchor="middle"
            font-family="Manrope, Segoe UI, Arial, sans-serif"
            font-size="${Math.max(18, Math.round(badgeSize * 0.34))}"
            font-weight="800"
          >${sourceInitials}</text>
        </g>
        <text
          x="${ambientPadding}"
          y="${Math.round(height * 0.66)}"
          fill="rgba(255,255,255,0.82)"
          font-family="Manrope, Segoe UI, Arial, sans-serif"
          font-size="${ambientMetaSize}"
          font-weight="700"
        >${safeHost}</text>
        <text
          x="${ambientPadding}"
          y="${Math.round(height * 0.75)}"
          fill="rgba(255,255,255,0.96)"
          font-family="Manrope, Segoe UI, Arial, sans-serif"
          font-size="${ambientLabelSize}"
          font-weight="800"
        >${safeAmbientLabel}</text>
        <rect x="${statusX}" y="${statusY - Math.round(ambientStatusSize * 1.5)}" width="${Math.round(width * 0.34)}" height="${Math.round(ambientStatusSize * 2.2)}" rx="999" fill="rgba(2,6,23,0.42)" stroke="rgba(255,255,255,0.16)" />
        <circle cx="${statusX + Math.round(ambientStatusSize * 1.25)}" cy="${statusY - Math.round(ambientStatusSize * 0.72)}" r="${Math.max(4, Math.round(ambientStatusSize * 0.32))}" fill="${sourcePalette.accent}" />
        <text
          x="${statusX + Math.round(ambientStatusSize * 2.2)}"
          y="${statusY - Math.round(ambientStatusSize * 0.35)}"
          fill="rgba(255,255,255,0.86)"
          font-family="Manrope, Segoe UI, Arial, sans-serif"
          font-size="${ambientStatusSize}"
          font-weight="700"
        >Imagem indisponivel</text>
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(ambientMarkup)}`;
  }

  const markup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.start}" />
          <stop offset="100%" stop-color="${palette.end}" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.94" />
          <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0.1" />
        </linearGradient>
        <radialGradient id="glowA" cx="18%" cy="20%" r="60%">
          <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.26" />
          <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="glowB" cx="84%" cy="74%" r="48%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.1" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <pattern id="grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="${palette.line}" stroke-width="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" rx="32" fill="url(#bg)" />
      <rect width="100%" height="100%" rx="32" fill="url(#grid)" opacity="0.34" />
      <rect x="0" y="0" width="100%" height="100%" rx="32" fill="url(#glowA)" />
      <rect x="0" y="0" width="100%" height="100%" rx="32" fill="url(#glowB)" />
      <rect x="0" y="0" width="100%" height="100%" rx="32" fill="${palette.accentSoft}" opacity="0.18" />
      <rect x="${frameX}" y="${frameY}" width="${frameWidth}" height="${frameHeight}" rx="24" fill="rgba(3,7,18,0.32)" stroke="rgba(255,255,255,0.08)" />
      <rect x="${frameX}" y="${frameY}" width="${frameWidth}" height="${Math.max(18, Math.round(height * 0.07))}" rx="24" fill="rgba(5,10,20,0.66)" />
      <rect x="${frameX + Math.round(width * 0.03)}" y="${frameY + Math.round(height * 0.11)}" width="${Math.round(frameWidth * 0.4)}" height="${Math.max(10, Math.round(height * 0.02))}" rx="999" fill="rgba(255,255,255,0.16)" />
      <rect x="${frameX + Math.round(width * 0.03)}" y="${frameY + Math.round(height * 0.17)}" width="${Math.round(frameWidth * 0.24)}" height="${Math.max(10, Math.round(height * 0.02))}" rx="999" fill="rgba(255,255,255,0.08)" />
      <rect x="${frameX + Math.round(width * 0.03)}" y="${frameY + Math.round(height * 0.23)}" width="${Math.round(frameWidth * 0.58)}" height="${Math.round(frameHeight * 0.42)}" rx="18" fill="rgba(255,255,255,0.06)" />
      <rect x="${frameX + Math.round(frameWidth * 0.66)}" y="${frameY + Math.round(height * 0.23)}" width="${Math.round(frameWidth * 0.23)}" height="${Math.round(frameHeight * 0.17)}" rx="16" fill="rgba(255,255,255,0.05)" />
      <rect x="${frameX + Math.round(frameWidth * 0.66)}" y="${frameY + Math.round(height * 0.43)}" width="${Math.round(frameWidth * 0.23)}" height="${Math.round(frameHeight * 0.22)}" rx="16" fill="rgba(255,255,255,0.05)" />
      <rect x="${frameX}" y="${frameY + frameHeight - Math.max(12, Math.round(height * 0.016))}" width="${frameWidth}" height="${Math.max(12, Math.round(height * 0.016))}" fill="url(#accent)" opacity="0.92" />
      <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${Math.round(height * 0.22)}" rx="24" fill="rgba(4,10,18,0.76)" stroke="rgba(255,255,255,0.08)" />
      <rect x="${Math.round(width * 0.62)}" y="${Math.round(height * 0.12)}" width="${Math.round(width * 0.19)}" height="${Math.round(height * 0.022)}" rx="999" fill="url(#accent)" opacity="0.72" />
      <rect x="${Math.round(width * 0.62)}" y="${Math.round(height * 0.18)}" width="${Math.round(width * 0.12)}" height="${Math.round(height * 0.018)}" rx="999" fill="rgba(255,255,255,0.12)" />
      <rect x="${frameX}" y="${pillY}" width="${Math.round(width * 0.22)}" height="${Math.round(height * 0.08)}" rx="${Math.round(height * 0.04)}" fill="rgba(255,255,255,0.07)" />
      <text
        x="${frameX + Math.round(width * 0.03)}"
        y="${pillY + Math.round(height * 0.05)}"
        fill="${palette.subtext}"
        font-family="Manrope, Segoe UI, Arial, sans-serif"
        font-size="${eyebrowFontSize}"
        font-weight="700"
        letter-spacing="2"
      >${safeEyebrow.toUpperCase()}</text>
      <text
        x="${headlineX}"
        y="${cardY + Math.round(height * 0.06)}"
        fill="${palette.subtext}"
        font-family="Manrope, Segoe UI, Arial, sans-serif"
        font-size="${labelFontSize}"
        font-weight="700"
        letter-spacing="1.6"
      >${safeLabel.toUpperCase()}</text>
      <rect x="${headlineX}" y="${cardY + Math.round(height * 0.17)}" width="${Math.round(cardWidth * 0.34)}" height="${Math.max(12, Math.round(height * 0.016))}" rx="999" fill="url(#accent)" />
      <rect x="${headlineX}" y="${cardY + Math.round(height * 0.21)}" width="${Math.round(cardWidth * 0.18)}" height="${Math.max(10, Math.round(height * 0.012))}" rx="999" fill="rgba(255,255,255,0.14)" />
      ${headlineMarkup}
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(markup)}`;
};
