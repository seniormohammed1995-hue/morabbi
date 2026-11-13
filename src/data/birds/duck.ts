import type {
  BirdProfile,
  ClimateBand,
  CycleTemplate,
  ProfileFeedPhase,
  ScrapRule,
  SourcedText,
  SpaceBand,
} from '../schema'
import { ar, avoidWith, scrap, st, sv, table } from '../helpers'

/**
 * Duck profiles (Pekin, Muscovy, Mulard, Egyptian local).
 * Shared kind-level data first, then one profile per breed.
 * Brooding temperatures and floor space follow the Cornell Duck Research Laboratory;
 * the Egyptian growth data come from Zagazig (Abdel-Hamid 2023) and Ain Shams (Radwan 2019).
 */

const T = '°م'

// ---------- 6. Climate (shared) ----------

const RH_NOTE =
  'مفيش رقم رطوبة خاص بالبط؛ ده رقم دليل فراخ التسمين. زرق البط فيه مية أكتر من 90٪ فالفرشة بتتبل بسرعة — التهوية مهمة.'

const rhMax = sv(70, '٪', 'hb25', 'low', { note: RH_NOTE })

const climate: ClimateBand[] = [
  {
    fromDay: 0,
    toDay: 6,
    comfortMin: sv(30, T, 'duck_cornellHousing', 'high', { note: 'حرارة يوم 1 في جدول كورنيل.' }),
    comfortMax: sv(35, T, 'duck_ukyMeat', 'medium', {
      min: 32,
      note: 'أول أسبوع 32–35 درجة (90–95 فهرنهايت) عند مستوى البط.',
    }),
    dangerLow: sv(27, T, 'duck_cornellHousing', 'low', {
      note: 'تقدير: ده رقم كورنيل لعمر أسبوع؛ لو الحرارة نزلت تحته في أول أسبوع البط الصغير بيبرد ويتكوّم.',
    }),
    dangerHigh: sv(38, T, 'duck_ukyMeat', 'low', {
      note: 'تقدير: 3 درجات فوق أعلى حرارة تحضين. لو البط بعد عن الدفاية وبينهج، الحر زيادة.',
    }),
    rhMax,
  },
  {
    fromDay: 7,
    toDay: 13,
    comfortMin: sv(27, T, 'duck_cornellHousing', 'high', { note: 'حرارة يوم 7 في جدول كورنيل.' }),
    comfortMax: sv(32, T, 'duck_ukyMeat', 'medium', {
      note: 'بننزّل حوالي 5 فهرنهايت (3 درجات) كل أسبوع.',
    }),
    dangerLow: sv(23, T, 'duck_cornellHousing', 'low', { note: 'تقدير: رقم كورنيل لعمر أسبوعين.' }),
    dangerHigh: sv(35, T, 'duck_ukyMeat', 'low', { note: 'تقدير.' }),
    rhMax,
  },
  {
    fromDay: 14,
    toDay: 20,
    comfortMin: sv(23, T, 'duck_cornellHousing', 'high', { note: 'حرارة يوم 14 في جدول كورنيل.' }),
    comfortMax: sv(29, T, 'duck_ukyMeat', 'medium', { note: 'نزول 5 فهرنهايت كل أسبوع.' }),
    dangerLow: sv(19, T, 'duck_cornellHousing', 'low', {
      note: 'تقدير: رقم كورنيل لعمر 3 أسابيع.',
    }),
    dangerHigh: sv(35, T, 'duck_ukyMeat', 'low', { note: 'تقدير.' }),
    rhMax,
  },
  {
    fromDay: 21,
    toDay: 27,
    comfortMin: sv(19, T, 'duck_cornellHousing', 'high', { note: 'حرارة يوم 21 في جدول كورنيل.' }),
    comfortMax: sv(27, T, 'duck_ukyMeat', 'medium', {
      note: 'التدفئة بتقف تقريباً لما الجو يوصل 21 درجة (70 فهرنهايت) على عمر 3–4 أسابيع.',
    }),
    dangerLow: sv(15, T, 'duck_cornellHousing', 'low', {
      note: 'تقدير: رقم كورنيل لعمر 4 أسابيع.',
    }),
    dangerHigh: sv(35, T, 'duck_heat2022', 'low', {
      note: 'الرقم متجرب على بط كبير؛ للصغير تقدير.',
    }),
    rhMax,
  },
  {
    fromDay: 28,
    toDay: 34,
    comfortMin: sv(15, T, 'duck_cornellHousing', 'high', { note: 'حرارة يوم 28 في جدول كورنيل.' }),
    comfortMax: sv(28, T, 'duck_heat2022', 'low', {
      note: 'تقدير: التجربة استخدمت 22 درجة كجو عادي و35 كإجهاد حراري.',
    }),
    dangerLow: sv(10, T, 'duck_cornellHousing', 'low', { note: 'تقدير.' }),
    dangerHigh: sv(35, T, 'duck_heat2022', 'medium', {
      note: '35 درجة 10 ساعات في اليوم عملت إجهاد حراري في البط البكيني.',
    }),
    rhMax,
  },
  {
    fromDay: 35,
    toDay: 3650,
    comfortMin: sv(13, T, 'duck_cornellHousing', 'high', {
      note: 'من 5 أسابيع وللأمهات: 13 درجة كفاية لما الريش يكمل.',
    }),
    comfortMax: sv(28, T, 'duck_heat2022', 'low', {
      note: 'تقدير: التجربة استخدمت 22 درجة كجو عادي و35 كإجهاد حراري.',
    }),
    dangerLow: sv(5, T, 'duck_cornellHousing', 'low', {
      note: 'تقدير: البط الكبير بيستحمل البرد، بس خلّي بالك المية ما تتلجش وعنده مكان ناشف من الهوا.',
    }),
    dangerHigh: sv(35, T, 'duck_heat2022', 'medium', {
      note: '35 درجة 10 ساعات في اليوم قللت جودة البيض والخصوبة في أمهات البكيني.',
    }),
    rhMax,
  },
]

