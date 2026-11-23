import { Pressable, ScrollView, Text, View } from "react-native";

import { SchemeColors } from "@/constants/theme";
import { SECTION_KINDS, type SectionKind } from "@/lib/core/types";
import { useThemeContext } from "@/lib/theme-provider";

export const SECTION_LABELS: Record<SectionKind, { ar: string; en: string }> = {
  anime: { ar: "أنمي", en: "Anime" },
  manhwa: { ar: "مانهوا", en: "Manhwa" },
  manga: { ar: "مانغا", en: "Manga" },
  novels: { ar: "روايات", en: "Novels" },
  books: { ar: "كتب", en: "Books" },
  cinema: { ar: "السينما", en: "Cinema" },
};

export function SectionTabs({ value, onChange, language }: { value: SectionKind; onChange: (kind: SectionKind) => void; language: "ar" | "en" }) {
  const { colorScheme } = useThemeContext();
  const palette = SchemeColors[colorScheme];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 22, paddingHorizontal: 20, paddingBottom: 2 }}>
      {SECTION_KINDS.map((kind) => {
        const active = kind === value;
        return (
          <Pressable key={kind} onPress={() => onChange(kind)} className="items-center px-1 py-2 active:opacity-70">
            <Text style={{ color: active ? palette.foreground : palette.muted }} className="text-sm font-black">{SECTION_LABELS[kind][language]}</Text>
            <View style={{ backgroundColor: active ? palette.primary : "transparent" }} className="mt-2 h-1 w-7 rounded-full" />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
