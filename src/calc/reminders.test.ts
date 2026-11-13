import { describe, expect, it } from 'vitest'
import {
  dueReminders,
  formatTime,
  nextReminder,
  parseTime,
  reminderSlots,
  reminderTypeOf,
  type ReminderSettings,
} from './reminders'

const settings = (over: Partial<ReminderSettings> = {}): ReminderSettings => ({
  water: { on: true, everyHours: 6, from: '06:00', to: '22:00' },
  feed: { on: true, times: ['17:00', '07:00'] },
  news: { on: true, time: '20:00' },
  temp: { on: false, times: [] },
  activity: { on: false, times: [] },
  eggs: { on: false, times: [] },
  litter: { on: false, times: [] },
  digest: { on: true, time: '08:00' },
  weather: { on: true },
  ...over,
})

describe('parseTime / formatTime', () => {
  it('round-trips valid times and rejects bad ones', () => {
    expect(parseTime('07:30')).toBe(450)
    expect(parseTime('7:05')).toBe(425)
    expect(parseTime('24:00')).toBeNull()
    expect(parseTime('ab')).toBeNull()
    expect(formatTime(450)).toBe('07:30')
    expect(formatTime(-30)).toBe('23:30')
  })
})

describe('reminderSlots', () => {
  it('spreads water inside the waking window and sorts everything by time', () => {
    const s = reminderSlots(settings())
    const water = s.filter((x) => x.type === 'water').map((x) => x.hour)
    expect(water).toEqual([6, 12, 18])
    expect(s.map((x) => `${x.type}@${x.hour}`)).toEqual([
      'water@6',
      'feed@7',
      'water@12',
      'feed@17',
      'water@18',
      'news@20',
    ])
  })

  it('includes the end time when the step lands on it', () => {
    const s = reminderSlots(settings({ water: { on: true, everyHours: 4, from: '06:00', to: '22:00' } }))
    expect(s.filter((x) => x.type === 'water').map((x) => x.hour)).toEqual([6, 10, 14, 18, 22])
  })

  it('gives unique ids and drops switched-off or malformed entries', () => {
    const s = reminderSlots(
      settings({ news: { on: false, time: '20:00' }, feed: { on: true, times: ['07:00', 'x', '07:00'] } }),
    )
    expect(s.some((x) => x.type === 'news')).toBe(false)
    expect(s.filter((x) => x.type === 'feed')).toHaveLength(1)
    expect(new Set(s.map((x) => x.id)).size).toBe(s.length)
  })

  it('returns nothing for a reversed window', () => {
    const s = reminderSlots(
      settings({ water: { on: true, everyHours: 4, from: '22:00', to: '06:00' }, feed: { on: false, times: [] }, news: { on: false, time: '' } }),
    )
    expect(s).toEqual([])
  })
})

describe('nextReminder', () => {
  const slots = reminderSlots(settings())
  it('finds the next slot today', () => {
    const r = nextReminder(slots, new Date(2026, 10, 13, 12, 30))
    expect(r?.slot.type).toBe('feed')
    expect(r?.at.getHours()).toBe(17)
  })
  it('rolls over to tomorrow after the last slot', () => {
    const r = nextReminder(slots, new Date(2026, 10, 13, 21, 0))
    expect(r?.at.getDate()).toBe(14)
    expect(r?.at.getHours()).toBe(6)
  })
  it('is null with no slots', () => {
    expect(nextReminder([], new Date())).toBeNull()
  })
})

describe('dueReminders', () => {
  const slots = reminderSlots(settings())
  it('returns only the latest due slot per type', () => {
    const now = new Date(2026, 10, 13, 18, 30)
    const due = dueReminders(slots, new Date(2026, 10, 13, 16, 0), now)
    expect(due.map((x) => `${x.type}@${x.hour}`)).toEqual(['feed@17', 'water@18'])
  })
  it('ignores slots older than the max age', () => {
    const now = new Date(2026, 10, 13, 18, 30)
    const due = dueReminders(slots, new Date(2026, 10, 12, 0, 0), now, 1)
    expect(due.map((x) => x.type)).toEqual(['water'])
  })
  it('does not repeat what was already checked', () => {
    const now = new Date(2026, 10, 13, 18, 30)
    expect(dueReminders(slots, new Date(2026, 10, 13, 18, 15), now)).toEqual([])
  })
})

describe('v3.1 check reminders', () => {
  const full = settings({
    temp: { on: true, times: ['08:00', '14:00'] },
    activity: { on: true, times: ['09:00'] },
    eggs: { on: true, times: ['10:30', '16:00'] },
    litter: { on: true, times: ['18:30'] },
  })

  it('adds temperature, activity, egg and litter slots with their own id ranges', () => {
    const s = reminderSlots(full)
    expect(s.filter((x) => x.type === 'temp').map((x) => x.id)).toEqual([4000, 4001])
    expect(s.find((x) => x.type === 'eggs' && x.hour === 10)?.minute).toBe(30)
    expect(s.map((x) => reminderTypeOf(x.id))).toEqual(s.map((x) => x.type))
    expect(new Set(s.map((x) => x.id)).size).toBe(s.length)
  })

  it('leaves out a type that does not apply to the birds kept', () => {
    const s = reminderSlots(full, { eggs: false })
    expect(s.some((x) => x.type === 'eggs')).toBe(false)
    expect(s.some((x) => x.type === 'temp')).toBe(true)
  })

  it('knows which type an id belongs to', () => {
    expect(reminderTypeOf(1002)).toBe('water')
    expect(reminderTypeOf(7000)).toBe('litter')
    expect(reminderTypeOf(20000)).toBeUndefined()
  })
})
