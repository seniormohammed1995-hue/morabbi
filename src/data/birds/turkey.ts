import type {
  BirdProfile,
  ClimateBand,
  Confidence,
  CycleTemplate,
  ScrapRule,
  SourcedValue,
} from '../schema'
import { ar, avoidWith, scrap, st, sv, table } from '../helpers'

const C = '°م'
const MARGIN =
  'حد الخطر = 3 درجات بعيد عن مدى الراحة. الهامش ده تقدير من عندنا، المصدر بيدي حرارة التحضين بس.'
const UNH_RULE =
  'UNH: ابدأ بـ 100°ف (حوالي 38°) عند مستوى الطيور ونزّل 5°ف (حوالي 3°) كل أسبوع لحد 6 أسابيع. مدى الراحة = حرارة الأسبوع ده لحد حرارة الأسبوع الجاي.'

const rh: SourcedValue = sv(70, '٪', 'turkey_mendes2015', 'low', {
  note: 'مفيش حد رطوبة منشور للرومي. الرطوبة العالية بتقلل قدرة الطير على التبريد في الحر؛ 70٪ تقدير من عندنا.',
})

const brood = (fromDay: number, toDay: number, lo: number, hi: number): ClimateBand => ({
  fromDay,
  toDay,
  comfortMin: sv(lo, C, 'turkey_unh', 'medium', { note: UNH_RULE }),
  comfortMax: sv(hi, C, 'turkey_unh', 'medium', { note: UNH_RULE }),
  dangerLow: sv(lo - 3, C, 'turkey_unh', 'low', { note: MARGIN }),
  dangerHigh: sv(hi + 3, C, 'turkey_unh', 'low', { note: MARGIN }),
  rhMax: rh,
})

function climate(conf: Confidence, breedNote?: string): ClimateBand[] {
  const n = (s: string) => (breedNote ? `${s} ${breedNote}` : s)
  const cold = sv(5, C, 'turkey_unh', 'low', {
    note: n(
      'مفيش حد أدنى منشور للرومي الكبير. 5° تقدير من عندنا؛ UNH بيقول الصغيرين محتاجين تدفئة لما الليل يبرد قوي.',
    ),
  })
  const hot = sv(27, C, 'turkey_mendes2015', conf, {
    note: n('فوق 27° نفَس الرومي وحرارة جسمه وشربه للمية بيزيدوا.'),
  })
  return [
    brood(0, 6, 35, 38),
    brood(7, 13, 32, 35),
    brood(14, 20, 29, 32),
    brood(21, 27, 27, 29),
    brood(28, 34, 24, 27),
    brood(35, 41, 21, 24),
    {
      fromDay: 42,
      toDay: 83,
      comfortMin: sv(15, C, 'turkey_mendes2015', conf, {
        note: n('المدى المثالي للرومي من 12 أسبوع 15–21°.'),
      }),
      comfortMax: sv(25, C, 'turkey_mendes2015', conf, {
        note: n('المنطقة المريحة للرومي لحد 25° تقريباً.'),
      }),
      dangerLow: cold,
      dangerHigh: hot,
      rhMax: rh,
    },
    {
      fromDay: 84,
      toDay: 3650,
      comfortMin: sv(15, C, 'turkey_mendes2015', conf, {
        note: n('المدى المثالي للرومي من 12 لـ 24 أسبوع 15–21°.'),
      }),
      comfortMax: sv(21, C, 'turkey_mendes2015', conf),
      dangerLow: cold,
      dangerHigh: hot,
      rhMax: rh,
    },
  ]
}

