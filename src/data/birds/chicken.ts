import type {
  BirdProfile,
  BroodCheck,
  ClimateBand,
  CycleTask,
  CycleTemplate,
  LocalizedText,
  ScrapRule,
  SourcedText,
  SpaceBand,
} from '../schema'
import type { SourceId } from '../sources'
import { ar, avoidWith, scrap, st, sv, table } from '../helpers'
import { broilerWhite } from '../species/broiler-white'
import { broilerWhiteCycle } from '../cycles/broiler-white.cycle'

/*
 * Chicken profiles (فراخ). Day 0 = hatch / arrival.
 * Brooding temperatures for layer-type and local chicks: Hy-Line Brown (alternative / floor systems).
 * Brooding temperatures for meat chicks: Ross handbook (hb25), as in species/broiler-white.ts.
 */

type Conf = 'high' | 'medium' | 'low'
type Task = Omit<CycleTask, 'daily'> & { daily?: boolean }

const task = (t: Task): CycleTask => ({ daily: false, ...t })

// ---------- climate ----------

const MARGIN_NOTE =
  'حد الخطر = حد الراحة ± 3 درجات؛ الهامش ده من عندنا، الدليل بيدي حرارة الراحة بس.'
const ADULT_COLD_NOTE =
  'مفيش حد صريح في المصادر للبرد على الفراخ الكبيرة. 10° رقم استرشادي: تحت كده الأكل بيزيد والبيض ممكن يقل، والأهم تمنع تيارات الهوا وتخلي الفرشة ناشفة.'

function rh(fromDay: number, src: SourceId, conf: Conf) {
  return fromDay < 8
    ? sv(70, '٪', src, conf, {
        min: 60,
        max: 70,
        note: 'أول 3 أيام 60–70٪. أقل من 50٪ أول أسبوع = جفاف وتراب.',
      })
    : sv(60, '٪', src, conf, {
        min: 50,
        max: 60,
        note: 'بعد التحضين 50–60٪. أكتر من كده = فرشة مبلولة وأمونيا.',
      })
}

/** Chick band: comfort from the guide, danger = comfort ± 3 (low). */
function chickBand(
  from: number,
  to: number,
  cMin: number,
  cMax: number,
  src: SourceId,
  conf: Conf,
  note?: string,
): ClimateBand {
  return {
    fromDay: from,
    toDay: to,
    comfortMin: sv(cMin, '°م', src, conf, note ? { note } : {}),
    comfortMax: sv(cMax, '°م', src, conf),
    dangerLow: sv(cMin - 3, '°م', src, 'low', { note: MARGIN_NOTE }),
    dangerHigh: sv(cMax + 3, '°م', src, 'low', { note: MARGIN_NOTE }),
    rhMax: rh(from, 'hb25', 'medium'),
  }
}

/** Grown birds: thermoneutral 18–25°, heavy losses above 33° (Hy-Line heat-stress update). */
function adultBand(
  from: number,
  comfortMin: number,
  comfortMinSrc: SourceId,
  heatConf: Conf,
  heatNote?: string,
): ClimateBand {
  return {
    fromDay: from,
    toDay: 3650,
    comfortMin: sv(
      comfortMin,
      '°م',
      comfortMinSrc,
      comfortMinSrc === 'chicken_hylineHeat' ? 'high' : 'medium',
    ),
    comfortMax: sv(25, '°م', 'chicken_hylineHeat', heatConf, {
      note: 'المنطقة المريحة للفراخ 18–25°. فوق كده الطير بيصرف طاقة علشان يبرّد نفسه فالنمو والبيض بيقلّوا.',
    }),
    dangerLow: sv(10, '°م', 'chicken_hylineHeat', 'low', { note: ADULT_COLD_NOTE }),
    dangerHigh: sv(33, '°م', 'chicken_hylineHeat', heatConf, {
      note:
        heatNote ??
        'فوق 33° النفوق والخساير في الإنتاج بيبقوا واضحين. الرطوبة العالية بتخلي الحر أسوأ.',
    }),
    rhMax: rh(from, 'hb25', 'medium'),
  }
}

/** Layer-type / local chicks: Hy-Line Brown floor brooding temperatures. */
function layerClimate(conf: Conf, note?: string): ClimateBand[] {
  const src: SourceId = 'chicken_hylineAlt'
  return [
    chickBand(
      0,
      3,
      35,
      36,
      src,
      conf,
      note ?? 'حرارة الهوا عند مستوى الكتاكيت في التربية على الأرض (35–36° أول 3 أيام).',
    ),
    chickBand(4, 7, 33, 35, src, conf),
    chickBand(8, 14, 31, 33, src, conf),
    chickBand(15, 21, 29, 31, src, conf),
    chickBand(22, 28, 26, 27, src, conf),
    chickBand(29, 35, 23, 25, src, conf),
    {
      fromDay: 36,
      toDay: 42,
      comfortMin: sv(21, '°م', src, conf, { note: 'من 36 يوم الدليل بيثبّت 21°.' }),
      comfortMax: sv(25, '°م', 'chicken_hylineHeat', 'medium'),
      dangerLow: sv(18, '°م', src, 'low', { note: MARGIN_NOTE }),
      dangerHigh: sv(33, '°م', 'chicken_hylineHeat', 'medium'),
      rhMax: rh(36, 'hb25', 'medium'),
    },
    adultBand(43, 18, 'chicken_hylineHeat', conf === 'high' ? 'high' : 'medium'),
  ]
}

/** Meat chicks: Ross whole-house (min) and spot-brooding (max) temperatures. */
function meatClimate(conf: Conf, note: string): ClimateBand[] {
  const rows: Array<[number, number, number, number]> = [
    [0, 2, 30, 32],
    [3, 5, 28, 30],
    [6, 8, 27, 28],
    [9, 11, 26, 27],
    [12, 14, 25, 26],
    [15, 17, 24, 25],
    [18, 20, 23, 24],
  ]
  return [
    ...rows.map(([f, t, a, b], i) =>
      chickBand(f, t, a, b, 'hb25', conf, i === 0 ? note : undefined),
    ),
    {
      fromDay: 21,
      toDay: 26,
      comfortMin: sv(22, '°م', 'hb25', conf, {
        note: 'الحرارة بتنزل درجة كل 3 أيام لحد 20° عند حوالي 27 يوم.',
      }),
      comfortMax: sv(25, '°م', 'chicken_hylineHeat', 'medium'),
      dangerLow: sv(19, '°م', 'hb25', 'low', { note: MARGIN_NOTE }),
      dangerHigh: sv(28, '°م', 'hb25', 'low', { note: MARGIN_NOTE }),
      rhMax: rh(21, 'hb25', conf),
    },
    adultBand(
      27,
      20,
      'hb25',
      'medium',
      'فوق 33° خطر كبير. فراخ اللحم التقيلة أحسّ من البياض بالحر — ابدأ تبريد وتهوية من بدري.',
    ),
  ]
}

// ---------- shared texts ----------

const BROOD_CHECKS: BroodCheck[] = [
  {
    id: 'set',
    day: 0,
    title: ar('الفرخة رقدت: حط البيض تحتها'),
    detail: ar(
      'اختار فرخة كبيرة وهادية. حوالي 10 بيضات كفاية (الحد الأقصى 14–16 والفقس بيقل فوق 10). البيض ما يكونش متخزّن أكتر من 7 أيام. لو الجو ناشف جداً حط تحت القش شوية تراب مبلول.',
    ),
  },
  {
    id: 'add-eggs',
    day: 4,
    title: ar('آخر يوم تزوّد فيه بيض'),
    detail: ar('لو هتزوّد بيض من فرخة تانية يكون من يوم 1 لـ 4 بس، ويفضّل وقت المغرب.'),
  },
  {
    id: 'candle',
    day: 7,
    title: ar('اكشف على البيض بالنور (التلقيح)'),
    detail: ar(
      'في مكان ضلمة قرّب البيضة من كشاف قوي: لو فيها شكل غامق تبقى ملقّحة، ولو صافية شيلها.',
    ),
  },
  {
    id: 'food-water',
    day: 8,
    title: ar('خلي الأكل والمية جنب العش'),
    detail: ar(
      'علشان الفرخة ما تبعدش كتير والبيض ما يبردش. الفرخة كمان بترش مية على البيض بمنقارها.',
    ),
  },
  {
    id: 'quiet',
    day: 18,
    title: ar('قرب الفقس: قلّل الإزعاج'),
    detail: ar('ما ترفعش الفرخة من على البيض وما تقلّبش العش. جهّز مكان دافي وأكل كتاكيت.'),
  },
  {
    id: 'hatch',
    day: 21,
    title: ar('ميعاد الفقس'),
    detail: ar('الفقس من 20 لـ 21 يوم. نسبة فقس 75–80٪ من البيض تعتبر كويسة.'),
  },
]

