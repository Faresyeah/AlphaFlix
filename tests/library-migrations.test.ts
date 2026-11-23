import { describe, expect, it } from "vitest";

import { migrateLegacyAnimeKeys } from "../lib/core/library-migrations";

describe("library key migration", () => {
  it("adds the anime namespace to legacy raw-ID keys", () => {
    expect(migrateLegacyAnimeKeys({ naruto: 0.45, onePiece: 0.2 })).toEqual({
      "anime:naruto": 0.45,
      "anime:onePiece": 0.2,
    });
  });

  it("preserves keys that are already namespaced, including other sections", () => {
    expect(migrateLegacyAnimeKeys({ "cinema:movie/1": 0.7, "manga:series/2": 0.3 })).toEqual({
      "cinema:movie/1": 0.7,
      "manga:series/2": 0.3,
    });
  });
});
