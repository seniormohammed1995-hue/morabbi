/**
 * Repeating daily reminders as pure functions: water, feed, flock news (v3.0) and
 * temperature, activity, egg collection and litter checks (v3.1).
 * The platform layer turns the daily slots into repeating notifications (Android)
 * or checks them while the app is open (web).
 */

export type ReminderType = 'water' | 'feed' | 'news' | 'temp' | 'activity' | 'eggs' | 'litter'

/** Reminder types that are a list of clock times. */
export type TimedType = 'feed' | 'temp' | 'activity' | 'eggs' | 'litter'
export const TIMED_TYPES: TimedType[] = ['feed', 'temp', 'activity', 'eggs', 'litter']

export interface TimesSetting {
  on: boolean
  times: string[]
}

export interface ReminderSettings {
  water: { on: boolean; everyHours: number; from: string; to: string }
  feed: TimesSetting
  news: { on: boolean; time: string }
  temp: TimesSetting
  activity: TimesSetting
  eggs: TimesSetting
  litter: TimesSetting
  /** One morning notification listing today's age-based events. */
  digest: { on: boolean; time: string }
  /** Heat and cold alerts scheduled ahead from the forecast. */
  weather: { on: boolean }
}

export interface ReminderSlot {
  /** Stable numeric id (Android notification ids must be 32-bit ints). */
  id: number
  type: ReminderType
  hour: number
  minute: number
}

/** Id ranges: one thousand per type, 1000–7999 in all. */
const TYPE_BASE: Record<ReminderType, number> = {
  water: 1000,
  feed: 2000,
  news: 3000,
  temp: 4000,
  activity: 5000,
  eggs: 6000,
  litter: 7000,
}

export const reminderTypeOf = (id: number): ReminderType | undefined =>
  (Object.keys(TYPE_BASE) as ReminderType[]).find(
    (k) => id >= TYPE_BASE[k] && id < TYPE_BASE[k] + 1000,
  )

/** "HH:MM" → minutes after midnight, or null when malformed. */
export function parseTime(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

export function formatTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

const slot = (type: ReminderType, index: number, minutes: number): ReminderSlot => ({
  id: TYPE_BASE[type] + index,
  type,
  hour: Math.floor(minutes / 60),
  minute: minutes % 60,
})

/**
 * Daily reminder times, sorted by time of day.
 * Water: from `from` every `everyHours` while still at or before `to` (no reminders at night).
 * `applicable` switches a type off when it makes no sense for the birds kept
 * (egg collection with no laying birds).
 */
export function reminderSlots(
  s: ReminderSettings,
  applicable: Partial<Record<ReminderType, boolean>> = {},
): ReminderSlot[] {
  const out: ReminderSlot[] = []
  if (s.water.on && s.water.everyHours > 0 && applicable.water !== false) {
    const from = parseTime(s.water.from)
    const to = parseTime(s.water.to)
    if (from !== null && to !== null && to >= from) {
      const step = Math.round(s.water.everyHours * 60)
      for (let m = from, i = 0; m <= to; m += step, i++) out.push(slot('water', i, m))
    }
  }
  for (const type of TIMED_TYPES) {
    const set = s[type]
    if (!set.on || applicable[type] === false) continue
    const times = [...new Set(set.times.map(parseTime).filter((m): m is number => m !== null))]
    times.sort((a, b) => a - b).forEach((m, i) => out.push(slot(type, i, m)))
  }
  if (s.news.on) {
    const m = parseTime(s.news.time)
    if (m !== null) out.push(slot('news', 0, m))
  }
  return out.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute) || a.id - b.id)
}

const at = (base: Date, dayOffset: number, sl: ReminderSlot): Date =>
  new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, sl.hour, sl.minute)

/** The next reminder strictly after `now` (looks at most one day ahead). */
export function nextReminder(
  slots: ReminderSlot[],
  now: Date,
): { slot: ReminderSlot; at: Date } | null {
  for (const d of [0, 1]) {
    for (const sl of slots) {
      const when = at(now, d, sl)
      if (when > now) return { slot: sl, at: when }
    }
  }
  return null
}

/**
 * Reminders that fell due after `since` and up to `now` — for the web, where nothing runs while
 * the app is closed. Only the latest one per type is returned (no pile of stale notifications),
 * and nothing older than `maxAgeHours`.
 */
export function dueReminders(
  slots: ReminderSlot[],
  since: Date,
  now: Date,
  maxAgeHours = 3,
): ReminderSlot[] {
  const floor = Math.max(since.getTime(), now.getTime() - maxAgeHours * 3_600_000)
  const latest = new Map<ReminderType, { sl: ReminderSlot; t: number }>()
  for (const d of [-1, 0]) {
    for (const sl of slots) {
      const t = at(now, d, sl).getTime()
      if (t > floor && t <= now.getTime()) {
        const cur = latest.get(sl.type)
        if (!cur || t > cur.t) latest.set(sl.type, { sl, t })
      }
    }
  }
  return [...latest.values()].sort((a, b) => a.t - b.t).map((x) => x.sl)
}
