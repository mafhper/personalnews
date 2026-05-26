import {
  DEFAULT_MEDIA_STATE,
  MediaAction,
  MediaState,
  PodcastPayload,
  VideoPayload,
} from "../types/media";

const INITIAL_AUDIO_DURATION = 0;
const INITIAL_AUDIO_TIME = 0;

const createPodcastState = (payload: PodcastPayload): MediaState => ({
  kind: "podcast",
  ...payload,
  status: "loading",
  seekStatus: "full",
  currentTime: INITIAL_AUDIO_TIME,
  duration: INITIAL_AUDIO_DURATION,
  ui: "expanded",
});

const createVideoState = (
  payload: VideoPayload,
  iframeKey: string,
): MediaState => ({
  kind: "video",
  ...payload,
  iframeKey,
  ui: "docked",
});

export const mediaPlaybackReducer = (
  state: MediaState,
  action: MediaAction,
): MediaState => {
  switch (action.type) {
    case "PLAY_PODCAST": {
      if (state.kind === "podcast" && state.src === action.payload.src) {
        return {
          ...state,
          status: "loading",
          errorMessage: undefined,
          ui: "expanded",
        };
      }
      return createPodcastState(action.payload);
    }

    case "PODCAST_PLAYING":
      if (state.kind !== "podcast") return state;
      return { ...state, status: "playing", errorMessage: undefined };

    case "PAUSE_PODCAST":
      if (state.kind !== "podcast") return state;
      return { ...state, status: "paused", errorMessage: undefined };

    case "AUDIO_TIMEUPDATE":
      if (state.kind !== "podcast") return state;
      return {
        ...state,
        currentTime: action.payload.currentTime,
        duration: action.payload.duration,
      };

    case "AUDIO_ERROR":
      if (state.kind !== "podcast") return state;
      return {
        ...state,
        status: "error",
        errorMessage: action.payload,
      };

    case "AUDIO_ENDED":
      if (state.kind !== "podcast") return state;
      return {
        ...state,
        status: "ended",
        currentTime: state.duration || state.currentTime,
      };

    case "AUDIO_EXTERNALLY_PAUSED":
      if (state.kind !== "podcast") return state;
      return { ...state, status: "paused" };

    case "AUDIO_SEEK_LIMITED":
      if (state.kind !== "podcast") return state;
      return { ...state, seekStatus: "limited" };

    case "OPEN_VIDEO_DOCKED": {
      if (state.kind === "video" && !action.replace) {
        return {
          ...state,
          ui: "docked",
          anchorRect: undefined,
        };
      }
      return createVideoState(action.payload, action.iframeKey);
    }

    case "SET_VIDEO_ANCHOR_RECT":
      if (state.kind !== "video") return state;
      return { ...state, anchorRect: action.payload };

    case "VIDEO_LOADED":
      return state;

    case "DETACH_VIDEO":
      if (state.kind !== "video") return state;
      return { ...state, ui: "floating" };

    case "MINIMIZE":
      if (state.kind === "none") return state;
      return { ...state, ui: "minimized" } as MediaState;

    case "EXPAND":
      if (state.kind === "podcast") return { ...state, ui: "expanded" };
      if (state.kind === "video") return { ...state, ui: "floating" };
      return state;

    case "CLOSE":
      return DEFAULT_MEDIA_STATE;

    default:
      return state;
  }
};
