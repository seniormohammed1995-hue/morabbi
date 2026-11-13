import type { Ingredient } from './schema'
import { ar, sv } from './helpers'

const AS_FED = 'محوّلة لأساس "كما هو" من قيم المادة الجافة في Feedipedia.'
const MINERAL = 'مادة معدنية: مفيهاش بروتين ولا طاقة.'

/** Common Egyptian-market ingredients. Composition is typical; actual batches vary. */
export const INGREDIENTS: Ingredient[] = [
  {
    id: 'corn',
    name: ar('ذرة صفرا'),
    kind: 'energy',
    crudeProtein: sv(9.0, '٪', 'fpMaize', 'high', { note: `10.5٪ من المادة الجافة، جافة 85.8٪. ${AS_FED}` }),
    energy: sv(3055, 'ك.كالوري/كجم', 'fpMaize', 'medium', { note: `طاقة ممثلة AMEn للتسمين. ${AS_FED}` }),
  },
  {
    id: 'sbm44',
    name: ar('كسب صويا 44٪'),
    kind: 'protein',
    crudeProtein: sv(43.4, '٪', 'fpSbm44', 'high', { note: AS_FED }),
    energy: sv(2222, 'ك.كالوري/كجم', 'fpSbm44', 'medium', { note: AS_FED }),
  },
  {
    id: 'sbm46',
    name: ar('كسب صويا 46–48٪'),
    kind: 'protein',
    crudeProtein: sv(46.3, '٪', 'fpSbm48', 'high', { note: AS_FED }),
    energy: sv(2250, 'ك.كالوري/كجم', 'fpSbm48', 'medium', { note: AS_FED }),
  },
  {
    id: 'corn-gluten',
    name: ar('جلوتين ذرة 60٪'),
    kind: 'protein',
    crudeProtein: sv(60.5, '٪', 'fpGluten', 'high', { note: AS_FED }),
    energy: sv(3571, 'ك.كالوري/كجم', 'fpGluten', 'medium', { note: `قيمة الطاقة تقديرية في المصدر. ${AS_FED}` }),
  },
  {
    id: 'fish-meal',
    name: ar('مسحوق سمك 62٪'),
    kind: 'protein',
    crudeProtein: sv(62.6, '٪', 'fpFish', 'medium', { note: `الجودة بتختلف جداً في السوق؛ اشتري من مصدر موثوق. ${AS_FED}` }),
    energy: sv(3111, 'ك.كالوري/كجم', 'fpFish', 'medium', { note: AS_FED }),
  },
  {
    id: 'wheat-bran',
    name: ar('ردة (نخالة قمح)'),
    kind: 'byproduct',
    crudeProtein: sv(15.1, '٪', 'fpBran', 'high', { note: AS_FED }),
    energy: sv(1539, 'ك.كالوري/كجم', 'fpBran', 'low', {
      note: `قيمة الطاقة من عينتين بس (مدى واسع). الردة طاقتها قليلة ومش مناسبة بنسب عالية للتسمين. ${AS_FED}`,
    }),
  },
  {
    id: 'limestone',
    name: ar('حجر جيري (كربونات كالسيوم)'),
    kind: 'mineral',
    crudeProtein: sv(0, '٪', 'fpLimestone', 'high', { note: MINERAL }),
    energy: sv(0, 'ك.كالوري/كجم', 'fpLimestone', 'high', { note: MINERAL }),
    calcium: sv(37, '٪', 'fpLimestone', 'low', { min: 36, max: 38, note: 'صفحة المصدر تحت التحديث.' }),
  },
  {
    id: 'dcp',
    name: ar('داي كالسيوم فوسفات'),
    kind: 'mineral',
    crudeProtein: sv(0, '٪', 'fpMinerals', 'high', { note: MINERAL }),
    energy: sv(0, 'ك.كالوري/كجم', 'fpMinerals', 'high', { note: MINERAL }),
    calcium: sv(24, '٪', 'fpMinerals', 'low', { note: 'فوسفور حوالي 20٪. صفحة المصدر تحت التحديث.' }),
  },
  {
    id: 'salt',
    name: ar('ملح طعام'),
    kind: 'mineral',
    crudeProtein: sv(0, '٪', 'fpMinerals', 'high', { note: MINERAL }),
    energy: sv(0, 'ك.كالوري/كجم', 'fpMinerals', 'high', { note: MINERAL }),
  },
  {
    id: 'premix',
    name: ar('بريمكس فيتامينات وأملاح'),
    kind: 'mineral',
    crudeProtein: sv(0, '٪', 'fpMinerals', 'high', { note: 'البروتين والطاقة فيه مهملين. نسبة الإضافة حسب تعليمات الشركة على العبوة.' }),
    energy: sv(0, 'ك.كالوري/كجم', 'fpMinerals', 'high'),
  },
]

export function getIngredient(id: string): Ingredient | undefined {
  return INGREDIENTS.find((i) => i.id === id)
}
