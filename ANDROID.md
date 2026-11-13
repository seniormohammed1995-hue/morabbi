# نسخة الأندرويد (APK) — خطوة بخطوة

التطبيق نفسه (React + Vite) بيتلف في **Capacitor 8**. مشروع الأندرويد مش محفوظ في الـ repo — بيتعمل من جديد في GitHub Actions كل مرة ([`build-android.yml`](.github/workflows/build-android.yml))، فمش محتاج Android Studio على جهازك.

## الطريقة السريعة (من GitHub)

1. **(مرة واحدة، مهم) مفتاح التوقيع** — شوف القسم اللي تحت. من غيره كل APK بيتوقّع بمفتاح مختلف، والمستخدم لازم يمسح التطبيق (وبياناته) قبل ما يحدّث.
2. ارفع التعديلات واعمل tag بنفس رقم النسخة:
   ```bash
   git push origin main
   git tag v3.0.0
   git push origin v3.0.0
   ```
   أو من GitHub: **Actions → Build Android APK → Run workflow**.
3. استنى حوالي 10 دقايق. الـ workflow بيعمل: `npm ci` ← `npm test` ← `npm run build` ← `cap add android` ← أيقونات وsplash من `resources/` ← `gradlew` ← توقيع ← **Release** فيها `morabbi-v3.apk`.
4. لينك التحميل الثابت (ده اللي زرار "حمّل نسخة الأندرويد" بيفتحه):
   `https://github.com/seniormohammed1995-hue/morabbi/releases/latest/download/morabbi-v3.apk`

> كل release جديدة بتبقى "latest" فاللينك بيجيب أحدث نسخة على طول. رقم `versionCode` = رقم تشغيل الـ workflow، فكل بناء أعلى من اللي قبله.

## مفتاح التوقيع (مرة واحدة)

> ✅ **اتعمل 2026-11-13.** المفتاح `tuyuri-release.p12` (PKCS12، alias `tuyuri`) والباسورد في `Documents\tuyuri-android-key\` على جهاز المطوّر، والـ 4 secrets متحطوطين في GitHub. الخطوات اللي تحت للرجوع ليها بس لو احتجت تعمل مفتاح من الأول.

محتاج Java (أي JDK فيه `keytool`). على جهازك:

```bash
keytool -genkeypair -v -keystore tuyuri-release.jks -alias tuyuri -keyalg RSA -keysize 2048 -validity 10000
```

هيسألك على باسورد واسمك. بعدين حوّل الملف لـ base64:

```bash
base64 -w0 tuyuri-release.jks > tuyuri-release.b64
```

(على ويندوز PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("tuyuri-release.jks")) | Out-File -Encoding ascii tuyuri-release.b64`)

في GitHub: **Settings → Secrets and variables → Actions → New repository secret**، وضيف 4 secrets:

| الاسم | القيمة |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | محتوى `tuyuri-release.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | باسورد الـ keystore |
| `ANDROID_KEY_ALIAS` | `tuyuri` |
| `ANDROID_KEY_PASSWORD` | باسورد المفتاح |

**احتفظ بـ `tuyuri-release.jks` والباسورد في مكان آمن، وما ترفعهمش على GitHub.** لو ضاعوا، أي تحديث بعد كده هيحتاج المستخدمين يمسحوا التطبيق ويثبّتوه تاني. نفس المفتاح ده هو اللي هتحتاجه لو رفعت على Google Play.

## على جهازك (اختياري)

محتاج [Android Studio](https://developer.android.com/studio) (فيه JDK 21 و Android SDK 36):

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

ومن Android Studio: **Build → Build APK(s)**. فولدر `android/` متجاهَل في git.

## إزاي المستخدم يثبّتها

موجودة جوه التطبيق في `/android` ("نسخة الأندرويد"):
1. يدوس "حمّل" ويستنى الملف.
2. يفتحه من الإشعارات أو "التنزيلات".
3. لو قال "مصدر غير معروف": الإعدادات ← "السماح من المصدر ده".
4. تثبيت ← فتح.

بيانات نسخة الويب **مش** بتتنقل لوحدها (كل واحدة ليها تخزين منفصل): الإعدادات ← "نسخة احتياطية" في الويب، و"استرجاع" في الأندرويد.

## الفرق بين الويب والأندرويد

| | ويب (PWA) | أندرويد (APK) |
|---|---|---|
| تذكيرات المية والأكل والأخبار | والتطبيق مفتوح بس | **والتطبيق مقفول** (LocalNotifications، بتفضل بعد إعادة التشغيل) |
| زرار الرجوع | المتصفح | زرار الموبايل بيرجع جوه التطبيق، وبيقفل من الرئيسية |
| التحديث | لوحده (service worker) | APK جديد |
| زرار "حمّل نسخة الأندرويد" | ظاهر | مخفي |

## ملاحظات تقنية

- `appId` = `io.github.seniormohammed1995hue.tuyuri` — **ما يتغيرش بعد أول نشر** (تغييره = تطبيق جديد).
- الأذونات (`POST_NOTIFICATIONS`، `RECEIVE_BOOT_COMPLETED`، `SCHEDULE_EXACT_ALARM`) بتيجي من plugin الإشعارات نفسه. التذكيرات بتتجدول "تقريبية" لو Android ما اداش إذن الدقة — كفاية لتذكير المية والأكل.
- أيقونة الإشعار: [`resources/android/ic_stat_tuyuri.xml`](resources/android/ic_stat_tuyuri.xml). أيقونة التطبيق وsplash من `resources/icon-only.png` و `splash.png` و `splash-dark.png` (`npm run icons`).
- الـ service worker ما بيتسجّلش جوه الأندرويد (الملفات جوه الـ APK).
