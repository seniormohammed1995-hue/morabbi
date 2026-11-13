/** A row in a feed formula. Values are as-fed; pct is inclusion % of the mix. */
export interface FormulaRow {
  id: string
  pct: number
  /** Crude protein %, energy kcal/kg (from data, or entered for custom ingredients). */
  cp: number
  me: number
  /** Price per ton (user input, currency-agnostic). */
  pricePerTon?: number
}

export interface MixResult {
  totalPct: number
  cp: number
  me: number
  costPerTon?: number
}

/** Nutrients and cost of a mix normalised to 100%. Cost is undefined if any price is missing. */
export function mixNutrients(rows: readonly FormulaRow[]): MixResult {
  const total = rows.reduce((s, r) => s + r.pct, 0)
  if (total <= 0) return { totalPct: 0, cp: 0, me: 0 }
  const cp = rows.reduce((s, r) => s + r.pct * r.cp, 0) / total
  const me = rows.reduce((s, r) => s + r.pct * r.me, 0) / total
  const priced = rows.filter((r) => r.pct > 0).every((r) => r.pricePerTon !== undefined)
  const out: MixResult = { totalPct: total, cp, me }
  if (priced) out.costPerTon = rows.reduce((s, r) => s + r.pct * (r.pricePerTon ?? 0), 0) / total
  return out
}

export interface BalanceResult {
  rows: FormulaRow[]
  feasible: boolean
}

/**
 * Pearson-square balance: keeps every row except `energyId` and `proteinId` fixed, then splits the
 * remaining share between them so the mix reaches `targetCp`. If the target can't be reached the
 * split is clamped to the nearest end and `feasible` is false.
 */
export function balanceProtein(
  rows: readonly FormulaRow[],
  energyId: string,
  proteinId: string,
  targetCp: number,
): BalanceResult {
  const a = rows.find((r) => r.id === energyId)
  const b = rows.find((r) => r.id === proteinId)
  if (!a || !b || a.cp === b.cp) return { rows: [...rows], feasible: false }
  const fixed = rows.filter((r) => r !== a && r !== b)
  const fixedPct = fixed.reduce((s, r) => s + r.pct, 0)
  const remaining = 100 - fixedPct
  if (remaining <= 0) return { rows: [...rows], feasible: false }
  const fixedCp = fixed.reduce((s, r) => s + r.pct * r.cp, 0)
  const neededCp = (targetCp * 100 - fixedCp) / remaining
  const raw = (neededCp - a.cp) / (b.cp - a.cp)
  const share = Math.min(1, Math.max(0, raw))
  const round = (v: number) => Math.round(v * 100) / 100
  const bPct = round(remaining * share)
  const aPct = round(remaining - bPct)
  return {
    rows: rows.map((r) => (r === a ? { ...r, pct: aPct } : r === b ? { ...r, pct: bPct } : r)),
    feasible: raw >= 0 && raw <= 1,
  }
}

/** Feed cost for a quantity at a price per ton. */
export function feedCost(kg: number, pricePerTon: number): number {
  return (kg / 1000) * pricePerTon
}

/** Price per ton from a bag price. */
export function bagToTon(bagPrice: number, bagKg: number): number {
  return (bagPrice / bagKg) * 1000
}
