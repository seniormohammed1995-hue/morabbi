import { describe, expect, it } from 'vitest'
import { dailyNeeds, scrapsSplit } from './nutrition'
import { testProfile } from './__fixtures__/profile'
import { WEATHER } from '../data/weather'

describe('dailyNeeds', () => {
  it('interpolates feed per bird and totals it for the group', () => {
    const n = dailyNeeds(testProfile(), 5, 20, undefined, WEATHER)
    expect(n.feedG).toBeCloseTo(60)
    expect(n.feedKg).toBeCloseTo(1.2)
    // 2 L water per kg feed at mild temperature.
    expect(n.waterL).toBeCloseTo(2.4)
  })

  it('raises water on a hot day', () => {
    const mild = dailyNeeds(testProfile(), 5, 20, undefined, WEATHER).waterL!
    const hot = dailyNeeds(testProfile(), 5, 20, 35, WEATHER).waterL!
    expect(hot).toBeGreaterThan(mild)
  })

  it('counts pigeon pairs as two birds', () => {
    const birds = dailyNeeds(testProfile(), 10, 4, undefined, WEATHER).feedKg!
    const pairs = dailyNeeds(testProfile({ unit: 'pairs' }), 10, 4, undefined, WEATHER).feedKg!
    expect(pairs).toBeCloseTo(birds * 2)
  })

  it('gives only the phase when the breed has no intake table', () => {
    const p = testProfile()
    const { dailyFeed: _drop, ...feeding } = p.feeding
    const n = dailyNeeds({ ...p, feeding }, 5, 20, undefined, WEATHER)
    expect(n.phase.id).toBe('all')
    expect(n.feedKg).toBeUndefined()
    expect(n.waterL).toBeUndefined()
  })
})

describe('scrapsSplit', () => {
  it('keeps scraps at the given share of the total', () => {
    const s = scrapsSplit(2, 25)
    expect(s.scrapsKg).toBeCloseTo(0.5)
    expect(s.feedKg).toBeCloseTo(1.5)
  })
  it('clamps silly percentages', () => {
    expect(scrapsSplit(1, 150).feedKg).toBe(0)
    expect(scrapsSplit(1, -5).scrapsKg).toBe(0)
  })
})
