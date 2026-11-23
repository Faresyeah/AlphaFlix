import { useLocalSearchParams } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { BackButton, ErrorState, LoadingState } from "@/components/section-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";
import { itemKey, type MediaItem } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";
import { getAnimeServers, pixeldrainDirectUrl, type ServerOption } from "./api";

export default function AnimeWatchScreen() {
  useKeepAwake();
  const params = useLocalSearchParams<{ id: string; episode?: string; title?: string; poster?: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const episode = params.episode ?? "001";
  const { saveProgress, saveResume } = useLibrary();
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [selected, setSelected] = useState<ServerOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const videoUrl = useMemo(() => selected ? pixeldrainDirectUrl(selected) : null, [selected]);
  const player = useVideoPlayer(videoUrl ?? "", (instance) => { instance.loop = false; });
  const key = itemKey("anime", id);
  const mediaItem = useMemo<MediaItem>(() => ({ id, kind: "anime", title: params.title || id, poster: params.poster || null, type: "أنمي", tags: [], rating: 0, status: "", year: "", count: "" }), [id, params.poster, params.title]);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { const list = await getAnimeServers(id, episode); setServers(list); setSelected(list[0] ?? null); void saveResume(key, episode); } catch { setError(true); } finally { setLoading(false); }
  }, [episode, id, key, saveResume]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  useEffect(() => { if (!videoUrl) return; const timer = setInterval(() => { const duration = player.duration; const currentTime = player.currentTime; if (duration > 0 && currentTime > 0) void saveProgress(key, Math.min(0.99, currentTime / duration), mediaItem); }, 15000); return () => clearInterval(timer); }, [player, videoUrl, key, mediaItem, saveProgress]);

  return <View style={{ backgroundColor: DESIGN.colors.background }} className="flex-1"><ScrollView contentContainerStyle={{ paddingBottom: 42 }} showsVerticalScrollIndicator={false}>
    <View className="flex-row items-center px-5 pb-4 pt-12"><BackButton /><View className="ml-3 flex-1"><Text numberOfLines={1} className="text-right text-base font-black text-[#FFFFFF]">{id}</Text><Text className="mt-1 text-right text-xs text-[#C4C4C4]">الحلقة {episode}  ·  المشاهدة الآن</Text></View><View style={{ backgroundColor: DESIGN.colors.primary + "20" }} className="ml-3 rounded-xl p-2"><IconSymbol name="play.fill" size={18} color={DESIGN.colors.primary} /></View></View>
    <View style={{ borderColor: DESIGN.colors.border }} className="mx-4 overflow-hidden rounded-[22px] border bg-black"><View className="aspect-video items-center justify-center">{videoUrl ? <VideoView player={player} style={{ width: "100%", height: "100%" }} nativeControls fullscreenOptions={{ enable: true }} /> : loading ? <LoadingState label="نجهّز المشاهدة..." /> : <Text className="px-8 text-center text-sm leading-6 text-[#C4C4C4]">لا يوجد رابط مدعوم لهذه الحلقة.</Text>}</View></View>
    <View className="px-5 pt-6"><View style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }} className="mb-5 rounded-2xl border p-4"><View className="mb-3 flex-row items-center" style={{ gap: 8 }}><View style={{ backgroundColor: DESIGN.colors.primary }} className="h-5 w-1 rounded-full" /><Text className="text-base font-black text-[#FFFFFF]">اختر الجودة</Text></View><View className="flex-row flex-wrap" style={{ gap: 8 }}>{servers.map((server) => { const active = selected?.fileId === server.fileId && selected?.quality === server.quality; return <Pressable key={`${server.fileId}-${server.quality}`} onPress={() => setSelected(server)} style={{ backgroundColor: active ? DESIGN.colors.primary : DESIGN.colors.surfaceRaised, borderColor: active ? DESIGN.colors.primary : DESIGN.colors.border }} className="min-h-[44px] min-w-[78px] items-center justify-center rounded-xl border px-4 active:opacity-80"><Text style={{ color: active ? DESIGN.colors.background : DESIGN.colors.text }} className="text-xs font-black">{server.quality}</Text></Pressable>; })}</View></View><View style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }} className="mb-5 rounded-2xl border p-4"><Text className="mb-2 text-sm font-bold text-[#FFFFFF]">تجربة مشاهدة مريحة</Text><Text className="text-xs leading-6 text-[#C4C4C4]">يمكنك تغيير الجودة من الأعلى واستخدام التحكم الكامل داخل المشغل. يتم حفظ آخر حلقة وتقدم المشاهدة تلقائيًا.</Text></View>{error ? <ErrorState onRetry={load} /> : null}{!loading && !error && !servers.length ? <View style={{ borderColor: DESIGN.colors.primary + "66", backgroundColor: DESIGN.colors.primary + "12" }} className="rounded-2xl border p-5"><Text className="text-center text-sm leading-6 text-[#FF8A93]">لم نجد خادماً مدعوماً لهذه الحلقة.</Text></View> : null}</View>
  </ScrollView></View>;
}
