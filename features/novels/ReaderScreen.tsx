import { useKeepAwake } from "expo-keep-awake";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { BackButton, EmptyState, ErrorState, LoadingState } from "@/components/section-ui";
import { readStored, writeStored } from "@/lib/storage";
import { itemKey } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";
import { getNovelChapter } from "./api";
import type { NovelChapter } from "./parse";

const FONT_KEY = "damenotaku:novels:reader-font";

export default function NovelReaderScreen() {
  useKeepAwake();
  const router = useRouter();
  const { id: rawId, novel: rawNovel } = useLocalSearchParams<{ id: string; novel?: string }>();
  const chapterId = decodeURIComponent(rawId ?? "");
  const novelId = decodeURIComponent(rawNovel ?? "");
  const { saveResume } = useLibrary();
  const [chapter, setChapter] = useState<NovelChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [font, setFont] = useState(18);
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    void readStored<number>(FONT_KEY, 18).then(setFont);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    setChapter(null);
    scroller.current?.scrollTo({ y: 0, animated: false });
    try {
      const c = await getNovelChapter(chapterId);
      setChapter(c);
      const owner = novelId || c.novelId;
      if (owner) void saveResume(itemKey("novels", owner), chapterId);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [chapterId, novelId, saveResume]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const changeFont = (delta: number) => {
    const next = Math.max(14, Math.min(30, font + delta));
    setFont(next);
    void writeStored(FONT_KEY, next);
  };
  const go = (id: string) => router.replace(`/novels/read/${encodeURIComponent(id)}?novel=${encodeURIComponent(novelId || chapter?.novelId || "")}` as never);

  return (
    <View className="flex-1 bg-[#050505]">
      <View className="flex-row items-center bg-[#050505] px-4 pb-3 pt-12" style={{ gap: 10 }}>
        <BackButton />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-right text-sm font-black text-[#FFFFFF]">{chapter?.novelTitle || "قارئ الروايات"}</Text>
          {chapter ? <Text numberOfLines={1} className="text-right text-xs text-[#C4C4C4]">الفصل {chapter.number}</Text> : null}
        </View>
        <View className="flex-row items-center rounded-2xl border border-[#444444] bg-[#1B1B1B]">
          <Pressable onPress={() => changeFont(-1)} hitSlop={6} className="h-10 w-10 items-center justify-center"><Text className="text-xs font-black text-[#FFFFFF]">A−</Text></Pressable>
          <Pressable onPress={() => changeFont(1)} hitSlop={6} className="h-10 w-10 items-center justify-center"><Text className="text-base font-black text-[#FFFFFF]">A+</Text></Pressable>
        </View>
      </View>

      {loading ? (
        <LoadingState label="نحمّل الفصل..." />
      ) : error || !chapter ? (
        <View className="px-5"><ErrorState onRetry={load} message="تعذر تحميل الفصل. قد يكون مقفلاً أو غير متاح." /></View>
      ) : (
        <ScrollView ref={scroller} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          {chapter.paragraphs.length ? (
            chapter.paragraphs.map((p, i) => (
              <Text key={i} style={{ fontSize: font, lineHeight: Math.round(font * 1.9), textAlign: "right", writingDirection: "rtl" }} className="mb-4 text-[#E4DEF2]">{p}</Text>
            ))
          ) : (
            <EmptyState title="الفصل مقفل أو فارغ" body="لم يُرجع المصدر نصاً لهذا الفصل. قد يتطلب فتحه اشتراكاً في الموقع الأصلي." />
          )}
          <View className="mt-4 flex-row" style={{ gap: 10 }}>
            <Pressable disabled={!chapter.prev} onPress={() => chapter.prev && go(chapter.prev.id)} style={{ opacity: chapter.prev ? 1 : 0.35 }} className="min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-[#444444] bg-[#1B1B1B]"><Text className="font-bold text-[#FFFFFF]">‹ السابق</Text></Pressable>
            <Pressable disabled={!chapter.next} onPress={() => chapter.next && go(chapter.next.id)} style={{ opacity: chapter.next ? 1 : 0.35 }} className="min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-[#E50914]"><Text className="font-black text-[#050505]">التالي ›</Text></Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
