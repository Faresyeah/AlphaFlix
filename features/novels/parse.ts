import { asNumber, asString, type MediaItem } from "../../lib/core/types";

export const SUNOVELS_ORIGIN = "https://adminx.sunovels.com";

export type NovelChapterRef = { id: string; number: number; title: string };
export type NovelDetails = MediaItem & { chapters: NovelChapterRef[]; chaptersCount: number; locked: number; categories: string[]; chapterPageCount?: number };
export type NovelChapter = {
  id: string;
  number: number;
  title: string;
  /** نص عادي مقسّم إلى فقرات. */
  paragraphs: string[];
  novelId: string;
  novelTitle: string;
  next: NovelChapterRef | null;
  prev: NovelChapterRef | null;
};

export function coverUrl(cover: any): string | null {
  const url = cover?.formats?.medium?.url ?? cover?.formats?.small?.url ?? cover?.url ?? cover?.formats?.thumbnail?.url;
  const s = asString(url);
  if (!s) return null;
  return /^https?:\/\//.test(s) ? s : `${SUNOVELS_ORIGIN}${s.startsWith("/") ? "" : "/"}${s}`;
}

export function parseChapterRefs(list: unknown): NovelChapterRef[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((c: any) => ({ id: asString(c?.id), number: asNumber(c?.chapterNumber ?? c?.title), title: asString(c?.title) }))
    .filter((c) => c.id);
}

export function parseNovelItem(raw: any): MediaItem {
  const status = asString(raw?.status);
  return {
    id: asString(raw?.id),
    kind: "novels",
    title: asString(raw?.arabicTitle) || asString(raw?.title, "بدون عنوان"),
    poster: coverUrl(raw?.coverImage),
    type: raw?.novelType === "authoress" ? "رواية أصلية" : "رواية مترجمة",
    tags: Array.isArray(raw?.categories) ? raw.categories.map((c: any) => asString(c?.name)).filter(Boolean).slice(0, 6) : [],
    rating: asNumber(raw?.averageReviews ?? raw?.rating),
    status: status === "Ongoing" ? "مستمرة" : status === "Completed" ? "مكتملة" : status,
    year: "",
    count: raw?.chaptersCount ? `${raw.chaptersCount} فصل` : "",
    story: asString(raw?.about ?? raw?.description) || undefined,
    author: asString(raw?.author) || (Array.isArray(raw?.authors) && raw.authors[0]?.name ? asString(raw.authors[0].name) : undefined),
  };
}

export function parseNovelList(list: unknown): MediaItem[] {
  return Array.isArray(list) ? list.map(parseNovelItem).filter((n) => n.id) : [];
}

export function parseNovelDetails(data: any, fallbackId: string): NovelDetails {
  const item = parseNovelItem({ ...data, id: data?.id ?? fallbackId });
  return {
    ...item,
    id: fallbackId,
    story: item.story || "لا يوجد وصف متاح لهذه الرواية.",
    chapters: parseChapterRefs(data?.chapters),
    chaptersCount: asNumber(data?.chaptersCount ?? data?.stats?.chaptersCount),
    locked: asNumber(data?.lockedChaptersPercentage),
    categories: item.tags,
  };
}

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&hellip;": "…" };

/** يحوّل HTML الفصل إلى فقرات نصية آمنة للعرض في Text. */
export function htmlToParagraphs(html: unknown): string[] {
  const s = asString(html);
  if (!s) return [];
  return s
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos|hellip|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .split(/\n{2,}|\n/)
    .map((p) => p.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
}

export function parseNovelChapter(data: any): NovelChapter {
  const chapter = data?.chapter ?? {};
  const next = data?.nextChapter?.id ? parseChapterRefs([data.nextChapter])[0] : null;
  const prev = data?.prevChapter?.id || data?.previousChapter?.id ? parseChapterRefs([data.prevChapter ?? data.previousChapter])[0] : null;
  return {
    id: asString(chapter?.id),
    number: asNumber(chapter?.chapterNumber),
    title: asString(chapter?.title),
    paragraphs: htmlToParagraphs(chapter?.content),
    novelId: asString(chapter?.novel?.id),
    novelTitle: asString(chapter?.novel?.arabicTitle) || asString(chapter?.novel?.title),
    next,
    prev,
  };
}
