import { describe, expect, it } from 'vitest'
import { broilerWhite as sp } from '../data/species/broiler-white'
import { broilerWhiteCycle as tpl } from '../data/cycles/broiler-white.cycle'
import { valueAt, stepAt } from './interp'
import { addDays, ageOn, daysBetween } from './dates'
import {
  broodingArea,
  broodingSchedule,
  density,
  equipment,
  heaterPlan,
  litterVolumeM3,
  marketWeightKg,
  seasonForDate,
  valueAtWeight,
  ventilation,
} from './planner'
import { cycleFeed, dailyFeedG, feedPhaseAt } from './feed'
import { cycleDays, dayPlan } from './cycle'
import { flockMetrics, type LogLike } from './metrics'
import { computeLayout, gridPoints } from './layout'

describe('interp', () => {
  it('returns exact points and interpolates between them', () => {
    expect(valueAt(sp.growth.bodyWeight, 7).value).toBe(213)
    expect(valueAt(sp.environment.temperature, 0).value).toBe(30)
    expect(valueAt(sp.environment.temperature, 1.5).value).toBeCloseTo(29)
  })
  it('clamps outside the table', () => {
    expect(valueAt(sp.environment.temperature, 60).value).toBe(20)
    expect(valueAt(sp.environment.temperature, -3).value).toBe(30)
  })
  it('interpolates min/max ranges', () => {
    const rh = valueAt(sp.environment.humidity, 0)
    expect(rh).toEqual({ value: 65, min: 60, max: 70 })
  })
  it('stepAt holds the previous value', () => {
    expect(stepAt(sp.environment.lightHours, 0)).toBe(23)
    expect(stepAt(sp.environment.lightHours, 4)).toBe(21)
    expect(stepAt(sp.environment.lightHours, 30)).toBe(19)
  })
})

describe('dates', () => {
  it('computes age and day differences across months', () => {
    expect(daysBetween('2026-01-30', '2026-02-02')).toBe(3)
    expect(ageOn('2026-11-01', '2026-11-01')).toBe(0)
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
  })
  it('detects seasons', () => {
    expect(seasonForDate('2026-07-15')).toBe('summer')
    expect(seasonForDate('2026-01-10')).toBe('winter')
    expect(seasonForDate('2026-03-10')).toBe('mild')
  })
})

describe('density', () => {
  it('computes capacity from kg/m² and market weight', () => {
    const w = marketWeightKg(sp)
    expect(w).toBeCloseTo(2.296)
    const r = density(sp, { houseType: 'closed', season: 'mild', areaM2: 100, count: 1000 })
    expect(r.maxKgPerM2).toBe(30)
    expect(r.maxBirds).toBe(Math.floor((100 * 30) / 2.296))
    expect(r.status).toBe('ok')
  })
  it('reduces open-house density in summer but not closed houses', () => {
    const open = density(sp, { houseType: 'roof', season: 'summer', areaM2: 20, count: 100 })
    expect(open.maxKgPerM2).toBeCloseTo(20 * 0.75)
    const closed = density(sp, { houseType: 'closed', season: 'summer', areaM2: 20, count: 100 })
    expect(closed.maxKgPerM2).toBe(30)
  })
  it('flags over-capacity and gives required area', () => {
    const r = density(sp, { houseType: 'room', season: 'winter', areaM2: 10, count: 200 })
    expect(r.status).toBe('over')
    expect(r.requiredAreaM2).toBeCloseTo((200 * 2.296) / 20)
  })
  it('flags tight when above the tight ratio', () => {
    const max = density(sp, { houseType: 'room', season: 'mild', areaM2: 10, count: 1 }).maxBirds
    expect(density(sp, { houseType: 'room', season: 'mild', areaM2: 10, count: max }).status).toBe('tight')
  })
})

