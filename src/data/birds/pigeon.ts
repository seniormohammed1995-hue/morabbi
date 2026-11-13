import type { BirdProfile, ClimateBand, CycleTemplate, ScrapRule, Vaccination } from '../schema'
import { ar, avoidWith, REVIEWED, scrap, st, sv, table } from '../helpers'
import { SOURCES } from '../sources'

/**
 * Pigeons are kept as breeding PAIRS (unit: 'pairs'). Ages are the age of the pair (day 0 = hatch);
 * the cycle template counts from the day the pair arrives (day 0) to the first squabs ready.
 * Kind-level data lives in `base*` constants and is overridden per breed.
 */

// ---------- 6. Climate ----------
// The parents brood the squabs, so the loft limits are mostly adult limits.
// Young squabs (first ~2 weeks) are the weak point in cold weather.
const climate: { bands: ClimateBand[] } = {
  bands: [
    {
      fromDay: 0,
      toDay: 14,
      dangerLow: sv(8, '°C', 'pigeon_peng2023', 'low', {
        note: 'تجربة شتوية اتربّت فيها الزغاليل في غية متوسطها 11±3 درجة؛ أقل من كده مش مدروس، والإرشاد الأمريكي بيقول زغاليل الشتا كتير منها بتموت من البرد.',
      }),
      comfortMin: sv(14, '°C', 'pigeon_peng2023', 'low', {
        note: 'الزغلول الصغير ريشه قليل وبيعتمد على دفا أهله. الرقم أعلى حد في التجربة الشتوية (11±3)، مش حد رسمي.',
      }),
      comfortMax: sv(28, '°C', 'pigeon_jeb1998', 'medium', {
        note: 'الحمام كان في راحة حرارية عند حوالي 28 درجة في التجربة.',
      }),
      dangerHigh: sv(34, '°C', 'pigeon_heat2018', 'medium', {
        note: 'بحث مصري: 34 درجة (صيف مصر) عملت إجهاد حراري للحمام وقللت أكله ووزنه. الحرارة العادية للتربية حوالي 22 درجة.',
      }),
      rhMax: sv(65, '٪', 'cobb21', 'low', {
        note: 'مفيش رقم رطوبة خاص بالحمام؛ مأخوذ من دليل الفراخ. الحمام بيستحمل الحر والبرد أحسن من الرطوبة.',
      }),
    },
    {
      fromDay: 15,
      toDay: 3650,
      dangerLow: sv(0, '°C', 'pigeon_jeb1998', 'low', {
        note: 'الحمام الكبير استحمل -10 في تجربة بس حرقه اتضاعف 3 مرات. اخترنا الصفر حد أحمر احتياطي؛ المهم المكان يكون ناشف ومن غير تيارات.',
      }),
      comfortMin: sv(8, '°C', 'pigeon_peng2023', 'low', {
        note: 'أقل حد في التجربة الشتوية اللي الحمام ربّى فيها عادي. لو في زغاليل صغيرة في الأعشاش راعي حدود أول أسبوعين.',
      }),
      comfortMax: sv(28, '°C', 'pigeon_jeb1998', 'medium', {
        note: 'الحمام كان في راحة حرارية عند حوالي 28 درجة في التجربة.',
      }),
      dangerHigh: sv(34, '°C', 'pigeon_heat2018', 'medium', {
        note: 'بحث مصري: 34 درجة عملت إجهاد حراري؛ طبق مية للاستحمام قلل الضرر.',
      }),
      rhMax: sv(65, '٪', 'cobb21', 'low', {
        note: 'مفيش رقم رطوبة خاص بالحمام؛ مأخوذ من دليل الفراخ.',
      }),
    },
  ],
}

