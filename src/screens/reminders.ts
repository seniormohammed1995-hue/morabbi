import { db } from '../db'
import { getSpecies } from '../data'
import { ageOn, todayISO } from '../calc/dates'
import { dayPlan } from '../calc/cycle'
import { notifications } from '../platform'
import { t, lt } from '../i18n'

/** Key events for a day: one-off tasks and vaccinations (not the daily routine). */
export async function keyEventsToday(): Promise<string[]> {
  const today = todayISO()
  const flocks = await db.flocks.where('status').equals('active').toArray()
  const lines: string[] = []
  for (const f of flocks) {
    const sp = getSpecies(f.speciesId)
    if (!sp) continue
    const age = ageOn(f.placementDate, today)
    const plan = dayPlan(sp.data, sp.cycle, age, f.initialCount)
    const items = [
      ...plan.vaccinations.map((v) => `💉 ${lt(v.disease)}`),
      ...plan.tasks.filter((x) => !x.daily).map((x) => lt(x.title)),
    ]
    if (items.length) lines.push(`${f.name}: ${items.join('، ')}`)
  }
  return lines
}

/** Shows one notification per day (on app open) listing today's key events. */
export async function runDailyReminder(): Promise<void> {
  if (notifications.state() !== 'granted') return
  const today = todayISO()
  const key = 'last-reminder'
  const last = await db.kv.get(key)
  if (last?.value === today) return
  const lines = await keyEventsToday()
  if (lines.length === 0) return
  const shown = await notifications.show(t('notify.title'), lines.join('\n'), `daily-${today}`)
  if (shown) await db.kv.put({ key, value: today })
}