const HEALTH_PROBLEMS: SourcedText[] = [
  st(
    'نيوكاسل: من أخطر أمراض الفراخ. ممكن يعمل رعشة وشلل ولوي رقبة. الحمام والطيور البرية ممكن ينقلوه.',
    'chicken_msdND',
    'high',
  ),
  st(
    'أنفلونزا الطيور: عطس وإفرازات، عرف ودلايات زرقا، إسهال أخضر، أو نفوق مفاجئ من غير أعراض. الاشتباه لازم يتبلّغ للطب البيطري.',
    'chicken_msdAI',
    'high',
  ),
  st(
    'العلف أو الأكل المعفن فيه سموم فطرية بتقلل الإنتاج والمناعة وبتأذي الكبد والكلى. ارمي أي أكل معفن وخزّن العلف ناشف.',
    'chicken_msdMyco',
    'high',
  ),
  st(
    'الحر فوق 33° بيزوّد النفوق ويقلل البيض وقشرته. المية الباردة والتهوية والضل أهم حاجة.',
    'chicken_hylineHeat',
    'high',
  ),
  st(
    'في مسح على البيوت الريفية في مصر 82٪ ما بيحصّنوش طيورهم. استشير طبيب بيطري للتحصينات المناسبة لمنطقتك.',
    'chicken_faoEgyptChar2009',
    'medium',
  ),
]

const DANGER_SIGNS: LocalizedText[] = [
  ar('نفوق كذا فرخة في يوم أو يومين — اعزل الباقي وكلّم طبيب بيطري فوراً.'),
  ar('رقبة ملوية أو رعشة أو شلل في الجناح أو الرجل.'),
  ar('عرف ودلايات زرقا أو منفوخة، أو رجلين لونها أحمر غامق.'),
  ar('إسهال أخضر أو بدم.'),
  ar('فرخة بتنهج وجناحاتها مفتوحة ومش بتاكل في الحر.'),
  ar('كتاكيت متكومة فوق بعض وبتصوصو بصوت عالي (برد).'),
]

const MIX_AVOID = [
  avoidWith(
    'turkey',
    'الفراخ بتشيل مرض الرأس الأسود (الهستومونس) من غير ما تتعب وبتعديه للرومي، وبيضه بيعيش في التربة سنين.',
    'chicken_msdHisto',
    'high',
  ),
  avoidWith(
    'duck',
    'البط والطيور المائية ممكن تشيل أنفلونزا الطيور من غير أعراض، وبتبل الفرشة.',
    'chicken_msdAI',
    'medium',
  ),
  avoidWith(
    'goose',
    'الوز طيور مائية ممكن تشيل أنفلونزا الطيور من غير أعراض.',
    'chicken_msdAI',
    'medium',
  ),
  avoidWith(
    'pigeon',
    'الحمام ممكن يشيل فيروس النيوكاسل الخاص بيه ويعدي الفراخ.',
    'chicken_msdND',
    'high',
  ),
]

const SCRAPS: ScrapRule[] = [
  scrap(
    'bread',
    'limit',
    'شوية عيش ناشف مبلول ماشي، بس الكتير بيقلل البروتين ويقلل البيض والنمو.',
    'chicken_extFeeding',
    'medium',
  ),
  scrap(
    'moldy-food',
    'no',
    'العفن فيه سموم فطرية بتقتل وبتضعف المناعة.',
    'chicken_msdMyco',
    'high',
  ),
  scrap(
    'rice-cooked',
    'limit',
    'الرز يدخل في العلف لحد 20–30٪، فشوية رز من غير ملح ماشي.',
    'chicken_fao2004Feed',
    'medium',
  ),
  scrap(
    'rice-raw',
    'limit',
    'كسر الرز بيدخل في العلايق لحد 20–30٪ — كمكمّل بس.',
    'chicken_fao2004Feed',
    'medium',
  ),
  scrap(
    'pasta',
    'limit',
    'مسلوقة من غير صلصة أو ملح، وبكمية يخلصوها في 20 دقيقة.',
    'chicken_extFeeding',
    'low',
  ),
  scrap(
    'potato-peel',
    'no',
    'قشر البطاطس الأخضر أو المزرّع فيه سولانين بيأذي الأعصاب والقلب.',
    'chicken_ufScraps',
    'medium',
  ),
  scrap(
    'potato-cooked',
    'limit',
    'البطاطس المسلوقة السادة آمنة بكمية معتدلة.',
    'chicken_ufScraps',
    'medium',
  ),
  scrap(
    'greens',
    'limit',
    'الخضرة الطرية كويسة، بس الكتير بيقلل البيض. ما تديهاش حشيش مرشوش مبيد.',
    'chicken_extFeeding',
    'medium',
  ),
  scrap(
    'cabbage',
    'limit',
    'خضار طازة بكمية صغيرة؛ الأكل الأساسي يفضل العلف.',
    'chicken_extFeeding',
    'low',
  ),
  scrap(
    'cucumber',
    'limit',
    'خضار طازة بكمية صغيرة؛ الأكل الأساسي يفضل العلف.',
    'chicken_extFeeding',
    'low',
  ),
  scrap(
    'tomato',
    'limit',
    'الطماطم الناضجة بكمية صغيرة؛ شيل الأوراق والعيدان الخضرا.',
    'chicken_extFeeding',
    'low',
  ),
  scrap(
    'carrot',
    'limit',
    'خضار طازة بكمية صغيرة؛ الأكل الأساسي يفضل العلف.',
    'chicken_extFeeding',
    'low',
  ),
  scrap(
    'watermelon',
    'ok',
    'البطيخ بيساعد الكتاكيت والفراخ تشرب في الحر، بس شيل الباقي قبل ما يعطن.',
    'chicken_sassoRural',
    'medium',
  ),
  scrap(
    'fruit',
    'limit',
    'الفاكهة الناضجة ماشي بكمية صغيرة، بس شيل بذر التفاح ونوى الفاكهة (فيها سيانيد).',
    'chicken_ufScraps',
    'medium',
  ),
  scrap(
    'citrus',
    'limit',
    'الموالح ما تزيدش عن 2٪ من الأكل — شوية قليلين بس.',
    'chicken_fao2004Feed',
    'medium',
  ),
  scrap(
    'onion-garlic',
    'no',
    'البصل الكتير بيكسر كرات الدم الحمرا ويعمل أنيميا — ابعده أحسن.',
    'chicken_ufScraps',
    'medium',
  ),
  scrap(
    'avocado',
    'no',
    'فيه مادة (بيرسين) بتعمل مشاكل تنفس وقلب، خصوصاً القشر والبذرة.',
    'chicken_ufScraps',
    'medium',
  ),
  scrap(
    'chocolate',
    'no',
    'الثيوبرومين والكافيين سامين للفراخ حتى بكمية صغيرة.',
    'chicken_ufScraps',
    'medium',
  ),
  scrap(
    'coffee-tea',
    'no',
    'تفل القهوة وأكياس الشاي فيها كافيين بيأذي القلب والأعصاب.',
    'chicken_ufScraps',
    'medium',
  ),
  scrap(
    'salty',
    'no',
    'الملح الزيادة بيعمل جفاف وتعب في الكلى بسرعة.',
    'chicken_ufScraps',
    'medium',
  ),
  scrap(
    'fried',
    'no',
    'الأكل المقلي غالباً مالح ومليان زيت — بيأذي ويبوّظ الفرشة.',
    'chicken_ufScraps',
    'low',
  ),
  scrap(
    'sweets',
    'limit',
    'السكر بيملّي الطير من غير غذا وبيقلل أكل العلف. الأحسن تبعده.',
    'chicken_extFeeding',
    'low',
  ),
  scrap(
    'meat-scraps',
    'limit',
    'بواقي مطبوخة طازة من غير ملح وبكمية صغيرة؛ ما تسيبهاش تعطن.',
    'chicken_fao2004Feed',
    'low',
  ),
  scrap(
    'fish-scraps',
    'limit',
    'بواقي سمك مطبوخ من غير ملح بكمية صغيرة. ممنوع الفسيخ والرنجة (ملح).',
    'chicken_fao2004Feed',
    'low',
  ),
  scrap(
    'eggshell',
    'limit',
    'قشر البيض مصدر كالسيوم للبياضة. اطحنه ناعم وقدّمه لوحده.',
    'chicken_fao2004Feed',
    'medium',
  ),
  scrap(
    'egg-cooked',
    'limit',
    'بروتين كويس بكمية صغيرة، مسلوق ومهروس.',
    'chicken_extFeeding',
    'low',
  ),
  scrap(
    'beans-raw',
    'no',
    'الفول والفاصوليا النية فيها سموم بتعمل تسمم ومشاكل هضم. لازم تتطبخ.',
    'chicken_ufScraps',
    'medium',
  ),
  scrap(
    'beans-cooked',
    'limit',
    'البقول المطبوخة آمنة غالباً، بس من غير ملح أو زيت.',
    'chicken_ufScraps',
    'medium',
  ),
  scrap(
    'grains',
    'limit',
    'الحبوب لوحدها بتخفف قيمة العلف. في القرى بيدّوا حوالي 35 جم حبوب للفرخة في اليوم كتكملة.',
    'chicken_fao2004Feed',
    'medium',
  ),
  scrap(
    'clover',
    'limit',
    'البرسيم الطري ماشي، بس الفراخ ما بتهضمش النبات الكبير الناشف.',
    'chicken_extFeeding',
    'medium',
  ),
  scrap(
    'dates',
    'limit',
    'حلو ومليان سكر — حبات قليلة بس من غير نوى.',
    'chicken_extFeeding',
    'low',
  ),
]