describe('brooding & heating', () => {
  it('sizes the brooding area by chick density', () => {
    const b = broodingArea(sp, 500, 0, 100)
    expect(b.areaM2).toBeCloseTo(10)
    expect(b.full).toBe(false)
    expect(broodingArea(sp, 500, 14, 100).full).toBe(true)
  })
  it('caps brooding at the whole floor', () => {
    expect(broodingArea(sp, 1000, 0, 5).areaM2).toBe(5)
  })
  it('produces an expanding schedule ending in full house', () => {
    const s = broodingSchedule(sp, 1000, 200)
    expect(s.map((x) => x.day)).toEqual([0, 4, 7, 10, 14])
    for (let i = 1; i < s.length; i++) expect(s[i]!.areaM2).toBeGreaterThan(s[i - 1]!.areaM2)
    expect(s.at(-1)!.full).toBe(true)
  })
  it('picks heat lamps for small flocks and gas brooders for large ones', () => {
    const small = heaterPlan(sp, 120)
    expect(small.heater.id).toBe('heat-lamp')
    expect(small.count).toBe(2)
    const big = heaterPlan(sp, 2500)
    expect(big.heater.id).toBe('gas-brooder')
    expect(big.count).toBe(3)
  })
})

describe('ventilation & equipment', () => {
  it('interpolates the per-bird minimum ventilation table', () => {
    expect(valueAtWeight(sp.ventilation.minPerBird, 1)).toBe(0.86)
    expect(valueAtWeight(sp.ventilation.minPerBird, 1.1)).toBeCloseTo(0.925)
  })
  it('scales minimum ventilation with birds and uses tunnel speed for maximum', () => {
    const v = ventilation(sp, 1000, 21, 100, 12 * 3)
    expect(v.minM3h).toBeCloseTo(1000 * valueAtWeight(sp.ventilation.minPerBird, 1.012))
    expect(v.maxM3h).toBeCloseTo(36 * 3 * 3600)
    expect(v.fans).toBe(Math.ceil(v.maxM3h / 35000))
    expect(v.windowAreaM2).toBeCloseTo(10)
  })
  it('counts feeders and drinkers', () => {
    const e0 = equipment(sp, 500, 0)
    expect(e0.supplementary).toBe(true)
    expect(e0.chickTrays).toBe(5)
    expect(e0.chickDrinkers).toBe(Math.ceil(500 / 83))
    const e20 = equipment(sp, 500, 20)
    expect(e20.supplementary).toBe(false)
    expect(e20.panFeeders).toBe(Math.ceil(500 / 55))
    expect(e20.nipples).toBe(42)
    expect(e20.troughM).toBeCloseTo(12.5)
  })
  it('computes litter volume', () => {
    expect(litterVolumeM3(50, 4)).toBeCloseTo(2)
  })
})

describe('feed', () => {
  it('finds the phase for each day', () => {
    expect(feedPhaseAt(sp, 0).id).toBe('starter')
    expect(feedPhaseAt(sp, 11).id).toBe('grower')
    expect(feedPhaseAt(sp, 35).id).toBe('finisher')
  })
  it('sums cycle feed to the cumulative standard with no mortality', () => {
    const f = cycleFeed(sp, 1, 35)
    // Daily intake for days 0..34 sums to the guide's cumulative intake at day 35 (±rounding).
    expect(Math.abs(f.totalKg * 1000 - 3211)).toBeLessThan(5)
    expect(f.byPhase.map((p) => p.phase.id)).toEqual(['starter', 'grower', 'finisher'])
  })
  it('converts to bags and accounts for mortality', () => {
    const f = cycleFeed(sp, 1000, 35)
    expect(f.bags).toBe(f.byPhase.reduce((s, p) => s + Math.ceil(p.kg / 50), 0))
    expect(cycleFeed(sp, 1000, 35, 5).totalKg).toBeLessThan(f.totalKg)
  })
  it('daily feed matches the table', () => {
    expect(dailyFeedG(sp, 21)).toBe(111)
  })
})

describe('cycle', () => {
  it('spans prep days through market age', () => {
    const days = cycleDays(sp, tpl)
    expect(days[0]).toBe(-14)
    expect(days.at(-1)).toBe(35)
  })
  it('builds a prep day with tasks and no targets', () => {
    const p = dayPlan(sp, tpl, -1, 100)
    expect(p.isPrep).toBe(true)
    expect(p.tasks.some((t) => t.id === 'preheat')).toBe(true)
    expect(p.temperature).toBeUndefined()
  })
  it('builds a full day plan with feed, water and vaccines', () => {
    const p = dayPlan(sp, tpl, 10, 1000, 100)
    expect(p.stage?.id).toBe('brooding')
    expect(p.feedKgFlock).toBeCloseTo(52)
    expect(p.waterLFlock).toBeCloseTo(52 * 1.7)
    expect(p.vaccinations.map((v) => v.id)).toEqual(['h5-nd-killed'])
    expect(p.targetWeightG?.value).toBe(330)
    expect(p.tasks.some((t) => t.id === 'feed-grower')).toBe(true)
  })
})

