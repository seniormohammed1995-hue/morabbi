import { describe, expect, it } from 'vitest'
import { rankConditions, vaccineStatus } from './health'
import type { Condition, Vaccination } from '../data/schema'

const base = {
  groups: ['broiler' as const],
  urgency: 'vet-soon' as const,
  notifiable: false,
  summary: { ar: 'x' },
  actions: [{ ar: 'x' }],
  source: 's',
  sourceUrl: 'https://example.org',
  confidence: 'high' as const,
  lastReviewed: '2026-11-13',
}
const resp: Condition = { ...base, id: 'resp', name: { ar: 'تنفسي' }, ageFrom: 0, ageTo: 60, signs: [{ symptom: 'cough', weight: 3 }, { symptom: 'sneeze', weight: 2 }, { symptom: 'eggdrop', weight: 1 }] }
const gut: Condition = { ...base, id: 'gut', name: { ar: 'هضمي' }, ageFrom: 14, ageTo: 35, urgency: 'vet-now', signs: [{ symptom: 'blood', weight: 3 }, { symptom: 'ruffled', weight: 1 }] }

describe('rankConditions', () => {
  it('returns nothing with no symptoms', () => {
    expect(rankConditions([resp, gut], [])).toEqual([])
  })
  it('ranks the best match first and lists matched signs', () => {
    const r = rankConditions([resp, gut], ['cough', 'sneeze'], 20)
    expect(r[0]!.condition.id).toBe('resp')
    expect(r[0]!.matched).toEqual(['cough', 'sneeze'])
    expect(r[0]!.score).toBeCloseTo(0.6 * (5 / 6) + 0.4)
    expect(r).toHaveLength(1)
  })
  it('halves the score outside the typical age', () => {
    const young = rankConditions([gut], ['blood'], 3)[0]!
    const typical = rankConditions([gut], ['blood'], 20)[0]!
    expect(young.ageFits).toBe(false)
    expect(young.score).toBeCloseTo(typical.score / 2)
  })
})

const v = (id: string, day: number): Vaccination => ({ id, day, disease: { ar: id }, vaccine: { ar: id }, route: 'eye-drop', source: 's', sourceUrl: 'https://example.org', confidence: 'medium', lastReviewed: '2026-11-13' })

describe('vaccineStatus', () => {
  it('classifies done, due, overdue, upcoming and later', () => {
    const s = vaccineStatus([v('a', 5), v('b', 10), v('c', 12), v('d', 18), v('e', 3)], 10, new Set(['e']), 3)
    expect(s.map((x) => [x.vaccination.id, x.state])).toEqual([
      ['e', 'done'],
      ['a', 'overdue'],
      ['b', 'due'],
      ['c', 'upcoming'],
      ['d', 'later'],
    ])
    expect(s.find((x) => x.vaccination.id === 'c')!.daysUntil).toBe(2)
  })
})

import { CONDITIONS } from '../data/health'

describe('symptom guide with real data', () => {
  it('ranks Newcastle or avian influenza first for green diarrhoea + twisted neck + sudden deaths', () => {
    const r = rankConditions(CONDITIONS, ['green-diarrhea', 'twisted-neck', 'sudden-death'], 20)
    expect(['newcastle', 'hpai']).toContain(r[0]!.condition.id)
    expect(r[0]!.condition.notifiable).toBe(true)
  })
  it('ranks coccidiosis first for bloody droppings', () => {
    expect(rankConditions(CONDITIONS, ['bloody-droppings', 'ruffled'], 20)[0]!.condition.id).toBe('coccidiosis')
  })
  it('ranks heat stress first for panting with high water intake', () => {
    expect(rankConditions(CONDITIONS, ['panting', 'high-water'], 30)[0]!.condition.id).toBe('heat-stress')
  })
  it('ranks navel infection first for a week-old chick with a wet navel', () => {
    expect(rankConditions(CONDITIONS, ['navel', 'huddling'], 3)[0]!.condition.id).toBe('omphalitis')
  })
})