const SCRAPS: ScrapRule[] = [
  scrap(
    'bread',
    'limit',
    'شوية صغيرين. العيش بيشبّع الرومي من غير البروتين اللي محتاجه.',
    'turkey_ucScraps',
    'medium',
  ),
  scrap(
    'moldy-food',
    'no',
    'العفن فيه سموم فطرية (أفلاتوكسين) بتموّت الطيور.',
    'turkey_avTox',
    'high',
  ),
  scrap('rice-cooked', 'limit', 'كمية قليلة من غير ملح ولا سمنة.', 'turkey_ucScraps', 'low'),
  scrap('rice-raw', 'limit', 'مش سام بس فقير في البروتين.', 'turkey_ucScraps', 'low'),
  scrap('pasta', 'limit', 'مسلوقة من غير صلصة وملح، كمية قليلة.', 'turkey_ucScraps', 'low'),
  scrap(
    'potato-peel',
    'no',
    'قشر البطاطس والجزء الأخضر فيه مواد سامة للطيور.',
    'turkey_ucScraps',
    'high',
  ),
  scrap(
    'potato-cooked',
    'limit',
    'المسلوقة من غير ملح بكمية قليلة. شيل أي جزء أخضر.',
    'turkey_ucScraps',
    'low',
  ),
  scrap('greens', 'ok', 'خضرة ورقية كتسالي، والعلف يفضل الأساس.', 'turkey_ucScraps', 'medium'),
  scrap('cabbage', 'limit', 'مقطع وكمية معقولة.', 'turkey_ucScraps', 'low'),
  scrap('cucumber', 'ok', 'مفيد في الحر.', 'turkey_ucScraps', 'low'),
  scrap(
    'tomato',
    'limit',
    'الطماطم المستوية بس. ورق وعرش الطماطم سام.',
    'turkey_ucScraps',
    'medium',
  ),
  scrap('carrot', 'ok', 'مبشور أو مقطع صغير.', 'turkey_ucScraps', 'low'),
  scrap(
    'watermelon',
    'limit',
    'كمية معقولة في الحر، وشيل اللي يفضل علشان الدبان.',
    'turkey_ucScraps',
    'low',
  ),
  scrap('fruit', 'limit', 'كتسالي بس، فيها سكر.', 'turkey_ucScraps', 'low'),
  scrap('citrus', 'limit', 'مفيش دليل إنه سام، بس ما تكترش.', 'turkey_ucScraps', 'low'),
  scrap(
    'onion-garlic',
    'no',
    'البصل والتوم ممكن يكسروا كرات الدم في الحيوانات بكميات كبيرة.',
    'turkey_msdAllium',
    'medium',
  ),
  scrap('avocado', 'no', 'الأفوكادو سام للطيور (مادة البيرسين).', 'turkey_avTox', 'high'),
  scrap('chocolate', 'no', 'الشوكولاتة سامة للطيور.', 'turkey_avTox', 'high'),
  scrap('coffee-tea', 'no', 'الكافيين حتى بكمية صغيرة خطر على الطيور.', 'turkey_avTox', 'high'),
  scrap(
    'salty',
    'no',
    'الملح الزيادة بيعمل تسمم، والصغيرين أكتر ناس بتموت منه.',
    'turkey_avTox',
    'high',
  ),
  scrap('fried', 'no', 'الطيور مش محتاجة دهون كتير. ابعد عن المقلي.', 'turkey_ucScraps', 'medium'),
  scrap('sweets', 'no', 'سكر من غير فايدة، وبيقلل أكل العلف.', 'turkey_ucScraps', 'low'),
  scrap(
    'meat-scraps',
    'limit',
    'حتت صغيرة مطبوخة من غير ملح وتوابل، وما تسيبهاش تبوظ.',
    'turkey_ucScraps',
    'low',
  ),
  scrap(
    'fish-scraps',
    'limit',
    'مطبوخ ومن غير ملح وكمية صغيرة. المملح ممنوع.',
    'turkey_ucScraps',
    'low',
  ),
  scrap('eggshell', 'limit', 'مسلوق ومطحون ناعم للإناث وقت البيض بس.', 'turkey_ucScraps', 'low'),
  scrap('egg-cooked', 'ok', 'بيض مسلوق مفروم بروتين كويس للصغيرين.', 'turkey_ucScraps', 'low'),
  scrap('beans-raw', 'no', 'البقول الني فيها مواد سامة للطيور.', 'turkey_ucScraps', 'high'),
  scrap('beans-cooked', 'limit', 'مطبوخ كويس ومن غير ملح، كمية صغيرة.', 'turkey_ucScraps', 'low'),
  scrap(
    'grains',
    'limit',
    'الحبوب لوحدها بروتينها قليل على الرومي. كمية مع العلف.',
    'turkey_ucScraps',
    'low',
  ),
  scrap(
    'clover',
    'ok',
    'برسيم طري كتسالي. بس الرعي على أرض عليها زرق فراخ بيجيب مرض الرأس السودا.',
    'turkey_msdBlackhead',
    'medium',
  ),
  scrap('dates', 'limit', 'حتة صغيرة من غير نوى، فيه سكر كتير.', 'turkey_ucScraps', 'low'),
]