const FEED_NOTES_HOME: LocalizedText[] = [
  ar('العلف المتكامل هو الأساس. بواقي الأكل والحبوب تكون في حدود اللي الفراخ تخلّصه في 20 دقيقة.'),
  ar('شيل أي بواقي ما اتاكلتش قبل ما تعفن، وخزّن العلف ناشف بعيد عن الفيران.'),
]

const WATER_TEXT = ar(
  'مية نضيفة طول الوقت. في الجو الحار: 100 كتكوت عمر أسبوع محتاجين حوالي 3 لتر في اليوم، و100 فرخة كبيرة حوالي 25 لتر، و100 بياضة حوالي 50 لتر. في الحر الشديد الاستهلاك بيتضاعف.',
)

const VET_NOTE = ar(
  'استشير طبيب بيطري للتحصينات — مفيش برنامج رسمي منشور لتحصين الفراخ البلدي في البيوت.',
)

// ---------- cycle templates ----------

const PREP_TASKS: CycleTask[] = [
  task({
    id: 'clean',
    fromDay: -7,
    toDay: -7,
    kind: 'prep',
    title: ar('نضّف المكان وطهّره'),
    detail: ar('شيل الفرشة القديمة واغسل وطهّر، وسيب المكان يرتاح كام يوم.'),
  }),
  task({
    id: 'litter',
    fromDay: -2,
    toDay: -2,
    kind: 'litter',
    title: ar('افرش فرشة ناشفة وجهّز حاجز التحضين'),
  }),
  task({
    id: 'preheat',
    fromDay: -1,
    toDay: -1,
    kind: 'brooding',
    title: ar('شغّل التدفئة قبل الاستقبال بيوم'),
    detail: ar('لازم الأرضية تدفى مش الهوا بس.'),
  }),
  task({
    id: 'receive',
    fromDay: 0,
    toDay: 0,
    kind: 'brooding',
    title: ar('استلم الكتاكيت ونزّلها جنب المية والأكل'),
    detail: ar('عدّها، وشوف إنها نشيطة وسرتها مقفولة.'),
  }),
  task({
    id: 'crop-check',
    fromDay: 1,
    toDay: 1,
    kind: 'brooding',
    title: ar('افحص حوصلة الكتاكيت'),
    detail: ar('لازم تكون مليانة وطرية. لو فاضية: الكتكوت بردان أو مش لاقي أكل ومية.'),
  }),
  task({
    id: 'behaviour',
    fromDay: 0,
    toDay: 21,
    kind: 'brooding',
    daily: true,
    title: ar('راقب توزيع الكتاكيت تحت الدفاية'),
    detail: ar('متكوّمين = برد، بعيد عن الدفاية = حر.'),
  }),
  task({
    id: 'vet',
    fromDay: 3,
    toDay: 3,
    kind: 'health',
    title: ar('اتفق مع طبيب بيطري على برنامج التحصين'),
  }),
]

function localCycle(id: string, firstEgg: number, growerFrom: number): CycleTemplate {
  return {
    speciesId: id,
    prepDays: 7,
    stages: [
      {
        id: 'prep',
        name: ar('تجهيز'),
        fromDay: -7,
        toDay: -1,
        summary: ar('تنضيف وتطهير وتسخين المكان.'),
      },
      {
        id: 'brooding',
        name: ar('تحضين'),
        fromDay: 0,
        toDay: 42,
        summary: ar('الكتاكيت محتاجة دفا لحد حوالي 6 أسابيع، والحرارة بتقل كل أسبوع.'),
      },
      {
        id: 'growing',
        name: ar('نمو'),
        fromDay: 43,
        toDay: firstEgg - 22,
        summary: ar('علف نامي ومساحة أوسع ومراقبة الصحة.'),
      },
      {
        id: 'pre-lay',
        name: ar('قبل البيض'),
        fromDay: firstEgg - 21,
        toDay: firstEgg - 1,
        summary: ar('جهّز البيّاضات والمجاثم.'),
      },
      {
        id: 'laying',
        name: ar('أول البيض'),
        fromDay: firstEgg,
        toDay: firstEgg + 30,
        summary: ar('علف بياض فيه كالسيوم أعلى.'),
      },
    ],
    tasks: [
      ...PREP_TASKS,
      task({
        id: 'heat-down',
        fromDay: 7,
        toDay: 35,
        kind: 'brooding',
        title: ar('قلل الحرارة تدريجياً'),
        detail: ar('حوالي درجتين كل أسبوع لحد 21° عند 6 أسابيع.'),
      }),
      task({
        id: 'heat-off',
        fromDay: 42,
        toDay: 42,
        kind: 'brooding',
        title: ar('شيل التدفئة لو الجو معتدل'),
      }),
      task({
        id: 'feed-grower',
        fromDay: growerFrom,
        toDay: growerFrom + 1,
        kind: 'feed',
        daily: true,
        title: ar('انقل لعلف النامي تدريجياً'),
      }),
      task({
        id: 'nests',
        fromDay: firstEgg - 21,
        toDay: firstEgg - 21,
        kind: 'house',
        title: ar('حط البيّاضات والمجاثم'),
        detail: ar('بيّاضة لكل 5 فرخات في مكان ضلمة وهادي.'),
      }),
      task({
        id: 'feed-layer',
        fromDay: firstEgg - 7,
        toDay: firstEgg - 6,
        kind: 'feed',
        daily: true,
        title: ar('ابدأ علف البياض مع قرب أول بيضة'),
      }),
      task({
        id: 'dead',
        fromDay: 0,
        toDay: firstEgg + 30,
        kind: 'health',
        daily: true,
        title: ar('شيل أي فرخة ميتة أو تعبانة واعزلها'),
      }),
    ],
    signs: [
      {
        fromDay: 0,
        toDay: 7,
        severity: 'urgent',
        text: ar('كتاكيت متكوّمة وبتصوصو بصوت عالي = برد أو جوع. اتحرك فوراً.'),
      },
      {
        fromDay: 3,
        toDay: 42,
        severity: 'watch',
        text: ar('إسهال بدم أو ريش منفوش ونعاس — كلّم طبيب بيطري.'),
      },
      {
        fromDay: 21,
        toDay: firstEgg + 30,
        severity: 'urgent',
        text: ar('رقبة ملوية أو رعشة أو نفوق مفاجئ — اعزل وبلّغ الطبيب البيطري.'),
      },
      {
        fromDay: 43,
        toDay: firstEgg + 30,
        severity: 'watch',
        text: ar('فراخ بتنهج وجناحاتها مفتوحة في الحر — مية باردة وضل وتهوية.'),
      },
      {
        fromDay: firstEgg - 21,
        toDay: firstEgg + 30,
        severity: 'info',
        text: ar('العرف والدلايات بيحمرّوا ويكبروا قبل البيض بكام أسبوع.'),
      },
    ],
  }
}

// ---------- shared local-chicken base (بلدي / فيومي / سلالات محسنة) ----------

