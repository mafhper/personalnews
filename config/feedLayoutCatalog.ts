import type { ContentConfig } from "../types";

export interface FeedLayoutOption {
  id: ContentConfig["layoutMode"];
  label: string;
  group: string;
}

export const FEED_LAYOUT_OPTIONS: FeedLayoutOption[] = [
  { id: "modern", label: "Modern", group: "Editorial" },
  { id: "magazine", label: "Magazine", group: "Editorial" },
  { id: "newspaper", label: "Newspaper", group: "Editorial" },
  { id: "split", label: "Split", group: "Editorial" },
  { id: "list", label: "List", group: "Base" },
  { id: "masonry", label: "Masonry", group: "Base" },
  { id: "minimal", label: "Minimal", group: "Base" },
  { id: "compact", label: "Compact", group: "Base" },
  { id: "bento", label: "Bento", group: "Visual" },
  { id: "gallery", label: "Gallery", group: "Visual" },
  { id: "immersive", label: "Immersive", group: "Visual" },
  { id: "focus", label: "Focus", group: "Reading" },
  { id: "timeline", label: "Timeline", group: "Reading" },
  { id: "pocketfeeds", label: "PocketFeeds", group: "Reading" },
  { id: "brutalist", label: "Brutalist", group: "Experimental" },
  { id: "cyberpunk", label: "Cyberpunk", group: "Experimental" },
  { id: "terminal", label: "Terminal", group: "Experimental" },
];

export const FEED_LAYOUT_IDS = FEED_LAYOUT_OPTIONS.map(
  (layout) => layout.id,
);

export const FEED_LAYOUT_GROUPS = FEED_LAYOUT_OPTIONS.reduce<
  Array<{ label: string; options: FeedLayoutOption[] }>
>((groups, layout) => {
  const existingGroup = groups.find((group) => group.label === layout.group);

  if (existingGroup) {
    existingGroup.options.push(layout);
    return groups;
  }

  groups.push({ label: layout.group, options: [layout] });
  return groups;
}, []);
