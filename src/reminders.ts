/**
 * The reminder scheduler (v3.1). Turns the user's settings and the birds they keep into:
 *  - repeating daily reminders (water, feed, temperature, activity, eggs, litter, flock news),
 *  - one morning digest per day of age-based events (feed change, warmth step, tasks,
 *    vaccinations, sitting checks, end of a medicine withdrawal period),
 *  - heat and cold alerts scheduled ahead from the forecast.
 * On Android everything is handed to the system so it fires with the app closed; on the web
 * the same things are checked every minute while the app is open.
 */
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Flock } from './db'
import { getKinds } from './db/birds'
import { markRoutine } from './db/routine'
import { getSpecies } from './data'
import { getProfile } from './data/birds'
import { CARE_TIPS, HEAT_POSTPONE_VACCINE, type CareReminder } from './data/care'
import { RULES } from './data/rules'
import type { BirdKind, BirdProfile, Place } from './data/schema'
import { ALERT_ADVICE, WEATHER } from './data/weather'
import { broodState } from './calc/brood'
import { careEvents, withdrawalStatus, type CareEvent, type CareGroup } from './calc/care'
import { addDays, ageOn, todayISO } from './calc/dates'
import {
  dueReminders,
  parseTime,
  reminderSlots,
  reminderTypeOf,
  type ReminderSettings,
  type ReminderSlot,
  type ReminderType,
} from './calc/reminders'
import { isLaying } from './calc/routine'
import { alertNotifyAt, alertsAhead, isYoung, type WeatherAlert } from './calc/weather'
import {
  device,
  isNative,
  notifications,
  prefs,
  type DailyNotification,
  type NotificationTap,
  type TimedNotification,
} from './platform'
import type { Forecast } from './platform/weather'
import { getAlertPrefs, shownToday } from './store/weather'
import { lt, t } from './i18n'
import { num } from './i18n/format'
import { toast } from './ui/kit'

const KV = 'reminders'
const KV_WEATHER = 'weather-scheduled'
const KV_DIGEST = 'care-digest-last'
const LAST_CHECK = 'morabbi-reminder-check'

/** Notification id ranges. 1000–7999 daily reminders (calc/reminders), then the one-off ones. */
const DIGEST_BASE = 20_000
const WEATHER_BASE = 30_000
const SNOOZE_BASE = 40_000
/** Everything the scheduler replaces on each run (snoozed reminders are left alone). */
export const isScheduledId = (id: number): boolean => id >= 1000 && id < SNOOZE_BASE

const R = RULES.reminders

export const DEFAULT_REMINDERS: ReminderSettings = {
  water: { on: true, everyHours: R.waterEveryHours, from: R.dayStart, to: R.dayEnd },
  feed: { on: true, times: [...R.feedTimes] },
  news: { on: true, time: R.newsTime },
  temp: { on: true, times: [...R.tempTimes] },
  activity: { on: true, times: [...R.activityTimes] },
  eggs: { on: true, times: [...R.eggsTimes] },
  litter: { on: true, times: [...R.litterTimes] },
  digest: { on: true, time: R.digestTime },
  weather: { on: true },
}

/** Settings saved by v3.0 have no v3.1 keys: every missing one takes its default. */
export async function getReminderSettings(): Promise<ReminderSettings> {
  const v = ((await db.kv.get(KV))?.value ?? {}) as Partial<ReminderSettings>
  const out = { ...DEFAULT_REMINDERS }
  for (const k of Object.keys(DEFAULT_REMINDERS) as Array<keyof ReminderSettings>)
    if (v[k]) Object.assign(out, { [k]: { ...DEFAULT_REMINDERS[k], ...v[k] } })
  return out
}

export function useReminderSettings(): ReminderSettings | undefined {
  return useLiveQuery(getReminderSettings, [])
}

export async function saveReminderSettings(s: ReminderSettings): Promise<void> {
  await db.kv.put({ key: KV, value: s })
  await applyReminders()
}

// ---------- The birds the reminders are about ----------

export interface CareContext {
  groups: Array<CareGroup & { name: string; kind: BirdKind; place: Place; flock: Flock }>
  kinds: BirdKind[]
  hasLaying: boolean
  hasYoung: boolean
}

