import { createSwatService } from "../../lib/core/swat";

/** المانغا: أعمال يابانية. */
const manga = createSwatService({
  kind: "manga",
  accepts: (type) => /ياباني|مانجا|مانغا/.test(type),
  seeds: ["one", "naruto", "hunter", "blue", "attack", "the"],
  searchPlaceholder: "ابحث عن مانغا...",
  homeTitle: "اكتشف المانغا",
});

export const mangaService = manga.service;
export const getMangaDetails = manga.getDetails;
export const getMangaChapter = manga.getChapter;
