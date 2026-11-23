import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { itemKey, type MediaItem } from "@/lib/core/types";
import { migrateLegacyAnimeKeys } from "@/lib/core/library-migrations";
import { readStored, STORAGE_KEYS, writeStored } from "@/lib/storage";

type ItemMap = Record<string, MediaItem>;

export type DownloadEntry = {
  id: string;
  title: string;
  episode: string;
  quality: string;
  url: string;
  localUri?: string;
  createdAt: number;
};

type LibraryContextValue = {
  ready: boolean;
  favorites: ItemMap;
  watchLater: ItemMap;
  categories: Record<string, string>;
  /** تقدم 0..1 لكل عمل، بمفتاح `${kind}:${id}`. */
  progress: Record<string, number>;
  progressItems: ItemMap;
  /** موضع الاستئناف (رقم صفحة PDF، معرّف فصل ...) بمفتاح `${kind}:${id}`. */
  resume: Record<string, string>;
  downloads: DownloadEntry[];
  toggleFavorite: (item: MediaItem) => Promise<void>;
  toggleWatchLater: (item: MediaItem) => Promise<void>;
  setCategory: (key: string, category: string) => Promise<void>;
  saveProgress: (key: string, value: number, item?: MediaItem) => Promise<void>;
  saveResume: (key: string, value: string) => Promise<void>;
  addDownload: (entry: DownloadEntry) => Promise<void>;
  isFavorite: (key: string) => boolean;
  isWatchLater: (key: string) => boolean;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

function migrateItems(map: ItemMap): ItemMap {
  const out: ItemMap = {};
  for (const item of Object.values(map)) {
    if (!item || typeof item !== "object") continue;
    const kind = (["anime", "manga", "manhwa", "books", "novels", "cinema"] as const).find((k) => k === item.kind) ?? "anime";
    out[itemKey(kind, item.id)] = { ...item, kind, count: (item as any).count ?? (item as any).episodes ?? "" };
  }
  return out;
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<ItemMap>({});
  const [watchLater, setWatchLater] = useState<ItemMap>({});
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [progressItems, setProgressItems] = useState<ItemMap>({});
  const [resume, setResume] = useState<Record<string, string>>({});
  const [downloads, setDownloads] = useState<DownloadEntry[]>([]);
  const [ready, setReady] = useState(false);
  const latest = useRef({ progress, resume });
  useLayoutEffect(() => { latest.current = { progress, resume }; }, [progress, resume]);

  useEffect(() => {
    let active = true;
    Promise.all([
      readStored<ItemMap>(STORAGE_KEYS.favorites, {}),
      readStored<ItemMap>(STORAGE_KEYS.watchLater, {}),
      readStored<Record<string, string>>(STORAGE_KEYS.categories, {}),
      readStored<Record<string, number>>(STORAGE_KEYS.progress, {}),
      readStored<ItemMap>(STORAGE_KEYS.progressItems, {}),
      readStored<Record<string, string>>(STORAGE_KEYS.resume, {}),
      readStored<DownloadEntry[]>(STORAGE_KEYS.downloads, []),
    ]).then(([f, w, c, p, pi, r, d]) => {
      if (!active) return;
      setFavorites(migrateItems(f));
      setWatchLater(migrateItems(w));
      setCategories(migrateLegacyAnimeKeys(c));
      setProgress(migrateLegacyAnimeKeys(p));
      setProgressItems(migrateItems(pi));
      setResume(migrateLegacyAnimeKeys(r));
      setDownloads(d);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const toggleIn = useCallback((setter: typeof setFavorites, storageKey: string, item: MediaItem) => {
    const key = itemKey(item.kind, item.id);
    setter((current) => {
      const next = { ...current };
      if (next[key]) delete next[key];
      else next[key] = item;
      void writeStored(storageKey, next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(async (item: MediaItem) => toggleIn(setFavorites, STORAGE_KEYS.favorites, item), [toggleIn]);
  const toggleWatchLater = useCallback(async (item: MediaItem) => toggleIn(setWatchLater, STORAGE_KEYS.watchLater, item), [toggleIn]);

  const setCategory = useCallback(async (key: string, category: string) => {
    setCategories((current) => {
      const next = { ...current, [key]: category };
      if (!category) delete next[key];
      void writeStored(STORAGE_KEYS.categories, next);
      return next;
    });
  }, []);

  const saveProgress = useCallback(async (key: string, value: number, item?: MediaItem) => {
    const clamped = Math.max(0, Math.min(1, value));
    if (latest.current.progress[key] !== clamped) {
    setProgress((current) => {
      const next = { ...current, [key]: clamped };
      void writeStored(STORAGE_KEYS.progress, next);
      return next;
    });
    }
    if (item) {
      setProgressItems((current) => {
        if (current[key] === item) return current;
        const next = { ...current, [key]: item };
        void writeStored(STORAGE_KEYS.progressItems, next);
        return next;
      });
    }
  }, []);

  const saveResume = useCallback(async (key: string, value: string) => {
    if (latest.current.resume[key] === value) return;
    setResume((current) => {
      const next = { ...current, [key]: value };
      void writeStored(STORAGE_KEYS.resume, next);
      return next;
    });
  }, []);

  const addDownload = useCallback(async (entry: DownloadEntry) => {
    setDownloads((current) => {
      const next = [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, 80);
      void writeStored(STORAGE_KEYS.downloads, next);
      return next;
    });
  }, []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      ready,
      favorites,
      watchLater,
      categories,
      progress,
      progressItems,
      resume,
      downloads,
      toggleFavorite,
      toggleWatchLater,
      setCategory,
      saveProgress,
      saveResume,
      addDownload,
      isFavorite: (key) => Boolean(favorites[key]),
      isWatchLater: (key) => Boolean(watchLater[key]),
    }),
    [ready, favorites, watchLater, categories, progress, progressItems, resume, downloads, toggleFavorite, toggleWatchLater, setCategory, saveProgress, saveResume, addDownload],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary must be used inside LibraryProvider");
  return value;
}
