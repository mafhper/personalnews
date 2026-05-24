export const PODCAST_HOST_HINTS: ReadonlySet<string> = new Set([
  "anchor.fm",
  "spotify.com",
  "spreaker.com",
  "www.spreaker.com",
  "omnycontent.com",
  "www.omnycontent.com",
  "feeds.megaphone.fm",
  "megaphone.fm",
  "feeds.soundcloud.com",
  "soundcloud.com",
  "feeds.simplecast.com",
  "simplecast.com",
  "libsyn.com",
  "podbean.com",
  "buzzsprout.com",
  "acast.com",
  "feeds.acast.com",
  "rss.art19.com",
  "art19.com",
  "audio.globoradio.globo.com",
  "podcasts.apple.com",
  "transistor.fm",
  "feeds.transistor.fm",
  "pinecast.com",
  "captivate.fm",
  "feeds.captivate.fm",
  "redcircle.com",
  "podcastgarden.com",
  "www.podcastgarden.com",
  "omny.fm",
  "www.omny.fm",
  "podcasters.spotify.com",
  "api.substack.com",
  "gigahertz.fm",
]);

export type FeedKind = "standard" | "podcast" | "unknown";

export const extractHost = (url: string): string => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
};

const hasPodcastHostHint = (host: string): boolean => {
  if (!host) return false;
  if (PODCAST_HOST_HINTS.has(host)) return true;
  const withoutWww = host.replace(/^www\./, "");
  if (PODCAST_HOST_HINTS.has(withoutWww)) return true;
  return Array.from(PODCAST_HOST_HINTS).some(
    (hint) => host.endsWith(`.${hint}`) || withoutWww.endsWith(`.${hint}`),
  );
};

const includesPodcastHint = (value?: string): boolean =>
  (value || "").toLowerCase().includes("podcast");

export const classifyFeedKind = (
  url: string,
  categoryName?: string,
  title?: string,
): FeedKind => {
  const host = extractHost(url);
  const lowerUrl = url.toLowerCase();

  if (
    hasPodcastHostHint(host) ||
    host.includes("podcast") ||
    lowerUrl.includes("/podcast/") ||
    lowerUrl.includes("/podcasts/") ||
    lowerUrl.includes("podcast.rss") ||
    includesPodcastHint(categoryName) ||
    includesPodcastHint(title)
  ) {
    return "podcast";
  }

  return host ? "standard" : includesPodcastHint(title) ? "podcast" : "unknown";
};