// ---------- 1. Housing (shared) ----------

const SPACE_NOTE =
  'جدول كورنيل مكتوب "بالأيام" بس الأرقام أسبوعية (1–7) — حسبناه أسابيع لأنه بيوافق 6 بط/م² عند 42 يوم في تجربة لومان.'

const space: SpaceBand[] = [
  {
    fromDay: 0,
    toDay: 6,
    perM2: sv(34.6, 'طائر/م²', 'duck_cornellHousing', 'medium', {
      note: `289 سم² للبطة. ${SPACE_NOTE}`,
    }),
  },
  {
    fromDay: 7,
    toDay: 13,
    perM2: sv(17.4, 'طائر/م²', 'duck_cornellHousing', 'medium', {
      note: `576 سم² للبطة. ${SPACE_NOTE}`,
    }),
  },
  {
    fromDay: 14,
    toDay: 20,
    perM2: sv(9.8, 'طائر/م²', 'duck_cornellHousing', 'medium', {
      note: `1024 سم² للبطة. ${SPACE_NOTE}`,
    }),
  },
  {
    fromDay: 21,
    toDay: 27,
    perM2: sv(7.3, 'طائر/م²', 'duck_cornellHousing', 'medium', {
      note: `1369 سم² للبطة. ${SPACE_NOTE}`,
    }),
  },
  {
    fromDay: 28,
    toDay: 34,
    perM2: sv(5.7, 'طائر/م²', 'duck_cornellHousing', 'medium', {
      note: `1764 سم² للبطة. ${SPACE_NOTE}`,
    }),
  },
  {
    fromDay: 35,
    toDay: 41,
    perM2: sv(4.7, 'طائر/م²', 'duck_cornellHousing', 'medium', {
      note: `2116 سم² للبطة. ${SPACE_NOTE}`,
    }),
  },
  {
    fromDay: 42,
    toDay: 111,
    perM2: sv(4, 'طائر/م²', 'duck_cornellHousing', 'medium', {
      min: 4,
      max: 4.3,
      note: '2304 سم² عند 7 أسابيع و2500 سم² للبط اللي بيكبر للتربية.',
    }),
  },
  {
    fromDay: 112,
    toDay: 3650,
    perM2: sv(3.6, 'طائر/م²', 'duck_cornellHousing', 'high', {
      note: '2809 سم² للبطة اللي بتبيض.',
    }),
  },
]

const housingWater = ar(
  'البط لازم يلاقي مية تكفي يغطّس فيها راسه كلها وينضّف عينيه ومناخيره (جردل أو طشت أعمق من راسه) — ده شرط في توصيات مجلس أوروبا. العوم نفسه مش ضروري. السقاية لازم تكون واسعة (4 سم على الأقل) علشان يغطّس منقاره. أول 3 أسابيع ما تسيبش البط الصغير يعوم أو يتبل.',
)

const housingNotes = [
  ar(
    'حط المية فوق شبكة أو مكان بيصرّف علشان الفرشة ما تتبلش؛ زرق البط فيه مية أكتر من 90٪ (كورنيل، مجلس أوروبا).',
  ),
  ar(
    'مساحة الشرب: 2.5 سم لكل بطة صغيرة و5 سم للبط الكبير. مساحة الأكل 2.5 سم لكل بطة أول 3 أسابيع (كورنيل).',
  ),
  ar('بعد 14 يوم ينفع البط يخرج جزء من النهار لو الجو برا فوق 21 درجة (كورنيل).'),
  ar('سيب لمبة خافتة بالليل: بتقلل الهيجان والتدافع ونقر الريش (كورنيل).'),
  ar(
    'السطح أو الحوش لازم فيه ضل ومكان ناشف يستخبى فيه البط من الشمس والمطر، وسلك يحميه من القطط والكلاب.',
  ),
]

// ---------- 2. Feeding (shared) ----------

