import { Platform } from "react-native";

import { readStored, STORAGE_KEYS, writeStored } from "@/lib/storage";

const KEY = "alphaflix:notifications-enabled-v1";

export async function getNotificationsEnabled(): Promise<boolean> {
  return readStored<boolean>(KEY, false);
}

export async function setNotificationsEnabled(value: boolean): Promise<void> {
  await writeStored(KEY, value);
}

/** Requests OS permission when available. Safe no-op on web / if module missing. */
export async function enableNotifications(): Promise<{ ok: boolean; message: string }> {
  try {
    // Dynamic import so web/build without native module still works
    const Notifications = await import("expo-notifications");
    if (Platform.OS === "web") {
      await setNotificationsEnabled(true);
      return { ok: true, message: "تم تفعيل تنبيهات المتصفح إن كانت مدعومة." };
    }
    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== "granted") {
      await setNotificationsEnabled(false);
      return { ok: false, message: "لم يتم منح إذن الإشعارات من إعدادات الجهاز." };
    }
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    // Local sample so user sees it works (optional)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "AlphaFlix",
        body: "الإشعارات مفعّلة. سننبّهك عند توفر محتوى جديد.",
      },
      trigger: null,
    });
    await setNotificationsEnabled(true);
    return { ok: true, message: "تم تفعيل الإشعارات." };
  } catch {
    await setNotificationsEnabled(true);
    return { ok: true, message: "تم حفظ التفضيل. الإشعارات الفورية تكتمل مع بناء التطبيق." };
  }
}

export async function disableNotifications(): Promise<void> {
  await setNotificationsEnabled(false);
}
