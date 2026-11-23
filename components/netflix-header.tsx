import { Pressable, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { BRAND } from "@/constants/brand";

export function NetflixHeader({
  onSearch,
  onBrowse,
  transparent,
}: {
  onSearch?: () => void;
  onBrowse?: () => void;
  transparent?: boolean;
}) {
  return (
    <View
      style={{
        position: transparent ? "absolute" : "relative",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: transparent ? "transparent" : "#000000EE",
      }}
    >
      <Text style={{ color: BRAND.signature, fontSize: 24, fontWeight: "900" }}>{BRAND.name}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        {onBrowse ? (
          <Pressable onPress={onBrowse}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>تصفح</Text>
          </Pressable>
        ) : null}
        {onSearch ? (
          <Pressable onPress={onSearch} hitSlop={10}>
            <IconSymbol name="magnifyingglass" size={20} color="#fff" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
