import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useKinds } from '../db/birds'
import { toggleRoutine, useRoutineDone } from '../db/routine'
import { WEATHER } from '../data/weather'
import { dailyRoutine, isLaying, type RoutineItem } from '../calc/routine'
import { todayISO } from '../calc/dates'
import { t, lt, type MsgKey } from '../i18n'
import { num } from '../i18n/format'
import { BirdArt, KIND_COLORS } from '../ui/BirdArt'
import { Icon, type IconName } from '../ui/Icon'
import { Badge, Button, cx, EmptyState, Page, SectionTitle } from '../ui/kit'
import { useWeatherView, todayExtremes, runWeatherAlerts, type Group } from './weather/useWeather'
import { WeatherBar } from './weather/WeatherBar'
import { AlertCard } from './weather/AlertCard'
import { ageText } from './groups/format'

export function HomeScreen() {
  const view = useWeatherView()
  const kinds = useKinds()
  const nav = useNavigate()
  const today = todayISO()
  const done = useRoutineDone(today)

  useEffect(() => {
    void runWeatherAlerts()
  }, [view?.forecast?.fetchedAt])

  const groups = view?.groups ?? []
  const routine = view
    ? dailyRoutine(toRoutine(groups), todayExtremes(view.forecast, today), WEATHER)
    : []
  const laying = toRoutine(groups).some(isLaying)

  return (
    <Page>
      <header className="flex items-center gap-3 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <img src="icons/icon-96.png" alt="" width={40} height={40} className="rounded-xl" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold leading-none">{t('home2.title')}</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted">
            <Badge tone="warn">{t('app.beta')}</Badge>
            <span>{t('disclaimer.short')}</span>
          </div>
        </div>
        <Link
          to="/settings"
          aria-label={t('nav.settings')}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2"
        >
          <Icon name="settings" />
        </Link>
      </header>

      {view && kinds && groups.length === 0 ? (
        <EmptyState title={t('home2.empty.title')} body={t('home2.empty.body')}>
          <Button icon="plus" full onClick={() => nav('/birds')}>
            {t('home2.empty.cta')}
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          <WeatherBar view={view} />

          {view?.alerts.map((a) => (
            <AlertCard key={a.id} alert={a} groups={groups} />
          ))}

          <section aria-labelledby="routine-h">
            <SectionTitle icon="check">
              <span id="routine-h">{t('home2.routine')}</span>
            </SectionTitle>
            <ul className="space-y-2">
              {routine.map((r) => (
                <RoutineRow
                  key={r.id}
                  item={r}
                  done={done?.has(r.id) ?? false}
                  onToggle={() => void toggleRoutine(today, r.id)}
                  groups={groups}
                />
              ))}
            </ul>
          </section>

          <section aria-labelledby="tools-h">
            <SectionTitle icon="tools">
              <span id="tools-h">{t('tools.title')}</span>
            </SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <ToolTile to="/sick" icon="medkit" label={t('tools.sick')} tone="danger" />
              <ToolTile to="/scraps" icon="utensils" label={t('tools.scraps')} />
              {laying && <ToolTile to="/eggs" icon="egg" label={t('tools.eggs')} />}
              <ToolTile to="/brood" icon="hatch" label={t('tools.brood')} />
            </div>
          </section>

          <section aria-labelledby="groups-h">
            <SectionTitle icon="flock">
              <span id="groups-h">{t('home2.groups')}</span>
            </SectionTitle>
            <ul className="space-y-2">
              {groups.map((g) => (
                <li key={g.id}>
                  <Link
                    to={`/groups/${g.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
                  >
                    <BirdArt kind={g.profile.kind} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{g.flock.name}</div>
                      <div className="text-sm text-muted">
                        {num(g.flock.initialCount)} {t(`unit.${g.profile.unit}`)} · {ageText(g.age)}
                      </div>
                    </div>
                    <Icon name="chevron" size={18} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
            <Button variant="ghost" icon="plus" className="mt-1" onClick={() => nav('/birds')}>
              {t('home2.addBirds')}
            </Button>
          </section>
        </div>
      )}
    </Page>
  )
}

function toRoutine(groups: Group[]) {
  return groups.map((g) => ({
    id: g.id,
    kind: g.profile.kind,
    profile: g.profile,
    purpose: g.flock.purpose,
    age: g.age,
    count: g.flock.initialCount,
    place: g.place,
  }))
}

const ROUTINE_ICON: Record<RoutineItem['type'], IconName> = {
  heat: 'fire',
  cold: 'thermo',
  water: 'drop',
  feed: 'feed',
  eggs: 'egg',
  check: 'search',
  cycle: 'calendar',
  clean: 'refresh',
}

const ROUTINE_LINK: Partial<Record<RoutineItem['type'], { to: string; label: MsgKey }>> = {
  heat: { to: '/weather', label: 'routine.heat.link' },
  cold: { to: '/weather', label: 'routine.cold.link' },
  eggs: { to: '/eggs', label: 'routine.eggs.link' },
  check: { to: '/sick', label: 'routine.check.link' },
}

function RoutineRow({
  item,
  done,
  onToggle,
  groups,
}: {
  item: RoutineItem
  done: boolean
  onToggle: () => void
  groups: Group[]
}) {
  const title = item.type === 'cycle' && item.task ? lt(item.task.title) : t(`routine.${item.type}`)
  const nameOf = (id: number) => groups.find((g) => g.id === id)?.flock.name ?? ''
  const link = ROUTINE_LINK[item.type]
  return (
    <li
      className={cx(
        'rounded-2xl border bg-surface p-3 transition',
        done ? 'border-leaf/40 opacity-70' : 'border-line',
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={title}
          onClick={onToggle}
          className={cx(
            'grid h-9 w-9 shrink-0 place-items-center rounded-full border-2',
            done ? 'border-leaf bg-leaf text-white' : 'border-line',
          )}
        >
          {done ? (
            <Icon name="check" size={20} />
          ) : (
            <Icon name={ROUTINE_ICON[item.type]} size={18} className="text-primary" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className={cx('font-bold', done && 'line-through')}>{title}</div>
          <div className="text-sm text-muted">
            {item.type === 'cycle' ? lt(item.task?.detail) : t(`routine.${item.type}.hint`)}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.groups.map((g) => (
              <span
                key={g.id}
                className="inline-flex items-center gap-1 rounded-full py-0.5 pe-2 ps-0.5 text-xs font-bold text-[#3A2A1E]"
                style={{ background: KIND_COLORS[g.kind].bg }}
              >
                <BirdArt kind={g.kind} size={20} />
                {nameOf(g.id)}
                {g.waterL !== undefined && (
                  <span className="num">
                    · {t('routine.water.l', { n: num(g.waterL, g.waterL < 10 ? 1 : 0) })}
                  </span>
                )}
                {g.feedName && <span>· {lt(g.feedName)}</span>}
              </span>
            ))}
          </div>
          {link && (
            <Link
              to={link.to}
              className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary"
            >
              {t(link.label)} <Icon name="chevron" size={14} />
            </Link>
          )}
        </div>
      </div>
    </li>
  )
}

function ToolTile({
  to,
  icon,
  label,
  tone,
}: {
  to: string
  icon: IconName
  label: string
  tone?: 'danger'
}) {
  return (
    <Link
      to={to}
      className={cx(
        'flex min-h-20 flex-col justify-center gap-1 rounded-2xl border p-3 font-bold',
        tone === 'danger'
          ? 'border-danger/30 bg-danger-soft text-danger'
          : 'border-line bg-surface',
      )}
    >
      <Icon name={icon} size={26} className={tone === 'danger' ? '' : 'text-primary'} />
      {label}
    </Link>
  )
}