describe('metrics', () => {
  const logs: LogLike[] = Array.from({ length: 8 }, (_, d) => ({
    date: `2026-11-${String(d + 1).padStart(2, '0')}`,
    age: d,
    deaths: d === 0 ? 2 : 1,
    culls: 0,
    feedKg: (dailyFeedG(sp, d) * 100) / 1000,
    ...(d === 7 ? { sampleWeightG: 213 } : {}),
  }))

  it('computes alive, mortality, feed and FCR', () => {
    const m = flockMetrics(sp, 100, logs, 8)
    expect(m.deaths).toBe(9)
    expect(m.alive).toBe(91)
    expect(m.mortalityPct).toBeCloseTo(9)
    expect(m.avgWeightG).toBe(213)
    const feed = logs.reduce((s, l) => s + l.feedKg, 0)
    expect(m.fcr).toBeCloseTo(feed / ((91 * 213) / 1000))
    expect(m.weightDeviationPct).toBeCloseTo(0)
  })
  it('raises a weight-low alert and a missing-log alert', () => {
    const light = logs.map((l) => (l.age === 7 ? { ...l, sampleWeightG: 160 } : l))
    const m = flockMetrics(sp, 100, light, 10)
    const kinds = m.alerts.map((a) => a.kind)
    expect(kinds).toContain('weightLow')
    expect(kinds).toContain('firstWeek')
    expect(kinds).toContain('noLog')
  })
  it('raises a daily mortality alert after week one', () => {
    const late: LogLike[] = [{ date: '2026-11-20', age: 10, deaths: 5, culls: 0, feedKg: 4.8 }]
    expect(flockMetrics(sp, 100, late, 10).alerts.map((a) => a.kind)).toContain('mortalityDay')
  })
  it('handles an empty log list', () => {
    const m = flockMetrics(sp, 100, [], 0)
    expect(m.alive).toBe(100)
    expect(m.alerts).toEqual([])
  })
})

describe('layout', () => {
  it('spreads grid points inside the rectangle', () => {
    const pts = gridPoints({ x: 0, y: 0, w: 10, h: 5 }, 8)
    expect(pts).toHaveLength(8)
    for (const p of pts) {
      expect(p.x).toBeGreaterThan(0)
      expect(p.x).toBeLessThan(10)
      expect(p.y).toBeGreaterThan(0)
      expect(p.y).toBeLessThan(5)
    }
  })
  it('places brooding, heaters and equipment for a roof flock', () => {
    const l = computeLayout(sp, { length: 6, width: 4, height: 2.5, houseType: 'roof', birds: 150, day: 0 })
    expect(l.brood).not.toBeNull()
    expect(l.brood!.w * l.brood!.h).toBeCloseTo(3)
    expect(l.heaters).toHaveLength(3)
    expect(l.windows.length).toBeGreaterThan(0)
    expect(l.fans).toHaveLength(0)
    for (const h of l.heaters) {
      expect(h.x).toBeLessThanOrEqual(l.brood!.x + l.brood!.w)
    }
  })
  it('uses fans and pads in closed houses and caps drawn items', () => {
    const l = computeLayout(sp, { length: 60, width: 12, height: 3, houseType: 'closed', birds: 5000, day: 30 })
    expect(l.brood).toBeNull()
    expect(l.fans.length).toBeGreaterThan(0)
    expect(l.pads).toHaveLength(1)
    expect(l.feeders.length + l.drinkers.length).toBeLessThanOrEqual(400)
  })
  it('normalises orientation so length is the long side', () => {
    const l = computeLayout(sp, { length: 3, width: 8, height: 2.5, houseType: 'room', birds: 50, day: 20 })
    expect(l.length).toBe(8)
    expect(l.width).toBe(3)
  })
})
