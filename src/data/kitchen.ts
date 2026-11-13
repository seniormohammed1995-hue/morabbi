import type { BirdKind, LocalizedText, SourcedText, SourcedValue } from './schema'
import { ar, st, sv } from './helpers'

/**
 * "خلطات من مطبخك" (v3.2). Only kitchen items with a published trial and a usable dose are
 * mixes; the popular ones the research does not back are listed as "what people say" with the
 * honest verdict. Nearly all trials are on broiler chickens — `testedOn` says so.
 */
export interface KitchenMix {
  id: string
  name: LocalizedText
  /** How to prepare and give it. */
  how: SourcedText
  /** Amount, from the trial. */
  dose: SourcedValue
  /** What the trial found — and what it didn't. */
  evidence: SourcedText
  careful: SourcedText
  testedOn: BirdKind[]
}

export interface KitchenMyth {
  id: string
  name: LocalizedText
  verdict: SourcedText
}

export const KITCHEN = {
  /** Extension service: home remedies don't replace vaccination or treatment. */
  notTreatment: st(
    'مفيش بيانات بتثبت إن الأعشاب والخلطات البيتي بتعالج أمراض الطيور. التحصين والنضافة والبيطري هما الأساس.',
    'km_ncsuHerbs',
    'high',
  ),
  mixes: [
    {
      id: 'yeast',
      name: ar('خميرة في العلف'),
      how: st(
        'اخلط الخميرة الجافة كويس في العلف الناشف كل يوم، مش في المية. وزّنها بميزان المطبخ.',
        'km_yeastBroiler',
        'medium',
      ),
      dose: sv(1, 'جم لكل كيلو علف', 'km_yeastBroiler', 'low', {
        note: 'البحث استخدم خميرة حية متعايرة؛ خميرة الخبز اللي في البيت عدد الخلايا الحية فيها مختلف، فالكمية تقريبية.',
      }),
      evidence: st(
        'التسمين اللي أخد خميرة زاد وزنه وتحسّن تحويل العلف ومناعته للنيوكاسل بعد التحصين، بس النافق ما اتغيرش. وفي البياض خميرة الخبز حسّنت البيض وجودته.',
        'km_yeastBroiler',
        'medium',
      ),
      careful: st(
        'ما اتسجلش أي ضرر في الأبحاث. هي إضافة للعلف المتكامل مش بديل عنه.',
        'km_yeastLayer',
        'medium',
      ),
      testedOn: ['chicken'],
    },
    {
      id: 'vitamin-c',
      name: ar('فيتامين سي في المية وقت الحر'),
      how: st(
        'فيتامين سي (أسكوربيك أسيد) بودرة من الصيدلية، يدوب في مية الشرب في أيام الحر. الليمون نفسه ما اتجرّبش وكمية فيتامين سي فيه بتختلف، فما ينفعش نحسبه.',
        'km_vitC',
        'medium',
      ),
      dose: sv(0.2, 'جم لكل لتر مية', 'km_vitC', 'medium', {
        note: 'التجربة نفسها كانت 200 مجم لكل كيلو علف، وكمية المية دي مذكورة في نفس البحث من أبحاث تانية.',
      }),
      evidence: st(
        'في الحر، التسمين اللي أخد فيتامين سي زاد وزنه وتحسّن تحويل العلف، يعني قلّل الخسارة — بس ما منعش ضرر الحر.',
        'km_vitC',
        'medium',
      ),
      careful: st(
        'ده مكمّل جنب التهوية والضل والمية الساقعة، مش بديل عنهم.',
        'km_vitC',
        'medium',
      ),
      testedOn: ['chicken'],
    },
    {
      id: 'turmeric',
      name: ar('كركم مطحون في العلف'),
      how: st('اخلط الكركم المطحون في العلف الناشف بالتساوي.', 'km_turmeric', 'medium'),
      dose: sv(0.6, 'جم لكل كيلو علف', 'km_turmeric', 'medium', { min: 0.3, max: 0.9 }),
      evidence: st(
        'التسمين اللي أخد كركم زاد وزنه وتحسّن تحويل العلف من غير ما ياكل أكتر.',
        'km_turmeric',
        'medium',
      ),
      careful: st(
        'ما اتجرّبش أكتر من 0.9 جم لكل كيلو علف، فما تزوّدش عن كده.',
        'km_turmeric',
        'medium',
      ),
      testedOn: ['chicken'],
    },
    {
      id: 'mint',
      name: ar('نعناع ناشف مطحون في العلف'),
      how: st('نشّف النعناع واطحنه ناعم واخلطه في العلف.', 'km_mint', 'low'),
      dose: sv(4.5, 'جم لكل كيلو علف', 'km_mint', 'low', { min: 1.5, max: 6 }),
      evidence: st(
        'النعناع حسّن وزن التسمين وتحويل العلف، وأحسن نتيجة كانت من 4.5 لـ 6 جم لكل كيلو. البحث ما قاسش أي حاجة عن التنفس.',
        'km_mint',
        'low',
      ),
      careful: st(
        'مفيش دليل إنه بيعالج الكحة أو البرد — لو في كحة أو نهجان افتح "طيوري تعبانة".',
        'km_mint',
        'low',
      ),
      testedOn: ['chicken'],
    },
  ] satisfies KitchenMix[],
  myths: [
    {
      id: 'onion-garlic',
      name: ar('البصل والتوم والليمون للبرد والمناعة'),
      verdict: st(
        'مفيش بحث بيثبت إنهم بيعالجوا البرد. البصل الأخضر موّت وز وعمل له أنيميا، فبلاش بصل خالص. التوم اتجرّب بس في خلطة بودرة متعايرة جوه العلف، والكتير منها قلّل الوزن.',
        'km_onionGeese',
        'medium',
      ),
    },
    {
      id: 'molasses',
      name: ar('الخميرة والعسل الأسود لزيادة الوزن'),
      verdict: st(
        'العسل الأسود بس طاقة، ومفيش كمية آمنة متجرّبة في المية؛ 2–3% في المية قلّلت وزن التسمين، والكتير منه بيعمل زرق لزق وفرشة مبلولة. الخميرة لوحدها في العلف هي اللي ليها بحث (فوق).',
        'km_molasses',
        'low',
      ),
    },
    {
      id: 'artemisia',
      name: ar('الشيح المغلي للإسهال الأحمر (الكوكسيديا)'),
      verdict: st(
        'الشيح قلّل البويضات في بعض التجارب كإضافة وقائية في العلف، بس ما بيغنيش عن دوا الكوكسيديا. الإسهال الأحمر بيموّت الكتاكيت بسرعة: محتاج دوا كوكسيديا من البيطري على طول.',
        'km_cocciReview',
        'medium',
      ),
    },
    {
      id: 'anise',
      name: ar('النعناع والينسون للتنفس'),
      verdict: st(
        'مفيش بحث على الينسون لوحده، وخلطة كزبرة وينسون ما حسّنتش تحويل العلف. ومفيش أي دليل على التنفس للاتنين.',
        'km_anise',
        'low',
      ),
    },
    {
      id: 'black-seed',
      name: ar('الكركم وحبة البركة'),
      verdict: st(
        'الكركم ليه بحث (فوق). حبة البركة النتايج فيها متلخبطة: كُسب الحبة بعد عصر الزيت حسّن تحويل العلف شوية، والكميات الكبيرة قلّلت الأكل والوزن.',
        'km_blackSeed',
        'low',
      ),
    },
  ] satisfies KitchenMyth[],
}
