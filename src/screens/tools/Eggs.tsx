import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useEggs, addEggs } from '../../db/eggs'
import { RULES } from '../../data/rules'
import { EGG_DROP_CHECKS, EGG_DROP_SOURCE } from '../../data/eggs'
import { todayISO } from '../../calc/dates'
import { dailySeries, layingRate, productionDrop, weeklyTotals } from '../../calc/eggs'
import { isLaying } from '../../calc/routine'
import { t, lt } from '../../i18n'
import { dateShort, num, pct } from '../../i18n/format'
import { BirdArt } from '../../ui/BirdArt'
import { Bars } from '../../ui/Bars'
import { Icon } from '../../ui/Icon'
import {
  Button,
  Card,
  cx,
  EmptyState,
  Page,
  PageHeader,
  SectionTitle,
  SourceNote,
  Stat,
  Tabs,
} from '../../ui/kit'
import { FeedbackCard } from '../Feedback'
import { useWeatherView, type Group } from '../weather/useWeather'

const WEEKDAY = new Intl.DateTimeFormat('ar-EG', { weekday: 'short' })

export default function Eggs() {
  const view = useWeatherView()
  const [params] = useSearchParams()
  const groups = (view?.groups ?? []).filter((g) =>
    isLaying({
      id: g.id,
      kind: g.profile.kind,
      profile: g.profile,
      purpose: g.flock.purpose,
      age: g.age,
      count: g.flock.initialCount,
      place: g.place,
    }),
  )
  const wanted = Number(params.get('group'))
  const [picked, setPicked] = useState<number | null>(null)
  const current = groups.find((g) => g.id === (picked ?? wanted)) ?? groups[0]

  return (
    <Page>
      <PageHeader title={t('eggs.title')} back />
      {view && groups.length === 0 ? (
        <EmptyState icon="egg" title={t('eggs.empty.title')} body={t('eggs.empty.body')}>
          <Link
            to="/birds"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 font-bold text-primary-ink"
          >
            {t('home2.addBirds')}
          </Link>
        </EmptyState>
      ) : (
        <>
          {groups.length > 1 && (
            <Tabs
              value={String(current?.id)}
              onChange={(v) => setPicked(Number(v))}
              tabs={groups.map((g) => ({ value: String(g.id), label: g.flock.name }))}
            />
          )}
          {current && <Counter group={current} />}
        </>
      )}
      <FeedbackCard from={t('eggs.title')} />
    </Page>
  )
}

function Counter({ group }: { group: Group }) {
  const rows = useEggs(group.id)
  const today = todayISO()
  const [showChecks, setShowChecks] = useState(false)
  if (!rows) return null
  const todayCount = rows.find((r) => r.date === today)?.count ?? 0
  const week = dailySeries(rows, today, 7)
  const month = weeklyTotals(rows, today, 4)
  const rate = layingRate(rows, today, 7, group.flock.initialCount)
  const drop = productionDrop(rows, today, RULES.eggDropPct)
  const add = (d: number) => void addEggs(group.id, today, d)

  return (
    <>
      <Card tone="accent">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted">
          <BirdArt kind={group.profile.kind} size={28} />
          {t('eggs.today')}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label={t('eggs.minus')}
            onClick={() => add(-1)}
            className="grid h-16 w-16 place-items-center rounded-2xl bg-surface text-3xl font-bold shadow-sm"
          >
            <Icon name="minus" size={30} />
          </button>
          <output aria-live="polite" className="num text-6xl font-extrabold text-primary">
            {num(todayCount)}
          </output>
          <button
            type="button"
            aria-label={t('eggs.plus')}
            onClick={() => add(1)}
            className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-3xl font-bold text-primary-ink shadow-sm"
          >
            <Icon name="plus" size={30} />
          </button>
        </div>
      </Card>

      {drop.down && (
        <Card tone="warn" className="mt-4">
          <p className="font-bold">
            {t('eggs.drop', { last: num(drop.last), prev: num(drop.prev) })}
          </p>
          <Button variant="secondary" className="mt-2" onClick={() => setShowChecks(true)}>
            {t('eggs.why')}
          </Button>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label={t('eggs.weekTotal')} value={num(week.reduce((s, d) => s + d.count, 0))} />
        <Stat
          label={t('eggs.perBird')}
          value={pct(rate * 100, 0)}
          hint={t('eggs.perBirdHint', { n: num(group.flock.initialCount) })}
        />
      </div>

      <SectionTitle icon="chart">{t('eggs.week')}</SectionTitle>
      <Card>
        <Bars
          label={t('eggs.week')}
          data={week.map((d) => ({
            label: WEEKDAY.format(new Date(`${d.date}T12:00`)),
            value: d.count,
            highlight: d.date === today,
          }))}
        />
      </Card>
      <SectionTitle icon="calendar">{t('eggs.month')}</SectionTitle>
      <Card>
        <Bars
          label={t('eggs.month')}
          data={month.map((d, i) => ({
            label: dateShort(d.date),
            value: d.count,
            highlight: i === month.length - 1,
          }))}
        />
      </Card>

      <SectionTitle icon="info">
        <button
          type="button"
          onClick={() => setShowChecks((s) => !s)}
          className="flex items-center gap-2"
          aria-expanded={showChecks}
        >
          {t('eggs.why')}{' '}
          <Icon
            name="chevron"
            size={16}
            className={cx('transition', showChecks ? '-rotate-90' : '')}
          />
        </button>
      </SectionTitle>
      {showChecks && (
        <Card>
          <ul className="space-y-3">
            {EGG_DROP_CHECKS.map((c) => (
              <li key={c.id}>
                <div className="font-bold">{lt(c.title)}</div>
                <p className="text-sm leading-relaxed text-muted">{lt(c.detail)}</p>
              </li>
            ))}
          </ul>
          <SourceNote item={EGG_DROP_SOURCE} />
        </Card>
      )}
    </>
  )
}
