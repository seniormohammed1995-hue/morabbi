import { INGREDIENTS } from './ingredients'
import { CycleTemplate, Ingredient, SpeciesData, type LocalizedText, type SpeciesGroup } from './schema'
import { broilerWhite } from './species/broiler-white'
import { broilerWhiteCycle } from './cycles/broiler-white.cycle'
import { ar } from './helpers'

export interface SpeciesEntry {
  data: SpeciesData
  cycle: CycleTemplate
}

/** Species with complete, validated data. */
export const SPECIES: Record<string, SpeciesEntry> = {
  [broilerWhite.id]: { data: broilerWhite, cycle: broilerWhiteCycle },
}

/** Full catalogue shown in the wizard; entries without data are listed as "in preparation". */
export const CATALOGUE: Array<{ id: string; group: SpeciesGroup; name: LocalizedText }> = [
  { id: 'broiler-white', group: 'broiler', name: ar('تسمين أبيض') },
  { id: 'broiler-sasso', group: 'broiler', name: ar('ساسو') },
  { id: 'broiler-baladi', group: 'broiler', name: ar('بلدي') },
  { id: 'broiler-baladi-improved', group: 'broiler', name: ar('بلدي محسّن') },
  { id: 'layer-commercial', group: 'layer', name: ar('بياض تجاري') },
  { id: 'layer-baladi', group: 'layer', name: ar('بلدي بيّاض') },
  { id: 'duck-muscovy', group: 'duck', name: ar('بط مسكوفي') },
  { id: 'duck-mulard', group: 'duck', name: ar('بط مولار') },
  { id: 'duck-pekin', group: 'duck', name: ar('بط بكيني') },
  { id: 'duck-baladi', group: 'duck', name: ar('بط بلدي') },
  { id: 'turkey-white', group: 'turkey', name: ar('رومي أبيض') },
  { id: 'turkey-baladi', group: 'turkey', name: ar('رومي أسود/بلدي') },
  { id: 'goose-baladi', group: 'goose', name: ar('أوز بلدي') },
  { id: 'quail', group: 'quail', name: ar('سمان') },
  { id: 'pigeon', group: 'pigeon', name: ar('حمام') },
]

export function getSpecies(id: string): SpeciesEntry | undefined {
  return SPECIES[id]
}

/** Validates every data file against the schema. Returns a list of human-readable errors. */
export function validateAll(): string[] {
  const errors: string[] = []
  for (const ing of INGREDIENTS) {
    const r = Ingredient.safeParse(ing)
    if (!r.success) for (const i of r.error.issues) errors.push(`ingredient ${ing.id}: ${i.path.join('.')} — ${i.message}`)
  }
  for (const [id, entry] of Object.entries(SPECIES)) {
    const s = SpeciesData.safeParse(entry.data)
    if (!s.success) for (const i of s.error.issues) errors.push(`${id}: ${i.path.join('.')} — ${i.message}`)
    const c = CycleTemplate.safeParse(entry.cycle)
    if (!c.success) for (const i of c.error.issues) errors.push(`${id}.cycle: ${i.path.join('.')} — ${i.message}`)
    if (entry.cycle.speciesId !== id) errors.push(`${id}.cycle: speciesId mismatch`)
    errors.push(...consistency(entry))
  }
  return errors
}

/** Cross-field checks Zod can't express. */
function consistency({ data, cycle }: SpeciesEntry): string[] {
  const e: string[] = []
  const id = data.id
  const phases = data.feed.phases
  for (let i = 1; i < phases.length; i++) {
    if (phases[i]!.fromDay !== phases[i - 1]!.toDay + 1) e.push(`${id}: feed phases must be contiguous`)
  }
  if (phases[0]!.fromDay !== 0) e.push(`${id}: first feed phase must start at day 0`)
  const market = data.marketAge.value
  if (phases.at(-1)!.toDay < market) e.push(`${id}: feed phases must cover market age`)
  if (data.growth.bodyWeight.points.at(-1)!.day < market) e.push(`${id}: growth table must cover market age`)
  if (cycle.stages[0]!.fromDay !== -cycle.prepDays) e.push(`${id}.cycle: first stage must start at -prepDays`)
  for (const t of cycle.tasks) if (t.toDay < t.fromDay) e.push(`${id}.cycle: task ${t.id} has toDay < fromDay`)
  const ids = new Set<string>()
  for (const t of cycle.tasks) {
    if (ids.has(t.id)) e.push(`${id}.cycle: duplicate task id ${t.id}`)
    ids.add(t.id)
  }
  for (const h of data.equipment.heaters) if (h.minFlock > h.maxFlock) e.push(`${id}: heater ${h.id} min > max`)
  return e
}

/** Every low-confidence value with its path, for the review list and the sources page. */
export function lowConfidenceValues(): Array<{ speciesId: string; path: string; source: string; note?: string }> {
  const out: Array<{ speciesId: string; path: string; source: string; note?: string }> = []
  const walk = (speciesId: string, node: unknown, path: string) => {
    if (!node || typeof node !== 'object') return
    const o = node as Record<string, unknown>
    if (o.confidence === 'low' && typeof o.source === 'string') {
      const note = (o.note as LocalizedText | undefined)?.ar
      out.push({ speciesId, path, source: o.source, ...(note ? { note } : {}) })
    }
    for (const [k, v] of Object.entries(o)) walk(speciesId, v, path ? `${path}.${k}` : k)
  }
  for (const [id, e] of Object.entries(SPECIES)) walk(id, e.data, '')
  for (const ing of INGREDIENTS) walk('ingredients', ing, ing.id)
  return out
}
