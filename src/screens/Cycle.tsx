import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useFlockView, useTasksDone } from '../db/hooks'
import { cycleDays, dayPlan } from '../calc/cycle'
import { addDays } from '../calc/dates'
import { t, lt } from '../i18n'
import { dateShort, num } from '../i18n/format'
import { Icon } from '../ui/Icon'
import { Badge, Button, Card, cx, Page, PageHeader } from '../ui/kit'
import { DayTargets, SignsList, TaskList } from './parts'
import type { FlockView } from '../db/hooks'

export default function CycleScreen() {
  const { id } = useParams()
  const view = useFlockView(Number(id))
  if (view === undefined) return null
  if (view === null)
    return (
      <Page>
        <PageHeader title={t('err.flockNotFound')} back />
      </Page>
    )
  return <CycleList view={view} />
}

function CycleList({ view }: { view: FlockView }) {
  const { flock, species, age, metrics } = view
  const days = cycleDays(species.data, species.cycle)
  const [open, setOpen] = useState<number | null>(age)

  useEffect(() => {
    document.getElementById(`day-${age}`)?.scrollIntoView({ block: 'center' })
  }, [age])

  // Stage header shows on the first day of each stage.
  const firstDayOfStage = new Set(species.cycle.stages.map((s) => Math.max(s.fromDay, days[0]!)))
  return (
    <Page>
      <PageHeader
        title={t('cycle.title')}
        subtitle={t('cycle.forSpecies', { species: lt(species.data.name), n: num(flock.initialCount) })}
        back
        action={
          <Button
            variant="secondary"
            className="min-h-10 px-3 text-sm"
            onClick={() => {
              setOpen(age)
              document.getElementById(`day-${age}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
          >
            {t('cycle.jumpToday')}
          </Button>
        }
      />
      <div className="space-y-2">
        {days.map((d) => {
          const plan = dayPlan(species.data, species.cycle, d, d <= age ? metrics.alive : flock.initialCount, flock.length * flock.width)
          const stageHeader = plan.stage && firstDayOfStage.has(d) ? plan.stage : null
          const isToday = d === age
          const isOpen = open === d
          const oneOff = plan.tasks.filter((x) => !x.daily)
          return (
            <div key={d} id={`day-${d}`}>
              {stageHeader && (
                <div className="mb-2 mt-5 rounded-xl bg-surface-2 p-3">
                  <h2 className="font-extrabold text-primary">{lt(stageHeader.name)}</h2>
                  <p className="text-sm text-muted">{lt(stageHeader.summary)}</p>
                </div>
              )}
              <section className={cx('rounded-2xl border bg-surface', isToday ? 'border-primary ring-2 ring-primary/30' : 'border-line')}>
                <button type="button" className="flex w-full items-center gap-3 p-3 text-start" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : d)}>
                  <span className={cx('num grid h-11 w-11 shrink-0 place-items-center rounded-xl font-extrabold', isToday ? 'bg-primary text-primary-ink' : 'bg-surface-2')}>
                    {num(d)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5 font-bold">
                      {d < 0 ? t('common.beforeArrival', { n: num(-d) }) : d === 0 ? t('common.placementDay') : t('common.ageDays', { n: num(d) })}
                      {isToday && <Badge tone="primary">{t('common.today')}</Badge>}
                      {plan.vaccinations.length > 0 && <Badge tone="danger">💉 {lt(plan.vaccinations[0]!.disease)}</Badge>}
                    </span>
                    <span className="block truncate text-sm text-muted">
                      {dateShort(addDays(flock.placementDate, d))}
                      {!plan.isPrep && plan.temperature && ` · ${num(plan.temperature.value)}${t('common.c')} · ${lt(plan.feedPhase!.name)} ${num(plan.feedGPerBird)} ${t('common.g')}`}
                      {oneOff.length > 0 && ` · ${lt(oneOff[0]!.title)}`}
                    </span>
                  </span>
                  <Icon name="chevron" className={cx('shrink-0 text-muted transition', isOpen && '-rotate-90')} />
                </button>
                {isOpen && <DayBody view={view} day={d} plan={plan} />}
              </section>
            </div>
          )
        })}
      </div>
    </Page>
  )
}

function DayBody({ view, day, plan }: { view: FlockView; day: number; plan: ReturnType<typeof dayPlan> }) {
  const done = useTasksDone(view.flock.id, day)
  return (
    <div className="space-y-4 border-t border-line p-3">
      <div>
        <h3 className="mb-2 font-bold">{t('cycle.tasks')}</h3>
        <TaskList plan={plan} flockId={view.flock.id} done={done} />
      </div>
      {!plan.isPrep && <DayTargets sp={view.species.data} plan={plan} />}
      {plan.signs.length > 0 && (
        <Card tone="warn">
          <h3 className="mb-2 font-bold">{t('cycle.signs')}</h3>
          <SignsList plan={plan} />
        </Card>
      )}
    </div>
  )
}
