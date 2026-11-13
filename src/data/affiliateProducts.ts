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
 * false until you actually know them. Benefit texts stay practical — no health promises.
 */
export type MarketCategoryId = 'heat' | 'water' | 'supplements' | 'chicks'

export interface MarketCategory {
  id: MarketCategoryId
  name: LocalizedText
  icon: 'fire' | 'drop' | 'medkit' | 'flock'
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

export const MARKET_CATEGORIES: MarketCategory[] = [
  { id: 'heat', name: ar('التدفئة والفقس'), icon: 'fire' },
  { id: 'water', name: ar('سقايات وعلافات موفّرة'), icon: 'drop' },
  { id: 'supplements', name: ar('فيتامينات وإضافات'), icon: 'medkit' },
  { id: 'chicks', name: ar('كتاكيت وأعلاف من موزعين موثوقين'), icon: 'flock' },
]

export const PRODUCTS: MarketProduct[] = [
  // ---------- التدفئة والفقس ----------
  {
    id: 'incubator',
    category: 'heat',
    name: ar('فقاسة بيض منزلية ديجيتال أوتوماتيك'),
    benefit: ar('بتقلّب البيض لوحدها وبتظبط الحرارة، فتفقّسي بيض طيورك في البيت من غير ما تقعدي جنبها.'),
    url: '',
    whatsapp: false,
    price: '',
    popular: false,
  },
  {
    id: 'heat-lamp',
    category: 'heat',
    name: ar('لمبة تدفئة حمراء أو سيراميك'),
    benefit: ar('دفا للكتاكيت الصغيرة في الشتا. السيراميك ما بتنورش فالكتاكيت بتنام كويس بالليل.'),
    url: '',
    whatsapp: false,
    price: '',
    popular: false,
  },
  {
    id: 'thermo-hygro',
    category: 'heat',
    name: ar('ترمومتر ديجيتال للحرارة والرطوبة'),
    benefit: ar('تعرفي الحرارة والرطوبة عند الطيور بالظبط بدل التخمين، وتظبطي الدفاية عليه.'),
    url: '',
    whatsapp: false,
    price: '',
    popular: false,
  },

  // ---------- سقايات وعلافات ----------
  {
    id: 'auto-drinker',
    category: 'water',
    name: ar('سقاية أوتوماتيك (نبل أو جرس)'),
    benefit: ar('مية نضيفة طول اليوم ومن غير ما الفرشة تتبل، وتريّحك من الملا كل شوية.'),
    url: '',
    whatsapp: false,
    price: '',
    popular: false,
  },
  {
    id: 'feeder',
    category: 'water',
    name: ar('علافة صاج أو بلاستيك مانعة للبعثرة'),
    benefit: ar('الطيور ما تقدرش ترمي العلف على الأرض، فالشيكارة تقعد معاكي مدة أطول.'),
    url: '',
    whatsapp: false,
    price: '',
    popular: false,
  },

  // ---------- فيتامينات وإضافات ----------
  {
    id: 'vit-ade',
    category: 'supplements',
    name: ar('فيتامين أ د3 هـ'),
    benefit: ar('مكمّل فيتامينات بيتحط في المية أو العلف، خصوصاً وقت الحر والتحصين والتعب.'),
    url: '',
    whatsapp: false,
    price: '',
    popular: false,
  },
  {
    id: 'minerals-calcium',
    category: 'supplements',
    name: ar('أملاح معدنية وكالسيوم للبياض'),
    benefit: ar('للفراخ اللي بتبيض: بيساعد إن قشرة البيض تفضل ناشفة وسليمة.'),
    url: '',
    whatsapp: false,
    price: '',
    popular: false,
  },
  {
    id: 'toxin-binder',
    category: 'supplements',
    name: ar('مضاد سموم فطرية'),
    benefit: ar('بيتخلط مع العلف علشان يقلل ضرر الفطريات لو العلف اتخزن في مكان رطب.'),
    url: '',
    whatsapp: false,
    price: '',
    popular: false,
  },
  {
    id: 'probiotic',
    category: 'supplements',
    name: ar('بروبيوتيك وخمائر بيطرية'),
    benefit: ar('بكتيريا وخمائر نافعة للأمعاء بتتحط في المية أو العلف.'),
    url: '',
    whatsapp: false,
    price: '',
    popular: false,
  },

  // ---------- كتاكيت وأعلاف (رعاة وموزعين) ----------
  // Add your local sponsors here, e.g.:
  // { id: 'hatchery-x', category: 'chicks', name: ar('كتاكيت ساسو من مفرخ …'), benefit: ar('…'),
  //   url: '', whatsapp: true, price: '', popular: false },
]
