import type { LocalizedText } from './schema'
import { ar } from './helpers'

/**
 * Household leftovers people commonly ask about. Verdicts live in each bird profile
 * (feeding.scraps) with a reason and a source; this file is only the searchable catalogue.
 */
export interface ScrapItem {
  id: string
  name: LocalizedText
  /** Other spellings / colloquial names used in search. */
  aliases: string[]
}

const item = (id: string, name: string, aliases: string[] = []): ScrapItem => ({
  id,
  name: ar(name),
  aliases,
})

export const SCRAP_ITEMS = [
  item('bread', 'عيش ناشف أو طري', ['عيش', 'خبز', 'عيش بلدي', 'عيش فينو', 'كسر عيش']),
  item('moldy-food', 'أكل أو عيش معفّن', ['عفن', 'معفن', 'عيش معفن', 'أكل بايظ', 'بايظ']),
  item('rice-cooked', 'رز مطبوخ', ['رز', 'أرز']),
  item('rice-raw', 'رز ني', ['رز ني', 'أرز ني']),
  item('pasta', 'مكرونة مسلوقة', ['مكرونة', 'مكرونه']),
  item('potato-peel', 'قشر بطاطس ني', ['قشر بطاطس', 'بطاطس ني', 'بطاطس خضرا']),
  item('potato-cooked', 'بطاطس مسلوقة', ['بطاطس', 'بطاطس مسلوقة']),
  item('greens', 'خس وجرجير وخضرة ورقية', [
    'خس',
    'جرجير',
    'بقدونس',
    'شبت',
    'كزبرة',
    'سبانخ',
    'ملوخية',
    'خضرة',
  ]),
  item('cabbage', 'كرنب', ['كرنب', 'ملفوف']),
  item('cucumber', 'خيار', ['خيار', 'قشر خيار']),
  item('tomato', 'طماطم', ['طماطم', 'قوطة']),
  item('carrot', 'جزر', ['جزر', 'قشر جزر']),
  item('watermelon', 'بطيخ وقشره', ['بطيخ', 'قشر بطيخ', 'كانتلوب', 'شمام']),
  item('fruit', 'فاكهة (تفاح، موز، عنب)', ['تفاح', 'موز', 'عنب', 'فاكهة', 'قشر موز']),
  item('citrus', 'قشر برتقال أو يوسفي أو ليمون', [
    'برتقال',
    'يوسفي',
    'ليمون',
    'قشر برتقال',
    'موالح',
  ]),
  item('onion-garlic', 'بصل وتوم', ['بصل', 'توم', 'ثوم', 'قشر بصل']),
  item('avocado', 'أفوكادو', ['افوكادو', 'أفوكادو']),
  item('chocolate', 'شوكولاتة', ['شيكولاتة', 'شوكولاته', 'كاكاو']),
  item('coffee-tea', 'تفل شاي أو قهوة', ['شاي', 'قهوة', 'تفل']),
  item('salty', 'أكل مالح (مش، جبنة قديمة، مخلل، شيبسي)', [
    'مش',
    'جبنة',
    'مخلل',
    'شيبسي',
    'ملح',
    'فسيخ',
    'رنجة',
  ]),
  item('fried', 'أكل مقلي أو فيه زيت كتير', ['مقلي', 'زيت', 'فلافل', 'طعمية']),
  item('sweets', 'حلويات وسكر', ['حلويات', 'سكر', 'كيك', 'بسكويت', 'عسل']),
  item('meat-scraps', 'بواقي لحمة أو فراخ مطبوخة', ['لحمة', 'فراخ', 'عضم', 'جلد فراخ']),
  item('fish-scraps', 'بواقي سمك', ['سمك', 'جمبري']),
  item('eggshell', 'قشر البيض', ['قشر بيض', 'قشر البيض']),
  item('egg-cooked', 'بيض مسلوق', ['بيض', 'بيض مسلوق']),
  item('beans-raw', 'فول أو فاصوليا ناشفة ني', [
    'فول ناشف',
    'فاصوليا ناشفة',
    'لوبيا ناشفة',
    'فول ني',
  ]),
  item('beans-cooked', 'فول مدمس أو عدس مطبوخ', ['فول', 'فول مدمس', 'عدس', 'بليلة']),
  item('grains', 'ذرة أو قمح أو شعير', ['ذرة', 'درة', 'قمح', 'شعير', 'حبوب']),
  item('clover', 'برسيم وحشايش خضرا', ['برسيم', 'حشيش', 'نجيل', 'عشب']),
  item('dates', 'بلح', ['بلح', 'تمر']),
] as const satisfies readonly ScrapItem[]

export type ScrapId = (typeof SCRAP_ITEMS)[number]['id']
