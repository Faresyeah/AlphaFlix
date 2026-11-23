import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ContentCard } from "@/components/content-card";
import { NetflixHeader } from "@/components/netflix-header";
import { PreviewModal } from "@/components/preview-modal";
import { EmptyState, ErrorState, LoadingState, SectionTitle } from "@/components/section-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BRAND } from "@/constants/brand";
import { DESIGN } from "@/constants/design";
import { SchemeColors } from "@/constants/theme";
import { useLocale } from "@/lib/locale-context";
import { useThemeContext } from "@/lib/theme-provider";
import { getCinemaCategories, getCinemaHome, getCinemaCatalog, searchCinema } from "./api";
import type { MediaItem, Shelf } from "@/lib/core/types";
import type { CinemaLink } from "./parse";

export default function CinemaHomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { copy, language } = useLocale();
  const { colorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [categories, setCategories] = useState<CinemaLink[]>([]);
  const [heroes, setHeroes] = useState<MediaItem[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchItems, setSearchItems] = useState<MediaItem[]>([]);
  const [searchType, setSearchType] = useState<"movie" | "series">("movie");
  const fade = useMemo(() => new Animated.Value(1), []);

  const cardW = Math.floor((Math.min(width, 900) - 40 - 24) / (width >= 700 ? 5 : 3.2));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [{ shelves: s }, cats, movies] = await Promise.all([
        getCinemaHome(),
        getCinemaCategories().catch(() => []),
        getCinemaCatalog("movies", 1).catch(() => ({ items: [] as MediaItem[] })),
      ]);
      setShelves(s);
      setCategories(cats);
      const pool: MediaItem[] = [];
      for (const sh of s) {
        for (const it of sh.items.slice(0, 6)) {
          if (it?.poster && it?.id) pool.push(it);
        }
      }
      for (const it of movies.items || []) {
        if (it?.poster && it?.id) pool.push(it);
      }
      // unique by the source URL stored in MediaItem.id
      const seen = new Set<string>();
      const unique = pool.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      setHeroes(unique.slice(0, 12));
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحميل السينما");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  // rotate hero every 3s
  useEffect(() => {
    if (heroes.length < 2) return;
    const id = setInterval(() => {
      Animated.sequence([
        Animated.timing(fade, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
      setHeroIndex((i) => (i + 1) % heroes.length);
    }, 3000);
    return () => clearInterval(id);
  }, [fade, heroes.length]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      const timer = setTimeout(() => { setSearchItems([]); setSearching(false); }, 0);
      return () => clearTimeout(timer);
    }
    let active = true;
    setSearching(true);
    const t = setTimeout(() => {
      void searchCinema(q, searchType)
        .then((page) => { if (active) setSearchItems(page.items || []); })
        .catch(() => { if (active) setSearchItems([]); })
        .finally(() => { if (active) setSearching(false); });
    }, 400);
    return () => { active = false; clearTimeout(t); };
  }, [query, searchType]);

  const hero = heroes[heroIndex];

  const openDetails = (url: string, title?: string) => {
    router.push({ pathname: "/cinema/details", params: { url, title: title || "" } });
  };

  const openItem = (item: MediaItem) => {
    if (item.type === "حلقة") {
      router.push({ pathname: "/cinema/episode", params: { url: item.id } } as never);
      return;
    }
    openDetails(item.id, item.title);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* top bar */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: BRAND.signature, fontSize: 26, fontWeight: "900" }}>{BRAND.name}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => router.push("/cinema/browse")}
              style={{ backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 12 }}>{language === "ar" ? "تصفح" : "Browse"}</Text>
            </Pressable>
          </View>
        </View>

        {/* search */}
        <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={copy.search}
            placeholderTextColor={colors.muted}
            style={{ flex: 1, color: colors.foreground, fontSize: 14, padding: 0 }}
          />
        </View>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <>
            {/* HERO */}
            {hero ? (
              <Animated.View style={{ opacity: fade, marginTop: 14 }}>
                <Pressable onPress={() => openItem(hero)}>
                  <ImageBackground
                    source={{ uri: hero.poster ?? undefined }}
                    style={{ width: width, height: Math.min(width * 1.15, 520), justifyContent: "flex-end" }}
                    imageStyle={{ opacity: 0.85 }}
                  >
                    <View
                      style={{
                        padding: 20,
                        paddingBottom: 28,
                        backgroundColor: "transparent",
                      }}
                    >
                      {/* gradient-like overlays via stacked views */}
                      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 0, backgroundColor: "rgba(0,0,0,0.35)" }} />
                      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 160, backgroundColor: "rgba(5,5,5,0.92)" }} />
                      <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900", textShadowColor: "#000", textShadowRadius: 8 }} numberOfLines={2}>
                        {hero.title}
                      </Text>
                      {hero.story ? (
                        <Text style={{ color: "#ccc", marginTop: 6, fontSize: 13 }} numberOfLines={2}>
                          {hero.story}
                        </Text>
                      ) : null}
                      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                        <Pressable
                          onPress={() => openItem(hero)}
                          style={{ backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 6 }}
                        >
                          <IconSymbol name="play.fill" size={14} color="#000" />
                          <Text style={{ color: "#000", fontWeight: "800" }}>{copy.watch}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => openItem(hero)}
                          style={{ backgroundColor: "rgba(109,109,110,0.7)", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}
                        >
                          <Text style={{ color: "#fff", fontWeight: "700" }}>{copy.details}</Text>
                        </Pressable>
                      </View>
                      {/* dots */}
                      <View style={{ flexDirection: "row", gap: 5, marginTop: 14, justifyContent: "center" }}>
                        {heroes.slice(0, 8).map((_, i) => (
                          <View
                            key={i}
                            style={{
                              width: i === heroIndex % Math.min(heroes.length, 8) ? 16 : 6,
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
            ) : null}

            {/* search results */}
            {query.trim().length >= 2 ? (
              <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
                <SectionTitle title={searching ? "..." : `${copy.search}`} />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10, marginBottom: 10 }}>
                  {[{ value: "movie" as const, label: language === "ar" ? "أفلام" : "Movies" }, { value: "series" as const, label: language === "ar" ? "مسلسلات" : "Series" }].map((option) => (
                    <Pressable key={option.value} onPress={() => setSearchType(option.value)} style={{ backgroundColor: searchType === option.value ? BRAND.signature : colors.surface, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 }}>
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
                  {searchItems.map((it) => (
                    <ContentCard
                      key={it.id}
                      item={it}
                      width={cardW}
                      onPress={() => openDetails(it.id, it.title)}
                    />
                  ))}
                </View>
                {!searching && !searchItems.length ? <EmptyState title={copy.noItems} /> : null}
              </View>
            ) : (
              <>
                {/* categories chips */}
                {categories.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginTop: 16 }}>
                    {categories.slice(0, 20).map((c) => (
                      <Pressable
                        key={c.url || c.title}
                        onPress={() => router.push({ pathname: "/cinema/browse", params: { url: c.url, title: c.title } })}
                        style={{ backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}
                      >
                        <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 12 }}>{c.title}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}

                
            {/* TOP 10 */}
            {heroes.length >= 3 ? (
              <View style={{ marginTop: 20 }}>
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900", paddingHorizontal: 16, marginBottom: 10 }}>اكتشف السينما</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
                  {heroes.slice(0, 10).map((item) => (
                    <View key={item.id} style={{ marginRight: 8 }}>
                      <ContentCard
                        item={item}
                        width={cardW}
                          onPress={() => openItem(item)}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* shelves */}
                {shelves.map((sh) => (
                  <View key={sh.key} style={{ marginTop: 22 }}>
                    <View style={{ paddingHorizontal: 16 }}>
                      <SectionTitle title={sh.title} />
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingTop: 10 }}>
                      {sh.items.map((it) => (
                        <ContentCard
                          key={it.id}
                          item={it}
                          width={cardW}
                          onPress={() => openItem(it)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                ))}
                {!shelves.length ? <EmptyState title={copy.noItems} /> : null}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
