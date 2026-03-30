import DOMPurify from 'dompurify';

/**
 * Utilitários de sanitização para prevenir vazamento de HTML e XSS
 * 
 * Este módulo fornece funções para sanitizar conteúdo HTML que pode vir
 * de feeds RSS externos, prevenindo ataques XSS e vazamento de tags HTML.
 */

// Configure DOMPurify
const purify = DOMPurify(typeof window !== 'undefined' ? window : undefined);

// Add hooks for target="_blank" on links
purify.addHook('afterSanitizeAttributes', function (node) {
  if ('target' in node && node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * Sanitiza conteúdo HTML permitindo tags seguras para exibição (imagens, formatação)
 * mas removendo scripts e iframes perigosos.
 * 
 * @param content - Conteúdo HTML bruto
 * @returns HTML sanitizado e seguro
 */
export function sanitizeWithDomPurify(content: string | null | undefined): string {
  if (!content) return "";

  return purify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'u', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  });
}

/**
 * Sanitiza texto removendo todas as tags HTML e decodificando entidades HTML
 * 
 * @param text - Texto que pode conter HTML
 * @returns Texto limpo sem tags HTML
 */
export function sanitizeHtmlContent(text: string | null | undefined): string {
  if (!text) return "";

  // Use DOMPurify to strip all tags if available, as it's more robust
  const clean = purify.sanitize(text, {
    ALLOWED_TAGS: [], // No tags allowed = plain text
    KEEP_CONTENT: true
  });

  // Decode entities using a temporary element (more robust than regex)
  if (typeof document !== 'undefined') {
    const txt = document.createElement('textarea');
    txt.innerHTML = clean;
    return txt.value;
  }

  // Fallback to regex if needed (or if desired to keep original logic)
  let cleanText = text;

  // Múltiplas passadas para garantir que todas as entidades codificadas sejam tratadas
  for (let i = 0; i < 5; i++) {
    const beforeClean = cleanText;

    // Primeiro decodifica &amp; para & para lidar com entidades duplamente codificadas
    cleanText = cleanText.replace(/&amp;/g, "&");

    // Decodifica entidades HTML para detectar tags codificadas
    cleanText = cleanText
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      // ... keep original regex logic if preferred, but DOMPurify + textContent is better
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/")
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    // Remove todas as tags HTML (incluindo as decodificadas)
    cleanText = cleanText
      // Remove scripts e iframes primeiro (mais perigosos)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      // Remove javascript: e data: URLs
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/data:text\/html/gi, "")
      // Remove todas as tags HTML (incluindo fragmentos incompletos)
      .replace(/<[^>]*>/g, "")
      // Remove fragmentos de tags HTML incompletos (como <img sem fechamento)
      .replace(/<[^<]*$/g, "");

    // Se não houve mudanças, podemos parar
    if (cleanText === beforeClean) {
      break;
    }
  }

  // Por último, decodifica entidades HTML restantes e limpa
  cleanText = cleanText
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    // Remove caracteres de controle
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();

  return cleanText;
}

/**
 * Sanitiza descrições de artigos com limite de tamanho
 * 
 * @param description - Descrição que pode conter HTML
 * @param maxLength - Tamanho máximo da descrição (padrão: 300)
 * @returns Descrição sanitizada e truncada
 */
