import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { BRAND, COPY } from "@/constants/brand";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { LibraryProvider, useLibrary } from "@/lib/library-context";
import { LocaleProvider } from "@/lib/locale-context";
import { readStored, STORAGE_KEYS, writeStored } from "@/lib/storage";
import { ThemeProvider } from "@/lib/theme-provider";
import { createTRPCClient, trpc } from "@/lib/trpc";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = { anchor: "(tabs)" };

/** يخفي الـ splash الأصلي فوراً + إعادة محاولات قصيرة */
function BootHideSplash() {
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);
    const t1 = setTimeout(() => void SplashScreen.hideAsync().catch(() => undefined), 500);
    const t2 = setTimeout(() => void SplashScreen.hideAsync().catch(() => undefined), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return null;
}

/** إخفاء إضافي بعد جاهزية التخزين + مهلة أمان */
function HideNativeSplash() {
  const { ready } = useLibrary();

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => undefined);
    }, 50);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    const t = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => undefined);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  return null;
}

function ChannelNotice() {
  const [shown, setShown] = useState(false);
  const { ready } = useLibrary();

  useEffect(() => {
    if (!ready || shown) return;
    let active = true;
    readStored<boolean>(STORAGE_KEYS.whatsappNotice, false).then((seen) => {
      if (!active || seen) return;
      void writeStored(STORAGE_KEYS.whatsappNotice, true);
      setShown(true);
      setTimeout(
        () =>
          Alert.alert(COPY.ar.noticeTitle, COPY.ar.noticeBody, [
            { text: COPY.ar.laterButton, style: "cancel" },
            { text: COPY.ar.join, onPress: () => void Linking.openURL(BRAND.whatsappChannel) },
          ]),
        500,
      );
    });
    return () => {
      active = false;
    };
  }, [ready, shown]);

  return null;
}

function AppContent() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;
  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  const providerInitialMetrics = useMemo(
    () => ({
      ...(initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame }),
      insets: {
        ...initialInsets,
        top: Math.max(initialInsets.top, 16),
        bottom: Math.max(initialInsets.bottom, 12),
      },
    }),
    [initialInsets, initialFrame],
  );

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <BootHideSplash />
          <HideNativeSplash />
          <ChannelNotice />
          <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
            <Stack.Screen name="splash" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="oauth/callback" />
          </Stack>
          <StatusBar style="light" />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  if (Platform.OS === "web") {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>{content}</SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <LocaleProvider>
      <LibraryProvider>
        <AppContent />
      </LibraryProvider>
    </LocaleProvider>
  );
}
