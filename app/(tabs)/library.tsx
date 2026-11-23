import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ContentCard } from "@/components/content-card";
import { SECTION_LABELS } from "@/components/section-tabs";
import { EmptyState, SectionTitle } from "@/components/section-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";
import { SchemeColors } from "@/constants/theme";
import { itemRoute } from "@/lib/core/routes";
import { itemKey, SECTION_KINDS, type SectionKind } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";
import { useLocale } from "@/lib/locale-context";
import { useThemeContext } from "@/lib/theme-provider";

const tabs = ["favorites", "later", "progress"] as const;
type Tab = (typeof tabs)[number];

export default function LibraryScreen() {
  const router = useRouter(); const { width } = useWindowDimensions(); const { favorites, watchLater, progress, progressItems } = useLibrary(); const { language, copy } = useLocale(); const [tab, setTab] = useState<Tab>("favorites"); const [filter, setFilter] = useState<SectionKind | "all">("all"); const { colorScheme } = useThemeContext();
  const items = useMemo(() => { let list = tab === "favorites" ? Object.values(favorites) : tab === "later" ? Object.values(watchLater) : Object.values({ ...favorites, ...watchLater, ...progressItems }).filter((i) => (progress[itemKey(i.kind, i.id)] ?? 0) > 0); if (filter !== "all") list = list.filter((i) => i.kind === filter); return list; }, [favorites, watchLater, progress, progressItems, tab, filter]);
  const label = (t: Tab) => t === "favorites" ? copy.favorite : t === "later" ? copy.later : copy.continue;
  const cardWidth = Math.floor((Math.min(width, 900) - 40 - 24) / (width >= 700 ? 5 : 3));
  return <SafeAreaView edges={["top"]} style={{ backgroundColor: SchemeColors[colorScheme].background }} className="flex-1"><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
    <View className="mb-6 flex-row items-end justify-between"><View><Text className="text-[10px] font-bold uppercase tracking-[3px] text-[#E50914]">YOUR COLLECTION</Text><Text className="mt-1 text-3xl font-black text-[#F8F7FF]">{copy.library}</Text></View><View style={{ backgroundColor: DESIGN.colors.primary + "18" }} className="rounded-2xl p-3"><IconSymbol name="bookmark.fill" size={22} color={DESIGN.colors.primary} /></View></View>
    <View style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }} className="mb-5 flex-row rounded-2xl border p-1">{tabs.map((t) => <Pressable key={t} onPress={() => setTab(t)} style={{ backgroundColor: tab === t ? DESIGN.colors.primary : "transparent" }} className="min-h-[44px] flex-1 items-center justify-center rounded-xl px-2"><Text className="text-center text-xs font-bold" style={{ color: tab === t ? DESIGN.colors.background : DESIGN.colors.textSecondary }}>{label(t)}</Text></Pressable>)}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} className="mb-6">{(["all", ...SECTION_KINDS, "cinema"] as const).map((k) => <Pressable key={k} onPress={() => setFilter(k)} style={{ borderColor: filter === k ? DESIGN.colors.primary : DESIGN.colors.border, backgroundColor: filter === k ? DESIGN.colors.primary + "20" : DESIGN.colors.surface }} className="rounded-full border px-4 py-2"><Text className="text-xs font-bold" style={{ color: filter === k ? DESIGN.colors.primary : DESIGN.colors.textSecondary }}>{k === "all" ? (language === "ar" ? "الكل" : "All") : SECTION_LABELS[k][language]}</Text></Pressable>)}</ScrollView>
    <SectionTitle title={label(tab)} />
    {items.length ? <View className="flex-row flex-wrap" style={{ gap: 12 }}>{items.map((item) => <ContentCard key={`${tab}-${itemKey(item.kind, item.id)}`} item={item} width={cardWidth} progress={progress[itemKey(item.kind, item.id)] ?? 0} onPress={() => router.push(itemRoute(item) as never)} />)}</View> : <EmptyState title={copy.noItems} body={language === "ar" ? "أضف أعمالاً من الصفحة الرئيسية لتظهر هنا." : "Add titles from Home and they will appear here."} action={language === "ar" ? "استكشف" : "Explore"} onAction={() => router.push("/" as never)} />}
    <View style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }} className="mt-5 rounded-2xl border p-4"><View className="flex-row items-center" style={{ gap: 8 }}><IconSymbol name="sparkles" size={17} color={DESIGN.colors.accent} /><Text className="text-sm font-bold text-[#F8F7FF]">محفوظة على جهازك</Text></View><Text className="mt-2 text-xs leading-5 text-[#B8B6C8]">المفضلة والتقدم وآخر موضع قراءة تبقى في ذاكرة جهازك، بدون حساب أو تسجيل دخول.</Text></View>
  </ScrollView></SafeAreaView>;
}
