import { describe, expect, it } from 'vitest'
import { dailyRoutine, isLaying, type RoutineGroup } from './routine'
import { testProfile } from './__fixtures__/profile'
import { WEATHER } from '../data/weather'
import { sv } from '../data/helpers'

const g = (over: Partial<RoutineGroup> = {}): RoutineGroup => ({
  id: 1,
  kind: 'chicken',
  profile: testProfile(),
  purpose: 'meat',
  age: 20,
  count: 10,
  place: 'room',
  ...over,
})

describe('dailyRoutine', () => {
  it('is empty without groups', () => {
    expect(dailyRoutine([], {}, WEATHER)).toEqual([])
  })

  it('gives 3–5 tasks with water and feed first on a mild day', () => {
    const r = dailyRoutine([g()], { maxC: 22, minC: 18, rhNow: 50 }, WEATHER)
    expect(r.length).toBeGreaterThanOrEqual(3)
    expect(r.length).toBeLessThanOrEqual(5)
    expect(r.map((x) => x.type).slice(0, 2)).toEqual(['water', 'feed'])
  })

  it('puts a heat action on top on a hot day and raises the water estimate', () => {
    const mild = dailyRoutine([g()], { maxC: 21 }, WEATHER).find((x) => x.type === 'water')!
      .groups[0]!.waterL!
    const r = dailyRoutine([g()], { maxC: 34, rhNow: 40 }, WEATHER)
    expect(dailyRoutine([g()], { maxC: 29, rhNow: 40 }, WEATHER)[0]!.type).toBe('water')
    expect(r[0]!.type).toBe('heat')
    expect(r.find((x) => x.type === 'water')!.groups[0]!.waterL!).toBeGreaterThan(mild)
  })

  it('warns about cold for chicks only', () => {
    const r = dailyRoutine([g({ id: 1, age: 60 }), g({ id: 2, age: 2 })], { minC: 20 }, WEATHER)
    expect(r[0]).toMatchObject({ type: 'cold', groups: [{ id: 2 }] })
  })

  it('adds egg collection for laying groups and one-off cycle tasks', () => {
    const layer = testProfile({
      expected: { eggsPerYear: sv(250, 'بيضة', 'hb25', 'high') },
      cycle: {
        ...testProfile().cycle,
        endpoint: 'first-egg',
        endpointAge: sv(140, 'يوم', 'hb25', 'high'),
      },
    })
    expect(isLaying(g({ profile: layer, purpose: 'eggs', age: 200 }))).toBe(true)
    expect(isLaying(g({ profile: layer, purpose: 'eggs', age: 100 }))).toBe(false)
    expect(isLaying(g({ profile: layer, purpose: 'meat', age: 200 }))).toBe(false)
    const r = dailyRoutine([g({ profile: layer, purpose: 'eggs', age: 200 })], {}, WEATHER)
    expect(r.map((x) => x.type)).toContain('eggs')
    const day0 = dailyRoutine([g({ age: 0 })], {}, WEATHER)
    expect(day0.some((x) => x.type === 'cycle' && x.task?.id === 't')).toBe(true)
  })
})
