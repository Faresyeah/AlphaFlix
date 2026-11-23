import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, Text, View } from "react-native";

import { EmptyState, ErrorState, FullScreenLoading } from "@/components/section-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";
import { itemKey } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";
import type { CinemaDetails, CinemaLink } from "./parse";
import { getCinemaDetails, getCinemaSeasons } from "./api";
import { CinemaHeader } from "./ui";

export default function CinemaDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string }>();
  const url = typeof params.url === "string" ? params.url : "";
  const [details, setDetails] = useState<CinemaDetails | null>(null);
  const [seasons, setSeasons] = useState<CinemaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const library = useLibrary();

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const data = await getCinemaDetails(url);
      setDetails(data);
      if (data.item.type === "مسلسل") setSeasons(await getCinemaSeasons(url).catch(() => data.seasons));
    } catch { setError(true); } finally { setLoading(false); }
  }, [url]);
  useEffect(() => { const timer = setTimeout(() => { if (url) void load(); else { setError(true); setLoading(false); } }, 0); return () => clearTimeout(timer); }, [load, url]);

  if (loading && !details) return <FullScreenLoading label="نحمّل تفاصيل العمل..." />;
  if (error || !details) return <View className="flex-1 bg-[#050505] px-5 pt-5"><CinemaHeader title="تفاصيل العمل" /><ErrorState onRetry={load} /></View>;

  const item = details.item;
  const key = itemKey("cinema", url);
  const favorite = library.isFavorite(key);
  const later = library.isWatchLater(key);
  const isSeries = item.type === "مسلسل";
  const seasonList = seasons.length ? seasons : details.seasons;
  const watchMovie = () => router.push({ pathname: "/cinema/watch", params: { url, title: item.title, media: "movie" } } as never);
  const openSeason = (season: CinemaLink, index: number) => router.push({ pathname: "/cinema/season", params: { url: season.url, series: url, title: season.title, season: String(index + 1) } } as never);
  const openEpisode = (episode: CinemaLink, seasonNo = 1) => router.push({ pathname: "/cinema/episode", params: { url: episode.url, series: url, season: String(seasonNo) } } as never);

  return <View style={{ flex: 1, backgroundColor: DESIGN.colors.background }}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 42 }}>
      <View style={{ height: 350, backgroundColor: DESIGN.colors.surface }}>
        {item.poster ? <Image source={item.poster} contentFit="cover" transition={160} style={{ width: "100%", height: "100%", opacity: 0.46 }} /> : null}
        <View className="absolute inset-0" style={{ backgroundColor: "#05050599" }} />
        <View className="absolute left-5 top-4"><Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: "#090A0FBB" }}><IconSymbol name="arrow.left" size={21} color="white" /></Pressable></View>
        <View className="absolute bottom-5 left-5 right-5 flex-row items-end" style={{ gap: 14 }}>
          {item.poster ? <Image source={item.poster} contentFit="cover" style={{ width: 104, height: 150, borderRadius: 16, borderWidth: 1, borderColor: DESIGN.colors.borderStrong }} /> : null}
          <View className="flex-1"><View className="mb-2 self-end rounded-lg px-2 py-1" style={{ backgroundColor: DESIGN.colors.primary }}><Text className="text-[10px] font-black text-white">{item.type}{item.year ? ` · ${item.year}` : ""}</Text></View><Text className="text-right text-2xl font-black leading-8 text-white">{item.title}</Text></View>
        </View>
      </View>
      <View className="px-5 pt-5">
        <View className="mb-4 flex-row" style={{ gap: 9 }}>
          <Pressable onPress={() => void library.toggleFavorite(item)} style={{ backgroundColor: favorite ? DESIGN.colors.secondary : DESIGN.colors.surfaceRaised, borderColor: DESIGN.colors.border }} className="min-h-[46px] flex-1 flex-row items-center justify-center rounded-xl border"><IconSymbol name="heart.fill" size={17} color={favorite ? "#050505" : DESIGN.colors.secondary} /><Text className="ml-2 text-xs font-bold" style={{ color: favorite ? "#050505" : "white" }}>{favorite ? "في المفضلة" : "أضف للمفضلة"}</Text></Pressable>
          <Pressable onPress={() => void library.toggleWatchLater(item)} style={{ backgroundColor: later ? DESIGN.colors.primary : DESIGN.colors.surfaceRaised, borderColor: DESIGN.colors.border }} className="min-h-[46px] flex-1 flex-row items-center justify-center rounded-xl border"><IconSymbol name="clock.fill" size={17} color="white" /><Text className="ml-2 text-xs font-bold text-white">{later ? "في قائمتي" : "شاهد لاحقاً"}</Text></Pressable>
        </View>
        {isSeries ? null : <Pressable onPress={watchMovie} style={{ backgroundColor: DESIGN.colors.primary }} className="mb-5 min-h-[54px] flex-row items-center justify-center rounded-2xl active:opacity-80"><IconSymbol name="play.fill" size={21} color="white" /><Text className="ml-2 text-sm font-black text-white">شاهد الآن داخل التطبيق</Text></Pressable>}
        <Text className="mb-2 text-right text-base font-black text-white">القصة</Text>
        <Text className="mb-5 text-right text-sm leading-7 text-[#C4C4C4]">{item.story || "لا يوجد وصف متاح لهذا العمل."}</Text>
        {details.fields.length ? <View className="mb-6 rounded-2xl border p-4" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }}>{details.fields.map(([label, value]) => <View key={label} className="mb-3 flex-row items-start justify-between" style={{ gap: 14 }}><Text className="flex-1 text-right text-xs leading-5 text-[#A4A4B2]">{label}</Text><Text className="flex-1 text-right text-xs font-semibold leading-5 text-white">{value}</Text></View>)}</View> : null}
        {isSeries ? <View className="mb-6"><View className="mb-3 flex-row items-center justify-between"><Text className="text-lg font-black text-white">المواسم</Text><Text className="text-xs text-[#A4A4B2]">{details.seasonCount ?? seasonList.length} موسم</Text></View>{seasonList.length ? seasonList.map((season, index) => <Pressable key={`${season.url}-${index}`} onPress={() => openSeason(season, index)} style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }} className="mb-2 min-h-[56px] flex-row items-center rounded-2xl border px-4"><View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: DESIGN.colors.primary + "22" }}><Text className="text-xs font-black text-[#FF5963]">{index + 1}</Text></View><Text numberOfLines={2} className="ml-3 flex-1 text-right text-sm font-bold text-white">{season.title}</Text><IconSymbol name="chevron.right" size={19} color={DESIGN.colors.textMuted} /></Pressable>) : <EmptyState title="لا توجد مواسم متاحة" body="لم يُرجع المصدر قائمة مواسم لهذا المسلسل." />}</View> : null}
        {!isSeries && details.episodes.length ? <View className="mb-5"><Text className="mb-3 text-lg font-black text-white">الحلقات المرتبطة</Text>{details.episodes.map((episode) => <Pressable key={episode.url} onPress={() => openEpisode(episode)} className="mb-2 min-h-[52px] flex-row items-center rounded-xl border px-3" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }}><Text numberOfLines={2} className="flex-1 text-right text-xs font-bold text-white">{episode.title}</Text><IconSymbol name="play.fill" size={18} color={DESIGN.colors.primary} /></Pressable>)}</View> : null}
      </View>
    </ScrollView>
  </View>;
}
