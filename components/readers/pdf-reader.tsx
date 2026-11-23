import { useKeepAwake } from "expo-keep-awake";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform, Pressable, Text, TextInput, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { BackButton, ErrorState, LoadingState } from "@/components/section-ui";
import { PDF_VIEWER_HTML } from "@/components/readers/pdf-html";
import { useLibrary } from "@/lib/library-context";

const CHUNK = 256 * 1024;
const FETCH_HEADERS = {
  Accept: "application/pdf,*/*",
  Referer: "https://www.alarabimag.com/",
  "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-A325F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36",
};

/** ذاكرة لآخر ملف فقط (حتى لا نملأ الذاكرة بملفات ضخمة). */
let lastFile: { url: string; base64: string } | null = null;

type Phase = "downloading" | "preparing" | "ready" | "error";
type Failure = "network" | "notpdf" | "cdn" | "parse";

async function downloadBase64(url: string): Promise<string> {
  if (lastFile?.url === url) return lastFile.base64;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180000);
  try {
    const response = await fetch(url, { headers: FETCH_HEADERS, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("READ_FAILED"));
      reader.onloadend = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.readAsDataURL(blob);
    });
    // "%PDF-" بصيغة base64 تبدأ بـ JVBER
    if (!base64.startsWith("JVBER")) throw new Error("NOT_PDF");
    lastFile = { url, base64 };
    return base64;
  } finally {
    clearTimeout(timer);
  }
}