/** Active groups of the kinds the user keeps, with what the reminders need to know about them. */
export async function careContext(today = todayISO()): Promise<CareContext> {
  const kept = await getKinds()
  const flocks = (await db.flocks.where('status').equals('active').toArray()).filter((f) =>
    kept.includes(f.kind),
  )
  const groups = flocks
    .map((f) => ({ f, p: getProfile(f.profileId) }))
    .filter((x): x is { f: Flock; p: BirdProfile } => !!x.p)
    .map(({ f, p }) => ({
      id: f.id,
      name: f.name,
      kind: p.kind,
      place: f.place,
      flock: f,
      profile: p,
      age: Math.max(0, ageOn(f.placementDate, today)),
      vaccinations: getSpecies(f.speciesId)?.data.health.vaccinations ?? p.health.vaccinations,
    }))
  return {
    groups,
    kinds: [...new Set(groups.map((g) => g.kind))],
    hasLaying: groups.some((g) =>
      isLaying({ ...g, purpose: g.flock.purpose, count: g.flock.initialCount }),
    ),
    hasYoung: groups.some((g) => isYoung(g.profile, g.age)),
  }
}

export function useCareContext(): CareContext | undefined {
  return useLiveQuery(() => careContext(), [])
}

/** Egg collection only makes sense with laying birds. With no birds yet, everything applies. */
export const applicable = (ctx: CareContext): Partial<Record<ReminderType, boolean>> => ({
  eggs: ctx.groups.length === 0 || ctx.hasLaying,
})

// ---------- Texts ----------

const MAX_KIND_TIPS = 2

/** Title and body of a daily reminder, with the tips that fit the kinds kept. */
export function reminderText(
  type: ReminderType,
  ctx?: CareContext,
): { title: string; body: string } {
  const title = t(`rem.${type}.title`)
  if (type === 'news') return { title, body: t('rem.news.body') }
  const tip = CARE_TIPS[type as CareReminder]
  const lines = [lt((ctx?.hasYoung && tip.young ? tip.young : tip.general).text)]
  for (const kind of ctx?.kinds ?? []) {
    const extra = tip.byKind?.[kind]
    if (extra && lines.length <= MAX_KIND_TIPS) lines.push(lt(extra.text))
  }
  return { title, body: lines.join('\n') }
}

/** One line for an age-based event. */
export function careEventText(e: CareEvent): string {
  switch (e.type) {
    case 'feed':
      return t('care.ev.feed', { feed: lt(e.phase.name) })
    case 'climate':
      return t('care.ev.climate', {
        min: num(e.band.comfortMin.value),
        max: num(e.band.comfortMax.value),
      })
    case 'task':
      return lt(e.task.title)
    case 'vaccine':
      return t('care.ev.vaccine', { disease: lt(e.vaccination.disease) })
    case 'endpoint':
      return t(`care.ev.endpoint.${e.endpoint}`)
  }
}

export interface DayLine {
  /** What kind of line it is (icon in the schedule screen). */
  type: CareEvent['type'] | 'brood' | 'withdrawal'
  /** Group or medicine the line is about. */
  who: string
  text: string
  groupId?: number
}

/** Everything due on each of the next `days` days: care events, sitting checks, withdrawal ends. */
export async function daySchedule(
  days: number,
  today = todayISO(),
): Promise<Array<{ date: string; lines: DayLine[] }>> {
  const ctx = await careContext(today)
  const nameOf = new Map(ctx.groups.map((g) => [g.id, g.name]))
  const byDay = new Map<string, DayLine[]>()
  const push = (date: string, line: DayLine) => {
    const list = byDay.get(date)
    if (list) list.push(line)
    else byDay.set(date, [line])
  }

  for (const e of careEvents(ctx.groups, today, days))
    push(e.date, {
      type: e.type,
      who: nameOf.get(e.groupId) ?? '',
      text: careEventText(e),
      groupId: e.groupId,
    })

  const last = addDays(today, days - 1)
  for (const b of await db.broods.where('status').equals('sitting').toArray()) {
    const p = getProfile(b.profileId)
    if (!p) continue
    for (const c of p.breeding.checks) {
      const date = addDays(b.startDate, c.day)
      if (date >= today && date <= last)
        push(date, { type: 'brood', who: t('care.brood', { name: lt(p.name) }), text: lt(c.title) })
    }
    const hatch = broodState(b.startDate, today, p.breeding.incubationDays.value, []).hatchDate
    if (hatch >= today && hatch <= last)
      push(hatch, {
        type: 'brood',
        who: t('care.brood', { name: lt(p.name) }),
        text: t('care.hatch'),
      })
  }

  for (const tr of await db.treatments.toArray()) {
    const s = withdrawalStatus(tr, today)
    const who = tr.flockId === undefined ? tr.name : `${tr.name} · ${nameOf.get(tr.flockId) ?? ''}`
    for (const side of ['eggs', 'meat'] as const) {
      const date = s[side]?.safeFrom
      if (date && date >= today && date <= last)
        push(date, { type: 'withdrawal', who, text: t(`care.withdrawal.${side}`) })
    }
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, lines]) => ({ date, lines }))
}