const scraps: ScrapRule[] = [
  scrap(
    'bread',
    'limit',
    'شوية عيش مبلول بس؛ فقير في البروتين وممكن يكون مالح، وما يبقاش أكتر من جزء صغير جنب العلف.',
    'duck_fpBakery',
    'medium',
  ),
  scrap(
    'moldy-food',
    'no',
    'العفن بيطلع أفلاتوكسين، والبط الصغير من أكتر الطيور حساسية ليه — بيضرب الكبد.',
    'duck_msdAflatoxin',
    'high',
  ),
  scrap(
    'rice-cooked',
    'limit',
    'نشا بس من غير بروتين؛ كمية صغيرة جنب العلف مش بداله.',
    'duck_msdPekinNutr',
    'low',
  ),
  scrap('rice-raw', 'limit', 'حبوب نشوية؛ كمية قليلة جنب العلف.', 'fpMaize', 'low'),
  scrap(
    'pasta',
    'limit',
    'نشا بس؛ كمية صغيرة مسلوقة من غير صلصة ولا ملح.',
    'duck_msdPekinNutr',
    'low',
  ),
  scrap(
    'potato-peel',
    'no',
    'القشر الني والبطاطس الخضرا فيها سولانين سام؛ لازم تتسلق الأول.',
    'duck_fpPotato',
    'high',
  ),
  scrap(
    'potato-cooked',
    'limit',
    'البطاطس المسلوقة اتجربت في علف الطيور؛ ماشي بكمية محدودة.',
    'duck_fpPotato',
    'medium',
  ),
  scrap(
    'greens',
    'ok',
    'الخضرة الورقية والرعي مناسبين للبط؛ قطّعها صغيرة وحطها جنب المية.',
    'duck_pingel1999',
    'medium',
  ),
  scrap('cabbage', 'ok', 'خضار ورقي؛ مقطّع صغير وبكمية معقولة.', 'duck_pingel1999', 'low'),
  scrap(
    'cucumber',
    'ok',
    'خضار فيه مية كتير؛ ينفع في الصيف بكمية معقولة.',
    'duck_pingel1999',
    'low',
  ),
  scrap(
    'tomato',
    'limit',
    'الطماطم الناضجة بس وبكمية قليلة، من غير الورق والعرش.',
    'duck_msdPekinNutr',
    'low',
  ),
  scrap('carrot', 'ok', 'مبشور أو مقطّع صغير؛ خضار عادي جنب العلف.', 'duck_pingel1999', 'low'),
  scrap(
    'watermelon',
    'limit',
    'مية وسكر؛ قطعة في الحر ماشي بس ما تكترش علشان العلف المتوازن.',
    'duck_msdPekinNutr',
    'low',
  ),
  scrap(
    'fruit',
    'limit',
    'سكر عالي؛ قطع صغيرة من غير بذر، مرة كل فين وفين.',
    'duck_msdPekinNutr',
    'low',
  ),
  scrap(
    'citrus',
    'limit',
    'حامض ومش مفيد؛ لو اتاكل شوية مش مشكلة بس ما تحطوش كأكل.',
    'duck_msdPekinNutr',
    'low',
  ),
  scrap(
    'onion-garlic',
    'no',
    'البصل والتوم بيكسروا كرات الدم الحمرا في حيوانات كتير؛ ابعدهم عن البط.',
    'duck_msdAllium',
    'low',
  ),
  scrap('avocado', 'no', 'سام للطيور وبيضر عضلة القلب.', 'duck_msdAvocado', 'high'),
  scrap('chocolate', 'no', 'فيها ثيوبرومين وكافيين وده سم.', 'duck_msdChocolate', 'medium'),
  scrap('coffee-tea', 'no', 'فيها كافيين؛ ممنوع.', 'duck_msdChocolate', 'medium'),
  scrap(
    'salty',
    'no',
    'الملح الزيادة بيسمم البط الصغير؛ أكل رطب فيه 2٪ ملح بس سمّم بط صغير.',
    'duck_msdSalt',
    'high',
  ),
  scrap('fried', 'no', 'زيت وملح زيادة ومش متوازن؛ ما تديهوش.', 'duck_msdPekinNutr', 'low'),
  scrap('sweets', 'no', 'سكر بس من غير أي قيمة؛ ممنوع.', 'duck_msdPekinNutr', 'low'),
  scrap(
    'meat-scraps',
    'no',
    'البواقي اللي بتبوظ بتطلع سم البوتيوليزم والبط حساس ليه جداً (الرقبة بترتخي).',
    'duck_msdBotulism',
    'medium',
  ),
  scrap(
    'fish-scraps',
    'limit',
    'سمك طازة مسلوق بكمية صغيرة ماشي؛ السمك البايظ ممكن يجيب بوتيوليزم.',
    'duck_msdBotulism',
    'medium',
  ),
  scrap(
    'eggshell',
    'limit',
    'للبطة اللي بتبيض بس كمصدر كالسيوم، مكسّر ناعم بعد ما يتسخّن.',
    'fpLimestone',
    'low',
  ),
  scrap(
    'egg-cooked',
    'limit',
    'بيض مسلوق مفروم بروتين كويس للصغار، بكمية صغيرة جنب العلف.',
    'duck_msdPekinNutr',
    'low',
  ),
  scrap(
    'beans-raw',
    'no',
    'الفول والفاصوليا الني فيهم مواد بتضر الطيور؛ لازم يتطبخوا.',
    'duck_fpBean',
    'high',
  ),
  scrap(
    'beans-cooked',
    'limit',
    'المطبوخ ماشي بكمية محدودة ومن غير ملح أو زيت.',
    'duck_fpFaba',
    'medium',
  ),
  scrap(
    'grains',
    'ok',
    'ذرة مجروشة أو قمح أو شعير جنب العلف؛ طاقة كويسة بس مش بديل للعلف.',
    'fpMaize',
    'medium',
  ),
  scrap(
    'clover',
    'ok',
    'البرسيم أكل أخضر كويس، بس طاقته قليلة فما يبقاش الأكل الأساسي.',
    'duck_fpBerseem',
    'medium',
  ),
  scrap(
    'dates',
    'limit',
    'سكر عالي؛ حباية مقطعة من غير النواة مرة كل فين وفين.',
    'duck_msdPekinNutr',
    'low',
  ),
]

