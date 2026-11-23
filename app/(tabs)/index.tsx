import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SectionHome } from "@/components/section-home";
import { SectionTabs } from "@/components/section-tabs";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";
import { SchemeColors } from "@/constants/theme";
import { animeService } from "@/features/anime/api";
import { booksService } from "@/features/books/api";
import { mangaService } from "@/features/manga/api";
import { manhwaService } from "@/features/manhwa/api";
import { novelsService } from "@/features/novels/api";
import { SECTION_KINDS, type SectionKind } from "@/lib/core/types";
import { useLocale } from "@/lib/locale-context";
import { readStored, STORAGE_KEYS, writeStored } from "@/lib/storage";
import { useThemeContext } from "@/lib/theme-provider";

function SectionBody({ kind, language, onChange }: { kind: SectionKind; language: "ar" | "en"; onChange: (kind: SectionKind) => void }) {
  const tabs = <SectionTabs value={kind} onChange={onChange} language={language} />;
  switch (kind) {
    case "anime": return <SectionHome service={animeService} topContent={tabs} />;
    case "manhwa": return <SectionHome service={manhwaService} topContent={tabs} />;
    case "manga": return <SectionHome service={mangaService} topContent={tabs} />;
    case "novels": return <SectionHome service={novelsService} topContent={tabs} />;
    case "books": return <SectionHome service={booksService} topContent={tabs} />;
  }
}

export default function HomeScreen() {
  const { language, toggleLanguage } = useLocale();
  const { colorScheme, toggleColorScheme } = useThemeContext();
  const [kind, setKind] = useState<SectionKind>("anime");
  useEffect(() => { let active = true; void readStored<SectionKind>(STORAGE_KEYS.lastSection, "anime").then((stored) => { if (active && SECTION_KINDS.includes(stored)) setKind(stored); }); return () => { active = false; }; }, []);
  const choose = (next: SectionKind) => { setKind(next); void writeStored(STORAGE_KEYS.lastSection, next); };

  return <SafeAreaView edges={["top"]} style={{ backgroundColor: SchemeColors[colorScheme].background }} className="flex-1">
    <View className="px-5 pb-1 pt-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1"><View className="flex-row items-center" style={{ gap: 7 }}><View style={{ backgroundColor: DESIGN.colors.secondary }} className="h-2 w-2 rounded-full" /><Text className="text-[10px] font-bold uppercase tracking-[3px] text-[#C4C4C4]">ALPHAFLIX</Text></View><Text className="mt-1 text-[28px] font-black text-[#FFFFFF]">Alpha<Text className="text-[#E50914]">Flix</Text></Text></View>
        <View className="flex-row" style={{ gap: 8 }}><Pressable onPress={toggleColorScheme} accessibilityLabel="تبديل وضع النهار والليل" style={{ backgroundColor: DESIGN.colors.surfaceRaised, borderColor: DESIGN.colors.border }} className="h-11 w-11 items-center justify-center rounded-2xl border active:opacity-80"><IconSymbol name={colorScheme === "dark" ? "sunny" : "dark_mode"} size={19} color={DESIGN.colors.primary} /></Pressable><Pressable onPress={toggleLanguage} style={{ backgroundColor: DESIGN.colors.surfaceRaised, borderColor: DESIGN.colors.border }} className="h-11 min-w-[48px] items-center justify-center rounded-2xl border px-3 active:opacity-80"><Text className="text-xs font-black" style={{ color: DESIGN.colors.primary }}>{language === "ar" ? "EN" : "عربي"}</Text></Pressable></View>
      </View>
    </View>
    <View key={kind} className="flex-1"><SectionBody kind={kind} language={language} onChange={choose} /></View>
  </SafeAreaView>;
}