// ---------- 2. Household scraps ----------
const scraps: ScrapRule[] = [
  scrap(
    'bread',
    'limit',
    'شوية عيش ناشف مفتت مش مشكلة، بس الحمام أكله الأساسي حب. ما تسيبوش يعفن.',
    'pigeon_wi4h',
    'low',
  ),
  scrap(
    'moldy-food',
    'no',
    'العفن بيمرض الطيور. الإرشاد بيقول الحب لازم يكون قديم وناشف ومن غير عفن.',
    'pigeon_ext',
    'medium',
  ),
  scrap(
    'rice-cooked',
    'limit',
    'ممكن شوية قليلة، بس بيحمض بسرعة في الحر. الأحسن رز ني.',
    'pigeon_wi4h',
    'low',
  ),
  scrap('rice-raw', 'ok', 'الرز من الحبوب اللي ينفع تدخل في خلطة الحمام.', 'pigeon_ext', 'medium'),
  scrap(
    'pasta',
    'limit',
    'مالهاش لازمة للحمام؛ لو اديت شوية تكون مسلوقة من غير صلصة وملح.',
    'pigeon_wi4h',
    'low',
  ),
  scrap(
    'potato-peel',
    'no',
    'الحمام بياكل حب وبذور، وقشر البطاطس الني مش أكله ويعفن بسرعة.',
    'pigeon_ext',
    'low',
  ),
  scrap(
    'potato-cooked',
    'limit',
    'مش أكل حمام؛ شوية صغيرة مهروسة من غير ملح بس.',
    'pigeon_ext',
    'low',
  ),
  scrap(
    'greens',
    'limit',
    'شوية خضرة مفرومة نضيفة مقبولة، بس الحمام أساسه حب.',
    'pigeon_ext',
    'low',
  ),
  scrap('cabbage', 'limit', 'كمية صغيرة مفرومة بس؛ الكتير يليّن الزرق.', 'pigeon_ext', 'low'),
  scrap('cucumber', 'limit', 'فيه مية كتير وأكل قليل؛ حتة صغيرة في الحر بس.', 'pigeon_ext', 'low'),
  scrap('tomato', 'limit', 'حتة صغيرة مستوية بس، وما تسيبهاش تبوظ في المكان.', 'pigeon_ext', 'low'),
  scrap('carrot', 'limit', 'مبشور شوية صغيرة مقبول، بس الحب هو الأساس.', 'pigeon_ext', 'low'),
  scrap(
    'watermelon',
    'limit',
    'حتة صغيرة في الحر؛ الكتير يليّن الزرق ويجيب دبان.',
    'pigeon_ext',
    'low',
  ),
  scrap('fruit', 'limit', 'حتت صغيرة من غير بذر، مش أكل أساسي للحمام.', 'pigeon_ext', 'low'),
  scrap('citrus', 'no', 'الحمام مش بياكله، وبيعفن في المكان ويجيب حشرات.', 'pigeon_ext', 'low'),
  scrap(
    'onion-garlic',
    'no',
    'البصل والتوم بيكسّروا كرات الدم الحمرا في الطيور ويعملوا أنيميا.',
    'pigeon_illinoisToxic',
    'medium',
  ),
  scrap('avocado', 'no', 'الأفوكادو سام للطيور، وكمية صغيرة ممكن تموّت.', 'pigeon_msdFood', 'high'),
  scrap(
    'chocolate',
    'no',
    'الشوكولاتة فيها منبهات بتعمل رعشة وتشنجات وممكن موت.',
    'pigeon_illinoisToxic',
    'medium',
  ),
  scrap('coffee-tea', 'no', 'الكافيين منبه وخطر على الطيور.', 'pigeon_illinoisToxic', 'medium'),
  scrap(
    'salty',
    'no',
    'الملح الكتير بيسمّم الطيور: عطش وإسهال وشلل في الرجلين.',
    'pigeon_msdSalt',
    'medium',
  ),
  scrap(
    'fried',
    'no',
    'أكل الحمام بسيط: حب وزلط ومية. الزيت والمقلي بيبوظ ومالوش لازمة.',
    'pigeon_wi4h',
    'low',
  ),
  scrap('sweets', 'no', 'مالهاش مكان في أكل الحمام اللي هو حب وزلط ومية.', 'pigeon_wi4h', 'low'),
  scrap(
    'meat-scraps',
    'no',
    'الحمام بياكل حب وبذور ونادراً بياكل حشرات؛ اللحمة بتبوظ وتجيب أمراض.',
    'pigeon_ext',
    'medium',
  ),
  scrap(
    'fish-scraps',
    'no',
    'الحمام مش آكل لحوم، وبواقي السمك بتبوظ بسرعة.',
    'pigeon_ext',
    'medium',
  ),
  scrap(
    'eggshell',
    'ok',
    'الحمام محتاج كالسيوم (زي صدف المحار) علشان قشر البيض. قشر البيض مسلوق أو محمّص ومدقوق كويس.',
    'pigeon_wi4h',
    'low',
  ),
  scrap(
    'egg-cooked',
    'limit',
    'شوية مهروسة أحياناً للأهالي وقت تربية الزغاليل، مش أكل يومي.',
    'pigeon_wi4h',
    'low',
  ),
  scrap(
    'beans-raw',
    'ok',
    'البقوليات الناشفة زي البسلة والفول الصويا من أكل الحمام. للحمام الصغير اكسرها أو اختار الحب الصغير.',
    'pigeon_ext',
    'medium',
  ),
  scrap(
    'beans-cooked',
    'limit',
    'المطبوخ فيه ملح وبيحمض بسرعة؛ الناشف الني أحسن.',
    'pigeon_ext',
    'low',
  ),
  scrap(
    'grains',
    'ok',
    'ده الأكل الأساسي: ذرة وقمح وشعير وغيرهم، ويفضل 4 أنواع حب أو أكتر.',
    'pigeon_ext',
    'high',
  ),
  scrap(
    'clover',
    'limit',
    'شوية برسيم طري مقبول، بس الحمام مش طير رعي زي البط والوز.',
    'pigeon_ext',
    'low',
  ),
  scrap('dates', 'limit', 'حتت صغيرة من غير نوى أحياناً بس، فيه سكر كتير.', 'pigeon_wi4h', 'low'),
]

