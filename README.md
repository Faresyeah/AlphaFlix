# AlphaFlix

تطبيق Expo متعدد المصادر (أنمي · سينما · مانجا · روايات · كتب) بواجهة شبيهة بـ Netflix.

**By FaresCodeX** · Instagram [@sxnaxke](https://instagram.com/sxnaxke)

## تشغيل محلي

```bash
npm install   # أو pnpm install
npm run dev
```

## بناء APK (ARM 32 + 64)

`eas.json` مضبوط على APK مع:

- `armeabi-v7a`
- `arm64-v8a`

```bash
npm i -g eas-cli
eas login
eas build -p android --profile preview
```

### عبر GitHub Actions

1. أنشئ سر `EXPO_TOKEN` من [expo.dev](https://expo.dev) → Access tokens
2. ادفع على `main` أو شغّل workflow يدوياً
3. حمّل الـ APK من صفحة البناء في Expo

## ملاحظات

- بدون ملف `.env` المحتوى من APIs الخارجية يشتغل؛ OAuth اختياري
- الإشعارات: تفعيل محلي من الإعدادات
