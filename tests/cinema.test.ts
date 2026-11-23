import { describe, expect, it } from "vitest";

import { cinemaServerContentType, parseCinemaHome, parseCinemaPage, parseCinemaServers, parseCinemaWatchSource, safeCinemaUrl } from "../features/cinema/parse";
import { itemRoute } from "../lib/core/routes";

describe("Cinema API parsing", () => {
  it("groups one-episode homepage sections into a single latest-episodes shelf", () => {
    const shelves = parseCinemaHome({ result: { sections: [
      { title: "حلقة 2", items: [{ title: "حلقة 2", url: "https://topcinemaa.one/e/2", type: "episode" }] },
      { title: "حلقة 1", items: [{ title: "حلقة 1", url: "https://topcinemaa.one/e/1", type: "episode" }] },
    ] } });
    expect(shelves).toHaveLength(1);
    expect(shelves[0].title).toBe("أحدث الحلقات");
    expect(shelves[0].items.map((item) => item.type)).toEqual(["حلقة", "حلقة"]);
  });

  it("preserves API pagination and accepts a filter response with no filter fields", () => {
    const page = parseCinemaPage({ status: true, pagination: { current: 2, last: 69 }, result: [{ title: "Madden 2026", url: "https://topcinemaa.one/madden/", type: "movie" }] });
    expect(page).toMatchObject({ current: 2, last: 69 });
    expect(page.items[0]).toMatchObject({ kind: "cinema", type: "فيلم", year: "2026" });
    const emptyFilters = { status: true, filters: {}, result: [] };
    expect(parseCinemaPage(emptyFilters)).toMatchObject({ current: 1, last: 1, items: [] });
  });

  it("allows only the six clean server IDs even if the API returns all nine", () => {
    const servers = parseCinemaServers({ result: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((server) => ({ server: String(server), label: `server-${server}` })) });
    expect(servers.map((server) => server.id)).toEqual(["0", "1", "2", "5", "7", "8"]);
    expect(servers.map((server) => server.name)).toEqual(["server-0", "server-1", "server-2", "server-5", "server-7", "server-8"]);
    expect(servers.map((server) => cinemaServerContentType(server.id))).toEqual(["hls", "hls", undefined, "hls", undefined, "hls"]);
  });

  it("accepts only TopCinema content URLs and API playback URLs", () => {
    expect(safeCinemaUrl("https://topcinemaa.one/movies/")).toContain("topcinemaa.one");
    expect(() => safeCinemaUrl("https://example.com/movie")).toThrow();
    expect(() => safeCinemaUrl("http://topcinemaa.one/movie")).toThrow();
    expect(parseCinemaWatchSource({ result: { name: "VideoTube", url: "https://x-api.spcfy.eu/api/vidtube/hls?url=x" } }).name).toBe("VideoTube");
    expect(() => parseCinemaWatchSource({ result: { url: "https://example.com/video.m3u8" } })).toThrow();
  });

  it("routes saved cinema episodes back to episode details", () => {
    expect(itemRoute({ kind: "cinema", id: "https://topcinemaa.one/e/1", type: "حلقة" })).toBe("/cinema/episode?url=https%3A%2F%2Ftopcinemaa.one%2Fe%2F1");
    expect(itemRoute({ kind: "cinema", id: "https://topcinemaa.one/m/1", type: "فيلم" })).toContain("/cinema/details?url=");
  });
});