const feedingNotes = [
  ar(
    'البط محتاج نياسين أكتر من الفراخ (55–70 مجم/كجم علف). علف الفراخ البياض ممكن يبقى ناقص ويعمل رجلين معوّجة وركب منفوخة — اسأل عن علف بط أو علف متكامل للبط.',
  ),
  ar('حط المية جنب الأكل؛ البط بيبل الأكل وهو بياكل. املا المعالف لنصها بس علشان الهدر (كنتاكي).'),
  ar('ما تستخدمش علف فيه أدوية للبط إلا بأمر طبيب بيطري (كنتاكي).'),
]

// ---------- 5. Health (shared) ----------

const problems: SourcedText[] = [
  st(
    'التهاب الكبد الفيروسي للبط: بيصيب البط تحت 6 أسابيع وممكن يموّت لحد 95٪. البطة بتقع وراسها مشدودة لورا وتموت في دقايق. اعزل الصغار أول 5 أسابيع، وكافح الفيران، وبعدهم عن البط البري.',
    'duck_msdDVH',
    'high',
  ),
  st(
    'طاعون البط: من عمر أسبوع لحد الكبير، والمسكوفي أكتر نوع بيتأثر. موت مفاجئ وإسهال مية أو بدم. بينتقل عن طريق المية، فامنع اختلاط بطك بالبط والطيور البرية.',
    'duck_msdDVE',
    'high',
  ),
  st(
    'أنفلونزا الطيور: البط والطيور المائية ممكن تشيل الفيروس من غير ما يبان عليها. أي نفوق مفاجئ بلّغ عنه الطبيب البيطري فوراً.',
    'duck_msdAI',
    'high',
  ),
  st(
    'نقص النياسين: البط أكتر تأثراً من الفراخ؛ الرجلين بتتعوج والركبة بتنفخ والنمو بيقف. السبب غالباً علف فراخ مش علف بط.',
    'duck_msdVitamins',
    'high',
  ),
  st(
    'سموم العفن (أفلاتوكسين): البط الصغير حساس؛ بيضرب الكبد ويقلل النمو. ما تديش علف أو عيش معفّن وخزّن العلف في مكان ناشف.',
    'duck_msdAflatoxin',
    'high',
  ),
  st(
    'البوتيوليزم: الرقبة بترتخي والبطة مش قادرة ترفع راسها وممكن تغرق في المية. بييجي من أكل بايظ أو جثث ودود. شيل النافق فوراً.',
    'duck_msdBotulism',
    'high',
  ),
  st(
    'التحصينات (زي الكبد الفيروسي وطاعون البط) موجودة بس برنامجها بيختلف حسب المنطقة والمصدر. استشير طبيب بيطري للتحصينات قبل ما تجيب البط.',
    'duck_msdDVH',
    'medium',
  ),
]

const dangerSigns = [
  ar('بطة صغيرة بتقع على جنبها وراسها لورا وبترفس — اعزل وكلّم طبيب بيطري فوراً.'),
  ar('نفوق مفاجئ لأكتر من بطة في يوم واحد — اعزل وبلّغ الطبيب البيطري.'),
  ar('إسهال مية أو فيه دم، أو بطة مش قادرة ترفع راسها.'),
  ar('رجلين معوّجة أو بطة بتعرج ومش عايزة تقوم.'),
  ar('عينين مقفولة أو فيها إفرازات — اتأكد إن البط بيقدر يغطّس راسه في المية.'),
  ar('بط بينهج وجناحاته مفتوحة في الحر — ضل ومية باردة فوراً.'),
]

// ---------- 7. Mixing (shared) ----------

const AI_REASON =
  'البط ممكن يشيل أنفلونزا الطيور من غير أعراض وينقلها، وكمان المية اللي بيرشها بتبل الفرشة. ربّيه في مكان لوحده.'

const mixing = {
  okWith: ['goose'] as BirdProfile['kind'][],
  avoid: [
    avoidWith('chicken', AI_REASON, 'duck_msdAI', 'medium'),
    avoidWith('turkey', AI_REASON, 'duck_msdAI', 'medium'),
    avoidWith('quail', AI_REASON, 'duck_msdAI', 'medium'),
  ],
}

// ---------- 3. Cycle builder ----------

interface CycleOpts {
  id: string
  growerDay: number
  marketDay: number
  marketTitle: string
}