const MIXING: BirdProfile['mixing'] = {
  okWith: [],
  avoid: [
    avoidWith(
      'chicken',
      'الفراخ بتشيل طفيل مرض الرأس السودا (الهستومونس) من غير ما يبان عليها، والرومي بيموت منه بنسبة 80–100٪. بيض الديدان اللي بتشيله بيعيش في التراب سنين.',
      'turkey_msdBlackhead',
      'high',
    ),
    avoidWith(
      'quail',
      'الالتهاب المعوي التقرحي بيصيب السمان والرومي، والطيور اللي بتخف بتفضل حاملة له.',
      'turkey_msdUE',
      'medium',
    ),
    avoidWith(
      'duck',
      'البط والطيور المائية ممكن تشيل أنفلونزا الطيور من غير ما يبان عليها.',
      'turkey_msdAI',
      'medium',
    ),
    avoidWith(
      'goose',
      'الوز ممكن يشيل أنفلونزا الطيور من غير ما يبان عليه.',
      'turkey_msdAI',
      'medium',
    ),
    avoidWith(
      'pigeon',
      'الحمام ممكن يكون مصدر لفيروس النيوكاسل للدواجن.',
      'turkey_msdND',
      'medium',
    ),
  ],
}

const HOUSING: BirdProfile['housing'] = {
  type: ar(
    'أوضة أو عشة على السطح أو في الحوش، ناشفة ومن غير تيارات هوا، وفيها مجاثم. بعد شهرين ينفع حوش مسوّر جنبها.',
  ),
  space: [
    {
      fromDay: 0,
      toDay: 55,
      perM2: sv(10, 'طائر/م²', 'turkey_unh', 'medium', {
        note: 'قدم مربع (حوالي 0.09 م²) لكل طائر في الحضانة من يوم لـ 8 أسابيع.',
      }),
    },
    {
      fromDay: 56,
      toDay: 3650,
      perM2: sv(1.8, 'طائر/م²', 'turkey_unh', 'medium', {
        note: 'حوالي 6 قدم مربع (0.56 م²) لكل طائر جوه، وحوالي 1.9 م² للطائر في الحوش بعد شهرين.',
      }),
    },
  ],
  water: ar(
    'أول 5 ساعات بعد الاستلام اتأكد إن كل الكتاكيت لقت المية. خلي المية نضيفة ومتاحة طول الوقت، وزوّدها في الحر.',
  ),
  notes: [
    ar('حط ترمومتر على الأرض عند مستوى الكتاكيت أول أسبوعين.'),
    ar('خدّم على الرومي الأول وبعدين الفراخ، علشان ما تنقلش زرق الفراخ للرومي.'),
    ar('العلف لازم يكون قدامهم في خلال 12 ساعة من الاستلام.'),
  ],
}

