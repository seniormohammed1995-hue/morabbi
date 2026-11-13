import { describe, expect, it } from 'vitest'
import { balanceProtein, bagToTon, feedCost, mixNutrients, type FormulaRow } from './formula'
import { cycleFeed } from './feed'
import { broilerWhite as sp } from '../data/species/broiler-white'
import { getIngredient } from '../data/ingredients'

const row = (id: string, pct: number, pricePerTon?: number): FormulaRow => {
  const i = getIngredient(id)!
  return { id, pct, cp: i.crudeProtein.value, me: i.energy.value, ...(pricePerTon !== undefined ? { pricePerTon } : {}) }
}

describe('mixNutrients', () => {
  it('computes weighted protein, energy and cost', () => {
    const r = mixNutrients([row('corn', 60, 15000), row('sbm44', 40, 30000)])
    expect(r.totalPct).toBe(100)
    expect(r.cp).toBeCloseTo(0.6 * 9 + 0.4 * 43.4)
    expect(r.me).toBeCloseTo(0.6 * 3055 + 0.4 * 2222)
    expect(r.costPerTon).toBeCloseTo(21000)
  })
  it('normalises when the total is not 100 and omits cost when a price is missing', () => {
    const r = mixNutrients([row('corn', 30), row('sbm44', 20, 30000)])
    expect(r.cp).toBeCloseTo(0.6 * 9 + 0.4 * 43.4)
    expect(r.costPerTon).toBeUndefined()
  })
})

describe('balanceProtein', () => {
  it('hits the starter target with corn and soybean meal around fixed minerals', () => {
    const rows = [row('corn', 50), row('sbm44', 46), row('limestone', 1.5), row('dcp', 2), row('premix', 0.5)]
    const res = balanceProtein(rows, 'corn', 'sbm44', 23)
    expect(res.feasible).toBe(true)
    const total = res.rows.reduce((s, r) => s + r.pct, 0)
    expect(total).toBeCloseTo(100, 1)
    expect(mixNutrients(res.rows).cp).toBeCloseTo(23, 1)
  })
  it('flags an impossible target', () => {
    const res = balanceProtein([row('corn', 50), row('sbm44', 50)], 'corn', 'sbm44', 50)
    expect(res.feasible).toBe(false)
    expect(res.rows.find((r) => r.id === 'sbm44')!.pct).toBe(100)
  })
})

describe('cycle feed cost', () => {
  it('prices the cycle by phase', () => {
    const f = cycleFeed(sp, 1000, 35)
    const prices: Record<string, number> = { starter: 30000, grower: 29000, finisher: 28000 }
    const total = f.byPhase.reduce((s, p) => s + feedCost(p.kg, prices[p.phase.id]!), 0)
    expect(total).toBeCloseTo(f.byPhase[0]!.kg * 30 + f.byPhase[1]!.kg * 29 + f.byPhase[2]!.kg * 28)
    expect(total / 1000).toBeGreaterThan(80) // ≈3.2 kg feed/bird × ~28.5 per kg
  })
  it('converts bag price to ton price', () => {
    expect(bagToTon(1400, 50)).toBe(28000)
  })
})
