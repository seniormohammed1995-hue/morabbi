import type { LocalizedText, Place, SourcedValue } from './schema'
import { ar, sv } from './helpers'
import type { SourceId } from './sources'
import { SOURCES } from './sources'

/** Fraction of the full-sun heat load that reaches birds in each place (0 = none). */
const sunShare = (v: number, note: string): SourcedValue =>
  sv(v, 'نسبة من حمل الشمس', 'uaexHeat', 'low', { note })

export const WEATHER = {
  /**
   * Extra °C-equivalent per W/m² of sunshine on birds in full sun. Mader et al. (2006) add
   * 0.0068 THI units per W/m² for cattle; no poultry figure exists, so this is an estimate.
   */
  sunLoadPerWm2: sv(0.0068, '°م لكل وات/م²', 'mader2006', 'low', {
    note: 'معامل الإشعاع الشمسي من دراسة على العجول؛ مفيش رقم منشور للطيور. الشمس الكاملة (حوالي 1000 وات/م²) بتزوّد حوالي 7 درجات. تقدير.',
  }),
  placeSunShare: {
    'roof-open': sunShare(1, 'سطح مكشوف = الشمس كاملة.'),
    'roof-shaded': sunShare(
      0.5,
      'التظليل بيقلل حمل الشمس؛ المرجع بيقول إن الضل بيقلل الحرارة اللي بتوصل للطيور من الشمس من غير رقم، فأخدنا النص. تقدير.',
    ),
    room: sunShare(
      0,
      'جوه أوضة مفيش شمس مباشرة. حرارة الأوضة ممكن تختلف عن برة — استخدم الترمومتر.',
    ),
    balcony: sunShare(0.5, 'البلكونة بتاخد شمس جزء من اليوم. تقدير.'),
    yard: sunShare(
      1,
      'الحوش المكشوف = الشمس كاملة، والأرض الجرداء بتشع حرارة. لو فيه ضل كفاية اختار "سطح مظلّل".',
    ),
  } satisfies Record<Place, SourcedValue>,
  /**
   * Tao & Xin (2003) broiler index THVI = (0.85·Tdb + 0.15·Twb)·V^−0.058, with still air
   * taken as 0.2 m/s (lowest speed tested). Limits for ~90-minute exposure.
   */
  stillAirMs: sv(0.2, 'م/ث', 'taoXin2003', 'medium', {
    note: 'أقل سرعة هوا في التجربة؛ بنفترضها في الأماكن المنزلية.',
  }),
  thi: {
    alert: sv(35, 'مؤشر THVI', 'taoXin2003', 'medium', {
      note: 'حدود لفراخ تسمين بوزن البيع في تعرض حوالي 90 دقيقة؛ بنستخدمها لكل الأنواع كتقدير.',
    }),
    danger: sv(38, 'مؤشر THVI', 'taoXin2003', 'medium'),
    emergency: sv(40, 'مؤشر THVI', 'taoXin2003', 'medium'),
  },
  waterPerDegree: sv(0.065, 'زيادة لكل درجة', 'aviagenWater', 'high', {
    min: 0.06,
    max: 0.07,
    note: 'استهلاك المية بيزيد 6–7٪ لكل درجة فوق 21°م (Aviagen عن NRC 1994).',
  }),
  waterBaseC: sv(21, '°م', 'aviagenWater', 'high'),
  /** RH above 70 % sustained → wet litter (MSU). Profiles carry their own rhMax per age. */
  wetLitterRh: sv(70, '٪', 'msuLitter', 'high', {
    note: 'رطوبة فوق 70٪ بتبل الفرشة وتزوّد الأمونيا والميكروبات.',
  }),
}

export interface AlertAdvice {
  title: LocalizedText
  steps: LocalizedText[]
  why: LocalizedText
  source: string
  sourceUrl: string
}

const advice = (title: string, steps: string[], why: string, src: SourceId): AlertAdvice => ({
  title: ar(title),
  steps: steps.map(ar),
  why: ar(why),
  source: SOURCES[src].title,
  sourceUrl: SOURCES[src].url,
})

/** What to do for each weather alert. Short numbered steps + one "why" line. */
export const ALERT_ADVICE = {
  heat: advice(
    'حر شديد جاي',
    [
      'زوّد المية وحطها في الضل، وغيّرها بمية فريشة مرتين أو تلاتة.',
      'ظلّل المكان قبل الضهر: شبكة تظليل أو خيش أو كرتون فوق الطيور.',
      'افتح الشبابيك والفتحات علشان الهوا يتحرك، من غير ما يضرب على الطيور مباشرة.',
      'أكّلهم بدري الصبح أو بالليل، وقلّل الأكل وقت الحر.',
      'قلّل العدد في المكان لو مزحوم، وما تحركهمش ولا تمسكهم وقت الحر.',
    ],
    'الطيور ما بتعرقش؛ بتتخلص من الحرارة بالنهجان، ولما الحر والرطوبة يعلوا حرارة جسمها بتطلع بسرعة.',
    'uaexHeat',
  ),
  cold: advice(
    'ليلة باردة على الصغيرين',
    [
      'جهّز الدفاية قبل المغرب واتأكد إنها شغالة.',
      'اقفل تيارات الهوا من تحت ومن الجناب، وسيب فتحة فوق للتهوية.',
      'ضيّق مكان الصغيرين علشان يدفّوا بعض.',
      'بص عليهم بالليل: لو متكدسين تحت الدفاية يبقى بردانين.',
    ],
    'الكتاكيت الصغيرة ما بتقدرش تنظّم حرارتها أول أسابيع، والبرد بالليل بيقتلها أو بيعطّل نموها.',
    'osuCoop',
  ),
  humid: advice(
    'رطوبة عالية — الفرشة ممكن تتبل',
    [
      'قلّب الفرشة وشيل أي حتة مبلولة وحط مكانها ناشف.',
      'اتأكد إن السقايات مش بتسرّب.',
      'زوّد التهوية من غير تيار هوا على الطيور.',
      'لو شميت ريحة نشادر (أمونيا) يبقى لازم تغيّر الفرشة.',
    ],
    'الرطوبة العالية بتبل الفرشة، والفرشة المبلولة بتطلع أمونيا وبتكتّر الميكروبات.',
    'msuLitter',
  ),
  wind: advice(
    'رياح جامدة وتراب',
    [
      'اربط أو ثبّت العشة والسقف والشبك.',
      'غطّي الجهة اللي جاي منها الهوا بخيش أو مشمع، وسيب فتحة فوق للتهوية.',
      'غطّي الأكل والمية علشان التراب.',
      'لو العدد صغير، ممكن تدخّلهم مكان مقفول لحد ما الهوا يهدى.',
    ],
    'التيار المباشر بيبرّد الطيور ويعرّضها للبرد، والتغطية الكاملة من غير تهوية بتجمع تراب وأمونيا.',
    'osuCoop',
  ),
  rain: advice(
    'مطر متوقع',
    [
      'غطّي السقف وسد أي مكان بيخر.',
      'وجّه مية المطر بعيد عن المكان.',
      'خلي الأكل والفرشة في مكان ناشف.',
      'بعد المطر: شيل الفرشة المبلولة على طول.',
    ],
    'مية المطر لو دخلت الفرشة بتبلها، والفرشة المبلولة باب للأمراض.',
    'msuLitterGood',
  ),
} satisfies Record<'heat' | 'cold' | 'humid' | 'wind' | 'rain', AlertAdvice>
