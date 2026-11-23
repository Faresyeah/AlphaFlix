import { Image } from "expo-image";
import { Modal, Pressable, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { BRAND } from "@/constants/brand";
import { itemKey, type MediaItem } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";
import { useLocale } from "@/lib/locale-context";

export function PreviewModal({
  item,
  visible,
  onClose,
  onOpen,
}: {
  item: MediaItem | null;
  visible: boolean;
  onClose: () => void;
  onOpen: () => void;
}) {
  const { copy } = useLocale();
  const { isFavorite, toggleFavorite, isWatchLater, toggleWatchLater } = useLibrary();
  if (!item) return null;
  const key = itemKey(item.kind, item.id);
  const fav = isFavorite(key);
  const later = isWatchLater(key);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "#000c", justifyContent: "center", padding: 20 }}>
        <Pressable
          onPress={() => undefined}
          style={{ backgroundColor: "#141414", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#2a2a2a" }}
        >
          {item.poster ? <Image source={item.poster} style={{ width: "100%", height: 220 }} contentFit="cover" /> : null}
          <View style={{ padding: 16 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={{ color: "#aaa", marginTop: 6, fontSize: 12 }}>
              {[item.type, item.year, item.status].filter(Boolean).join(" · ")}
            </Text>
            {item.story ? (
              <Text style={{ color: "#ccc", marginTop: 10, fontSize: 13, lineHeight: 20 }} numberOfLines={4}>
                {item.story}
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <Pressable
                onPress={onOpen}
                style={{ flex: 1, backgroundColor: "#fff", borderRadius: 8, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
              >
                <IconSymbol name="play.fill" size={14} color="#000" />
                <Text style={{ color: "#000", fontWeight: "800" }}>{copy.watch}</Text>
              </Pressable>
              <Pressable
                onPress={() => toggleFavorite(item)}
                style={{ backgroundColor: "#333", borderRadius: 8, paddingHorizontal: 14, justifyContent: "center" }}
              >
                <IconSymbol name={fav ? "heart.fill" : "heart"} size={18} color={fav ? BRAND.signature : "#fff"} />
              </Pressable>
              <Pressable
                onPress={() => toggleWatchLater(item)}
                style={{ backgroundColor: "#333", borderRadius: 8, paddingHorizontal: 14, justifyContent: "center" }}
              >
                <IconSymbol name={later ? "checkmark" : "plus"} size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
