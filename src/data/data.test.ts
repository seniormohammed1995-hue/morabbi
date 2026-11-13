import { describe, expect, it } from 'vitest'
import { validateAll, lowConfidenceValues, SPECIES } from './index'
import { PROFILES } from './birds'

describe('data files', () => {
  it('match the schema and consistency rules', () => {
    expect(validateAll()).toEqual([])
  })
  it('every value carries a source URL', () => {
    const json = JSON.stringify(Object.values(SPECIES).map((s) => s.data))
    const sources = json.match(/"source":/g)?.length ?? 0
    const urls = json.match(/"sourceUrl":"https:\/\//g)?.length ?? 0
    expect(sources).toBeGreaterThan(50)
    expect(urls).toBe(sources)
  })
  it('every bird profile value carries a source URL', () => {
    const json = JSON.stringify(PROFILES)
    const sources = json.match(/"source":/g)?.length ?? 0
    const urls = json.match(/"sourceUrl":"https:\/\//g)?.length ?? 0
    expect(PROFILES.length).toBe(18)
    expect(urls).toBe(sources)
  })
  it('lists low-confidence values for review', () => {
    const low = lowConfidenceValues()
    expect(low.length).toBeGreaterThan(0)
    expect(low.every((l) => l.source.length > 0)).toBe(true)
  })
})
