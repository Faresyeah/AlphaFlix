import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, Text, View } from "react-native";

import { EmptyState, ErrorState, FullScreenLoading } from "@/components/section-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";
import { itemKey } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";
import type { CinemaDetails } from "./parse";
import { getCinemaEpisode } from "./api";
import { CinemaHeader } from "./ui";

export default function CinemaEpisodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string; series?: string; season?: string }>();
  const url = typeof params.url === "string" ? params.url : "";
  const series = typeof params.series === "string" ? params.series : "";
  const season = params.season ?? "1";
  const [details, setDetails] = useState<CinemaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const library = useLibrary();
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setDetails(await getCinemaEpisode(url)); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [url]);
  useEffect(() => { const timer = setTimeout(() => { if (url) void load(); else { setError(true); setLoading(false); } }, 0); return () => clearTimeout(timer); }, [load, url]);

  if (loading && !details) return <FullScreenLoading label="نحمّل تفاصيل الحلقة..." />;
  if (error || !details) return <View className="flex-1 bg-[#050505] px-5"><CinemaHeader title="تفاصيل الحلقة" /><ErrorState onRetry={load} /></View>;
  const item = details.item;
  const key = itemKey("cinema", url);
  const favorite = library.isFavorite(key);
  const later = library.isWatchLater(key);
  const play = () => router.push({ pathname: "/cinema/watch", params: { url, title: item.title, media: "episode", series, season } } as never);
  const openEpisode = (episodeUrl: string) => router.push({ pathname: "/cinema/episode", params: { url: episodeUrl, series, season } } as never);

  return <View style={{ flex: 1, backgroundColor: DESIGN.colors.background }}>
    <CinemaHeader title="تفاصيل الحلقة" subtitle={`الموسم ${season}`} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}>
      {item.poster ? <Image source={item.poster} contentFit="cover" transition={180} style={{ width: "100%", height: 260, borderRadius: 22, marginBottom: 20 }} /> : null}
      <Text className="mb-3 text-right text-2xl font-black leading-9 text-white">{item.title}</Text>
      <Text className="mb-5 text-right text-sm leading-7 text-[#C4C4C4]">{item.story || "لا يوجد وصف متاح لهذه الحلقة."}</Text>
      <View className="mb-4 flex-row" style={{ gap: 9 }}>
        <Pressable onPress={() => void library.toggleFavorite(item)} style={{ backgroundColor: favorite ? DESIGN.colors.secondary : DESIGN.colors.surfaceRaised, borderColor: DESIGN.colors.border }} className="min-h-[44px] flex-1 flex-row items-center justify-center rounded-xl border"><IconSymbol name="heart.fill" size={16} color={favorite ? "#050505" : DESIGN.colors.secondary} /><Text className="ml-2 text-xs font-bold" style={{ color: favorite ? "#050505" : "white" }}>{favorite ? "في المفضلة" : "أضف للمفضلة"}</Text></Pressable>
        <Pressable onPress={() => void library.toggleWatchLater(item)} style={{ backgroundColor: later ? DESIGN.colors.primary : DESIGN.colors.surfaceRaised, borderColor: DESIGN.colors.border }} className="min-h-[44px] flex-1 flex-row items-center justify-center rounded-xl border"><IconSymbol name="clock.fill" size={16} color="white" /><Text className="ml-2 text-xs font-bold text-white">{later ? "في قائمتي" : "شاهد لاحقاً"}</Text></Pressable>
      </View>
      <Pressable onPress={play} style={{ backgroundColor: DESIGN.colors.primary }} className="mb-6 min-h-[54px] flex-row items-center justify-center rounded-2xl active:opacity-80"><IconSymbol name="play.fill" size={21} color="white" /><Text className="ml-2 text-sm font-black text-white">شاهد الحلقة داخل التطبيق</Text></Pressable>
      {details.fields.length ? <View className="mb-6 rounded-2xl border p-4" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }}>{details.fields.map(([label, value]) => <View key={label} className="mb-3 flex-row justify-between" style={{ gap: 12 }}><Text className="flex-1 text-right text-xs text-[#A4A4B2]">{label}</Text><Text className="flex-1 text-right text-xs font-bold text-white">{value}</Text></View>)}</View> : null}
      {details.relatedEpisodes.length ? <View><Text className="mb-3 text-lg font-black text-white">حلقات أخرى</Text>{details.relatedEpisodes.map((episode) => <Pressable key={episode.url} onPress={() => openEpisode(episode.url)} style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }} className="mb-2 min-h-[54px] flex-row items-center rounded-xl border px-4"><Text numberOfLines={2} className="flex-1 text-right text-xs font-semibold text-white">{episode.title}</Text><IconSymbol name="play.fill" size={18} color={DESIGN.colors.primary} /></Pressable>)}</View> : <EmptyState title="وصلت إلى تفاصيل الحلقة" body="اختر تشغيل الحلقة أو ارجع لقائمة الموسم." />}
    </ScrollView>
  </View>;
}
