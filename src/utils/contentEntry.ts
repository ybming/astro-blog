import type { CollectionEntry } from "astro:content";
import { getPath } from "./getPath";

export type ContentEntry =
  | CollectionEntry<"blog">
  | CollectionEntry<"galleries">;

const isGalleryEntry = (
  entry: Pick<ContentEntry, "collection">
): entry is CollectionEntry<"galleries"> => entry.collection === "galleries";

export const getGallerySlug = (id: string) => id.replace(/\/index(?:\.(?:md|mdx))?$/, "");

export const getEntryPath = (
  entry: Pick<ContentEntry, "collection" | "id" | "filePath">
) =>
  isGalleryEntry(entry)
    ? `/galleries/${getGallerySlug(entry.id)}`
    : getPath(entry.id, entry.filePath);

/** 获取文章发布日期（blog 用 date，galleries 用 pubDatetime） */
export const getEntryDate = (entry: ContentEntry): Date => {
  if (entry.collection === "blog") {
    return (entry as CollectionEntry<"blog">).data.date;
  }
  return (entry as CollectionEntry<"galleries">).data.pubDatetime;
};

/** 获取文章更新日期（blog 用 updated，galleries 没有） */
export const getEntryModDate = (entry: ContentEntry): Date | null => {
  if (entry.collection === "blog") {
    return (entry as CollectionEntry<"blog">).data.updated ?? null;
  }
  return null;
};

export const getEntryPublishedMs = (entry: ContentEntry) => {
  const modDate = getEntryModDate(entry);
  return new Date(modDate ?? getEntryDate(entry)).getTime();
};