function duckCycle(o: CycleOpts): CycleTemplate {
  const m = o.marketDay
  return {
    speciesId: o.id,
    prepDays: 7,
    stages: [
      {
        id: 'prep',
        name: ar('تجهيز المكان'),
        fromDay: -7,
        toDay: -1,
        summary: ar('تنضيف وتطهير، وتجهيز ركن تحضين دافي وسقاية واسعة.'),
      },
      {
        id: 'brooding',
        name: ar('تحضين'),
        fromDay: 0,
        toDay: 27,
        summary: ar('البط الصغير محتاج دفا أول 3–4 أسابيع، وبنقلّل الحرارة كل أسبوع.'),
      },
      {
        id: 'growing',
        name: ar('نمو'),
        fromDay: 28,
        toDay: m - 1,
        summary: ar('أكل ومية كتير، مساحة أوسع، وفرشة ناشفة.'),
      },
      {
        id: 'market',
        name: ar('البيع أو الدبح'),
        fromDay: m,
        toDay: m,
        summary: ar(o.marketTitle),
      },
    ],
    tasks: [
      {
        id: 'clean',
        fromDay: -7,
        toDay: -7,
        kind: 'prep',
        daily: false,
        title: ar('شيل الفرشة القديمة واغسل المكان'),
        detail: ar('السقايات والمعالف كمان.'),
      },
      {
        id: 'disinfect',
        fromDay: -6,
        toDay: -6,
        kind: 'prep',
        daily: false,
        title: ar('طهّر المكان وسيبه ينشف'),
        detail: ar('بمطهر معتمد بالتركيز المكتوب على العبوة.'),
      },
      {
        id: 'brooder-setup',
        fromDay: -2,
        toDay: -2,
        kind: 'litter',
        daily: false,
        title: ar('افرش فرشة ناشفة وجهّز حاجز التحضين'),
        detail: ar('الحاجز يسيب مكان البط يبعد فيه عن الدفاية لو حر. السقاية فوق شبكة أو صينية.'),
      },
      {
        id: 'preheat',
        fromDay: -1,
        toDay: -1,
        kind: 'brooding',
        daily: false,
        title: ar('شغّل الدفاية قبل الاستلام بيوم'),
        detail: ar('30 درجة أو أكتر عند مستوى البط.'),
      },
      {
        id: 'receive',
        fromDay: 0,
        toDay: 0,
        kind: 'brooding',
        daily: false,
        title: ar('استلم البط وغطّس منقار كل واحدة في المية'),
        detail: ar('علشان تعرف مكان المية، وبعدين حط الأكل.'),
      },
      {
        id: 'watch-heat',
        fromDay: 0,
        toDay: 27,
        kind: 'brooding',
        daily: true,
        title: ar('راقب توزيع البط تحت الدفاية'),
        detail: ar('متكوّم تحتها = برد. بعيد عنها وبينهج = حر.'),
      },
      {
        id: 'water',
        fromDay: 0,
        toDay: m,
        kind: 'house',
        daily: true,
        title: ar('نضّف السقايات وغيّر المية'),
        detail: ar('المية لازم تكفي البط يغطّس راسه.'),
      },
      {
        id: 'no-swim',
        fromDay: 0,
        toDay: 20,
        kind: 'house',
        daily: true,
        title: ar('ما تسيبش البط الصغير يعوم أو يتبل'),
        detail: ar('ريشه لسه مش بيصد المية.'),
      },
      {
        id: 'lower-heat-7',
        fromDay: 7,
        toDay: 7,
        kind: 'brooding',
        daily: false,
        title: ar('نزّل الحرارة ووسّع المكان'),
        detail: ar('حوالي 27 درجة، وضعف المساحة.'),
      },
      {
        id: 'lower-heat-14',
        fromDay: 14,
        toDay: 14,
        kind: 'brooding',
        daily: false,
        title: ar('نزّل الحرارة ووسّع المكان تاني'),
        detail: ar('حوالي 23 درجة. ينفع يخرج شوية لو الجو برا فوق 21 درجة.'),
      },
      {
        id: 'lower-heat-21',
        fromDay: 21,
        toDay: 21,
        kind: 'brooding',
        daily: false,
        title: ar('نزّل الحرارة'),
        detail: ar('حوالي 19 درجة.'),
      },
      {
        id: 'heat-off',
        fromDay: 28,
        toDay: 28,
        kind: 'brooding',
        daily: false,
        title: ar('وقّف التدفئة لو الجو مش بارد'),
        detail: ar('البط الكبير بيكفيه 13–15 درجة.'),
      },
      {
        id: 'feed-grower',
        fromDay: o.growerDay,
        toDay: o.growerDay + 1,
        kind: 'feed',
        daily: true,
        title: ar('انقل من البادي للنامي تدريجياً'),
        detail: ar('اخلط الاتنين يوم أو يومين.'),
      },
      {
        id: 'litter',
        fromDay: 7,
        toDay: m,
        kind: 'litter',
        daily: true,
        title: ar('شيل الفرشة المبلولة حوالين المية'),
        detail: ar('وحط ناشفة مكانها.'),
      },
      {
        id: 'dead',
        fromDay: 0,
        toDay: m,
        kind: 'health',
        daily: true,
        title: ar('شيل أي نافق فوراً'),
        detail: ar('النافق والدود حواليه بيجيبوا البوتيوليزم.'),
      },
      {
        id: 'weigh-mid',
        fromDay: 28,
        toDay: 28,
        kind: 'weigh',
        daily: false,
        title: ar('وزّن عينة'),
        detail: ar('قارن بالوزن المتوقع.'),
      },
      {
        id: 'weigh-pre',
        fromDay: m - 7,
        toDay: m - 7,
        kind: 'weigh',
        daily: false,
        title: ar('وزّن عينة قبل البيع بأسبوع'),
        detail: undefined,
      },
      {
        id: 'market',
        fromDay: m,
        toDay: m,
        kind: 'market',
        daily: false,
        title: ar('البيع أو الدبح'),
        detail: ar('في الوقت الأبرد من اليوم، وراجع فترة السحب لو اتدّى أي دوا.'),
      },
    ],
    signs: [
      {
        fromDay: 0,
        toDay: 6,
        severity: 'urgent',
        text: ar('بط متكوّم وبيصوصو بصوت عالي = برد. ارفع الحرارة فوراً.'),
      },
      {
        fromDay: 0,
        toDay: 42,
        severity: 'urgent',
        text: ar('بطة بتقع وراسها لورا وتموت بسرعة — ممكن كبد فيروسي. اعزل وكلّم طبيب بيطري.'),
      },
      {
        fromDay: 7,
        toDay: m,
        severity: 'watch',
        text: ar('عرج أو رجلين معوّجة — راجع العلف (نياسين).'),
      },
      {
        fromDay: 7,
        toDay: m,
        severity: 'watch',
        text: ar('عينين مقفولة أو وسخة — المية مش عميقة كفاية للغطس.'),
      },
      {
        fromDay: 21,
        toDay: m,
        severity: 'watch',
        text: ar('بط بينهج وجناحاته مفتوحة = حر. ضل ومية باردة.'),
      },
      {
        fromDay: 0,
        toDay: m,
        severity: 'urgent',
        text: ar('نفوق مفاجئ عالي في يوم — اعزل وبلّغ الطبيب البيطري.'),
      },
    ],
  }
}

