import { Image as ExpoImage } from "expo-image";
import { useKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Image as RNImage, Pressable, ScrollView, Text, useWindowDimensions, View, type ViewToken } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { BackButton, ErrorState, LoadingState } from "@/components/section-ui";
import type { SwatDetails, SwatPages } from "@/lib/core/swat";
import { itemKey, type SectionKind } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const DEFAULT_RATIO = 1.45;
/** نسب الارتفاع/العرض المعروفة لكل صورة (تُملأ مسبقاً لتفادي قفزات التمرير). */
const ratioCache = new Map<string, number>();

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));

type PageProps = { uri: string; width: number; ratio: number; onRatio: (uri: string, ratio: number) => void };

/** صفحة واحدة: بلا هوامش ولا فواصل، تحافظ على النسبة الأصلية. */
const Page = memo(function Page({ uri, width, ratio, onRatio }: PageProps) {
  return (
    <ExpoImage
      source={uri}
      contentFit="fill"
      transition={0}
      cachePolicy="memory-disk"
      recyclingKey={uri}
      onLoad={(e) => {
        const { width: w, height: h } = e.source;
        if (w > 0 && h > 0) onRatio(uri, h / w);
      }}
      style={{ width, height: Math.round(width * ratio), backgroundColor: "#090A0F" }}
    />
  );
});

