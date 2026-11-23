# بناء AlphaFlix لنظام Android

يحتوي المشروع على GitHub Actions في `.github/workflows/android-build.yml`. يبدأ الفحص والبناء تلقائياً عند كل `push` و`pull_request`، ويمكن تشغيله يدوياً من تبويب **Actions** باختيار **Android APK (ARM 32-bit + 64-bit)** ثم **Run workflow**.

قبل إنتاج APK، يشغّل الـworkflow فحوص TypeScript والاختبارات وESLint، ثم ينشئ مشروع Android الأصلي عبر Expo ويجمع ملف APK. إعداد `expo-build-properties` في `app.config.ts` يضم `armeabi-v7a` (ARM 32-bit) و`arm64-v8a` (ARM 64-bit)، ويتحقق الـworkflow من وجود مكتبات native لكلا المعماريتين داخل APK قبل رفعه كـartifact باسم `AlphaFlix-Android-ARMv7-ARM64`.

لتنزيله، افتح تشغيل الـworkflow الناجح من **Actions** ونزّل الـartifact. هذا APK موقّع بمفتاح Android debug للاختبار والتثبيت التجريبي؛ **ليس توقيع نشر Google Play**. يلزم إعداد مفتاح توقيع release وحفظه بأمان في GitHub Secrets قبل إصدار نسخة متجر. ولا يحتاج بناء APK عبر Actions إلى `EXPO_TOKEN` لأن البناء يتم على runner الخاص بـGitHub.

نجاح بناء التطبيق لا يضمن أن كل خدمة بث خارجية متاحة أو أن الروابط تظل صالحة؛ التشغيل يعتمد على API ومصادر المحتوى القائمة في المشروع.
