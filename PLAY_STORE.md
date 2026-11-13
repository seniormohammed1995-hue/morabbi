# النشر على Google Play — خطوة بخطوة

كل اللي ينفع يتجهّز من الكود اتجهّز: ملف الـ AAB الموقّع، صفحة الخصوصية، صفحة مسح البيانات، زرار "امسح بياناتي" جوه التطبيق، نصوص المتجر، والصور. الخطوات اللي تحت لازم **إنت** تعملها لأنها باسمك وفيها دفع وتوثيق شخصية.

## 1) حساب المطوّر (مرة واحدة)

1. ادخل [play.google.com/console](https://play.google.com/console) بحساب جوجل اللي هيبقى صاحب التطبيق.
2. اختار **حساب شخصي (Personal)**، ادفع **25 دولار** (مرة واحدة)، وكمّل **توثيق الشخصية** (بطاقة/باسبور) و**توثيق الموبايل** بتطبيق Play Console على موبايل أندرويد.
3. التوثيق بياخد من يوم لكام يوم.

> **مهم للحسابات الشخصية الجديدة:** جوجل بيطلب **اختبار مغلق (Closed testing) بـ 12 مختبِر على الأقل لمدة 14 يوم ورا بعض** قبل ما يسمحلك تنشر للكل. جهّز 12 حد عندهم موبايل أندرويد وحساب جوجل (أهل، جيران، مربيين).

## 2) إنشاء التطبيق

Play Console ← **Create app**:

| الخانة | القيمة |
|---|---|
| App name | طيور في بيتي: دليل المربي |
| Default language | Arabic – ar |
| App or game | App |
| Free or paid | Free |

## 3) ملف التطبيق (AAB)

1. GitHub ← **Actions** ← آخر تشغيل لـ **Build Android APK** ← تحت **Artifacts** نزّل **`tuyuri-play.aab`** (فك الضغط).
   - أو اعمل tag جديد (`git tag v3.1.1 && git push origin v3.1.1`) وهيتبني لوحده.
2. Play Console ← **Testing ← Closed testing** ← Create track ← **Create new release**.
3. أول مرة هيسألك عن **Play App Signing**: اختار **"Let Google manage and protect your app signing key"** (الافتراضي). المفتاح اللي في `Documents\tuyuri-android-key\` هيبقى **مفتاح الرفع (upload key)** — احتفظ بيه، هتحتاجه في كل تحديث.
4. ارفع `tuyuri-play.aab`، واكتب ملاحظات النسخة (تحت)، و Save ← Review ← **Start rollout**.
5. في **Testers**: اعمل قائمة إيميلات بالـ 12 مختبِر، وابعتلهم لينك الاشتراك اللي هيظهر. كل واحد لازم يدوس "أصبح مختبِراً" وينزّل التطبيق ويفضل مشترك 14 يوم.

> كل تحديث لازم يبقى رقمه أعلى: الـ workflow بيحط `versionCode` = رقم التشغيل، فأي بناء جديد أعلى من اللي قبله لوحده.

ملاحظات النسخة (`ar`):
```
<ar>
تذكيرات المية والأكل والحرارة ونشاط الطيور ولمّ البيض، تنبيه الحر والبرد قبلها، جدول رعاية حسب عمر طيورك، والأدوية وفترة السحب.
</ar>
```

## 4) صفحة المتجر (Main store listing)

**App name (30 حرف بالكتير):**
```
طيور في بيتي: دليل المربي
```

**Short description (80 حرف بالكتير):**
```
تذكير المية والأكل، تنبيه الحر والبرد، وجدول رعاية لطيورك في البيت حسب عمرها
```

**Full description (4000 حرف بالكتير):**
```
طيور في بيتي — رفيقك في تربية الطيور في البيت والسطوح، بالمصري وببلاش ومن غير إعلانات.

فراخ بلدي أو بياض أو تسمين، بط، وز، رومي، سمان، أو حمام: قوله عندك إيه وعمره قد إيه، وهو يقولك تعمل إيه كل يوم.

🔔 تذكيرات في ميعادها — حتى والتطبيق مقفول
• غيّر المية كل كام ساعة تختارها
• مواعيد الأكل
• بص على الحرارة، وتابع نشاط الطيور
• لمّ البيض، وشيّك على الفرشة
• زرار "تم" و"فكّرني بعد شوية" على التذكير نفسه
• النصيحة بتتغير حسب نوع طيورك ولو عندك كتاكيت صغيرة

🌡️ تنبيه الحر والبرد قبلها
حرارة ورطوبة محافظتك، وتنبيه قبل موجة الحر بساعات وقبل الليلة الباردة من العصر، بخطوات واضحة: تظلّل إزاي، تدفّي إزاي، وإمتى تأجّل التحصين.

📅 جدول الرعاية حسب العمر
رسالة كل يوم الصبح باللي جاي على طيورك: إمتى تغيّر العلف، إمتى تقلّل التدفئة، مهام الدورة، ميعاد فقس بيض الرقاد.

💊 الأدوية وفترة السحب
سجّل الدوا وأيام السحب من العبوة، والتطبيق يعدّلك لحد ما البيض واللحم يرجعوا ينفعوا للأكل.

🌾 التغذية والأكل
حاسبة علف ومية يومية، أنواع العلف لكل عمر، و"بواقي أكل البيت" — إيه اللي ينفع وإيه الممنوع.

🩺 طائر عيان دلوقتي
خطوات إسعاف أولي وعلامات تقولك تكلّم البيطري فوراً.

🥚 وكمان: عدّاد البيض، متابعة الرقاد، دفتر "أخبار قطيعي"، وصوتك يهمنا لو محتاج توصية خاصة.

كل رقم في التطبيق مكتوب مصدره (أدلة السلالات، FAO، الإرشاد الزراعي والمراجع الجامعية). المحتوى إرشادي ومش بديل عن الطبيب البيطري.

بياناتك على موبايلك. التسجيل اختياري، وتقدر تمسح بياناتك من الإعدادات في أي وقت.
```

**الصور** (في `store/graphics/`):

| الخانة | الملف |
|---|---|
| App icon (512×512) | `store/graphics/icon-512.png` |
| Feature graphic (1024×500) | `store/graphics/feature-graphic.png` |
| Phone screenshots (2–8) | `1-home.png` … `8-sick.png` (1080×1920) |

علشان تعمل الصور من جديد بعد أي تغيير في الشكل: `npm run store:shots`.

**Category:** Productivity (أو Education) · **Tags:** Agriculture, Productivity
**Contact details:** إيميلك (لازم، وهيبقى ظاهر في المتجر) + Website: `https://seniormohammed1995-hue.github.io/morabbi/`

## 5) App content (كل البنود لازم تخلص قبل المراجعة)

| البند | الإجابة |
|---|---|
| **Privacy policy** | `https://seniormohammed1995-hue.github.io/morabbi/privacy.html` |
| **App access** | All functionality is available without special access |
| **Ads** | No, my app does not contain ads |
| **Content rating** | الإيميل ← Category: **All other app types** ← كل الأسئلة **No** (مفيش عنف/جنس/مخدرات/قمار/محتوى من المستخدمين بيشوفه غيرهم/مشاركة موقع/مشتريات). النتيجة المتوقعة: 3+ / Everyone |
| **Target audience** | **18 and over** بس (علشان ما يدخلش في سياسة الأطفال) · Appeals to children: No |
| **News app** | No |
| **COVID-19 tracing** | No |
| **Data safety** | الجدول اللي تحت |
| **Government app** | No |
| **Financial features** | My app doesn't provide any financial features |
| **Health** | My app does not have any health features (الطيور مش صحة بشر) |
| **Account deletion** (لو اتسأل) | `https://seniormohammed1995-hue.github.io/morabbi/delete-data.html` |

### Data safety

- Does your app collect or share any of the required user data types? **Yes**
- Is all of the user data collected by your app encrypted in transit? **Yes**
- Do you provide a way for users to request that their data is deleted? **Yes** — رابط: `…/delete-data.html`
- Account creation: **My app does not allow users to create an account** — التسجيل الاختياري (اسم ورقم) مفيهوش باسورد ولا تسجيل دخول. رابط مسح البيانات فوق بيغطي طلبات المسح.
  - **لو حطيت `googleClientId` (v3.2، "ادخل بحساب Gmail"):** غيّرها لـ **My app allows users to create an account → OAuth (Sign in with Google)**، وزوّد سطر **Email address** في الجدول تحت (Collected, Optional, App functionality + Developer communications)، و **Photos** مش لازم (اللينك بس، مش صورة متخزنة — بس الأسلم تختار Personal info → Other info).
  - **السوق بالعمولة:** مش SDK إعلانات، فإجابة **Ads = No** تفضل. ضغطات "اطلب" بتتسجل كـ App activity → **App interactions** (Collected, Optional, Analytics).

| نوع البيانات | Collected | Shared | Optional | ليه (Purpose) |
|---|---|---|---|---|
| Personal info → **Name** | Yes | No | Optional | App functionality, Developer communications |
| Personal info → **Phone number** | Yes | No | Optional | Developer communications |
| Location → **Approximate location** (المحافظة اللي بيكتبها) | Yes | No | Optional | App functionality, Analytics |
| Messages → **Other in-app messages** (صوتك يهمنا) | Yes | No | Optional | Developer communications |
| App activity → **Other user-generated content** (أخبار قطيعي لو شغّلها) | Yes | No | Optional | Analytics, App functionality |
| Device or other IDs (رقم تثبيت عشوائي) | Yes | No | Required with any of the above | App functionality |

- **Shared = No** لكل حاجة: البيانات بتروح لجدول المطوّر بس (Google Sheets كمقدّم خدمة مش "مشاركة"). Open-Meteo بياخد إحداثيات المحافظة مؤقتاً لجلب الجو بس (ephemeral) فمش لازم تتسجل.
- **Processed ephemerally?** No (بتتخزن في الجدول).

### Permissions

التطبيق بيطلب **الإشعارات** بس (+ `SCHEDULE_EXACT_ALARM` و `RECEIVE_BOOT_COMPLETED` من plugin الإشعارات علشان التذكير يوصل في ميعاده وبعد إعادة التشغيل). مفيش موقع ولا كاميرا ولا جهات اتصال. لو Play سأل عن exact alarms: التطبيق **تذكيرات بمواعيد يحددها المستخدم** (user-set reminders).

## 6) بعد الـ 14 يوم

Play Console ← **Dashboard ← Apply for production** ← جاوب أسئلة الاختبار (عدد المختبرين، اللي اتعلمته، إيه اللي اتصلّح) ← بعد الموافقة: **Production ← Create release** بنفس الـ AAB أو أحدث ← Rollout. المراجعة عادة من يوم لأسبوع.

## 7) نسخة GitHub (APK) ونسخة Play

- مع **Play App Signing** جوجل بيوقّع نسخة المتجر بمفتاح تاني، فاللي مثبّت الـ APK من GitHub **مش هيقدر يحدّث من Play فوقها** — لازم ياخد نسخة احتياطية (الإعدادات ← نسخة احتياطية)، يمسح التطبيق، ينزّله من Play، ويسترجع.
- أول ما التطبيق يبقى منشور: حط لينك المتجر في `src/config.ts` ← `playStoreUrl`، وزرار "حمّل نسخة الأندرويد" في الويب هيودّي على Play بدل GitHub.
- نسخة Play **ما فيهاش** أي زرار تحميل APK ولا تحديث من برّه المتجر (سياسة Play) — ده متظبط من قبل (`ApkCard` مخفي جوه التطبيق).
