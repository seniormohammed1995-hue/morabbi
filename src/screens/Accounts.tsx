import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useFlocks, useFlockView } from '../db/hooks'
import { getSpecies, SPECIES } from '../data'
import { cycleEconomics } from '../calc/accounts'
import { cycleFeed } from '../calc/feed'
import { marketAgeDays, marketWeightKg } from '../calc/planner'
import { t } from '../i18n'
import { num } from '../i18n/format'
import { Card, Field, NumberInput, Page, PageHeader, Select, Stat, Why } from '../ui/kit'
import { KeyValue } from './parts'

interface Prices {
  chickPrice?: number
  feedPricePerTon?: number
  otherCosts?: number
  salePricePerKg?: number
  mortalityPct?: number
}

const PRICES_KEY = 'prices'

export default function Accounts() {
  const flocks = useFlocks()
  const active = flocks?.filter((f) => f.status === 'active') ?? []
  const [sel, setSel] = useState<string>('')
  const flockId = sel === 'custom' ? null : (active.find((f) => String(f.id) === sel)?.id ?? active[0]?.id ?? null)
  const view = useFlockView(flockId)
  const stored = useLiveQuery(() => db.kv.get(PRICES_KEY), [])
  const [p, setP] = useState<Prices>({})
  const [birdsCustom, setBirdsCustom] = useState<number | undefined>(200)

  useEffect(() => {
    if (stored?.value) setP(stored.value as Prices)
  }, [stored])

  const update = (k: keyof Prices, v: number | undefined) => {
    const next = { ...p, [k]: v }
    setP(next)
    void db.kv.put({ key: PRICES_KEY, value: next })
  }

  const entry = view ? view.species : (getSpecies('broiler-white') ?? Object.values(SPECIES)[0]!)
  const sp = entry.data
  const market = marketAgeDays(sp)
  const birds = view ? view.flock.initialCount : (birdsCustom ?? 0)

  // With a flock: actual mortality and feed so far + standard feed for the remaining days.
  const actualMort = view && view.age > 0 ? view.metrics.mortalityPct : undefined
  const mortalityPct = p.mortalityPct ?? actualMort
  const feedKg =
    view && view.age > 0
      ? view.metrics.feedTotalKg + cycleFeed(sp, view.metrics.alive, market, 0, Math.min(view.age, market)).totalKg
      : cycleFeed(sp, birds, market, mortalityPct ?? 0).totalKg
  const w = marketWeightKg(sp)

  const ready =
    p.chickPrice !== undefined && p.feedPricePerTon !== undefined && p.salePricePerKg !== undefined && mortalityPct !== undefined && birds > 0
  const r = ready
    ? cycleEconomics({
        birds,
        mortalityPct: mortalityPct!,
        marketWeightKg: w,
        feedKg,
        chickPrice: p.chickPrice!,
        feedPricePerTon: p.feedPricePerTon!,
        otherCosts: p.otherCosts ?? 0,
        salePricePerKg: p.salePricePerKg!,
      })
    : null
  const egp = (v: number) => t('accounts.egp', { v: num(v) })

  return (
    <Page>
      <PageHeader title={t('accounts.title')} />
      <p className="mb-4 text-muted">{t('accounts.intro')}</p>
      <Field label={t('planner.pickFlock')} htmlFor="acc-flock">
        <Select
          id="acc-flock"
          value={flockId ? String(flockId) : 'custom'}
          onChange={setSel}
          options={[...active.map((f) => ({ value: String(f.id), label: f.name })), { value: 'custom', label: t('planner.custom') }]}
        />
      </Field>
      {!view && (
        <Field label={t('wizard.count')} htmlFor="acc-birds">
          <NumberInput id="acc-birds" value={birdsCustom} onChange={setBirdsCustom} />
        </Field>
      )}
      <Card className="mb-4">
        <Field label={t('accounts.chickPrice')} htmlFor="acc-chick">
          <NumberInput id="acc-chick" decimal value={p.chickPrice} onChange={(v) => update('chickPrice', v)} />
        </Field>
        <Field label={t('accounts.feedPrice')} htmlFor="acc-feed">
          <NumberInput id="acc-feed" value={p.feedPricePerTon} onChange={(v) => update('feedPricePerTon', v)} />
        </Field>
        <Field label={t('accounts.otherCosts')} htmlFor="acc-other">
          <NumberInput id="acc-other" value={p.otherCosts} onChange={(v) => update('otherCosts', v)} />
        </Field>
        <Field label={t('accounts.salePrice')} htmlFor="acc-sale">
          <NumberInput id="acc-sale" decimal value={p.salePricePerKg} onChange={(v) => update('salePricePerKg', v)} />
        </Field>
        <Field
          label={t('accounts.mortalityAssumption')}
          htmlFor="acc-mort"
          hint={actualMort !== undefined ? `${t('common.actual')}: ${num(actualMort, 1)}٪` : undefined}
        >
          <NumberInput id="acc-mort" decimal value={p.mortalityPct} onChange={(v) => update('mortalityPct', v)} placeholder={actualMort !== undefined ? num(actualMort, 1) : ''} />
        </Field>
      </Card>

      {!r ? (
        <p className="rounded-xl bg-surface-2 p-4 text-center text-muted">{t('accounts.needPrices')}</p>
      ) : (
        <section aria-live="polite">
          <h2 className="mb-2 text-lg font-bold">{t('accounts.result')}</h2>
          <div className="grid grid-cols-2 gap-2">
            <Stat label={t('accounts.profit')} value={egp(r.profit)} tone={r.profit >= 0 ? 'ok' : 'bad'} />
            <Stat label={t('accounts.roi')} value={`${num(r.roiPct, 1)}٪`} tone={r.roiPct >= 0 ? 'ok' : 'bad'} />
            <Stat label={t('accounts.costPerKg')} value={egp(r.costPerKg)} />
            <Stat label={t('accounts.breakeven')} value={egp(r.breakEvenPricePerKg)} />
          </div>
          <Card className="mt-3">
            <KeyValue k={t('accounts.totalCost')} v={egp(r.totalCost)} />
            <KeyValue k={t('accounts.costPerBird')} v={egp(r.costPerBird)} />
            <KeyValue k={t('accounts.revenue')} v={egp(r.revenue)} />
          </Card>
          <Why>
            {view && view.age > 0
              ? t('accounts.basisActual')
              : t('accounts.basis', { n: num(birds), m: num(mortalityPct, 1), w: num(w, 1), f: num(feedKg) })}
          </Why>
        </section>
      )}
    </Page>
  )
}