const localSpace = (perM2Adult: number): SpaceBand[] => [
  {
    fromDay: 0,
    toDay: 84,
    perM2: sv(15, 'طائر/م²', 'chicken_faoEgypt2008', 'medium', {
      note: 'السلالات المحلية والمحسنة بتستحمل كثافة 15 طائر/م² عند 12 أسبوع. أول أسابيع الكتاكيت بتبقى في مساحة أصغر تحت الدفاية.',
    }),
  },
  {
    fromDay: 85,
    toDay: 3650,
    perM2: sv(perM2Adult, 'طائر/م²', 'chicken_fao2004Mgmt', 'medium', {
      min: 3,
      max: 4,
      note: 'للتربية على فرشة: 3 بياضات أو 4 فراخ ثنائية الغرض في المتر. لو الفراخ محبوسة طول اليوم ما تزوّدش عن كده.',
    }),
  },
]

const localHousing = (perch: number, perM2Adult: number): BirdProfile['housing'] => ({
  type: ar(
    'عشة أو أوضة على السطح أو في الحوش، بفرشة ناشفة ومجاثم وبيّاضات، وسلك ضيق ضد القطط والفيران والطيور البرية.',
  ),
  space: localSpace(perM2Adult),
  perchCm: sv(perch, 'سم/طائر', 'chicken_fao2004Mgmt', 'medium', {
    note: 'المجثم خشبة سُمكها 2–3 سم.',
  }),
  birdsPerNest: sv(5, 'فرخة/بيّاضة', 'chicken_fao2004Mgmt', 'high', {
    note: 'البيّاضة قاعدتها حوالي 25 سم وحيطانها 18 سم.',
  }),
  water: WATER_TEXT,
  notes: [
    ar(
      'في البيوت المصرية الفراخ غالباً بتبات في عشة وتسرح بالنهار؛ لو سرحانة خليها في مكان مقفول من الصقور والقطط والكلاب.',
    ),
    ar(
      'الفراخ البلدي بتتحمل الحر والأكل البسيط أكتر من التجاري، بس الصيف هو أكتر موسم بيحصل فيه نفوق.',
    ),
    ar('ما تخلطش فراخ جديدة مع القديمة قبل ما تعزلها كام يوم.'),
  ],
})

const localFeeding = (
  phases: BirdProfile['feeding']['phases'],
  waterConf: Conf,
): BirdProfile['feeding'] => ({
  phases,
  waterToFeed: sv(2, 'لتر/كجم علف', 'chicken_hylineHeat', waterConf, {
    note: 'عند 21°. في 38° ممكن توصل 8 لتر لكل كجم علف. الرقم من دليل بياض تجاري.',
  }),
  scraps: SCRAPS,
  notes: [
    ...FEED_NOTES_HOME,
    ar(
      'البياضة محتاجة علف فيه 14٪ بروتين على الأقل، وكالسيوم 2.5–3.5٪ (علف بياض أو قشر بيض مطحون جنبه).',
    ),
  ],
})

const localPhases = (
  src: SourceId,
  conf: Conf,
  cp: [number, number, number],
  note?: string,
): BirdProfile['feeding']['phases'] => [
  {
    id: 'starter',
    name: ar('بادي'),
    fromDay: 0,
    toDay: 56,
    crudeProtein: sv(cp[0], '٪', src, conf, note ? { note } : {}),
  },
  {
    id: 'grower',
    name: ar('نامي'),
    fromDay: 57,
    toDay: 140,
    crudeProtein: sv(cp[1], '٪', src, conf),
  },
  {
    id: 'layer',
    name: ar('بياض'),
    fromDay: 141,
    toDay: 3650,
    crudeProtein: sv(cp[2], '٪', src, conf),
  },
]

const BROOD_CARE_LOCAL: LocalizedText[] = [
  ar('الفرخة الرقادة بتقلّب البيض لوحدها — ما تقلّبوش إنت.'),
  ar(
    'الكتاكيت بتفضل مع أمها 9–10 أسابيع. أكّل الكتاكيت في مكان ما توصلّوش الفراخ الكبيرة يقلل النفوق.',
  ),
  ar('افحص الفرخة من القمل والحلم قبل ما ترقد.'),
]

// ---------- profiles ----------

const baladi: BirdProfile = {
  id: 'chicken-baladi',
  kind: 'chicken',
  name: ar('فراخ بلدي'),
  description: ar(
    'الفراخ البلدي اللي في كل بيت ريفي: بتتحمل الحر والأكل البسيط، وبترقد وتطلّع كتاكيت لوحدها، بس بيضها ووزنها قليل.',
  ),
  purposes: ['dual', 'eggs', 'meat'],
  dataStatus: 'limited',
  unit: 'birds',
  defaultAge: 180,
  housing: localHousing(20, 4),
  feeding: localFeeding(
    localPhases(
      'chicken_faoEgypt2008',
      'medium',
      [18, 14, 15],
      'أرقام سلالة الفيومي من مراجعة الفاو لمصر — مفيش أرقام منشورة للبلدي نفسه.',
    ),
    'medium',
  ),
  cycle: {
    endpoint: 'first-egg',
    endpointAge: sv(190, 'يوم', 'chicken_fao2004Breeds', 'low', {
      min: 166,
      max: 230,
      note: 'ملقيناش رقم للبلدي المصري. الفراخ البلدي في دول تانية بتبيض أول بيضة من 166 لـ 230 يوم.',
    }),
    template: localCycle('chicken-baladi', 190, 57),
  },
  breeding: {
    broody: 'yes',
    incubationDays: sv(21, 'يوم', 'chicken_fao2004Incub', 'high', { min: 20, max: 21 }),
    eggsPerSitting: sv(10, 'بيضة', 'chicken_fao2004Incub', 'high', {
      max: 16,
      note: 'الحد الأقصى 14–16 بيضة، لكن الفقس بيقل فوق 10 حسب حجم الفرخة.',
    }),
    checks: BROOD_CHECKS,
    care: [
      ar('الفراخ البلدي رقّادة كويسة؛ في الريف المصري أغلب البيوت بتفقّس بيضها تحت الفرخة.'),
      ...BROOD_CARE_LOCAL,
    ],
  },
  health: { vaccinations: [], problems: HEALTH_PROBLEMS, dangerSigns: [...DANGER_SIGNS, VET_NOTE] },
  climate: {
    bands: layerClimate(
      'medium',
      'أرقام تحضين كتاكيت البياض (Hy-Line). لو الكتاكيت مع أمها هي بتدفّيها، بس خلي مكان النوم بعيد عن الهوا.',
    ),
  },
  mixing: { okWith: [], avoid: MIX_AVOID },
  expected: {
    adultWeightKg: sv(1.0, 'كجم', 'chicken_faoEgyptChar2009', 'medium', {
      min: 1.0,
      max: 1.14,
      note: 'متوسط مسح في الغربية والفيوم وسوهاج: الفرخة 996 جم والديك 1045 جم. بأكل أحسن بيزيدوا.',
    }),
    eggsPerYear: sv(151, 'بيضة/سنة', 'chicken_faoEgypt2008', 'medium', {
      note: 'في السرحان الريفي غالباً أقل بكتير.',
    }),
    eggWeightG: sv(40, 'جم', 'chicken_faoEgypt2008', 'medium'),
  },
}

