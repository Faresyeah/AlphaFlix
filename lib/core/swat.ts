import { getJson } from "./http";
import { asNumber, asString, type MediaItem, type SectionKind, type SectionService, type Shelf } from "./types";
import { readCache, writeCache } from "./cache";

/**
 * مصنع خدمة swat. كل استدعاء ينتج نسخة مستقلة تماماً (كاش وفلتر وبذور خاصة)،
 * فيستخدم المانغا والمانهوا نفس شكل الـ API دون مشاركة أي حالة.
 */
export const SWAT_API = "https://x-api.spcfy.eu/api/manga/swat";

export type SwatChapter = { id: string; chapter: string; title: string };
export type SwatDetails = MediaItem & { chapters: SwatChapter[]; views: number };
export type SwatPages = { series: string; chapter: string; title: string; images: string[] };

export function parseSwatItem(raw: any, kind: SectionKind): MediaItem {
  return {
    id: asString(raw?.id),
    kind,
    title: asString(raw?.title, "بدون عنوان"),
    poster: raw?.poster ? asString(raw.poster) : null,
    type: asString(raw?.type),
    tags: [],
    rating: asNumber(raw?.rating),
    status: asString(raw?.status),
    year: "",
    count: raw?.chapters_count != null ? `${asString(raw.chapters_count)} فصل` : "",
    story: raw?.story ? asString(raw.story).replace(/\r/g, "") : undefined,
  };
}

export function parseSwatDetails(data: any, kind: SectionKind, fallbackId: string): SwatDetails {
  const item = parseSwatItem({ ...data, id: data?.id ?? fallbackId }, kind);
  return {
    ...item,
    id: fallbackId,
    story: item.story || "لا يوجد وصف متاح لهذا العمل.",
    views: asNumber(data?.views_count),
    chapters: Array.isArray(data?.chapters)
      ? data.chapters
          .map((c: any) => ({ id: asString(c?.id), chapter: asString(c?.chapter), title: asString(c?.title) }))
          .filter((c: SwatChapter) => c.id)
      : [],
  };
}

export function parseSwatPages(data: any): SwatPages {
  return {
    series: asString(data?.series),
    chapter: asString(data?.chapter),
    title: asString(data?.title),
    images: Array.isArray(data?.images) ? data.images.filter((u: unknown) => typeof u === "string" && u) : [],
  };
}

export function createSwatService(config: {
  kind: SectionKind;
  /** يقبل نوع العمل كما يرجعه المصدر ("مانهوا كوري" ...). */
  accepts: (type: string) => boolean;
  /** استعلامات بحث حقيقية تُستخدم لبناء الرئيسية لأن الـ API لا يوفر endpoint للرئيسية. */
  seeds: string[];
  searchPlaceholder: string;
  homeTitle: string;
}) {
  const cacheKey = `damenotaku:${config.kind}:home:v2`;

  async function search(query: string): Promise<MediaItem[]> {
    const data = await getJson<any>(`${SWAT_API}/search?q=${encodeURIComponent(query.trim())}`, { ttlMs: 120_000 });
    const list = Array.isArray(data?.results) ? data.results : [];
    return list.map((r: any) => parseSwatItem(r, config.kind)).filter((i: MediaItem) => i.id && config.accepts(i.type));
  }

  const service: SectionService = {
    kind: config.kind,
    searchPlaceholder: config.searchPlaceholder,
    getCachedHome: () => readCache<Shelf[]>(cacheKey),
    async getHome() {
      const settled = await Promise.allSettled(config.seeds.map((seed) => search(seed)));
      const seen = new Set<string>();
      const items: MediaItem[] = [];
      let anyOk = false;
      for (const r of settled) {
        if (r.status !== "fulfilled") continue;
        anyOk = true;
        for (const item of r.value) if (!seen.has(item.id)) { seen.add(item.id); items.push(item); }
      }
      if (!anyOk) throw new Error("NETWORK_ERROR");
      const shelves: Shelf[] = [];
      if (items.length) shelves.push({ key: "discover", title: config.homeTitle, items });
      const rated = items.filter((i) => i.rating > 0).sort((a, b) => b.rating - a.rating);
      if (rated.length > 1) shelves.push({ key: "rated", title: "الأعلى تقييماً", items: rated });
      const ongoing = items.filter((i) => i.status.includes("مستمر"));
      if (ongoing.length > 1) shelves.push({ key: "ongoing", title: "مستمر", items: ongoing });
      if (shelves.length) void writeCache(cacheKey, shelves);
      return shelves;
    },
    search,
  };

  return {
    service,
    async getDetails(id: string): Promise<SwatDetails> {
      return parseSwatDetails(await getJson<any>(`${SWAT_API}/details/${encodeURIComponent(id)}`, { ttlMs: 300_000 }), config.kind, id);
    },
    async getChapter(chapterId: string): Promise<SwatPages> {
      return parseSwatPages(await getJson<any>(`${SWAT_API}/chapter/${encodeURIComponent(chapterId)}`, { ttlMs: 300_000 }));
    },
  };
}
