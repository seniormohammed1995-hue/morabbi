import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATALOGUE, getSpecies } from '../data'
import type { HouseType, Purpose } from '../data/schema'
import { GOVERNORATES, RULES } from '../data/rules'
import type { Experience } from '../db'
import { createFlock } from '../db/repo'
import { addDays, todayISO } from '../calc/dates'
import { cycleFeed } from '../calc/feed'
import { broodingArea, density, equipment, guardLengthM, heaterPlan, litterVolumeM3, marketAgeDays, marketDate, marketWeightKg, seasonForDate } from '../calc/planner'
import { useUi } from '../store/ui'
import { t, lt, type MsgKey } from '../i18n'
import { dateLong, num } from '../i18n/format'
import { Badge, Button, Card, Choice, Field, NumberInput, Page, PageHeader, Select, SourceNote, TextInput, Why } from '../ui/kit'
import { KeyValue } from './parts'

const HOUSES: HouseType[] = ['roof', 'room', 'yard', 'open', 'closed']
const EXPERIENCES: Experience[] = ['beginner', 'some', 'pro']

interface State {
  speciesId: string
  purpose: Purpose
  count?: number
  houseType: HouseType
  length?: number
  width?: number
  height?: number
  governorate: string
  placementDate: string
  experience: Experience
  name: string
}

