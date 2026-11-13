import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useFlocks, useFlockView } from '../db/hooks'
import { toggleTask } from '../db/repo'
import { getSpecies, SPECIES } from '../data'
import { BIOSECURITY, CONDITIONS, SYMPTOMS } from '../data/health'
import type { SpeciesData, SymptomGroup } from '../data/schema'
import { RULES } from '../data/rules'
import { addDays } from '../calc/dates'
import { rankConditions, vaccineStatus, type VaccineState } from '../calc/health'
import { t, lt } from '../i18n'
import { dateShort, num } from '../i18n/format'
import { Icon } from '../ui/Icon'
import { Badge, Button, Card, cx, Field, Page, PageHeader, Select, SourceNote, Tabs } from '../ui/kit'
import { useVaccinesDone, vacTaskId, type FlockView } from '../db/hooks'

type Tab = 'vaccines' | 'symptoms' | 'biosecurity' | 'withdrawal'

export default function Health() {
  const [params, setParams] = useSearchParams()
  const flocks = useFlocks()
  const active = flocks?.filter((f) => f.status === 'active') ?? []
  const sel = params.get('flock')
  const flockId = sel === 'none' ? null : (active.find((f) => String(f.id) === sel)?.id ?? active[0]?.id ?? null)
  const view = useFlockView(flockId)
  const tab = (params.get('tab') as Tab | null) ?? 'vaccines'
  const sp = view ? view.species.data : (getSpecies('broiler-white') ?? Object.values(SPECIES)[0]!).data

  if (flocks === undefined) return null
  const setTab = (v: Tab) => setParams({ ...Object.fromEntries(params), tab: v }, { replace: true })
  return (
    <Page>
      <PageHeader title={t('health.title')} back />
      <Field label={t('planner.pickFlock')} htmlFor="h-flock">
        <Select
          id="h-flock"
          value={flockId ? String(flockId) : 'none'}
          onChange={(v) => setParams({ flock: v, tab }, { replace: true })}
          options={[...active.map((f) => ({ value: String(f.id), label: f.name })), { value: 'none', label: lt(sp.name) }]}
        />
      </Field>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={(['vaccines', 'symptoms', 'biosecurity', 'withdrawal'] as Tab[]).map((x) => ({ value: x, label: t(`health.tab.${x}`) }))}
      />
      <Card tone="warn" className="mb-3 text-sm font-semibold">
        {t('vet.warning')}
      </Card>
      {tab === 'vaccines' && <Vaccines sp={sp} view={view ?? null} />}
      {tab === 'symptoms' && <Symptoms sp={sp} age={view?.age} />}
      {tab === 'biosecurity' && <Biosecurity />}
      {tab === 'withdrawal' && (
        <Card>
          <p className="leading-relaxed">{lt(sp.health.withdrawalNote)}</p>
        </Card>
      )}
    </Page>
  )
}

const STATE_TONE: Record<VaccineState, 'leaf' | 'primary' | 'danger' | 'warn' | 'muted'> = {
  done: 'leaf',
  due: 'primary',
  overdue: 'danger',
  upcoming: 'warn',
  later: 'muted',
}

function Vaccines({ sp, view }: { sp: SpeciesData; view: FlockView | null }) {
  const done = useVaccinesDone(view?.flock.id)
  const statuses = vaccineStatus(sp.health.vaccinations, view?.age ?? -Infinity, done ?? new Set(), RULES.vaccineSoonDays)
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">{t('health.vacIntro')}</p>
      {!view && <p className="text-sm font-semibold">{t('health.vac.noFlock')}</p>}
      {statuses.map(({ vaccination: v, state, daysUntil }) => (
        <Card key={v.id} tone={state === 'due' ? 'primary' : state === 'overdue' ? 'danger' : 'plain'}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-extrabold">{lt(v.disease)}</h3>
              <p className="text-sm">
                {lt(v.vaccine)} — {t(`library.route.${v.route}`)}
              </p>
            </div>
            {view && <Badge tone={STATE_TONE[state]}>{t(`health.vac.${state}`)}</Badge>}
          </div>
          <p className="num mt-1 text-sm text-muted">
            {view
              ? t('health.vac.onDate', { date: dateShort(addDays(view.flock.placementDate, v.day)), age: num(v.day) })
              : t('common.ageDays', { n: num(v.day) })}
            {view && state !== 'done' && daysUntil > 0 && ` · ${t('health.vac.in', { n: num(daysUntil) })}`}
            {view && state === 'overdue' && ` · ${t('health.vac.ago', { n: num(-daysUntil) })}`}
          </p>
          {v.note && <p className="mt-1 text-sm text-muted">{lt(v.note)}</p>}
          {view && (
            <Button
              variant={state === 'done' ? 'ghost' : 'secondary'}
              icon={state === 'done' ? undefined : 'check'}
              className="mt-2 min-h-10 text-sm"
              onClick={() => void toggleTask(view.flock.id, v.day, vacTaskId(v.id))}
            >
              {state === 'done' ? t('health.vac.undo') : t('health.vac.markDone')}
            </Button>
          )}
          <SourceNote item={v} />
        </Card>
      ))}
      <Card tone="accent" className="text-sm">
        {t('health.vacTips')}
      </Card>
    </div>
  )
}

