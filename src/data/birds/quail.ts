import type { BirdProfile, ClimateBand, ScrapRule, SourcedValue } from '../schema'
import { ar, avoidWith, scrap, st, sv } from '../helpers'

const MARGIN =
  'حد الخطر = 3 درجات بعيد عن مدى الراحة. الهامش ده تقدير من عندنا، المصدر بيدي مدى الراحة بس.'
const C = '°م'

/** MSU brooding table (°F → °C), summer–winter range per week. */
const brood = (fromDay: number, toDay: number, lo: number, hi: number): ClimateBand => ({
  fromDay,
  toDay,
  comfortMin: sv(lo, C, 'quail_msuBrood', 'high', {
    note: 'الرقم الأقل للصيف والأعلى للشتا. اتقاس عند مستوى الكتاكيت.',
  }),
  comfortMax: sv(hi, C, 'quail_msuBrood', 'high'),
  dangerLow: sv(lo - 3, C, 'quail_msuBrood', 'low', { note: MARGIN }),
  dangerHigh: sv(hi + 3, C, 'quail_msuBrood', 'low', { note: MARGIN }),
  rhMax: rh,
})

const rh: SourcedValue = sv(62, '٪', 'quail_oke2025', 'medium', {
  min: 58,
  max: 62,
  note: 'الرطوبة المناسبة للسمان البياض 58–62٪. فوق كده الفرشة والزرق بيرطبوا.',
})

