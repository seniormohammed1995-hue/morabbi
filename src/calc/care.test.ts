import { describe, expect, it } from 'vitest'
import { byDate, careEvents, eventsAtAge, withdrawalStatus, type CareGroup } from './care'
import { testProfile } from './__fixtures__/profile'
import { ar, sv } from '../data/helpers'
import type { Vaccination } from '../data/schema'

const v = (n: number) => sv(n, '°م', 'hb25', 'high')
const band = (fromDay: number, toDay: number, min: number, max: number) => ({
  fromDay,
  toDay,
  comfortMin: v(min),
  comfortMax: v(max),
  dangerLow: v(min - 5),
  dangerHigh: v(max + 5),
  rhMax: sv(70, '%', 'hb25', 'high'),
})

const profile = testProfile({
  feeding: {
    ...testProfile().feeding,
    phases: [
      { id: 'starter', name: ar('بادي'), fromDay: 0, toDay: 10 },
      { id: 'grower', name: ar('نامي'), fromDay: 11, toDay: 3650 },
    ],
  },
  climate: {
    bands: [band(0, 6, 30, 33), band(7, 13, 27, 30), band(14, 20, 27, 30), band(21, 3650, 18, 24)],
  },
  cycle: {
    ...testProfile().cycle,
    template: {
      ...testProfile().cycle.template,
      tasks: [
        { id: 'receive', fromDay: 0, toDay: 0, title: ar('استلام'), kind: 'house', daily: false },
        { id: 'weigh', fromDay: 7, toDay: 7, title: ar('وزن'), kind: 'weigh', daily: false },
        { id: 'daily', fromDay: 0, toDay: 35, title: ar('يومي'), kind: 'house', daily: true },
      ],
    },
  },
})

const vaccine: Vaccination = {
  id: 'nd',
  day: 7,
  disease: ar('نيوكاسل'),
  vaccine: ar('لاسوتا'),
  route: 'drinking-water',
  source: 's',
  sourceUrl: 'https://example.org',
  confidence: 'medium',
  lastReviewed: '2026-11-13',
}

const group = (age: number, over: Partial<CareGroup> = {}): CareGroup => ({
  id: 1,
  profile,
  age,
  vaccinations: [vaccine],
  ...over,
})

describe('eventsAtAge', () => {
  it('lists the vaccination, the warmth step and the one-off task on day 7, health first', () => {
    const e = eventsAtAge(group(7), 7, '2026-11-20')
    expect(e.map((x) => x.type)).toEqual(['vaccine', 'climate', 'task'])
    expect(e.every((x) => x.date === '2026-11-20' && x.groupId === 1)).toBe(true)
  })

  it('announces a feed change on the first day of the new phase, not on day 0', () => {
    expect(eventsAtAge(group(11), 11, 'd').map((x) => x.type)).toEqual(['feed'])
    expect(eventsAtAge(group(0), 0, 'd').map((x) => x.type)).toEqual(['task'])
  })

  it('skips a climate band that asks for the same warmth as the one before', () => {
    expect(eventsAtAge(group(14), 14, 'd')).toEqual([])
    expect(eventsAtAge(group(21), 21, 'd').map((x) => x.type)).toEqual(['climate'])
  })

  it('never repeats daily tasks and marks the cycle endpoint', () => {
    expect(eventsAtAge(group(3), 3, 'd')).toEqual([])
    const end = eventsAtAge(group(35), 35, 'd')
    expect(end).toHaveLength(1)
    expect(end[0]).toMatchObject({ type: 'endpoint', endpoint: 'market' })
  })
})

describe('careEvents', () => {
  it('walks the days ahead for every group with stable unique ids', () => {
    const groups = [group(5), group(10, { id: 2, vaccinations: [] })]
    const e = careEvents(groups, '2026-11-13', 14)
    expect(e.filter((x) => x.groupId === 1).map((x) => `${x.type}@${x.date}`)).toEqual([
      'vaccine@2026-11-15',
      'climate@2026-11-15',
      'task@2026-11-15',
      'feed@2026-11-19',
    ])
    expect(e.filter((x) => x.groupId === 2).map((x) => `${x.type}@${x.date}`)).toEqual([
      'feed@2026-11-14',
      'climate@2026-11-24',
    ])
    expect(new Set(e.map((x) => x.id)).size).toBe(e.length)
    expect(byDate(e).map((d) => d.date)).toEqual([
      '2026-11-14',
      '2026-11-15',
      '2026-11-19',
      '2026-11-24',
    ])
  })

  it('returns nothing for adults past every change', () => {
    expect(careEvents([group(400)], '2026-11-13', 30)).toEqual([])
  })
})

describe('withdrawalStatus', () => {
  it('counts whole days after the last dose', () => {
    const s = withdrawalStatus({ lastDose: '2026-11-01', eggDays: 7, meatDays: 14 }, '2026-11-05')
    expect(s.eggs).toEqual({ safeFrom: '2026-11-08', daysLeft: 3 })
    expect(s.meat).toEqual({ safeFrom: '2026-11-15', daysLeft: 10 })
    expect(s.active).toBe(true)
  })

  it('is over on the safe day and ignores a side with no period', () => {
    const s = withdrawalStatus({ lastDose: '2026-11-01', eggDays: 7 }, '2026-11-08')
    expect(s.eggs?.daysLeft).toBe(0)
    expect(s.meat).toBeUndefined()
    expect(s.active).toBe(false)
  })
})
