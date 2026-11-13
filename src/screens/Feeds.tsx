import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useFlocks, useFlockView } from '../db/hooks'
import { getSpecies, SPECIES } from '../data'
import { INGREDIENTS, getIngredient } from '../data/ingredients'
import type { SpeciesData } from '../data/schema'
import { RULES } from '../data/rules'
import { cycleFeed, dailyFeedG } from '../calc/feed'
import { valueAt } from '../calc/interp'
import { marketAgeDays } from '../calc/planner'
import { balanceProtein, bagToTon, feedCost, mixNutrients, type FormulaRow } from '../calc/formula'
import { t, lt } from '../i18n'
import { num } from '../i18n/format'
import { Icon } from '../ui/Icon'
import { Badge, Button, Card, ConfidenceBadge, Field, NumberInput, Page, PageHeader, SectionTitle, Select, SourceNote, Stat, TextInput, Why, cx } from '../ui/kit'
import { KeyValue } from './parts'

const CUSTOM = 'custom'

interface StoredRow {
  id: string
  pct?: number
  price?: number
  name?: string
  cp?: number
  me?: number
}

export default function Feeds() {
  const [params, setParams] = useSearchParams()
  const flocks = useFlocks()
  const active = flocks?.filter((f) => f.status === 'active') ?? []
  const sel = params.get('flock')
  const flockId = sel === 'custom' ? null : (active.find((f) => String(f.id) === sel)?.id ?? active[0]?.id ?? null)
  const view = useFlockView(flockId)
  const entry = view ? view.species : (getSpecies('broiler-white') ?? Object.values(SPECIES)[0]!)
  const sp = entry.data
  const [birdsCustom, setBirdsCustom] = useState<number | undefined>(200)
  const [mortInput, setMortInput] = useState<number | undefined>(undefined)

  const birds = view ? view.flock.initialCount : (birdsCustom ?? 0)
  const market = marketAgeDays(sp)
  const mortality = mortInput ?? (view && view.age > 0 ? view.metrics.mortalityPct : 0)
  const plan = cycleFeed(sp, birds, market, mortality)

  if (flocks === undefined) return null
  return (
    <Page>
      <PageHeader title={t('feeds.title')} back />
      <Field label={t('planner.pickFlock')} htmlFor="fd-flock">
        <Select
          id="fd-flock"
          value={flockId ? String(flockId) : 'custom'}
          onChange={(v) => setParams({ flock: v }, { replace: true })}
          options={[...active.map((f) => ({ value: String(f.id), label: f.name })), { value: 'custom', label: t('planner.custom') }]}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        {!view && (
          <Field label={t('wizard.count')} htmlFor="fd-birds">
            <NumberInput id="fd-birds" value={birdsCustom} onChange={setBirdsCustom} />
          </Field>
        )}
        <Field label={t('feeds.mortality')} htmlFor="fd-mort">
          <NumberInput id="fd-mort" decimal value={mortInput} onChange={setMortInput} placeholder={num(mortality, 1)} />
        </Field>
      </div>

      <SectionTitle icon="feed">{t('feeds.phases')}</SectionTitle>
      <div className="space-y-2">
        {sp.feed.phases.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">{lt(p.name)}</h3>
              <Badge>{lt(p.form)}</Badge>
            </div>
            <p className="text-sm text-muted">
              {t('feeds.phaseDays', { from: num(p.fromDay), to: num(Math.min(p.toDay, market)) })} ·{' '}
              {t('feeds.target', { cp: num(p.crudeProtein.value, 1), me: num(p.energy.value) })}
            </p>
          </Card>
        ))}
        <SourceNote item={sp.feed.phases[0]!.crudeProtein} />
      </div>

      <SectionTitle icon="calc">{t('feeds.plan')}</SectionTitle>
      <Card>
        <p className="mb-1 text-sm text-muted">{t('feeds.planFor', { n: num(birds), d: num(market) })}</p>
        {plan.byPhase.map((p) => (
          <KeyValue key={p.phase.id} k={lt(p.phase.name)} v={`${num(p.kg)} ${t('common.kg')} · ${t('feeds.bags', { n: num(p.bags) })}`} />
        ))}
        <KeyValue k={t('feeds.total')} v={`${num(plan.totalKg)} ${t('common.kg')} · ${t('feeds.bags', { n: num(plan.bags) })}`} />
        <KeyValue k={t('feeds.perBird')} v={`${num(birds > 0 ? plan.totalKg / birds : 0, 2)} ${t('common.kg')}`} />
        <Why>{t('feeds.planWhy')}</Why>
        <SourceNote item={sp.growth.dailyFeed} />
        <SourceNote item={sp.feed.bagKg} />
      </Card>

      <WeeklyTable sp={sp} birds={birds} market={market} />
      <ReadyFeedCost sp={sp} plan={plan} birds={birds} />
      <FormulaBuilder sp={sp} />

      <SectionTitle icon="alert">{t('feeds.forbidden')}</SectionTitle>
      <Card tone="danger">
        <ul className="list-disc space-y-1.5 ps-5 text-sm">
          {sp.feed.forbidden.map((f, i) => (
            <li key={i}>{lt(f)}</li>
          ))}
        </ul>
      </Card>
      <SectionTitle icon="home">{t('feeds.home')}</SectionTitle>
      <Card>
        <ul className="list-disc space-y-1.5 ps-5 text-sm">
          {sp.feed.homeNotes.map((f, i) => (
            <li key={i}>{lt(f)}</li>
          ))}
        </ul>
      </Card>
    </Page>
  )
}

