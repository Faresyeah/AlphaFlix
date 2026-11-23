import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
  favorites: "damenotaku:library:favorites",
  watchLater: "damenotaku:library:watch-later",
  categories: "damenotaku:library:categories",
  progress: "damenotaku:library:progress",
  progressItems: "damenotaku:library:progress-items",
  downloads: "damenotaku:library:downloads",
  resume: "damenotaku:library:resume",
  lastSection: "damenotaku:ui:last-section",
  whatsappNotice: "damenotaku:whatsapp-notice-v1",
  theme: "damenotaku:ui:theme",
} as const;

export async function readStored<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeStored<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
