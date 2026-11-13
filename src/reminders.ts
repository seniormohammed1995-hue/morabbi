import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { RULES } from './data/rules'
import {
  dueReminders,
  reminderSlots,
  type ReminderSettings,
  type ReminderSlot,
  type ReminderType,
} from './calc/reminders'
import { device, isNative, notifications, prefs } from './platform'
import { t } from './i18n'
import { toast } from './ui/kit'

const KV = 'reminders'
const LAST_CHECK = 'morabbi-reminder-check'

export const DEFAULT_REMINDERS: ReminderSettings = {
  water: {
    on: true,
    everyHours: RULES.reminders.waterEveryHours,
    from: RULES.reminders.dayStart,
    to: RULES.reminders.dayEnd,
  },
  feed: { on: true, times: [...RULES.reminders.feedTimes] },
  news: { on: true, time: RULES.reminders.newsTime },
}

/** Ids 1000–3999 belong to the repeating reminders (see calc/reminders). */
export const isReminderId = (id: number): boolean => id >= 1000 && id < 4000

export async function getReminderSettings(): Promise<ReminderSettings> {
  const v = (await db.kv.get(KV))?.value as Partial<ReminderSettings> | undefined
  return { ...DEFAULT_REMINDERS, ...(v ?? {}) }
}

export function useReminderSettings(): ReminderSettings | undefined {
  return useLiveQuery(getReminderSettings, [])
}

export async function saveReminderSettings(s: ReminderSettings): Promise<void> {
  await db.kv.put({ key: KV, value: s })
  await applyReminders()
}

export const reminderText = (type: ReminderType) => ({
  title: t(`rem.${type}.title`),
  body: t(`rem.${type}.body`),
})

/** Android: (re)schedules the repeating reminders so they fire with the app closed. */
export async function applyReminders(): Promise<boolean> {
  if (!isNative()) return false
  const slots = reminderSlots(await getReminderSettings())
  return notifications.scheduleDaily(
    slots.map((s) => ({ id: s.id, hour: s.hour, minute: s.minute, ...reminderText(s.type) })),
    isReminderId,
  )
}

/** Route to open when a reminder is tapped. */
export function reminderRoute(id: number): string {
  if (id >= 3000 && id < 4000) return '/journal'
  return '/'
}

/**
 * Web only: nothing runs while a web app is closed, so while it is open we check every minute
 * and show the latest reminder that fell due since the last check.
 */
export async function webReminderTick(now = new Date()): Promise<ReminderSlot[]> {
  if (isNative()) return []
  const last = Number(prefs.get(LAST_CHECK) ?? 0)
  prefs.set(LAST_CHECK, String(now.getTime()))
  if (!last) return []
  const due = dueReminders(reminderSlots(await getReminderSettings()), new Date(last), now)
  for (const s of due) {
    const { title, body } = reminderText(s.type)
    const shown = await notifications.show(title, body, `rem-${s.type}`)
    if (!shown || document.visibilityState === 'visible') toast(`${title} — ${body}`)
  }
  if (due.length) device.chime('alert')
  return due
}
