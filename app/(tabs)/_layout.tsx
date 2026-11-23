import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";
import { SchemeColors } from "@/constants/theme";
import { useLocale } from "@/lib/locale-context";
import { useThemeContext } from "@/lib/theme-provider";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { copy } = useLocale();
  const { colorScheme } = useThemeContext();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 10);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: SchemeColors[colorScheme].primary,
        tabBarInactiveTintColor: SchemeColors[colorScheme].muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
        tabBarStyle: {
          paddingTop: 9,
          paddingBottom: bottomPadding,
          height: 62 + bottomPadding,
          backgroundColor: SchemeColors[colorScheme].surface,
          borderTopColor: SchemeColors[colorScheme].border,
          borderTopWidth: 1,
        },
        tabBarItemStyle: { paddingHorizontal: 3 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: copy.home, tabBarIcon: ({ color, focused }) => <TabIcon name="house.fill" color={color} focused={focused} /> }} />
      <Tabs.Screen name="cinema" options={{ title: "السينما", tabBarIcon: ({ color, focused }) => <TabIcon name="tv.fill" color={color} focused={focused} /> }} />
      <Tabs.Screen name="library" options={{ title: copy.library, tabBarIcon: ({ color, focused }) => <TabIcon name="bookmark.fill" color={color} focused={focused} /> }} />
      <Tabs.Screen name="downloads" options={{ title: copy.downloads, tabBarIcon: ({ color, focused }) => <TabIcon name="download.fill" color={color} focused={focused} /> }} />
      <Tabs.Screen name="rights" options={{ title: copy.settings, tabBarIcon: ({ color, focused }) => <TabIcon name="person.fill" color={color} focused={focused} /> }} />
    </Tabs>
  );
}

function TabIcon({ name, color, focused }: { name: Parameters<typeof IconSymbol>[0]["name"]; color: Parameters<typeof IconSymbol>[0]["color"]; focused: boolean }) {
  return (
    <View style={{ minWidth: 44, alignItems: "center", justifyContent: "center", borderRadius: 16, paddingVertical: 3, backgroundColor: focused ? `${DESIGN.colors.primary}18` : "transparent" }}>
      <IconSymbol size={focused ? 23 : 21} name={name} color={color} />
    </View>
  );
}