export default function Wizard() {
  const nav = useNavigate()
  const select = useUi((s) => s.selectFlock)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [s, setS] = useState<State>({
    speciesId: 'broiler-white',
    purpose: 'meat',
    houseType: 'roof',
    governorate: 'cairo',
    placementDate: addDays(todayISO(), 3),
    experience: 'beginner',
    name: '',
  })
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }))
  const entry = getSpecies(s.speciesId)
  const total = 4

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (step === 1) {
      if (!s.count || s.count < 1 || s.count > RULES.maxFlock || !Number.isInteger(s.count)) e.count = t('wizard.err.count')
      for (const k of ['length', 'width', 'height'] as const) {
        const v = s[k]
        if (v === undefined || v < 0.5 || v > 200) e[k] = t('wizard.err.dims')
      }
    }
    if (step === 2 && !s.placementDate) e.date = t('wizard.err.date')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <Page>
      <PageHeader title={t('wizard.title')} subtitle={t('wizard.step', { n: num(step + 1), total: num(total) })} back />
      <div className="mb-4 flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-line'}`} />
        ))}
      </div>

      {step === 0 && (
        <>
          <Field label={t('wizard.species')}>
            <Choice
              value={s.speciesId}
              onChange={(v) => {
                set('speciesId', v)
                const sp = getSpecies(v)
                if (sp) set('purpose', sp.data.purposes[0]!)
              }}
              options={CATALOGUE.filter((c) => getSpecies(c.id)).map((c) => ({
                value: c.id,
                label: lt(c.name),
                badge: getSpecies(c.id)?.data.dataStatus === 'limited' ? <Badge tone="warn">{t('common.limitedData')}</Badge> : undefined,
              }))}
            />
          </Field>
          {entry && (
            <Field label={t('wizard.purpose')}>
              <Choice
                value={s.purpose}
                onChange={(v) => set('purpose', v)}
                cols={3}
                options={(['meat', 'eggs', 'breeding'] as Purpose[]).map((p) => ({
                  value: p,
                  label: t(`wizard.purpose.${p}`),
                  disabled: !entry.data.purposes.includes(p),
                }))}
              />
            </Field>
          )}
          {entry && <p className="text-sm text-muted">{lt(entry.data.description)}</p>}
          <p className="mt-4 text-sm font-semibold">{t('wizard.comingSoon')}:</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {CATALOGUE.filter((c) => !getSpecies(c.id)).map((c) => (
              <Badge key={c.id}>{lt(c.name)}</Badge>
            ))}
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <Field label={t('wizard.count')} htmlFor="w-count" error={errors.count}>
            <NumberInput id="w-count" value={s.count} onChange={(v) => set('count', v)} placeholder="200" />
          </Field>
          <Field label={t('wizard.place')}>
            <Choice value={s.houseType} onChange={(v) => set('houseType', v)} options={HOUSES.map((h) => ({ value: h, label: t(`wizard.house.${h}`) }))} />
          </Field>
          <Field label={t('wizard.dims')} error={errors.length ?? errors.width ?? errors.height}>
            <div className="grid grid-cols-3 gap-2">
              {(['length', 'width', 'height'] as const).map((k) => (
                <div key={k}>
                  <div className="mb-1 text-center text-sm text-muted">{t(`wizard.${k}` as MsgKey)}</div>
                  <NumberInput ariaLabel={t(`wizard.${k}` as MsgKey)} decimal value={s[k]} onChange={(v) => set(k, v)} />
                </div>
              ))}
            </div>
          </Field>
        </>
      )}

      {step === 2 && (
        <>
          <Field label={t('wizard.governorate')} htmlFor="w-gov">
            <Select id="w-gov" value={s.governorate} onChange={(v) => set('governorate', v)} options={GOVERNORATES.map((g) => ({ value: g.id, label: g.name }))} />
          </Field>
          <Field label={t('wizard.startDate')} htmlFor="w-date" error={errors.date} hint={s.placementDate ? dateLong(s.placementDate) : undefined}>
            <input
              id="w-date"
              type="date"
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-lg"
              value={s.placementDate}
              onChange={(e) => set('placementDate', e.target.value)}
            />
          </Field>
          <Field label={t('wizard.experience')}>
            <Choice value={s.experience} onChange={(v) => set('experience', v)} cols={3} options={EXPERIENCES.map((x) => ({ value: x, label: t(`wizard.exp.${x}`) }))} />
          </Field>
          <Field label={t('wizard.name')} htmlFor="w-name">
            <TextInput id="w-name" value={s.name} onChange={(v) => set('name', v)} placeholder={t('wizard.namePlaceholder')} />
          </Field>
        </>
      )}

      {step === 3 && entry && <Result s={s} />}

      <div className="sticky bottom-20 z-10 -mx-4 mt-6 flex gap-2 bg-bg/95 px-4 py-2 backdrop-blur">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)} full>
            {t('common.prev')}
          </Button>
        )}
        {step < total - 1 ? (
          <Button
            full
            disabled={!entry}
            onClick={() => {
              if (validate()) setStep(step + 1)
            }}
          >
            {t('common.next')}
          </Button>
        ) : (
          <Button
            full
            icon="check"
            onClick={async () => {
              const sp = entry!.data
              const id = await createFlock({
                name: s.name.trim() || `${lt(sp.name)} — ${dateLong(s.placementDate)}`,
                speciesId: s.speciesId,
                purpose: s.purpose,
                placementDate: s.placementDate,
                initialCount: s.count!,
                houseType: s.houseType,
                length: s.length!,
                width: s.width!,
                height: s.height!,
                governorate: s.governorate,
                experience: s.experience,
                status: 'active',
                isDemo: false,
                createdAt: Date.now(),
              })
              select(id)
              nav('/', { replace: true })
            }}
          >
            {t('wizard.start')}
          </Button>
        )}
      </div>
    </Page>
  )
}

