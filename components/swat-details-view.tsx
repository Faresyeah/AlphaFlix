import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { DetailsShell, PrimaryButton } from "@/components/details-shell";
import { EmptyState, ErrorState, FullScreenLoading } from "@/components/section-ui";
import type { SwatDetails } from "@/lib/core/swat";
import { itemKey, type SectionKind } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";

/** عرض تفاصيل لأعمال الفصول المصورة (مانغا/مانهوا). يستقبل دالة الجلب من القسم نفسه. */
export function SwatDetailsView({ kind, id, load }: { kind: SectionKind; id: string; load: (id: string) => Promise<SwatDetails> }) {
  const router = useRouter();
  const { resume } = useLibrary();
  const [details, setDetails] = useState<SwatDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [oldestFirst, setOldestFirst] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setDetails(await load(id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id, load]);

  useEffect(() => {
    const timer = setTimeout(() => void run(), 0);
    return () => clearTimeout(timer);
  }, [run]);

  const chapters = useMemo(() => {
    const list = details?.chapters ?? [];
    return oldestFirst ? [...list].reverse() : list;
  }, [details, oldestFirst]);

  if (loading && !details) return <FullScreenLoading label="نحضر التفاصيل..." />;
  if (error || !details) return <View className="flex-1 bg-[#090A0F] px-5 pt-14"><ErrorState onRetry={run} /></View>;

  const open = (chapterId: string) => router.push(`/${kind}/read/${encodeURIComponent(chapterId)}?series=${encodeURIComponent(id)}` as never);
  const resumeId = resume[itemKey(kind, id)];
  const resumeChapter = details.chapters.find((c) => c.id === resumeId);
  const first = details.chapters[details.chapters.length - 1];

  return (
    <DetailsShell
      item={details}
      laterLabel="قراءة لاحقاً"
      chips={details.views ? [`${details.views.toLocaleString("en-US")} مشاهدة`] : []}
      actions={
        first ? (
          <PrimaryButton
            label={resumeChapter ? `▶ تابع القراءة (فصل ${resumeChapter.chapter})` : `▶ ابدأ القراءة (فصل ${first.chapter})`}
            onPress={() => open(resumeChapter ? resumeChapter.id : first.id)}
          />
        ) : null
      }
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-black text-[#F8F7FF]">الفصول ({details.chapters.length})</Text>
        <Pressable onPress={() => setOldestFirst((v) => !v)} hitSlop={8} className="rounded-full border border-[#3A4055] px-3 py-2">
          <Text className="text-xs font-bold text-[#E50914]">{oldestFirst ? "الأقدم أولاً" : "الأحدث أولاً"}</Text>
        </Pressable>
      </View>
      {chapters.length ? (
        chapters.map((c) => (
          <Pressable key={c.id} onPress={() => open(c.id)} className={`mb-2 min-h-[56px] flex-row items-center justify-between rounded-2xl border bg-[#141722] px-4 py-3 active:border-[#E50914] ${c.id === resumeId ? "border-[#E50914]" : "border-[#292D3D]"}`}>
            <View className="flex-1 flex-row items-center" style={{ gap: 12 }}>
              <View className="min-w-[40px] items-center justify-center rounded-xl bg-[#E5091422] px-2 py-2"><Text className="text-xs font-black text-[#E50914]">{c.chapter.replace(/\[.*?\]\s*/g, "")}</Text></View>
              <Text numberOfLines={1} className="flex-1 text-sm font-bold text-[#F8F7FF]">{c.title || `الفصل ${c.chapter}`}</Text>
            </View>
            <Text className="text-base text-[#FF3344]">‹</Text>
          </Pressable>
        ))
      ) : (
        <EmptyState title="لا توجد فصول متاحة" body="لم يُرجع المصدر فصولاً لهذا العمل حالياً." />
      )}
    </DetailsShell>
  );
}