export function VerticalChapterReader({
  kind,
  seriesId,
  chapterId,
  loadChapter,
  loadDetails,
}: {
  kind: SectionKind;
  seriesId: string;
  chapterId: string;
  loadChapter: (chapterId: string) => Promise<SwatPages>;
  loadDetails: (seriesId: string) => Promise<SwatDetails>;
}) {
  useKeepAwake();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { saveResume, saveProgress } = useLibrary();
  const [pages, setPages] = useState<SwatPages | null>(null);
  const [details, setDetails] = useState<SwatDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [chrome, setChrome] = useState(true);
  const [current, setCurrent] = useState(1);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [, bump] = useState(0);
  const listRef = useRef<FlatList<string>>(null);
  const scrollOffset = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    setPages(null);
    setCurrent(1);
    try {
      setPages(await loadChapter(chapterId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [chapterId, loadChapter]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  // قائمة الفصول (للتنقل) — من الكاش غالباً لأن صفحة التفاصيل جلبتها قبل قليل.
  useEffect(() => {
    let active = true;
    loadDetails(seriesId).then((d) => active && setDetails(d)).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [seriesId, loadDetails]);

  // نحدّد أبعاد الصور مسبقاً بمجمّع صغير حتى لا تقفز الصفحات أثناء التمرير.
  useEffect(() => {
    if (!pages) return;
    let cancelled = false;
    const queue = pages.images.filter((u) => !ratioCache.has(u));
    const worker = async () => {
      while (!cancelled && queue.length) {
        const uri = queue.shift() as string;
        await new Promise<void>((resolve) => {
          RNImage.getSize(
            uri,
            (w, h) => {
              if (w > 0 && h > 0) ratioCache.set(uri, h / w);
              resolve();
            },
            () => resolve(),
          );
        });
        if (!cancelled) bump((n) => n + 1);
      }
    };
    void Promise.all([worker(), worker(), worker()]);
    return () => {
      cancelled = true;
    };
  }, [pages]);

  const chapters = details?.chapters ?? [];
  const index = chapters.findIndex((c) => c.id === chapterId);
  const next = index > 0 ? chapters[index - 1] : null; // القائمة مرتبة من الأحدث للأقدم
  const prev = index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null;

  useEffect(() => {
    if (!pages) return;
    const key = itemKey(kind, seriesId);
    void saveResume(key, chapterId);
    if (chapters.length && index >= 0) void saveProgress(key, (chapters.length - index) / chapters.length);
  }, [pages, chapterId, index, chapters.length, kind, seriesId, saveResume, saveProgress]);

  const go = useCallback(
    (id: string) => router.replace(`/${kind}/read/${encodeURIComponent(id)}?series=${encodeURIComponent(seriesId)}` as never),
    [router, kind, seriesId],
  );

  const onRatio = useCallback((uri: string, ratio: number) => {
    if (ratioCache.get(uri) !== ratio) {
      ratioCache.set(uri, ratio);
      bump((n) => n + 1);
    }
  }, []);

  const applyZoom = useCallback((z: number | ((current: number) => number)) => setZoom((current) => clampZoom(typeof z === "function" ? z(current) : z)), []);

  useEffect(() => {
    if (!autoScroll) return;
    const timer = setInterval(() => {
      scrollOffset.current += scrollSpeed;
      listRef.current?.scrollToOffset({ offset: scrollOffset.current, animated: false });
    }, 40);
    return () => clearInterval(timer);
  }, [autoScroll, scrollSpeed]);

  const gestures = useMemo(() => {
    const pinch = Gesture.Pinch()
      .runOnJS(true)
      .onEnd((e) => applyZoom((current) => current * e.scale));
    const double = Gesture.Tap()
      .numberOfTaps(2)
      .runOnJS(true)
      .onEnd((_e, ok) => ok && applyZoom((current) => current > 1.05 ? 1 : 2));
    const single = Gesture.Tap()
      .runOnJS(true)
      .onEnd((_e, ok) => ok && setChrome((v) => !v));
    return Gesture.Simultaneous(pinch, Gesture.Exclusive(double, single));
  }, [applyZoom]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.index != null);
    if (first?.index != null) setCurrent(first.index + 1);
  }, []);

  const contentWidth = Math.round(screenWidth * zoom);
  const images = pages?.images ?? [];
  const chapterLabel = pages ? pages.chapter.replace(/\[.*?\]\s*/g, "") : "";

  const list = (
    <FlatList
      ref={listRef}
      data={images}
      keyExtractor={(uri, i) => `${i}-${uri}`}
      renderItem={({ item }) => <Page uri={item} width={contentWidth} ratio={ratioCache.get(item) ?? DEFAULT_RATIO} onRatio={onRatio} />}
      onViewableItemsChanged={onViewableItemsChanged}
      onScroll={(event) => { scrollOffset.current = event.nativeEvent.contentOffset.y; }}
      scrollEventThrottle={16}
      viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      windowSize={7}
      removeClippedSubviews
      showsVerticalScrollIndicator={false}
      ListFooterComponent={
        <View style={{ width: contentWidth }} className="items-center bg-[#090A0F] px-5 py-10">
          <Text className="mb-4 text-sm text-[#B8B6C8]">نهاية الفصل {chapterLabel}</Text>
          {next ? (
            <Pressable onPress={() => go(next.id)} className="rounded-2xl bg-[#E50914] px-8 py-4 active:opacity-80">
              <Text className="font-black text-[#090A0F]">الفصل التالي ›</Text>
            </Pressable>
          ) : (
            <Text className="text-xs text-[#77758A]">لا يوجد فصل أحدث حالياً</Text>
          )}
        </View>
      }
    />
  );

  return (
    <View className="flex-1 bg-black">
      {loading ? (
        <View className="flex-1 pt-24"><LoadingState label="نحمّل صفحات الفصل..." /></View>
      ) : error || !pages ? (
        <View className="flex-1 px-5 pt-24"><ErrorState onRetry={load} /></View>
      ) : !images.length ? (
        <View className="flex-1 items-center justify-center px-8"><Text className="text-center text-sm leading-6 text-[#B8B6C8]">هذا الفصل لا يحتوي على صور في المصدر.</Text></View>
      ) : (
        <GestureDetector gesture={gestures}>
          <View className="flex-1">
            {zoom > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} contentContainerStyle={{ width: contentWidth }} nestedScrollEnabled>
                <View style={{ width: contentWidth, flex: 1 }}>{list}</View>
              </ScrollView>
            ) : (
              list
            )}
          </View>
        </GestureDetector>
      )}

      {chrome ? (
        <>
          <View pointerEvents="box-none" className="absolute left-0 right-0 top-0 flex-row items-center bg-[#090A0FE6] px-4 pb-3 pt-12" style={{ gap: 10 }}>
            <BackButton />
            <View className="flex-1">
              <Text numberOfLines={1} className="text-right text-sm font-black text-[#F8F7FF]">{pages?.series || "قارئ المانهوا"}</Text>
              <Text numberOfLines={1} className="text-right text-xs text-[#B8B6C8]">{chapterLabel ? `الفصل ${chapterLabel}` : ""}{images.length ? ` · ${current}/${images.length}` : ""}</Text>
            </View>
            <View className="flex-row items-center rounded-2xl border border-[#3A4055] bg-[#1A1E2B]">
              <Pressable onPress={() => applyZoom(zoom - 0.25)} disabled={zoom <= MIN_ZOOM} hitSlop={6} className="h-10 w-10 items-center justify-center active:opacity-60"><Text className="text-xl text-[#F8F7FF]">−</Text></Pressable>
              <Pressable onPress={() => applyZoom(1)} hitSlop={4}><Text className="w-11 text-center text-[11px] font-bold text-[#E50914]">{Math.round(zoom * 100)}%</Text></Pressable>
              <Pressable onPress={() => applyZoom(zoom + 0.25)} disabled={zoom >= MAX_ZOOM} hitSlop={6} className="h-10 w-10 items-center justify-center active:opacity-60"><Text className="text-xl text-[#F8F7FF]">+</Text></Pressable>
            </View>
            <Pressable onPress={() => setAutoScroll((value) => !value)} style={{ backgroundColor: autoScroll ? "#E50914" : "#1A1E2B" }} className="h-10 min-w-[58px] items-center justify-center rounded-2xl border border-[#3A4055] px-2"><Text style={{ color: autoScroll ? "#050505" : "#FFFFFF" }} className="text-[10px] font-black">{autoScroll ? "إيقاف" : "تلقائي"}</Text></Pressable>
          </View>
          {autoScroll ? <View className="absolute left-4 right-4 top-[104px] flex-row items-center justify-between rounded-2xl border border-[#444444] bg-[#1A1E2B] px-3 py-2"><Text className="text-[10px] font-bold text-[#C4C4C4]">سرعة التمرير</Text><View className="flex-row" style={{ gap: 6 }}>{[{ value: 1, label: "بطيء" }, { value: 2, label: "متوسط" }, { value: 4, label: "سريع" }].map((option) => <Pressable key={option.value} onPress={() => setScrollSpeed(option.value)} style={{ backgroundColor: scrollSpeed === option.value ? "#E50914" : "#252525" }} className="rounded-lg px-2 py-1"><Text style={{ color: scrollSpeed === option.value ? "#050505" : "#FFFFFF" }} className="text-[10px] font-bold">{option.label}</Text></Pressable>)}</View></View> : null}
          <View pointerEvents="box-none" className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between bg-[#090A0FE6] px-5 pb-8 pt-3" style={{ gap: 12 }}>
            <Pressable disabled={!prev} onPress={() => prev && go(prev.id)} style={{ opacity: prev ? 1 : 0.35 }} className="min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-[#3A4055] bg-[#1A1E2B]"><Text className="text-sm font-bold text-[#F8F7FF]">‹ السابق</Text></Pressable>
            <Pressable disabled={!next} onPress={() => next && go(next.id)} style={{ opacity: next ? 1 : 0.35 }} className="min-h-[44px] flex-1 items-center justify-center rounded-2xl bg-[#E50914]"><Text className="text-sm font-black text-[#090A0F]">التالي ›</Text></Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}