const improved: BirdProfile = {
  id: 'chicken-baladi-improved',
  kind: 'chicken',
  name: ar('سلالات محلية محسنة (مندرة، مطروح، دهبي المنتزه، إنشاص)'),
  description: ar(
    'سلالات مصرية طلعها معهد بحوث الإنتاج الحيواني والجامعات من خلط البلدي والفيومي بسلالات أجنبية: بيض أكتر من البلدي ومتحمّلة للجو المصري.',
  ),
  purposes: ['dual', 'eggs', 'meat'],
  dataStatus: 'limited',
  unit: 'birds',
  defaultAge: 180,
  housing: localHousing(20, 4),
  feeding: localFeeding(
    [
      {
        id: 'starter',
        name: ar('بادي'),
        fromDay: 0,
        toDay: 56,
        crudeProtein: sv(20.4, '٪', 'chicken_lrrd2011', 'medium', {
          note: 'العليقة المستخدمة في تجربة مندرة ومطروح بإنشاص.',
        }),
      },
      {
        id: 'grower',
        name: ar('نامي'),
        fromDay: 57,
        toDay: 140,
        crudeProtein: sv(16, '٪', 'chicken_lrrd2011', 'medium'),
      },
      {
        id: 'layer',
        name: ar('بياض'),
        fromDay: 141,
        toDay: 3650,
        crudeProtein: sv(16.5, '٪', 'chicken_lrrd2011', 'medium'),
      },
    ],
    'medium',
  ),
  cycle: {
    endpoint: 'first-egg',
    endpointAge: sv(166, 'يوم', 'chicken_lrrd2011', 'medium', {
      note: 'مندرة ومطروح في محطة إنشاص. السلالات التانية ممكن تختلف شوية.',
    }),
    template: localCycle('chicken-baladi-improved', 166, 57),
  },
  breeding: {
    broody: 'weak',
    incubationDays: sv(21, 'يوم', 'chicken_fao2004Incub', 'high', { min: 20, max: 21 }),
    eggsPerSitting: sv(10, 'بيضة', 'chicken_fao2004Incub', 'medium', { max: 16 }),
    checks: BROOD_CHECKS,
    care: [
      ar(
        'درجة الرقاد في السلالات المحسنة مش مذكورة في المصادر؛ لو الفرخة مش بترقد فقّس البيض تحت فرخة بلدي.',
      ),
      ...BROOD_CARE_LOCAL,
    ],
  },
  health: { vaccinations: [], problems: HEALTH_PROBLEMS, dangerSigns: [...DANGER_SIGNS, VET_NOTE] },
  climate: {
    bands: layerClimate(
      'medium',
      'أرقام تحضين كتاكيت البياض (Hy-Line) — مفيش أرقام منشورة للسلالات المحلية.',
    ),
  },
  mixing: { okWith: [], avoid: MIX_AVOID },
  expected: {
    adultWeightKg: sv(1.47, 'كجم', 'chicken_lrrd2011', 'medium', {
      min: 1.27,
      max: 1.47,
      note: 'الوزن عند أول بيضة: مندرة 1.47 ومطروح 1.27 كجم.',
    }),
    eggsPerYear: sv(220, 'بيضة/سنة', 'chicken_faoEgypt2008', 'low', {
      note: 'السلالات المحلية المحسنة توصل 220 بيضة تحت تربية مكثفة. في تجربة إنشاص: مندرة 80 ومطروح 65 بيضة في أول 210 يوم إنتاج.',
    }),
  },
}

const fayoumi: BirdProfile = {
  id: 'chicken-fayoumi',
  kind: 'chicken',
  name: ar('فيومي'),
  description: ar(
    'سلالة مصرية قديمة من الفيوم: خفيفة وسريعة النضج وبيضها صغير، ومعروفة بتحمّل الحر والأمراض. اتصدّرت لدول كتير.',
  ),
  purposes: ['eggs', 'dual'],
  dataStatus: 'limited',
  unit: 'birds',
  defaultAge: 180,
  housing: localHousing(25, 3),
  feeding: localFeeding(
    localPhases(
      'chicken_faoEgypt2008',
      'medium',
      [18, 14, 15],
      'احتياجات سلالة الفيومي (خط البيض): بادي 0–8 أسابيع، نامي 9–20، إنتاج 21–72.',
    ),
    'medium',
  ),
  cycle: {
    endpoint: 'first-egg',
    endpointAge: sv(165, 'يوم', 'chicken_negash2023', 'medium', {
      note: 'تجربة في محطة بحثية (إثيوبيا). وزنها عند أول بيضة حوالي 1 كجم.',
    }),
    template: localCycle('chicken-fayoumi', 165, 57),
  },
  breeding: {
    broody: 'weak',
    incubationDays: sv(21, 'يوم', 'chicken_fao2004Incub', 'high', { min: 20, max: 21 }),
    eggsPerSitting: sv(10, 'بيضة', 'chicken_fao2004Incub', 'medium', { max: 16 }),
    checks: BROOD_CHECKS,
    care: [
      ar(
        'الفيومي معروف بخصوبة ونسبة فقس عالية. درجة الرقاد مش مذكورة في المصادر؛ لو مش بترقد فقّس البيض تحت فرخة بلدي.',
      ),
      ...BROOD_CARE_LOCAL,
    ],
  },
  health: { vaccinations: [], problems: HEALTH_PROBLEMS, dangerSigns: [...DANGER_SIGNS, VET_NOTE] },
  climate: {
    bands: layerClimate(
      'medium',
      'أرقام تحضين كتاكيت البياض (Hy-Line) — مفيش أرقام منشورة للفيومي.',
    ),
  },
  mixing: { okWith: [], avoid: MIX_AVOID },
  expected: {
    adultWeightKg: sv(1.7, 'كجم', 'chicken_faoEgypt2008', 'medium', {
      note: 'الفرخة 1.7 والديك 2.25 كجم.',
    }),
    eggsPerYear: sv(150, 'بيضة/سنة', 'chicken_faoEgypt2008', 'medium', {
      max: 200,
      note: 'الفيومي النقي حوالي 150 بيضة، والمحسّن بأكل كويس يوصل 200.',
    }),
    eggWeightG: sv(43, 'جم', 'chicken_faoEgypt2008', 'medium', {
      min: 40,
      max: 43,
      note: 'في تجربة بحثية متوسط البيضة كان 40 جم لحد 40 أسبوع.',
    }),
  },
}

/** Hy-Line Brown alternative systems: [week, BW low, BW high, feed low, feed high]. */
const HL_REAR: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [1, 65, 76, 17, 19],
  [2, 113, 132, 20, 21],
  [3, 177, 205, 23, 25],
  [4, 254, 292, 28, 31],
  [5, 343, 391, 35, 38],
  [6, 440, 499, 41, 45],
  [7, 543, 611, 47, 51],
  [8, 649, 725, 53, 57],
  [9, 753, 835, 58, 62],
  [10, 853, 939, 62, 67],
  [11, 946, 1034, 66, 71],
  [12, 1032, 1119, 69, 73],
  [13, 1109, 1195, 71, 75],
  [14, 1179, 1261, 73, 78],
  [15, 1243, 1320, 75, 79],
  [16, 1304, 1375, 78, 82],
  [17, 1363, 1428, 82, 86],
  [18, 1418, 1485, 87, 91],
  [19, 1472, 1546, 92, 97],
  [20, 1526, 1609, 98, 103],
  [21, 1581, 1673, 102, 108],
  [22, 1634, 1735, 107, 113],
  [23, 1691, 1788, 110, 117],
  [24, 1742, 1835, 113, 119],
  [26, 1821, 1903, 116, 121],
  [30, 1879, 1956, 117, 122],
  [40, 1935, 2017, 117, 121],
  [60, 1971, 2059, 117, 121],
  [80, 1993, 2087, 117, 121],
  [100, 2007, 2107, 117, 121],
]
const mid = (a: number, b: number) => Math.round(((a + b) / 2) * 10) / 10

