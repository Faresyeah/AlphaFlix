import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { ContentCard } from "@/components/content-card";
import { NetflixHeader } from "@/components/netflix-header";
import { PreviewModal } from "@/components/preview-modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/section-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BRAND } from "@/constants/brand";
import { DESIGN } from "@/constants/design";
import { SchemeColors } from "@/constants/theme";
import { itemRoute } from "@/lib/core/routes";
import { itemKey, type MediaItem, type SectionService, type Shelf } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";
import { useLocale } from "@/lib/locale-context";
import { useThemeContext } from "@/lib/theme-provider";

export function SectionHome({ service, topContent }: { service: SectionService; topContent?: ReactNode }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { progress } = useLibrary();
  const { copy } = useLocale();
  const { colorScheme } = useThemeContext();
  const [shelves, setShelves] = useState<Shelf[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchSeq = useRef(0);
  const fade = useMemo(() => new Animated.Value(1), []);
  const cardWidth = width >= 700 ? 160 : width >= 400 ? 128 : 112;

  const load = useCallback(async () => {
    setError(false);
    const cached = await service.getCachedHome();
    if (cached?.length) {
      setShelves(cached);
      setLoading(false);
    } else setLoading(true);
    try {
      setShelves(await service.getHome());
    } catch {
      if (!cached?.length) setError(true);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const runSearch = useCallback(
    async (text: string) => {
      const seq = ++searchSeq.current;
      setSearching(true);
      setSearchError(false);
      try {
        const found = await service.search(text);
        if (seq === searchSeq.current) setResults(found);
      } catch {
        if (seq === searchSeq.current) {
          setResults([]);
          setSearchError(true);
        }
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    },
    [service],
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      searchSeq.current += 1;
      const timer = setTimeout(() => { setResults(null); setSearching(false); }, 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => void runSearch(trimmed), 350);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const open = useCallback((item: MediaItem) => router.push(itemRoute(item) as never), [router]);
  const showingSearch = searchOpen && query.trim().length > 0;

  const heroes = useMemo(() => {
    const list: MediaItem[] = [];
    const seen = new Set<string>();
    for (const shelf of shelves || []) {
      for (const item of shelf.items) {
        const key = `${item.kind}:${item.id}`;
        if (!item.poster || seen.has(key)) continue;
        seen.add(key);
        list.push(item);
        if (list.length >= 12) return list;
      }
    }
    return list;
  }, [shelves]);

  const top10 = useMemo(() => {
    const pool = [...(shelves?.[0]?.items || []), ...(shelves?.[1]?.items || [])];
    return pool.filter((i) => i.poster).slice(0, 10);
  }, [shelves]);

  useEffect(() => {
    if (heroes.length < 2 || showingSearch) return;
    const id = setInterval(() => {
      Animated.sequence([
        Animated.timing(fade, { toValue: 0.15, duration: 250, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setHeroIndex((i) => (i + 1) % heroes.length);
    }, 3000);
    return () => clearInterval(id);
  }, [fade, heroes.length, showingSearch]);

  const hero = heroes.length ? heroes[heroIndex % heroes.length] : undefined;

  const shelfTitle = (key: string, title: string) => {
    if (/popular|شعب/i.test(key + title)) return copy.popular;
    if (/top|أعلى|rated/i.test(key + title)) return copy.topRated;
    if (/update|جديد|last/i.test(key + title)) return "جديد هذا الأسبوع";
    return title;
  };

  return (
    <View style={{ flex: 1, backgroundColor: SchemeColors[colorScheme].background }}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Hero + transparent header */}
        {!searchOpen && hero ? (
          <View>
            <Animated.View style={{ opacity: fade }}>
              <Pressable onPress={() => open(hero)} onLongPress={() => setPreview(hero)}>
                <ImageBackground source={{ uri: hero.poster || undefined }} style={{ width, height: Math.min(width * 1.15, 520), justifyContent: "flex-end" }}>
                  <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.28)" }} />
                  <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 170, backgroundColor: "rgba(5,5,5,0.94)" }} />
                  <NetflixHeader transparent onSearch={() => setSearchOpen(true)} />
                  <View style={{ paddingHorizontal: 18, paddingBottom: 24, paddingTop: 48 }}>
                    <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900" }} numberOfLines={2}>
                      {hero.title}
                    </Text>
                    {hero.story ? (
                      <Text style={{ color: "#bbb", marginTop: 8, fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
                        {hero.story}
                      </Text>
                    ) : (
                      <Text style={{ color: "#aaa", marginTop: 6, fontSize: 12 }}>{[hero.type, hero.year].filter(Boolean).join(" · ")}</Text>
                    )}
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                      <Pressable
                        onPress={() => open(hero)}
                        style={{ backgroundColor: "#fff", borderRadius: 6, paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 6 }}
                      >
                        <IconSymbol name="play.fill" size={15} color="#000" />
                        <Text style={{ color: "#000", fontWeight: "800" }}>{copy.watch}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setPreview(hero)}
                        style={{ backgroundColor: "rgba(109,109,110,0.7)", borderRadius: 6, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 6 }}
                      >
                        <IconSymbol name="plus" size={15} color="#fff" />
                        <Text style={{ color: "#fff", fontWeight: "700" }}>{copy.later}</Text>
                      </Pressable>
                    </View>
                    <View style={{ flexDirection: "row", gap: 5, marginTop: 14 }}>
                      {heroes.slice(0, 8).map((_, i) => (
                        <View
                          key={i}
                          style={{
                            width: i === heroIndex % Math.min(heroes.length, 8) ? 18 : 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: i === heroIndex % Math.min(heroes.length, 8) ? BRAND.signature : "#555",
                          }}
                        />
                      ))}
                    </View>
                  </View>
                </ImageBackground>
              </Pressable>
            </Animated.View>
          </View>
        ) : (
          <View style={{ paddingTop: 8 }}>
            <NetflixHeader onSearch={() => setSearchOpen(true)} />
          </View>
        )}

        {topContent}

        {/* Full search panel */}
        {searchOpen ? (
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <View
              style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 48 }}
            >
              <IconSymbol name="magnifyingglass" size={18} color={DESIGN.colors.primary} />
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder={service.searchPlaceholder}
                placeholderTextColor={DESIGN.colors.textMuted}
                style={{ flex: 1, color: "#fff", paddingHorizontal: 10, fontSize: 15 }}
                returnKeyType="search"
              />
              {searching ? <ActivityIndicator color={DESIGN.colors.primary} size="small" /> : null}
              <Pressable
                onPress={() => {
                  setSearchOpen(false);
                  setQuery("");
                  setResults(null);
                }}
                hitSlop={10}
              >
                <Text style={{ color: "#aaa", fontWeight: "700" }}>إغلاق</Text>
              </Pressable>
            </View>
            <View style={{ marginTop: 14 }}>
              {!query.trim() ? (
                <Text style={{ color: "#888", textAlign: "center", marginTop: 20 }}>ابحث عن عنوان…</Text>
              ) : results === null || searching ? (
                <LoadingState label="نبحث لك..." />
              ) : searchError ? (
                <ErrorState onRetry={() => void runSearch(query.trim())} />
              ) : results.length ? (
                <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                  {results.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      width={cardWidth}
                      progress={progress[itemKey(item.kind, item.id)] ?? 0}
                      onPress={() => open(item)}
                      onLongPress={() => setPreview(item)}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState title="لا توجد نتائج" body="جرّب اسماً آخر." />
              )}
            </View>
          </View>
        ) : loading && !shelves ? (
          <LoadingState label="نجهز لك المحتوى..." />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : shelves && shelves.length ? (
          <View style={{ marginTop: 8 }}>
            {/* TOP 10 */}
            {top10.length >= 3 ? (
              <View style={{ marginBottom: 22 }}>
                <View style={{ paddingHorizontal: 16, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Top 10</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}>
                  {top10.map((item, idx) => (
                    <ContentCard
                      key={`top-${item.id}`}
                      item={item}
                      width={cardWidth}
                      rank={idx + 1}
                      progress={progress[itemKey(item.kind, item.id)] ?? 0}
                      onPress={() => open(item)}
                      onLongPress={() => setPreview(item)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {shelves.map((shelf) => (
              <View key={shelf.key} style={{ marginBottom: 22 }}>
                <View style={{ paddingHorizontal: 16, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>{shelfTitle(shelf.key, shelf.title)}</Text>
                  <Text style={{ color: "#888", fontSize: 12, fontWeight: "700" }}>عرض الكل</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
                  {shelf.items.slice(0, 20).map((item) => (
                    <ContentCard
                      key={`${shelf.key}-${item.id}`}
                      item={item}
                      width={cardWidth}
                      progress={progress[itemKey(item.kind, item.id)] ?? 0}
                      onPress={() => open(item)}
                      onLongPress={() => setPreview(item)}
                    />
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title="لا يوجد محتوى" body="جرّب البحث أو أعد المحاولة." action="إعادة المحاولة" onAction={load} />
        )}
      </ScrollView>

      <PreviewModal
        item={preview}
        visible={Boolean(preview)}
        onClose={() => setPreview(null)}
        onOpen={() => {
          if (preview) open(preview);
          setPreview(null);
        }}
      />
    </View>
  );
}
