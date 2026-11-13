import { SOURCES, type SourceId } from './sources'
import type { AgePoint, AgeTable, BirdKind, Confidence, LocalizedText, MixRule, ScrapRule, ScrapVerdict, SourcedText, SourcedValue } from './schema'
import type { ScrapId } from './scraps'

/** Date the values in the data files were last checked against their sources. */
export const REVIEWED = '2026-11-13'

export const ar = (text: string): LocalizedText => ({ ar: text })

interface Opts {
  min?: number
  max?: number
  note?: string
  reviewed?: string
}

function provenance(unit: string, src: SourceId, confidence: Confidence, o: Opts) {
  const s = SOURCES[src]
  return {
    unit,
    source: s.title,
    sourceUrl: s.url,
    confidence,
    lastReviewed: o.reviewed ?? REVIEWED,
    ...(o.note ? { note: ar(o.note) } : {}),
  }
}

/** Builds a sourced single value. */
export function sv(
  value: number,
  unit: string,
  src: SourceId,
  confidence: Confidence,
  o: Opts = {},
): SourcedValue {
  return {
    value,
    ...(o.min !== undefined ? { min: o.min } : {}),
    ...(o.max !== undefined ? { max: o.max } : {}),
    ...provenance(unit, src, confidence, o),
  }
}

/** Builds a sourced age table from [day, value] or [day, value, min, max] tuples. */
export function table(
  rows: ReadonlyArray<readonly [number, number] | readonly [number, number, number, number]>,
  unit: string,
  src: SourceId,
  confidence: Confidence,
  o: Opts = {},
): AgeTable {
  const points: AgePoint[] = rows.map((r) =>
    r.length === 4 ? { day: r[0], value: r[1], min: r[2], max: r[3] } : { day: r[0], value: r[1] },
  )
  return { points, ...provenance(unit, src, confidence, o) }
}

/** Builds a sourced statement. */
export function st(text: string, src: SourceId, confidence: Confidence, reviewed = REVIEWED): SourcedText {
  const s = SOURCES[src]
  return { text: ar(text), source: s.title, sourceUrl: s.url, confidence, lastReviewed: reviewed }
}

/** Household-scrap verdict for a bird (item id from src/data/scraps.ts). */
export function scrap(item: ScrapId, verdict: ScrapVerdict, reason: string, src: SourceId, confidence: Confidence): ScrapRule {
  const s = SOURCES[src]
  return { item, verdict, reason: ar(reason), source: s.title, sourceUrl: s.url, confidence }
}

/** "Don't keep with" rule. */
export function avoidWith(kind: BirdKind, reason: string, src: SourceId, confidence: Confidence): MixRule {
  const s = SOURCES[src]
  return { kind, reason: ar(reason), source: s.title, sourceUrl: s.url, confidence }
}
