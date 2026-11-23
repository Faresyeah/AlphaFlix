import { useLocalSearchParams, useRouter } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { VideoView, useVideoPlayer } from "expo-video";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";

import { ErrorState } from "@/components/section-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";
import { itemKey, type MediaItem } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";
import { cinemaServerContentType, type CinemaServer, type CinemaWatchSource } from "./parse";
import { getCinemaServers, getCinemaWatchSource } from "./api";

export default function CinemaWatchScreen() {
  useKeepAwake();
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string; title?: string; media?: string; series?: string; season?: string }>();
  const url = typeof params.url === "string" ? params.url : "";
  const title = typeof params.title === "string" ? params.title : "المشاهدة الآن";
  const media = params.media === "episode" ? "حلقة" : "فيلم";
  const { saveProgress, saveResume, resume } = useLibrary();
  const { width, height } = useWindowDimensions();
  const [servers, setServers] = useState<CinemaServer[]>([]);
  const [selected, setSelected] = useState<CinemaServer | null>(null);
  const [source, setSource] = useState<CinemaWatchSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [error, setError] = useState("");
  const [landscape, setLandscape] = useState(false);
  const key = itemKey("cinema", url);
  const libraryItem = useMemo<MediaItem>(() => ({
    id: url,
    kind: "cinema",
    title,
    poster: null,
    type: media,
    tags: [],
    rating: 0,
    status: "",
    year: "",
    count: "",
  }), [url, title, media]);
  const restoredPosition = useRef(false);
  const streamSource = useMemo(() => source ? {
    uri: source.url,
    ...(selected && cinemaServerContentType(selected.id) ? { contentType: cinemaServerContentType(selected.id) } : {}),
  } : null, [selected, source]);
  const player = useVideoPlayer(streamSource, (instance) => { instance.loop = false; });

  const resetOrientation = useCallback(() => {
    if (Platform.OS === "web") return;
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);
    setLandscape(false);
  }, []);
  useEffect(() => () => resetOrientation(), [resetOrientation]);
  const loadServers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const rows = await getCinemaServers(url);
      setServers(rows);
      setSelected(rows[0] ?? null);
      if (!rows.length) setError("لا توجد خوادم مشاهدة معتمدة لهذا العمل.");
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر تحميل خوادم المشاهدة."); }
    finally { setLoading(false); }
  }, [url]);
  useEffect(() => { const timer = setTimeout(() => { if (url) void loadServers(); else { setLoading(false); setError("رابط العمل غير موجود."); } }, 0); return () => clearTimeout(timer); }, [loadServers, url]);

  useEffect(() => {
    let active = true;
    if (!selected || !url) return;
    const timer = setTimeout(() => {
    setSourceLoading(true); setError("");
    void getCinemaWatchSource(url, selected.id).then((result) => {
      if (!active) return;
      setSource(result);
    }).catch((e) => {
      if (active) setError(e instanceof Error ? e.message : "تعذر تجهيز رابط المشاهدة.");
    }).finally(() => { if (active) setSourceLoading(false); });
    }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, [selected, url]);

  useEffect(() => {
    if (!streamSource) return;
    try { player.play(); } catch { /* The user can start playback from native controls. */ }
  }, [player, streamSource]);
  useEffect(() => {
    restoredPosition.current = false;
  }, [streamSource]);
  useEffect(() => {
    const subscription = player.addListener("statusChange", (event) => {
      if (event.status === "error") {
        setError(event.error?.message || "تعذر تشغيل هذا الخادم؛ جرّب خادماً آخر.");
      } else if (event.status === "readyToPlay" && !restoredPosition.current) {
        const savedSeconds = Number(resume[key]);
        if (Number.isFinite(savedSeconds) && savedSeconds > 0 && savedSeconds < player.duration - 5) {
          player.currentTime = savedSeconds;
        }
        restoredPosition.current = true;
      }
    });
    return () => subscription.remove();
  }, [key, player, resume]);
  useEffect(() => {
    if (!streamSource) return;
    const timer = setInterval(() => {
      const duration = player.duration;
      if (duration > 0) {
        void saveProgress(key, Math.min(0.99, player.currentTime / duration), libraryItem);
        void saveResume(key, String(Math.floor(player.currentTime)));
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [key, player, saveProgress, saveResume, streamSource, libraryItem]);

  const toggleLandscape = async () => {
    if (Platform.OS === "web") {
      try { await ScreenOrientation.lockAsync(landscape ? ScreenOrientation.OrientationLock.PORTRAIT_UP : ScreenOrientation.OrientationLock.LANDSCAPE); setLandscape((value) => !value); } catch { setError("قد لا يدعم المتصفح تدوير الشاشة؛ استخدم أزرار ملء الشاشة في المشغل."); }
      return;
    }
    try {
      await ScreenOrientation.lockAsync(landscape ? ScreenOrientation.OrientationLock.PORTRAIT_UP : ScreenOrientation.OrientationLock.LANDSCAPE);
      setLandscape((value) => !value);
    } catch { setError("تعذر تغيير اتجاه الشاشة على هذا الجهاز."); }
  };
  const isWide = width > height;

  return <View style={{ flex: 1, backgroundColor: "#000000", paddingTop: isWide ? 4 : 0 }}>
    {!isWide ? <View className="flex-row items-center px-4 py-3" style={{ gap: 11 }}><Pressable onPress={() => { resetOrientation(); router.back(); }} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: "#161616" }}><IconSymbol name="arrow.left" size={21} color="white" /></Pressable><View className="flex-1"><Text numberOfLines={1} className="text-right text-sm font-black text-white">{title}</Text><Text className="mt-1 text-right text-[10px] text-[#A4A4B2]">{media} · المشاهدة داخل التطبيق</Text></View><Pressable onPress={() => void toggleLandscape()} className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "#161616" }}><IconSymbol name="fullscreen" size={20} color="white" /></Pressable></View> : <Pressable onPress={() => void toggleLandscape()} style={{ position: "absolute", zIndex: 5, left: 12, top: 12, backgroundColor: "#111111CC" }} className="h-10 w-10 items-center justify-center rounded-full"><IconSymbol name="fullscreen.exit" size={21} color="white" /></Pressable>}
    <View style={{ width: "100%", height: isWide ? "100%" : Math.min(Math.round(width * 9 / 16), 340), backgroundColor: "#000000" }}>
      {streamSource ? <VideoView player={player} style={{ width: "100%", height: "100%" }} nativeControls fullscreenOptions={{ enable: true }} onFullscreenEnter={() => { if (Platform.OS !== "web") void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => undefined); setLandscape(true); }} onFullscreenExit={resetOrientation} allowsPictureInPicture /> : <View className="flex-1 items-center justify-center">{loading || sourceLoading ? <><ActivityIndicator color={DESIGN.colors.primary} size="large" /><Text className="mt-3 text-xs text-[#C4C4C4]">{loading ? "نحمّل الخوادم الآمنة..." : `نجهّز ${selected?.name ?? "المشاهدة"}...`}</Text></> : <Text className="px-8 text-center text-sm leading-6 text-[#C4C4C4]">{error || "اختر خادماً لبدء المشاهدة."}</Text>}</View>}
    </View>
    {!isWide ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, paddingBottom: 34 }}>
      <View className="mb-4 flex-row items-center justify-between"><Text className="text-base font-black text-white">اختر خادم المشاهدة</Text><Text className="text-[10px] text-[#A4A4B2]">{servers.length} خوادم معتمدة</Text></View>
      <View className="flex-row flex-wrap" style={{ gap: 9 }}>{servers.map((server) => { const active = server.id === selected?.id; return <Pressable key={server.id} onPress={() => { setSelected(server); setSource(null); setError(""); }} style={{ backgroundColor: active ? DESIGN.colors.primary : DESIGN.colors.surface, borderColor: active ? DESIGN.colors.primary : DESIGN.colors.border }} className="min-h-[48px] min-w-[108px] flex-row items-center justify-center rounded-xl border px-3 active:opacity-80"><IconSymbol name={active ? "play.fill" : "tv.fill"} size={16} color="white" /><Text className="ml-2 text-xs font-bold text-white">{server.name}</Text></Pressable>; })}</View>
      {error ? <View className="mt-4"><ErrorState message={error} onRetry={() => { if (!selected) return void loadServers(); setSourceLoading(true); setError(""); void getCinemaWatchSource(url, selected.id).then(setSource).catch((e) => setError(e instanceof Error ? e.message : "تعذر التشغيل.")).finally(() => setSourceLoading(false)); }} /></View> : null}
      <View className="mt-5 rounded-2xl border p-4" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }}><Text className="mb-2 text-right text-xs font-bold text-white">المشاهدة الآمنة داخل التطبيق</Text><Text className="text-right text-[11px] leading-5 text-[#A4A4B2]">يتم عرض خوادم المشاهدة الستة المسموحة فقط. إذا لم يعمل أحدها، اختر خادماً آخر أو أعد المحاولة. قد يختلف توفر التشغيل حسب المصدر والاتصال.</Text></View>
    </ScrollView> : null}
  </View>;
}
