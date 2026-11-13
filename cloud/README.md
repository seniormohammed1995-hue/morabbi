# ربط التطبيق بـ Google Sheets (3 خطوات)

التطبيق بيبعت 3 حاجات لجدول خاص بيك:

| الورقة | فيها إيه |
|---|---|
| `Users_Data` | صف لكل مستخدم سجّل اسمه: الاسم، الموبايل (لو كتبه)، المحافظة، نوع الطيور، أول وآخر يوم فتح فيه التطبيق، وعدد مرات الفتح. |
| `Feedback_and_Reports` | كل رسالة من "صوتك يهمنا": النوع (توصية خاصة / حالة فنية / اقتراح / شكوى)، النص، ورقم الرد. فيه عمود `status` و `reply` فاضيين ليك. |
| `Flock_News` | ملاحظات "أخبار قطيعي" — **بس** للي شغّل "ابعت أخبار قطيعي للمطوّر" بنفسه (مقفولة افتراضياً). |
| `Affiliate_Clicks` | (v3.2) كل ضغطة "اطلب" في "سوق طيور في بيتي": المنتج، القسم، أونلاين ولا واتساب. تعرف منها أكتر حاجة مطلوبة. |

في v3.2 اتزوّد عمودين في آخر `Users_Data`: `email` و `photo` — بيتملوا بس للي دخل بـ Gmail، وبعد ما السكربت يتأكد من جوجل إن الدخول حقيقي. السكربت بيزوّد العناوين لوحده في الجدول القديم.

الورق بيتعمل لوحده بالعناوين أول مرة يوصل فيها صف.

## 1) اعمل الجدول والسكربت

1. افتح [sheets.new](https://sheets.new) وسمّيه مثلاً "طيور في بيتي — المستخدمين".
2. من القائمة: **Extensions → Apps Script** (الإضافات ← برمجة التطبيقات).
3. امسح أي كود موجود، والزق محتوى الملف [`apps-script/Code.gs`](apps-script/Code.gs) كله، ودوس 💾 حفظ.
4. (اختياري) من فوق اختار الدالة `setup` ودوس ▶ Run علشان يعمل الورق التلاتة دلوقتي. هيطلب صلاحيات: **Review permissions** ← اختار حسابك ← **Advanced** ← **Go to … (unsafe)** ← **Allow**. ده طبيعي لأن السكربت بتاعك ومش منشور في المتجر.

## 2) انشره كـ Web App

1. فوق على اليمين: **Deploy → New deployment**.
2. جنب "Select type" دوس ⚙️ واختار **Web app**.
3. **Execute as:** `Me` — **Who has access:** `Anyone`.
4. **Deploy**، وانسخ الـ **Web app URL** (آخره `/exec`).
5. جرّبه: افتح اللينك في المتصفح، المفروض يظهر `{"ok":true,"app":"tuyuri",...}`.

> لو عدّلت الكود بعدين: **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. اللينك بيفضل زي ما هو.

## 3) حط اللينك في التطبيق

في [`src/config.ts`](../src/config.ts):

```ts
sheetsEndpoint: 'https://script.google.com/macros/s/XXXXXXXX/exec',
```

وبعدين `git push` (الويب بيتنشر لوحده) واعمل tag جديد علشان نسخة الأندرويد تتبني (شوف [`ANDROID.md`](../ANDROID.md)).

---

### ملاحظات مهمة

- **الخصوصية:** شاشة التسجيل بتقول للمستخدم بالظبط إيه اللي بيتبعت. الموبايل اختياري، و"أخبار قطيعي" ما بتتبعتش غير لو المستخدم شغّلها.
- **اللينك علني:** أي حد يعرفه يقدر يبعت صفوف (زي أي فورم). السكربت بيحدّ كل جهاز بـ 30 صف كل 10 دقايق، بيقص النص الطويل، وبيمنع الصيغ (`=`…) في الخلايا. ما تحطش في الجدول أي حاجة سرية تانية.
- **من غير نت:** الرسايل بتستنى على الموبايل وتتبعت لوحدها لما النت يرجع.
- **لو `sheetsEndpoint` فاضي:** التسجيل بيتحفظ على الموبايل بس، و"صوتك يهمنا" بيفتح واتساب برسالة جاهزة.

## تحديث السكربت (من غير ما اللينك يتغير)

لما `Code.gs` يتغير (زي إضافة "امسح بياناتي" في 3.1.1): افتح الجدول ← Extensions ← Apps Script ← الصق الكود الجديد ← حفظ ← **Deploy ← Manage deployments ← ✏️ Edit ← Version: New version ← Deploy**. اللينك بيفضل زي ما هو.

## تفعيل "ادخل بحساب Gmail" (v3.2، اختياري)

الزرار مخفي لحد ما تعمل الخطوات دي. **مش محتاج Firebase.**

1. افتح [console.cloud.google.com](https://console.cloud.google.com) واعمل مشروع (أو استخدم مشروع موجود).
2. **APIs & Services → OAuth consent screen (Google Auth Platform):** اسم التطبيق "طيور في بيتي"، إيميل الدعم، ولينك الخصوصية `https://seniormohammed1995-hue.github.io/morabbi/privacy.html`. النطاقات (scopes): الافتراضية بس (`email`, `profile`, `openid`). انشره **In production** (للنطاقات دي مش محتاج مراجعة من جوجل)، أو سيبه Testing وزوّد إيميلات المجربين في Test users.
3. **Credentials → Create credentials → OAuth client ID → Web application:**
   - Authorized JavaScript origins: `https://seniormohammed1995-hue.github.io` و `http://localhost:5173` (للتجربة).
   - انسخ الـ **Client ID** (آخره `.apps.googleusercontent.com`).
4. **للأندرويد:** نفس المكان ← **Create OAuth client ID → Android**: Package name `io.github.seniormohammed1995hue.tuyuri`، و SHA-1 بتاع مفتاح التوقيع:
   ```bash
   keytool -list -v -keystore release.jks -alias <الاسم>
   ```
   ولو نزلت على Google Play: اعمل Android client تاني بـ SHA-1 اللي في **Play Console → App integrity → App signing key certificate**. (الـ Android client ده مش بيتحط في الكود — جوجل بيتعرف عليه من البصمة.)
5. حط الـ **Web** Client ID في [`src/config.ts`](../src/config.ts) ← `googleClientId`.
6. في السكربت: **Project Settings (⚙️) → Script Properties → Add property**: الاسم `GOOGLE_CLIENT_ID` والقيمة نفس الـ Web Client ID. من غيرها السكربت مش هيسجّل أي إيميل.
7. الصق `Code.gs` الجديد وانشر **New version** (فوق). أول مرة هيطلب صلاحية جديدة "Connect to an external service" — دي علشان يسأل جوجل عن صحة الدخول (`oauth2.googleapis.com/tokeninfo`).
8. `git push` للويب، و tag جديد للأندرويد.

## مسح البيانات

التطبيق بيبعت `{"sheet":"Delete","row":{"client_id":"…"}}`، والسكربت بيمسح كل سطر فيه نفس الـ `client_id` من كل الورق (ومنها الإيميل وضغطات السوق)، وبيسجّل سطر في ورقة `Deletion_Log` (التاريخ، رقم التثبيت، عدد السطور) من غير أي بيانات شخصية.
