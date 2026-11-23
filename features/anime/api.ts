import { readCache, writeCache } from "../../lib/core/cache";
import { getJson } from "../../lib/core/http";
import type { MediaItem, SectionService, Shelf } from "../../lib/core/types";
import { parseAnimeItem, parseAnimeList, parseEpisodes, parseServers, type Episode, type ServerOption } from "./parse";

export const ANIME_API = "https://x-api.spcfy.eu/api/anime/witcher";
const CACHE_KEY = "damenotaku:anime:home:v2";

export type AnimeDetails = MediaItem & { englishTitle?: string; malScore?: number; story: string };

function toShelves(data: any): Shelf[] {
  return [
    { key: "popular", title: "الأكثر شعبية", items: parseAnimeList(data, "popular") },
    { key: "topRated", title: "الأعلى تقييماً", items: parseAnimeList(data, "topRated") },
  ].filter((s) => s.items.length);
}

export const animeService: SectionService = {
  kind: "anime",
  searchPlaceholder: "ابحث عن أنمي...",
  getCachedHome: () => readCache<Shelf[]>(CACHE_KEY),
  async getHome() {
    const shelves = toShelves(await getJson<any>(`${ANIME_API}/home`, { ttlMs: 60_000 }));
    if (shelves.length) void writeCache(CACHE_KEY, shelves);
    return shelves;
  },
  async search(query) {
    const data = await getJson<any>(`${ANIME_API}?q=${encodeURIComponent(query.trim())}`, { ttlMs: 120_000 });
    return parseAnimeList(data, "results");
  },
};

export async function getAnimeDetails(query: string): Promise<AnimeDetails> {
  const data = await getJson<any>(`${ANIME_API}/details?q=${encodeURIComponent(query)}`, { ttlMs: 300_000 });
  const raw = data?.anime ?? {};
  const item = parseAnimeItem({ ...raw, id: raw?.id ?? query });
  return {
    ...item,
    id: query,
    title: typeof raw?.title === "string" && raw.title ? raw.title : item.title,
    englishTitle: typeof raw?.englishTitle === "string" ? raw.englishTitle : undefined,
    malScore: typeof raw?.malScore === "number" ? raw.malScore : undefined,
    story: typeof raw?.story === "string" && raw.story ? raw.story : "لا يوجد وصف متاح لهذا العمل.",
  };
}

export async function getAnimeEpisodes(query: string): Promise<Episode[]> {
  return parseEpisodes(await getJson<any>(`${ANIME_API}/episodes?q=${encodeURIComponent(query)}`, { ttlMs: 300_000 }));
}

export async function getAnimeServers(query: string, episode: string): Promise<ServerOption[]> {
  return parseServers(await getJson<any>(`${ANIME_API}/servers?q=${encodeURIComponent(query)}&ep=${encodeURIComponent(episode)}`));
}

export type { Episode, ServerOption };
export { pixeldrainDirectUrl } from "./parse";
