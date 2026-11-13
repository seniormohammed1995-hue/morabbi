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
