import { describe, expect, it } from 'vitest'
import { cycleEconomics } from './accounts'

describe('cycleEconomics', () => {
  const base = {
    birds: 100,
    mortalityPct: 5,
    marketWeightKg: 2,
    feedKg: 350,
    chickPrice: 20,
    feedPricePerTon: 20000,
    otherCosts: 1000,
    salePricePerKg: 70,
  }
  it('computes cost, revenue and profit', () => {
    const r = cycleEconomics(base)
    expect(r.soldBirds).toBe(95)
    expect(r.liveKg).toBe(190)
    expect(r.totalCost).toBe(2000 + 7000 + 1000)
    expect(r.revenue).toBe(13300)
    expect(r.profit).toBe(3300)
    expect(r.costPerKg).toBeCloseTo(10000 / 190)
    expect(r.roiPct).toBeCloseTo(33)
  })
  it('break-even price yields zero profit', () => {
    const r = cycleEconomics(base)
    expect(cycleEconomics({ ...base, salePricePerKg: r.breakEvenPricePerKg }).profit).toBeCloseTo(0)
  })
  it('handles total loss without dividing by zero', () => {
    const r = cycleEconomics({ ...base, mortalityPct: 100 })
    expect(r.liveKg).toBe(0)
    expect(r.costPerKg).toBe(0)
    expect(r.costPerBird).toBe(0)
  })
})