export function sanitizeArticleDescription(description: string | null | undefined, maxLength: number = 300): string {
  let sanitized = sanitizeHtmlContent(description);

  // Remove common RSS footer spam
  sanitized = sanitized.replace(/The post .*? appeared first on .*?\.?/gi, "").trim();

  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  // Trunca no último espaço antes do limite para não cortar palavras
  const truncated = sanitized.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) { // Se o último espaço está próximo do limite
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Sanitiza títulos de feeds e artigos
 * 
 * @param title - Título que pode conter HTML
 * @returns Título sanitizado
 */
export function sanitizeTitle(title: string | null | undefined): string {
  return sanitizeHtmlContent(title);
}

/**
 * Sanitiza URLs removendo javascript: e outros protocolos perigosos
 * 
 * @param url - URL que pode ser maliciosa
 * @returns URL sanitizada ou string vazia se for perigosa
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";

  const cleanUrl = url.trim();

  // Lista de protocolos perigosos
  const dangerousProtocols = [
    'javascript:',
    'vbscript:',
    'data:text/html',
    'data:application/javascript',
    'data:text/javascript'
  ];

  const lowerUrl = cleanUrl.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return "";
    }
  }

  // Permite apenas http, https e mailto (FTP removido por segurança)
  if (!/^(https?|mailto):/i.test(cleanUrl)) {
    // Se não tem protocolo, assume https
    if (!/^[a-z]+:/i.test(cleanUrl)) {
      return `https://${cleanUrl}`;
    }
    return "";
  }

  // Validação adicional: verifica se é uma URL válida
  try {
    const urlObj = new URL(cleanUrl);
    // Bloqueia localhost e IPs privados em produção (exceto em desenvolvimento)
    const hostname = urlObj.hostname.toLowerCase();
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.16.');
    
    // Em produção, bloquear localhost pode quebrar funcionalidades, então apenas logamos
    if (isLocalhost && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      console.warn('Blocked localhost URL in production:', cleanUrl);
      return "";
    }
    
    return cleanUrl;
  } catch {
    // Se não é uma URL válida, retorna vazio
    return "";
  }
}

/**
 * Verifica se o texto contém HTML (incluindo entidades codificadas)
 * 
 * @param text - Texto a ser verificado
 * @returns true se contém HTML, false caso contrário
 */
export function containsHtml(text: string | null | undefined): boolean {
  if (!text) return false;

  // Verifica tags HTML diretas
  if (/<[^>]*>/g.test(text)) {
    return true;
  }

  // Verifica entidades HTML codificadas que representam tags
  if (/&lt;[^&]*&gt;/g.test(text)) {
    return true;
  }

  // Verifica entidades duplamente codificadas (&amp;lt; e &amp;gt;)
  if (/&amp;lt;[^&]*&amp;gt;/g.test(text)) {
    return true;
  }

  // Verifica entidades duplamente codificadas incompletas (como &amp;lt; sem fechamento)
  if (/&amp;lt;/g.test(text)) {
    return true;
  }

  // Verifica outras formas de codificação HTML numérica
  if (/&#60;[^&#]*&#62;/g.test(text)) {
    return true;
  }

  // Verifica entidades numéricas incompletas
  if (/&#60;/g.test(text)) {
    return true;
  }

  return false;
}

/**
 * Sanitiza e simplifica o título da fonte (site)
 * remove sub-títulos longos e texto desnecessário
 * 
 * @param sourceTitle - Título da fonte/site
 * @param url - URL opcional para conferência
 * @returns Título simplificado
 */
export function sanitizeSourceTitle(sourceTitle: string | null | undefined, url?: string): string {
  if (!sourceTitle) return "";
  
  let cleanTitle = sanitizeTitle(sourceTitle).trim();
  
  // Mapa de nomes conhecidos baseado em domínio (prioridade máxima)
  const knownSiteNames: Record<string, string> = {
    'adafruit.com': 'Adafruit',
    'blog.adafruit.com': 'Adafruit',
    'uxdesign.cc': 'UX Collective',
    'medium.com': 'Medium',
    'dezeen.com': 'Dezeen',
    'theverge.com': 'The Verge',
    'arstechnica.com': 'Ars Technica',
    'wired.com': 'Wired',
    'techcrunch.com': 'TechCrunch',
    'hackaday.com': 'Hackaday',
    'makezine.com': 'Make',
    'engadget.com': 'Engadget',
    'gizmodo.com': 'Gizmodo',
    'kotaku.com': 'Kotaku',
    'polygon.com': 'Polygon',
    'eurogamer.net': 'Eurogamer',
    'rockpapershotgun.com': 'RPS',
    'pcgamer.com': 'PC Gamer',
    'ign.com': 'IGN',
    'gamespot.com': 'GameSpot',
    'destructoid.com': 'Destructoid',
    'smashingmagazine.com': 'Smashing',
    'css-tricks.com': 'CSS-Tricks',
    'dev.to': 'DEV',
    'news.ycombinator.com': 'Hacker News',
    'reddit.com': 'Reddit',
    'producthunt.com': 'Product Hunt',
    'dribbble.com': 'Dribbble',
    'behance.net': 'Behance',
    'designboom.com': 'Designboom',
    'archdaily.com': 'ArchDaily',
    'youtube.com': 'YouTube',
  };
  
  // Tenta resolver pelo domínio primeiro
  if (url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/^www\./i, '').toLowerCase();
      
      // Verifica nome exato no mapa
      if (knownSiteNames[hostname]) {
        return knownSiteNames[hostname];
      }
      
      // Verifica sub-domínios (blog.example.com -> example.com)
      const hostParts = hostname.split('.');
      if (hostParts.length > 2) {
        const baseDomain = hostParts.slice(-2).join('.');
        if (knownSiteNames[baseDomain]) {
          return knownSiteNames[baseDomain];
        }
      }
    } catch {
      // Ignora erro de URL inválida
    }
  }
  
  // Separadores agressivos: captura Unicode dashes, pipes, bullets, colons, underscores e barras
  // Regex: 
  // 1: traços Unicode, pipes, bullets isolados por zero ou mais espaços
  // 2: traço hifen, dois-pontos, underline ou barra cercados obrigatoriamente por pelo menos um espaço
  // 3: duplos colons, sublinhados seguidos, traços seguidos (ex: --, __, ::) mesmo sem espaço
  const separatorRegex = /\s*[\u2013\u2014\u2015\u2012\|\u2022\u25CF]\s*|\s+[-:_/]+\s+|\s*::\s*|\s*--+\s*|\s*__+\s*/;
  
  const parts = cleanTitle.split(separatorRegex);
  if (parts.length > 1 && parts[0].trim().length >= 2) {
    cleanTitle = parts[0].trim();
  }
  
  // Remove sufixos comuns que não agregam valor no chip
  cleanTitle = cleanTitle
    .replace(/\s+(Blog|RSS|Feed|News|Home|Online|Official)$/i, '')
    .trim();

  // Remove extenções de domínio se estiverem chapadas no título (ex: "Adafruit.com" -> "Adafruit")
  // e limpa variações maliciosas de www.
  cleanTitle = cleanTitle
    .replace(/^www\./i, '')
    .replace(/\.(com|net|org|io|co|us|uk|br|pt|info|biz|me|cc|tv|so|digital|tech)( \w+)?$/i, '')
    .trim();

  if (url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/^www\./i, '').toLowerCase();
      const hostParts = hostname.split('.');
      
      const mainName = hostParts.length > 2 && hostParts[hostParts.length - 3] !== 'www' 
          ? hostParts[hostParts.length - 3] 
          : hostParts[hostParts.length - 2] || hostParts[0];
          
      const capitalizedMainName = mainName.charAt(0).toUpperCase() + mainName.slice(1);

      // Lógica de fallback se o título for URL, muito curto, genérico, 
      // ou se bater quase que identicamente com a URL (ex: title="uxdesign" vs. url="uxdesign.cc")
      const similarityCheck = cleanTitle.toLowerCase().replace(/\s+/g, '') === mainName.toLowerCase();
      
      if (similarityCheck || cleanTitle.length < 2 || cleanTitle.toLowerCase().includes('http') || cleanTitle.toLowerCase() === 'untitled feed') {
         cleanTitle = capitalizedMainName;
      }
    } catch {
      // Ignora erro de URL inválida
    }
  }

  // Limite de segurança para títulos em pílulas (chips)
  if (cleanTitle.length > 22) {
    // Tenta cortar no último espaço antes do limite
    const truncated = cleanTitle.substring(0, 20);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 10) {
      cleanTitle = truncated.substring(0, lastSpace) + '…';
    } else {
      cleanTitle = truncated + '…';
    }
  }

  return cleanTitle;
}


