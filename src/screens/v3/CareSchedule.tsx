import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { RULES } from '../../data/rules'
import { daysBetween, todayISO } from '../../calc/dates'
import { daySchedule, type DayLine } from '../../reminders'
import { t } from '../../i18n'
import { dateLong, num } from '../../i18n/format'
import { Icon, type IconName } from '../../ui/Icon'
import { Card, cx, EmptyState, Page, PageHeader } from '../../ui/kit'

export const LINE_ICON: Record<DayLine['type'], IconName> = {
  vaccine: 'syringe',
  feed: 'feed',
  climate: 'thermo',
  task: 'check',
  endpoint: 'star',
  brood: 'hatch',
  withdrawal: 'medkit',
}

/** "النهارده" / "بكرة" / "بعد ٣ يوم". */
export function dayLabel(date: string, today: string): string {
  const d = daysBetween(today, date)
  return d === 0 ? t('care.today') : d === 1 ? t('care.tomorrow') : t('care.in', { n: num(d) })
}

/** Everything coming up for the user's birds, day by day. */
export default function CareSchedule() {
  const today = todayISO()
  const days = RULES.reminders.scheduleDays
  const schedule = useLiveQuery(() => daySchedule(days, today), [today])

  return (
    <Page>
      <PageHeader title={t('care.title')} subtitle={t('care.sub', { n: num(days) })} back />
      {schedule && schedule.length === 0 && (
        <EmptyState icon="calendar" title={t('care.empty.title')} body={t('care.empty.body')} />
      )}
      <ol className="space-y-4">
        {schedule?.map((day) => (
          <li key={day.date}>
            <h2 className="mb-2 flex items-baseline gap-2">
              <span
                className={cx(
                  'rounded-full px-3 py-1 text-sm font-extrabold',
                  day.date === today ? 'bg-primary text-white' : 'bg-primary-soft text-primary',
                )}
              >
                {dayLabel(day.date, today)}
              </span>
              <span className="text-sm text-muted">{dateLong(day.date)}</span>
            </h2>
            <ul className="space-y-2">
              {day.lines.map((l, i) => (
                <DayLineRow key={i} line={l} />
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {schedule?.some((d) => d.lines.some((l) => l.type === 'vaccine')) && (
        <Card tone="warn" className="mt-5">
          <p className="text-sm font-semibold">{t('care.vetNote')}</p>
        </Card>
      )}
      <Link to="/reminders" className="mt-5 inline-flex items-center gap-1 font-bold text-primary">
        <Icon name="bell" size={18} /> {t('care.setup')}
      </Link>
    </Page>
  )
}

export function DayLineRow({ line }: { line: DayLine }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3">
      <span
        className={cx(
          'grid h-10 w-10 shrink-0 place-items-center rounded-full',
          line.type === 'vaccine' || line.type === 'withdrawal'
            ? 'bg-danger-soft text-danger'
            : 'bg-accent-soft text-primary',
        )}
      >
        <Icon name={LINE_ICON[line.type]} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-bold">{line.text}</div>
        {line.who && <div className="text-sm text-muted">{line.who}</div>}
      </div>
    </li>
  )
}