// ---------- 5. Health ----------
const vacc = (
  id: string,
  day: number,
  disease: string,
  vaccine: string,
  route: Vaccination['route'],
  note: string,
): Vaccination => ({
  id,
  day,
  disease: ar(disease),
  vaccine: ar(vaccine),
  route,
  note: ar(note),
  source: SOURCES.pigeon_ppmvEgypt2024.title,
  sourceUrl: SOURCES.pigeon_ppmvEgypt2024.url,
  confidence: 'low',
  lastReviewed: REVIEWED,
})

/** From a published Egyptian trial (Zagazig, 2024) — an experimental regimen, not an official programme. */
const vaccinations: Vaccination[] = [
  vacc(
    'nd-live',
    42,
    'نيوكاسل',
    'حي (عترة لاسوتا)',
    'eye-drop',
    'البرنامج ده من تجربة بحثية مصرية، مش برنامج رسمي. استشير طبيب بيطري قبل التحصين، وخصوصاً لو الحمام كبير ومش متحصن قبل كده.',
  ),
  vacc(
    'ppmv-killed',
    43,
    'باراميكسو الحمام',
    'ميت (من عترة حمام مصرية)',
    'injection',
    'في التجربة: الميت مع اللاسوتا حمى 100٪ من النفوق، واللاسوتا لوحدها 62.5٪ بس.',
  ),
  vacc(
    'nd-live-boost',
    56,
    'نيوكاسل',
    'حي (عترة لاسوتا) — جرعة تانية',
    'eye-drop',
    'بعد أسبوعين من الجرعة الأولى، زي التجربة.',
  ),
]

const problems = [
  st(
    'باراميكسو الحمام (قريب النيوكاسل): لف الرقبة، عدم توازن، رعشة، وإسهال. ممكن يموّت حوالي 40٪، والعترة المصرية موّتت 62.5٪ من الحمام غير المتحصن في التجربة. استشير طبيب بيطري للتحصينات.',
    'pigeon_ppmvEgypt2024',
    'high',
  ),
  st(
    'الكانكر (التريكوموناس): قشور صفرا في بق الزغلول وزوره، وممكن يخنقه. بيقتل الزغاليل حوالي أسبوعين من عمرها، والأهل بينقلوه من غير ما يبان عليهم.',
    'pigeon_wi4h',
    'high',
  ),
  st(
    'في الجيزة الكانكر لقوه في 62.5٪ من الزغاليل مقابل 6.2٪ من الكبار، و97٪ من الحمام كان عنده ديدان أو طفيليات معوية. الطبيب البيطري يحدد العلاج.',
    'pigeon_parasitesGiza2022',
    'high',
  ),
  st(
    'السقايات الوسخة أهم طريق للكانكر: نضّف المعالف والسقايات كتير، وافصل الحمام الحامل للمرض عن الأمهات والآباء.',
    'pigeon_msdTrich',
    'high',
  ),
  st(
    'جدري الحمام: قشور ناشفة فاتحة حوالين البق والعين بتعطّل الأكل والشرب. في له تطعيم؛ اسأل الطبيب البيطري.',
    'pigeon_wi4h',
    'medium',
  ),
  st(
    'الحر: عند حوالي 34 درجة الحمام بيقل أكله ووزنه. طبق مية للاستحمام بيخفف الإجهاد.',
    'pigeon_heat2018',
    'medium',
  ),
]

const dangerSigns = [
  ar(
    'حمام بيلف رقبته أو بيقع أو مش قادر يلقط الحب — اعزله فوراً وكلّم طبيب بيطري (اشتباه باراميكسو).',
  ),
  ar('زغلول بقه فيه قشور صفرا أو بيفتح بقه ومش قادر يبلع — كانكر.'),
  ar('زرق مية أو أخضر مع حمام منفوش ومكسل.'),
  ar(
    'نفوق أكتر من طير في يومين — اعزل وكلّم طبيب بيطري، وما تبيعش ولا تشتري حمام لحد ما تعرف السبب.',
  ),
  ar('حمام بينهج وجناحه مفتوح في الحر — ظل ومية باردة وطبق استحمام.'),
]

