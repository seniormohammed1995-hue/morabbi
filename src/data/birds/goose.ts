import type { BirdProfile, ClimateBand, ScrapRule, SourcedValue } from '../schema'
import { ar, avoidWith, scrap, st, sv } from '../helpers'

const C = '°م'
const MARGIN =
  'حد الخطر = 3 درجات بعيد عن مدى الراحة. الهامش ده تقدير من عندنا، المصدر بيدي حرارة التحضين بس.'
const NO_ADULT =
  'مفيش رقم منشور لحرارة راحة الوز الكبير. FAO بيقول بس إن الوز بيتربى من البلاد الحارة للباردة. الرقم تقدير من عندنا.'

const rh: SourcedValue = sv(70, '٪', 'goose_faoBreeder', 'low', {
  note: 'مفيش رقم رطوبة خاص بالوز. FAO بيأكد إن الفرشة لازم تفضل ناشفة؛ 70٪ تقدير من عندنا.',
})

const band = (
  fromDay: number,
  toDay: number,
  dLow: SourcedValue,
  cMin: SourcedValue,
  cMax: SourcedValue,
  dHigh: SourcedValue,
): ClimateBand => ({
  fromDay,
  toDay,
  comfortMin: cMin,
  comfortMax: cMax,
  dangerLow: dLow,
  dangerHigh: dHigh,
  rhMax: rh,
})

const SCRAPS: ScrapRule[] = [
  scrap(
    'bread',
    'limit',
    'شوية صغيرين مبلولين. العيش بيشبّع الوز ومفيهوش اللي محتاجه.',
    'goose_ucScraps',
    'low',
  ),
  scrap(
    'moldy-food',
    'no',
    'العفن فيه سموم فطرية (أفلاتوكسين) بتموّت الطيور.',
    'goose_avTox',
    'high',
  ),
  scrap('rice-cooked', 'limit', 'كمية قليلة من غير ملح ولا سمنة.', 'goose_ucScraps', 'low'),
  scrap(
    'rice-raw',
    'limit',
    'مش سام، بس الحبوب لازم تتحدد علشان الوز ما يتخنش وياكل حشيش.',
    'goose_faoMeat',
    'low',
  ),
  scrap('pasta', 'limit', 'مسلوقة من غير صلصة وملح، كمية قليلة.', 'goose_ucScraps', 'low'),
  scrap(
    'potato-peel',
    'no',
    'قشر البطاطس والجزء الأخضر فيه مواد سامة للطيور.',
    'goose_ucScraps',
    'high',
  ),
  scrap(
    'potato-cooked',
    'limit',
    'المسلوقة من غير ملح بكمية قليلة. شيل أي جزء أخضر.',
    'goose_ucScraps',
    'low',
  ),
  scrap('greens', 'ok', 'الوز طير رعّاي والخضرة جزء طبيعي من أكله.', 'goose_faoMeat', 'high'),
  scrap('cabbage', 'ok', 'خضار ورقي مفروم، ماشي مع العلف.', 'goose_faoMeat', 'medium'),
  scrap('cucumber', 'ok', 'مفيد في الحر، قطّعه حتت.', 'goose_ucScraps', 'low'),
  scrap(
    'tomato',
    'limit',
    'الطماطم المستوية بس. ورق وعرش الطماطم سام.',
    'goose_ucScraps',
    'medium',
  ),
  scrap('carrot', 'ok', 'مبشور أو مقطع صغير.', 'goose_ucScraps', 'low'),
  scrap(
    'watermelon',
    'limit',
    'القشر والطري بكمية معقولة في الحر. شيل اللي يفضل.',
    'goose_ucScraps',
    'low',
  ),
  scrap('fruit', 'limit', 'كتسالي بس، فيها سكر.', 'goose_ucScraps', 'low'),
  scrap('citrus', 'limit', 'مفيش دليل إنه سام، بس ما تكترش.', 'goose_ucScraps', 'low'),
  scrap(
    'onion-garlic',
    'no',
    'البصل والتوم ممكن يكسروا كرات الدم في الحيوانات بكميات كبيرة.',
    'goose_msdAllium',
    'medium',
  ),
  scrap('avocado', 'no', 'الأفوكادو سام للطيور (مادة البيرسين).', 'goose_avTox', 'high'),
  scrap('chocolate', 'no', 'الشوكولاتة سامة للطيور.', 'goose_avTox', 'high'),
  scrap('coffee-tea', 'no', 'الكافيين حتى بكمية صغيرة خطر على الطيور.', 'goose_avTox', 'high'),
  scrap(
    'salty',
    'no',
    'الملح الزيادة بيعمل تسمم، والصغيرين أكتر ناس بتموت منه.',
    'goose_avTox',
    'high',
  ),
  scrap('fried', 'no', 'الطيور مش محتاجة دهون كتير. ابعد عن المقلي.', 'goose_ucScraps', 'medium'),
  scrap('sweets', 'no', 'سكر من غير فايدة.', 'goose_ucScraps', 'low'),
  scrap(
    'meat-scraps',
    'limit',
    'الوز أكله أغلبه نباتي. حتت صغيرة مطبوخة من غير ملح بس.',
    'goose_ucScraps',
    'low',
  ),
  scrap(
    'fish-scraps',
    'limit',
    'مطبوخ ومن غير ملح وكمية صغيرة. المملح ممنوع.',
    'goose_ucScraps',
    'low',
  ),
  scrap(
    'eggshell',
    'limit',
    'مسلوق ومطحون للإناث وقت البيض. الأحسن حجر جيري أو صدف مطحون.',
    'goose_faoBreeder',
    'low',
  ),
  scrap('egg-cooked', 'limit', 'مسلوق ومفروم للصغيرين أول أيام بس.', 'goose_ucScraps', 'low'),
  scrap('beans-raw', 'no', 'البقول الني فيها مواد سامة للطيور.', 'goose_ucScraps', 'high'),
  scrap('beans-cooked', 'limit', 'مطبوخ كويس ومن غير ملح، كمية صغيرة.', 'goose_ucScraps', 'low'),
  scrap(
    'grains',
    'limit',
    'الحبوب مفيدة بس تتحدد لو الوز بيرعى، علشان ياكل الحشيش.',
    'goose_faoMeat',
    'high',
  ),
  scrap(
    'clover',
    'ok',
    'البرسيم والحشيش الأخضر أساس أكل الوز وبيوفر في العلف.',
    'goose_faoMeat',
    'high',
  ),
  scrap('dates', 'limit', 'حتة صغيرة من غير نوى، فيه سكر كتير.', 'goose_ucScraps', 'low'),
]

