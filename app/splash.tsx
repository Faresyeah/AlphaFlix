import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { BRAND } from "@/constants/brand";

export default function SplashRoute() {
  const router = useRouter();
  const opacity = useMemo(() => new Animated.Value(0), []);
  const scale = useMemo(() => new Animated.Value(0.92), []);

  useEffect(() => {
    // إخفاء splash screen الأصلية بمجرد ما يظهر هذا المكوّن
    void SplashScreen.hideAsync().catch(() => undefined);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      try {
        router.replace("/(tabs)" as never);
      } catch {
        router.replace("/(tabs)/index" as never);
      }
    }, 1800);
    return () => clearTimeout(t);
  }, [opacity, router, scale]);

  return (
    <View style={styles.root}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: "center" }}>
        <Text style={styles.logo}>{BRAND.name}</Text>
        <View style={styles.line} />
        <Text style={styles.by}>{BRAND.developer ? `By ${BRAND.developer}` : ""}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  logo: { color: "#E50914", fontSize: 48, fontWeight: "900", letterSpacing: 1 },
  line: { marginTop: 14, height: 3, width: 56, borderRadius: 2, backgroundColor: "#E50914" },
  by: { marginTop: 16, color: "#888", fontSize: 13, fontWeight: "600", letterSpacing: 0.5 },
});
