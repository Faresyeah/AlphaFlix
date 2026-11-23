import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { BackButton } from "@/components/section-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";
import type { MediaItem } from "@/lib/core/types";

export function CinemaHeader({ title, subtitle, back = true }: { title: string; subtitle?: string; back?: boolean }) {
  return (
    <View className="flex-row items-center px-5 pb-3 pt-3" style={{ gap: 12 }}>
      {back ? <BackButton /> : <View style={{ width: 44 }} />}
      <View className="flex-1">
        <Text numberOfLines={1} className="text-right text-lg font-black text-white">{title}</Text>
        {subtitle ? <Text numberOfLines={1} className="mt-1 text-right text-xs text-[#A4A4B2]">{subtitle}</Text> : null}
      </View>
      <View style={{ backgroundColor: DESIGN.colors.primary + "1F" }} className="h-11 w-11 items-center justify-center rounded-2xl">
        <IconSymbol name="tv.fill" size={21} color={DESIGN.colors.primary} />
      </View>
    </View>
  );
}

export function CinemaCard({ item, width = 138, onPress }: { item: MediaItem; width?: number; onPress: () => void }) {
  const height = Math.round(width * 1.42);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`تفاصيل ${item.title}`} onPress={onPress} style={{ width }} className="active:opacity-80">
      <View style={{ width, height, backgroundColor: DESIGN.colors.surfaceRaised, borderColor: DESIGN.colors.border }} className="overflow-hidden rounded-2xl border">
        {item.poster ? <Image source={item.poster} contentFit="cover" transition={180} style={{ width: "100%", height: "100%" }} /> : <View className="flex-1 items-center justify-center"><IconSymbol name="tv.fill" size={32} color={DESIGN.colors.textMuted} /></View>}
        <View className="absolute inset-x-0 bottom-0 h-20" style={{ backgroundColor: "#00000088" }} />
        <View style={{ backgroundColor: DESIGN.colors.primary }} className="absolute bottom-2 left-2 rounded-lg px-2 py-1"><Text className="text-[9px] font-black text-white">{item.type}</Text></View>
        {item.year ? <View style={{ backgroundColor: "#111111CC" }} className="absolute right-2 top-2 rounded-md px-2 py-1"><Text className="text-[9px] font-bold text-white">{item.year}</Text></View> : null}
      </View>
      <Text numberOfLines={2} className="mt-2 text-right text-xs font-bold leading-5 text-[#F5F5F7]">{item.title}</Text>
    </Pressable>
  );
}

export function CinemaAction({ title, subtitle, icon, onPress, compact = false }: { title: string; subtitle?: string; icon: Parameters<typeof IconSymbol>[0]["name"]; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }} className={`flex-row items-center rounded-2xl border active:opacity-80 ${compact ? "min-h-[46px] px-3" : "min-h-[74px] px-4"}`}>
      <View style={{ backgroundColor: DESIGN.colors.primary + "20" }} className="mr-3 h-10 w-10 items-center justify-center rounded-xl"><IconSymbol name={icon} size={19} color={DESIGN.colors.primary} /></View>
      <View className="flex-1"><Text className="text-right text-sm font-bold text-white">{title}</Text>{subtitle ? <Text className="mt-1 text-right text-[10px] text-[#A4A4B2]">{subtitle}</Text> : null}</View>
      <IconSymbol name="chevron.right" size={18} color={DESIGN.colors.textMuted} />
    </Pressable>
  );
}

export function CinemaPill({ title, selected, onPress }: { title: string; selected?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ backgroundColor: selected ? DESIGN.colors.primary : DESIGN.colors.surface, borderColor: selected ? DESIGN.colors.primary : DESIGN.colors.border }} className="min-h-[38px] justify-center rounded-full border px-4 active:opacity-80"><Text className="text-xs font-bold" style={{ color: selected ? "#FFFFFF" : DESIGN.colors.textSecondary }}>{title}</Text></Pressable>;
}