// ---------- Shared base ----------

const base = {
  kind: 'duck' as const,
  unit: 'birds' as const,
  defaultAge: 0,
  housing: {
    type: ar(
      'أوضة أو عشة على السطح أو في الحوش فيها جزء ناشف مفروش ومكان للمية فوق شبكة. البط ما بيطلعش على مجاثم.',
    ),
    space,
    water: housingWater,
    notes: housingNotes,
  },
  health: { vaccinations: [], problems, dangerSigns },
  climate: { bands: climate },
  mixing,
}

const feedPhases = (
  growerDay: number,
  src: 'duck_msdPekinNutr' | 'duck_abdelHamid2023',
  growerCp: number,
): ProfileFeedPhase[] => [
  {
    id: 'starter',
    name: ar('بادي'),
    fromDay: 0,
    toDay: growerDay - 1,
    crudeProtein: sv(22, '٪', src, src === 'duck_msdPekinNutr' ? 'high' : 'medium'),
  },
  {
    id: 'grower',
    name: ar('نامي / ناهي'),
    fromDay: growerDay,
    toDay: 111,
    crudeProtein: sv(growerCp, '٪', src, src === 'duck_msdPekinNutr' ? 'high' : 'medium'),
  },
  {
    id: 'adult',
    name: ar('بط كبير / أمهات'),
    fromDay: 112,
    toDay: 3650,
    crudeProtein: sv(
      15,
      '٪',
      'duck_msdPekinNutr',
      src === 'duck_msdPekinNutr' ? 'high' : 'medium',
      {
        note: 'رقم أمهات البكيني. وقت البيض NC State بتدي علف أمهات 19٪.',
      },
    ),
  },
]

const sittingChecks = (hatchDay: number, stopDay: number, stopSrc: string) => [
  {
    id: 'candle-7',
    day: 7,
    title: ar('كشف البيض بالكشاف'),
    detail: ar('شيل البيض الفاضي (رايق) أو اللي فيه حلقة دم.'),
  },
  {
    id: 'stop-disturb',
    day: stopDay,
    title: ar('ما تلمسش البيض تاني'),
    detail: ar(`آخر كشف لو محتاج؛ ${stopSrc}`),
  },
  {
    id: 'hatch',
    day: hatchDay,
    title: ar('ميعاد الفقس المتوقع'),
    detail: ar('سيب الأم مع الصغار، وحط مية قليلة العمق وأكل بادي جنبهم.'),
  },
]

// ---------- Profiles ----------

