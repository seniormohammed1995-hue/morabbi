import type { LocalizedText } from './schema'
import { ar } from './helpers'
import { SOURCES, type SourceId } from './sources'

interface Sourced {
  text: LocalizedText
  source: string
  sourceUrl: string
}

const s = (text: string, src: SourceId): Sourced => ({
  text: ar(text),
  source: SOURCES[src].title,
  sourceUrl: SOURCES[src].url,
})

/**
 * "طائر عيان دلوقتي": first aid without diagnosis, drug names or doses.
 * Each step and sign carries its source.
 */
export const SICK = {
  steps: [
    s(
      'اعزله فوراً: حطه لوحده في قفص أو كرتونة بعيد عن الباقيين، ويبقى مكانه في آخر البيت مش جنبهم.',
      'faoBiosecurity',
    ),
    s('دفّيه: مكان هادي ودافي من غير تيار هوا، وبعيد عن الشمس المباشرة.', 'msdBackyard'),
    s('حط جنبه مية نضيفة وأكل سهل، وما تغصبوش ياكل أو يشرب.', 'msdBackyard'),
    s(
      'اغسل إيدك بالصابون بعد ما تلمسه، وخلي رعاية العيان آخر حاجة بعد ما تخلص على الباقيين.',
      'faoBiosecurity',
    ),
    s('ما تديهوش أي دوا من عندك. اكتب اللي شايفه وكلّم دكتور بيطري.', 'msdBackyard'),
    s(
      'لو طائر مات: ما ترميهوش في الزبالة ولا الترعة. حطه في كيس مقفول بعيد عن الطيور واسأل البيطري.',
      'faoBiosecurity',
    ),
  ],
  /** What to watch and write down for the vet. */
  watch: [
    ar('بياكل وبيشرب؟'),
    ar('شكل الزرق ولونه (فيه مية، أخضر، فيه دم؟)'),
    ar('بيتنفس بصعوبة أو بيطلع صوت؟'),
    ar('عينه أو مناخيره فيها إفرازات؟'),
    ar('مشيته ووقفته، وبيقدر يقف ولا لأ؟'),
    ar('كام طائر تعبان، ومن إمتى؟'),
    ar('البيض قل أو شكله اتغير؟'),
  ],
  /** Signs that mean "call the vet now". */
  vetNow: [
    s('موت أكتر من طائر في يوم أو يومين، أو موت مفاجئ من غير أعراض.', 'msdAI'),
    s('صعوبة شديدة في التنفس أو تنفس بصوت أو كحة.', 'msdNewcastle'),
    s('تورم في الراس أو الوش، أو عرف ودلايات لونها أزرق أو بنفسجي.', 'msdAI'),
    s('رعشة، لف في الرقبة، مشي في دواير، أو شلل في الرجل أو الجناح.', 'msdNewcastle'),
    s('إسهال أخضر أو مائي في أكتر من طائر.', 'msdNewcastle'),
    s('وقوف مفاجئ في الأكل والشرب أو البيض في المجموعة كلها.', 'msdAI'),
  ],
  /** Newcastle and avian influenza must be reported. */
  report: s(
    'لو فيه موت كتير مفاجئ أو أعراض عصبية أو تورم في الراس: ما تبيعش ولا تنقل ولا تدبح أي طائر، وبلّغ الطبيب البيطري أو الوحدة البيطرية فوراً.',
    'faoBiosecurity',
  ),
} as const
