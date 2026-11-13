import type { AgeTable } from '../data/schema'

export interface Ranged {
  value: number
  min?: number
  max?: number
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Value of an age table at a given day, linearly interpolated between points.
 * Days outside the table are clamped to the first/last point.
 */
export function valueAt(table: AgeTable, day: number): Ranged {
  const pts = table.points
  const first = pts[0]!
  const last = pts[pts.length - 1]!
  if (day <= first.day) return pick(first)
  if (day >= last.day) return pick(last)
  for (let i = 1; i < pts.length; i++) {
    const b = pts[i]!
    if (day <= b.day) {
      const a = pts[i - 1]!
      const t = (day - a.day) / (b.day - a.day)
      const out: Ranged = { value: lerp(a.value, b.value, t) }
      if (a.min !== undefined && b.min !== undefined) out.min = lerp(a.min, b.min, t)
      if (a.max !== undefined && b.max !== undefined) out.max = lerp(a.max, b.max, t)
      return out
    }
  }
  return pick(last)
}

function pick(p: { value: number; min?: number; max?: number }): Ranged {
  const out: Ranged = { value: p.value }
  if (p.min !== undefined) out.min = p.min
  if (p.max !== undefined) out.max = p.max
  return out
}

/** Step lookup: value of the last point whose day <= given day (for schedules like lighting). */
export function stepAt(table: AgeTable, day: number): number {
  let v = table.points[0]!.value
  for (const p of table.points) {
    if (p.day <= day) v = p.value
    else break
  }
  return v
}