function WeeklyTable({ sp, birds, market }: { sp: SpeciesData; birds: number; market: number }) {
  const weeks: number[] = []
  for (let d = 0; d <= market; d += 7) weeks.push(d)
  if (weeks.at(-1) !== market) weeks.push(market)
  return (
    <>
      <SectionTitle icon="chart">{t('feeds.weekly')}</SectionTitle>
      <Card>
        <table className="num w-full text-center text-sm">
          <thead>
            <tr className="text-muted">
              <th className="py-1">{t('common.age')}</th>
              <th>{t('feeds.dailyBird')}</th>
              <th>{t('feeds.dailyFlock')}</th>
              <th>{t('feeds.cumBird')}</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((d) => (
              <tr key={d} className="border-t border-line/50">
                <td className="py-1">{num(d)}</td>
                <td>
                  {num(dailyFeedG(sp, d))} {t('common.g')}
                </td>
                <td>
                  {num((dailyFeedG(sp, d) * birds) / 1000, 1)} {t('common.kg')}
                </td>
                <td>
                  {num(valueAt(sp.growth.cumulativeFeed, d).value / 1000, 2)} {t('common.kg')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <SourceNote item={sp.growth.cumulativeFeed} />
      </Card>
    </>
  )
}

function ReadyFeedCost({ sp, plan, birds }: { sp: SpeciesData; plan: ReturnType<typeof cycleFeed>; birds: number }) {
  const key = `feed-bag-prices-${sp.id}`
  const stored = useLiveQuery(() => db.kv.get(key), [key])
  const [prices, setPrices] = useState<Record<string, number | undefined>>({})
  useEffect(() => {
    if (stored?.value) setPrices(stored.value as Record<string, number | undefined>)
  }, [stored])
  const bagKg = sp.feed.bagKg.value
  const all = plan.byPhase.every((p) => prices[p.phase.id] !== undefined)
  const total = all ? plan.byPhase.reduce((s, p) => s + feedCost(p.kg, bagToTon(prices[p.phase.id]!, bagKg)), 0) : undefined
  return (
    <>
      <SectionTitle icon="calc">{t('feeds.ready')}</SectionTitle>
      <Card>
        <p className="mb-3 text-sm text-muted">{t('feeds.readyHint')}</p>
        {plan.byPhase.map((p) => (
          <Field key={p.phase.id} label={t('feeds.bagPrice', { name: lt(p.phase.name) })} htmlFor={`bag-${p.phase.id}`}>
            <NumberInput
              id={`bag-${p.phase.id}`}
              value={prices[p.phase.id]}
              onChange={(v) => {
                const next = { ...prices, [p.phase.id]: v }
                setPrices(next)
                void db.kv.put({ key, value: next })
              }}
            />
          </Field>
        ))}
        {total !== undefined && (
          <div className="grid grid-cols-2 gap-2">
            <Stat label={t('feeds.cycleCost')} value={t('accounts.egp', { v: num(total) })} />
            <Stat label={t('feeds.costPerBird')} value={t('accounts.egp', { v: num(birds > 0 ? total / birds : 0, 1) })} />
          </div>
        )}
      </Card>
    </>
  )
}

function toRows(stored: StoredRow[]): FormulaRow[] {
  return stored.map((r) => {
    const ing = getIngredient(r.id)
    return {
      id: r.id === CUSTOM ? `${CUSTOM}-${r.name ?? ''}` : r.id,
      pct: r.pct ?? 0,
      cp: ing ? ing.crudeProtein.value : (r.cp ?? 0),
      me: ing ? ing.energy.value : (r.me ?? 0),
      ...(r.price !== undefined ? { pricePerTon: r.price } : {}),
    }
  })
}

const PROTEIN_SOURCES = ['sbm44', 'sbm46', 'corn-gluten', 'fish-meal']

function FormulaBuilder({ sp }: { sp: SpeciesData }) {
  const [phaseId, setPhaseId] = useState(sp.feed.phases[0]!.id)
  const key = `formula-${sp.id}-${phaseId}`
  const stored = useLiveQuery(() => db.kv.get(key), [key])
  const [rows, setRows] = useState<StoredRow[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const readyPrices = useLiveQuery(() => db.kv.get(`feed-bag-prices-${sp.id}`), [sp.id])

  useEffect(() => {
    setRows(stored?.value ? (stored.value as StoredRow[]) : [{ id: 'corn' }, { id: 'sbm44' }])
    setMsg(null)
  }, [stored, key])

  const save = (next: StoredRow[]) => {
    setRows(next)
    void db.kv.put({ key, value: next })
  }
  const phase = sp.feed.phases.find((p) => p.id === phaseId)!
  const calc = toRows(rows)
  const mix = mixNutrients(calc)
  const readyBag = (readyPrices?.value as Record<string, number | undefined> | undefined)?.[phaseId]
  const readyTon = readyBag !== undefined ? bagToTon(readyBag, sp.feed.bagKg.value) : undefined
  const protein = rows.find((r) => PROTEIN_SOURCES.includes(r.id))

  return (
    <>
      <SectionTitle icon="edit">{t('feeds.formula')}</SectionTitle>
      <Card>
        <p className="mb-3 text-sm text-muted">{t('feeds.formulaHint')}</p>
        <Field label={t('feeds.phase')} htmlFor="fm-phase">
          <Select id="fm-phase" value={phaseId} onChange={setPhaseId} options={sp.feed.phases.map((p) => ({ value: p.id, label: lt(p.name) }))} />
        </Field>
        <div className="space-y-3">
          {rows.map((r, i) => {
            const ing = getIngredient(r.id)
            const update = (patch: Partial<StoredRow>) => save(rows.map((x, j) => (j === i ? { ...x, ...patch } : x)))
            return (
              <div key={i} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={r.id}
                      onChange={(v) => update({ id: v })}
                      options={[...INGREDIENTS.map((x) => ({ value: x.id, label: lt(x.name) })), { value: CUSTOM, label: t('feeds.custom') }]}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={t('feeds.remove')}
                    className="grid h-11 w-11 place-items-center rounded-full text-danger"
                    onClick={() => save(rows.filter((_, j) => j !== i))}
                  >
                    <Icon name="trash" size={20} />
                  </button>
                </div>
                {r.id === CUSTOM && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <TextInput value={r.name ?? ''} onChange={(v) => update({ name: v })} placeholder={t('feeds.customName')} />
                    <NumberInput ariaLabel={t('feeds.customCp')} decimal value={r.cp} onChange={(v) => update({ cp: v })} placeholder={t('feeds.protein')} />
                    <NumberInput ariaLabel={t('feeds.customMe')} value={r.me} onChange={(v) => update({ me: v })} placeholder={t('feeds.energy')} />
                  </div>
                )}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-sm text-muted">
                    {t('feeds.pct')}
                    <NumberInput decimal value={r.pct} onChange={(v) => update({ pct: v })} />
                  </label>
                  <label className="text-sm text-muted">
                    {t('feeds.priceTon')}
                    <NumberInput value={r.price} onChange={(v) => update({ price: v })} />
                  </label>
                </div>
                {ing && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>
                      {t('feeds.protein')} {num(ing.crudeProtein.value, 1)}٪ · {t('feeds.energy')} {num(ing.energy.value)}
                    </span>
                    <ConfidenceBadge confidence={ing.energy.confidence} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="secondary" icon="plus" onClick={() => save([...rows, { id: 'wheat-bran' }])}>
            {t('feeds.addRow')}
          </Button>
          <Button
            icon="check"
            onClick={() => {
              if (!rows.some((r) => r.id === 'corn') || !protein) return setMsg(t('feeds.balanceNeeds'))
              const res = balanceProtein(calc, 'corn', protein.id, phase.crudeProtein.value)
              save(rows.map((r, i) => ({ ...r, pct: res.rows[i]!.pct })))
              setMsg(res.feasible ? null : t('feeds.balanceFail'))
            }}
          >
            {t('feeds.balance')}
          </Button>
        </div>
        {msg && (
          <p role="alert" className="mt-2 text-sm font-semibold text-warn">
            {msg}
          </p>
        )}

        <h4 className="mb-1 mt-4 font-bold">{t('feeds.result')}</h4>
        <KeyValue k={t('feeds.totalPct')} v={<span className={cx(Math.abs(mix.totalPct - 100) > 0.05 && 'text-warn')}>{num(mix.totalPct, 1)}٪</span>} />
        {Math.abs(mix.totalPct - 100) > 0.05 && mix.totalPct > 0 && <p className="text-sm text-warn">{t('feeds.totalWarn')}</p>}
        <KeyValue k={t('feeds.protein')} v={`${num(mix.cp, 1)}٪ / ${num(phase.crudeProtein.value, 1)}٪`} />
        <KeyValue k={t('feeds.energy')} v={`${num(mix.me)} / ${num(phase.energy.value)}`} />
        {mix.costPerTon !== undefined && <KeyValue k={t('feeds.costTon')} v={t('accounts.egp', { v: num(mix.costPerTon) })} />}
        {mix.costPerTon !== undefined && readyTon !== undefined && (
          <p className="text-sm font-semibold">{t('feeds.vsReady', { diff: num(mix.costPerTon - readyTon) })}</p>
        )}
        {mix.totalPct > 0 && mix.cp < phase.crudeProtein.value - RULES.formulaWarn.proteinPts && <p className="text-sm text-warn">{t('feeds.lowProtein')}</p>}
        {mix.totalPct > 0 && mix.me < phase.energy.value * RULES.formulaWarn.energyRatio && <p className="text-sm text-warn">{t('feeds.lowEnergy')}</p>}
        <p className="mt-3 rounded-lg bg-warn-soft p-2 text-sm text-warn">{t('feeds.mineralWarn')}</p>
        <SourceNote item={getIngredient('corn')!.energy} />
      </Card>
    </>
  )
}