// ---------- 3. Cycle ----------
/** Day 0 = the pair arrives. Laying 6–10 days after mating, 18 days sitting, squabs ready at ~28 days. */
function pairCycle(speciesId: string, endTitle: string, endDetail: string): CycleTemplate {
  return {
    speciesId,
    prepDays: 7,
    stages: [
      {
        id: 'prep',
        name: ar('تجهيز الغية'),
        fromDay: -7,
        toDay: -1,
        summary: ar('تنضيف وتطهير، سد فتحات القطط والفيران، وتجهيز عشّين لكل جوز.'),
      },
      {
        id: 'settle',
        name: ar('استقبال وتجويز'),
        fromDay: 0,
        toDay: 7,
        summary: ar('الجوز يتعود على المكان وعلى بعض. ما تطلّقش الحمام برّه لسه.'),
      },
      {
        id: 'laying',
        name: ar('بناء العش والبيض'),
        fromDay: 8,
        toDay: 9,
        summary: ar('البيض بييجي عادة بعد 6–10 أيام من التجويز: بيضتين بينهم يوم.'),
      },
      {
        id: 'sitting',
        name: ar('رقاد'),
        fromDay: 10,
        toDay: 26,
        summary: ar('الدكر والأنثى بيتبادلوا الرقاد حوالي 18 يوم. ما تقلقهمش.'),
      },
      {
        id: 'squabs',
        name: ar('تربية الزغاليل'),
        fromDay: 27,
        toDay: 60,
        summary: ar(
          'الأهل بيأكلوا الزغاليل لبن الحوصلة وبعدين حب مطري. الزغلول جاهز حوالي 28 يوم.',
        ),
      },
    ],
    tasks: [
      {
        id: 'clean',
        fromDay: -7,
        toDay: -7,
        kind: 'prep',
        daily: false,
        title: ar('نضّف الغية وطهّرها'),
        detail: ar('شيل الزرق والأعشاش القديمة، اغسل وطهّر وسيبها تنشف.'),
      },
      {
        id: 'pests',
        fromDay: -6,
        toDay: -6,
        kind: 'house',
        daily: false,
        title: ar('سد الفتحات بسلك ضيق'),
        detail: ar('القطط والفيران والتعابين بياكلوا البيض والزغاليل. سلك ضيق على كل الفتحات.'),
      },
      {
        id: 'nests',
        fromDay: -4,
        toDay: -4,
        kind: 'prep',
        daily: false,
        title: ar('جهّز عشّين لكل جوز'),
        detail: ar(
          'الأنثى بتبيض تاني قبل ما الزغاليل تكبر، فلازم عش تاني. حط قش أو تبن نضيف للعش، وعلى الأقل مجثم لكل جوز.',
        ),
      },
      {
        id: 'grit',
        fromDay: -1,
        toDay: -1,
        kind: 'feed',
        daily: false,
        title: ar('جهّز الحب والزلط والمية'),
        detail: ar(
          'خلطة حب، زلط ناعم وصدف (كالسيوم) في مكان لوحده، وسقاية غويطة كفاية لأن الحمام بيشرب شفط.',
        ),
      },
      {
        id: 'receive',
        fromDay: 0,
        toDay: 0,
        kind: 'brooding',
        daily: false,
        title: ar('استلم الجوز'),
        detail: ar(
          'اتأكد إنه جوز فعلاً (دكر وأنثى) ومجوّزين. افحص البق والعين والريش، واعزل الجديد عن حمامك القديم.',
        ),
      },
      {
        id: 'pairing',
        fromDay: 0,
        toDay: 7,
        kind: 'house',
        daily: false,
        title: ar('سيب الجوز يتعرف على بعض'),
        detail: ar(
          'لو مش مجوّزين: حطهم في صندوق بينهم سلك لحد ما يتعودوا على بعض. الطير الفرداني بيعمل خناقات ويكسر البيض.',
        ),
      },
      {
        id: 'water',
        fromDay: 0,
        toDay: 60,
        kind: 'house',
        daily: true,
        title: ar('نضّف السقاية وغيّر المية'),
        detail: ar('السقاية الوسخة أول طريق للكانكر. اغسلها وطهّرها مرة في الأسبوع على الأقل.'),
      },
      {
        id: 'feed-once',
        fromDay: 0,
        toDay: 60,
        kind: 'feed',
        daily: true,
        title: ar('أكّل اللي يخلّصوه بس'),
        detail: ar('الحب اللي بيفضل بيعفن. وقت تربية الزغاليل ما تسيبهمش من غير أكل.'),
      },
      {
        id: 'first-egg',
        fromDay: 8,
        toDay: 8,
        kind: 'brooding',
        daily: false,
        title: ar('أول بيضة متوقعة'),
        detail: ar('بيضة، يوم راحة، والتانية. ما تلمسش العش.'),
      },
      {
        id: 'second-nest',
        fromDay: 26,
        toDay: 26,
        kind: 'prep',
        daily: false,
        title: ar('جهّز العش التاني نضيف'),
        detail: ar('علشان الأنثى تبيض فيه وهي لسه بتأكّل الزغاليل.'),
      },
      {
        id: 'hatch',
        fromDay: 26,
        toDay: 27,
        kind: 'brooding',
        daily: false,
        title: ar('الفقس متوقع'),
        detail: ar('البيضة الأولى بتفقس قبل التانية بيوم تقريباً. اتأكد إن الصغير بياكل.'),
      },
      {
        id: 'canker-check',
        fromDay: 36,
        toDay: 42,
        kind: 'health',
        daily: false,
        title: ar('افحص بق الزغاليل'),
        detail: ar(
          'الكانكر بيضرب حوالي أسبوعين من العمر: قشور صفرا في البق أو الزور = طبيب بيطري.',
        ),
      },
      {
        id: 'band',
        fromDay: 36,
        toDay: 36,
        kind: 'weigh',
        daily: false,
        title: ar('حلّق الزغاليل'),
        detail: ar('الحلقة المقفولة بتتركب حوالي 10 أيام من العمر وبتفضل طول العمر.'),
      },
      {
        id: 'end',
        fromDay: 54,
        toDay: 54,
        kind: 'market',
        daily: false,
        title: ar(endTitle),
        detail: ar(endDetail),
      },
    ],
    signs: [
      {
        fromDay: 0,
        toDay: 10,
        severity: 'watch',
        text: ar('الطيرين بيتخانقوا جامد ومش بيقربوا لبعض — ممكن يكونوا مش دكر وأنثى.'),
      },
      {
        fromDay: 27,
        toDay: 45,
        severity: 'urgent',
        text: ar('زغلول بقه فيه قشور صفرا أو بيتخنق — كانكر، كلّم طبيب بيطري.'),
      },
      {
        fromDay: 27,
        toDay: 45,
        severity: 'watch',
        text: ar('زغلول أصغر بكتير من أخوه — ممكن الكبير واخد الأكل كله.'),
      },
      {
        fromDay: 0,
        toDay: 60,
        severity: 'urgent',
        text: ar('حمام بيلف رقبته أو مش متوازن أو زرقه مية — اعزله وكلّم طبيب بيطري.'),
      },
      {
        fromDay: 0,
        toDay: 60,
        severity: 'watch',
        text: ar('حمام بينهج وجناحه مفتوح = حر. ظل ومية باردة وطبق استحمام.'),
      },
    ],
  }
}