const SCRAPS: ScrapRule[] = [
  scrap(
    'bread',
    'limit',
    'حتة صغيرة مفتتة بس. العيش بيشبّع السمانة من غير بروتين، والسمان محتاج علف بروتينه عالي.',
    'quail_ucScraps',
    'medium',
  ),
  scrap(
    'moldy-food',
    'no',
    'العفن فيه سموم فطرية (أفلاتوكسين) بتموّت الطيور.',
    'quail_avTox',
    'high',
  ),
  scrap(
    'rice-cooked',
    'limit',
    'شوية صغيرين من غير ملح ولا سمنة. ما ينفعش يبقى بدل العلف.',
    'quail_ucScraps',
    'low',
  ),
  scrap(
    'rice-raw',
    'limit',
    'مش سام، بس فقير في البروتين. كمية قليلة مع العلف.',
    'quail_ucScraps',
    'low',
  ),
  scrap('pasta', 'limit', 'مسلوقة من غير صلصة وملح، وكمية قليلة.', 'quail_ucScraps', 'low'),
  scrap(
    'potato-peel',
    'no',
    'قشر البطاطس والجزء الأخضر فيه مواد سامة للطيور.',
    'quail_ucScraps',
    'high',
  ),
  scrap(
    'potato-cooked',
    'limit',
    'المسلوقة من غير ملح ماشي بكمية قليلة. شيل أي جزء أخضر.',
    'quail_ucScraps',
    'low',
  ),
  scrap(
    'greens',
    'ok',
    'خضرة ورقية مفرومة ناعم كتسالي. بس العلف يفضل الأساس.',
    'quail_ucScraps',
    'medium',
  ),
  scrap('cabbage', 'limit', 'مفروم ناعم وكمية قليلة.', 'quail_ucScraps', 'low'),
  scrap('cucumber', 'ok', 'مفيد في الحر لأنه مية. قطّعه صغير.', 'quail_ucScraps', 'low'),
  scrap(
    'tomato',
    'limit',
    'الطماطم المستوية بس. ورق وعرش الطماطم سام.',
    'quail_ucScraps',
    'medium',
  ),
  scrap('carrot', 'ok', 'مبشور ناعم علشان منقار السمانة صغير.', 'quail_ucScraps', 'low'),
  scrap(
    'watermelon',
    'limit',
    'اللب الأحمر بكمية قليلة في الحر. شيله بعد ساعة علشان ما يجيبش دبان.',
    'quail_ucScraps',
    'low',
  ),
  scrap('fruit', 'limit', 'حتت صغيرة كتسالي. فيها سكر كتير.', 'quail_ucScraps', 'low'),
  scrap(
    'citrus',
    'limit',
    'مفيش دليل إنه سام، بس الطيور غالباً مش بتاكله. ما تكترش.',
    'quail_ucScraps',
    'low',
  ),
  scrap(
    'onion-garlic',
    'no',
    'البصل والتوم ممكن يكسروا كرات الدم في الحيوانات بكميات كبيرة. ما فيش داعي.',
    'quail_msdAllium',
    'medium',
  ),
  scrap('avocado', 'no', 'الأفوكادو سام للطيور (مادة البيرسين) وممكن يموّت.', 'quail_avTox', 'high'),
  scrap('chocolate', 'no', 'الشوكولاتة سامة للطيور وحالات كتير ماتت منها.', 'quail_avTox', 'high'),
  scrap(
    'coffee-tea',
    'no',
    'الكافيين حتى بكمية صغيرة بيعمل أعراض خطيرة في الطيور.',
    'quail_avTox',
    'high',
  ),
  scrap(
    'salty',
    'no',
    'الملح الزيادة بيعمل تسمم، والصغيرين أكتر ناس بتموت منه.',
    'quail_avTox',
    'high',
  ),
  scrap(
    'fried',
    'no',
    'الطيور مش محتاجة دهون كتير. ابعد عن المقلي والزيت.',
    'quail_ucScraps',
    'medium',
  ),
  scrap('sweets', 'no', 'سكر من غير فايدة، وبيقلل أكل العلف المتوازن.', 'quail_ucScraps', 'low'),
  scrap(
    'meat-scraps',
    'limit',
    'حتت صغيرة مطبوخة من غير ملح وتوابل. ما تسيبهاش تبوظ.',
    'quail_ucScraps',
    'low',
  ),
  scrap(
    'fish-scraps',
    'limit',
    'مطبوخ ومن غير ملح، وكمية صغيرة. السمك المملح ممنوع.',
    'quail_ucScraps',
    'low',
  ),
  scrap(
    'eggshell',
    'limit',
    'مسلوق ومطحون ناعم جداً للبياض بس، علشان ما يتعلموش ياكلوا البيض.',
    'quail_ucScraps',
    'low',
  ),
  scrap(
    'egg-cooked',
    'ok',
    'بيض مسلوق مفروم ناعم مصدر بروتين كويس للكتاكيت.',
    'quail_ucScraps',
    'low',
  ),
  scrap('beans-raw', 'no', 'البقول الني فيها مواد سامة للطيور.', 'quail_ucScraps', 'high'),
  scrap('beans-cooked', 'limit', 'مطبوخ كويس ومن غير ملح، وكمية صغيرة.', 'quail_ucScraps', 'low'),
  scrap(
    'grains',
    'limit',
    'لازم تبقى مجروشة ناعم. الحب الكامل كبير على السمانة وبروتينه قليل.',
    'quail_ucScraps',
    'low',
  ),
  scrap('clover', 'limit', 'برسيم طري مفروم ناعم كتسالي.', 'quail_ucScraps', 'low'),
  scrap('dates', 'limit', 'حتة صغيرة من غير نوى. فيه سكر كتير.', 'quail_ucScraps', 'low'),
]

