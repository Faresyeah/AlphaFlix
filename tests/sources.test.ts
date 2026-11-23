import { describe, expect, it } from "vitest";

import { parseBookDetails, parseBookItem } from "../features/books/parse";
import { htmlToParagraphs, parseNovelChapter, parseNovelItem } from "../features/novels/parse";
import { parseServers, pixeldrainDirectUrl } from "../features/anime/parse";
import { parseSwatDetails, parseSwatItem, parseSwatPages } from "../lib/core/swat";

describe("swat (manga/manhwa)", () => {
  it("parses search items and keeps chapters newest-first", () => {
    const item = parseSwatItem({ id: 1702270, title: "Solo Leveling: Ragnarok", type: "مانهوا كوري", status: "مستمر", rating: "0.0", poster: "https://x/p.webp" }, "manhwa");
    expect(item).toMatchObject({ id: "1702270", kind: "manhwa", type: "مانهوا كوري" });
    const details = parseSwatDetails({ title: "S", chapters_count: 2, chapters: [{ id: 2, chapter: "2", title: "b" }, { id: 1, chapter: "1", title: "a" }] }, "manhwa", "9");
    expect(details.id).toBe("9");
    expect(details.chapters.map((c) => c.id)).toEqual(["2", "1"]);
  });
  it("parses chapter images", () => {
    expect(parseSwatPages({ series: "s", chapter: "1", title: "t", images: ["a", "b", 3] }).images).toEqual(["a", "b"]);
  });
});

describe("books", () => {
  it("cleans titles and ignores placeholder covers", () => {
    const b = parseBookItem({ url: "https://x/b/1", title: "كتاب لغة الجسد", poster: "https://x/nocover.jpg", pages: "?", author: "غير معروف" });
    expect(b.title).toBe("لغة الجسد");
    expect(b.poster).toBeNull();
    expect(b.count).toBe("");
  });
  it("exposes download/read urls", () => {
    const d = parseBookDetails({ book: { title: "أرض زيكولا", downloadUrl: "https://x/dl", sourceUrl: "https://x/b/1", related: [] } }, "https://x/b/1");
    expect(d.downloadUrl).toBe("https://x/dl");
  });
});

describe("novels", () => {
  it("converts chapter html to paragraphs", () => {
    expect(htmlToParagraphs("<p>a &amp; b</p><p>\nc</p>")).toEqual(["a & b", "c"]);
    const c = parseNovelChapter({ chapter: { id: 1, chapterNumber: 1, content: "<p>x</p>", novel: { id: 5, arabicTitle: "ن" } }, nextChapter: { id: 2, chapterNumber: 2, title: "2" } });
    expect(c.next?.id).toBe("2");
    expect(c.novelId).toBe("5");
  });
  it("resolves relative cover urls", () => {
    expect(parseNovelItem({ id: 1, arabicTitle: "ن", coverImage: { url: "/uploads/a.jpg" } }).poster).toBe("https://adminx.sunovels.com/uploads/a.jpg");
  });
});

describe("anime", () => {
  it("uses pixeldrain only and builds the direct url", () => {
    const servers = parseServers({ servers: [{ host: "mediafire.com", supported: true, fileId: "m" }, { host: "pixeldrain.com", supported: true, fileId: "abc", quality: "720p" }] });
    expect(servers).toHaveLength(1);
    expect(pixeldrainDirectUrl(servers[0])).toBe("https://pixeldrain.com/api/file/abc?download");
  });
});
