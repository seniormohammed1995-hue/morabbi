import type {
  BirdKind,
  BirdProfile,
  ClimateBand,
  LocalizedText,
  ScrapRule,
  ScrapVerdict,
  SpaceBand,
} from '../data/schema'

/** Climate limits for an age (last band applies past its end). */
export function climateAt(p: BirdProfile, age: number): ClimateBand {
  const bands = p.climate.bands
  return (
    bands.find((b) => age >= b.fromDay && age <= b.toDay) ??
    (age < bands[0]!.fromDay ? bands[0]! : bands.at(-1)!)
  )
}

export function spaceAt(p: BirdProfile, age: number): SpaceBand {
  const bands = p.housing.space
  return bands.find((b) => age >= b.fromDay && age <= b.toDay) ?? bands.at(-1)!
}

/** Floor area (m²) the birds need at an age, from the profile's density. */
export function areaNeeded(p: BirdProfile, age: number, count: number): number {
  const per = spaceAt(p, age).perM2.value
  return per > 0 ? count / per : 0
}

export interface MixWarning {
  a: BirdKind
  b: BirdKind
  reasons: LocalizedText[]
  source: string
  sourceUrl: string
}

/**
 * Pairs of kinds that should not be kept together, from each profile's `mixing.avoid`.
 * A pair is reported once with every distinct reason.
 */
export function mixingWarnings(profiles: BirdProfile[]): MixWarning[] {
  const kinds = new Set(profiles.map((p) => p.kind))
  const out = new Map<string, MixWarning>()
  for (const p of profiles) {
    for (const r of p.mixing.avoid) {
      if (r.kind === p.kind || !kinds.has(r.kind)) continue
      const [a, b] = [p.kind, r.kind].sort() as [BirdKind, BirdKind]
      const key = `${a}|${b}`
      const w = out.get(key) ?? { a, b, reasons: [], source: r.source, sourceUrl: r.sourceUrl }
      if (!w.reasons.some((x) => x.ar === r.reason.ar)) w.reasons.push(r.reason)
      out.set(key, w)
    }
  }
  return [...out.values()]
}

/** Arabic-insensitive normalisation for search (alef/ya/ta marbuta forms, diacritics, spaces). */
export function normalizeAr(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface ScrapLike {
  id: string
  name: LocalizedText
  aliases: readonly string[]
}

/** Scrap items matching a query, best match first (exact alias, then prefix, then contains). */
export function searchScraps<T extends ScrapLike>(items: readonly T[], query: string): T[] {
  const q = normalizeAr(query)
  if (!q) return []
  const scored: Array<{ it: T; score: number }> = []
  for (const it of items) {
    const names = [it.name.ar, ...it.aliases].map(normalizeAr)
    let score = 0
    for (const n of names) {
      if (n === q) score = Math.max(score, 3)
      else if (n.startsWith(q) || n.split(' ').some((w) => w.startsWith(q)))
        score = Math.max(score, 2)
      else if (n.includes(q) || (q.length >= 3 && q.includes(n))) score = Math.max(score, 1)
    }
    if (score > 0) scored.push({ it, score })
  }
  return scored.sort((x, y) => y.score - x.score).map((x) => x.it)
}

/** Verdict for one scrap item for each given profile (one per kind — kinds share feeding rules). */
export function scrapVerdicts(
  item: string,
  profiles: BirdProfile[],
): Array<{ profile: BirdProfile; rule: ScrapRule | undefined }> {
  return profiles.map((profile) => ({
    profile,
    rule: profile.feeding.scraps.find((s) => s.item === item),
  }))
}

/** Strictest verdict wins when summarising several birds. */
export function worstVerdict(v: Array<ScrapVerdict | undefined>): ScrapVerdict | undefined {
  if (v.includes('no')) return 'no'
  if (v.includes('limit')) return 'limit'
  if (v.includes('ok')) return 'ok'
  return undefined
}
