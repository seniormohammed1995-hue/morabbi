import type { CycleTemplate } from '../schema'
import { ar } from '../helpers'

/**
 * Broiler cycle template. Day 0 = chick placement. Task timings follow the Ross 2025
 * handbook and Cobb 2021 guide (see species data for the numbers they rely on).
 */
export const broilerWhiteCycle: CycleTemplate = {
  speciesId: 'broiler-white',
  prepDays: 14,
  stages: [
    { id: 'prep', name: ar('تطهير وتجهيز'), fromDay: -14, toDay: -1, summary: ar('تنضيف وتطهير وفترة راحة للمكان، وبعدين فرش وتسخين قبل الاستقبال.') },
    { id: 'arrival', name: ar('استقبال الكتاكيت'), fromDay: 0, toDay: 0, summary: ar('أهم يوم في الدورة: حرارة مظبوطة، مية وأكل قريبين، وكشف على الكتاكيت.') },
    { id: 'brooding', name: ar('تحضين'), fromDay: 1, toDay: 14, summary: ar('الكتكوت بيعتمد عليك في الحرارة. نوسّع المكان تدريجياً ونبدأ التحصينات.') },
    { id: 'growing', name: ar('نمو'), fromDay: 15, toDay: 24, summary: ar('نمو سريع واستهلاك علف بيزيد كل يوم. التهوية وجودة الفرشة أهم حاجة.') },
    { id: 'finishing', name: ar('تسمين وتسويق'), fromDay: 25, toDay: 56, summary: ar('علف ناهي، تهوية أكتر، متابعة الحر، وتجهيز البيع مع الالتزام بفترة السحب.') },
  ],
  tasks: [
    { id: 'clean-out', fromDay: -14, toDay: -14, kind: 'prep', daily: false, title: ar('شيل الفرشة القديمة والزرق كله'), detail: ar('بعيد عن المكان. شيل كمان المعالف والسقايات علشان تتغسل.') },
    { id: 'wash', fromDay: -13, toDay: -13, kind: 'prep', daily: false, title: ar('اغسل المكان بمية وصابون'), detail: ar('من فوق لتحت: السقف، الحيطان، الأرضية. التطهير ما بيشتغلش على مكان فيه وساخة.') },
    { id: 'disinfect', fromDay: -12, toDay: -12, kind: 'prep', daily: false, title: ar('طهّر المكان والأدوات'), detail: ar('بمطهر معتمد بالتركيز المكتوب على العبوة، وسيبه ينشف.') },
    { id: 'rodents', fromDay: -11, toDay: -11, kind: 'prep', daily: false, title: ar('سد الفتحات وكافح القوارض'), detail: ar('سلك على الشبابيك، وسد أي خرم في الحيطان.') },
    { id: 'rest', fromDay: -10, toDay: -4, kind: 'prep', daily: true, title: ar('فترة راحة للمكان مقفول ونضيف'), detail: ar('ما تدخلش حاجة للمكان. جهّز المشتريات: علف بادي، فرشة، معالف وسقايات، دفايات، ترمومتر.') },
    { id: 'equipment-check', fromDay: -3, toDay: -3, kind: 'prep', daily: false, title: ar('جرّب الدفايات والكهربا والمية'), detail: ar('اتأكد إن كل دفاية شغالة، والمية واصلة، وعندك بديل لو الكهربا قطعت.') },
    { id: 'litter-spread', fromDay: -2, toDay: -2, kind: 'litter', daily: false, title: ar('افرش الفرشة وجهّز حاجز التحضين'), detail: ar('فرشة ناشفة بالتساوي بالسُمك المناسب للموسم، وحاجز (كرتون/صاج) حوالين منطقة التحضين.') },
    { id: 'preheat', fromDay: -1, toDay: -1, kind: 'brooding', daily: false, title: ar('شغّل التدفئة قبل الاستقبال بـ 24 ساعة'), detail: ar('لازم الأرضية والفرشة تسخن مش الهوا بس. املا السقايات علشان المية تدفى.') },
    { id: 'receive', fromDay: 0, toDay: 0, kind: 'brooding', daily: false, title: ar('استلم الكتاكيت ونزّلها جنب المية والأكل'), detail: ar('عدّها، شوف شكلها (سرة مقفولة، عيون لامعة، نشيطة)، وفرّق علف على ورق تحت منطقة التحضين.') },
    { id: 'crop-check', fromDay: 1, toDay: 1, kind: 'brooding', daily: false, title: ar('افحص حوصلة الكتاكيت'), detail: ar('امسك عينة: الحوصلة لازم تكون مليانة وطرية. لو فاضية، الكتاكيت مش لاقية الأكل أو المية أو بردانة.') },
    { id: 'behaviour', fromDay: 0, toDay: 14, kind: 'brooding', daily: true, title: ar('راقب توزيع الكتاكيت تحت الدفاية'), detail: ar('مرتين على الأقل في اليوم وبالليل. التوزيع بيقولك الحرارة مظبوطة ولا لأ.') },
    { id: 'water-clean', fromDay: 0, toDay: 56, kind: 'house', daily: true, title: ar('نضّف السقايات وغيّر المية'), detail: ar('مية نضيفة دايماً. السقاية الوسخة أول باب للأمراض.') },
    { id: 'expand-1', fromDay: 4, toDay: 4, kind: 'brooding', daily: false, title: ar('وسّع منطقة التحضين'), detail: ar('سخّن الجزء الجديد قبلها. شوف المساحة المطلوبة في صفحة المخطط.') },
    { id: 'move-feeders', fromDay: 5, toDay: 5, kind: 'feed', daily: false, title: ar('ابدأ تعوّد الكتاكيت على المعالف الأساسية'), detail: ar('حط المعالف الكبيرة جنب الصواني.') },
    { id: 'remove-trays', fromDay: 7, toDay: 7, kind: 'feed', daily: false, title: ar('شيل صواني وسقايات الكتاكيت'), detail: ar('اتأكد إن الكل بيوصل للمعالف والسقايات الأساسية الأول.') },
    { id: 'expand-2', fromDay: 7, toDay: 7, kind: 'brooding', daily: false, title: ar('وسّع منطقة التحضين تاني'), detail: undefined },
    { id: 'expand-3', fromDay: 10, toDay: 10, kind: 'brooding', daily: false, title: ar('وسّع منطقة التحضين'), detail: undefined },
    { id: 'full-house', fromDay: 14, toDay: 14, kind: 'brooding', daily: false, title: ar('افتح المكان كله للطيور'), detail: ar('شيل الحواجز بعد ما تسخّن باقي المكان.') },
    { id: 'weigh-7', fromDay: 7, toDay: 7, kind: 'weigh', daily: false, title: ar('وزّن عينة (أهم وزنة في الدورة)'), detail: ar('وزن 7 أيام بيوضح نجاح التحضين. قارنه بالمستهدف.') },
    { id: 'weigh-14', fromDay: 14, toDay: 14, kind: 'weigh', daily: false, title: ar('وزّن عينة'), detail: undefined },
    { id: 'weigh-21', fromDay: 21, toDay: 21, kind: 'weigh', daily: false, title: ar('وزّن عينة'), detail: undefined },
    { id: 'weigh-28', fromDay: 28, toDay: 28, kind: 'weigh', daily: false, title: ar('وزّن عينة'), detail: undefined },
    { id: 'weigh-33', fromDay: 33, toDay: 33, kind: 'weigh', daily: false, title: ar('وزّن عينة قبل البيع'), detail: ar('علشان تتفق على السعر وتعرف الوزن المتوقع.') },
    { id: 'feed-grower', fromDay: 10, toDay: 11, kind: 'feed', daily: true, title: ar('انقل من البادي للنامي تدريجياً'), detail: ar('اخلط الاتنين يوم أو يومين علشان الطيور ما تتلخبطش.') },
    { id: 'feed-finisher', fromDay: 24, toDay: 25, kind: 'feed', daily: true, title: ar('انقل من النامي للناهي تدريجياً'), detail: ar('اخلط الاتنين يوم أو يومين.') },
    { id: 'raise-equipment', fromDay: 7, toDay: 35, kind: 'house', daily: false, title: ar('ارفع المعالف والسقايات مع كبر الطيور'), detail: ar('حافة المعلفة في مستوى ضهر الطائر.') },
    { id: 'raise-equipment-2', fromDay: 21, toDay: 21, kind: 'house', daily: false, title: ar('راجع ارتفاع المعالف والسقايات'), detail: undefined },
    { id: 'litter-check', fromDay: 8, toDay: 56, kind: 'litter', daily: true, title: ar('افحص الفرشة حوالين السقايات'), detail: ar('اقبض حفنة: لو متكتّلة شيلها وحط ناشف.') },
    { id: 'ventilation-check', fromDay: 15, toDay: 56, kind: 'house', daily: true, title: ar('راجع التهوية والريحة'), detail: ar('لو شميت أمونيا أول ما تدخل، زوّد التهوية.') },
    { id: 'dead-removal', fromDay: 0, toDay: 56, kind: 'health', daily: true, title: ar('شيل النافق وسجّله'), detail: ar('مرتين في اليوم، وتخلص منه بعيد (دفن أو حرق).') },
    { id: 'withdrawal', fromDay: 28, toDay: 28, kind: 'market', daily: false, title: ar('راجع فترة السحب لأي دوا اتستخدم'), detail: ar('لو في دوا اتدى، احسب آخر يوم ينفع فيه البيع.') },
    { id: 'market-prep', fromDay: 32, toDay: 32, kind: 'market', daily: false, title: ar('اتفق مع التاجر على ميعاد البيع'), detail: undefined },
    { id: 'pre-catch-feed', fromDay: 34, toDay: 34, kind: 'market', daily: false, title: ar('صيّم الطيور قبل التحميل'), detail: ar('ما تشيلش الأكل أكتر من 12 ساعة قبل الدبح المتوقع، والمية تفضل لحد التحميل.') },
    { id: 'market', fromDay: 35, toDay: 35, kind: 'market', daily: false, title: ar('البيع'), detail: ar('حمّل بهدوء في الوقت الأبرد من اليوم.') },
  ],
  signs: [
    { fromDay: 0, toDay: 3, severity: 'urgent', text: ar('كتاكيت متكدسة وبتصوصو بصوت عالي = برد أو جوع. اتحرك فوراً.') },
    { fromDay: 0, toDay: 7, severity: 'watch', text: ar('كتكوت مكسل، مؤخرته متلزقة، أو سرته مفتوحة — اعزله.') },
    { fromDay: 3, toDay: 14, severity: 'watch', text: ar('إسهال أبيض أو مخلوط بدم، أو ريش منفوش ونعاس — كلّم طبيب بيطري.') },
    { fromDay: 15, toDay: 56, severity: 'watch', text: ar('عطس، كحة، أو صوت خرخرة بالليل — علامة تنفسية، راجع التهوية وكلّم طبيب بيطري.') },
    { fromDay: 15, toDay: 56, severity: 'urgent', text: ar('نفوق مفاجئ عالي في يوم واحد — اعزل، بلّغ الطبيب البيطري، وما تبيعش طيور مريضة.') },
    { fromDay: 21, toDay: 56, severity: 'watch', text: ar('طيور بتنهج وجناحاتها مفتوحة = إجهاد حراري. زوّد التهوية والمية الباردة وما تأكلش في عز الحر.') },
    { fromDay: 21, toDay: 56, severity: 'watch', text: ar('طيور قاعدة كتير ومش قادرة تمشي أو بطنها منفوخة — مشاكل رجل أو استسقاء.') },
  ],
}
