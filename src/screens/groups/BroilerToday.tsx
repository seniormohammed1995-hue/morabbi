import { useNavigate } from 'react-router-dom'
import { useFlockView, useTasksDone, useVaccinesDone } from '../../db/hooks'
import { vaccineStatus } from '../../calc/health'
import { RULES } from '../../data/rules'
import { dayPlan } from '../../calc/cycle'
import { marketAgeDays } from '../../calc/planner'
import { t, lt } from '../../i18n'
import { num } from '../../i18n/format'
import { Icon } from '../../ui/Icon'
import { Badge, Button, Card, SectionTitle } from '../../ui/kit'
import { AlertList, DayTargets, LinkCard, SignsList, TaskList } from '../parts'

/** v1 detailed day view for white broilers (targets, cycle tasks, logs, planner links). */
export function BroilerToday({ id }: { id: number }) {
  const view = useFlockView(id)
  const age = view?.age ?? 0
  const done = useTasksDone(id, age)
  const vacDone = useVaccinesDone(id)
  const nav = useNavigate()
  if (!view) return null
  const { flock, species, metrics, today, logs } = view
  const sp = species.data
  const plan = dayPlan(sp, species.cycle, age, metrics.alive, flock.length * flock.width)
  const loggedToday = logs.some((l) => l.date === today)
  const market = marketAgeDays(sp)
  const overdue = vaccineStatus(
    sp.health.vaccinations,
    age,
    vacDone ?? new Set(),
    RULES.vaccineSoonDays,
  ).filter((v) => v.state === 'overdue')

  return (
    <div className="space-y-4">
      <Card tone="accent">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-extrabold">{flock.name}</h2>
              {flock.isDemo && <Badge tone="primary">{t('common.demo')}</Badge>}
            </div>
            <div className="text-sm text-muted">{lt(sp.name)}</div>
          </div>
          <div className="text-end">
            <div className="num text-3xl font-extrabold text-primary">
              {age < 0 ? num(-age) : num(age)}
            </div>
            <div className="text-xs font-semibold text-muted">
              {age < 0
                ? t('common.toArrival')
                : age === 0
                  ? t('common.placementDay')
                  : t('common.dayOfAge')}
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {plan.stage && <Badge tone="primary">{lt(plan.stage.name)}</Badge>}
          {age >= 0 && (
            <Badge tone="leaf">
              {num(metrics.alive)} {t('flocks.alive')}
            </Badge>
          )}
        </div>
        {age < 0 && (
          <p className="mt-2 font-semibold">{t('home.beforeArrival', { n: num(-age) })}</p>
        )}
        {age > market && (
          <p className="mt-2 text-sm font-semibold text-warn">
            {t('home.afterMarket', { n: num(market) })}
          </p>
        )}
      </Card>

      {age >= 0 && (
        <Button
          full
          icon={loggedToday ? 'check' : 'plus'}
          variant={loggedToday ? 'secondary' : 'primary'}
          onClick={() => nav(`/flocks/${id}/log?date=${today}`)}
        >
          {loggedToday ? t('home.logged') : t('home.quickLog')}
        </Button>
      )}

      {age >= 0 && <AlertList alerts={metrics.alerts} />}
      {vacDone &&
        overdue.map((v) => (
          <button
            key={v.vaccination.id}
            type="button"
            onClick={() => nav(`/health?flock=${id}&tab=vaccines`)}
            className="flex w-full gap-2 rounded-xl border border-danger/30 bg-danger-soft p-3 text-start text-sm font-semibold text-danger"
          >
            <Icon name="syringe" size={20} className="mt-0.5 shrink-0" />
            {t('alert.vaccineOverdue', { name: lt(v.vaccination.disease), n: num(-v.daysUntil) })}
          </button>
        ))}

      <section>
        <SectionTitle icon="check">{t('home.tasks')}</SectionTitle>
        <TaskList plan={plan} flockId={id} done={done} />
      </section>

      {!plan.isPrep && (
        <section>
          <SectionTitle icon="thermo">{t('home.targets')}</SectionTitle>
          <DayTargets sp={sp} plan={plan} />
        </section>
      )}

      {plan.signs.length > 0 && (
        <Card tone="warn">
          <h3 className="mb-2 font-bold">{t('home.watch')}</h3>
          <SignsList plan={plan} />
        </Card>
      )}

      <div className="grid gap-2">
        <LinkCard to={`/flocks/${id}/cycle`} icon="calendar" title={t('home.viewCycle')} />
        <LinkCard to={`/flocks/${id}`} icon="chart" title={t('home.viewFlock')} />
        <LinkCard to={`/planner?flock=${id}`} icon="layout" title={t('flock.planner')} />
        <LinkCard to={`/feeds?flock=${id}`} icon="feed" title={t('nav.feeds')} />
        <LinkCard to={`/health?flock=${id}`} icon="syringe" title={t('health.title')} />
      </div>
    </div>
  )
}
