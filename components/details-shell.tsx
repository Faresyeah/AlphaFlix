import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { BackButton } from "@/components/section-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, shadow } from "@/constants/design";
import { SchemeColors } from "@/constants/theme";
import { itemKey, type MediaItem } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";
import { useLocale } from "@/lib/locale-context";
import { useThemeContext } from "@/lib/theme-provider";

const CATEGORY_CHIPS = ["مفضلة", "أكشن", "رومانسي", "مستمر"];

export function DetailsShell({
  item,
  laterLabel = "لاحقاً",
  chips = [],
  actions,
  children,
  onWatch,
}: {
  item: MediaItem;
  laterLabel?: string;
  chips?: string[];
  actions?: ReactNode;
  children?: ReactNode;
  onWatch?: () => void;
}) {
  const { isFavorite, isWatchLater, toggleFavorite, toggleWatchLater, setCategory, categories } = useLibrary();
  const { copy } = useLocale();
  const { colorScheme } = useThemeContext();
  const [expanded, setExpanded] = useState(false);
  const key = itemKey(item.kind, item.id);
  const favorite = isFavorite(key);
  const later = isWatchLater(key);
  const userCategory = categories[key];
  const story = item.story ?? "";
  const longStory = story.length > 320;

  return (
    <View style={{ backgroundColor: SchemeColors[colorScheme].background }} className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 56 }} showsVerticalScrollIndicator={false}>
        <View className="relative h-[360px]" style={{ backgroundColor: DESIGN.colors.surfaceSoft }}>
          {item.poster ? (
            <Image source={item.poster} contentFit="cover" transition={220} style={{ width: "100%", height: "100%", opacity: 0.42 }} />
          ) : null}
          <View className="absolute inset-0" style={{ backgroundColor: DESIGN.colors.overlay }} />
          <View className="absolute inset-x-0 bottom-0 h-44" style={{ backgroundColor: "#090A0FDD" }} />
          <View className="absolute left-5 top-12">
            <BackButton light />
          </View>
          <View className="absolute bottom-6 left-5 right-5 flex-row items-end" style={{ gap: 16 }}>
            {item.poster ? (
              <Image
                source={item.poster}
                contentFit="cover"
                style={{ width: 104, height: 148, borderRadius: 18, borderWidth: 1, borderColor: DESIGN.colors.borderStrong, ...shadow }}
              />
            ) : null}
            <View className="flex-1">
              <Text numberOfLines={1} className="mb-2 text-xs font-bold text-[#FF3344]">
                {[item.type, item.year].filter(Boolean).join("  ·  ")}
              </Text>
              <Text numberOfLines={3} className="text-2xl font-black leading-8 text-[#F8F7FF]">
                {item.title}
              </Text>
              {item.author ? (
                <Text numberOfLines={1} className="mt-2 text-xs text-[#B8B6C8]">
                  {item.author}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View className="px-5 pt-6">
          {/* Netflix-style primary actions */}
          <View className="mb-4 flex-row" style={{ gap: 10 }}>
            <Pressable
              onPress={onWatch}
              disabled={!onWatch}
              style={{
                flex: 1,
                backgroundColor: onWatch ? "#fff" : "#555",
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                opacity: onWatch ? 1 : 0.5,
              }}
            >
              <IconSymbol name="play.fill" size={16} color="#000" />
              <Text style={{ color: "#000", fontWeight: "900" }}>{copy.watch}</Text>
            </Pressable>
            <Pressable
              onPress={() => void toggleWatchLater(item)}
              style={{ backgroundColor: "#333", borderRadius: 8, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" }}
            >
              <IconSymbol name={later ? "checkmark" : "plus"} size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => void toggleFavorite(item)}
              style={{ backgroundColor: "#333", borderRadius: 8, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" }}
            >
              <IconSymbol name={favorite ? "heart.fill" : "heart"} size={18} color={favorite ? "#E50914" : "#fff"} />
            </Pressable>
          </View>

          <View className="mb-5 flex-row flex-wrap" style={{ gap: 8 }}>
            {item.rating > 0 ? (
              <Chip color={DESIGN.colors.accent}>
                <IconSymbol name="sparkles" size={13} color={DESIGN.colors.accent} /> {item.rating.toFixed(1)}
              </Chip>
            ) : null}
            {item.status ? <Chip>{item.status}</Chip> : null}
            {item.count ? <Chip>{item.count}</Chip> : null}
            {chips.filter(Boolean).map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </View>

          {actions}

          {story ? (
            <View className="mb-5">
              <Text className="mb-2 text-right text-base font-black text-white">{copy.story}</Text>
              <Text className="text-right text-sm leading-7 text-[#C4C4C4]">
                {expanded || !longStory ? story : story.slice(0, 320) + "…"}
              </Text>
              {longStory ? (
                <Pressable onPress={() => setExpanded((v) => !v)} className="mt-2">
                  <Text className="text-right text-xs font-bold text-[#E50914]">{expanded ? "عرض أقل" : "المزيد"}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View className="mb-4 flex-row flex-wrap" style={{ gap: 8 }}>
            {CATEGORY_CHIPS.map((c) => (
              <Pressable key={c} onPress={() => void setCategory(key, c)} style={{ backgroundColor: userCategory === c ? "#E50914" : DESIGN.colors.surfaceRaised }} className="rounded-full px-3 py-1.5">
                <Text className="text-[11px] font-bold text-white">{c}</Text>
              </Pressable>
            ))}
          </View>

          <View className="mt-3">{children}</View>
        </View>
      </ScrollView>
    </View>
  );
}

function Chip({ children, color = DESIGN.colors.textSecondary }: { children: ReactNode; color?: string }) {
  return (
    <View style={{ backgroundColor: DESIGN.colors.surfaceRaised }} className="min-h-[32px] flex-row items-center rounded-xl px-3 py-2">
      <Text style={{ color }} className="text-xs font-semibold">
        {children}
      </Text>
    </View>
  );
}

// ✅ PrimaryButton — الآن يدعم disabled و tone
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  tone = "primary",
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  tone?: "primary" | "ghost";
}) {
  const isGhost = tone === "ghost";
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={{
        backgroundColor: isGhost ? "transparent" : "#fff",
        borderWidth: isGhost ? 1 : 0,
        borderColor: isGhost ? "#fff" : "transparent",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        marginBottom: 10,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Text style={{ color: isGhost ? "#fff" : "#000", fontWeight: "900" }}>
        {label}
      </Text>
    </Pressable>
  );
  }
