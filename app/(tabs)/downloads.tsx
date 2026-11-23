import { useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/section-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";
import { SchemeColors } from "@/constants/theme";
import { useLibrary } from "@/lib/library-context";
import { useLocale } from "@/lib/locale-context";
import { useThemeContext } from "@/lib/theme-provider";

export default function DownloadsScreen() {
  const router = useRouter(); const { downloads } = useLibrary(); const { copy, language } = useLocale(); const { colorScheme } = useThemeContext();
  return <SafeAreaView edges={["top"]} style={{ backgroundColor: SchemeColors[colorScheme].background }} className="flex-1"><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
    <View className="mb-6 flex-row items-end justify-between"><View><Text className="text-[10px] font-bold uppercase tracking-[3px] text-[#E50914]">OFFLINE QUEUE</Text><Text className="mt-1 text-3xl font-black text-[#F8F7FF]">{copy.downloads}</Text><Text className="mt-2 text-sm leading-6 text-[#B8B6C8]">{copy.downloadsReady}</Text></View><View style={{ backgroundColor: DESIGN.colors.secondary + "18" }} className="rounded-2xl p-3"><IconSymbol name="download.fill" size={22} color={DESIGN.colors.secondary} /></View></View>
    {!downloads.length ? <EmptyState title={language === "ar" ? "لا توجد تنزيلات بعد" : "No downloads yet"} body={language === "ar" ? "اختر تنزيل من شاشة المشاهدة أو صفحة الكتاب وسيظهر الرابط هنا." : "Choose Download on a watch screen and it will appear here."} action={language === "ar" ? "العودة للرئيسية" : "Back home"} onAction={() => router.push("/" as never)} /> : downloads.map((entry) => <View key={entry.id} style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }} className="mb-3 rounded-2xl border p-4"><View className="mb-4 flex-row items-start justify-between"><View className="flex-1"><Text className="text-base font-bold text-[#F8F7FF]">{entry.title}</Text><Text className="mt-1 text-xs text-[#B8B6C8]">{entry.episode} · {entry.quality}</Text></View><View style={{ backgroundColor: DESIGN.colors.primary + "18" }} className="rounded-full px-2 py-1"><Text className="text-[10px] font-bold text-[#E50914]">{(() => { try { return new URL(entry.url).hostname.replace(/^www\./, ""); } catch { return "link"; } })()}</Text></View></View><Pressable onPress={() => void Linking.openURL(entry.url)} style={{ backgroundColor: DESIGN.colors.primary }} className="flex-row items-center justify-center rounded-xl px-4 py-3 active:opacity-80"><IconSymbol name="download.fill" size={17} color={DESIGN.colors.background} /><Text className="ml-2 text-center text-sm font-bold text-[#090A0F]">{language === "ar" ? "فتح رابط التنزيل" : "Open download link"}</Text></Pressable></View>)}
  </ScrollView></SafeAreaView>;
}
