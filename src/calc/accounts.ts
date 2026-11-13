export interface CycleEconomicsInput {
  birds: number
  mortalityPct: number
  marketWeightKg: number
  feedKg: number
  chickPrice: number
  feedPricePerTon: number
  otherCosts: number
  salePricePerKg: number
}

export interface CycleEconomics {
  soldBirds: number
  liveKg: number
  chickCost: number
  feedCost: number
  totalCost: number
  revenue: number
  profit: number
  costPerKg: number
  costPerBird: number
  breakEvenPricePerKg: number
  roiPct: number
}

/** Simple cycle economics: all prices are user inputs. */
export function cycleEconomics(i: CycleEconomicsInput): CycleEconomics {
  const soldBirds = i.birds * (1 - i.mortalityPct / 100)
  const liveKg = soldBirds * i.marketWeightKg
  const chickCost = i.birds * i.chickPrice
  const feedCost = (i.feedKg / 1000) * i.feedPricePerTon
  const totalCost = chickCost + feedCost + i.otherCosts
  const revenue = liveKg * i.salePricePerKg
  const profit = revenue - totalCost
  const costPerKg = liveKg > 0 ? totalCost / liveKg : 0
  return {
    soldBirds,
    liveKg,
    chickCost,
    feedCost,
    totalCost,
    revenue,
    profit,
    costPerKg,
    costPerBird: soldBirds > 0 ? totalCost / soldBirds : 0,
    breakEvenPricePerKg: costPerKg,
    roiPct: totalCost > 0 ? (profit / totalCost) * 100 : 0,
  }
}