/**
 * Sanitiza conteúdo de feeds RSS completo
 * 
 * @param feedContent - Objeto com propriedades que podem conter HTML
 * @returns Objeto com propriedades sanitizadas
 */
export function sanitizeFeedContent<T extends Record<string, unknown>>(feedContent: T): T {
  const sanitized = { ...feedContent } as Record<string, unknown>;

  // Sanitiza propriedades comuns de feeds
  if ('title' in sanitized && typeof sanitized.title === 'string') {
    sanitized.title = sanitizeTitle(sanitized.title);
  }

  if ('description' in sanitized && typeof sanitized.description === 'string') {
    sanitized.description = sanitizeArticleDescription(sanitized.description);
  }

  if ('link' in sanitized && typeof sanitized.link === 'string') {
    sanitized.link = sanitizeUrl(sanitized.link);
  }

  if ('author' in sanitized && typeof sanitized.author === 'string') {
    sanitized.author = sanitizeHtmlContent(sanitized.author);
  }

  if ('sourceTitle' in sanitized && typeof sanitized.sourceTitle === 'string') {
    // Tenta usar o link para conferência se disponível
    const url = typeof sanitized.link === 'string' ? sanitized.link : undefined;
    sanitized.sourceTitle = sanitizeSourceTitle(sanitized.sourceTitle, url);
  }

  return sanitized as T;
}