const endpointAge = sv(54, 'يوم من استلام الجوز', 'pigeon_zag2019', 'medium', {
  min: 49,
  max: 60,
  note: 'محسوب: البيض بعد 6–10 أيام من التجويز + 18 يوم رقاد + الزغلول يسيب العش في 25–32 يوم.',
})

// ---------- 4. Breeding ----------
const incubationDays = sv(18, 'يوم', 'pigeon_zag2019', 'high', {
  min: 17,
  note: 'في الحمام البلدي 18 يوم. الإرشاد الأمريكي بيقول حوالي 17.',
})
const eggsPerSitting = sv(2, 'بيضة', 'pigeon_wi4h', 'high', {
  note: 'بيضة، يوم راحة، والتانية — ودول كل البيض في المرة.',
})

const checks = [
  {
    id: 'egg-1',
    day: 0,
    title: ar('أول بيضة'),
    detail: ar('الرقاد بيبدأ من أول بيضة. ابعد عن العش وما تقلقهمش.'),
  },
  {
    id: 'egg-2',
    day: 2,
    title: ar('البيضة التانية'),
    detail: ar('الأنثى بتفوّت يوم وتبيض التانية. أكتر من بيضتين في العش = غالباً أنثيين مع بعض.'),
  },
  {
    id: 'shift',
    day: 3,
    title: ar('الأب والأم بيتبادلوا الرقاد'),
    detail: ar(
      'الأنثى بترقد من العصر لتاني يوم، والدكر بيقعد مكانها وهي بتاكل وترتاح. ده طبيعي، ما تشيلش حد منهم.',
    ),
  },
  {
    id: 'hatch',
    day: 18,
    title: ar('الفقس متوقع'),
    detail: ar('في الحمام البلدي 18 يوم (17–18). البيضة التانية بتفقس بعدها بحوالي يوم.'),
  },
  {
    id: 'second-nest',
    day: 18,
    title: ar('جهّز عش تاني'),
    detail: ar('الأنثى بتبيض تاني وهي لسه بتأكّل الزغاليل، فلازم عش نضيف جنب الأول.'),
  },
  {
    id: 'feeding',
    day: 19,
    title: ar('اتأكد إن الزغلولين بياكلوا'),
    detail: ar(
      'الأهل بيأكلوا لبن الحوصلة. الأصغر ممكن الكبير يسبقه على الأكل — راقب الحوصلة إنها مليانة.',
    ),
  },
  {
    id: 'band',
    day: 28,
    title: ar('حلّق الزغاليل (حوالي 10 أيام)'),
    detail: ar('الحلقة المقفولة بتدخل من الرجل في السن ده وبتفضل طول العمر.'),
  },
  {
    id: 'canker',
    day: 32,
    title: ar('افحص بق الزغاليل'),
    detail: ar('الكانكر بيقتل الزغاليل حوالي أسبوعين من عمرها. قشور صفرا = طبيب بيطري.'),
  },
  {
    id: 'ready',
    day: 46,
    title: ar('الزغاليل كبرت (حوالي 28 يوم)'),
    detail: ar(
      'في السن ده بتكون مليانة وجاهزة تسيب العش. لو ما اتشالتش، الأهل ممكن يزقّوها من العش علشان البيض الجديد.',
    ),
  },
]

