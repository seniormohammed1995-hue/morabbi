import type { Condition, Vaccination } from '../data/schema'

export interface Ranked {
  condition: Condition
  /** 0..1 — how well the selected signs match this condition. */
  score: number
  matched: string[]
  ageFits: boolean
}

/**
 * Ranks conditions by how well they match the selected symptoms.
 * score = 0.6 × (matched sign weight / condition's total weight) + 0.4 × (matched / selected),
 * halved when the flock age is outside the condition's typical range.
 */
export function rankConditions(conditions: readonly Condition[], selected: readonly string[], age?: number): Ranked[] {
  if (selected.length === 0) return []
  const sel = new Set(selected)
  const out: Ranked[] = []
  for (const c of conditions) {
    const total = c.signs.reduce((s, x) => s + x.weight, 0)
    const hits = c.signs.filter((x) => sel.has(x.symptom))
    if (hits.length === 0) continue
    const recall = hits.reduce((s, x) => s + x.weight, 0) / total
    const precision = hits.length / sel.size
    const ageFits = age === undefined || (age >= c.ageFrom && age <= c.ageTo)
    const score = (0.6 * recall + 0.4 * precision) * (ageFits ? 1 : 0.5)
    out.push({ condition: c, score, matched: hits.map((h) => h.symptom), ageFits })
  }
  const urgencyRank = { 'vet-now': 0, 'vet-soon': 1, manage: 2 }
  return out.sort((a, b) => b.score - a.score || urgencyRank[a.condition.urgency] - urgencyRank[b.condition.urgency])
}

export type VaccineState = 'done' | 'due' | 'overdue' | 'upcoming' | 'later'

export interface VaccineStatus {
  vaccination: Vaccination
  state: VaccineState
  daysUntil: number
}

/** Status of each scheduled vaccination for a flock at `age`. Upcoming = within `soonDays`. */
export function vaccineStatus(
  vaccs: readonly Vaccination[],
  age: number,
  doneIds: ReadonlySet<string>,
  soonDays: number,
): VaccineStatus[] {
  return [...vaccs]
    .sort((a, b) => a.day - b.day)
    .map((v) => {
      const daysUntil = v.day - age
      const state: VaccineState = doneIds.has(v.id)
        ? 'done'
        : daysUntil === 0
          ? 'due'
          : daysUntil < 0
            ? 'overdue'
            : daysUntil <= soonDays
              ? 'upcoming'
              : 'later'
      return { vaccination: v, state, daysUntil }
    })
}
