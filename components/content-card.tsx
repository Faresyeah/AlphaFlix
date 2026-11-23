import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, shadow } from "@/constants/design";
import { itemKey, type MediaItem } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";

type Props = {
  item: MediaItem;
  onPress: () => void;
  onLongPress?: () => void;
  width?: number;
  progress?: number;
  rank?: number;
  badge?: string;
};

function ContentCardBase({ item, onPress, onLongPress, width = 148, progress = 0, rank, badge }: Props) {
  const { isFavorite } = useLibrary();
  const favorite = isFavorite(itemKey(item.kind, item.id));
  const imageHeight = Math.round(width * 1.42);
  const showNew = /جديد|new|ongoing| مستمر|يعرض/i.test(`${item.status} ${item.type}`);
  const showHd = /hd|1080|bluray|fhd|4k/i.test(`${item.type} ${item.status} ${item.count}`);

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={280} style={{ width }} className="active:opacity-85">
      <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
        {typeof rank === "number" ? (
          <Text
            style={{
              fontSize: Math.min(72, width * 0.72),
              fontWeight: "900",
              color: "#fff",
              marginRight: -width * 0.18,
              marginBottom: -6,
              textShadowColor: "#E50914",
              textShadowRadius: 6,
              opacity: 0.92,
            }}
          >
            {rank}
          </Text>
        ) : null}
        <View style={{ width, backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, ...shadow }} className="overflow-hidden rounded-[16px] border">
          <View style={{ width, height: imageHeight, backgroundColor: DESIGN.colors.surfaceSoft }}>
            {item.poster ? (
              <Image source={item.poster} contentFit="cover" transition={180} recyclingKey={item.id} style={{ width: "100%", height: "100%" }} />
            ) : (
              <View className="flex-1 items-center justify-center px-3">
                <IconSymbol name="book.fill" size={28} color={DESIGN.colors.textMuted} />
                <Text numberOfLines={3} className="mt-2 text-center text-xs font-bold text-[#B8B6C8]">
                  {item.title}
                </Text>
              </View>
            )}
            <View className="absolute inset-x-0 bottom-0 h-16" style={{ backgroundColor: "#090A0F88" }} />
            <View className="absolute left-2 top-2 flex-row" style={{ gap: 4 }}>
              {showNew ? (
                <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: "#E50914" }}>
                  <Text className="text-[9px] font-black text-white">NEW</Text>
                </View>
              ) : null}
              {showHd ? (
                <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: "#2228" }}>
                  <Text className="text-[9px] font-black text-white">HD</Text>
                </View>
              ) : null}
              {badge ? (
                <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: "#E50914" }}>
                  <Text className="text-[9px] font-black text-white">{badge}</Text>
                </View>
              ) : null}
            </View>
            {favorite ? (
              <View className="absolute right-2 top-2 rounded-full bg-[#E50914] p-1.5">
                <IconSymbol name="heart.fill" size={12} color="#fff" />
              </View>
            ) : null}
            {progress > 0 ? (
              <View className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#34384A]">
                <View style={{ width: `${Math.round(Math.min(1, progress) * 100)}%`, backgroundColor: "#E50914" }} className="h-full" />
              </View>
            ) : null}
          </View>
          <View className="gap-0.5 px-2 py-2">
            <Text numberOfLines={1} className="text-xs font-bold text-[#F8F7FF]">
              {item.title}
            </Text>
            {item.rating > 0 ? (
              <Text className="text-[10px] text-[#aaa]">★ {item.rating.toFixed(1)}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const ContentCard = memo(ContentCardBase);
