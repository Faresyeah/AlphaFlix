import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";
import { SchemeColors } from "@/constants/theme";
import { useThemeContext } from "@/lib/theme-provider";

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <View className="flex-1 flex-row items-center" style={{ gap: 10 }}>
        <View style={{ backgroundColor: DESIGN.colors.primary }} className="h-6 w-1 rounded-full" />
        <Text numberOfLines={1} className="text-lg font-black text-[#F8F7FF]">{title}</Text>
      </View>
      {action && onAction ? <Pressable onPress={onAction} className="rounded-full px-2 py-1 active:opacity-70"><Text className="text-xs font-bold text-[#E50914]">{action}</Text></Pressable> : null}
    </View>
  );
}

export function EmptyState({ title, body, action, onAction }: { title: string; body?: string; action?: string; onAction?: () => void }) {
  const { colorScheme } = useThemeContext();
  return (
    <View style={{ borderColor: SchemeColors[colorScheme].border, backgroundColor: SchemeColors[colorScheme].surface }} className="my-3 items-center rounded-[24px] border border-dashed px-6 py-10">
      <View style={{ backgroundColor: DESIGN.colors.primary + "18" }} className="mb-3 rounded-full p-4"><IconSymbol name="sparkles" size={26} color={DESIGN.colors.primary} /></View>
      <Text className="mb-2 text-center text-base font-bold text-[#F8F7FF]">{title}</Text>
      {body ? <Text className="mb-5 text-center text-sm leading-6 text-[#B8B6C8]">{body}</Text> : null}
      {action && onAction ? <Pressable onPress={onAction} style={{ backgroundColor: DESIGN.colors.primary }} className="rounded-full px-5 py-3 active:opacity-80"><Text className="font-bold text-[#090A0F]">{action}</Text></Pressable> : null}
    </View>
  );
}

export function ErrorState({ onRetry, message }: { onRetry: () => void; message?: string }) {
  return (
    <View style={{ borderColor: DESIGN.colors.error + "66", backgroundColor: DESIGN.colors.error + "12" }} className="my-4 items-center rounded-[24px] border px-6 py-8">
      <IconSymbol name="close" size={28} color={DESIGN.colors.error} />
      <Text className="mb-2 mt-3 text-base font-bold text-[#F8B3C5]">تعذر تحميل المحتوى</Text>
      <Text className="mb-5 text-center text-sm leading-6 text-[#D8BAC4]">{message ?? "تحقق من اتصالك ثم حاول مرة أخرى."}</Text>
      <Pressable onPress={onRetry} style={{ backgroundColor: DESIGN.colors.secondary }} className="rounded-full px-5 py-3 active:opacity-80"><Text className="font-bold text-[#24101D]">إعادة المحاولة</Text></Pressable>
    </View>
  );
}

export function LoadingState({ label = "جارٍ التحميل..." }: { label?: string }) {
  return <View className="items-center justify-center py-16"><View className="h-12 flex-row items-center justify-center" style={{ gap: 5 }}><View style={{ backgroundColor: DESIGN.colors.primary, height: 18 }} className="w-1.5 rounded-full" /><View style={{ backgroundColor: DESIGN.colors.primary, height: 32 }} className="w-1.5 rounded-full" /><View style={{ backgroundColor: DESIGN.colors.primary, height: 24 }} className="w-1.5 rounded-full" /><View style={{ backgroundColor: DESIGN.colors.primary, height: 38 }} className="w-1.5 rounded-full" /><View style={{ backgroundColor: DESIGN.colors.primary, height: 22 }} className="w-1.5 rounded-full" /></View><Text className="mt-4 text-sm font-semibold text-[#C4C4C4]">{label}</Text><Text className="mt-1 text-[10px] tracking-[2px] text-[#858585]">DAMEN MEDIA</Text></View>;
}

export function FullScreenLoading({ label }: { label?: string }) { const { colorScheme } = useThemeContext(); return <View style={{ backgroundColor: SchemeColors[colorScheme].background }} className="flex-1"><LoadingState label={label} /></View>; }

export function BackButton({ onPress, light }: { onPress?: () => void; light?: boolean }) {
  const router = useRouter();
  return <Pressable onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace("/" as never)))} hitSlop={8} style={{ backgroundColor: light ? "#090A0FBB" : DESIGN.colors.surfaceRaised, borderColor: DESIGN.colors.border }} className="h-11 w-11 items-center justify-center rounded-full border active:opacity-70"><IconSymbol name="arrow.left" size={22} color={DESIGN.colors.text} /></Pressable>;
}