export const QUAIL_PROFILES: BirdProfile[] = [
  {
    id: 'quail-japanese',
    kind: 'quail',
    name: ar('سمان ياباني'),
    description: ar(
      'السمان الياباني (كوتيرنكس). صغير وبيتربى في أقفاص في أوضة أو بلكونة. بيبدأ يبيض في حوالي 6 أسابيع، وبيضه صغير. بيتربى للبيض واللحم.',
    ),
    purposes: ['meat', 'eggs'],
    dataStatus: 'full',
    unit: 'birds',
    defaultAge: 42,
    housing: {
      type: ar(
        'أقفاص سلك بأدوار في أوضة أو بلكونة مقفولة من الهوا. أرضية القفص سلك ناعم علشان الزرق ينزل.',
      ),
      space: [
        {
          fromDay: 0,
          toDay: 27,
          perM2: sv(66, 'طائر/م²', 'quail_tnau', 'medium', {
            note: '75 سم² تحت الدفاية + 75 سم² جري لكل كتكوت. في التحضين على الأرض.',
          }),
        },
        {
          fromDay: 28,
          toDay: 3650,
          perM2: sv(60, 'طائر/م²', 'quail_tnau', 'medium', {
            min: 55,
            max: 66,
            note: '150–180 سم² لكل سمانة في أقفاص البيض. لو على الأرض خلي العدد أقل.',
          }),
        },
      ],
      water: ar(
        'سقاية صغيرة. أول أسبوع أو اتنين حط بلي أو زلط في طبق المية علشان الكتاكيت ما تغرقش.',
      ),
      notes: [
        ar('حط حاجز حوالين التحضين أول أسبوع أو اتنين، وشيله لما الكتاكيت تبدأ تطير.'),
        ar('السمان بيطير لفوق فجأة لما يتخض. خلي سقف القفص واطي أو قماش طري علشان ما يتعورش.'),
        ar('مكان المعلفة 2–3 سم والسقاية 2 سم لكل سمانة كبيرة.'),
      ],
    },
    feeding: {
      phases: [
        {
          id: 'starter',
          name: ar('بادي'),
          fromDay: 0,
          toDay: 20,
          crudeProtein: sv(27, '٪', 'quail_tnau', 'medium'),
          note: ar('علف بادي ناعم (مجروش). علف بادي الرومي أو التسمين أقرب حاجة لو مفيش علف سمان.'),
        },
        {
          id: 'grower',
          name: ar('نامي'),
          fromDay: 21,
          toDay: 41,
          crudeProtein: sv(24, '٪', 'quail_tnau', 'medium'),
        },
        {
          id: 'layer',
          name: ar('بياض'),
          fromDay: 42,
          toDay: 3650,
          crudeProtein: sv(22, '٪', 'quail_tnau', 'medium'),
          note: ar('علف بياض فيه كالسيوم علشان قشر البيض.'),
        },
      ],
      scraps: SCRAPS,
      notes: [
        ar('السمان محتاج علف بروتينه أعلى من الفراخ. بواقي الأكل تسالي بس، مش وجبة.'),
        ar('أكل السمان صغير الحجم. أي حاجة تديها له لازم تكون مفرومة أو مجروشة ناعم.'),
      ],
    },
    cycle: {
      endpoint: 'first-egg',
      endpointAge: sv(42, 'يوم', 'quail_tnau', 'medium', {
        min: 40,
        max: 49,
        note: 'النضج الجنسي حوالي 6 أسابيع. مصادر تانية بتقول البيض ممكن يبدأ لحد 7 أسابيع.',
      }),
      template: {
        speciesId: 'quail-japanese',
        prepDays: 3,
        stages: [
          {
            id: 'prep',
            name: ar('تجهيز'),
            fromDay: -3,
            toDay: -1,
            summary: ar('تنضيف القفص أو الصندوق وتجهيز الدفاية.'),
          },
          {
            id: 'brooding',
            name: ar('تحضين'),
            fromDay: 0,
            toDay: 27,
            summary: ar('الكتاكيت صغيرة جداً ومحتاجة دفا عالي، والحرارة بتقل كل أسبوع.'),
          },
          {
            id: 'growing',
            name: ar('نمو'),
            fromDay: 28,
            toDay: 41,
            summary: ar('فرز الدكور من الإناث وتجهيز أقفاص البيض.'),
          },
          {
            id: 'laying',
            name: ar('أول بيض'),
            fromDay: 42,
            toDay: 60,
            summary: ar('البيض بيبدأ. علف بياض ونور كفاية.'),
          },
        ],
        tasks: [
          {
            id: 'clean',
            fromDay: -3,
            toDay: -3,
            kind: 'prep',
            daily: false,
            title: ar('نضّف وطهّر الصندوق أو القفص'),
          },
          {
            id: 'preheat',
            fromDay: -1,
            toDay: -1,
            kind: 'brooding',
            daily: false,
            title: ar('شغّل الدفاية قبل الاستلام بيوم'),
            detail: ar('وحط ترمومتر عند مستوى الكتاكيت.'),
          },
          {
            id: 'receive',
            fromDay: 0,
            toDay: 0,
            kind: 'brooding',
            daily: false,
            title: ar('استلم الكتاكيت وحط بلي في طبق المية'),
            detail: ar('علشان الكتاكيت الصغيرة ما تغرقش.'),
          },
          {
            id: 'behaviour',
            fromDay: 0,
            toDay: 27,
            kind: 'brooding',
            daily: true,
            title: ar('راقب توزيع الكتاكيت تحت الدفاية'),
            detail: ar('متكومة = بردانة. بعيدة وفاتحة بقها = حرانة.'),
          },
          {
            id: 'water',
            fromDay: 0,
            toDay: 60,
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
            title: ar('قلّل الحرارة درجتين أو تلاتة'),
            detail: ar('وكرر ده كل أسبوع لحد ما تفصل الدفاية.'),
          },
          {
            id: 'remove-guard',
            fromDay: 14,
            toDay: 14,
            kind: 'house',
            daily: false,
            title: ar('شيل حاجز التحضين وبلي السقاية'),
          },
          {
            id: 'grower',
            fromDay: 21,
            toDay: 21,
            kind: 'feed',
            daily: false,
            title: ar('حوّل من البادي للنامي'),
          },
          {
            id: 'sex',
            fromDay: 28,
            toDay: 35,
            kind: 'house',
            daily: false,
            title: ar('افرز الدكور من الإناث'),
            detail: ar('الفرز بيبان من 4–5 أسابيع. خلي دكر لكل 2 إناث لو عايز بيض مخصب.'),
          },
          {
            id: 'heat-off',
            fromDay: 35,
            toDay: 35,
            kind: 'brooding',
            daily: false,
            title: ar('افصل الدفاية لو الجو مش بارد'),
          },
          {
            id: 'layer',
            fromDay: 38,
            toDay: 41,
            kind: 'feed',
            daily: true,
            title: ar('ابدأ علف البياض تدريجياً'),
          },
          {
            id: 'light',
            fromDay: 42,
            toDay: 42,
            kind: 'house',
            daily: false,
            title: ar('خلي النور حوالي 16 ساعة في اليوم للبياض'),
          },
          {
            id: 'first-egg',
            fromDay: 42,
            toDay: 49,
            kind: 'market',
            daily: true,
            title: ar('دوّر على أول بيضة'),
            detail: ar('السمان غالباً بيبيض آخر النهار.'),
          },
        ],
        signs: [
          {
            fromDay: 0,
            toDay: 7,
            severity: 'urgent',
            text: ar('كتاكيت متكومة وبتصوصو جامد = برد. ارفع الحرارة فوراً.'),
          },
          {
            fromDay: 0,
            toDay: 14,
            severity: 'watch',
            text: ar('كتكوت مبلول أو غرقان في المية — نشّفه ودفّيه وحط بلي في السقاية.'),
          },
          {
            fromDay: 14,
            toDay: 60,
            severity: 'watch',
            text: ar('إسهال مايه أو فيه دم وطيور منفوشة — اعزلها وكلّم طبيب بيطري.'),
          },
          {
            fromDay: 28,
            toDay: 60,
            severity: 'watch',
            text: ar('طيور بتنهج وفاتحة جناحاتها = حر. هوّي المكان ووفّر مية باردة.'),
          },
          {
            fromDay: 42,
            toDay: 60,
            severity: 'info',
            text: ar('البيض بيتأخر لو النور قليل أو العلف مش علف بياض.'),
          },
        ],
      },
    },
    breeding: {
      broody: 'no',
      incubationDays: sv(17, 'يوم', 'quail_msuHatch', 'high', {
        min: 17,
        max: 18,
        note: 'من 17 لـ 18 يوم حسب السلالة والتفريخ.',
      }),
      checks: [
        {
          id: 'set',
          day: 0,
          title: ar('حط البيض في الفقاسة'),
          detail: ar('حرارة حوالي 37.8° في فقاسة بمروحة. البيض اللي ما اتخزنش أكتر من أسبوع.'),
        },
        {
          id: 'turn',
          day: 1,
          title: ar('اقلب البيض كل يوم'),
          detail: ar('من 4 لـ 6 مرات في اليوم لحد اليوم 14.'),
        },
        {
          id: 'candle',
          day: 7,
          title: ar('شمّع البيض'),
          detail: ar('قشر السمان منقط وصعب يتشمّع؛ شيل اللي واضح إنه فاضي بس.'),
        },
        {
          id: 'lockdown',
          day: 15,
          title: ar('بطّل تقلب وارفع الرطوبة'),
          detail: ar('ما تفتحش الفقاسة من هنا لحد الفقس.'),
        },
        {
          id: 'hatch',
          day: 17,
          title: ar('ميعاد الفقس'),
          detail: ar('ممكن يتأخر ليوم 18. سيب الكتاكيت تنشف جوه قبل ما تنقلها للدفاية.'),
        },
      ],
      care: [
        ar('السمان المستأنس فقد غريزة الرقاد تقريباً، فالتفريخ بيكون بفقاسة.'),
        ar('خلي دكر لكل 2 إناث. البيض المخصب بيبدأ من اليوم الرابع بعد ما تحط الدكر.'),
        ar('أحسن خصوبة من طيور عمرها 8 شهور أو أقل.'),
      ],
    },
    health: {
      vaccinations: [],
      problems: [
        st(
          'الالتهاب المعوي التقرحي (Ulcerative enteritis): السمان أكتر طير بيتصاب بيه، والطيور اللي بتخف بتفضل حاملة للمرض طول عمرها. الأقفاص السلك بتقلل العدوى من الزرق.',
          'quail_msdUE',
          'high',
        ),
        st(
          'الحر: السمان بيبدأ يتعب من 30° تقريباً. هوّي المكان وما تحطش الأقفاص في الشمس.',
          'quail_ucdHeat',
          'medium',
        ),
        st(
          'مفيش برنامج تحصين رسمي منشور للسمان المنزلي في مصر. استشير طبيب بيطري للتحصينات حسب المنطقة.',
          'quail_oke2025',
          'low',
        ),
      ],
      dangerSigns: [
        ar('نفوق مفاجئ لأكتر من طائر في يوم واحد.'),
        ar('إسهال فيه دم أو طيور قاعدة منفوشة ومش بتاكل.'),
        ar('وقف البيض فجأة عند الإناث.'),
      ],
    },
    climate: {
      bands: [
        brood(0, 6, 32, 35),
        brood(7, 13, 29, 32),
        brood(14, 20, 27, 29),
        brood(21, 27, 24, 27),
        brood(28, 34, 21, 24),
        {
          fromDay: 35,
          toDay: 3650,
          comfortMin: sv(18, C, 'quail_ucdHeat', 'medium', {
            note: 'المنطقة المريحة للسمان الياباني 18–30°.',
          }),
          comfortMax: sv(30, C, 'quail_ucdHeat', 'medium', {
            note: 'الإجهاد الحراري بيبدأ من حوالي 30°.',
          }),
          dangerLow: sv(12, C, 'quail_ucdHeat', 'low', {
            note: 'مفيش حد أدنى منشور. 12° تقدير من عندنا تحت منطقة الراحة.',
          }),
          dangerHigh: sv(34, C, 'quail_ucdHeat', 'medium', {
            min: 32,
            max: 34,
            note: 'التجارب على السمان المجهد حرارياً كانت عند 32–34°.',
          }),
          rhMax: rh,
        },
      ],
    },
    mixing: {
      okWith: [],
      avoid: [
        avoidWith(
          'chicken',
          'الفراخ ممكن تتصاب بالالتهاب المعوي التقرحي وتنقله بالزرق، والسمان أكتر طير بيتأذي منه.',
          'quail_msdUE',
          'medium',
        ),
        avoidWith(
          'turkey',
          'الرومي كمان بيتصاب بالالتهاب المعوي التقرحي، والطيور اللي بتخف بتفضل حاملة للمرض.',
          'quail_msdUE',
          'medium',
        ),
        avoidWith(
          'duck',
          'البط والطيور المائية ممكن تشيل أنفلونزا الطيور من غير ما يبان عليها.',
          'quail_msdAI',
          'medium',
        ),
        avoidWith(
          'goose',
          'الوز ممكن يشيل أنفلونزا الطيور من غير ما يبان عليه.',
          'quail_msdAI',
          'medium',
        ),
        avoidWith('pigeon', 'الحمام ممكن ينقل فيروس النيوكاسل للدواجن.', 'quail_msdND', 'medium'),
      ],
    },
    expected: {
      adultWeightKg: sv(0.14, 'كجم', 'quail_extOrg', 'high', {
        min: 0.1,
        max: 0.16,
        note: 'الدكر 100–140 جم والأنثى 120–160 جم. السلالات الجامبو 250–300 جم.',
      }),
      eggWeightG: sv(10, 'جم', 'quail_extOrg', 'high'),
      eggsPerYear: sv(250, 'بيضة', 'quail_oke2025', 'low', {
        note: 'المصدر بيقول "أكتر من 250 بيضة في دورة الإنتاج" مع رعاية كويسة، مش رقم سنوي بالظبط.',
      }),
    },
  },
]
