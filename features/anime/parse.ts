import type { MediaItem } from "../../lib/core/types";

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function ratingValue(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value && typeof value === "object" && "rate" in value) {
    const rate = (value as { rate?: unknown }).rate;
    return typeof rate === "number" && Number.isFinite(rate) ? rate : 0;
  }
  const n = parseFloat(str(value));
  return Number.isFinite(n) ? n : 0;
}

export function parseAnimeItem(raw: any): MediaItem {
  const details = raw?.details ?? {};
  const studio = raw?.studio ?? details?.studio;
  return {
    id: str(raw?.id ?? raw?.path ?? raw?.name),
    kind: "anime",
    title: str(raw?.name ?? raw?.title ?? raw?.id, "بدون عنوان"),
    poster: raw?.poster ? str(raw.poster) : null,
    type: str(raw?.type, "أنمي"),
    tags: Array.isArray(raw?.tags) ? raw.tags.map((t: unknown) => str(t)).filter(Boolean) : [],
    rating: ratingValue(raw?.rating ?? raw?.score),
    status: str(raw?.status ?? details?.status ?? details?.state, ""),
    year: str(raw?.year ?? details?.year),
    count: str(raw?.episodesCount ?? details?.eps_num),
    story: str(raw?.story),
    author: Array.isArray(studio) ? studio.map((s: unknown) => str(s)).filter(Boolean).join("، ") : undefined,
    dubbed: Boolean(raw?.dubbed),
  };
}

export function parseAnimeList(data: any, key: string): MediaItem[] {
  const list = data?.[key];
  return Array.isArray(list) ? list.map(parseAnimeItem).filter((i) => i.id) : [];
}

export type Episode = { id: string; name: string };

export function parseEpisodes(data: any): Episode[] {
  return Array.isArray(data?.episodes)
    ? data.episodes.map((e: any) => ({ id: str(e?.id), name: str(e?.name, `الحلقة ${e?.id ?? ""}`) })).filter((e: Episode) => e.id)
    : [];
}

export type ServerOption = {
  name: string;
  quality: string;
  host: string;
  supported: boolean;
  fileId: string | null;
  link: string;
};

/** يستبعد MediaFire ويُبقي Pixeldrain المدعوم فقط (حسب إعداد المشروع الأصلي). */
export function parseServers(data: any): ServerOption[] {
  if (!Array.isArray(data?.servers)) return [];
  return data.servers
    .filter((s: any) => str(s?.host).toLowerCase().includes("pixeldrain"))
    .map((s: any) => ({
      name: str(s?.name, "Pixeldrain"),
      quality: str(s?.quality, "Auto"),
      host: str(s?.host),
      supported: Boolean(s?.supported),
      fileId: s?.fileId ? str(s.fileId) : null,
      link: str(s?.link),
    }))
    .filter((s: ServerOption) => s.supported && Boolean(s.fileId || s.link));
}

export function pixeldrainDirectUrl(server: ServerOption): string | null {
  if (server.host.toLowerCase().includes("mediafire")) return null;
  if (server.fileId) return `https://pixeldrain.com/api/file/${encodeURIComponent(server.fileId)}?download`;
  const match = server.link.match(/pixeldrain\.com\/(?:u|l|api\/file)\/([^/?#]+)/i);
  return match?.[1] ? `https://pixeldrain.com/api/file/${encodeURIComponent(match[1])}?download` : null;
}
