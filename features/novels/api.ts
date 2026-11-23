import { readCache, writeCache } from "../../lib/core/cache";
import { getJson } from "../../lib/core/http";
import type { MediaItem, SectionService, Shelf } from "../../lib/core/types";
import { parseChapterRefs, parseNovelChapter, parseNovelDetails, parseNovelItem, parseNovelList, type NovelChapter, type NovelChapterRef, type NovelDetails } from "./parse";

export const NOVELS_API = "https://adminx.sunovels.com/api/mobile";
const CACHE_KEY = "damenotaku:novels:home:v2";
const COMMON = "v=0.0.1&device=android";
const HEADERS: Record<string, string> = {
  "x-requested-with": "com.sunovels.novels",
  origin: "http://localhost",
  referer: "http://localhost/",
  "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-A325F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/157.0.8103.50 Mobile Safari/537.36",
  "Accept-Language": "ar,en-US;q=0.5,en;q=0.4",
};

const seenChapters = new Map<string, NovelChapterRef[]>();
function remember(items: any[]) {
  for (const raw of items) {
    const refs = parseChapterRefs(raw?.chapters);
    if (raw?.id != null && refs.length) seenChapters.set(String(raw.id), refs);
  }
}

export const novelsService: SectionService = {
  kind: "novels",
  searchPlaceholder: "ابحث عن رواية...",
  getCachedHome: () => readCache<Shelf[]>(CACHE_KEY),
  async getHome() {
    const data = await getJson<any>(`${NOVELS_API}/home/updated?limit=20&${COMMON}`, { headers: HEADERS, ttlMs: 60_000 });
    const list = Array.isArray(data) ? data : [];
    remember(list);
    const items = parseNovelList(list);
    const shelves: Shelf[] = [];
    if (items.length) shelves.push({ key: "updated", title: "آخر التحديثات", items });
    const ranked = [...items].sort((a, b) => b.rating - a.rating).filter((i) => i.rating > 0);
    if (ranked.length > 1) shelves.push({ key: "rated", title: "الأعلى تقييماً", items: ranked });
    if (shelves.length) void writeCache(CACHE_KEY, shelves);
    return shelves;
  },
  async search(query) {
    const q = encodeURIComponent(query.trim());
    const url = `${NOVELS_API}/novels?start=0&limit=25&_q=${q}&sort%5Brank%5D=asc&fields%5B0%5D=arabicTitle&fields%5B1%5D=rank&fields%5B2%5D=title&fields%5B3%5D=totalViews&${COMMON}`;
    const data = await getJson<any>(url, { headers: HEADERS, ttlMs: 120_000 });
    const list = Array.isArray(data) ? data : [];
    remember(list);
    return parseNovelList(list);
  },
};

export type NovelChapterPage = { chapters: NovelChapterRef[]; page: number; totalPages: number; total: number };

/** يعيد صفحة واحدة فقط من فصول الرواية لتفتح صفحة التفاصيل بسرعة. */
export async function getNovelChaptersPage(id: string, page = 0): Promise<NovelChapterPage> {
  const endpoint = `${NOVELS_API}/novels/${encodeURIComponent(id)}/chapters`;
  const suffix = page > 0 ? `page=${page}&` : "";
  const data = await getJson<any>(`${endpoint}?${suffix}${COMMON}`, { headers: HEADERS, ttlMs: 300_000 });
  return { chapters: parseChapterRefs(data?.chaptersList), page, totalPages: Math.max(1, Number(data?.totalPages) || 1), total: Number(data?.total) || 0 };
}

export async function getNovelDetails(id: string): Promise<NovelDetails> {
  const [data, firstPage] = await Promise.all([
    getJson<any>(`${NOVELS_API}/novels/${encodeURIComponent(id)}?${COMMON}`, { headers: HEADERS, ttlMs: 300_000 }),
    getNovelChaptersPage(id, 0),
  ]);
  const details = parseNovelDetails(data, id);
  details.chapters = firstPage.chapters.length ? firstPage.chapters : details.chapters.length ? details.chapters : seenChapters.get(id) ?? [];
  details.chaptersCount = firstPage.total || details.chaptersCount || details.chapters.length;
  details.chapterPageCount = firstPage.totalPages;
  return details;
}

export async function getNovelChapter(chapterId: string): Promise<NovelChapter> {
  const data = await getJson<any>(`${NOVELS_API}/chapter/${encodeURIComponent(chapterId)}?${COMMON}`, { headers: HEADERS, ttlMs: 300_000 });
  if (!data?.chapter) throw new Error("CHAPTER_NOT_FOUND");
  return parseNovelChapter(data);
}

export type { MediaItem, NovelChapter, NovelChapterRef, NovelDetails };
export { parseNovelItem };
