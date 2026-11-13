/**
 * App rules: thresholds and calendars that drive alerts and advice. These are
 * product decisions (documented in DECISIONS.md), not breed performance data.
 */
export const RULES = {
  /** Egypt's hot months (May–Sep) and cool months (Dec–Feb). Others are "mild". */
  summerMonths: [5, 6, 7, 8, 9],
  winterMonths: [12, 1, 2],
  /** Alert when actual deviates from the breed standard by more than these %. */
  deviation: { weightPct: 10, feedPct: 15 },
  /** Alert when deaths in a single day exceed this % of live birds (after week 1). */
  dailyMortalityAlertPct: 0.5,
  /** Density ratio (count / max) above which the wizard shows "tight". */
  tightDensityRatio: 0.9,
  /** Minimum birds in a weighing sample for small flocks. */
  weighSampleMin: 10,
  /** Drawing assumptions for the top-down plan (sizes of drawn items, not breed data). */
  drawing: { windowWidthM: 1, padHeightM: 1.5, maxItems: 400 },
  /** Home-formula warnings: protein more than N points under target, energy under this ratio of target. */
  formulaWarn: { proteinPts: 1, energyRatio: 0.93 },
  /** Show a vaccine as "upcoming" this many days ahead. */
  vaccineSoonDays: 3,
  /** Hide symptom-guide results scoring below this (0..1). */
  symptomMinScore: 0.2,
  /** Max flock size the app supports in v1. */
  maxFlock: 5000,
} as const

export type ClimateZone = 'coast' | 'delta' | 'upper' | 'desert'

export interface Governorate {
  id: string
  name: string
  zone: ClimateZone
}

export const GOVERNORATES: Governorate[] = [
  { id: 'cairo', name: 'القاهرة', zone: 'delta' },
  { id: 'giza', name: 'الجيزة', zone: 'delta' },
  { id: 'qalyubia', name: 'القليوبية', zone: 'delta' },
  { id: 'alexandria', name: 'الإسكندرية', zone: 'coast' },
  { id: 'beheira', name: 'البحيرة', zone: 'delta' },
  { id: 'matrouh', name: 'مطروح', zone: 'coast' },
  { id: 'kafr-el-sheikh', name: 'كفر الشيخ', zone: 'coast' },
  { id: 'dakahlia', name: 'الدقهلية', zone: 'delta' },
  { id: 'damietta', name: 'دمياط', zone: 'coast' },
  { id: 'gharbia', name: 'الغربية', zone: 'delta' },
  { id: 'menoufia', name: 'المنوفية', zone: 'delta' },
  { id: 'sharqia', name: 'الشرقية', zone: 'delta' },
  { id: 'port-said', name: 'بورسعيد', zone: 'coast' },
  { id: 'ismailia', name: 'الإسماعيلية', zone: 'delta' },
  { id: 'suez', name: 'السويس', zone: 'desert' },
  { id: 'north-sinai', name: 'شمال سيناء', zone: 'coast' },
  { id: 'south-sinai', name: 'جنوب سيناء', zone: 'desert' },
  { id: 'faiyum', name: 'الفيوم', zone: 'upper' },
  { id: 'beni-suef', name: 'بني سويف', zone: 'upper' },
  { id: 'minya', name: 'المنيا', zone: 'upper' },
  { id: 'asyut', name: 'أسيوط', zone: 'upper' },
  { id: 'sohag', name: 'سوهاج', zone: 'upper' },
  { id: 'qena', name: 'قنا', zone: 'upper' },
  { id: 'luxor', name: 'الأقصر', zone: 'upper' },
  { id: 'aswan', name: 'أسوان', zone: 'upper' },
  { id: 'red-sea', name: 'البحر الأحمر', zone: 'desert' },
  { id: 'new-valley', name: 'الوادي الجديد', zone: 'desert' },
]
