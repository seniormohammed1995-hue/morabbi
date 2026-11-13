const DAY = 86_400_000

/** Parses YYYY-MM-DD as a local calendar date at noon (avoids DST edge cases). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, d ?? 1, 12)
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / DAY)
}

/** Flock age in days on a given date. Placement day = age 0. */
export function ageOn(placementDate: string, date: string): number {
  return daysBetween(placementDate, date)
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now)
}