const digestBody = (lines: DayLine[]): string =>
  lines.map((l) => (l.who ? `${l.who}: ${l.text}` : l.text)).join('\n')

// ---------- Scheduling ----------

const atTime = (date: string, hhmm: string): Date => {
  const [y, m, d] = date.split('-').map(Number)
  const min = parseTime(hhmm) ?? 0
  return new Date(y!, m! - 1, d!, Math.floor(min / 60), min % 60)
}

const localIso = (d: Date): string => {
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Heat and cold alerts in the stored forecast that are worth a notification ahead of time. */
async function weatherAhead(ctx: CareContext, now: Date): Promise<WeatherAlert[]> {
  const f = (await db.kv.get('weather-last'))?.value as Forecast | undefined
  if (!f || ctx.groups.length === 0) return []
  const enabled = await getAlertPrefs()
  return alertsAhead(
    f.hourly,
    ctx.groups,
    localIso(now),
    WEATHER,
    RULES.alertWindowHours,
    { gustKmh: RULES.windGustKmh, rainProbPct: RULES.rainProbabilityPct },
    R.weatherDaysAhead,
  ).filter((a) => enabled[a.type])
}

function weatherText(a: WeatherAlert, vaccineToday: boolean): { title: string; body: string } {
  const adv = ALERT_ADVICE[a.type]
  const steps = adv.steps.slice(0, 2).map((s, i) => `${i + 1}. ${lt(s)}`)
  if (a.type === 'heat' && vaccineToday) steps.push(lt(HEAT_POSTPONE_VACCINE.text))
  return { title: lt(adv.title), body: steps.join('\n') }
}

/** Alert ids already handed to the system (so the app does not show them a second time). */
export async function scheduledWeatherIds(): Promise<Set<string>> {
  const v = ((await db.kv.get(KV_WEATHER))?.value ?? {}) as Record<string, number>
  return new Set(Object.keys(v))
}

/**
 * Android: (re)schedules every reminder so it fires with the app closed.
 * Called on start, after the weather refreshes and whenever settings or birds change.
 */
export async function applyReminders(now = new Date()): Promise<boolean> {
  if (!isNative()) return false
  const today = todayISO(now)
  const [s, ctx] = await Promise.all([getReminderSettings(), careContext(today)])

  const daily: DailyNotification[] = reminderSlots(s, applicable(ctx)).map((sl) => ({
    id: sl.id,
    hour: sl.hour,
    minute: sl.minute,
    ...reminderText(sl.type, ctx),
  }))

  const timed: TimedNotification[] = []
  const schedule = await daySchedule(R.digestDaysAhead, today)
  if (s.digest.on) {
    for (const day of schedule) {
      const at = atTime(day.date, s.digest.time)
      if (at <= now) continue
      const offset = Math.round(
        (at.getTime() - atTime(today, s.digest.time).getTime()) / 86_400_000,
      )
      timed.push({
        id: DIGEST_BASE + offset,
        title: t('care.digest.title'),
        body: digestBody(day.lines),
        at,
      })
    }
  }

  if (s.weather.on) {
    const shown = new Set(await shownToday(today))
    const record: Record<string, number> = {}
    const alerts = (await weatherAhead(ctx, now)).filter((a) => !shown.has(a.id))
    alerts.forEach((a, i) => {
      const at = alertNotifyAt(a, now, RULES.heatLeadHours, R.coldNoticeTime)
      const vaccineToday =
        schedule
          .find((d) => d.date === a.at.slice(0, 10))
          ?.lines.some((l) => l.type === 'vaccine') ?? false
      timed.push({ id: WEATHER_BASE + i, ...weatherText(a, vaccineToday), at })
      record[a.id] = at.getTime()
    })
    // Keep recently fired ones so the in-app check does not repeat them.
    const old = ((await db.kv.get(KV_WEATHER))?.value ?? {}) as Record<string, number>
    const keepAfter = now.getTime() - 2 * 86_400_000
    for (const [id, at] of Object.entries(old))
      if (!(id in record) && at <= now.getTime() && at > keepAfter) record[id] = at
    await db.kv.put({ key: KV_WEATHER, value: record })
  }

  return notifications.schedule(daily, timed, isScheduledId)
}

/** Where a tapped notification leads. */
export function reminderRoute(id: number): string {
  if (id >= WEATHER_BASE && id < SNOOZE_BASE) return '/weather'
  if (id >= DIGEST_BASE && id < WEATHER_BASE) return '/schedule'
  switch (reminderTypeOf(id)) {
    case 'news':
      return '/journal'
    case 'eggs':
      return '/eggs'
    case 'temp':
      return '/weather'
    default:
      return '/'
  }
}

/** Home-routine item ticked when a reminder is marked done. */
const ROUTINE_OF: Partial<Record<ReminderType, string>> = {
  water: 'water',
  feed: 'feed',
  eggs: 'eggs',
  activity: 'check',
  litter: 'clean',
}

/** Handles a tap on a notification or on its "done" / "remind me later" buttons (Android). */
export async function handleNotificationTap(
  tap: NotificationTap,
  go: (route: string) => void,
  now = new Date(),
): Promise<void> {
  if (tap.action === 'snooze') {
    const at = new Date(now.getTime() + R.snoozeMinutes * 60_000)
    const id = SNOOZE_BASE + (Math.floor(now.getTime() / 60_000) % 10_000)
    await notifications.scheduleOne({ id, title: tap.title, body: tap.body, at })
    toast(t('rem.snoozed', { n: num(R.snoozeMinutes) }))
    return
  }
  if (tap.action === 'done') {
    const type = reminderTypeOf(tap.id)
    const item = type && ROUTINE_OF[type]
    if (item) await markRoutine(todayISO(now), item)
    toast(t('rem.done'))
    return
  }
  go(reminderRoute(tap.id))
}

/**
 * Web only: nothing runs while a web app is closed, so while it is open we check every minute
 * and show the latest reminder of each type that fell due since the last check.
 */
export async function webReminderTick(now = new Date()): Promise<ReminderSlot[]> {
  if (isNative()) return []
  const last = Number(prefs.get(LAST_CHECK) ?? 0)
  prefs.set(LAST_CHECK, String(now.getTime()))
  if (!last) return []
  const [s, ctx] = await Promise.all([getReminderSettings(), careContext(todayISO(now))])
  const due = dueReminders(reminderSlots(s, applicable(ctx)), new Date(last), now)
  for (const sl of due) {
    const { title, body } = reminderText(sl.type, ctx)
    const shown = await notifications.show(title, body, `rem-${sl.type}`)
    if (!shown || document.visibilityState === 'visible') toast(`${title} — ${body.split('\n')[0]}`)
  }
  if (due.length) device.chime('alert')
  return due
}

/**
 * Web only: today's digest, once a day, the first time the app is open after the digest time.
 * (Android gets it from the system at the digest time.)
 */
export async function runCareDigest(now = new Date()): Promise<boolean> {
  if (isNative()) return false
  const today = todayISO(now)
  const s = await getReminderSettings()
  if (!s.digest.on || now < atTime(today, s.digest.time)) return false
  if ((await db.kv.get(KV_DIGEST))?.value === today) return false
  const lines = (await daySchedule(1, today))[0]?.lines ?? []
  if (lines.length === 0) return false
  await db.kv.put({ key: KV_DIGEST, value: today })
  const shown = await notifications.show(
    t('care.digest.title'),
    digestBody(lines),
    `digest-${today}`,
  )
  if (!shown) toast(`${t('care.digest.title')} — ${digestBody(lines).split('\n')[0]}`)
  return true
}