const baseCare = [
  ar(
    'الأب والأم الاتنين بيرقدوا وبيأكلوا الزغاليل لبن الحوصلة؛ لبن الحوصلة بيستمر لحد حوالي 14–25 يوم.',
  ),
  ar(
    'لو مات واحد من الأهل، التاني بيكمل بس الزغاليل بتطلع أخف. لو ماتوا الاتنين، التربية بالإيد عاشت 85٪ مقابل 65٪ مع أهل بالتبني في تجربة مصرية.',
  ),
  ar(
    'الزغلول اللي بيتربى بالإيد من غير أهل محتاج حوالي 35 درجة أول يوم، وتنزل درجة كل يوم لحد 30، وبعدين حرارة الأوضة (22–24) على 14–16 يوم.',
  ),
  ar(
    'في الشتا بعض المربين بيشيلوا الأعشاش ويريّحوا الحمام، لأن زغاليل الشتا كتير منها بتموت من البرد.',
  ),
]

// ---------- 1. Housing ----------
const space = [
  {
    fromDay: 0,
    toDay: 3650,
    perM2: sv(2.7, 'جوز/م²', 'pigeon_wi4h', 'medium', {
      note: '4 قدم مربع (حوالي 0.37 م²) لكل جوز جوه الغية، ويفضّل نفس المساحة برّه كقفص طيران. الزغاليل بتفضل في العش مع أهلها.',
    }),
  },
]
const birdsPerNest = sv(0.5, 'جوز/عش', 'pigeon_wi4h', 'high', {
  note: 'عشّين على الأقل لكل جوز (عش حوالي 30×30 سم). أعشاش زيادة بتقلل الخناق.',
})

const housingNotes = [
  ar('المكان لازم يكون ليه سقف وناشف. الحمام بيستحمل الحر والبرد أحسن من الرطوبة.'),
  ar('مجثم لكل جوز على الأقل، وكل عش له لوح قدامه علشان الزغاليل ما تقعش.'),
  ar(
    'طبق مية للاستحمام مرة أو مرتين في الأسبوع لمدة ساعتين وبعدين يتشال. في الشتا في الأيام الدافية بس.',
  ),
  ar('مكان لوحده للحمام الصغير بعد ما يسيب العش، وما تسيبش طير فرداني مع الأجواز.'),
  ar('سلك ضيق على كل الفتحات ضد القطط والفيران والتعابين، وقفل على الباب.'),
]

const water = ar(
  'سقاية مقفولة من فوق ونضيفة دايماً، والمية غويطة كفاية لأن الحمام بيشرب شفط مش بيغطّس منقاره زي الفراخ. اغسلها وطهّرها مرة في الأسبوع على الأقل.',
)

// ---------- 2. Feeding ----------
const phases = [
  {
    id: 'squab',
    name: ar('زغلول في العش'),
    fromDay: 0,
    toDay: 28,
    note: ar(
      'الأهل بيأكلوه لبن الحوصلة وبعدين حب مطري. انت بتأكّل الأهل: أكل دايماً قدامهم وقت التربية.',
    ),
  },
  {
    id: 'young',
    name: ar('حمام صغير (بعد العش)'),
    fromDay: 29,
    toDay: 210,
    note: ar('خلطة حب + زلط ناعم ومية نضيفة. الأنثى بتبلغ حوالي 7 شهور.'),
  },
  {
    id: 'breeder',
    name: ar('أجواز بالغة'),
    fromDay: 211,
    toDay: 3650,
    crudeProtein: sv(16.5, '٪', 'pigeon_zag2019', 'medium', {
      min: 15,
      max: 18,
      note: 'عليقة 15–18٪ بروتين بتحسن الإنتاج والتفريخ. في تجربة صينية 18٪ زودت وزن الزغاليل في الشتا.',
    }),
    note: ar('خلطة حب أو حبوب مع مصبعات حمام. المصبعات بتساعد الأهل وهي بتأكّل الزغاليل.'),
  },
]

const feedingNotes = [
  ar(
    '4 أنواع حب أو أكتر (ذرة، قمح، شعير، رز، ذرة رفيعة، بسلة ناشفة...). الحب يكون قديم وناشف: مش محصود من أقل من 3 شهور.',
  ),
  ar(
    'اديهم اللي يخلّصوه في الوجبة بس علشان الحب ما يعفنش. وقت تربية الزغاليل ما تسيبهمش من غير أكل.',
  ),
  ar(
    'زلط ناعم (جريت) وصدف أو كالسيوم دايماً في مكان لوحده — الزلط زي السنان للحمام. حوالي 2.7 كجم للجوز في السنة.',
  ),
  ar('المصبعات لوحدها ممكن تليّن الزرق؛ اخلطها مع الحب (نص ونص أو ربع وتلات تربع).'),
]