export const GOOSE_PROFILES: BirdProfile[] = [
  {
    id: 'goose-baladi',
    kind: 'goose',
    name: ar('وز بلدي'),
    description: ar(
      'الوز البلدي المصري. بيتربى في البيوت والأرياف للحم والتفريخ، وبيعتمد كتير على الرعي والبرسيم. الوزة بترقد على بيضها كويس.',
    ),
    purposes: ['meat', 'breeding'],
    dataStatus: 'limited',
    unit: 'birds',
    defaultAge: 0,
    housing: {
      type: ar(
        'حوش أو سطح فيه مكان مسقوف ومضلل، مع حتة أرض أو حوش يرعى فيه. الوز مش محتاج بيت مقفول في الجو الحر.',
      ),
      space: [
        {
          fromDay: 0,
          toDay: 6,
          perM2: sv(17, 'طائر/م²', 'goose_faoMeat', 'high', { min: 14, max: 20 }),
        },
        {
          fromDay: 7,
          toDay: 13,
          perM2: sv(10, 'طائر/م²', 'goose_faoMeat', 'high', { min: 7, max: 14 }),
        },
        {
          fromDay: 14,
          toDay: 41,
          perM2: sv(4, 'طائر/م²', 'goose_faoMeat', 'high', {
            min: 4,
            max: 5,
            note: 'من الأسبوع التالت. على فرشة عميقة ما تزيدش عن 4 لحد 6 أسابيع.',
          }),
        },
        {
          fromDay: 42,
          toDay: 90,
          perM2: sv(4, 'طائر/م²', 'goose_faoMeat', 'high', {
            note: 'على أرضية مرفوعة (شرايح) ممكن 7.',
          }),
        },
        {
          fromDay: 91,
          toDay: 209,
          perM2: sv(3, 'طائر/م²', 'goose_faoMeat', 'high', {
            note: 'بعد 13 أسبوع على فرشة عميقة.',
          }),
        },
        {
          fromDay: 210,
          toDay: 3650,
          perM2: sv(1, 'طائر/م²', 'goose_faoBreeder', 'high', {
            note: 'وز التربية: 1 م² جوه على فرشة، أو نص متر جوه + متر في الحوش.',
          }),
        },
      ],
      birdsPerNest: sv(5, 'وزة/عش', 'goose_faoBreeder', 'high', {
        min: 5,
        max: 6,
        note: 'العش حوالي 50 سم عرض × 70 عمق × 70 ارتفاع.',
      }),
      water: ar(
        'مش لازم حوض سباحة للتزاوج. حط السقاية بعيد عن الفرشة علشان ما تتبلش، ووسّع المكان: 2 سم للصغير و5 سم للكبير.',
      ),
      notes: [
        ar(
          'الصغيرين ممكن يخرجوا يرعوا من أسبوعين لو الجو دافي ومفيش مطر، وما يتعرضوش لمطر بارد قبل 5 أسابيع.',
        ),
        ar('في البلاد الحارة سقف بسيط يضلل جزء من الحوش كفاية، المهم ضل في الرعي.'),
        ar('الأرضية المرفوعة بتسمح بضعف العدد وبتقلل الديدان.'),
      ],
    },
    feeding: {
      phases: [
        {
          id: 'starter',
          name: ar('بادي'),
          fromDay: 0,
          toDay: 20,
          crudeProtein: sv(17, '٪', 'goose_faoMeat', 'high', { min: 16, max: 18 }),
          note: ar('علف بادي على طول. الوزة الصغيرة بتاكل حوالي 2.5–2.7 كجم في أول 3 أسابيع.'),
        },
        {
          id: 'grower',
          name: ar('نامي'),
          fromDay: 21,
          toDay: 179,
          crudeProtein: sv(12, '٪', 'goose_faoMeat', 'medium', {
            min: 10,
            max: 13,
            note: 'لما يكون في رعي كويس. آخر 2–3 أسابيع قبل البيع ادي علف كامل.',
          }),
        },
        {
          id: 'breeder',
          name: ar('علف تربية'),
          fromDay: 180,
          toDay: 3650,
          crudeProtein: sv(14, '٪', 'goose_faoBreeder', 'medium', { min: 13, max: 15 }),
          note: ar('مع حجر جيري أو صدف متاح طول الوقت وقت البيض.'),
        },
      ],
      scraps: SCRAPS,
      notes: [
        ar('الرعي الكويس ممكن يوفر لحد 20٪ من العلف. الوز اللي بيرعى أكل حبوب أقل بكتير.'),
        ar('لو بيرعى، الحبوب حوالي نص كيلو لكيلو للوزة في الأسبوع.'),
        ar('حط زلط صغير (حصى): حوالي كيلو لكل 100 وزة في الأسبوع.'),
        ar('بيانات الوز البلدي المصري محدودة؛ أرقام العلف من دليل FAO للوز عموماً.'),
      ],
    },
    cycle: {
      endpoint: 'market',
      endpointAge: sv(84, 'يوم', 'goose_faoMeat', 'low', {
        min: 56,
        max: 98,
        note: 'FAO: الوز الخفيف يتباع 8–9 أسابيع والتقيل 12–14 أسبوع. الوز البلدي أخف، والسن الحقيقي بيختلف حسب الرعي.',
      }),
      template: {
        speciesId: 'goose-baladi',
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
            toDay: 20,
            summary: ar('أول 3 أسابيع الصغيرين محتاجين دفا ومكان ناشف.'),
          },
          {
            id: 'growing',
            name: ar('رعي ونمو'),
            fromDay: 21,
            toDay: 69,
            summary: ar('رعي وبرسيم مع علف نامي.'),
          },
          {
            id: 'finishing',
            name: ar('تسمين وبيع'),
            fromDay: 70,
            toDay: 98,
            summary: ar('علف كامل آخر أسابيع قبل البيع.'),
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
            title: ar('شغّل التدفئة قبل الاستلام بـ 24 ساعة'),
          },
          {
            id: 'receive',
            fromDay: 0,
            toDay: 0,
            kind: 'brooding',
            daily: false,
            title: ar('استلم الوز الصغير ونزّله جنب المية والأكل'),
          },
          {
            id: 'behaviour',
            fromDay: 0,
            toDay: 20,
            kind: 'brooding',
            daily: true,
            title: ar('راقب توزيع الصغيرين تحت الدفاية'),
          },
          {
            id: 'water',
            fromDay: 0,
            toDay: 98,
            kind: 'house',
            daily: true,
            title: ar('غيّر المية وخلي الفرشة حوالين السقاية ناشفة'),
          },
          {
            id: 'expand',
            fromDay: 7,
            toDay: 7,
            kind: 'brooding',
            daily: false,
            title: ar('وسّع المكان وقلّل الحرارة'),
          },
          {
            id: 'graze',
            fromDay: 14,
            toDay: 14,
            kind: 'feed',
            daily: false,
            title: ar('ابدأ خروج للرعي لو الجو دافي ومفيش مطر'),
          },
          {
            id: 'heat-off',
            fromDay: 21,
            toDay: 21,
            kind: 'brooding',
            daily: false,
            title: ar('افصل التدفئة إلا لو المكان أبرد من 20°'),
          },
          {
            id: 'grower',
            fromDay: 21,
            toDay: 21,
            kind: 'feed',
            daily: false,
            title: ar('حوّل للعلف النامي مع الرعي'),
          },
          {
            id: 'finish',
            fromDay: 70,
            toDay: 70,
            kind: 'feed',
            daily: false,
            title: ar('ابدأ علف كامل قبل البيع بـ 2–3 أسابيع'),
          },
          {
            id: 'market',
            fromDay: 84,
            toDay: 84,
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
            text: ar('صغيرين متكومين وبيصوصوا = برد. ارفع الحرارة.'),
          },
          {
            fromDay: 0,
            toDay: 7,
            severity: 'urgent',
            text: ar(
              'نفوق صغيرين في أول أسبوع بسرعة — ممكن مرض ديرزي (بارفو الوز). كلّم طبيب بيطري فوراً.',
            ),
          },
          {
            fromDay: 0,
            toDay: 42,
            severity: 'watch',
            text: ar('صغير بينهج أو نفَسه تقيل — ممكن فطر في الرئة من فرشة معفنة. غيّر الفرشة.'),
          },
          {
            fromDay: 21,
            toDay: 98,
            severity: 'watch',
            text: ar('إسهال أو هزال وطيور مش بتاكل — ممكن كوكسيديا. كلّم طبيب بيطري.'),
          },
        ],
      },
    },
    breeding: {
      broody: 'yes',
      incubationDays: sv(30, 'يوم', 'goose_faoIncub', 'high', {
        min: 28,
        max: 34,
        note: 'FAO: 30 يوم. جامعة ميسيسيبي: 28–34 حسب السلالة.',
      }),
      eggsPerSitting: sv(11, 'بيضة', 'goose_faoIncub', 'high', { min: 10, max: 12 }),
      checks: [
        {
          id: 'start',
          day: 0,
          title: ar('الوزة بدأت ترقد'),
          detail: ar('سيبها على آخر 10–12 بيضة بس من الموسم.'),
        },
        {
          id: 'candle-7',
          day: 7,
          title: ar('شمّع البيض'),
          detail: ar('شيل البيض الفاضي أو اللي الجنين فيه ميت.'),
        },
        {
          id: 'quiet',
          day: 20,
          title: ar('ما تزعجهاش'),
          detail: ar('خلي أكل ومية جنبها، وسيبها في مكان هادي.'),
        },
        {
          id: 'candle-27',
          day: 27,
          title: ar('شمّع تاني'),
          detail: ar('شيل أي بيضة الجنين فيها ميت.'),
        },
        {
          id: 'hatch',
          day: 30,
          title: ar('ميعاد الفقس'),
          detail: ar('ممكن يتأخر لحد 34 يوم في بعض السلالات.'),
        },
      ],
      care: [
        ar('خلي جوز لكل 4 وزات. في القطعان الصغيرة جوز أو اتنين مع 4–10 وزات.'),
        ar('لو البيض تحت فرخة: الفرخة تاخد 4–6 بيضات وز بس، ورومية 10–14، وبطة 8–10.'),
        ar('لو اللي راقدة مش بتقلب البيض كويس، اقلبه بإيدك نص لفة 2–3 مرات في اليوم.'),
        ar('ما تخزنش بيض التفريخ أكتر من 4 أيام قبل ما يترقد عليه.'),
      ],
    },
    health: {
      vaccinations: [],
      problems: [
        st(
          'مرض ديرزي (بارفو الوز): الصغيرين أقل من أسبوع ممكن يموتوا في 2–5 أيام، والبط المسكوفي ممكن يشيله.',
          'goose_faoDisease',
          'high',
        ),
        st('الكوكسيديا: بتصيب الصغيرين من حوالي 3 لـ 12 أسبوع.', 'goose_faoDisease', 'high'),
        st(
          'الفطر الرئوي (أسبرجلس): أخطر حاجة على الكتاكيت حديثة الفقس. الفرشة لازم تبقى ناشفة ونضيفة.',
          'goose_faoDisease',
          'high',
        ),
        st(
          'كوليرا الطيور: بتصيب الوز في كل الأعمار ونفوقها عالي. ابعد الوز عن الطيور التانية.',
          'goose_faoDisease',
          'high',
        ),
        st(
          'مفيش برنامج تحصين رسمي مصري منشور للوز. استشير طبيب بيطري للتحصينات حسب المنطقة.',
          'goose_faoDisease',
          'low',
        ),
      ],
      dangerSigns: [
        ar('نفوق صغيرين كتير في أول أسبوعين.'),
        ar('طيور مش قادرة تقف أو بتلف حوالين نفسها.'),
        ar('إسهال أخضر أو فيه دم.'),
        ar('صعوبة في النفس عند الصغيرين.'),
      ],
    },
    climate: {
      bands: [
        band(
          0,
          6,
          sv(29, C, 'goose_faoMeat', 'low', { note: MARGIN }),
          sv(32, C, 'goose_faoMeat', 'high', {
            note: 'آخر الأسبوع الأول 32–33° عند مستوى الطيور.',
          }),
          sv(37, C, 'goose_faoMeat', 'high', { note: 'يوم الاستلام 36–37° تحت الدفاية.' }),
          sv(40, C, 'goose_faoMeat', 'low', { note: MARGIN }),
        ),
        band(
          7,
          13,
          sv(21, C, 'goose_faoMeat', 'low', { note: MARGIN }),
          sv(24, C, 'goose_faoMeat', 'medium', { note: 'آخر الأسبوع التاني 23–25°.' }),
          sv(33, C, 'goose_faoMeat', 'medium'),
          sv(36, C, 'goose_faoMeat', 'low', { note: MARGIN }),
        ),
        band(
          14,
          20,
          sv(17, C, 'goose_faoMeat', 'low', { note: MARGIN }),
          sv(20, C, 'goose_faoMeat', 'medium', {
            note: 'بعد الأسبوع التالت مش محتاجين تدفئة إلا لو المكان أقل من 20°.',
          }),
          sv(25, C, 'goose_faoMeat', 'medium'),
          sv(30, C, 'goose_faoMeat', 'low', { note: MARGIN }),
        ),
        band(
          21,
          55,
          sv(15, C, 'goose_faoMeat', 'low', { note: NO_ADULT }),
          sv(20, C, 'goose_faoMeat', 'medium', {
            note: 'FAO: مفيش تدفئة بعد 3 أسابيع إلا لو المكان أقل من 20°.',
          }),
          sv(27, C, 'goose_faoBehaviour', 'low', { note: NO_ADULT }),
          sv(32, C, 'goose_faoBehaviour', 'low', { note: NO_ADULT }),
        ),
        band(
          56,
          3650,
          sv(0, C, 'goose_faoBehaviour', 'low', { note: NO_ADULT }),
          sv(10, C, 'goose_faoBehaviour', 'low', { note: NO_ADULT }),
          sv(27, C, 'goose_faoBehaviour', 'low', { note: NO_ADULT }),
          sv(35, C, 'goose_faoBehaviour', 'low', { note: NO_ADULT }),
        ),
      ],
    },
    mixing: {
      okWith: [],
      avoid: [
        avoidWith(
          'duck',
          'البط المسكوفي ممكن يشيل مرض ديرزي (بارفو الوز)، وفي أمراض تانية مشتركة بين الوز والبط.',
          'goose_faoDisease',
          'high',
        ),
        avoidWith(
          'chicken',
          'FAO بينصح بفصل الوز عن الطيور التانية علشان كوليرا الطيور. والفراخ مش بتستحمل الفرشة المبلولة اللي بيعملها الوز.',
          'goose_faoDisease',
          'medium',
        ),
        avoidWith(
          'turkey',
          'كوليرا الطيور بتنتقل بين الأنواع، وFAO بينصح بفصل الوز عن باقي الطيور.',
          'goose_faoDisease',
          'medium',
        ),
        avoidWith(
          'quail',
          'الوز ممكن يشيل أنفلونزا الطيور من غير ما يبان عليه.',
          'goose_msdAI',
          'medium',
        ),
        avoidWith(
          'pigeon',
          'الحمام ممكن يكون مصدر لفيروس النيوكاسل، والطيور المائية ممكن تشيله من غير أعراض.',
          'goose_msdND',
          'low',
        ),
      ],
    },
    expected: {
      adultWeightKg: sv(3.3, 'كجم', 'goose_egypt2021', 'high', {
        min: 3.2,
        max: 3.47,
        note: 'متوسط الدكور والإناث في وز كفر الشيخ والفيوم والأقصر.',
      }),
      eggsPerYear: sv(40, 'بيضة', 'goose_faoBreeder', 'low', {
        min: 30,
        max: 50,
        note: 'رقم FAO لأغلب سلالات الوز عموماً، مش للبلدي المصري بالتحديد.',
      }),
    },
  },
]
