import type { MediaItem, Shelf } from "@/lib/core/types";

export type CinemaLink = { title: string; url: string };
export type CinemaPage = { items: MediaItem[]; current: number; last: number; total?: number };
export type CinemaDetails = {
  item: MediaItem;
  fields: [string, string][];
  seasons: CinemaLink[];
  episodes: CinemaLink[];
  relatedEpisodes: CinemaLink[];
  seasonCount?: number;
  episodeCount?: number;
  watchUrl?: string;
};
export type CinemaServer = { id: string; name: string; embed?: string };
export type CinemaWatchSource = { name: string; embed?: string; url: string };

const asText = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : value == null ? fallback : String(value);

const ALLOWED_SERVER_ORDER = ["0", "1", "2", "5", "7", "8"] as const;
const SERVER_NAMES: Record<string, string> = {
  "0": "VideoTube",
  "1": "OkStream",
  "2": "UpDown",
  "5": "Byse",
  "7": "Streamtape",
  "8": "LuluStream",
};

export function asCinemaLink(raw: any): CinemaLink | null {
  const title = asText(raw?.title).trim();
  const url = asText(raw?.url).trim();
  return title && url ? { title, url } : null;
}

export function parseCinemaItem(raw: any): MediaItem | null {
  const url = asText(raw?.url).trim();
  const title = asText(raw?.title ?? raw?.name).trim();
  if (!url || !title) return null;
  const type = asText(raw?.type).toLowerCase();
  const quality = asText(raw?.quality).trim();
  const ratingRaw = parseFloat(asText(raw?.rating));
  const year = title.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? "";
  return {
    id: url,
    kind: "cinema",
    title,
    poster: asText(raw?.poster) || null,
    type: type === "series" ? "مسلسل" : type === "episode" ? "حلقة" : "فيلم",
    tags: quality ? quality.split(/\s+/).filter(Boolean).slice(0, 3) : [],
    rating: Number.isFinite(ratingRaw) ? ratingRaw : 0,
    status: "",
    year,
    count: "",
    story: asText(raw?.description),
  };
}

export function safeCinemaUrl(raw: string): string {
  let value: URL;
  try { value = new URL(raw); } catch { throw new Error("رابط العمل غير صالح."); }
  if (value.protocol !== "https:" || value.hostname !== "topcinemaa.one") throw new Error("هذا الرابط ليس من مصدر السينما المعتمد.");
  return value.toString();
}

export function parseCinemaItems(raw: unknown): MediaItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseCinemaItem).filter((item): item is MediaItem => Boolean(item));
}

export function parseCinemaCategories(data: any): CinemaLink[] {
  const rows = Array.isArray(data?.result) ? data.result : [];
  return rows.map(asCinemaLink).filter((row: CinemaLink | null): row is CinemaLink => Boolean(row));
}

export function parseCinemaHome(data: any): Shelf[] {
  const result = data?.result ?? {};
  const shelves: Shelf[] = [];
  const sections = Array.isArray(result?.sections) ? result.sections : [];
  const parsedSections: Shelf[] = sections.map((section: any, index: number) => ({
    key: `cinema-section-${index}`,
    title: asText(section?.title, "اختيارات السينما"),
    items: parseCinemaItems(section?.items),
  })).filter((section: any) => section.items.length);
  const sectionItems: MediaItem[] = parsedSections.flatMap((section) => section.items);
  const uniqueItems: MediaItem[] = Array.from(new Map<string, MediaItem>(sectionItems.map((item) => [item.id, item])).values());
  if (uniqueItems.length && uniqueItems.every((item) => item.type === "حلقة")) {
    shelves.push({ key: "cinema-latest-episodes", title: "أحدث الحلقات", items: uniqueItems });
  } else {
    shelves.push(...parsedSections);
  }
  const latest = parseCinemaItems(result?.latest);
  if (latest.length) shelves.unshift({ key: "cinema-latest", title: "أحدث الإضافات", items: latest });
  return shelves;
}

export function parseCinemaPage(data: any, fallbackPage = 1): CinemaPage {
  const result = data?.result;
  const pagination = data?.pagination ?? {};
  const current = Number(pagination.current ?? data?.page ?? fallbackPage) || fallbackPage;
  const last = Number(pagination.last ?? current) || current;
  return {
    items: parseCinemaItems(Array.isArray(result) ? result : result?.items),
    current: Math.max(1, current),
    last: Math.max(1, last),
    total: Number.isFinite(Number(data?.total)) ? Number(data.total) : undefined,
  };
}

export function parseCinemaDetails(data: any): CinemaDetails {
  const raw = data?.result ?? {};
  const item = parseCinemaItem(raw) ?? parseCinemaItem({ title: "بدون عنوان", url: "https://topcinemaa.one/" })!;
  item.story = asText(raw?.description) || asText(raw?.meta?.description);
  const fields = Object.entries(raw?.details ?? {})
    .map(([label, value]) => [asText(label), asText(value)] as [string, string])
    .filter(([, value]) => Boolean(value.trim()));
  const links = (value: unknown) => (Array.isArray(value) ? value.map(asCinemaLink).filter((row: CinemaLink | null): row is CinemaLink => Boolean(row)) : []);
  const seasonCount = Number(raw?.seasonCount);
  const episodeCount = Number(raw?.episodeCount);
  return {
    item,
    fields,
    seasons: links(raw?.seasons),
    episodes: links(raw?.episodes),
    relatedEpisodes: links(data?.relatedEpisodes ?? raw?.relatedEpisodes),
    seasonCount: Number.isFinite(seasonCount) && seasonCount > 0 ? seasonCount : undefined,
    episodeCount: Number.isFinite(episodeCount) && episodeCount > 0 ? episodeCount : undefined,
    watchUrl: asText(data?.watchUrl) || undefined,
  };
}

export function parseCinemaLinks(data: any): CinemaLink[] {
  const rows = Array.isArray(data?.result) ? data.result : [];
  return rows.map(asCinemaLink).filter((row: CinemaLink | null): row is CinemaLink => Boolean(row));
}

export function parseCinemaServers(data: any): CinemaServer[] {
  const rows = Array.isArray(data?.result) ? data.result : [];
  const byId = new Map<string, CinemaServer>();
  for (const row of rows) {
    const id = asText(row?.server);
    if (!(ALLOWED_SERVER_ORDER as readonly string[]).includes(id)) continue;
    byId.set(id, { id, name: asText(row?.label, SERVER_NAMES[id]) || SERVER_NAMES[id] });
  }
  return ALLOWED_SERVER_ORDER.filter((id) => byId.has(id)).map((id) => byId.get(id)!);
}

export function parseCinemaWatchSource(data: any): CinemaWatchSource {
  const raw = data?.result ?? {};
  const url = asText(raw?.url).trim();
  if (!url) throw new Error("لم يُرجع الخادم رابط تشغيل صالحاً.");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "x-api.spcfy.eu" || !parsed.pathname.startsWith("/api/")) {
    throw new Error("رابط المشاهدة غير معتمد.");
  }
  return { name: asText(raw?.name), embed: asText(raw?.embed) || undefined, url };
}

export const cinemaServerIds = ALLOWED_SERVER_ORDER;
export const cinemaServerNames = SERVER_NAMES;
export function cinemaServerContentType(id: string): "hls" | undefined {
  return ["0", "1", "5", "8"].includes(id) ? "hls" : undefined;
}
