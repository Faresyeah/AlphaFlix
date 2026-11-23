import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";

import { EmptyState, ErrorState, LoadingState } from "@/components/section-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";
import { CinemaCard, CinemaHeader, CinemaPill } from "./ui";
import { getCinemaCatalog, getCinemaFilter, getCinemaList } from "./api";
import type { CinemaPage } from "./parse";

export default function CinemaBrowseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; title?: string; url?: string; page?: string }>();
  const mode = params.mode ?? "movies";
  const title = params.title ?? (mode === "series" ? "المسلسلات" : mode === "movies" ? "الأفلام" : "التصنيفات");
  const url = params.url ?? (mode === "movies" ? "https://topcinemaa.one/movies/" : mode === "series" ? "https://topcinemaa.one/category/مسلسلات-اجنبي/" : "https://topcinemaa.one/");
  const pageNo = Math.max(1, Number(params.page) || 1);
  const [page, setPage] = useState<CinemaPage | null>(null);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { width } = useWindowDimensions();
  const cardWidth = width >= 700 ? 164 : width >= 420 ? 142 : (width - 48) / 2 - 7;
  const filtering = mode === "filter";
  const filterUrl = filtering && params.url ? url : mode === "movies" ? "https://topcinemaa.one/movies/" : url;

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      if (mode === "movies" || mode === "series") {
        setPage(await getCinemaCatalog(mode, pageNo));
        setFilters({});
      } else if (filtering) {
        const result = await getCinemaFilter(filterUrl);
        setPage(result.page); setFilters(result.filters);
      } else {
        setPage(await getCinemaList(url, pageNo)); setFilters({});
      }
    } catch { setError(true); } finally { setLoading(false); }
  }, [filtering, filterUrl, mode, pageNo, url]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  const goPage = (n: number) => { const next = Math.max(1, Math.min(page?.last ?? 1, n)); if (next !== pageNo) router.replace({ pathname: "/cinema/browse", params: { mode, title, url, page: String(next) } } as never); };
  const switchMode = (next: string) => {
    const nextUrl = next === "movies" ? "https://topcinemaa.one/movies/" : next === "series" ? "https://topcinemaa.one/category/مسلسلات-اجنبي/" : url;
    const nextTitle = next === "movies" ? "الأفلام" : next === "series" ? "المسلسلات" : next === "filter" ? "تصفية" : "التصنيفات";
    router.replace({ pathname: "/cinema/browse", params: { mode: next, title: nextTitle, url: nextUrl, page: "1" } } as never);
  };
  const openItem = (item: import("@/lib/core/types").MediaItem) => item.type === "حلقة"
    ? router.push({ pathname: "/cinema/episode", params: { url: item.id } } as never)
    : router.push({ pathname: "/cinema/details", params: { url: item.id } } as never);

  return <View style={{ flex: 1, backgroundColor: DESIGN.colors.background }}>
    <CinemaHeader title={title} subtitle={page ? `${page.items.length} نتيجة · صفحة ${page.current} من ${page.last}` : "تصفّح المحتوى"} />
    <View className="flex-row px-5 pb-3" style={{ gap: 8 }}><CinemaPill title="أفلام" selected={mode === "movies"} onPress={() => switchMode("movies")} /><CinemaPill title="مسلسلات" selected={mode === "series"} onPress={() => switchMode("series")} /><CinemaPill title="التصنيف" selected={mode === "list" || filtering} onPress={() => switchMode("list")} /><Pressable onPress={() => switchMode(filtering ? "list" : "filter")} style={{ backgroundColor: filtering ? DESIGN.colors.primary : DESIGN.colors.surface, borderColor: DESIGN.colors.border }} className="min-h-[38px] flex-row items-center rounded-full border px-4"><IconSymbol name="filter" size={16} color="white" /><Text className="ml-2 text-xs font-bold text-white">تصفية</Text></Pressable></View>
    {filtering ? <View className="mx-5 mb-3 rounded-xl border px-3 py-2" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }}><Text className="text-right text-xs text-[#C4C4C4]">{Object.keys(filters).length ? "خيارات التصفية متاحة من المصدر." : "لا توجد حقول تصفية لهذا القسم حالياً؛ نعرض نتائج المصدر كما وردت."}</Text></View> : null}
    {loading && !page ? <LoadingState label="نحمّل القائمة..." /> : error ? <View className="px-5"><ErrorState onRetry={load} /></View> : page?.items.length ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 34 }}><View className="flex-row flex-wrap justify-between" style={{ rowGap: 18 }}>{page.items.map((item) => <CinemaCard key={item.id} item={item} width={cardWidth} onPress={() => openItem(item)} />)}</View>{page.last > 1 ? <View className="mt-7 flex-row items-center justify-center" style={{ gap: 12 }}><Pressable disabled={pageNo <= 1} onPress={() => goPage(pageNo - 1)} style={{ backgroundColor: pageNo <= 1 ? DESIGN.colors.surface : DESIGN.colors.primary }} className="min-h-[44px] flex-row items-center rounded-xl px-4"><IconSymbol name="arrow.left" size={17} color="white" /><Text className="ml-2 text-xs font-bold text-white">السابق</Text></Pressable><Text className="text-xs font-bold text-[#C4C4C4]">{page.current} / {page.last}</Text><Pressable disabled={pageNo >= page.last} onPress={() => goPage(pageNo + 1)} style={{ backgroundColor: pageNo >= page.last ? DESIGN.colors.surface : DESIGN.colors.primary }} className="min-h-[44px] flex-row items-center rounded-xl px-4"><Text className="mr-2 text-xs font-bold text-white">التالي</Text><IconSymbol name="arrow.right" size={17} color="white" /></Pressable></View> : null}</ScrollView> : !loading ? <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}><EmptyState title="لا توجد عناصر" body="لم يُرجع المصدر عناصر لهذا القسم." action="إعادة المحاولة" onAction={load} /></ScrollView> : <LoadingState label="نحمّل القائمة..." />}
  </View>;
}