function Result({ s }: { s: State }) {
  const entry = getSpecies(s.speciesId)!
  const sp = entry.data
  const count = s.count!
  const area = s.length! * s.width!
  const market = marketAgeDays(sp)
  const marketIso = marketDate(sp, s.placementDate)
  const seasonMarket = seasonForDate(marketIso)
  const seasonStart = seasonForDate(s.placementDate)

  const r = useMemo(() => {
    const d = density(sp, { houseType: s.houseType, season: seasonMarket, areaM2: area, count })
    const feed = cycleFeed(sp, count, market)
    const heat = heaterPlan(sp, count)
    const eq0 = equipment(sp, count, 0)
    const eqGrow = equipment(sp, count, market)
    const brood = broodingArea(sp, count, 0, area)
    const litter = sp.housing.litters[0]!
    const depth = seasonStart === 'winter' ? litter.depthWinter : litter.depthSummer
    return { d, feed, heat, eq0, eqGrow, brood, litter, depth, litterM3: litterVolumeM3(area, depth.value) }
  }, [sp, s.houseType, seasonMarket, seasonStart, area, count, market])

  const fitTone = r.d.status === 'ok' ? 'leaf' : r.d.status === 'tight' ? 'warn' : 'danger'
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold">{t('wizard.result')}</h2>
      {sp.dataStatus === 'limited' && <Card tone="warn">{t('wizard.limited')}</Card>}
      <Card tone={fitTone}>
        <h3 className="text-lg font-extrabold">{t(`wizard.fit.${r.d.status}`)}</h3>
        <p className="mt-1">
          {t('wizard.fit.detail', {
            area: num(area, 1),
            max: num(r.d.maxBirds),
            w: num(marketWeightKg(sp), 1),
            n: num(count),
          })}
        </p>
        {r.d.status !== 'ok' && (
          <p className="mt-1 font-semibold">{t('wizard.fit.suggest', { max: num(r.d.maxBirds), area: num(Math.ceil(r.d.requiredAreaM2)) })}</p>
        )}
        <Why>{t('planner.densityWhy')}</Why>
        <SourceNote item={sp.space.maxDensityKgPerM2[s.houseType]} />
      </Card>

      <Card>
        <h3 className="mb-1 font-bold">{t('wizard.summary')}</h3>
        <KeyValue k={t('wizard.seasonLabel')} v={t(`season.${seasonStart}`)} />
        <p className="py-1">{t('wizard.summary.cycle', { days: num(market), prep: num(entry.cycle.prepDays) })}</p>
        <p className="py-1">{t('wizard.summary.market', { date: dateLong(marketIso), w: num(marketWeightKg(sp), 1) })}</p>
        <p className="py-1">
          {t('wizard.summary.feed', { kg: num(r.feed.totalKg), bags: num(r.feed.bags), bag: num(sp.feed.bagKg.value) })}
        </p>
        <SourceNote item={sp.marketAge} />
      </Card>

      <Card>
        <h3 className="mb-1 font-bold">{t('wizard.shopping')}</h3>
        <KeyValue k={lt(r.heat.heater.name)} v={num(r.heat.count)} />
        <KeyValue k={t('planner.chickTrays')} v={num(r.eq0.chickTrays)} />
        <KeyValue k={t('planner.chickDrinkers')} v={num(r.eq0.chickDrinkers)} />
        <KeyValue k={t('planner.panFeeders')} v={num(r.eqGrow.panFeeders)} />
        <KeyValue k={t('planner.bellsShort')} v={num(r.eqGrow.bellDrinkers)} />
        <KeyValue k={`${lt(r.litter.name)} (${num(r.depth.value)} ${t('common.cm')})`} v={`${num(r.litterM3, 1)} ${t('common.m3')}`} />
        <KeyValue k={t('planner.brooding')} v={t('planner.broodArea', { area: num(r.brood.areaM2, 1), pct: num(r.brood.fraction * 100) })} />
        {r.feed.byPhase.map((p) => (
          <KeyValue key={p.phase.id} k={`${t('target.feed')} ${lt(p.phase.name)}`} v={`${num(p.bags)} × ${num(sp.feed.bagKg.value)} ${t('common.kg')}`} />
        ))}
        {!r.brood.full && (
          <KeyValue k={t('wizard.shopping.guard')} v={`${num(guardLengthM(r.brood.areaM2), 1)} ${t('common.m')}`} />
        )}
        <KeyValue k={t('wizard.shopping.thermo')} v="✓" />
        <KeyValue k={t('wizard.shopping.disinfectant')} v="✓" />
      </Card>
    </div>
  )
}
