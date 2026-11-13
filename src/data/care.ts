import type { BirdKind, SourcedText } from './schema'
import { st } from './helpers'

/**
 * Text behind the repeating care reminders (v3.1): one general tip per reminder type, plus
 * a tip for a specific kind or for young birds when a source says something different for them.
 * The reminder *times* are app defaults in RULES.reminders — the sources say "water always
 * available" and "check daily / twice daily", not clock times.
 */
export type CareReminder = 'water' | 'feed' | 'temp' | 'activity' | 'eggs' | 'litter'

export interface CareTip {
  general: SourcedText
  /** Shown instead of the general tip while any group is still in its warm (brooding) age band. */
  young?: SourcedText
  byKind?: Partial<Record<BirdKind, SourcedText>>
}

export const CARE_TIPS: Record<CareReminder, CareTip> = {
  water: {
    general: st(
      'المية النضيفة لازم تفضل قدام الطيور طول اليوم. غيّرها واغسل السقاية، وفي الحر الطيور بتشرب أكتر بكتير.',
      'rossPocket2015',
      'high',
    ),
    byKind: {
      duck: st(
        'مية البط بتتوسخ بسرعة: غيّرها كذا مرة في اليوم، وحط السقاية فوق شبكة علشان الفرشة تفضل ناشفة.',
        'duck_uwCare',
        'high',
      ),
      goose: st(
        'حط سقاية الوز فوق شبكة أو سدايب علشان الفرشة ما تتبلش، وغيّر المية أول ما تتعكّر.',
        'goose_faoMeat',
        'high',
      ),
      turkey: st(
        'كتاكيت الرومي الصغيرة: حط بلي أو كور ورق فويل في السقاية والمعلفة أول أسبوعين علشان تتعلم تشرب وتاكل.',
        'psuTurkey',
        'high',
      ),
      quail: st(
        'كتاكيت السمان الصغيرة: غطّي السقاية بشبكة أو حط فيها بلي أول أسبوع لأسبوعين علشان ما تغرقش.',
        'quail_extOrg',
        'high',
      ),
    },
  },
  feed: {
    general: st(
      'حط العلف وظبّط ارتفاع المعلفة على مستوى صدر الطيور، وسيبهم يخلّصوا المعلفة مرة في اليوم قبل ما تملاها.',
      'rossPocket2015',
      'medium',
    ),
  },
  temp: {
    general: st(
      'بص على الطيور نفسها: متكوّمين على بعض يبقوا بردانين، وبينهجوا وفاردين جناحاتهم أو بعاد عن الدفاية يبقوا حرّانين.',
      'rossPocket2015',
      'high',
    ),
    young: st(
      'الصغار لسه محتاجين دفا: قيس الحرارة عند مستواهم، وأول 5 أيام مرتين في اليوم. لو متوزعين في المكان يبقى الجو مظبوط.',
      'rossPocket2015',
      'medium',
    ),
  },
  activity: {
    general: st(
      'بصّة كل يوم: الحركة والأكل والشرب، شكل الريش، الزرق، وصوت النفَس. أي طير منزوي أو نافش ريشه اعزله واسأل.',
      'rossPocket2015',
      'high',
    ),
    byKind: {
      duck: st(
        'البط الصغير (أقل من 7 أسابيع): لو لقيت موت مفاجئ أو بطة بترفس ورقبتها لورا، اعزل وكلّم البيطري فوراً.',
        'duck_msdDVH',
        'high',
      ),
      turkey: st(
        'الرومي: زرق أصفر مع جناحات مدلدلة وخمول علامة خطر (الرأس السوداء). كلّم البيطري وابعده عن الفراخ.',
        'turkey_msdBlackhead',
        'high',
      ),
      pigeon: st(
        'الحمام: لوي الرقبة أو البص لفوق مع زرق مائي علامة خطر. اعزل الطير وكلّم البيطري.',
        'pigeon_msdND',
        'high',
      ),
    },
  },
  eggs: {
    general: st(
      'لمّ البيض مرتين في اليوم على الأقل، وأغلبه بيتباض قبل الساعة 10 الصبح. في الحر الشديد أو البرد زوّد مرة تالتة.',
      'psuEggs',
      'medium',
    ),
    byKind: {
      quail: st(
        'السمان بيبيض آخر النهار (حوالي المغرب): لمّ بيضه بالليل أو أول الصبح.',
        'quail_tnau',
        'high',
      ),
    },
  },
  litter: {
    general: st(
      'امسك حفنة فرشة واعصرها: لو فضلت كورة متماسكة تبقى مبلولة — شيل المبلول خصوصاً حوالين السقاية وحط ناشف. ولو فيه ريحة نشادر هوّي المكان.',
      'ugaLitter',
      'medium',
    ),
  },
}

/** Extra line on a heat alert when a vaccination is due that day. */
export const HEAT_POSTPONE_VACCINE: SourcedText = st(
  'النهارده حر شديد: الأحسن تأجّل التحصين أو العلاج لحد ما الجو يهدى، واسأل البيطري.',
  'egyMoaSummer',
  'low',
)

/** Shown on the treatments screen: the app never suggests a withdrawal period itself. */
export const WITHDRAWAL_RULE: SourcedText = st(
  'فترة السحب هي المدة اللي لازم تعدّي بعد آخر جرعة دوا قبل ما تاكل البيض أو اللحم. خدها من المكتوب على العبوة أو من البيطري — التطبيق بيعدّ الأيام بس.',
  'msdResidues',
  'high',
)

export const CARE_TEXTS: SourcedText[] = [
  ...Object.values(CARE_TIPS).flatMap((tip) => [
    tip.general,
    ...(tip.young ? [tip.young] : []),
    ...Object.values(tip.byKind ?? {}),
  ]),
  HEAT_POSTPONE_VACCINE,
  WITHDRAWAL_RULE,
]