const HEALTH = (extra: string): BirdProfile['health'] => ({
  vaccinations: [],
  problems: [
    st(
      'مرض الرأس السودا (الهستومونس): زرق لونه أصفر كبريتي، والنفوق في الرومي 80–100٪. الصغير بيموت في أيام من ظهور الأعراض. ابعده عن الفراخ وأرضها.',
      'turkey_msdBlackhead',
      'high',
    ),
    st('النيوكاسل: أعراضه في الرومي شبه الفراخ بس غالباً أخف.', 'turkey_msdND', 'high'),
    st(
      'الحر: فوق 27° الرومي بينهج وبيشرب أكتر. وفّر ضل وتهوية ومية باردة.',
      'turkey_mendes2015',
      'medium',
    ),
    st(
      `مفيش برنامج تحصين رسمي مصري منشور للرومي المنزلي. استشير طبيب بيطري للتحصينات حسب المنطقة.${extra ? ` ${extra}` : ''}`,
      'turkey_unh',
      'low',
    ),
  ],
  dangerSigns: [
    ar('زرق أصفر كبريتي وطائر نعسان وجناحاته مدلدلة.'),
    ar('نفوق مفاجئ لأكتر من طائر.'),
    ar('كتاكيت مش بتاكل ولا بتشرب في أول أيام.'),
    ar('صعوبة في النفس أو لوي في الرقبة.'),
  ],
})

function cycle(id: string, marketDay: number): CycleTemplate {
  return {
    speciesId: id,
    prepDays: 7,
    stages: [
      {
        id: 'prep',
        name: ar('تجهيز'),
        fromDay: -7,
        toDay: -1,
        summary: ar('تنضيف المكان وفرشة ناشفة وتجهيز التدفئة.'),
      },
      {
        id: 'brooding',
        name: ar('تحضين'),
        fromDay: 0,
        toDay: 41,
        summary: ar('كتاكيت الرومي محتاجة دفا عالي لحد 6 أسابيع، والحرارة بتقل كل أسبوع.'),
      },
      {
        id: 'growing',
        name: ar('نمو'),
        fromDay: 42,
        toDay: marketDay - 22,
        summary: ar('علف نامي، حوش بعد شهرين، وبعد عن الفراخ.'),
      },
      {
        id: 'finishing',
        name: ar('تسمين وبيع'),
        fromDay: marketDay - 21,
        toDay: marketDay,
        summary: ar('علف ناهي من غير أدوية قبل البيع بـ 3–4 أسابيع.'),
      },
    ],
    tasks: [
      {
        id: 'clean',
        fromDay: -7,
        toDay: -7,
        kind: 'prep',
        daily: false,
        title: ar('نضّف وطهّر المكان'),
      },
      {
        id: 'litter',
        fromDay: -2,
        toDay: -2,
        kind: 'litter',
        daily: false,
        title: ar('افرش فرشة ناشفة'),
      },
      {
        id: 'preheat',
        fromDay: -1,
        toDay: -1,
        kind: 'brooding',
        daily: false,
        title: ar('شغّل الدفاية وحط ترمومتر على الأرض'),
      },
      {
        id: 'receive',
        fromDay: 0,
        toDay: 0,
        kind: 'brooding',
        daily: false,
        title: ar('استلم الكتاكيت ووريها المية'),
        detail: ar('أول 5 ساعات اتأكد إن الكل بيشرب، والعلف قبل 12 ساعة.'),
      },
      {
        id: 'behaviour',
        fromDay: 0,
        toDay: 41,
        kind: 'brooding',
        daily: true,
        title: ar('راقب توزيع الكتاكيت تحت الدفاية'),
      },
      {
        id: 'water',
        fromDay: 0,
        toDay: marketDay,
        kind: 'house',
        daily: true,
        title: ar('نضّف السقاية وغيّر المية'),
      },
      {
        id: 'lower-heat',
        fromDay: 7,
        toDay: 7,
        kind: 'brooding',
        daily: false,
        title: ar('نزّل الحرارة حوالي 3 درجات'),
        detail: ar('وكرر كل أسبوع لحد 6 أسابيع.'),
      },
      {
        id: 'heat-off',
        fromDay: 42,
        toDay: 42,
        kind: 'brooding',
        daily: false,
        title: ar('افصل التدفئة لو الليل مش بارد'),
      },
      {
        id: 'grower',
        fromDay: 42,
        toDay: 42,
        kind: 'feed',
        daily: false,
        title: ar('حوّل من البادي للنامي'),
      },
      {
        id: 'yard',
        fromDay: 56,
        toDay: 56,
        kind: 'house',
        daily: false,
        title: ar('ينفع يخرج حوش مسوّر'),
        detail: ar('بعيد عن أرض الفراخ وزرقها.'),
      },
      {
        id: 'finisher',
        fromDay: marketDay - 21,
        toDay: marketDay - 21,
        kind: 'feed',
        daily: false,
        title: ar('حوّل لعلف ناهي من غير أدوية'),
        detail: ar('راجع فترة السحب لأي دوا اتدى.'),
      },
      {
        id: 'market',
        fromDay: marketDay,
        toDay: marketDay,
        kind: 'market',
        daily: false,
        title: ar('البيع أو الدبح حسب الوزن'),
      },
    ],
    signs: [
      {
        fromDay: 0,
        toDay: 7,
        severity: 'urgent',
        text: ar('كتاكيت متكومة وبتصوصو جامد = برد. ارفع الحرارة.'),
      },
      {
        fromDay: 0,
        toDay: 7,
        severity: 'urgent',
        text: ar('كتاكيت قاعدة بعيد عن المية والأكل — اتأكد إن الكل لقى السقاية والمعلفة.'),
      },
      {
        fromDay: 14,
        toDay: marketDay,
        severity: 'urgent',
        text: ar('زرق أصفر كبريتي = اشتباه مرض الرأس السودا. اعزل وكلّم طبيب بيطري فوراً.'),
      },
      {
        fromDay: 42,
        toDay: marketDay,
        severity: 'watch',
        text: ar('طيور بتنهج وفاتحة جناحاتها = حر. ضل وتهوية ومية باردة.'),
      },
    ],
  }
}

