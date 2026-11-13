import type { LocalizedText, SourcedText } from './schema'
import type { ScrapId } from './scraps'
import { ar, st } from './helpers'

/**
 * "التغذية الاقتصادية وبواقي أكل البيت" — v3 guide content.
 * Verdicts for each item still come from the bird profiles (feeding.scraps); this file only says
 * which items the guide shows and how to prepare them.
 */
export interface EconomyItem {
  item: ScrapId
  /** How to prepare it at home (practical, no numbers). */
  prep: LocalizedText
}

export const ECONOMY = {
  intro: [
    ar('بواقي أكل البيت مش غلط ولا عيب — بالعكس، فكرة اقتصادية وبتوفّر في تمن العلف لو اتعملت صح.'),
    ar('السر إنها تكون تكملة جنب العلف المتكامل، مش بديل عنه. العلف فيه البروتين والكالسيوم والفيتامينات اللي البواقي ما فيهاش كفاية.'),
  ],
  /** Sourced rule from extension services: a time limit, not a percentage. */
  twentyMinutes: st(
    'إجمالي البواقي والحبوب ما يزيدش عن اللي الطيور تخلّصه في 20 دقيقة، والكتير منها بيقلل البيض.',
    'chicken_extFeeding',
    'high',
  ) satisfies SourcedText,
  /** Useful items, in the order shown. */
  useful: [
    { item: 'rice-cooked', prep: ar('مسلوق سادة من غير ملح ولا سمنة.') },
    { item: 'pasta', prep: ar('مسلوقة من غير صلصة، ومقطّعة صغيرة.') },
    { item: 'potato-cooked', prep: ar('مسلوقة ومهروسة. القشر الأخضر أو المزرّع ممنوع.') },
    { item: 'greens', prep: ar('قشر الخضار الطري والورق الأخضر — مغسول ومقطّع.') },
    { item: 'bread', prep: ar('ناشف ومنقوع في مية وبعدين مصفّى كويس — مش معجّن ومش معفّن.') },
    { item: 'eggshell', prep: ar('اغسله ونشّفه وحمّصه في الفرن شوية، واطحنه ناعم وقدّمه لوحده للبياضة.') },
  ] satisfies EconomyItem[],
  /** Always avoid. */
  avoid: ['salty', 'fried', 'moldy-food', 'potato-peel', 'onion-garlic'] satisfies ScrapId[],
  tips: [
    ar('قدّم البواقي بعد وجبة العلف مش قبلها، علشان الطيور تاكل العلف وهي جعانة.'),
    ar('اللي ما يتاكلش في نفس اليوم يتشال قبل ما يعطن أو يجيب فيران.'),
    ar('كل نوع ليه ممنوعات خاصة — دوّر على أي أكل في "ينفع أأكّلهم ده؟".'),
  ],
}
