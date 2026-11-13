import type { BroodCheck } from '../data/schema'
import { addDays, daysBetween } from './dates'

export interface BroodState {
  /** Days since sitting started (start day = 0). */
  day: number
  hatchDay: number
  hatchDate: string
  daysLeft: number
  /** Checks due today. */
  today: BroodCheck[]
  /** Next check after today, if any. */
  next?: BroodCheck & { date: string }
  /** Past the expected hatch by more than `graceDays`. */
  late: boolean
  progress: number
}

/** Where a natural sitting stands today. */
export function broodState(
  startDate: string,
  today: string,
  incubationDays: number,
  checks: BroodCheck[],
  graceDays = 3,
): BroodState {
  const day = daysBetween(startDate, today)
  const sorted = [...checks].sort((a, b) => a.day - b.day)
  const nx = sorted.find((c) => c.day > day)
  return {
    day,
    hatchDay: incubationDays,
    hatchDate: addDays(startDate, incubationDays),
    daysLeft: incubationDays - day,
    today: sorted.filter((c) => c.day === day),
    ...(nx ? { next: { ...nx, date: addDays(startDate, nx.day) } } : {}),
    late: day > incubationDays + graceDays,
    progress: Math.min(1, Math.max(0, day / incubationDays)),
  }
}
