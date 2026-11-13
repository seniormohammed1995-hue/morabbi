import type { LocalizedText } from './schema'
import { ar } from './helpers'
import type { ProductArtId } from '../ui/ProductArt'

/**
 * "سوق طيور في بيتي" — every product and link in one place. Edit here, push, done.
 *
 * A product shows in the app only when it has a `url` (your affiliate link) or `whatsapp: true`
 * (orders go to CONFIG.market.whatsapp, or CONFIG.feedbackWhatsapp when that is empty).
 * The whole market (home tile, tools link, /market) stays hidden while no product is showing
 * and CONFIG.market.vip is off — the app never shows an empty shop or a dead button.
 *
 * `price` and `popular` are yours to fill from your own sellers and orders: leave them empty /
 * false until you actually know them. Benefit texts stay practical — no health promises and no
 * numbers (hatch rates, feed savings, "more eggs") that no source backs.
 */
export type MarketCategoryId = 'heat' | 'water' | 'supplements' | 'hygiene' | 'tools' | 'chicks'

export interface MarketCategory {
  id: MarketCategoryId
  name: LocalizedText
  icon: 'fire' | 'drop' | 'medkit' | 'flock' | 'trash' | 'scale'
}

export interface MarketProduct {
  id: string
  category: MarketCategoryId
  name: LocalizedText
  benefit: LocalizedText
  /** Affiliate link (Amazon.eg, Jumia, Noon, a seller page…). Empty = no "اطلب أونلاين" button. */
  url: string
  /** Show "اطلب على واتساب" (message with the product name and the discount code). */
  whatsapp: boolean
  /** Your own approximate price text, e.g. '450 – 600 جنيه'. Empty = hidden. */
  price: string
  /** "الأكثر طلباً" badge — only when your own orders/clicks say so. */
  popular: boolean
  /** Drawing shown on the card (src/ui/ProductArt.tsx). */
  art: ProductArtId
  /** Short "useful for" chips. */
  tags: LocalizedText[]
  /**
   * "ترشيح طيور في بيتي": the app's own pick — tools the app's advice relies on (thermometer for
   * the temperature checks, scale for weekly weights and the kitchen mixes, nipples/feeder for dry
   * litter and less waste). An editorial choice, not a sales claim.
   */
  pick: boolean
}

/**
 * Amazon.eg Associates tag (the developer's account).
 * Search words checked against the live amazon.eg results on 2026-11-14: each link's first
 * results are the product named here. Products amazon.eg doesn't sell have `NOT_ON_AMAZON`
 * (no link → hidden) until you add a real seller link.
 */
export const AMAZON_TAG = 'bird0bb-21'

/** Amazon.eg search link carrying the affiliate tag. */
/** No seller link yet: the product stays hidden in the app. */
const NOT_ON_AMAZON = ''

export const amazon = (query: string): string =>
  `https://www.amazon.eg/s?k=${encodeURIComponent(query).replace(/%20/g, '+')}&tag=${AMAZON_TAG}`

export const MARKET_CATEGORIES: MarketCategory[] = [
  { id: 'heat', name: ar('التدفئة والفقس'), icon: 'fire' },
  { id: 'water', name: ar('سقايات وعلافات موفّرة'), icon: 'drop' },
  { id: 'supplements', name: ar('فيتامينات وإضافات'), icon: 'medkit' },
  { id: 'hygiene', name: ar('النضافة والفرشة'), icon: 'trash' },
  { id: 'tools', name: ar('الوزن والتجهيز والتهوية'), icon: 'scale' },
  { id: 'chicks', name: ar('كتاكيت وأعلاف من موزعين موثوقين'), icon: 'flock' },
]

const p = (
  id: string,
  category: MarketCategoryId,
  art: ProductArtId,
  tags: string[],
  pick: boolean,
  name: string,
  benefit: string,
  url: string,
): MarketProduct => ({
  id,
  category,
  art,
  tags: tags.map(ar),
  pick,
  name: ar(name),
  benefit: ar(benefit),
  url,
  whatsapp: false,
  price: '',
  popular: false,
})

