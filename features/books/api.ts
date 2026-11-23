import { readCache, writeCache } from "../../lib/core/cache";
import { getJson } from "../../lib/core/http";
import type { SectionService, Shelf } from "../../lib/core/types";
import { parseBookDetails, parseBookList, type BookDetails } from "./parse";

export const BOOKS_API = "https://x-api.spcfy.eu/api/alarabimag";
const CACHE_KEY = "damenotaku:books:home:v2";

export const booksService: SectionService = {
  kind: "books",
  searchPlaceholder: "ابحث عن كتاب أو رواية...",
  getCachedHome: () => readCache<Shelf[]>(CACHE_KEY),
  async getHome() {
    const data = await getJson<any>(`${BOOKS_API}/home`, { ttlMs: 120_000 });
    const shelves: Shelf[] = [
      { key: "popular", title: "الأكثر قراءة", items: parseBookList(data?.popular) },
      { key: "week", title: "مختارات الأسبوع", items: parseBookList(data?.week) },
    ].filter((s) => s.items.length);
    if (shelves.length) void writeCache(CACHE_KEY, shelves);
    return shelves;
  },
  async search(query) {
    const data = await getJson<any>(`${BOOKS_API}/search?q=${encodeURIComponent(query.trim())}`, { ttlMs: 120_000 });
    return parseBookList(data?.results);
  },
};

export async function getBookDetails(bookUrl: string): Promise<BookDetails> {
  const data = await getJson<any>(`${BOOKS_API}/details?url=${encodeURIComponent(bookUrl)}`, { ttlMs: 300_000 });
  if (!data?.book) throw new Error("BOOK_NOT_FOUND");
  return parseBookDetails(data, bookUrl);
}

export type { BookDetails };