const layer: BirdProfile = {
  id: 'chicken-layer',
  kind: 'chicken',
  name: ar('فراخ بياض تجاري (أحمر/أبيض)'),
  description: ar(
    'البياض التجاري زي Hy-Line Brown و Lohmann Brown: أكتر بيض بكتير من البلدي، بس محتاجة علف بياض متكامل ومش بترقد.',
  ),
  purposes: ['eggs'],
  dataStatus: 'full',
  unit: 'birds',
  defaultAge: 180,
  housing: {
    type: ar('أوضة أو عشة على السطح بفرشة ناشفة ومجاثم وبيّاضات، متظللة ومقفولة بسلك ضيق.'),
    space: [
      {
        fromDay: 0,
        toDay: 125,
        perM2: sv(14, 'طائر/م²', 'chicken_hylineAlt', 'high', {
          min: 12,
          max: 15,
          note: 'كثافة آخر التربية (15–18 أسبوع) على أرضية. أول أسابيع الكتاكيت بتكون تحت الدفاية في مساحة أصغر.',
        }),
      },
      {
        fromDay: 126,
        toDay: 3650,
        perM2: sv(8, 'طائر/م²', 'chicken_hylineAlt', 'high', { min: 7, max: 9 }),
      },
    ],
    perchCm: sv(12.5, 'سم/طائر', 'chicken_hylineAlt', 'high', { min: 10, max: 15 }),
    birdsPerNest: sv(5, 'فرخة/بيّاضة', 'chicken_hylineAlt', 'high'),
    water: WATER_TEXT,
    notes: [
      ar('البياض محتاج إضاءة ثابتة: النور ما يقلّش بعد ما تبدأ تبيض، وإلا البيض يقل.'),
      ar('البيّاضة في مكان ضلمة وهادي، واجمع البيض مرتين في اليوم.'),
    ],
  },
  feeding: {
    phases: [
      {
        id: 'starter1',
        name: ar('بادي 1'),
        fromDay: 0,
        toDay: 20,
        crudeProtein: sv(19.44, '٪', 'chicken_hylineAlt', 'high'),
        note: ar('لحد وزن 177–205 جم (حوالي 3 أسابيع).'),
      },
      {
        id: 'starter2',
        name: ar('بادي 2'),
        fromDay: 21,
        toDay: 41,
        crudeProtein: sv(17.57, '٪', 'chicken_hylineAlt', 'high'),
        note: ar('لحد وزن 440–500 جم (حوالي 6 أسابيع).'),
      },
      {
        id: 'grower',
        name: ar('نامي'),
        fromDay: 42,
        toDay: 83,
        crudeProtein: sv(16.29, '٪', 'chicken_hylineAlt', 'high'),
        note: ar('لحد وزن حوالي 1.1 كجم (12 أسبوع).'),
      },
      {
        id: 'developer',
        name: ar('مطوّر'),
        fromDay: 84,
        toDay: 104,
        crudeProtein: sv(15, '٪', 'chicken_hylineAlt', 'high'),
      },
      {
        id: 'prelay',
        name: ar('قبل البيض'),
        fromDay: 105,
        toDay: 125,
        crudeProtein: sv(17.12, '٪', 'chicken_hylineAlt', 'high'),
        note: ar('ما تديهوش قبل 15 أسبوع ولا بعد أول بيضة (الكالسيوم فيه قليل على البياضة).'),
      },
      {
        id: 'layer',
        name: ar('بياض'),
        fromDay: 126,
        toDay: 700,
        crudeProtein: sv(16.45, '٪', 'chicken_hylineAlt', 'medium', {
          min: 14.5,
          max: 20.1,
          note: 'البياضة محتاجة حوالي 18 جم بروتين في اليوم: 16.5٪ لو بتاكل 110 جم. لو بتاكل أقل لازم النسبة تعلى.',
        }),
      },
    ],
    dailyFeed: table(
      HL_REAR.map(([w, , , fl, fh]) => [(w - 1) * 7, mid(fl, fh), fl, fh] as const),
      'جم/طائر/يوم',
      'chicken_hylineAlt',
      'high',
      { note: 'متوسط الأسبوع. في البيت ممكن يختلف حسب الحر ونوع العلف.' },
    ),
    waterToFeed: sv(2, 'لتر/كجم علف', 'chicken_hylineHeat', 'high', {
      note: 'عند 21°. في 38° ممكن توصل 8 لتر لكل كجم علف.',
    }),
    scraps: SCRAPS,
    notes: [
      ...FEED_NOTES_HOME,
      ar(
        'البياض التجاري محتاج علف بياض متكامل فيه كالسيوم 2.5–3.5٪. البواقي الكتير بتقلل البيض وتضعف القشرة.',
      ),
    ],
  },
  cycle: {
    endpoint: 'first-egg',
    endpointAge: sv(126, 'يوم', 'chicken_hylineAlt', 'high', {
      min: 119,
      max: 140,
      note: 'أول بيض حوالي 18 أسبوع، ونص الفراخ بتبيض كل يوم عند 140 يوم.',
    }),
    template: {
      speciesId: 'chicken-layer',
      prepDays: 7,
      stages: [
        {
          id: 'prep',
          name: ar('تجهيز'),
          fromDay: -7,
          toDay: -1,
          summary: ar('تنضيف وتطهير وتسخين المكان.'),
        },
        {
          id: 'brooding',
          name: ar('تحضين'),
          fromDay: 0,
          toDay: 42,
          summary: ar('الحرارة من 35° بتنزل لحد 21° عند 6 أسابيع.'),
        },
        {
          id: 'rearing',
          name: ar('تربية'),
          fromDay: 43,
          toDay: 104,
          summary: ar('نمو الهيكل والعضم — الوزن أهم من الأكل.'),
        },
        {
          id: 'pre-lay',
          name: ar('قبل البيض'),
          fromDay: 105,
          toDay: 125,
          summary: ar('علف قبل البيض وتجهيز البيّاضات.'),
        },
        {
          id: 'laying',
          name: ar('بيض'),
          fromDay: 126,
          toDay: 160,
          summary: ar('علف بياض وإضاءة ثابتة.'),
        },
      ],
      tasks: [
        ...PREP_TASKS,
        task({
          id: 'feed-starter2',
          fromDay: 21,
          toDay: 21,
          kind: 'feed',
          title: ar('غيّر لبادي 2 لو الوزن وصل 177–205 جم'),
        }),
        task({
          id: 'feed-grower',
          fromDay: 42,
          toDay: 42,
          kind: 'feed',
          title: ar('غيّر لعلف النامي'),
        }),
        task({
          id: 'heat-off',
          fromDay: 42,
          toDay: 42,
          kind: 'brooding',
          title: ar('ثبّت الحرارة على 21° وشيل التدفئة لو الجو دافي'),
        }),
        task({
          id: 'weigh-84',
          fromDay: 84,
          toDay: 84,
          kind: 'weigh',
          title: ar('وزّن عينة (المستهدف حوالي 1.1 كجم)'),
          detail: ar('غيّر لعلف المطوّر.'),
        }),
        task({
          id: 'feed-prelay',
          fromDay: 105,
          toDay: 105,
          kind: 'feed',
          title: ar('ابدأ علف قبل البيض'),
        }),
        task({
          id: 'nests',
          fromDay: 112,
          toDay: 112,
          kind: 'house',
          title: ar('حط البيّاضات (بيّاضة لكل 5 فرخات)'),
        }),
        task({
          id: 'feed-layer',
          fromDay: 126,
          toDay: 126,
          kind: 'feed',
          title: ar('ابدأ علف البياض مع أول بيضة'),
        }),
        task({
          id: 'dead',
          fromDay: 0,
          toDay: 160,
          kind: 'health',
          daily: true,
          title: ar('شيل أي فرخة ميتة أو تعبانة واعزلها'),
        }),
      ],
      signs: [
        {
          fromDay: 0,
          toDay: 7,
          severity: 'urgent',
          text: ar('كتاكيت متكوّمة وبتصوصو بصوت عالي = برد أو جوع. اتحرك فوراً.'),
        },
        {
          fromDay: 3,
          toDay: 42,
          severity: 'watch',
          text: ar('إسهال بدم أو ريش منفوش ونعاس — كلّم طبيب بيطري.'),
        },
        {
          fromDay: 43,
          toDay: 160,
          severity: 'watch',
          text: ar('فراخ بتنقر بعض وفيه دم — زحمة أو نور قوي. افصل المجروحة.'),
        },
        {
          fromDay: 105,
          toDay: 160,
          severity: 'info',
          text: ar('العرف بيحمر ويكبر قبل البيض بأسبوعين تلاتة.'),
        },
        {
          fromDay: 126,
          toDay: 160,
          severity: 'watch',
          text: ar('بيض قشره خفيف أو مكسور — راجع الكالسيوم والحر.'),
        },
      ],
    },
  },
  breeding: {
    broody: 'no',
    incubationDays: sv(21, 'يوم', 'chicken_fao2004Incub', 'high', { min: 20, max: 21 }),
    checks: BROOD_CHECKS,
    care: [
      ar('البياض التجاري تقريباً ما بيرقدش، ولو عايز تفقّس بيضه (لازم ديك) حطه تحت فرخة بلدي رقّادة.'),
      ar('بيض البياض التجاري هجين، والكتاكيت اللي هتطلع منه مش هتكون زي أمها في الإنتاج.'),
    ],
  },
  health: { vaccinations: [], problems: HEALTH_PROBLEMS, dangerSigns: [...DANGER_SIGNS, VET_NOTE] },
  climate: { bands: layerClimate('high') },
  mixing: { okWith: [], avoid: MIX_AVOID },
  expected: {
    bodyWeight: table(
      HL_REAR.map(([w, bl, bh]) => [w * 7, mid(bl, bh), bl, bh] as const),
      'جم',
      'chicken_hylineAlt',
      'high',
      { note: 'وزن آخر كل أسبوع (الدليل ما بيديش وزن يوم الفقس).' },
    ),
    adultWeightKg: sv(2.0, 'كجم', 'chicken_hylineAlt', 'high', { min: 1.89, max: 2.11 }),
    eggsPerYear: sv(325, 'بيضة/سنة', 'chicken_hylineAlt', 'medium', {
      min: 320,
      max: 334,
      note: 'أول سنة بيض (20–72 أسبوع) تحت ظروف مثالية. في البيت غالباً أقل.',
    }),
    eggWeightG: sv(61, 'جم', 'chicken_hylineAlt', 'high', {
      min: 54,
      max: 64,
      note: 'البيض بيكبر مع السن: 54–56 جم عند 26 أسبوع و 61–64 عند 70.',
    }),
  },
}

