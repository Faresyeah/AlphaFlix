import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { BRAND } from "@/constants/brand";
import { SchemeColors } from "@/constants/theme";
import { useLibrary } from "@/lib/library-context";
import { useLocale } from "@/lib/locale-context";
import { useThemeContext } from "@/lib/theme-provider";
import { enableNotifications, getNotificationsEnabled, setNotificationsEnabled } from "@/lib/notifications";

function Row({
  label,
  value,
  onPress,
  colors,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  colors: (typeof SchemeColors)["dark"];
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {value ? <Text style={{ color: colors.muted, fontSize: 13 }}>{value}</Text> : null}
        {onPress ? <IconSymbol name="chevron.right" size={14} color={colors.muted} /> : null}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { favorites, watchLater, progress } = useLibrary();
  const { language, copy, toggleLanguage } = useLocale();
  const { colorScheme, toggleColorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];
  const [notifOn, setNotifOn] = useState(false);
  useEffect(() => { void getNotificationsEnabled().then(setNotifOn); }, []);
  const toggleNotif = async () => {
    if (notifOn) {
      await setNotificationsEnabled(false);
      setNotifOn(false);
      return;
    }
    const res = await enableNotifications();
    setNotifOn(res.ok);
    Alert.alert(copy.notifications, res.message);
  };

  const stats = useMemo(() => {
    const fav = Object.keys(favorites).length;
    const later = Object.keys(watchLater).length;
    const prog = Object.keys(progress).length;
    return { fav, later, prog, total: fav + later };
  }, [favorites, watchLater, progress]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: BRAND.signature, fontSize: 11, fontWeight: "800", letterSpacing: 2 }}>SETTINGS</Text>
        <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "900", marginTop: 4 }}>{copy.settings}</Text>

        {/* About */}
        <Text style={{ color: colors.muted, marginTop: 22, marginBottom: 8, fontWeight: "700" }}>{copy.about}</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: BRAND.signature, fontSize: 22, fontWeight: "900" }}>{BRAND.name}</Text>
          <Text style={{ color: colors.foreground, marginTop: 10, lineHeight: 22, fontSize: 14 }}>{copy.aboutBody}</Text>
          <Text style={{ color: colors.muted, marginTop: 14, fontWeight: "700" }}>{copy.by}</Text>
        </View>

        {/* Stats */}
        <Text style={{ color: colors.muted, marginTop: 22, marginBottom: 8, fontWeight: "700" }}>{copy.stats}</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: copy.favorite, value: stats.fav },
            { label: copy.later, value: stats.later },
            { label: copy.continue, value: stats.prog },
          ].map((s) => (
            <View
              key={s.label}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: BRAND.signature, fontSize: 20, fontWeight: "900" }}>{s.value}</Text>
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4, fontWeight: "600" }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Preferences */}
        <Text style={{ color: colors.muted, marginTop: 22, marginBottom: 8, fontWeight: "700" }}>{copy.settings}</Text>
        <Row
          colors={colors}
          label={copy.language}
          value={language === "ar" ? "العربية" : "English"}
          onPress={toggleLanguage}
        />
        <Row
          colors={colors}
          label={copy.theme}
          value={colorScheme === "dark" ? (language === "ar" ? "داكن" : "Dark") : language === "ar" ? "فاتح" : "Light"}
          onPress={toggleColorScheme}
        />
        <Row
          colors={colors}
          label={copy.notifications}
          value={notifOn ? (language === "ar" ? "مفعّلة" : "On") : (language === "ar" ? "إيقاف" : "Off")}
          onPress={() => void toggleNotif()}
        />

        {/* Developer */}
        <Text style={{ color: colors.muted, marginTop: 22, marginBottom: 8, fontWeight: "700" }}>{copy.developer}</Text>
        <Row
          colors={colors}
          label="Instagram"
          value={BRAND.instagramHandle}
          onPress={() => void Linking.openURL(BRAND.instagram)}
        />
        <Row colors={colors} label={copy.version} value="1.0.0" />

        <Text style={{ color: "#555", textAlign: "center", marginTop: 28, fontSize: 12 }}>
          {BRAND.name} · {copy.by}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
