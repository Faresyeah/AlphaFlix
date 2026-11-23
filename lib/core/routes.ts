import type { MediaItem, SectionKind } from "./types";

/** مسار صفحة التفاصيل لكل قسم (كل قسم له مسارات مستقلة). */
export function detailsRoute(kind: SectionKind, id: string): string {
  return `/${kind}/${encodeURIComponent(id)}`;
}

export function itemRoute(item: Pick<MediaItem, "kind" | "id"> & Partial<Pick<MediaItem, "type">>): string {
  if (item.kind === "cinema") {
    const path = item.type === "حلقة" ? "/cinema/episode" : "/cinema/details";
    return `${path}?url=${encodeURIComponent(item.id)}`;
  }
  return detailsRoute(item.kind, item.id);
}
