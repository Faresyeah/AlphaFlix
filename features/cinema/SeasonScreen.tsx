import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { EmptyState, ErrorState, FullScreenLoading } from "@/components/section-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";
import type { CinemaLink } from "./parse";
import { getCinemaEpisodes } from "./api";
import { CinemaHeader } from "./ui";

export default function CinemaSeasonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string; series?: string; title?: string; season?: string }>();
  const url = typeof params.url === "string" ? params.url : "";
  const series = typeof params.series === "string" ? params.series : "";
  const title = typeof params.title === "string" ? params.title : "الحلقات";
  const season = Math.max(1, Number(params.season) || 1);
  const [episodes, setEpisodes] = useState<CinemaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(false); try { setEpisodes(await getCinemaEpisodes(url, season)); } catch { setError(true); } finally { setLoading(false); } }, [season, url]);
  useEffect(() => { const timer = setTimeout(() => { if (url) void load(); else { setError(true); setLoading(false); } }, 0); return () => clearTimeout(timer); }, [load, url]);
  const openEpisode = (episode: CinemaLink) => router.push({ pathname: "/cinema/episode", params: { url: episode.url, series, season: String(season) } } as never);
  return <View style={{ flex: 1, backgroundColor: DESIGN.colors.background }}><CinemaHeader title={title} subtitle={`${episodes.length} حلقة`} /><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 32 }}>{loading ? <FullScreenLoading label="نحمّل حلقات الموسم..." /> : error ? <ErrorState onRetry={load} /> : episodes.length ? episodes.map((episode, index) => <Pressable key={episode.url} onPress={() => openEpisode(episode)} style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }} className="mb-2 min-h-[62px] flex-row items-center rounded-2xl border px-4 active:opacity-80"><View style={{ backgroundColor: DESIGN.colors.primary + "22" }} className="h-10 w-10 items-center justify-center rounded-xl"><Text className="text-xs font-black text-[#FF5963]">{episodes.length - index}</Text></View><Text numberOfLines={2} className="ml-3 flex-1 text-right text-sm font-bold leading-5 text-white">{episode.title}</Text><IconSymbol name="play.fill" size={20} color={DESIGN.colors.primary} /></Pressable>) : <EmptyState title="لا توجد حلقات" body="لم يرجع المصدر حلقات لهذا الموسم." action="إعادة المحاولة" onAction={load} />}</ScrollView></View>;
}