const GROUPS: SymptomGroup[] = ['chicks', 'general', 'respiratory', 'digestive', 'nervous', 'legs']

function Symptoms({ sp, age }: { sp: SpeciesData; age?: number }) {
  const [picked, setPicked] = useState<string[]>([])
  const conditions = useMemo(() => CONDITIONS.filter((c) => c.groups.includes(sp.group)), [sp.group])
  const ranked = rankConditions(conditions, picked, age !== undefined && age >= 0 ? age : undefined).filter(
    (r) => r.score >= RULES.symptomMinScore,
  )
  const label = (id: string) => lt(SYMPTOMS.find((s) => s.id === id)?.label)
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t('health.symIntro')}</p>
      {GROUPS.map((g) => {
        const items = SYMPTOMS.filter((s) => s.group === g)
        if (items.length === 0) return null
        return (
          <div key={g}>
            <h3 className="mb-1.5 font-bold">{t(`health.symGroup.${g}`)}</h3>
            <div className="flex flex-wrap gap-2">
              {items.map((s) => {
                const on = picked.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(s.id)}
                    className={cx(
                      'min-h-10 rounded-full border-2 px-3 text-start text-sm font-semibold',
                      on ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface',
                    )}
                  >
                    {on && <Icon name="check" size={14} className="-ms-1 me-1 inline" />}
                    {lt(s.label)}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      {picked.length > 0 && (
        <Button variant="ghost" onClick={() => setPicked([])}>
          {t('health.clear')}
        </Button>
      )}

      <h3 className="pt-2 text-lg font-extrabold" aria-live="polite">
        {t('health.results')}
      </h3>
      {picked.length === 0 ? (
        <p className="text-muted">{t('health.pickSome')}</p>
      ) : ranked.length === 0 ? (
        <Card tone="warn">{t('health.noMatch')}</Card>
      ) : (
        ranked.slice(0, 5).map((r) => {
          const c = r.condition
          return (
            <Card key={c.id} tone={c.urgency === 'vet-now' ? 'danger' : 'plain'}>
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-extrabold">{lt(c.name)}</h4>
                <Badge tone="primary">{t('health.match', { p: num(r.score * 100) })}</Badge>
              </div>
              <p className="mt-1 text-sm">{lt(c.summary)}</p>
              <p className="mt-1 text-xs text-muted">{t('health.matched', { list: r.matched.map(label).join('، ') })}</p>
              {!r.ageFits && <p className="mt-1 text-xs font-semibold text-warn">{t('health.ageOff')}</p>}
              <p className={cx('mt-2 font-bold', c.urgency === 'vet-now' ? 'text-danger' : c.urgency === 'vet-soon' ? 'text-warn' : 'text-leaf')}>
                {t(`health.urgency.${c.urgency}`)}
              </p>
              {c.notifiable && <p className="mt-1 rounded-lg bg-danger-soft p-2 text-sm font-bold text-danger">{t('health.notifiable')}</p>}
              <h5 className="mt-2 text-sm font-bold">{t('health.doNow')}</h5>
              <ul className="list-disc ps-5 text-sm">
                {c.actions.map((a, i) => (
                  <li key={i}>{lt(a)}</li>
                ))}
              </ul>
              <SourceNote item={c} />
            </Card>
          )
        })
      )}
      {picked.length > 0 && <Card tone="accent" className="text-sm font-semibold">{t('health.always')}</Card>}
    </div>
  )
}

function Biosecurity() {
  const stored = useLiveQuery(() => db.kv.get('biosecurity'), [])
  const done = new Set((stored?.value as string[] | undefined) ?? [])
  const toggle = (id: string) => {
    const next = new Set(done)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    void db.kv.put({ key: 'biosecurity', value: [...next] })
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">{t('health.bioIntro')}</p>
      <p className="font-bold">{t('health.bioScore', { n: num(done.size), total: num(BIOSECURITY.measures.length) })}</p>
      {BIOSECURITY.measures.map((m) => {
        const on = done.has(m.id)
        return (
          <button
            key={m.id}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => toggle(m.id)}
            className="flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-3 text-start"
          >
            <span className={cx('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2', on ? 'border-leaf bg-leaf text-white' : 'border-line')}>
              {on && <Icon name="check" size={18} />}
            </span>
            <span>
              <span className="block font-bold">{lt(m.title)}</span>
              <span className="block text-sm text-muted">{lt(m.detail)}</span>
            </span>
          </button>
        )
      })}
      <SourceNote item={BIOSECURITY} />
    </div>
  )
}
