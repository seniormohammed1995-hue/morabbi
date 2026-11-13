import type { LocalizedText } from './schema'
import { ar } from './helpers'

export interface Term {
  id: string
  term: LocalizedText
  meaning: LocalizedText
}

/** Egyptian poultry market terms. */
export const GLOSSARY: Term[] = [
  { id: 'badi', term: ar('بادي'), meaning: ar('علف أول مرحلة للكتاكيت الصغيرة، بروتينه عالي وبيكون فتات (كرامبل).') },
  { id: 'nami', term: ar('نامي'), meaning: ar('علف المرحلة الوسطانية بعد البادي، بيكون محبب.') },
  { id: 'nahi', term: ar('ناهي'), meaning: ar('علف آخر مرحلة قبل البيع، طاقته أعلى وبروتينه أقل.') },
  { id: 'farsha', term: ar('فرشة'), meaning: ar('المادة اللي بتتفرش على الأرض (نشارة، سرس، قش) علشان تشرب الرطوبة وتدفّي.') },
  { id: 'daffaya', term: ar('دفاية'), meaning: ar('مصدر التدفئة للكتاكيت: لمبة، دفاية غاز، أو كهربا.') },
  { id: 'saqaya', term: ar('سقاية'), meaning: ar('أداة المية: سقاية كتاكيت صغيرة، سقاية جرس، أو حلمات (نبل).') },
  { id: 'maalafa', term: ar('معلفة'), meaning: ar('أداة الأكل: صينية للكتاكيت، طبق معلق، أو معلفة طولية.') },
  { id: 'nafeq', term: ar('نافق'), meaning: ar('الطيور الميتة. لازم تتشال وتتسجل كل يوم.') },
  { id: 'anbar', term: ar('عنبر'), meaning: ar('المبنى اللي بتتربى فيه الطيور: مفتوح (تهوية طبيعية) أو مقفول (شفاطات).') },
  { id: 'tahdeen', term: ar('تحضين'), meaning: ar('أول أسبوعين تقريباً، الكتكوت بيحتاج حرارة خارجية لأنه مش بيقدر يدفّي نفسه.') },
  { id: 'tahdeen-guzei', term: ar('تحضين جزئي'), meaning: ar('تحضين الكتاكيت في جزء من المكان وتوسيعه تدريجياً لتوفير التدفئة.') },
  { id: 'fcr', term: ar('معامل التحويل (FCR)'), meaning: ar('كام كيلو علف الطائر أكله علشان يعمل كيلو وزن. كل ما يقل كل ما أحسن.') },
  { id: 'sahb', term: ar('فترة السحب'), meaning: ar('المدة اللازمة بعد آخر جرعة دوا قبل ما ينفع الطائر يتدبح ويتاكل.') },
  { id: 'tahseen', term: ar('تحصين'), meaning: ar('اللقاح اللي بيدّي الطيور مناعة ضد مرض معين.') },
  { id: 'kesb', term: ar('كسب صويا'), meaning: ar('المصدر الأساسي للبروتين في علف الدواجن.') },
  { id: 'brimix', term: ar('بريمكس'), meaning: ar('خليط فيتامينات وأملاح معدنية بيتضاف للعلف بكمية صغيرة.') },
  { id: 'sebla', term: ar('سبلة'), meaning: ar('زرق الطيور مع الفرشة بعد الدورة، بيتباع سماد.') },
  { id: 'kotkot-omr-yom', term: ar('كتكوت عمر يوم'), meaning: ar('الكتكوت يوم ما بيخرج من المفرخ ويوصل المزرعة.') },
  { id: 'ammonia', term: ar('أمونيا'), meaning: ar('غاز ريحته نفاذة طالع من الزرق المبلول، بيأذي رئة الطيور.') },
  { id: 'khalaya', term: ar('خلايا التبريد'), meaning: ar('ألواح بتتبل مية والهوا بيعدي منها فيبرد، في العنابر المقفولة.') },
  { id: 'shaffat', term: ar('شفاط'), meaning: ar('مروحة كبيرة بتطلّع الهوا من العنبر المقفول.') },
]
