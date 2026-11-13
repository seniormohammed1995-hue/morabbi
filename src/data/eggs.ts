import type { LocalizedText } from './schema'
import { ar } from './helpers'
import { SOURCES } from './sources'

/** "بطّلت تبيض ليه؟" — things to check when egg numbers fall. */
export const EGG_DROP_CHECKS: Array<{ id: string; title: LocalizedText; detail: LocalizedText }> = [
  {
    id: 'age',
    title: ar('العمر'),
    detail: ar('الفرخة الصغيرة لسه ما بدأتش، والكبيرة إنتاجها بيقل سنة بعد سنة. ده طبيعي.'),
  },
  {
    id: 'light',
    title: ar('النور'),
    detail: ar('في الشتا النهار بيقصر والبيض بيقل. البياض محتاجة نهار طويل حوالي ١٤–١٦ ساعة نور.'),
  },
  {
    id: 'molt',
    title: ar('القلش (تغيير الريش)'),
    detail: ar('لو الريش بيقع وبيطلع جديد، الفرخة بتريّح من البيض كام أسبوع. طبيعي.'),
  },
  {
    id: 'feed',
    title: ar('الأكل'),
    detail: ar('علف بياض فيه كالسيوم، مش عيش وبواقي بس. الأكل القليل أو الناقص بيوقف البيض.'),
  },
  { id: 'water', title: ar('المية'), detail: ar('يوم من غير مية كفاية يوقف البيض أيام.') },
  {
    id: 'heat',
    title: ar('الحر'),
    detail: ar('في الحر الطيور بتاكل أقل والبيض بيقل وقشره بيخف. ظلّل وزوّد المية.'),
  },
  {
    id: 'broody',
    title: ar('الرقاد'),
    detail: ar('الفرخة الراقدة ما بتبيضش. لو قاعدة على العش طول اليوم وبتنفش ريشها، دي راقدة.'),
  },
  {
    id: 'stress',
    title: ar('التوتر'),
    detail: ar('نقل، قطط أو فيران، دوشة، أو طيور جديدة بتوقف البيض كام يوم.'),
  },
  {
    id: 'hidden',
    title: ar('بيض مستخبي أو بيتاكل'),
    detail: ar('دوّر على عش مستخبي، وشوف لو فيه بيض مكسور (الطيور بتاكله أو فيه فيران).'),
  },
  {
    id: 'sick',
    title: ar('مرض أو طفيليات'),
    detail: ar(
      'لو فيه أعراض تانية أو البيض قل في المجموعة كلها فجأة، افتح "طائر عيان" وكلّم البيطري.',
    ),
  },
]

export const EGG_DROP_SOURCE = {
  source: SOURCES.msdBackyard.title,
  sourceUrl: SOURCES.msdBackyard.url,
  confidence: 'medium' as const,
}
