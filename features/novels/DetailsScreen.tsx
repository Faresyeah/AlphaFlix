import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { DetailsShell, PrimaryButton } from "@/components/details-shell";
import { EmptyState, ErrorState, FullScreenLoading } from "@/components/section-ui";
import { DESIGN } from "@/constants/design";
import { itemKey } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";
import { getNovelChaptersPage, getNovelDetails, type NovelDetails } from "./api";

export default function NovelDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const { resume } = useLibrary();
  const [novel, setNovel] = useState<NovelDetails | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false); setPage(0);
    try { setNovel(await getNovelDetails(id)); } catch { setError(true); } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);

  const chapters = useMemo(() => [...(novel?.chapters ?? [])].sort((a, b) => b.number - a.number), [novel]);
  if (loading && !novel) return <FullScreenLoading label="نحضر الرواية بسرعة..." />;
  if (error || !novel) return <View className="flex-1 bg-[#050505] px-5 pt-14"><ErrorState onRetry={load} /></View>;

  const open = (chapterId: string) => router.push(`/novels/read/${encodeURIComponent(chapterId)}?novel=${encodeURIComponent(id)}` as never);
  const resumeId = resume[itemKey("novels", id)];
  const firstOnPage = chapters[chapters.length - 1];
  const totalPages = novel.chapterPageCount ?? 1;
  const choosePage = async (nextPage: number) => {
    if (nextPage === page || loadingPage || nextPage < 0 || nextPage >= totalPages) return;
    setLoadingPage(true);
    try {
      const result = await getNovelChaptersPage(id, nextPage);
      setNovel((current) => current ? { ...current, chapters: result.chapters, chaptersCount: result.total || current.chaptersCount, chapterPageCount: result.totalPages } : current);
      setPage(nextPage);
    } finally { setLoadingPage(false); }
  };

  return <DetailsShell item={novel} laterLabel="قراءة لاحقاً" chips={novel.locked ? [`${novel.locked}% من الفصول مقفلة`] : []} actions={firstOnPage || resumeId ? <PrimaryButton label={resumeId ? "▶ تابع القراءة" : `▶ ابدأ القراءة (فصل ${firstOnPage?.number ?? "—"})`} onPress={() => open(resumeId ?? firstOnPage!.id)} /> : null}>
    <View className="mb-4 flex-row items-center justify-between"><Text className="text-lg font-black text-[#FFFFFF]">الفصول</Text><Text className="text-xs text-[#C4C4C4]">{novel.chaptersCount || chapters.length} فصل</Text></View>
    {totalPages > 1 ? <View style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }} className="mb-5 rounded-2xl border p-3"><View className="mb-2 flex-row items-center justify-between"><Text className="text-xs font-bold text-[#C4C4C4]">صفحات الفصول</Text>{loadingPage ? <ActivityIndicator color={DESIGN.colors.primary} size="small" /> : <Text className="text-xs font-bold text-[#E50914]">{page + 1} / {totalPages}</Text>}</View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{Array.from({ length: totalPages }, (_, index) => <Pressable key={index} onPress={() => void choosePage(index)} disabled={loadingPage} style={{ backgroundColor: page === index ? DESIGN.colors.primary : DESIGN.colors.surfaceRaised, borderColor: page === index ? DESIGN.colors.primary : DESIGN.colors.border }} className="min-w-[46px] items-center rounded-xl border px-3 py-2"><Text style={{ color: page === index ? DESIGN.colors.background : DESIGN.colors.text }} className="text-xs font-black">P{index + 1}</Text></Pressable>)}</ScrollView></View> : null}
    {chapters.length ? chapters.map((c) => <Pressable key={c.id} onPress={() => open(c.id)} className={`mb-2 min-h-[56px] flex-row items-center justify-between rounded-2xl border bg-[#121212] px-4 py-3 active:border-[#E50914] ${c.id === resumeId ? "border-[#E50914]" : "border-[#2B2B2B]"}`}><View className="flex-1 flex-row items-center" style={{ gap: 12 }}><View className="min-w-[40px] items-center justify-center rounded-xl bg-[#E5091422] px-2 py-2"><Text className="text-xs font-black text-[#E50914]">{c.number || "—"}</Text></View><Text numberOfLines={1} className="flex-1 text-sm font-bold text-[#FFFFFF]">{c.title && c.title !== String(c.number) ? c.title : `الفصل ${c.number}`}</Text></View><Text className="text-base text-[#FF3344]">‹</Text></Pressable>) : <EmptyState title="قائمة الفصول غير متاحة" body="لم يُرجع المصدر قائمة فصول لهذه الرواية." />}
  </DetailsShell>;
}