// ---------- 7. Mixing ----------
const mixing = {
  okWith: [],
  avoid: [
    avoidWith(
      'chicken',
      'الحمام بيشيل باراميكسو (قريب النيوكاسل)، والعترة المصرية طلعت قاتلة للفراخ كمان. المية المشتركة كمان بتنقل الكانكر.',
      'pigeon_ppmvEgypt2024',
      'high',
    ),
    avoidWith(
      'turkey',
      'الحمام ممكن ينقل النيوكاسل للدواجن، والكانكر بيتنقل في المية المشتركة وعمل وبائيات في الرومي.',
      'pigeon_msdND',
      'medium',
    ),
    avoidWith(
      'quail',
      'السمان من الدواجن اللي النيوكاسل بيصيبها، والحمام من مصادر العدوى للدواجن.',
      'pigeon_msdND',
      'medium',
    ),
    avoidWith(
      'duck',
      'البط ممكن يشيل أنفلونزا الطيور من غير ما يبان عليه، وبيبلّ المكان — والحمام بيتعب من الرطوبة.',
      'pigeon_msdAI',
      'medium',
    ),
    avoidWith(
      'goose',
      'الوز زي البط ممكن يشيل أنفلونزا الطيور من غير أعراض، ومحتاج مية كتير تبلّ المكان.',
      'pigeon_msdAI',
      'medium',
    ),
  ],
} satisfies BirdProfile['mixing']

// ---------- Profile builder ----------
interface BreedOpts {
  id: string
  name: string
  description: string
  purposes: BirdProfile['purposes']
  dataStatus: BirdProfile['dataStatus']
  housingType: string
  spaceNote?: string
  extraHousingNotes?: string[]
  extraFeedingNotes?: string[]
  broody: BirdProfile['breeding']['broody']
  extraCare?: string[]
  endTitle: string
  endDetail: string
  expected: BirdProfile['expected']
}

function pigeon(o: BreedOpts): BirdProfile {
  return {
    id: o.id,
    kind: 'pigeon',
    name: ar(o.name),
    description: ar(o.description),
    purposes: o.purposes,
    dataStatus: o.dataStatus,
    unit: 'pairs',
    defaultAge: 240,
    housing: {
      type: ar(o.housingType),
      space: o.spaceNote
        ? space.map((b) => ({
            ...b,
            perM2: { ...b.perM2, confidence: 'low' as const, note: ar(o.spaceNote!) },
          }))
        : space,
      birdsPerNest,
      water,
      notes: [...housingNotes, ...(o.extraHousingNotes ?? []).map(ar)],
    },
    feeding: {
      phases,
      scraps,
      notes: [...feedingNotes, ...(o.extraFeedingNotes ?? []).map(ar)],
    },
    cycle: {
      endpoint: 'first-squab',
      endpointAge,
      template: pairCycle(o.id, o.endTitle, o.endDetail),
    },
    breeding: {
      broody: o.broody,
      incubationDays,
      eggsPerSitting,
      checks,
      care: [...baseCare, ...(o.extraCare ?? []).map(ar)],
    },
    health: { vaccinations, problems, dangerSigns },
    climate,
    mixing,
    expected: o.expected,
  }
}

