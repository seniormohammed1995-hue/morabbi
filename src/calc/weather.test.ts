import { describe, expect, it } from 'vitest'
import { WEATHER } from '../data/weather'
import {
  alertNotifyAt,
  alertsAhead,
  buildAlerts,
  capAlerts,
  comfort,
  currentReading,
  feltTemp,
  heatLevel,
  isYoung,
  thi,
  waterEstimateL,
  wetBulb,
  type Hour,
  type WeatherAlert,
} from './weather'
import { climateAt } from './birds'
import { testProfile } from './__fixtures__/profile'
import { RULES } from '../data/rules'

const P = WEATHER
const LIMITS = { gustKmh: RULES.windGustKmh, rainProbPct: RULES.rainProbabilityPct }
const W = RULES.alertWindowHours

function hours(from: string, n: number, f: (i: number) => Partial<Hour>): Hour[] {
  const start = new Date(`${from}:00`)
  const p = (x: number) => String(x).padStart(2, '0')
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(start.getTime() + i * 3_600_000)
    const time = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00`
    const hr = d.getHours()
    return {
      time,
      tempC: 24,
      rh: 50,
      gustKmh: 10,
      precipMm: 0,
      precipProb: 0,
      code: 0,
      isDay: hr >= 6 && hr < 18,
      radWm2: 0,
      ...f(i),
    }
  })
}

describe('wetBulb (Stull 2011)', () => {
  it('matches the paper example (20 °C, 50 %)', () => {
    expect(wetBulb(20, 50)).toBeCloseTo(13.7, 1)
  })
})

describe('thi (Tao & Xin 2003)', () => {
  it('rises with humidity and maps to levels', () => {
    expect(thi(35, 80, 0.2)).toBeGreaterThan(thi(35, 30, 0.2))
    expect(heatLevel(30, P.thi)).toBe('normal')
    expect(heatLevel(36, P.thi)).toBe('alert')
    expect(heatLevel(38.5, P.thi)).toBe('danger')
    expect(heatLevel(41, P.thi)).toBe('emergency')
  })
})

describe('feltTemp', () => {
  it('adds the sun load by place, nothing at night or indoors', () => {
    expect(feltTemp(30, 'roof-open', 1000, P)).toBeCloseTo(36.8, 1)
    expect(feltTemp(30, 'roof-shaded', 1000, P)).toBeCloseTo(33.4, 1)
    expect(feltTemp(30, 'room', 1000, P)).toBe(30)
    expect(feltTemp(30, 'roof-open', 0, P)).toBe(30)
  })
})

describe('currentReading', () => {
  const f = { current: { tempC: 30, rh: 40, radWm2: 500 }, fetchedAt: 1 }
  it('prefers a manual thermometer reading', () => {
    expect(currentReading(f, { tempC: 28, at: 5 }, 'roof-open', P)).toEqual({
      tempC: 28,
      rh: 40,
      kind: 'manual',
      at: 5,
    })
  })
  it('estimates from the forecast otherwise, and handles no data', () => {
    expect(currentReading(f, null, 'roof-open', P)?.kind).toBe('estimate')
    expect(currentReading(null, null, 'room', P)).toBeNull()
  })
})

describe('comfort', () => {
  const band = climateAt(testProfile(), 20)
  it('is green inside comfort, yellow between, red past danger', () => {
    expect(comfort(band, 22, 50)).toEqual({ level: 'green', why: 'ok' })
    expect(comfort(band, 29, 50)).toEqual({ level: 'yellow', why: 'hot' })
    expect(comfort(band, 33, 50)).toEqual({ level: 'red', why: 'hot' })
    expect(comfort(band, 10, 50)).toEqual({ level: 'yellow', why: 'cold' })
    expect(comfort(band, 2, 50)).toEqual({ level: 'red', why: 'cold' })
    expect(comfort(band, 22, 90)).toEqual({ level: 'yellow', why: 'humid' })
  })
  it('uses the young band for chicks', () => {
    expect(comfort(climateAt(testProfile(), 2), 22, 50).level).toBe('red')
    expect(isYoung(testProfile(), 2)).toBe(true)
    expect(isYoung(testProfile(), 30)).toBe(false)
  })
})

describe('waterEstimateL', () => {
  it('uses intake × ratio and adds 6.5 %/°C above 21 °C', () => {
    const p = testProfile()
    // day 10: 110 g × 2 L/kg × 10 birds = 2.2 L
    expect(waterEstimateL(p, 10, 10, 21, P)).toBeCloseTo(2.2, 5)
    expect(waterEstimateL(p, 10, 10, 31, P)).toBeCloseTo(2.2 * 1.65, 5)
    const { dailyFeed: _drop, ...noTable } = p.feeding
    expect(waterEstimateL(testProfile({ feeding: noTable }), 10, 10, 30, P)).toBeUndefined()
  })
})

describe('buildAlerts', () => {
  const adult = { id: 1, profile: testProfile(), age: 60, place: 'roof-open' as const }
  const chicks = { id: 2, profile: testProfile(), age: 3, place: 'room' as const }

  it('warns about heat ahead of time', () => {
    const h = hours('2026-07-01T06:00', 30, (i) =>
      i >= 8 && i <= 10 ? { tempC: 40, radWm2: 900 } : {},
    )
    const heat = buildAlerts(h, [adult], '2026-07-01T06:00', P, W, LIMITS).find(
      (x) => x.type === 'heat',
    )!
    expect(heat.at).toBe('2026-07-01T14:00')
    expect(heat.groupIds).toEqual([1])
  })

  it('warns about a cold night on chicks with the temperature they need', () => {
    const h = hours('2026-01-10T15:00', 20, (i) => (i >= 6 ? { tempC: 14, isDay: false } : {}))
    const cold = buildAlerts(h, [adult, chicks], '2026-01-10T15:00', P, W, LIMITS).find(
      (x) => x.type === 'cold',
    )!
    expect(cold.groupIds).toEqual([2])
    expect(cold.need).toEqual({ min: 30, max: 33 })
  })

  it('needs several humid hours, and flags wind and rain', () => {
    const fewWet = hours('2026-03-01T00:00', 24, (i) => (i < 3 ? { rh: 95 } : {}))
    expect(
      buildAlerts(fewWet, [adult], '2026-03-01T00:00', P, W, LIMITS).some(
        (x) => x.type === 'humid',
      ),
    ).toBe(false)
    const h = hours('2026-03-01T00:00', 24, (i) => ({
      rh: i < 8 ? 95 : 50,
      gustKmh: i === 12 ? 55 : 10,
      precipProb: i === 15 ? 80 : 0,
    }))
    const types = buildAlerts(h, [adult], '2026-03-01T00:00', P, W, LIMITS).map((x) => x.type)
    expect(types).toEqual(expect.arrayContaining(['humid', 'wind', 'rain']))
  })

  it('returns nothing without groups or hours', () => {
    expect(buildAlerts([], [adult], '2026-03-01T00:00', P, W, LIMITS)).toEqual([])
    expect(
      buildAlerts(
        hours('2026-03-01T00:00', 5, () => ({})),
        [],
        '2026-03-01T00:00',
        P,
        W,
        LIMITS,
      ),
    ).toEqual([])
  })
})

describe('capAlerts', () => {
  const mk = (type: WeatherAlert['type'], severity: number): WeatherAlert => ({
    id: `${type}:d`,
    type,
    at: '2026-01-01T10:00',
    severity,
    groupIds: [1],
    value: 0,
  })
  const all = { heat: true, cold: true, humid: true, wind: true, rain: true }
  const a = [mk('humid', 1), mk('rain', 2), mk('heat', 3)]
  it('keeps at most two, most urgent first, and respects switched-off types', () => {
    expect(capAlerts(a, all, [], 2).map((x) => x.type)).toEqual(['heat', 'rain'])
    expect(capAlerts(a, { ...all, heat: false }, [], 2).map((x) => x.type)).toEqual([
      'rain',
      'humid',
    ])
  })
  it('counts alerts already shown today', () => {
    expect(capAlerts(a, all, ['humid:d'], 2).map((x) => x.type)).toEqual(['humid', 'heat'])
    expect(capAlerts(a, all, ['x', 'y'], 2)).toEqual([])
  })
})

describe('alertsAhead / alertNotifyAt', () => {
  const adult = { id: 1, profile: testProfile(), age: 60, place: 'roof-open' as const }
  const chicks = { id: 2, profile: testProfile(), age: 3, place: 'room' as const }

  it('finds one heat alert per day across the forecast', () => {
    // Hot at 14:00–16:00 on each of three days.
    const h = hours('2026-07-01T00:00', 72, (i) =>
      i % 24 >= 14 && i % 24 <= 16 ? { tempC: 41, radWm2: 900 } : {},
    )
    const a = alertsAhead(h, [adult], '2026-07-01T08:00', P, W, LIMITS, 2)
    expect(a.map((x) => x.id)).toEqual(['heat:2026-07-01', 'heat:2026-07-02', 'heat:2026-07-03'])
    expect(a.every((x) => x.at.endsWith('T14:00'))).toBe(true)
  })

  it('ignores wind, rain and humidity (those stay in-app)', () => {
    const h = hours('2026-03-01T00:00', 48, () => ({ gustKmh: 70, rh: 95 }))
    expect(alertsAhead(h, [adult], '2026-03-01T06:00', P, W, LIMITS, 1)).toEqual([])
  })

  it('notifies about heat hours before, and about a cold night the evening before', () => {
    const now = new Date(2026, 6, 1, 6, 0)
    const heat = { id: 'heat:2026-07-01', type: 'heat', at: '2026-07-01T14:00' } as WeatherAlert
    expect(alertNotifyAt(heat, now, 6, '17:00')).toEqual(new Date(2026, 6, 1, 8, 0))

    const lateNight = { id: 'cold:2026-07-02', type: 'cold', at: '2026-07-02T02:00' } as WeatherAlert
    expect(alertNotifyAt(lateNight, now, 6, '17:00')).toEqual(new Date(2026, 6, 1, 17, 0))
    const evening = { id: 'cold:2026-07-01', type: 'cold', at: '2026-07-01T19:00' } as WeatherAlert
    expect(alertNotifyAt(evening, now, 6, '17:00')).toEqual(new Date(2026, 6, 1, 17, 0))
  })

  it('never schedules in the past', () => {
    const now = new Date(2026, 6, 1, 13, 0)
    const heat = { id: 'heat:2026-07-01', type: 'heat', at: '2026-07-01T14:00' } as WeatherAlert
    expect(alertNotifyAt(heat, now, 6, '17:00')).toEqual(new Date(2026, 6, 1, 13, 1))
  })

  it('schedules a cold night for chicks from the forecast', () => {
    const h = hours('2026-01-10T00:00', 48, (i) =>
      i % 24 >= 20 || i % 24 < 5 ? { tempC: 12, isDay: false } : {},
    )
    const a = alertsAhead(h, [chicks], '2026-01-10T09:00', P, W, LIMITS, 1)
    expect(a[0]!.type).toBe('cold')
    expect(a[0]!.groupIds).toEqual([2])
  })
})
