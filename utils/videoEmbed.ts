/**
 * Detects if a URL is a video link and returns embed details.
 * Supports YouTube, Vimeo, and generic MP4.
 */
export function getVideoEmbed(url: string): string | null {
  if (!url) return null;

  // YouTube (Standard, Short, Embed)
  const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const ytMatch = url.match(youtubeRegex);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&modestbranding=1&rel=0`;
  }

  // Vimeo
  const vimeoRegex = /(?:vimeo\.com\/)(\d+)/i;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  // Twitch
  const twitchRegex = /(?:twitch\.tv\/)([^"&?/\s]+)/i;
  const twitchMatch = url.match(twitchRegex);
  if (twitchMatch && twitchMatch[1]) {
    // Requires parent domain for embedding
    const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${parent}&muted=false`;
  }

  return null;
}
