import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { DayPlan } from '../calc/cycle'
import type { Alert } from '../calc/metrics'
import type { SpeciesData } from '../data/schema'
import { RULES } from '../data/rules'
import { t, lt } from '../i18n'
import { num, range } from '../i18n/format'
import { Icon } from '../ui/Icon'
import { Badge, Card, cx, SourceNote, Stat, Why } from '../ui/kit'
import { toggleTask } from '../db/repo'

export function alertText(a: Alert): string {
  const p = num(a.pct, a.kind === 'firstWeek' ? 1 : 0)
  switch (a.kind) {
    case 'weightLow':
      return t('alert.weightLow', { p })
    case 'weightHigh':
      return t('alert.weightHigh', { p })
    case 'feedLow':
      return t('alert.feedLow', { p })
    case 'feedHigh':
      return t('alert.feedHigh', { p })
    case 'mortalityDay':
      return t('alert.mortalityDay', { p: num(a.pct, 1) })
    case 'firstWeek':
      return t('alert.firstWeek', { p, max: num(a.max, 1) })
    case 'noLog':
      return t('alert.noLog')
  }
}

export function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <div
          key={a.kind}
          role="alert"
          className={cx(
            'flex gap-2 rounded-xl border p-3 text-sm font-semibold leading-relaxed',
            a.severity === 'urgent' ? 'border-danger/30 bg-danger-soft text-danger' : 'border-warn/30 bg-warn-soft text-warn',
          )}
        >
          <Icon name="alert" size={20} className="mt-0.5 shrink-0" />
          <span>{alertText(a)}</span>
        </div>
      ))}
    </div>
  )
}

/** Grid of the day's targets with one-line "why" explanations. */
export function DayTargets({ sp, plan }: { sp: SpeciesData; plan: DayPlan }) {
  if (plan.isPrep) return null
  const env = sp.environment
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {plan.temperature && (
          <Stat
            icon="thermo"
            label={t('target.temp')}
            value={num(plan.temperature.value)}
            unit={t('common.c')}
            hint={plan.spotTemperature ? `${t('target.spotTemp')}: ${num(plan.spotTemperature.value)}${t('common.c')}` : undefined}
          />
        )}
        {plan.humidity && <Stat icon="humidity" label={t('target.rh')} value={range(plan.humidity)} unit={t('common.pct')} />}
        {plan.lightHours !== undefined && (
          <Stat
            icon="sun"
            label={t('target.light')}
            value={num(plan.lightHours)}
            unit={t('common.hours')}
            hint={`${num(plan.lightLux)} ${t('common.lux')}`}
          />
        )}
        {plan.feedPhase && (
          <Stat
            icon="feed"
            label={`${t('target.feed')} — ${lt(plan.feedPhase.name)}`}
            value={num(plan.feedKgFlock, plan.feedKgFlock! < 10 ? 1 : 0)}
            unit={t('common.kg')}
            hint={t('target.feedPerBird', { g: num(plan.feedGPerBird) })}
          />
        )}
        {plan.waterLFlock !== undefined && (
          <Stat icon="drop" label={t('target.water')} value={num(plan.waterLFlock, plan.waterLFlock < 10 ? 1 : 0)} unit={t('common.l')} />
        )}
        {plan.targetWeightG && <Stat icon="scale" label={t('target.weight')} value={num(plan.targetWeightG.value)} unit={t('common.g')} />}
      </div>
      <Why>{t('target.why.temp')}</Why>
      <Why>
        {t('target.why.feed')} {t('target.why.water', { r: num(sp.growth.waterToFeedRatio.value, 1) })}
      </Why>
      <Why>{t('target.why.weight', { p: RULES.deviation.weightPct })}</Why>
      <div className="flex flex-wrap gap-x-4">
        <SourceNote item={env.temperature} />
        <SourceNote item={sp.growth.bodyWeight} />
        <SourceNote item={sp.growth.waterToFeedRatio} />
      </div>
    </div>
  )
}

/** Today's tasks + vaccinations, checkable when a flock id is given. */
export function TaskList({
  plan,
  flockId,
  done,
  showDaily = true,
}: {
  plan: DayPlan
  flockId?: number
  done?: Set<string>
  showDaily?: boolean
}) {
  const tasks = showDaily ? plan.tasks : plan.tasks.filter((x) => !x.daily)
  if (tasks.length === 0 && plan.vaccinations.length === 0) {
    return <p className="text-muted">{t('home.noTasks')}</p>
  }
  return (
    <ul className="space-y-2">
      {plan.vaccinations.map((v) => (
        <li key={v.id} className="rounded-xl border border-primary/30 bg-primary-soft p-3">
          <div className="flex items-center gap-2 font-bold text-primary">
            <Icon name="syringe" size={20} />
            {t('target.vaccine')}: {lt(v.disease)}
          </div>
          <div className="mt-1 text-sm">
            {lt(v.vaccine)} — {t(`library.route.${v.route}`)}
          </div>
          {v.note && <div className="mt-1 text-sm text-muted">{lt(v.note)}</div>}
          <div className="mt-2 text-xs font-semibold text-muted">{t('vet.warning')}</div>
          <SourceNote item={v} />
        </li>
      ))}
      {tasks.map((task) => {
        const isDone = done?.has(task.id) ?? false
        const content = (
          <>
            <span
              className={cx(
                'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2',
                isDone ? 'border-leaf bg-leaf text-white' : 'border-line',
              )}
            >
              {isDone && <Icon name="check" size={18} />}
            </span>
            <span className="min-w-0 flex-1 text-start">
              <span className={cx('block font-bold', isDone && 'text-muted line-through')}>{lt(task.title)}</span>
              {task.detail && <span className="block text-sm text-muted">{lt(task.detail)}</span>}
            </span>
            {task.daily && <Badge>{t('common.daily')}</Badge>}
          </>
        )
        return (
          <li key={task.id}>
            {flockId ? (
              <button
                type="button"
                role="checkbox"
                aria-checked={isDone}
                className="flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-3"
                onClick={() => void toggleTask(flockId, plan.day, task.id)}
              >
                {content}
              </button>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function SignsList({ plan }: { plan: DayPlan }) {
  if (plan.signs.length === 0) return null
  return (
    <ul className="space-y-1.5">
      {plan.signs.map((s, i) => (
        <li key={i} className={cx('flex gap-2 text-sm', s.severity === 'urgent' ? 'font-bold text-danger' : '')}>
          <Icon name="alert" size={16} className="mt-1 shrink-0" />
          {lt(s.text)}
        </li>
      ))}
    </ul>
  )
}

export function KeyValue({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/60 py-2 last:border-0">
      <span className="text-muted">{k}</span>
      <span className="num text-end font-bold">{v}</span>
    </div>
  )
}

export function LinkCard({ to, icon, title, sub }: { to: string; icon: Parameters<typeof Icon>[0]['name']; title: string; sub?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm active:bg-surface-2">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-primary">
        <Icon name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        {sub && <span className="block truncate text-sm text-muted">{sub}</span>}
      </span>
      <Icon name="chevron" className="text-muted" />
    </Link>
  )
}

export { Card }