/** B.U.T. 6 objectives — average of the male and female tables (week → day). */
const BUT6_BW: ReadonlyArray<readonly [number, number]> = [
  [7, 0.18],
  [14, 0.36],
  [28, 1.14],
  [42, 2.55],
  [56, 4.44],
  [70, 6.66],
  [84, 9.04],
  [98, 11.43],
  [112, 13.73],
  [126, 15.85],
]
const BUT6_FEED: ReadonlyArray<readonly [number, number]> = [
  [7, 22],
  [14, 41],
  [21, 70],
  [28, 105],
  [35, 145],
  [42, 185],
  [56, 267],
  [70, 346],
  [84, 415],
  [98, 470],
  [112, 507],
  [126, 532],
]

/** Baladi turkey, unselected control line, monthly weights (kg). */
const BALADI_BW: ReadonlyArray<readonly [number, number]> = [
  [0, 0.047],
  [30, 0.25],
  [60, 0.81],
  [90, 1.73],
  [120, 2.67],
  [150, 3.39],
  [180, 3.97],
]

const BROOD_CHECKS = [
  {
    id: 'start',
    day: 0,
    title: ar('الرومية بدأت ترقد'),
    detail: ar('مكان هادي ونضيف، وأكل ومية جنبها.'),
  },
  { id: 'candle', day: 7, title: ar('شمّع البيض'), detail: ar('شيل البيض الفاضي.') },
  {
    id: 'quiet',
    day: 25,
    title: ar('ما تلمسش البيض'),
    detail: ar('من هنا لحد الفقس ما تقلبش وما تزعجهاش.'),
  },
  {
    id: 'hatch',
    day: 28,
    title: ar('ميعاد الفقس'),
    detail: ar('علّم الكتاكيت تشرب وتاكل أول ما تنشف.'),
  },
]