export const PRODUCTS: MarketProduct[] = [
  // ---------- التدفئة والفقس ----------
  p('incubator', 'heat', 'incubator', ['تفريخ في البيت'], false,
    'فقاسة بيض ديجيتال أوتوماتيك (24–56 بيضة)',
    'بتقلّب البيض لوحدها وبتظبط الحرارة، فتفقّسي بيض طيورك في البيت من غير ما تقعدي جنبها.',
    NOT_ON_AMAZON),
  p('ceramic-lamp', 'heat', 'lamp', ['شتا', 'تحضين'], false,
    'لمبة تدفئة سيراميك (100 وات)',
    'دفا للكتاكيت في الشتا من غير نور، فبتنام كويس بالليل.',
    NOT_ON_AMAZON),
  p('red-lamp', 'heat', 'lamp', ['تحضين'], false,
    'لمبة تدفئة حمراء (انفراريد)',
    'دفا للكتاكيت والبط الصغير في التحضين. علّقيها بعيد عن الفرشة.',
    amazon('لمبة تدفئة حمراء للدواجن')),
  p('thermo-hygro', 'heat', 'thermometer', ['حر وبرد', 'تحضين'], true,
    'ترمومتر ديجيتال حرارة ورطوبة بحساس (HTC-2)',
    'تعرفي الحرارة والرطوبة عند الطيور بالظبط بدل التخمين، وتظبطي الدفاية عليه.',
    amazon('HTC-2 thermometer hygrometer')),
  p('thermostat', 'heat', 'thermostat', ['توفير كهربا'], false,
    'ثرموستات ديجيتال للدفاية (STC-1000)',
    'بيفصل الدفاية لما الجو يدفى ويشغّلها لما يبرد لوحده، فيوفّر كهربا وتعب.',
    amazon('STC-1000 thermostat')),
  p('ceramic-socket', 'heat', 'socket', ['أمان'], false,
    'دواية خزف E27 تتحمل الحرارة',
    'الدواية البلاستيك ممكن تسيح من لمبة التدفئة القوية؛ الخزف أأمن.',
    amazon('E27 ceramic lamp holder')),

  // ---------- سقايات وعلافات ----------
  p('nipples', 'water', 'nipple', ['فرشة ناشفة'], true,
    'طقم نبل شرب أوتوماتيك بالكب (10 قطع)',
    'مية نضيفة من غير ما تتدلق، فالفرشة تفضل ناشفة.',
    amazon('poultry nipple')),
  p('drinker', 'water', 'drinker', ['مية نضيفة'], false,
    'سقاية دواجن مقلوبة بيد (4 و 8 لتر)',
    'سهلة الغسيل والتعليق، والمية فيها بتفضل نضيفة أكتر من الطبق المكشوف.',
    amazon('سقاية دواجن')),
  p('feeder', 'water', 'feeder', ['توفير علف'], true,
    'علافة دواجن بشبكة مانعة للبعثرة (6 كيلو)',
    'الطيور ما تقدرش ترمي العلف على الأرض، فالشيكارة تقعد معاكي مدة أطول.',
    amazon('علافة دواجن')),
  p('float-valve', 'water', 'float', ['راحة بال'], false,
    'عوامة مية (محبس عوامة)',
    'بتملى جردل أو خزان السقاية لوحدها أول ما المية تنقص.',
    amazon('float valve')),
  p('chick-feeder', 'water', 'tray', ['كتاكيت'], false,
    'طبق وعلافة تحضين كتاكيت عمر يوم',
    'واطية ومقسّمة علشان الكتاكيت الصغيرة تاكل بسهولة من غير ما تقف في الأكل.',
    amazon('chick feeder tray')),
  p('pigeon-drinker', 'water', 'drinker', ['حمام', 'سمان'], false,
    'سقاية أوتوماتيك للحمام والطيور الصغيرة',
    'بتتعلّق في القفص والمية تفضل بعيد عن الزرق والريش.',
    amazon('bird waterer')),

  // ---------- فيتامينات وإضافات ----------
  p('vit-ade', 'supplements', 'bottle', ['في المية'], false,
    'فيتامينات ومعادن للطيور',
    'مكمّل فيتامينات بيتحط في المية أو العلف.',
    amazon('فيتامينات طيور')),
  p('calcium', 'supplements', 'bottle', ['بياض'], false,
    'كالسيوم ومعادن للطيور (عظم حبار وميكس معادن)',
    'للطيور اللي بتبيض، جنب العلف المتكامل.',
    amazon('calcium for birds')),
  p('toxin-binder', 'supplements', 'powder', ['تخزين العلف'], false,
    'مضاد سموم فطرية',
    'بيتخلط مع العلف، خصوصاً لو العلف بيتخزن في مكان رطب.',
    NOT_ON_AMAZON),
  p('probiotic', 'supplements', 'powder', ['أمعاء'], false,
    'بروبيوتيك للدواجن',
    'بكتيريا وخمائر نافعة للأمعاء بتتحط في المية أو العلف — شوف "خلطات من مطبخك" عن الخميرة.',
    amazon('probiotic poultry')),
  p('vit-e-se', 'supplements', 'bottle', ['في المية'], false,
    'فيتامين هـ وسيلينيوم للطيور',
    'مكمّل فيتامين هـ وسيلينيوم بيتحط في المية.',
    NOT_ON_AMAZON),
  p('electrolytes', 'supplements', 'powder', ['استقبال', 'حر'], false,
    'أملاح إماهة (إلكتروليت) للطيور',
    'بتتحط في مية الشرب يوم استقبال الكتاكيت وفي أيام الحر.',
    NOT_ON_AMAZON),

  // ---------- النضافة والفرشة ----------
  p('sprayer', 'hygiene', 'sprayer', ['تطهير'], false,
    'رشاش ضغط (2 لتر)',
    'يسهّل رش المطهر في العشة بين الدورات.',
    amazon('بخاخ ضغط 2 لتر')),
  p('slat-floor', 'hygiene', 'floor', ['بط', 'فرشة ناشفة'], false,
    'أرضيات بلاستيك شبك للعشش والبط (50×50 سم)',
    'الطيور تقف فوق الشبك بعيد عن المية المدلوقة والزرق، فرجليها تفضل ناشفة.',
    NOT_ON_AMAZON),
  p('wood-shavings', 'hygiene', 'shavings', ['فرشة'], false,
    'نشارة خشب بيضا للفرشة',
    'بتشرب الرطوبة. اختاري النوع اللي من غير تراب كتير.',
    amazon('نشارة خشب للحيوانات')),
  p('disinfectant', 'hygiene', 'bottle', ['بين الدورات'], false,
    'مطهر بيطري لتعقيم العشة',
    'لتطهير العشة والأدوات بين الدورات، على حسب التعليمات اللي على العبوة.',
    amazon('مطهر بيطري')),
  p('mite-powder', 'hygiene', 'powder', ['فاش وقمل'], false,
    'بودرة أو بخاخ ضد الفاش والقمل للطيور',
    'لمكافحة الفاش والقمل على حسب تعليمات العبوة، وبعيد عن الأكل والمية.',
    NOT_ON_AMAZON),
  p('cleaning-set', 'hygiene', 'broom', ['نضافة'], false,
    'فرش تنضيف أقفاص الطيور',
    'يسهّل لمّ الزرق وتنضيف الأركان الضيقة في الأقفاص والعشة.',
    amazon('bird cage cleaning brush')),

  // ---------- الوزن والتجهيز والتهوية ----------
  p('scale-10', 'tools', 'scale', ['وزن أسبوعي', 'خلطات'], true,
    'ميزان ديجيتال حساس (لحد 10 كيلو)',
    'توزني بيه الكتاكيت كل أسبوع وتقارني بجدول الوزن، وتوزني الخلطات بالجرام.',
    amazon('ميزان ديجيتال 10 كيلو')),
  p('scale-50', 'tools', 'hangScale', ['شكاير', 'طيور كبيرة'], false,
    'ميزان تعليق ديجيتال (لحد 50 كيلو)',
    'لوزن شكاير العلف والبط والرومي الكبير.',
    amazon('ميزان شنط ديجيتال 50 كيلو')),
  p('chopper', 'tools', 'chopper', ['بواقي البيت'], false,
    'كبة فرم يدوي',
    'تفرمي بيها بواقي الخضار والعيش الناشف بسرعة (من غير بصل — شوف "بواقي البيت").',
    amazon('manual food chopper')),
  p('timer', 'tools', 'timer', ['نور', 'شفاط'], false,
    'تايمر كهربا بفيشة (24 ساعة)',
    'يشغّل ويطفي النور أو الشفاط في مواعيد ثابتة حتى وإنتي برّه البيت.',
    amazon('تايمر كهرباء فيشة')),
  p('fan', 'tools', 'fan', ['تهوية'], false,
    'شفاط هوا صغير (6 بوصة)',
    'يطلّع ريحة النشادر والرطوبة من العشة ويدخّل هوا نضيف.',
    amazon('شفاط هواء 6 بوصة')),
  p('cage', 'tools', 'cage', ['بلكونة', 'سطح'], false,
    'قفص معدن يتطوي بدرج تنضيف',
    'للتربية في البلكونة أو السطح: الدرج بيتشال ويتنضف بسهولة.',
    amazon('pet cage cleaning drawer')),

  // ---------- كتاكيت وأعلاف (رعاة وموزعين) ----------
  // Add your local sponsors here, e.g.:
  // p('hatchery-x', 'chicks', 'tray', ['كتاكيت'], false, 'كتاكيت ساسو من مفرخ …', '…', ''),
  // then set whatsapp: true on it if orders go through WhatsApp.
]
