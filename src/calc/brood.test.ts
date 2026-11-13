import { describe, expect, it } from 'vitest'
import { broodState } from './brood'
import { ar } from '../data/helpers'

const checks = [
  { id: 'candle', day: 7, title: ar('كشف'), detail: ar('كشف البيض') },
  { id: 'hatch', day: 21, title: ar('الفقس'), detail: ar('يوم الفقس') },
]

describe('broodState', () => {
  it('counts days and finds the next check', () => {
    const s = broodState('2026-11-01', '2026-11-05', 21, checks)
    expect(s.day).toBe(4)
    expect(s.daysLeft).toBe(17)
    expect(s.hatchDate).toBe('2026-11-22')
    expect(s.next?.id).toBe('candle')
    expect(s.next?.date).toBe('2026-11-08')
    expect(s.today).toEqual([])
  })
  it('lists checks due today and flags late hatches', () => {
    expect(broodState('2026-11-01', '2026-11-08', 21, checks).today.map((c) => c.id)).toEqual([
      'candle',
    ])
    expect(broodState('2026-11-01', '2026-11-26', 21, checks).late).toBe(true)
    expect(broodState('2026-11-01', '2026-11-23', 21, checks).late).toBe(false)
  })
})