export const PIGEON_PROFILES: BirdProfile[] = [
  pigeon({
    id: 'pigeon-baladi',
    name: 'حمام بلدي',
    description:
      'الحمام المصري البلدي: متعود على الجو، أهله شاطرين في التربية، وزغاليله للأكل أو للهواية. أخف من حمام الزغاليل الأجنبي وبيبيض أبطأ.',
    purposes: ['squab', 'hobby'],
    dataStatus: 'full',
    housingType:
      'غية على السطح أو برج طين، أو أوضة صغيرة ناشفة فيها أعشاش على الحيطة وقفص طيران من السلك.',
    broody: 'yes',
    endTitle: 'أول زغاليل جاهزة',
    endDetail:
      'حوالي 28 يوم من الفقس الزغلول بيكون مليان وجاهز قبل ما يسيب العش. في تجربة مصرية زغلول البلدي وصل حوالي 470 جم في 4 أسابيع.',
    expected: {
      adultWeightKg: sv(0.415, 'كجم', 'pigeon_baladi2026', 'high', {
        note: 'متوسط وزن الأجواز البلدي في تجربة جامعة مطروح.',
      }),
      bodyWeight: table(
        [
          [0, 17.4],
          [7, 157],
          [28, 458],
        ],
        'جم',
        'pigeon_matrouh2025',
        'low',
        {
          note: 'المنحنى من حمام زغاليل (وايت ميرثيس) في مطروح؛ زغلول البلدي وصل 467 جم في 4 أسابيع في تجربة الزقازيق، فالقيم قريبة بس مش للبلدي بالظبط.',
        },
      ),
    },
  }),
  pigeon({
    id: 'pigeon-squab',
    name: 'حمام زغاليل (كينج، كارنو، مونديان، رنت)',
    description:
      'سلالات تقيلة متربية لإنتاج الزغاليل: الزغلول بيوصل 450–700 جم، والجوز بيطلع حوالي 12 زغلول في السنة. محتاجة أكل كويس دايماً قدام الأهل.',
    purposes: ['squab'],
    dataStatus: 'full',
    housingType: 'غية أو أوضة ناشفة، أو أقفاص أجواز (حوالي 60×60×50 سم بعشّين) زي مزارع الزغاليل.',
    extraHousingNotes: ['في مزرعة مصرية كل جوز كان في قفص 60×60 سم وارتفاع 50 فيه عشّين.'],
    extraFeedingNotes: [
      'في التجربة المصرية الأهالي أكلوا مصبعات 17.3٪ بروتين مع أكل ومية دايماً قدامهم.',
    ],
    broody: 'yes',
    extraCare: ['ممكن الجوز يربّي 3 زغاليل بس في الشتا ده بيزود النفوق.'],
    endTitle: 'أول زغاليل جاهزة للبيع',
    endDetail: 'الزغلول بيتشال حوالي 26–30 يوم قبل ما يسيب العش، ووزنه حوالي 450–500 جم.',
    expected: {
      bodyWeight: table(
        [
          [0, 17.4],
          [7, 157],
          [28, 458],
        ],
        'جم',
        'pigeon_matrouh2025',
        'medium',
        {
          note: 'زغاليل وايت ميرثيس متربية مع أهلها في مطروح. الكينج والمونديان قريبين في الحجم بس مش نفس السلالة.',
        },
      ),
      adultWeightKg: sv(0.505, 'كجم', 'pigeon_baladi2026', 'medium', {
        min: 0.505,
        max: 0.618,
        note: 'وايت ميرثيس في مصر حوالي 505 جم؛ إناث سلالة أوروبية في الصين حوالي 618 جم.',
      }),
      squabsPerPairYear: sv(12, 'زغلول/جوز/سنة', 'pigeon_matrouh2025', 'medium', {
        note: 'مع الفطام الطبيعي. في التجربة طلّعوا حوالي 7.4 زغلول في 160 يوم.',
      }),
    },
  }),
  pigeon({
    id: 'pigeon-homer',
    name: 'حمام زاجل',
    description:
      'حمام سباق ورجوع للبيت: طيار قوي وبيرجع من مسافات بعيدة. بيتربى للهواية والسباقات، وأهله بيربّوا عادي زي البلدي.',
    purposes: ['hobby'],
    dataStatus: 'full',
    housingType: 'غية على السطح بباب طلعة ورجعة (مصيدة) وأعشاش على الحيطة، مع مكان لوحده للصغيرين.',
    extraHousingNotes: ['الحمام الجديد يفضل جوه الغية لحد ما يتعود عليها قبل أول طلعة.'],
    broody: 'yes',
    endTitle: 'الزغاليل طلعت من العش',
    endDetail:
      'حوالي 28 يوم الزغلول بيسيب العش. انقله لمكان الصغيرين وابدأ تعوّده على الغية قبل الطيران برّه.',
    expected: {
      adultWeightKg: sv(0.467, 'كجم', 'pigeon_racing2021', 'high', {
        min: 0.352,
        max: 0.577,
        note: 'متوسط 40 حمامة سباق سليمة (ذكور وإناث، 1–8 سنين).',
      }),
    },
  }),
  pigeon({
    id: 'pigeon-fancy',
    name: 'حمام زينة',
    description:
      'سلالات للشكل والمعارض (هزاز، نفّاخ، جاكوبين، وغيرها). أحجامها وطباعها مختلفة جداً، والبيانات عنها قليلة فالأرقام هنا من الحمام عامة.',
    purposes: ['hobby'],
    dataStatus: 'limited',
    housingType: 'غية أو أوضة نضيفة وناشفة فيها أعشاش ومجاثم، وأقفاص عرض للطيور الغالية.',
    spaceNote:
      'الرقم للحمام عامة (4 قدم² لكل جوز). السلالات الكبيرة أو اللي ريشها كتير محتاجة مساحة أكبر.',
    extraHousingNotes: ['السلالات اللي ريش رجليها كتير محتاجة أرضية ناشفة ونضيفة دايماً.'],
    broody: 'weak',
    extraCare: [
      'بعض سلالات الزينة اللي منقارها قصير جداً محتاجة أهل بالتبني يربّوا زغاليلها. خلّي معاك جوز بلدي يربّي.',
    ],
    endTitle: 'الزغاليل طلعت من العش',
    endDetail: 'حوالي 28 يوم الزغلول بيسيب العش. افصله في مكان الصغيرين.',
    expected: {
      eggWeightG: sv(17, 'جم', 'pigeon_saudi2026', 'low', {
        min: 14.9,
        max: 19.3,
        note: 'وزن بيض الحمام من حوالي 15 جم في سلالات محلية صغيرة لحوالي 19 جم في الزاجل الكبير. مفيش رقم لسلالات الزينة؛ بتختلف حسب الحجم.',
      }),
    },
  }),
]
