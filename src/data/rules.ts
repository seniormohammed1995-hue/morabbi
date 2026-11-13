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
  /** v2 onboarding defaults when the user answers "مش عارف" (UI defaults, not breed data). */
  defaultCount: { chicken: 10, pigeon: 4, quail: 20, duck: 6, goose: 4, turkey: 4 },
  /** "Young chicks of any kind" covers the first 3 weeks. */
  chicksMaxAge: 21,
  /** Weather: refresh every 3 hours while the app is open; a manual thermometer reading wins for 6 hours. */
  weatherRefreshHours: 3,
  manualReadingHours: 6,
  /** At most this many weather alerts per day (notifications + home cards). */
  maxAlertsPerDay: 2,
  /** Heat-stress alerts must fire at least this many hours before the hot hour. */
  heatLeadHours: 6,
  /** Look-ahead windows (hours) for each weather alert. */
  alertWindowHours: { heat: 24, cold: 18, humid: 24, wind: 24, rain: 24 },
  /** Wind gusts (km/h) and rain probability (%) that trigger an alert. */
  windGustKmh: 40,
  rainProbabilityPct: 60,
  /** Egg counter: production is "down" when the last 7 days fall this % below the 7 days before. */
  eggDropPct: 25,
  /**
   * v3 reminders (app defaults the user can change, not breed data): water every N hours inside
   * the waking window, feed at fixed times, and one evening "flock news" reminder.
   */
  reminders: {
    waterEveryHours: 6,
    waterEveryOptions: [3, 4, 6, 8],
    dayStart: '06:00',
    dayEnd: '22:00',
    feedTimes: ['07:00', '17:00'],
    maxFeedTimes: 4,
    newsTime: '20:00',
  },
  /**
   * Household scraps as a share of what the birds eat in a day (weight). Product guidance asked for
   * by the owner; no published source gives a percentage (see DATA_REVIEW.md), so the UI shows it
   * as an estimate next to the sourced "what they finish in 20 minutes" rule.
   */
  scrapsShareMaxPct: { min: 25, max: 30 },
  /** Journal and feedback text limits (characters). */
  maxNoteChars: 1000,
  maxMessageChars: 1500,
  /** Cloud outbox: retry a failed send after this many minutes; give up after this many tries. */
  outboxRetryMinutes: 15,
  outboxMaxTries: 20,
} as const

export type ClimateZone = 'coast' | 'delta' | 'upper' | 'desert'

export interface Governorate {
  id: string
  name: string
  zone: ClimateZone
  /** Governorate capital (used as the weather location when GPS is off). */
  lat: number
  lon: number
}

export const GOVERNORATES: Governorate[] = [
  { id: 'cairo', name: 'القاهرة', zone: 'delta', lat: 30.044, lon: 31.236 },
  { id: 'giza', name: 'الجيزة', zone: 'delta', lat: 30.013, lon: 31.209 },
  { id: 'qalyubia', name: 'القليوبية', zone: 'delta', lat: 30.466, lon: 31.185 },
  { id: 'alexandria', name: 'الإسكندرية', zone: 'coast', lat: 31.2, lon: 29.919 },
  { id: 'beheira', name: 'البحيرة', zone: 'delta', lat: 31.034, lon: 30.468 },
  { id: 'matrouh', name: 'مطروح', zone: 'coast', lat: 31.354, lon: 27.237 },
  { id: 'kafr-el-sheikh', name: 'كفر الشيخ', zone: 'coast', lat: 31.111, lon: 30.94 },
  { id: 'dakahlia', name: 'الدقهلية', zone: 'delta', lat: 31.041, lon: 31.378 },
  { id: 'damietta', name: 'دمياط', zone: 'coast', lat: 31.417, lon: 31.814 },
  { id: 'gharbia', name: 'الغربية', zone: 'delta', lat: 30.787, lon: 31.0 },
  { id: 'menoufia', name: 'المنوفية', zone: 'delta', lat: 30.554, lon: 31.009 },
  { id: 'sharqia', name: 'الشرقية', zone: 'delta', lat: 30.587, lon: 31.502 },
  { id: 'port-said', name: 'بورسعيد', zone: 'coast', lat: 31.265, lon: 32.302 },
  { id: 'ismailia', name: 'الإسماعيلية', zone: 'delta', lat: 30.596, lon: 32.272 },
  { id: 'suez', name: 'السويس', zone: 'desert', lat: 29.967, lon: 32.55 },
  { id: 'north-sinai', name: 'شمال سيناء', zone: 'coast', lat: 31.132, lon: 33.803 },
  { id: 'south-sinai', name: 'جنوب سيناء', zone: 'desert', lat: 28.241, lon: 33.622 },
  { id: 'faiyum', name: 'الفيوم', zone: 'upper', lat: 29.308, lon: 30.842 },
  { id: 'beni-suef', name: 'بني سويف', zone: 'upper', lat: 29.074, lon: 31.097 },
  { id: 'minya', name: 'المنيا', zone: 'upper', lat: 28.109, lon: 30.75 },
  { id: 'asyut', name: 'أسيوط', zone: 'upper', lat: 27.181, lon: 31.183 },
  { id: 'sohag', name: 'سوهاج', zone: 'upper', lat: 26.556, lon: 31.695 },
  { id: 'qena', name: 'قنا', zone: 'upper', lat: 26.164, lon: 32.727 },
  { id: 'luxor', name: 'الأقصر', zone: 'upper', lat: 25.687, lon: 32.639 },
  { id: 'aswan', name: 'أسوان', zone: 'upper', lat: 24.089, lon: 32.899 },
  { id: 'red-sea', name: 'البحر الأحمر', zone: 'desert', lat: 27.257, lon: 33.812 },
  { id: 'new-valley', name: 'الوادي الجديد', zone: 'desert', lat: 25.439, lon: 30.546 },
]