export function PdfReader({ resumeKey, title, url, fallbackUrl }: { resumeKey: string; title: string; url: string; fallbackUrl?: string | null }) {
  useKeepAwake();
  const { resume, saveResume, saveProgress } = useLibrary();
  const webRef = useRef<WebView>(null);
  const initialPage = Math.max(1, parseInt(resume[resumeKey] ?? "1", 10) || 1);
  const startPage = useRef(initialPage);
  const [phase, setPhase] = useState<Phase>("downloading");
  const [failure, setFailure] = useState<Failure>("network");
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [jump, setJump] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const base64Ref = useRef<string | null>(null);
  const viewerReady = useRef(false);
  const sent = useRef(false);

  const fail = useCallback((f: Failure) => {
    setFailure(f);
    setPhase("error");
  }, []);

  const send = useCallback(() => {
    const data = base64Ref.current;
    if (!data || !viewerReady.current || sent.current || !webRef.current) return;
    sent.current = true;
    setPhase("preparing");
    for (let i = 0; i < data.length; i += CHUNK) {
      webRef.current.injectJavaScript(`window.__chunk(${JSON.stringify(data.slice(i, i + CHUNK))});true;`);
    }
    webRef.current.injectJavaScript(`window.__open(${startPage.current});true;`);
  }, []);

  useEffect(() => {
    let active = true;
    base64Ref.current = null;
    sent.current = false;
    viewerReady.current = false; // المشاهد يُعاد إنشاؤه (key) عند كل محاولة
    downloadBase64(url)
      .then((data) => {
        if (!active) return;
        base64Ref.current = data;
        send();
      })
      .catch((e: Error) => active && fail(e.message === "NOT_PDF" ? "notpdf" : "network"));
    return () => {
      active = false;
    };
  }, [url, attempt, fail, send]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let msg: any;
      try {
        msg = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (msg.type === "ready") {
        viewerReady.current = true;
        send();
      } else if (msg.type === "loaded") {
        setTotal(msg.total);
        setPhase("ready");
      } else if (msg.type === "page") {
        setPage(msg.page);
        if (msg.total) setTotal(msg.total);
        void saveResume(resumeKey, String(msg.page));
        if (msg.total) void saveProgress(resumeKey, msg.page / msg.total);
      } else if (msg.type === "error") {
        fail(msg.reason === "cdn" ? "cdn" : "parse");
      }
    },
    [fail, resumeKey, saveProgress, saveResume, send],
  );

  const goto = (n: number) => webRef.current?.injectJavaScript(`window.__goto(${Math.max(1, Math.min(total || 1, n))});true;`);
  const applyZoom = (z: number) => {
    const next = Math.max(1, Math.min(3, Math.round(z * 4) / 4));
    setZoom(next);
    webRef.current?.injectJavaScript(`window.__zoom(${next});true;`);
  };
  const retry = () => {
    setPhase("downloading");
    setAttempt((n) => n + 1);
  };

  if (Platform.OS === "web") {
    return (
      <View className="flex-1 items-center justify-center bg-[#090A0F] px-8">
        <Text className="mb-4 text-center text-sm text-[#B8B6C8]">قارئ PDF الداخلي متاح على Android/iOS. على الويب يمكنك فتح الملف مباشرة.</Text>
        <Pressable onPress={() => void Linking.openURL(url)} className="rounded-full bg-[#E50914] px-6 py-3"><Text className="font-bold text-[#090A0F]">فتح الملف</Text></Pressable>
      </View>
    );
  }

  const message =
    failure === "notpdf" ? "الرابط لا يعيد ملف PDF مباشراً (قد يتطلب صفحة تنزيل)."
    : failure === "cdn" ? "تعذر تحميل مكتبة العرض. تأكد من اتصال الإنترنت ثم أعد المحاولة."
    : failure === "parse" ? "الملف تالف أو لا يمكن فتحه."
    : "تعذر تنزيل الكتاب. تحقق من اتصالك ثم حاول مجدداً.";

  return (
    <View className="flex-1 bg-[#090A0F]">
      <WebView
        key={attempt}
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: PDF_VIEWER_HTML, baseUrl: "https://localhost/" }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit={Platform.OS === "android"}
        setBuiltInZoomControls={false}
        overScrollMode="never"
        style={{ flex: 1, backgroundColor: "#090A0F", opacity: phase === "ready" ? 1 : 0 }}
        onError={() => fail("cdn")}
      />

      {phase !== "ready" ? (
        <View className="absolute inset-0 items-center justify-center bg-[#090A0F] px-5">
          {phase === "error" ? (
            <View className="w-full">
              <ErrorState onRetry={retry} message={message} />
              {fallbackUrl ? (
                <Pressable onPress={() => void Linking.openURL(fallbackUrl)} className="items-center self-center rounded-full border border-[#3A4055] px-5 py-3">
                  <Text className="text-sm font-bold text-[#BDAAFF]">فتح صفحة التنزيل في المتصفح</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <LoadingState label={phase === "downloading" ? "نحمّل الكتاب... قد يستغرق ذلك لحظات" : "نجهّز القارئ..."} />
          )}
        </View>
      ) : null}

      <View className="absolute left-0 right-0 top-0 flex-row items-center bg-[#090A0FF2] px-4 pb-3 pt-12" style={{ gap: 10 }}>
        <BackButton />
        <Text numberOfLines={1} className="flex-1 text-right text-sm font-black text-[#F8F7FF]">{title}</Text>
        {phase === "ready" ? (
          <View className="flex-row items-center rounded-2xl border border-[#3A4055] bg-[#1A1E2B]">
            <Pressable onPress={() => applyZoom(zoom - 0.25)} disabled={zoom <= 1} hitSlop={6} className="h-10 w-10 items-center justify-center"><Text className="text-xl text-[#F8F7FF]">−</Text></Pressable>
            <Text className="w-10 text-center text-[11px] font-bold text-[#E50914]">{Math.round(zoom * 100)}%</Text>
            <Pressable onPress={() => applyZoom(zoom + 0.25)} disabled={zoom >= 3} hitSlop={6} className="h-10 w-10 items-center justify-center"><Text className="text-xl text-[#F8F7FF]">+</Text></Pressable>
          </View>
        ) : null}
      </View>

      {phase === "ready" ? (
        <View className="absolute bottom-0 left-0 right-0 flex-row items-center bg-[#090A0FF2] px-5 pb-8 pt-3" style={{ gap: 10 }}>
          <Pressable onPress={() => goto(page - 1)} disabled={page <= 1} style={{ opacity: page <= 1 ? 0.35 : 1 }} className="h-11 w-12 items-center justify-center rounded-2xl border border-[#3A4055] bg-[#1A1E2B]"><Text className="text-lg text-[#F8F7FF]">‹</Text></Pressable>
          {jump === null ? (
            <Pressable onPress={() => setJump(String(page))} className="h-11 flex-1 items-center justify-center rounded-2xl border border-[#3A4055] bg-[#141722]">
              <Text className="text-sm font-bold text-[#F8F7FF]">صفحة {page} / {total}</Text>
            </Pressable>
          ) : (
            <TextInput
              autoFocus
              value={jump}
              onChangeText={(t) => setJump(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              returnKeyType="go"
              onSubmitEditing={() => { const n = parseInt(jump, 10); if (n) goto(n); setJump(null); }}
              onBlur={() => setJump(null)}
              className="h-11 flex-1 rounded-2xl border border-[#E50914] bg-[#141722] px-3 text-center text-sm font-bold text-[#F8F7FF]"
            />
          )}
          <Pressable onPress={() => goto(page + 1)} disabled={page >= total} style={{ opacity: page >= total ? 0.35 : 1 }} className="h-11 w-12 items-center justify-center rounded-2xl bg-[#E50914]"><Text className="text-lg font-black text-[#090A0F]">›</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}
