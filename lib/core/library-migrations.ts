const SECTION_PREFIX = /^(anime|manga|manhwa|books|novels|cinema):/;

/** Older releases stored anime progress and resume values under the raw ID. */
export function migrateLegacyAnimeKeys<T>(map: Record<string, T>): Record<string, T> {
  const migrated: Record<string, T> = {};
  for (const [key, value] of Object.entries(map)) {
    const namespacedKey = SECTION_PREFIX.test(key) ? key : `anime:${key}`;
    migrated[namespacedKey] = value;
  }
  return migrated;
}
