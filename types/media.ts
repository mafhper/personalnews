export type PlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export type MediaUiMode = "expanded" | "minimized";

export interface MediaOrigin {
  categoryId: string;
  articleLink: string;
  feedUrl?: string;
  sourceTitle: string;
}

export interface PodcastPayload {
  src: string;
  title: string;
  artworkUrl?: string;
  origin: MediaOrigin;
}

export interface PodcastState extends PodcastPayload {
  kind: "podcast";
  status: "loading" | "playing" | "paused" | "error" | "ended";
  seekStatus: "full" | "limited";
  errorMessage?: string;
  currentTime: number;
  duration: number;
  ui: MediaUiMode;
}

export interface VideoAnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface VideoPayload {
  iframeSrc: string;
  title: string;
  externalUrl: string;
  provider: "youtube" | "vimeo" | "twitch";
  mayRequireExternalFallback: boolean;
  origin: MediaOrigin;
}

export interface VideoState extends VideoPayload {
  kind: "video";
  iframeKey: string;
  hasLoaded: boolean;
  ui: "docked" | "floating" | "minimized";
  anchorRect?: VideoAnchorRect;
}

export type MediaState = { kind: "none" } | PodcastState | VideoState;

export type MediaAction =
  | { type: "PLAY_PODCAST"; payload: PodcastPayload }
  | { type: "PODCAST_PLAYING" }
  | { type: "PAUSE_PODCAST" }
  | { type: "AUDIO_TIMEUPDATE"; payload: { currentTime: number; duration: number } }
  | { type: "AUDIO_ERROR"; payload: string }
  | { type: "AUDIO_ENDED" }
  | { type: "AUDIO_EXTERNALLY_PAUSED" }
  | { type: "AUDIO_SEEK_LIMITED" }
  | { type: "OPEN_VIDEO_DOCKED"; payload: VideoPayload; iframeKey: string; replace?: boolean }
  | { type: "SET_VIDEO_ANCHOR_RECT"; payload?: VideoAnchorRect }
  | { type: "VIDEO_LOADED" }
  | { type: "DETACH_VIDEO" }
  | { type: "MINIMIZE" }
  | { type: "EXPAND" }
  | { type: "CLOSE" };

export interface MediaPreferences {
  volume: number;
  playbackRate: PlaybackRate;
}

export const DEFAULT_MEDIA_STATE: MediaState = { kind: "none" };

export const DEFAULT_MEDIA_PREFERENCES: MediaPreferences = {
  volume: 0.9,
  playbackRate: 1,
};