// ---------- Sasso ----------

/** SASSO Rainbow X × SA51A (as-hatched): [day, weight g, FCR]. */
const SASSO: ReadonlyArray<readonly [number, number, number]> = [
  [0, 38, 0],
  [7, 124, 0.7],
  [14, 275, 1.27],
  [21, 491, 1.69],
  [28, 768, 1.95],
  [35, 1081, 2.13],
  [42, 1432, 2.24],
  [49, 1779, 2.28],
  [56, 2143, 2.32],
  [63, 2492, 2.36],
  [70, 2800, 2.42],
  [77, 3077, 2.52],
  [84, 3344, 2.66],
  [91, 3596, 2.88],
]

const sasso: BirdProfile = {
  id: 'chicken-sasso',
  kind: 'chicken',
  name: ar('ساسو (فراخ ملونة)'),
  description: ar(
    'فراخ ملونة فرنسية بطيئة النمو: بتتحمل الجو والأكل الأبسط من التسمين الأبيض، وبتتباع على 8–10 أسابيع بطعم قريب من البلدي.',
  ),
  purposes: ['meat'],
  dataStatus: 'limited',
  unit: 'birds',
  defaultAge: 0,
  housing: {
    type: ar('أوضة أو عنبر صغير بفرشة عميقة، وبعد 3 أسابيع ممكن تسرح في حوش مقفول بالنهار.'),
    space: [
      {
        fromDay: 0,
        toDay: 3,
        perM2: sv(50, 'كتكوت/م²', 'cobb21', 'low', {
          min: 40,
          max: 60,
          note: 'كثافة تحضين التسمين الأبيض؛ مفيش رقم في دليل Sasso.',
        }),
      },
      { fromDay: 4, toDay: 6, perM2: sv(42, 'كتكوت/م²', 'cobb21', 'low') },
      { fromDay: 7, toDay: 9, perM2: sv(32, 'كتكوت/م²', 'cobb21', 'low') },
      { fromDay: 10, toDay: 13, perM2: sv(22, 'كتكوت/م²', 'cobb21', 'low') },
      {
        fromDay: 14,
        toDay: 3650,
        perM2: sv(5, 'طائر/م²', 'chicken_fao2004Mgmt', 'medium', {
          min: 4,
          max: 5,
          note: 'فراخ لحم على فرشة في تربية صغيرة: 4–5 في المتر.',
        }),
      },
    ],
    water: ar(
      'مية نضيفة دايماً. أول يومين مية مبرّدة شوية، والبطيخ بيساعد الكتاكيت تعوّض المية. في السرحان حط المية في الضل.',
    ),
    notes: [
      ar('دفاية واحدة (كهربا أو غاز) لكل 500–600 كتكوت، وحاجز دايرته 2.5 متر لكل 600 كتكوت.'),
      ar('افرش 2–3 طبقات ورق فوق الفرشة أول أيام وشيل طبقة كل يوم.'),
      ar('سيب فتحة 30 سم فوق الستاير من الناحيتين للتهوية — ما تقفلش المكان خالص.'),
      ar('لمبة 60 وات لكل 16 م² أول أسبوعين، وبعدها 40 وات.'),
    ],
  },
  feeding: {
    phases: [
      {
        id: 'starter',
        name: ar('بادي'),
        fromDay: 0,
        toDay: 21,
        note: ar('علف بادي طازة على صواني أول 3 أيام. الدليل ما بيديش نسبة بروتين.'),
      },
      {
        id: 'grower',
        name: ar('نامي'),
        fromDay: 22,
        toDay: 42,
        note: ar('علف أخف وأرخص من علف التسمين الأبيض.'),
      },
      {
        id: 'finisher',
        name: ar('ناهي'),
        fromDay: 43,
        toDay: 70,
        note: ar('ما تستعجلش النمو بعلف ناهي تقيل؛ خليها تكبر لحد 8–10 أسابيع.'),
      },
    ],
    scraps: SCRAPS,
    notes: [
      ...FEED_NOTES_HOME,
      ar('لو بتسرح بعد 3 أسابيع: قدّم حوالي 80٪ من الأكل جوه الصبح وبالليل، والباقي بتلاقيه برّه.'),
      ar('قدّم العلف طازة 2–3 مرات في اليوم بكميات صغيرة، ونضّف المعالف والسقايات مرتين في اليوم.'),
    ],
  },
  cycle: {
    endpoint: 'market',
    endpointAge: sv(63, 'يوم', 'chicken_sassoRural', 'medium', {
      min: 56,
      max: 70,
      note: 'الدليل بيقول ربّي 8–10 أسابيع علشان الطعم والقوام، وبيع على الوزن اللي الزبون عايزه (يفضّل حوالي 1.5 كجم).',
    }),
    template: {
      speciesId: 'chicken-sasso',
      prepDays: 7,
      stages: [
        {
          id: 'prep',
          name: ar('تطهير وتجهيز'),
          fromDay: -7,
          toDay: -1,
          summary: ar('شيل الفرشة القديمة، اغسل وطهّر واطلي بالجير، وسيب المكان يرتاح أسبوع.'),
        },
        {
          id: 'brooding',
          name: ar('تحضين'),
          fromDay: 0,
          toDay: 21,
          summary: ar('دفا صناعي أول 2–3 أسابيع.'),
        },
        {
          id: 'growing',
          name: ar('نمو'),
          fromDay: 22,
          toDay: 49,
          summary: ar('مساحة ومعالف وسقايات أكتر، وسرحان لو المكان آمن.'),
        },
        {
          id: 'finishing',
          name: ar('تشطيب وبيع'),
          fromDay: 50,
          toDay: 70,
          summary: ar('وزن أسبوعي وتجهيز للبيع.'),
        },
      ],
      tasks: [
        task({
          id: 'clean',
          fromDay: -7,
          toDay: -7,
          kind: 'prep',
          title: ar('نضّف وطهّر المكان كأنه جديد'),
        }),
        task({
          id: 'preheat',
          fromDay: -1,
          toDay: -1,
          kind: 'brooding',
          title: ar('سخّن المكان قبل الاستقبال بـ 12 ساعة على الأقل'),
        }),
        task({
          id: 'receive',
          fromDay: 0,
          toDay: 0,
          kind: 'brooding',
          title: ar('استلم الكتاكيت ونزّلها بسرعة تحت الدفاية'),
          detail: ar('مية الأول وبعدين العلف على صواني.'),
        }),
        task({
          id: 'crop-check',
          fromDay: 0,
          toDay: 0,
          kind: 'brooding',
          title: ar('افحص الحوصلة بعد 3 ساعات'),
          detail: ar('98٪ من الكتاكيت لازم حوصلتها مليانة وطرية ورجليها دافية.'),
        }),
        task({
          id: 'paper',
          fromDay: 1,
          toDay: 3,
          kind: 'litter',
          daily: true,
          title: ar('شيل طبقة ورق من على الفرشة'),
        }),
        task({
          id: 'behaviour',
          fromDay: 0,
          toDay: 21,
          kind: 'brooding',
          daily: true,
          title: ar('زور الكتاكيت 5–6 مرات في اليوم وراقب توزيعها'),
        }),
        task({
          id: 'light',
          fromDay: 3,
          toDay: 3,
          kind: 'house',
          title: ar('قلّل النور لـ 20 ساعة'),
          detail: ar('24 ساعة أول يومين، 20 لحد 7 أيام، 16 لحد 14 يوم، وبعدها نور طبيعي.'),
        }),
        task({
          id: 'vet',
          fromDay: 3,
          toDay: 3,
          kind: 'health',
          title: ar('اتفق مع طبيب بيطري على برنامج التحصين'),
        }),
        task({
          id: 'expand',
          fromDay: 8,
          toDay: 8,
          kind: 'brooding',
          title: ar('وسّع المكان وزوّد المعالف والسقايات'),
        }),
        task({
          id: 'heat-off',
          fromDay: 21,
          toDay: 21,
          kind: 'brooding',
          title: ar('شيل التدفئة لو الجو معتدل'),
        }),
        task({
          id: 'range',
          fromDay: 22,
          toDay: 22,
          kind: 'house',
          title: ar('ممكن تبدأ تسرّحها بالنهار في مكان مقفول وآمن'),
        }),
        task({
          id: 'weigh',
          fromDay: 28,
          toDay: 28,
          kind: 'weigh',
          title: ar('وزّن 5٪ من الفراخ وقارن بالمستهدف'),
          detail: ar('كرّر كل أسبوع.'),
        }),
        task({
          id: 'market',
          fromDay: 63,
          toDay: 63,
          kind: 'market',
          title: ar('البيع'),
          detail: ar('على الوزن اللي الزبون عايزه — من 8 لـ 10 أسابيع.'),
        }),
        task({
          id: 'dead',
          fromDay: 0,
          toDay: 63,
          kind: 'health',
          daily: true,
          title: ar('شيل النافق وسجّله'),
        }),
      ],
      signs: [
        {
          fromDay: 0,
          toDay: 3,
          severity: 'urgent',
          text: ar('كتاكيت متكوّمة وبتصوصو بصوت عالي = برد أو جوع. اتحرك فوراً.'),
        },
        {
          fromDay: 0,
          toDay: 7,
          severity: 'watch',
          text: ar('مؤخرة متلزقة — اتأكد من المية والحرارة.'),
        },
        {
          fromDay: 3,
          toDay: 35,
          severity: 'watch',
          text: ar('إسهال بدم أو ريش منفوش ونعاس — كلّم طبيب بيطري.'),
        },
        {
          fromDay: 22,
          toDay: 70,
          severity: 'urgent',
          text: ar('نفوق مفاجئ أو رقبة ملوية — اعزل وبلّغ الطبيب البيطري.'),
        },
        {
          fromDay: 22,
          toDay: 70,
          severity: 'watch',
          text: ar('فراخ بتنهج وجناحاتها مفتوحة في الحر — ضل ومية باردة وتهوية.'),
        },
      ],
    },
  },
  breeding: {
    broody: 'weak',
    incubationDays: sv(21, 'يوم', 'chicken_fao2004Incub', 'high', { min: 20, max: 21 }),
    checks: BROOD_CHECKS,
    care: [
      ar(
        'فراخ Sasso للحم هجين؛ درجة الرقاد مش مذكورة في الدليل. لو عايز تفقّس بيض حطه تحت فرخة بلدي.',
      ),
      ar('الكتاكيت اللي هتطلع من بيض الهجين مش هتكون زي أهلها.'),
    ],
  },
  health: {
    vaccinations: [],
    problems: [
      ...HEALTH_PROBLEMS,
      st(
        'دليل Sasso بيدّي مثال تحصين (نيوكاسل أسبوع 1 و4 و8، جمبورو أسبوع 2، جدري أسبوع 6) وبيقول لازم برنامج من طبيبك حسب منطقتك.',
        'chicken_sassoRural',
        'medium',
      ),
    ],
    dangerSigns: [...DANGER_SIGNS, VET_NOTE],
  },
  climate: {
    bands: meatClimate(
      'low',
      'دليل Sasso ما بيديش أرقام حرارة؛ استخدمنا جدول تحضين Ross (حرارة المكان ← حرارة حافة الدفاية).',
    ),
  },
  mixing: { okWith: [], avoid: MIX_AVOID },
  expected: {
    bodyWeight: table(
      SASSO.map(([d, w]) => [d, w] as const),
      'جم',
      'chicken_sassoRainbowX',
      'medium',
      {
        note: 'جدول هجين Rainbow X × SA51A مختلط ذكور وإناث. الأنواع التانية من Sasso والسرحان بيدّوا أوزان أقل.',
      },
    ),
    feedToMarketKg: sv(5.9, 'كجم/طائر', 'chicken_sassoRainbowX', 'medium', {
      note: 'محسوب: وزن 63 يوم (2.49 كجم) × معامل التحويل 2.36.',
    }),
  },
}

