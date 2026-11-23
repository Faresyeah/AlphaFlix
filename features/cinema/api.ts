import { readCache, writeCache } from "@/lib/core/cache";
import { getJson, HttpError } from "@/lib/core/http";
import type { Shelf } from "@/lib/core/types";
import {
  parseCinemaCategories,
  parseCinemaDetails,
  parseCinemaHome,
  parseCinemaLinks,
  parseCinemaPage,
  parseCinemaServers,
  parseCinemaWatchSource,
  safeCinemaUrl,
  type CinemaDetails,
  type CinemaLink,
  type CinemaPage,
  type CinemaServer,
  type CinemaWatchSource,
} from "./parse";

export const CINEMA_API = "https://x-api.spcfy.eu/api/topcinema";
export const CINEMA_ORIGIN = "https://topcinemaa.one";
const HOME_CACHE = "damenotaku:cinema:home:v1";

function endpoint(path: string, params: Record<string, string | number | undefined> = {}) {
  const url = new URL(`${CINEMA_API}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function checked<T>(data: any): T {
  if (data?.status === false) throw new Error(typeof data?.error === "string" ? data.error : "تعذر جلب البيانات من المصدر.");
  return data as T;
}

export async function getCinemaHome(): Promise<{ data: any; shelves: Shelf[] }> {
  const cached = await readCache<any>(HOME_CACHE);
  try {
    const data = checked<any>(await getJson<any>(endpoint("home"), { ttlMs: 60_000 }));
    const shelves = parseCinemaHome(data);
    if (shelves.length) void writeCache(HOME_CACHE, data);
    return { data, shelves };
  } catch (error) {
    if (cached) return { data: cached, shelves: parseCinemaHome(cached) };
    throw error;
  }
}

export async function getCinemaCategories(): Promise<CinemaLink[]> {
  return parseCinemaCategories(checked(await getJson<any>(endpoint("categories"), { ttlMs: 300_000 })));
}

export async function getCinemaCatalog(kind: "movies" | "series", page = 1): Promise<CinemaPage> {
  const data = checked<any>(await getJson<any>(endpoint(kind, { page: Math.max(1, page) }), { ttlMs: 90_000 }));
  return parseCinemaPage(data, page);
}

export async function searchCinema(query: string, type: "movie" | "series"): Promise<CinemaPage> {
  const term = query.trim();
  if (!term) return { items: [], current: 1, last: 1 };
  const data = checked<any>(await getJson<any>(endpoint("search", { q: term, type }), { ttlMs: 90_000 }));
  return parseCinemaPage(data, 1);
}

export async function getCinemaList(url: string, page = 1): Promise<CinemaPage> {
  const data = checked<any>(await getJson<any>(endpoint("list", { url: safeCinemaUrl(url), page: Math.max(1, page) }), { ttlMs: 90_000 }));
  return parseCinemaPage(data, page);
}

export async function getCinemaFilter(url: string): Promise<{ page: CinemaPage; filters: Record<string, unknown> }> {
  const data = checked<any>(await getJson<any>(endpoint("filter", { url: safeCinemaUrl(url) }), { ttlMs: 90_000 }));
  return { page: parseCinemaPage(data, 1), filters: data?.filters && typeof data.filters === "object" ? data.filters : {} };
}

export async function getCinemaDetails(url: string): Promise<CinemaDetails> {
  return parseCinemaDetails(checked(await getJson<any>(endpoint("details", { url: safeCinemaUrl(url) }), { ttlMs: 180_000 })));
}

export async function getCinemaSeasons(url: string): Promise<CinemaLink[]> {
  return parseCinemaLinks(checked(await getJson<any>(endpoint("seasons", { url: safeCinemaUrl(url) }), { ttlMs: 180_000 })));
}

export async function getCinemaEpisodes(url: string, season: number): Promise<CinemaLink[]> {
  return parseCinemaLinks(checked(await getJson<any>(endpoint("episodes", { url: safeCinemaUrl(url), season: Math.max(1, season) }), { ttlMs: 120_000 })));
}

export async function getCinemaEpisode(url: string): Promise<CinemaDetails> {
  return parseCinemaDetails(checked(await getJson<any>(endpoint("episode", { url: safeCinemaUrl(url) }), { ttlMs: 120_000 })));
}

export async function getCinemaServers(url: string): Promise<CinemaServer[]> {
  const data = checked<any>(await getJson<any>(endpoint("servers", { url: safeCinemaUrl(url) }), { ttlMs: 30_000 }));
  return parseCinemaServers(data);
}

export async function getCinemaWatchSource(url: string, server: string): Promise<CinemaWatchSource> {
  if (!("0,1,2,5,7,8".split(",") as string[]).includes(server)) throw new Error("خادم المشاهدة غير مسموح.");
  let response: any;
  try {
    response = await getJson<any>(endpoint("watch", { url: safeCinemaUrl(url), server }), { ttlMs: 0, retries: 0 });
  } catch (error) {
    if (error instanceof HttpError) throw new Error(`خادم المشاهدة غير متاح حالياً (HTTP ${error.status})؛ اختر خادماً آخر.`);
    throw error;
  }
  const data = checked<any>(response);
  return parseCinemaWatchSource(data);
}
