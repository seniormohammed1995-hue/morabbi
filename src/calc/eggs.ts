import { addDays } from './dates'

export interface EggRow {
  date: string
  count: number
}

/** Daily totals for the `days` days ending on `end` (oldest first), zeros for missing days. */
export function dailySeries(rows: EggRow[], end: string, days: number): EggRow[] {
  const by = new Map<string, number>()
  for (const r of rows) by.set(r.date, (by.get(r.date) ?? 0) + r.count)
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(end, i - days + 1)
    return { date, count: by.get(date) ?? 0 }
  })
}

/** Totals per 7-day block for the last `weeks` weeks ending on `end` (oldest first). */
export function weeklyTotals(rows: EggRow[], end: string, weeks: number): EggRow[] {
  const days = dailySeries(rows, end, weeks * 7)
  return Array.from({ length: weeks }, (_, w) => {
    const block = days.slice(w * 7, w * 7 + 7)
    return { date: block[0]!.date, count: block.reduce((s, d) => s + d.count, 0) }
  })
}

/** Average eggs per bird per day over the window (0–1, i.e. laying rate). */
export function layingRate(rows: EggRow[], end: string, days: number, birds: number): number {
  if (birds <= 0 || days <= 0) return 0
  return dailySeries(rows, end, days).reduce((s, d) => s + d.count, 0) / (birds * days)
}

/**
 * Production is "down" when the last 7 days are more than `dropPct` % below the 7 days before,
 * and the earlier week had eggs on at least 3 days (so new records don't trigger it).
 */
export function productionDrop(
  rows: EggRow[],
  end: string,
  dropPct: number,
): { down: boolean; last: number; prev: number } {
  const d = dailySeries(rows, end, 14)
  const prevDays = d.slice(0, 7)
  const prev = prevDays.reduce((s, x) => s + x.count, 0)
  const last = d.slice(7).reduce((s, x) => s + x.count, 0)
  const enough = prevDays.filter((x) => x.count > 0).length >= 3
  return { down: enough && prev > 0 && last < prev * (1 - dropPct / 100), last, prev }
}
