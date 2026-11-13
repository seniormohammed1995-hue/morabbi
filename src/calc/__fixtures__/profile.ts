import type { BirdProfile } from '../../data/schema'
import { ar, sv } from '../../data/helpers'

const v = (n: number) => sv(n, '°م', 'hb25', 'high')
const SRC = { source: 's', sourceUrl: 'https://example.org', confidence: 'high' as const }

/** Small hand-made profile for calc tests (not app data). */
export function testProfile(over: Partial<BirdProfile> = {}): BirdProfile {
  return {
    id: 'test-bird',
    kind: 'chicken',
    name: ar('طائر اختبار'),
    description: ar('للاختبارات'),
    purposes: ['meat'],
    dataStatus: 'full',
    unit: 'birds',
    defaultAge: 0,
    housing: {
      type: ar('عشة'),
      space: [{ fromDay: 0, toDay: 3650, perM2: sv(5, 'طائر/م²', 'hb25', 'high') }],
      water: ar('مية'),
      notes: [ar('ملاحظة')],
    },
    feeding: {
      phases: [{ id: 'all', name: ar('علف'), fromDay: 0, toDay: 3650 }],
      dailyFeed: {
        points: [
          { day: 0, value: 10 },
          { day: 10, value: 110 },
        ],
        unit: 'جم',
        ...SRC,
        lastReviewed: '2026-11-13',
      },
      waterToFeed: sv(2, 'لتر/كجم', 'hb25', 'high'),
      scraps: [{ item: 'bread', verdict: 'limit', reason: ar('سبب'), ...SRC }],
      notes: [ar('ملاحظة')],
    },
    cycle: {
      endpoint: 'market',
      endpointAge: sv(35, 'يوم', 'hb25', 'high'),
      template: {
        speciesId: 'test-bird',
        prepDays: 1,
        stages: [{ id: 's', name: ar('مرحلة'), fromDay: -1, toDay: 35, summary: ar('ملخص') }],
        tasks: [{ id: 't', fromDay: 0, toDay: 0, title: ar('مهمة'), kind: 'house', daily: false }],
        signs: [],
      },
    },
    breeding: {
      broody: 'yes',
      incubationDays: sv(21, 'يوم', 'hb25', 'high'),
      checks: [{ id: 'c', day: 7, title: ar('فحص'), detail: ar('تفاصيل') }],
      care: [ar('رعاية')],
    },
    health: {
      vaccinations: [],
      problems: [{ text: ar('مشكلة'), ...SRC, lastReviewed: '2026-11-13' }],
      dangerSigns: [ar('علامة')],
    },
    climate: {
      bands: [
        {
          fromDay: 0,
          toDay: 7,
          comfortMin: v(30),
          comfortMax: v(33),
          dangerLow: v(25),
          dangerHigh: v(37),
          rhMax: sv(70, '٪', 'hb25', 'high'),
        },
        {
          fromDay: 8,
          toDay: 3650,
          comfortMin: v(18),
          comfortMax: v(26),
          dangerLow: v(5),
          dangerHigh: v(32),
          rhMax: sv(75, '٪', 'hb25', 'high'),
        },
      ],
    },
    mixing: { okWith: [], avoid: [] },
    expected: { adultWeightKg: sv(2, 'كجم', 'hb25', 'high') },
    ...over,
  }
}