export const TURKEY_PROFILES: BirdProfile[] = [
  {
    id: 'turkey-white',
    kind: 'turkey',
    name: ar('رومي أبيض'),
    description: ar(
      'الرومي الأبيض التجاري (زي B.U.T. 6). نموه سريع جداً ووزنه تقيل، بيتربى للحم. حساس للحر ولمرض الرأس السودا لو اتربى مع الفراخ.',
    ),
    purposes: ['meat'],
    dataStatus: 'full',
    unit: 'birds',
    defaultAge: 0,
    housing: HOUSING,
    feeding: {
      phases: [
        {
          id: 'prestarter',
          name: ar('بادي أول'),
          fromDay: 0,
          toDay: 21,
          crudeProtein: sv(28, '٪', 'turkey_baladi2026', 'medium', {
            note: 'رقم من تجربة مصرية على الرومي (28.7٪ لحد 4 أسابيع). دليل Aviagen بيدي أحماض أمينية مش بروتين خام.',
          }),
          note: ar('علف بادي رومي فتات (crumble). علف التسمين بروتينه أقل من المطلوب.'),
        },
        {
          id: 'starter',
          name: ar('بادي تاني'),
          fromDay: 22,
          toDay: 41,
          note: ar('مراحل العلف حسب جدول Aviagen (كل مرحلة حوالي 3 أسابيع).'),
        },
        { id: 'grower', name: ar('نامي'), fromDay: 42, toDay: 90 },
        {
          id: 'finisher',
          name: ar('ناهي'),
          fromDay: 91,
          toDay: 3650,
          note: ar('علف من غير أدوية آخر 3–4 أسابيع قبل الدبح.'),
        },
      ],
      dailyFeed: table(BUT6_FEED, 'جم/طائر/يوم', 'turkey_but6', 'medium', {
        note: 'متوسط جدولي الدكور والإناث في أهداف B.U.T. 6. الأهداف لجو معتدل؛ في الصيف المصري الأكل والنمو أقل.',
      }),
      scraps: SCRAPS,
      notes: [
        ar('الرومي التجاري محتاج علف بروتينه عالي في الأول. البواقي تسالي بس.'),
        ar('في الحر الرومي بياكل أقل؛ أكّله في الأوقات الباردة.'),
      ],
    },
    cycle: {
      endpoint: 'market',
      endpointAge: sv(112, 'يوم', 'turkey_but6', 'low', {
        min: 84,
        max: 140,
        note: 'سن البيع قرار من عندنا للتربية المنزلية (16 أسبوع)، مش رقم من الدليل. الجدول بيكمل لحد 22 أسبوع للدكور.',
      }),
      template: cycle('turkey-white', 112),
    },
    breeding: {
      broody: 'weak',
      incubationDays: sv(28, 'يوم', 'turkey_msuHatch', 'high'),
      checks: BROOD_CHECKS,
      care: [
        ar(
          'الرومي الأبيض التجاري تقيل وغريزة الرقاد عنده ضعيفة. التفريخ غالباً بفقاسة أو تحت رومية بلدي.',
        ),
        ar('في الفقاسة: حوالي 37.2° (99°ف) في فقاسة بمروحة، وبطّل تقلب بعد اليوم 25.'),
      ],
    },
    health: HEALTH(''),
    climate: { bands: climate('medium') },
    mixing: MIXING,
    expected: {
      bodyWeight: table(BUT6_BW, 'كجم', 'turkey_but6', 'medium', {
        note: 'متوسط الدكور والإناث في أهداف B.U.T. 6 (جو معتدل وتربية تجارية). في البيت والصيف غالباً أقل.',
      }),
      feedToMarketKg: sv(31, 'كجم/طائر', 'turkey_but6', 'medium', {
        min: 27.5,
        max: 34.4,
        note: 'محسوب عند 16 أسبوع: الوزن × معامل التحويل التراكمي (دكور 34.4، إناث 27.5).',
      }),
    },
  },
  {
    id: 'turkey-black',
    kind: 'turkey',
    name: ar('رومي بلدي أسود'),
    description: ar(
      'الرومي البلدي الأسود المصري. أبطأ في النمو وأخف من الأبيض، بس متأقلم على الجو والأمراض المحلية، والرومية بترقد على بيضها.',
    ),
    purposes: ['meat'],
    dataStatus: 'limited',
    unit: 'birds',
    defaultAge: 0,
    housing: HOUSING,
    feeding: {
      phases: [
        {
          id: 'prestarter',
          name: ar('بادي أول'),
          fromDay: 0,
          toDay: 27,
          crudeProtein: sv(28.7, '٪', 'turkey_baladi2026', 'high'),
        },
        {
          id: 'starter',
          name: ar('بادي'),
          fromDay: 28,
          toDay: 55,
          crudeProtein: sv(23, '٪', 'turkey_baladi2026', 'medium', {
            note: 'نسبة البروتين من التجربة؛ سن نهاية المرحلة تقدير من عندنا.',
          }),
        },
        {
          id: 'grower',
          name: ar('نامي'),
          fromDay: 56,
          toDay: 209,
          crudeProtein: sv(21, '٪', 'turkey_baladi2026', 'medium', {
            note: 'نسبة البروتين من التجربة؛ حدود السن تقدير من عندنا.',
          }),
        },
        {
          id: 'layer',
          name: ar('علف بياض للأمهات'),
          fromDay: 210,
          toDay: 3650,
          crudeProtein: sv(18, '٪', 'turkey_baladi2026', 'medium', {
            note: 'جمع البيض في التجربة بدأ من 7 شهور.',
          }),
        },
      ],
      scraps: SCRAPS,
      notes: [
        ar('الأرقام من تجربة مصرية على الرومي البلدي في حظاير أرضية بعلف كامل.'),
        ar('الرومي البلدي بيستحمل علف أبسط من الأبيض، بس البروتين العالي في أول شهر مهم.'),
      ],
    },
    cycle: {
      endpoint: 'market',
      endpointAge: sv(150, 'يوم', 'turkey_baladi2026', 'low', {
        min: 120,
        max: 180,
        note: 'سن البيع قرار من عندنا. التجربة بتدي أوزان لحد 6 شهور؛ عند 5 شهور الوزن حوالي 3.4 كجم.',
      }),
      template: cycle('turkey-black', 150),
    },
    breeding: {
      broody: 'yes',
      incubationDays: sv(28, 'يوم', 'turkey_msuHatch', 'high'),
      checks: BROOD_CHECKS,
      care: [
        ar('الرومية البلدي بترقد كويس، وبتنفع ترقد على بيض وز (10–14 بيضة).'),
        ar('لو مش بتقلب البيض كويس، اقلبه بإيدك نص لفة 2–3 مرات في اليوم.'),
      ],
    },
    health: HEALTH('الرومي البلدي معروف بمقاومة أحسن للأمراض المحلية، بس ده مش بديل عن الوقاية.'),
    climate: { bands: climate('low', 'الرقم مأخوذ من الرومي عموماً؛ البلدي متأقلم أكتر على الحر.') },
    mixing: MIXING,
    expected: {
      bodyWeight: table(BALADI_BW, 'كجم', 'turkey_baladi2026', 'high', {
        note: 'الخط غير المنتخب في تجربة مصرية (متوسط الجنسين، شهري).',
      }),
      adultWeightKg: sv(4.5, 'كجم', 'turkey_baladi2026', 'medium', {
        min: 3.4,
        max: 5.6,
        note: 'عند 6 شهور: الدكور حوالي 5.6 والإناث حوالي 3.4 كجم. الرقم الأوسط متوسط الاتنين.',
      }),
    },
  },
]
