import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { DetailsShell, PrimaryButton } from "@/components/details-shell";
import { EmptyState, ErrorState, FullScreenLoading } from "@/components/section-ui";
import { itemKey } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";
import { getAnimeDetails, getAnimeEpisodes, type AnimeDetails, type Episode } from "./api";

export default function AnimeDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const { resume } = useLibrary();
  const [details, setDetails] = useState<AnimeDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [d, e] = await Promise.all([getAnimeDetails(id), getAnimeEpisodes(id).catch(() => [] as Episode[])]);
      setDetails(d);
      setEpisodes(e);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (loading && !details) return <FullScreenLoading label="نحضر التفاصيل..." />;
  if (error || !details) return <View className="flex-1 bg-[#090A0F] px-5 pt-14"><ErrorState onRetry={load} /></View>;

  const watch = (episode: string) => router.push(`/anime/watch/${encodeURIComponent(id)}?episode=${encodeURIComponent(episode)}&title=${encodeURIComponent(details.title)}&poster=${encodeURIComponent(details.poster ?? "")}` as never);
  const last = resume[itemKey("anime", id)];
  const startId = last && episodes.some((e) => e.id === last) ? last : episodes[0]?.id;

  return (
    <DetailsShell
      item={details}
      chips={[details.englishTitle ?? "", details.malScore ? `MAL ${details.malScore}` : ""]}
      onWatch={startId ? () => watch(startId) : undefined}
      actions={startId ? <PrimaryButton label={last ? `▶ تابع المشاهدة (حلقة ${startId})` : "▶ شاهد الآن"} onPress={() => watch(startId)} /> : null}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-black text-[#F8F7FF]">الحلقات</Text>
        <Text className="text-xs text-[#B8B6C8]">{episodes.length} حلقة</Text>
      </View>
      {episodes.length ? (
        episodes.map((e) => (
          <Pressable key={e.id} onPress={() => watch(e.id)} className={`mb-2 min-h-[56px] flex-row items-center justify-between rounded-2xl border bg-[#141722] px-4 py-3 active:border-[#E50914] ${e.id === last ? "border-[#E50914]" : "border-[#292D3D]"}`}>
            <View className="flex-1 flex-row items-center" style={{ gap: 12 }}>
              <View className="h-9 min-w-[36px] items-center justify-center rounded-xl bg-[#E5091422] px-2"><Text className="text-xs font-black text-[#E50914]">{e.id}</Text></View>
              <Text numberOfLines={1} className="flex-1 text-sm font-bold text-[#F8F7FF]">{e.name}</Text>
            </View>
            <Text className="text-lg text-[#FF3344]">▶</Text>
          </Pressable>
        ))
      ) : (
        <EmptyState title="لا توجد حلقات" body="لم يُرجع المصدر حلقات لهذا العمل حالياً." />
      )}
    </DetailsShell>
  );
}
