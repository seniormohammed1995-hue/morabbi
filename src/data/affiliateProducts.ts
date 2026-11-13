import type { LocalizedText } from './schema'
import { ar } from './helpers'

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
}

/** Amazon.eg Associates tag (the developer's account). */
export const AMAZON_TAG = 'bird0bb-21'

/** Amazon.eg search link carrying the affiliate tag. */
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
  name: string,
  benefit: string,
  url: string,
): MarketProduct => ({ id, category, name: ar(name), benefit: ar(benefit), url, whatsapp: false, price: '', popular: false })

export const PRODUCTS: MarketProduct[] = [
  // ---------- التدفئة والفقس ----------
  p('incubator', 'heat', 'فقاسة بيض ديجيتال أوتوماتيك (24–56 بيضة)',
    'بتقلّب البيض لوحدها وبتظبط الحرارة، فتفقّسي بيض طيورك في البيت من غير ما تقعدي جنبها.',
    amazon('فقاسة بيض اوتوماتيك')),
  p('ceramic-lamp', 'heat', 'لمبة تدفئة سيراميك (100 وات)',
    'دفا للكتاكيت في الشتا من غير نور، فبتنام كويس بالليل.',
    amazon('لمبة سيراميك حرارية')),
  p('red-lamp', 'heat', 'لمبة تدفئة حمراء (انفراريد)',
    'دفا للكتاكيت والبط الصغير في التحضين. علّقيها بعيد عن الفرشة.',
    amazon('لمبة تدفئة حمراء للدواجن')),
  p('thermo-hygro', 'heat', 'ترمومتر ديجيتال حرارة ورطوبة بحساس (HTC-2)',
    'تعرفي الحرارة والرطوبة عند الطيور بالظبط بدل التخمين، وتظبطي الدفاية عليه.',
    amazon('HTC-2 thermometer hygrometer')),
  p('thermostat', 'heat', 'ثرموستات ديجيتال للدفاية (STC-1000)',
    'بيفصل الدفاية لما الجو يدفى ويشغّلها لما يبرد لوحده، فيوفّر كهربا وتعب.',
    amazon('STC-1000 thermostat')),
  p('ceramic-socket', 'heat', 'دواية خزف تتحمل الحرارة',
    'الدواية البلاستيك ممكن تسيح من لمبة التدفئة القوية؛ الخزف أأمن.',
    amazon('دواية خزف حراري')),

  // ---------- سقايات وعلافات ----------
  p('nipples', 'water', 'طقم نبل شرب أوتوماتيك بالكب (10 قطع)',
    'مية نضيفة من غير ما تتدلق، فالفرشة تفضل ناشفة.',
    amazon('نبل سقايات دواجن')),
  p('drinker', 'water', 'سقاية دواجن مقلوبة بيد (4 و 8 لتر)',
    'سهلة الغسيل والتعليق، والمية فيها بتفضل نضيفة أكتر من الطبق المكشوف.',
    amazon('سقاية دواجن')),
  p('feeder', 'water', 'علافة دواجن بشبكة مانعة للبعثرة (6 كيلو)',
    'الطيور ما تقدرش ترمي العلف على الأرض، فالشيكارة تقعد معاكي مدة أطول.',
    amazon('علافة دواجن')),
  p('float-valve', 'water', 'عوامة مية أوتوماتيك صغيرة',
    'بتملى جردل أو خزان السقاية لوحدها أول ما المية تنقص.',
    amazon('عوامة مياه صغيرة')),
  p('chick-feeder', 'water', 'طبق وعلافة تحضين كتاكيت عمر يوم',
    'واطية ومقسّمة علشان الكتاكيت الصغيرة تاكل بسهولة من غير ما تقف في الأكل.',
    amazon('علافة تحضين كتاكيت')),
  p('pigeon-drinker', 'water', 'سقاية حمام وسمان بفتحات جانبية',
    'المية تفضل بعيد عن الزرق والريش.',
    amazon('سقاية حمام')),

  // ---------- فيتامينات وإضافات ----------
  p('vit-ade', 'supplements', 'فيتامين أ د3 هـ (AD3E) للطيور',
    'مكمّل فيتامينات بيتحط في المية أو العلف.',
    amazon('فيتامين دواجن وطيور')),
  p('calcium', 'supplements', 'كالسيوم وأملاح معدنية سائلة للطيور',
    'للطيور اللي بتبيض، جنب العلف المتكامل.',
    amazon('كالسيوم واملاح للطيور')),
  p('toxin-binder', 'supplements', 'مضاد سموم فطرية',
    'بيتخلط مع العلف، خصوصاً لو العلف بيتخزن في مكان رطب.',
    amazon('مضاد سموم فطرية دواجن')),
  p('probiotic', 'supplements', 'خميرة وبروبيوتيك بيطري',
    'بكتيريا وخمائر نافعة للأمعاء بتتحط في المية أو العلف — شوف "خلطات من مطبخك" عن الخميرة.',
    amazon('خميرة نشطة وبروبيوتيك')),
  p('vit-e-se', 'supplements', 'فيتامين هـ وسيلينيوم للطيور',
    'مكمّل فيتامين هـ وسيلينيوم بيتحط في المية.',
    amazon('فيتامين هـ سيلينيوم للطيور')),
  p('electrolytes', 'supplements', 'أملاح إماهة (إلكتروليت) للطيور',
    'بتتحط في مية الشرب يوم استقبال الكتاكيت وفي أيام الحر.',
    amazon('الكتروليت دواجن')),

  // ---------- النضافة والفرشة ----------
  p('sprayer', 'hygiene', 'رشاش ضغط (2 لتر)',
    'يسهّل رش المطهر في العشة بين الدورات.',
    amazon('بخاخ ضغط 2 لتر')),
  p('slat-floor', 'hygiene', 'أرضيات بلاستيك شبك للعشش والبط (50×50 سم)',
    'الطيور تقف فوق الشبك بعيد عن المية المدلوقة والزرق، فرجليها تفضل ناشفة.',
    amazon('ارضيات بلاستيك للدواجن')),
  p('wood-shavings', 'hygiene', 'نشارة خشب بيضا للفرشة',
    'بتشرب الرطوبة. اختاري النوع اللي من غير تراب كتير.',
    amazon('نشارة خشب للحيوانات')),
  p('disinfectant', 'hygiene', 'مطهر بيطري لتعقيم العشة',
    'لتطهير العشة والأدوات بين الدورات، على حسب التعليمات اللي على العبوة.',
    amazon('مطهر بيطري')),
  p('mite-powder', 'hygiene', 'بودرة أو بخاخ ضد الفاش والقمل للطيور',
    'لمكافحة الفاش والقمل على حسب تعليمات العبوة، وبعيد عن الأكل والمية.',
    amazon('بودرة حشرات الطيور')),
  p('cleaning-set', 'hygiene', 'طقم جاروف ومقشة لتنضيف الأقفاص',
    'يسهّل لمّ الزرق وتنضيف الأركان الضيقة في الأقفاص والعشة.',
    amazon('ادوات تنظيف اقفاص الطيور')),

  // ---------- الوزن والتجهيز والتهوية ----------
  p('scale-10', 'tools', 'ميزان ديجيتال حساس (لحد 10 كيلو)',
    'توزني بيه الكتاكيت كل أسبوع وتقارني بجدول الوزن، وتوزني الخلطات بالجرام.',
    amazon('ميزان ديجيتال 10 كيلو')),
  p('scale-50', 'tools', 'ميزان تعليق ديجيتال (لحد 50 كيلو)',
    'لوزن شكاير العلف والبط والرومي الكبير.',
    amazon('ميزان شنط ديجيتال 50 كيلو')),
  p('chopper', 'tools', 'كبة فرم خضار يدوي',
    'تفرمي بيها بواقي الخضار والعيش الناشف بسرعة (من غير بصل — شوف "بواقي البيت").',
    amazon('كبة خضروات')),
  p('timer', 'tools', 'تايمر كهربا بفيشة (24 ساعة)',
    'يشغّل ويطفي النور أو الشفاط في مواعيد ثابتة حتى وإنتي برّه البيت.',
    amazon('تايمر كهرباء فيشة')),
  p('fan', 'tools', 'شفاط هوا صغير (6 بوصة)',
    'يطلّع ريحة النشادر والرطوبة من العشة ويدخّل هوا نضيف.',
    amazon('شفاط هواء 6 بوصة')),
  p('cage', 'tools', 'قفص/بطارية تربية سلك مجلفن بدرج زرق',
    'للتربية في البلكونة أو السطح: الدرج بيتشال ويتنضف بسهولة.',
    amazon('قفص طيور كبير بدرج')),

  // ---------- كتاكيت وأعلاف (رعاة وموزعين) ----------
  // Add your local sponsors here, e.g.:
  // p('hatchery-x', 'chicks', 'كتاكيت ساسو من مفرخ …', '…', ''), then set whatsapp: true if needed.
]
