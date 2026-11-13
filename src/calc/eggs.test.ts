import { describe, expect, it } from 'vitest'
import { dailySeries, layingRate, productionDrop, weeklyTotals } from './eggs'
import { addDays } from './dates'

const END = '2026-11-13'
const rows = (counts: number[]) =>
  counts.map((count, i) => ({ date: addDays(END, i - counts.length + 1), count }))

describe('egg counter calc', () => {
  it('fills missing days with zero', () => {
    const s = dailySeries([{ date: END, count: 4 }], END, 3)
    expect(s.map((x) => x.count)).toEqual([0, 0, 4])
    expect(s[0]!.date).toBe('2026-11-11')
  })
  it('sums weeks and computes the laying rate', () => {
    const r = rows(Array(14).fill(5))
    expect(weeklyTotals(r, END, 2).map((w) => w.count)).toEqual([35, 35])
    expect(layingRate(r, END, 7, 10)).toBeCloseTo(0.5)
    expect(layingRate(r, END, 7, 0)).toBe(0)
  })
  it('flags a real drop only', () => {
    expect(productionDrop(rows([6, 6, 6, 6, 6, 6, 6, 3, 3, 3, 3, 3, 3, 3]), END, 25).down).toBe(
      true,
    )
    expect(productionDrop(rows([6, 6, 6, 6, 6, 6, 6, 5, 6, 5, 6, 5, 6, 5]), END, 25).down).toBe(
      false,
    )
    // Only one day recorded before: not enough to judge.
    expect(productionDrop(rows([0, 0, 0, 0, 0, 0, 9, 1, 1, 1, 1, 1, 1, 1]), END, 25).down).toBe(
      false,
    )
  })
})
