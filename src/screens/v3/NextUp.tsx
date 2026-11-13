import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { nextReminder, reminderSlots } from '../../calc/reminders'
import { withdrawalStatus } from '../../calc/care'
import { todayISO } from '../../calc/dates'
import { useTreatments } from '../../db/treatments'
import {
  applicable,
  daySchedule,
  reminderText,
  useCareContext,
  useReminderSettings,
} from '../../reminders'
import { t } from '../../i18n'
import { clock } from '../../i18n/format'
import { Icon } from '../../ui/Icon'
import { SectionTitle } from '../../ui/kit'
import { dayLabel, LINE_ICON } from './CareSchedule'

const SOON_DAYS = 7
const SOON_LINES = 3

/** Home card: the next reminder, medicines still in withdrawal, and what is coming this week. */
export function NextUp() {
  const today = todayISO()
  const [now] = useState(() => new Date())
  const settings = useReminderSettings()
  const ctx = useCareContext()
  const treatments = useTreatments()
  const soon = useLiveQuery(() => daySchedule(SOON_DAYS, today), [today])

  const next = settings && ctx ? nextReminder(reminderSlots(settings, applicable(ctx)), now) : null
  const active = (treatments ?? []).filter((tr) => withdrawalStatus(tr, today).active)
  const lines = (soon ?? [])
    .flatMap((d) => d.lines.map((l) => ({ ...l, date: d.date })))
    .slice(0, SOON_LINES)

  return (
    <section aria-labelledby="next-h" className="space-y-2">
      <Link
        to="/reminders"
        className="flex items-center gap-3 rounded-2xl bg-primary-soft p-3 text-primary"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface">
          <Icon name="bell" />
        </span>
        <span className="min-w-0 flex-1">
          <span id="next-h" className="block text-sm font-semibold">
            {t('care.next')}
          </span>
          <span className="block truncate font-extrabold">
            {next ? `${reminderText(next.slot.type).title} — ${clock(next.at)}` : t('rem.none')}
          </span>
        </span>
        <Icon name="chevron" size={18} />
      </Link>

      {active.map((tr) => (
        <Link
          key={tr.id}
          to="/treatments"
          className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-3 font-bold text-danger"
        >
          <Icon name="medkit" />
          <span className="min-w-0 flex-1 truncate">{t('tr.home', { name: tr.name })}</span>
          <Icon name="chevron" size={18} />
        </Link>
      ))}

      {lines.length > 0 && (
        <div>
          <SectionTitle icon="calendar">{t('care.soon')}</SectionTitle>
          <ul className="space-y-2">
            {lines.map((l, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-primary">
                  <Icon name={LINE_ICON[l.type]} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{l.text}</span>
                  <span className="block truncate text-sm text-muted">
                    {dayLabel(l.date, today)}
                    {l.who && ` · ${l.who}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <Link
            to="/schedule"
            className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary"
          >
            {t('care.all')} <Icon name="chevron" size={14} />
          </Link>
        </div>
      )}
    </section>
  )
}
