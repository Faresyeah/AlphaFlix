import { createSwatService } from "../../lib/core/swat";

/** المانهوا: أعمال كورية/صينية بالتمرير العمودي. */
const manhwa = createSwatService({
  kind: "manhwa",
  accepts: (type) => /كوري|صيني|مانهوا|مانها/.test(type),
  seeds: ["solo", "the", "dungeon", "return", "system"],
  searchPlaceholder: "ابحث عن مانهوا...",
  homeTitle: "اكتشف المانهوا",
});

export const manhwaService = manhwa.service;
export const getManhwaDetails = manhwa.getDetails;
export const getManhwaChapter = manhwa.getChapter;
