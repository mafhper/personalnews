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
  headline?: string;
  tone?: keyof typeof tonePalette;
  variant?: "editorial" | "ambient";
}

export const buildImagePlaceholderDataUri = ({
  width,
  height,
  label,
  eyebrow = "Visual local",
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
    const orbPrimary = tone === "brand" ? palette.accent : "#8eb6ff";
    const orbSecondary = tone === "brand" ? "#7c3aed" : "#7dd3fc";
    const orbTertiary = tone === "brand" ? "#f59e0b" : "#f8fafc";
    const glowBand =
      tone === "brand"
        ? "rgba(130,230,213,0.24)"
        : "rgba(142,182,255,0.2)";
    const noiseOpacity = tone === "brand" ? "0.06" : "0.05";
    const safeAmbientLabel = escapeXml(
      (label.trim().slice(0, 28) || "Personal News").toUpperCase(),
    );
    const ambientEyebrow = escapeXml(
      (eyebrow.trim().slice(0, 22) || "Visual local").toUpperCase(),
    );
    const ambientLabelSize = Math.max(11, Math.round(width * 0.015));
    const ambientMetaSize = Math.max(10, Math.round(width * 0.011));
    const ambientPadding = Math.round(width * 0.065);

    const ambientMarkup = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${palette.start}" />
            <stop offset="52%" stop-color="${palette.end}" />
            <stop offset="100%" stop-color="#080c14" />
          </linearGradient>
          <radialGradient id="orbA" cx="18%" cy="16%" r="56%">
            <stop offset="0%" stop-color="${orbPrimary}" stop-opacity="0.34" />
            <stop offset="100%" stop-color="${orbPrimary}" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="orbB" cx="84%" cy="18%" r="50%">
            <stop offset="0%" stop-color="${orbSecondary}" stop-opacity="0.26" />
            <stop offset="100%" stop-color="${orbSecondary}" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="orbC" cx="42%" cy="82%" r="58%">
            <stop offset="0%" stop-color="${orbTertiary}" stop-opacity="0.14" />
            <stop offset="100%" stop-color="${orbTertiary}" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="orbD" cx="74%" cy="72%" r="38%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.1" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="flowA" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${glowBand}" />
            <stop offset="46%" stop-color="rgba(255,255,255,0.1)" />
            <stop offset="100%" stop-color="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="flowB" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.14)" />
            <stop offset="44%" stop-color="rgba(255,255,255,0.02)" />
            <stop offset="100%" stop-color="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="veil" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.02)" />
            <stop offset="100%" stop-color="rgba(2,4,8,0.34)" />
          </linearGradient>
          <pattern id="noise" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="5" r="1" fill="rgba(255,255,255,${noiseOpacity})" />
            <circle cx="20" cy="16" r="1" fill="rgba(255,255,255,0.05)" />
            <circle cx="30" cy="10" r="1" fill="rgba(255,255,255,0.04)" />
            <circle cx="11" cy="29" r="1" fill="rgba(255,255,255,0.03)" />
          </pattern>
          <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="${Math.max(18, Math.round(width * 0.02))}" />
          </filter>
          <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="${Math.max(8, Math.round(width * 0.009))}" />
          </filter>
        </defs>
        <rect width="100%" height="100%" rx="32" fill="url(#bg)" />
        <rect width="100%" height="100%" rx="32" fill="url(#noise)" />
        <rect width="100%" height="100%" rx="32" fill="url(#veil)" />
        <ellipse cx="${Math.round(width * 0.18)}" cy="${Math.round(height * 0.14)}" rx="${Math.round(width * 0.24)}" ry="${Math.round(height * 0.18)}" fill="url(#orbA)" filter="url(#blur)" />
        <ellipse cx="${Math.round(width * 0.82)}" cy="${Math.round(height * 0.18)}" rx="${Math.round(width * 0.23)}" ry="${Math.round(height * 0.18)}" fill="url(#orbB)" filter="url(#blur)" />
        <ellipse cx="${Math.round(width * 0.4)}" cy="${Math.round(height * 0.86)}" rx="${Math.round(width * 0.34)}" ry="${Math.round(height * 0.22)}" fill="url(#orbC)" filter="url(#blur)" />
        <ellipse cx="${Math.round(width * 0.8)}" cy="${Math.round(height * 0.76)}" rx="${Math.round(width * 0.24)}" ry="${Math.round(height * 0.17)}" fill="url(#orbD)" filter="url(#softBlur)" />
        <path d="M-${Math.round(width * 0.08)} ${Math.round(height * 0.28)} C ${Math.round(width * 0.12)} ${Math.round(height * 0.08)}, ${Math.round(width * 0.34)} ${Math.round(height * 0.1)}, ${Math.round(width * 0.48)} ${Math.round(height * 0.24)} S ${Math.round(width * 0.8)} ${Math.round(height * 0.4)}, ${Math.round(width * 1.06)} ${Math.round(height * 0.16)} L ${Math.round(width * 1.06)} -20 L -20 -20 Z" fill="url(#flowA)" opacity="0.78" />
        <path d="M-${Math.round(width * 0.05)} ${Math.round(height * 0.78)} C ${Math.round(width * 0.18)} ${Math.round(height * 0.58)}, ${Math.round(width * 0.34)} ${Math.round(height * 0.64)}, ${Math.round(width * 0.56)} ${Math.round(height * 0.82)} S ${Math.round(width * 0.92)} ${Math.round(height * 0.98)}, ${Math.round(width * 1.05)} ${Math.round(height * 0.74)}" fill="none" stroke="url(#flowB)" stroke-width="${Math.max(16, Math.round(width * 0.032))}" stroke-linecap="round" opacity="0.72" filter="url(#softBlur)" />
        <path d="M-${Math.round(width * 0.04)} ${Math.round(height * 0.56)} C ${Math.round(width * 0.16)} ${Math.round(height * 0.46)}, ${Math.round(width * 0.28)} ${Math.round(height * 0.42)}, ${Math.round(width * 0.44)} ${Math.round(height * 0.52)} S ${Math.round(width * 0.72)} ${Math.round(height * 0.68)}, ${Math.round(width * 1.04)} ${Math.round(height * 0.52)}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="${Math.max(6, Math.round(width * 0.01))}" stroke-linecap="round" opacity="0.68" />
        <path d="M${Math.round(width * 0.08)} ${Math.round(height * 0.22)} C ${Math.round(width * 0.14)} ${Math.round(height * 0.18)}, ${Math.round(width * 0.18)} ${Math.round(height * 0.14)}, ${Math.round(width * 0.24)} ${Math.round(height * 0.18)}" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="${Math.max(4, Math.round(width * 0.006))}" stroke-linecap="round" />
        <path d="M${Math.round(width * 0.68)} ${Math.round(height * 0.24)} C ${Math.round(width * 0.74)} ${Math.round(height * 0.18)}, ${Math.round(width * 0.82)} ${Math.round(height * 0.18)}, ${Math.round(width * 0.88)} ${Math.round(height * 0.26)}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="${Math.max(4, Math.round(width * 0.006))}" stroke-linecap="round" />
        <text
          x="${ambientPadding}"
          y="${Math.round(height * 0.2)}"
          fill="rgba(255,255,255,0.58)"
          font-family="Manrope, Segoe UI, Arial, sans-serif"
          font-size="${ambientMetaSize}"
          font-weight="700"
          letter-spacing="2.4"
        >${ambientEyebrow}</text>
        <text
          x="${ambientPadding}"
          y="${Math.round(height * 0.84)}"
          fill="rgba(255,255,255,0.9)"
          font-family="Manrope, Segoe UI, Arial, sans-serif"
          font-size="${ambientLabelSize}"
          font-weight="700"
          letter-spacing="1.6"
        >${safeAmbientLabel}</text>
        <text
          x="${ambientPadding}"
          y="${Math.round(height * 0.9)}"
          fill="rgba(255,255,255,0.42)"
          font-family="Manrope, Segoe UI, Arial, sans-serif"
          font-size="${ambientMetaSize}"
          font-weight="600"
          letter-spacing="1.4"
        >IMAGEM INDISPONIVEL</text>
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
