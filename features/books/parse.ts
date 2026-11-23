import { asNumber, asString, type MediaItem } from "../../lib/core/types";

export type BookDetails = MediaItem & {
  author: string;
  size: string;
  pages: string;
  language: string;
  fileType: string;
  reads: string;
  readingTime: string;
  downloadUrl: string | null;
  downloadPage: string | null;
  readUrl: string | null;
  related: MediaItem[];
};

function cleanTitle(title: string): string {
  return title.replace(/^\s*(كتاب|رواية)\s+/, "").trim() || title;
}

function validPoster(url: unknown): string | null {
  const s = asString(url);
  return s && !/nocover/i.test(s) ? s : null;
}

export function parseBookItem(raw: any): MediaItem {
  const pages = asString(raw?.pages).trim();
  return {
    id: asString(raw?.url ?? raw?.sourceUrl),
    kind: "books",
    title: cleanTitle(asString(raw?.title, "بدون عنوان")),
    poster: validPoster(raw?.poster),
    type: asString(raw?.type, "كتاب"),
    tags: [],
    rating: asNumber(raw?.rating),
    status: "",
    year: "",
    count: pages && pages !== "?" ? pages : "",
    story: raw?.excerpt ? asString(raw.excerpt) : raw?.story ? asString(raw.story) : undefined,
    author: asString(raw?.author) && asString(raw?.author) !== "غير معروف" ? asString(raw.author) : undefined,
  };
}

export function parseBookList(list: unknown): MediaItem[] {
  return Array.isArray(list) ? list.map(parseBookItem).filter((b) => b.id) : [];
}

export function parseBookDetails(data: any, requestedUrl: string): BookDetails {
  const book = data?.book ?? {};
  const item = parseBookItem({ ...book, url: book?.sourceUrl ?? requestedUrl });
  const urlOrNull = (v: unknown) => (asString(v) ? asString(v) : null);
  return {
    ...item,
    id: requestedUrl,
    author: asString(book?.author, "غير معروف"),
    story: item.story || "لا يوجد وصف متاح لهذا الكتاب.",
    size: asString(book?.size).replace(/\s+/g, " ").trim(),
    pages: asString(book?.pages),
    language: asString(book?.language),
    fileType: asString(book?.fileType),
    reads: asString(book?.reads),
    readingTime: asString(book?.readingTime),
    downloadUrl: urlOrNull(book?.downloadUrl),
    downloadPage: urlOrNull(book?.downloadPage),
    readUrl: urlOrNull(book?.readUrl),
    related: parseBookList(book?.related),
  };
}