export const DUCK_PROFILES: BirdProfile[] = [
  {
    ...base,
    id: 'duck-pekin',
    name: ar('بط بكيني'),
    description: ar(
      'بط أبيض سريع النمو للحم (شيري فالي، جريمو، أورفيا). بيتباع وزنه 3–3.6 كجم في 5–6 أسابيع لو أكله متكامل. نادراً ما بيرقد.',
    ),
    purposes: ['meat'],
    dataStatus: 'full',
    feeding: {
      phases: feedPhases(14, 'duck_msdPekinNutr', 16),
      scraps,
      notes: [
        ...feedingNotes,
        ar('من عمر 4 أسابيع البكيني ممكن ياكل 100 جم علف أو أكتر في الوجبة (كورنيل).'),
      ],
    },
    cycle: {
      endpoint: 'market',
      endpointAge: sv(42, 'يوم', 'duck_lohmann2019', 'high', {
        min: 36,
        note: 'السلالات التجارية بتوصل 3 كجم في 36 يوم و3.6 كجم في 42 يوم.',
      }),
      template: duckCycle({
        id: 'duck-pekin',
        growerDay: 14,
        marketDay: 42,
        marketTitle: 'ما تكبرهاش بعد 10 أسابيع: الريش بيصعب في النتف والعلف بيروح على الفاضي.',
      }),
    },
    breeding: {
      broody: 'weak',
      incubationDays: sv(28, 'يوم', 'duck_cornellHatching', 'high'),
      checks: sittingChecks(28, 25, 'في المفرخة البيض بيتنقل للمفقس يوم 25 وما بيتقلبش بعدها.'),
      care: [
        ar(
          'البكيني نادراً ما ترقد؛ الأضمن تحط البيض تحت بطة مسكوفي (بتحضن 12–15 بيضة) أو فرخة راقدة (كورنيل).',
        ),
        ar(
          'حط البيض خلال 1–3 أيام من وضعه؛ التخزين أسبوع بيقلل الفقس حوالي 3٪ وأسبوعين حوالي 10٪ (كورنيل).',
        ),
        ar('دكر لكل 4–5 بطات كفاية للخصوبة (NC State).'),
      ],
    },
    expected: {
      bodyWeight: table(
        [
          [36, 3055],
          [42, 3600],
        ],
        'جم',
        'duck_lohmann2019',
        'high',
        {
          note: 'متوسط 5 سلالات تجارية (2018). البكيني العادي في مصر أبطأ بكتير: 2.9 كجم على 12 أسبوع في تجربة الزقازيق.',
        },
      ),
      feedToMarketKg: sv(7.3, 'كجم علف/طائر', 'duck_lohmann2019', 'medium', {
        note: 'محسوب: 3.6 كجم × معامل تحويل 2.03 عند 42 يوم.',
      }),
      eggsPerYear: sv(200, 'بيضة/سنة', 'duck_ukySelecting', 'medium', {
        note: 'تقريبي للبكيني؛ سلالات اللحم التجارية مش معمولة للبيض.',
      }),
    },
  },
  {
    ...base,
    id: 'duck-muscovy',
    name: ar('بط مسكوفي'),
    description: ar(
      'Cairina moschata — نوع مختلف عن البط العادي. لحمه أحمر قليل الدهن، بيستحمل الحر، والبطة أم ممتازة بترقد على بيضها. الدكر أكبر من البطة بحوالي 40٪.',
    ),
    purposes: ['meat', 'breeding'],
    dataStatus: 'full',
    feeding: {
      phases: feedPhases(28, 'duck_abdelHamid2023', 18),
      scraps,
      notes: feedingNotes,
    },
    cycle: {
      endpoint: 'market',
      endpointAge: sv(84, 'يوم', 'duck_pingel1999', 'high', {
        min: 70,
        note: 'الدكور على 12 أسبوع والإناث على 10 أسابيع. لازم يتدبح قبل 16 أسبوع وإلا اللحم بيجمد (كنتاكي).',
      }),
      template: duckCycle({
        id: 'duck-muscovy',
        growerDay: 28,
        marketDay: 84,
        marketTitle: 'الإناث ممكن تتباع من 10 أسابيع والدكور 12 أسبوع.',
      }),
    },
    breeding: {
      broody: 'yes',
      incubationDays: sv(35, 'يوم', 'duck_cornellHatching', 'high', {
        note: 'MSD وكنتاكي: 35 يوم. MSU بتدي 35–37.',
      }),
      eggsPerSitting: sv(13, 'بيضة', 'duck_cornellHatching', 'medium', { min: 12, max: 15 }),
      checks: sittingChecks(35, 31, 'في المفرخة البيض ما بيتقلبش بعد يوم 31.'),
      care: [
        ar('المسكوفي أم ممتازة وبتحضن 12–15 بيضة، وممكن تحضن بيض بط عادي كمان (كورنيل).'),
        ar('خصوبة المسكوفي أقل من البط العادي (كورنيل).'),
        ar('الدكور بتتخانق بضوافرها وجناحاتها — ما تكترش الدكور في مكان ضيق (مجلس أوروبا).'),
        ar('المسكوفي بيطير، فالسطح محتاج سقف سلك أو جناح مقصوص (كنتاكي).'),
      ],
    },
    expected: {
      bodyWeight: table(
        [
          [0, 51.65],
          [7, 140.8],
          [14, 243.78],
          [21, 358.15],
          [28, 937.75],
          [35, 1530.82],
          [42, 2056.98],
          [49, 2561.6],
          [56, 2961.9],
          [63, 3288.55],
          [70, 3610.8],
          [77, 3828.2],
          [84, 4029.9],
        ],
        'جم',
        'duck_abdelHamid2023',
        'medium',
        { note: 'تجربة في الزقازيق على 20 بطة دكور وإناث مع بعض. الدكر هيبقى أتقل والبطة أخف.' },
      ),
      adultWeightKg: sv(5, 'كجم', 'duck_ukySelecting', 'medium', {
        min: 2.3,
        max: 5.4,
        note: 'الدكر 4.5–5.4 كجم والبطة 2.3–2.7 كجم.',
      }),
      eggsPerYear: sv(85, 'بيضة/سنة', 'duck_pingel1999', 'medium', {
        min: 80,
        max: 90,
        note: 'في أول موسم بيض (حوالي 22 أسبوع). أول بيضة على عمر 28 أسبوع.',
      }),
      feedToMarketKg: sv(14.3, 'كجم علف/طائر', 'duck_abdelHamid2023', 'medium', {
        note: 'استهلاك البطة من يوم لـ 12 أسبوع في التجربة.',
      }),
    },
  },
  {
    ...base,
    id: 'duck-mulard',
    name: ar('بط مولار'),
    description: ar(
      'هجين من دكر مسكوفي وبطة بكيني. بينمو أسرع من المسكوفي وفرق الحجم بين الدكر والبطة صغير. عقيم — ما بيخلّفش.',
    ),
    purposes: ['meat'],
    dataStatus: 'full',
    feeding: {
      phases: feedPhases(28, 'duck_abdelHamid2023', 18),
      scraps,
      notes: feedingNotes,
    },
    cycle: {
      endpoint: 'market',
      endpointAge: sv(70, 'يوم', 'duck_pingel1999', 'high', {
        note: 'الدكر حوالي 4 كجم والبطة 3.6 كجم على 10 أسابيع.',
      }),
      template: duckCycle({
        id: 'duck-mulard',
        growerDay: 28,
        marketDay: 70,
        marketTitle: 'المولار بيتباع على حوالي 10 أسابيع.',
      }),
    },
    breeding: {
      broody: 'no',
      incubationDays: sv(30, 'يوم', 'duck_andrieux2023', 'low', {
        note: 'متوسط في مفرخة تجريبية (البيض اتنقل للمفقس يوم 28 والفقس خد لحد 4 أيام). ده بيض بطة بكيني ملقّحة من دكر مسكوفي.',
      }),
      checks: sittingChecks(30, 28, 'في التجربة البيض اتنقل للمفقس يوم 28.'),
      care: [
        ar(
          'المولار عقيم: لا البطة ولا الدكر بيخلّفوا. علشان تجيب مولار لازم بطة بكيني (أو بط عادي) ودكر مسكوفي (مجلس أوروبا، كورنيل).',
        ),
        ar(
          'بيض المولار نسبة فقسه حوالي 60٪ بس، ومحتاج دكر مسكوفي لكل بطتين علشان الخصوبة (Pingel).',
        ),
        ar('البطة البكيني الأم نادراً ما ترقد؛ حط البيض تحت بطة مسكوفي أو فرخة راقدة.'),
      ],
    },
    expected: {
      bodyWeight: table(
        [
          [0, 52.4],
          [7, 147.05],
          [14, 336.3],
          [21, 538.8],
          [28, 1043.6],
          [35, 1601.35],
          [42, 2089.1],
          [49, 2658.05],
          [56, 3062.8],
          [63, 3478.98],
          [70, 3746.3],
          [77, 4000.53],
          [84, 4234.76],
        ],
        'جم',
        'duck_abdelHamid2023',
        'medium',
        { note: 'تجربة في الزقازيق على 20 بطة دكور وإناث مع بعض.' },
      ),
      feedToMarketKg: sv(15.9, 'كجم علف/طائر', 'duck_abdelHamid2023', 'medium', {
        note: 'استهلاك البطة من يوم لـ 12 أسبوع؛ لو اتباع على 10 أسابيع هيبقى أقل.',
      }),
    },
  },
  {
    ...base,
    id: 'duck-baladi',
    name: ar('بط بلدي (دمياطي / سوداني)'),
    description: ar(
      'سلالات البط المحلي المصري. أبطأ في النمو من البكيني والمولار بس بيستحمل ظروف البيت. البيانات المنشورة عنه قليلة.',
    ),
    purposes: ['meat', 'breeding'],
    dataStatus: 'limited',
    feeding: {
      phases: feedPhases(28, 'duck_abdelHamid2023', 18),
      scraps,
      notes: [
        ...feedingNotes,
        ar('برنامج العلف مأخوذ من تجربة مصرية على سلالات تانية؛ مفيش برنامج منشور للبط البلدي.'),
      ],
    },
    cycle: {
      endpoint: 'market',
      endpointAge: sv(84, 'يوم', 'duck_radwan2019', 'medium', {
        note: '12 أسبوع هو عمر التسويق في الدراسة.',
      }),
      template: duckCycle({
        id: 'duck-baladi',
        growerDay: 28,
        marketDay: 84,
        marketTitle: 'البلدي بيتباع عادة على حوالي 12 أسبوع.',
      }),
    },
    breeding: {
      broody: 'weak',
      incubationDays: sv(28, 'يوم', 'duck_msdIncubation', 'medium', {
        note: 'رقم البط العادي؛ مفيش رقم خاص بالسلالات المصرية.',
      }),
      checks: sittingChecks(28, 25, 'في المفرخة البيض ما بيتقلبش بعد يوم 25.'),
      care: [
        ar(
          'مفيش مصدر منشور عن رقاد البط البلدي؛ لو البطة ما رقدتش حط البيض تحت بطة مسكوفي أو فرخة راقدة (كورنيل).',
        ),
        ar('الخصوبة والفقس في الدمياطي أعلى من السوداني في دراسة عين شمس.'),
        ar('حط البيض خلال 1–3 أيام من وضعه (كورنيل).'),
      ],
    },
    expected: {
      bodyWeight: table(
        [
          [0, 34.12],
          [28, 446.38],
          [56, 1235.98],
          [84, 1691.88],
        ],
        'جم',
        'duck_radwan2019',
        'medium',
        {
          note: 'أوزان الدمياطي. السوداني أتقل: 2.2 كجم على 12 أسبوع.',
        },
      ),
    },
  },
]
