import { describe, expect, it } from "vitest";
import { mediaPlaybackReducer } from "../services/mediaPlaybackReducer";
import type { MediaState, PodcastPayload, VideoPayload } from "../types/media";

const origin = {
  categoryId: "podcasts",
  articleLink: "https://example.com/episode",
  sourceTitle: "Science Podcast",
};

const podcast: PodcastPayload = {
  src: "https://cdn.example.com/episode.mp3",
  title: "Science episode",
  artworkUrl: "https://cdn.example.com/art.jpg",
  origin,
};

const video: VideoPayload = {
  iframeSrc: "https://www.youtube.com/embed/video-one?autoplay=1",
  title: "Video one",
  externalUrl: "https://www.youtube.com/watch?v=video-one",
  provider: "youtube",
  mayRequireExternalFallback: false,
  origin: {
    categoryId: "youtube",
    articleLink: "https://www.youtube.com/watch?v=video-one",
    sourceTitle: "Creator",
  },
};

describe("mediaPlaybackReducer", () => {
  it("starts a podcast from an empty state", () => {
    const state = mediaPlaybackReducer(
      { kind: "none" },
      { type: "PLAY_PODCAST", payload: podcast },
    );

    expect(state).toMatchObject({
      kind: "podcast",
      src: podcast.src,
      title: podcast.title,
      status: "loading",
      seekStatus: "full",
      currentTime: 0,
      duration: 0,
      ui: "expanded",
    });
  });

  it("opens a podcast over an active video", () => {
    const videoState = mediaPlaybackReducer(
      { kind: "none" },
      { type: "OPEN_VIDEO_DOCKED", payload: video, iframeKey: "iframe-1" },
    );

    const state = mediaPlaybackReducer(videoState, {
      type: "PLAY_PODCAST",
      payload: podcast,
    });

    expect(state.kind).toBe("podcast");
    expect(state).toMatchObject({ src: podcast.src, status: "loading" });
  });

  it("keeps iframe key and src immutable while redocking the same video", () => {
    const videoState = mediaPlaybackReducer(
      { kind: "none" },
      { type: "OPEN_VIDEO_DOCKED", payload: video, iframeKey: "iframe-1" },
    );

    const redocked = mediaPlaybackReducer(videoState, {
      type: "OPEN_VIDEO_DOCKED",
      payload: {
        ...video,
        iframeSrc: "https://www.youtube.com/embed/changed",
        title: "Updated title and origin",
        origin: {
          categoryId: "design",
          articleLink: "https://example.com/updated-video-origin",
          sourceTitle: "Updated creator",
        },
      },
      iframeKey: "iframe-2",
    });

    expect(redocked).toMatchObject({
      kind: "video",
      iframeKey: "iframe-1",
      iframeSrc: video.iframeSrc,
      title: "Updated title and origin",
      origin: {
        categoryId: "design",
        articleLink: "https://example.com/updated-video-origin",
      },
      ui: "docked",
    });
  });

  it("allows replacing an active video only through an explicit replace action", () => {
    const videoState = mediaPlaybackReducer(
      { kind: "none" },
      { type: "OPEN_VIDEO_DOCKED", payload: video, iframeKey: "iframe-1" },
    );
    const nextVideo = {
      ...video,
      iframeSrc: "https://www.youtube.com/embed/video-two?autoplay=1",
      title: "Video two",
    };

    const replaced = mediaPlaybackReducer(videoState, {
      type: "OPEN_VIDEO_DOCKED",
      payload: nextVideo,
      iframeKey: "iframe-2",
      replace: true,
    });

    expect(replaced).toMatchObject({
      kind: "video",
      iframeKey: "iframe-2",
      iframeSrc: nextVideo.iframeSrc,
      title: "Video two",
      hasLoaded: false,
    });
  });

  it("records that an active video iframe loaded without changing its identity", () => {
    const videoState = mediaPlaybackReducer(
      { kind: "none" },
      { type: "OPEN_VIDEO_DOCKED", payload: video, iframeKey: "iframe-1" },
    );

    const loaded = mediaPlaybackReducer(videoState, { type: "VIDEO_LOADED" });

    expect(loaded).toMatchObject({
      kind: "video",
      iframeKey: "iframe-1",
      iframeSrc: video.iframeSrc,
      hasLoaded: true,
    });
  });

  it("minimizes and expands media without changing source identity", () => {
    const podcastState = mediaPlaybackReducer(
      { kind: "none" },
      { type: "PLAY_PODCAST", payload: podcast },
    );
    const minimized = mediaPlaybackReducer(podcastState, { type: "MINIMIZE" });
    const expanded = mediaPlaybackReducer(minimized, { type: "EXPAND" });

    expect(minimized).toMatchObject({ kind: "podcast", src: podcast.src, ui: "minimized" });
    expect(expanded).toMatchObject({ kind: "podcast", src: podcast.src, ui: "expanded" });
  });

  it("marks podcast seek as limited without stopping playback", () => {
    const playing = mediaPlaybackReducer(
      mediaPlaybackReducer(
        { kind: "none" },
        { type: "PLAY_PODCAST", payload: podcast },
      ),
      { type: "PODCAST_PLAYING" },
    );
    const limited = mediaPlaybackReducer(playing, {
      type: "AUDIO_SEEK_LIMITED",
    });

    expect(limited).toMatchObject({
      kind: "podcast",
      status: "playing",
      seekStatus: "limited",
    });
  });

  it("keeps source when audio is externally paused", () => {
    const playing = mediaPlaybackReducer(
      mediaPlaybackReducer(
        { kind: "none" },
        { type: "PLAY_PODCAST", payload: podcast },
      ),
      { type: "PODCAST_PLAYING" },
    );
    const paused = mediaPlaybackReducer(playing, {
      type: "AUDIO_EXTERNALLY_PAUSED",
    });

    expect(paused).toMatchObject({
      kind: "podcast",
      src: podcast.src,
      status: "paused",
    });
  });

  it("closes any state to none", () => {
    const state: MediaState = mediaPlaybackReducer(
      { kind: "none" },
      { type: "OPEN_VIDEO_DOCKED", payload: video, iframeKey: "iframe-1" },
    );

    expect(mediaPlaybackReducer(state, { type: "CLOSE" })).toEqual({
      kind: "none",
    });
  });
});