// ---------- white broiler (detailed data in species/broiler-white.ts) ----------

const bw = broilerWhite
const bwTasks = new Set([
  'clean-out',
  'disinfect',
  'rest',
  'litter-spread',
  'preheat',
  'receive',
  'crop-check',
  'behaviour',
  'expand-1',
  'weigh-7',
  'feed-grower',
  'full-house',
  'feed-finisher',
  'withdrawal',
  'market',
])

const broiler: BirdProfile = {
  id: 'chicken-broiler-white',
  kind: 'chicken',
  name: bw.name,
  description: bw.description,
  purposes: ['meat'],
  dataStatus: 'full',
  unit: 'birds',
  detailedId: 'broiler-white',
  defaultAge: 0,
  housing: {
    type: ar('أوضة أو سطح مقفول ومتظلل بفرشة نشارة، وحاجز تحضين ودفاية. الأرضية الأسمنت أحسن.'),
    space: [
      {
        fromDay: 0,
        toDay: 3,
        perM2: sv(50, 'كتكوت/م²', 'cobb21', 'high', {
          min: 40,
          max: 60,
          note: 'شتا لحد 50–60، صيف 40–50.',
        }),
      },
      { fromDay: 4, toDay: 6, perM2: sv(42, 'كتكوت/م²', 'cobb21', 'high', { min: 40, max: 45 }) },
      { fromDay: 7, toDay: 9, perM2: sv(32, 'كتكوت/م²', 'cobb21', 'high', { min: 30, max: 35 }) },
      { fromDay: 10, toDay: 13, perM2: sv(22, 'كتكوت/م²', 'cobb21', 'high', { min: 20, max: 25 }) },
      {
        fromDay: 14,
        toDay: 3650,
        perM2: sv(8, 'طائر/م²', 'hb25', 'medium', {
          min: 7,
          max: 10,
          note: 'محسوب: 20 كجم/م² (مكان مفتوح من غير تحكم في الجو) ÷ وزن بيع 2.3 كجم. في الصيف قلّل العدد.',
        }),
      },
    ],
    water: ar(
      'مية نضيفة طول الوقت، وسقاية لكل 80 كتكوت أول أسبوع. السقايات الوسخة أول باب للأمراض.',
    ),
    notes: bw.housing.smallSpaceTips.slice(0, 4),
  },
  feeding: {
    phases: bw.feed.phases.map((p) => ({
      id: p.id,
      name: p.name,
      fromDay: p.fromDay,
      toDay: p.toDay,
      crudeProtein: p.crudeProtein,
      note: p.form,
    })),
    dailyFeed: bw.growth.dailyFeed,
    waterToFeed: bw.growth.waterToFeedRatio,
    scraps: SCRAPS,
    notes: [...bw.feed.homeNotes.slice(0, 2), ...FEED_NOTES_HOME.slice(1)],
  },
  cycle: {
    endpoint: 'market',
    endpointAge: bw.marketAge,
    template: {
      ...broilerWhiteCycle,
      speciesId: 'chicken-broiler-white',
      tasks: broilerWhiteCycle.tasks.filter((t) => bwTasks.has(t.id)),
    },
  },
  breeding: {
    broody: 'no',
    incubationDays: sv(21, 'يوم', 'chicken_fao2004Incub', 'high', { min: 20, max: 21 }),
    checks: BROOD_CHECKS,
    care: [
      ar('التسمين الأبيض مش بيترقد ولا بيتربى للبيض في البيت — بيتباع على 5 أسابيع.'),
      ar('لو عايز تفقّس فراخ في البيت اختار بلدي أو سلالة محلية رقّادة.'),
    ],
  },
  health: {
    vaccinations: bw.health.vaccinations,
    problems: [
      ...HEALTH_PROBLEMS.slice(0, 4),
      st(
        'استخدم برنامج التحصين بعد ما تراجعه مع طبيب بيطري، والتزم بفترة السحب قبل البيع لو اتدّى دوا.',
        'egyVaccine2024',
        'medium',
      ),
    ],
    dangerSigns: DANGER_SIGNS,
  },
  climate: {
    bands: meatClimate(
      'high',
      'حرارة المكان (الحد الأدنى) وحرارة حافة الدفاية (الحد الأعلى) من دليل Ross، محوّلة من الوزن للعمر.',
    ),
  },
  mixing: { okWith: [], avoid: MIX_AVOID },
  expected: {
    bodyWeight: bw.growth.bodyWeight,
    feedToMarketKg: sv(3.2, 'كجم/طائر', 'po22', 'high', {
      note: 'العلف المتجمّع لحد 35 يوم (3211 جم).',
    }),
  },
}

export const CHICKEN_PROFILES: BirdProfile[] = [baladi, improved, fayoumi, layer, sasso, broiler]
