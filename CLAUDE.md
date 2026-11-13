# CLAUDE.md — طيور في بيتي (الاسم القديم: مُربّي)

ابدأ أي جلسة بقراءة الملف ده و `PROGRESS.md`، وكمّل من آخر نقطة.

## الستاك
React 19 + TypeScript (strict) + Vite 8 · Tailwind v4 · Zustand · Dexie (IndexedDB) · Zod · vite-plugin-pwa (Workbox) · Vitest · oxlint + Prettier · HashRouter (علشان GitHub Pages).

## الأوامر
- `npm run dev` — تشغيل محلي
- `npm run build` — typecheck + build (المخرجات في `dist/`)
- `npm test` — unit tests + `validate:data`
- `npm run validate:data` — يتأكد إن كل ملفات البيانات مطابقة للـ schema
- `npm run lint` / `npm run format`
- `npm run e2e` — Playwright (مسارين: مستخدم جديد، ومستخدم v1 بعد التحديث). الجو متزيّف في `e2e/fixtures.ts`.
- `npm run icons` — يولّد الأيقونات و splash من `public/favicon.svg`
- النشر: GitHub Actions (`.github/workflows/deploy.yml`) على كل push لـ `main` → GitHub Pages، مع `BASE_PATH=/<repo>/`.

## قواعد الكود
- الحسابات كلها دوال pure في `src/calc/` وعليها tests (`*.test.ts` جنب الملف).
- **ممنوع أي رقم تربية في الواجهة**. أي رقم فني يتقري من `src/data/` (species / cycles / rules).
- أي API خاص بالمتصفح (إشعارات، ملفات، مشاركة، اهتزاز) يمر من `src/platform/` بس.
- النصوص في `src/i18n/ar.ts` (واجهة) أو كـ `LocalizedText {ar}` جوه ملفات البيانات (محتوى).
- ممنوع TODO أو placeholders في كود متسلّم.
- عمر القطيع: يوم الاستقبال = عمر 0 (زي جداول Aviagen).

## قواعد البيانات (قسم 6 من البرومبت)
- كل قيمة فنية = `{ value | points, unit, source, sourceUrl, confidence, lastReviewed }` عن طريق helpers في `src/data/helpers.ts`.
- المصادر في `src/data/sources.ts`. المقبول: أدلة السلالات (Aviagen/Cobb/Hubbard/Lohmann/Hy-Line)، FAO، وزارة الزراعة ومعهد بحوث الإنتاج الحيواني، مراجع جامعية وإرشاد زراعي. لا منتديات ولا يوتيوب.
- لو الرقم مش متأكد منه: `confidence: 'low'` + سطر في `DATA_REVIEW.md`. الواجهة تعرضه بعلامة "قيمة استرشادية".
- نوع بياناته ضعيفة → `dataStatus: 'limited'` ويظهر بعلامة "بيانات محدودة".
- `npm run validate:data` لازم يعدّي قبل أي commit.

## ملفات المتابعة
`PLAN.md` · `PROGRESS.md` · `DECISIONS.md` · `QUESTIONS.md` · `DATA_REVIEW.md`

## v2.0
- الاسم: "طيور في بيتي" (قصير: "طيوري"). **اسم قاعدة البيانات `morabbi` ومفاتيح localStorage `morabbi-*` ثابتين عمداً** — تغييرهم يمسح بيانات المستخدمين.
- أي تغيير في Dexie = `db.version(n+1)` + upgrade + test في `src/db/migrations.test.ts`.
- خطة التحديث في `PLAN-v2.0.md`، والتغييرات في `CHANGELOG.md`.
- السلالات في `src/data/birds/<kind>.ts` (schema `BirdProfile`، 8 بنود إجبارية) ومصادرها في `src/data/birds/sources/<kind>.ts`. بواقي البيت في `src/data/scraps.ts` وكل سلالة لازم تحكم على كل بند.
- الجو بيمر من `src/platform/weather/` بس؛ الحسابات في `src/calc/weather.ts` والمعاملات في `src/data/weather.ts`.
- رقم واتساب الآراء في `src/config.ts`.

## v3.0
- التذكيرات: الحساب في `src/calc/reminders.ts`، الإعدادات والجدولة في `src/reminders.ts`، والإشعارات المتكررة على أندرويد في `src/platform/native.ts`. ids التذكيرات اتغيرت في v3.1 (تحت).
- السحابة: `src/cloud/payload.ts` (pure + tests) و `src/cloud/client.ts` (profile، outbox، feedback). السكربت في `cloud/apps-script/Code.gs` — أي عمود جديد يتضاف في المكانين.
- الأندرويد: `capacitor.config.json` + `.github/workflows/build-android.yml` (tag `v*`)؛ فولدر `android/` متجاهَل وبيتعمل في CI. الشرح في `ANDROID.md`.
- اللينكات والأرقام الشخصية في `src/config.ts` بس، والفاضي = الزرار مخفي.

## v3.1
- التذكيرات: الأنواع والمواعيد في `src/calc/reminders.ts`؛ النصوص في `src/data/care.ts` (كل جملة بمصدر)؛ المواعيد الافتراضية في `RULES.reminders`. المجدوِل `src/reminders.ts` (`applyReminders` للأندرويد، `webReminderTick` + `runCareDigest` للويب).
- ids الإشعارات: 1000–7999 يومية، 20000+ رسالة الصبح، 30000+ الجو، 40000+ التأجيل (بدل 1000–3999).
- جدول الرعاية: `src/calc/care.ts` (pure) بيقرا ملف السلالة؛ ممنوع أرقام جديدة فيه.
- فترة السحب: الأيام من المستخدم بس — التطبيق ما يقترحش أيام سحب.
- Google Play: `PLAY_STORE.md` (الخطوات والإجابات)، صفحات `public/privacy.html` و `public/delete-data.html` (لازم يفضلوا متاحين؛ متشالين من navigateFallback)، صور المتجر `npm run store:shots`. نسخة Play ممنوع فيها أي تحميل أو تحديث APK من برّه المتجر (`ApkCard` مخفي على native).
