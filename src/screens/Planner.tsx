import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFlocks } from '../db/hooks'
import { getSpecies, SPECIES } from '../data'
import type { HouseType, Season, SpeciesData } from '../data/schema'
import { ageOn, todayISO } from '../calc/dates'
import { valueAt, stepAt } from '../calc/interp'
import { computeLayout } from '../calc/layout'
import {
  broodingSchedule,
  density,
  equipment,
  heaterPlan,
  litterVolumeM3,
  marketAgeDays,
  seasonForDate,
  ventilation,
} from '../calc/planner'
import { files, svgToPng } from '../platform'
import { t, lt } from '../i18n'
import { num, range } from '../i18n/format'
import { Badge, Button, Card, Choice, ConfidenceBadge, Field, NumberInput, Page, PageHeader, Select, SourceNote, Tabs, Why } from '../ui/kit'
import { KeyValue } from './parts'
import { PlanLegend, PlanSvg } from './PlanSvg'
import { Behaviour } from './Behaviour'

type Tab = 'density' | 'heat' | 'vent' | 'floor' | 'equip' | 'light' | 'map' | 'small'
const HOUSES: HouseType[] = ['roof', 'room', 'yard', 'open', 'closed']

interface Inputs {
  speciesId: string
  count: number
  houseType: HouseType
  length: number
  width: number
  height: number
  season: Season
}

export default function Planner() {
  const [params, setParams] = useSearchParams()
  const flocks = useFlocks()
  const active = flocks?.filter((f) => f.status === 'active') ?? []
  const flockParam = params.get('flock')
  const flock = active.find((f) => String(f.id) === flockParam) ?? (flockParam === 'custom' ? undefined : active[0])
  const [custom, setCustom] = useState<Inputs>({
    speciesId: 'broiler-white',
    count: 200,
    houseType: 'roof',
    length: 6,
    width: 4,
    height: 2.5,
    season: seasonForDate(todayISO()),
  })
  const inputs: Inputs = flock
    ? {
        speciesId: flock.speciesId,
        count: flock.initialCount,
        houseType: flock.houseType,
        length: flock.length,
        width: flock.width,
        height: flock.height,
        season: seasonForDate(todayISO()),
      }
    : custom
  const entry = getSpecies(inputs.speciesId) ?? Object.values(SPECIES)[0]!
  const sp = entry.data
  const market = marketAgeDays(sp)
  const flockAge = flock ? Math.max(0, Math.min(market, ageOn(flock.placementDate, todayISO()))) : 0
  const [day, setDay] = useState<number | null>(null)
  const planDay = day ?? flockAge
  const [tab, setTab] = useState<Tab>('density')

  if (flocks === undefined) return null

  const sel = flock ? String(flock.id) : 'custom'
  return (
    <Page>
      <PageHeader title={t('planner.title')} />
      <Field label={t('planner.pickFlock')} htmlFor="pl-flock">
        <Select
          id="pl-flock"
          value={sel}
          onChange={(v) => {
            setParams({ flock: v }, { replace: true })
            setDay(null)
          }}
          options={[...active.map((f) => ({ value: String(f.id), label: f.name })), { value: 'custom', label: t('planner.custom') }]}
        />
      </Field>

      {!flock && (
        <Card className="mb-4">
          <Field label={t('wizard.count')} htmlFor="pl-count">
            <NumberInput id="pl-count" value={custom.count} onChange={(v) => v && v > 0 && setCustom({ ...custom, count: Math.round(v) })} />
          </Field>
          <Field label={t('wizard.place')}>
            <Choice value={custom.houseType} onChange={(v) => setCustom({ ...custom, houseType: v })} cols={3} options={HOUSES.map((h) => ({ value: h, label: t(`wizard.house.${h}`) }))} />
          </Field>
          <Field label={t('wizard.dims')}>
            <div className="grid grid-cols-3 gap-2">
              {(['length', 'width', 'height'] as const).map((k) => (
                <NumberInput key={k} ariaLabel={t(`wizard.${k}`)} decimal value={custom[k]} onChange={(v) => v && v > 0 && setCustom({ ...custom, [k]: v })} />
              ))}
            </div>
          </Field>
          <Field label={t('wizard.seasonLabel')}>
            <Choice value={custom.season} onChange={(v) => setCustom({ ...custom, season: v })} cols={3} options={(['summer', 'mild', 'winter'] as Season[]).map((x) => ({ value: x, label: t(`season.${x}`) }))} />
          </Field>
        </Card>
      )}

      <Field label={`${t('planner.day')}: ${planDay === 0 ? t('common.placementDay') : t('common.ageDays', { n: num(planDay) })}`} htmlFor="pl-day">
        <input id="pl-day" type="range" min={0} max={market} value={planDay} onChange={(e) => setDay(Number(e.target.value))} className="w-full accent-[var(--c-primary)]" />
      </Field>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={(['density', 'heat', 'vent', 'floor', 'equip', 'light', 'map', 'small'] as Tab[]).map((x) => ({ value: x, label: t(`planner.tab.${x}`) }))}
      />
      <PlannerBody sp={sp} inp={inputs} day={planDay} tab={tab} />
    </Page>
  )
}

function PlannerBody({ sp, inp, day, tab }: { sp: SpeciesData; inp: Inputs; day: number; tab: Tab }) {
  const area = inp.length * inp.width
  const svgRef = useRef<SVGSVGElement>(null)
  const d = density(sp, { houseType: inp.houseType, season: inp.season, areaM2: area, count: inp.count })
  const sched = broodingSchedule(sp, inp.count, area)
  const heat = heaterPlan(sp, inp.count)
  const vent = ventilation(sp, inp.count, day, area, Math.min(inp.length, inp.width) * inp.height)
  const eq = equipment(sp, inp.count, day)
  const layout = useMemo(
    () => computeLayout(sp, { length: inp.length, width: inp.width, height: inp.height, houseType: inp.houseType, birds: inp.count, day }),
    [sp, inp.length, inp.width, inp.height, inp.houseType, inp.count, day],
  )
  const closed = inp.houseType === 'closed'
  const env = sp.environment

  switch (tab) {
    case 'density':
      return (
        <div className="space-y-3">
          <Card tone={d.status === 'ok' ? 'leaf' : d.status === 'tight' ? 'warn' : 'danger'}>
            <h3 className="text-lg font-extrabold">{t(`wizard.fit.${d.status}`)}</h3>
            <KeyValue k={t('planner.area')} v={`${num(area, 1)} ${t('common.m2')}`} />
            <KeyValue k={t('planner.maxDensity')} v={t('planner.densityKg', { kg: num(d.maxKgPerM2, 1) })} />
            <KeyValue k={t('planner.maxBirds')} v={num(d.maxBirds)} />
            <KeyValue k={t('planner.density')} v={`${t('planner.densityBirds', { n: num(d.birdsPerM2AtMarket, 1) })} · ${t('planner.densityKg', { kg: num(d.kgPerM2AtMarket, 1) })}`} />
            <Why>{t('planner.densityWhy')}</Why>
            <SourceNote item={sp.space.maxDensityKgPerM2[inp.houseType]} />
            {d.summerFactor !== 1 && <SourceNote item={sp.space.summerDensityFactor} />}
          </Card>
          <Card>
            <h3 className="font-bold">{t('planner.broodSchedule')}</h3>
            {sched.map((s) => (
              <KeyValue
                key={s.day}
                k={s.day === 0 ? t('common.placementDay') : t('common.ageDays', { n: num(s.day) })}
                v={s.full ? t('planner.fullHouse') : t('planner.broodArea', { area: num(s.areaM2, 1), pct: num(s.fraction * 100) })}
              />
            ))}
            <Why>{t('planner.broodingWhy')}</Why>
            <SourceNote item={sp.space.broodingDensity} />
          </Card>
        </div>
      )
    case 'heat':
      return (
        <div className="space-y-3">
          <Card>
            <h3 className="font-bold">{t('planner.heater')}</h3>
            <p className="mt-1 text-lg font-extrabold">{t('planner.heaterCount', { n: num(heat.count), name: lt(heat.heater.name) })}</p>
            <p className="mt-1 text-sm">{lt(heat.heater.note)}</p>
            <Why>{t('planner.heaterWhy', { n: range(heat.heater.chicksPerUnit) })}</Why>
            <SourceNote item={heat.heater.chicksPerUnit} />
            {heat.alternatives.map((a) => (
              <p key={a.id} className="mt-2 text-sm text-muted">
                {lt(a.name)}: {num(Math.ceil(inp.count / a.chicksPerUnit.value))}
              </p>
            ))}
          </Card>
          <Card>
            <h3 className="font-bold">{t('planner.tempTable')}</h3>
            <table className="num mt-2 w-full text-center text-sm">
              <thead>
                <tr className="text-muted">
                  <th className="py-1">{t('common.age')}</th>
                  <th>{t('planner.house')}</th>
                  <th>{t('planner.underHeater')}</th>
                  <th>{t('target.rh')}</th>
                </tr>
              </thead>
              <tbody>
                {env.temperature.points.map((p) => (
                  <tr key={p.day} className={p.day <= day && day < p.day + 3 ? 'bg-accent-soft font-bold' : ''}>
                    <td className="py-1">{num(p.day)}</td>
                    <td>{num(p.value)}°</td>
                    <td>{num(valueAt(env.spotBroodingTemperature, p.day).value)}°</td>
                    <td>{range(valueAt(env.humidity, p.day))}٪</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Why>{t('target.why.temp')}</Why>
            <SourceNote item={env.temperature} />
            <SourceNote item={env.spotBroodingTemperature} />
          </Card>
          <Card>
            <h3 className="mb-2 font-bold">{t('planner.behaviour')}</h3>
            <Behaviour sp={sp} />
          </Card>
        </div>
      )
    case 'vent':
      return (
        <div className="space-y-3">
          <Card>
            <KeyValue k={t('planner.minVent')} v={t('planner.ventValue', { v: num(vent.minM3h) })} />
            {closed && <KeyValue k={t('planner.maxVent')} v={t('planner.ventValue', { v: num(vent.maxM3h) })} />}
            <Why>{t('planner.ventWhy')}</Why>
            <SourceNote item={sp.ventilation.minPerBird} />
          </Card>
          {closed ? (
            <Card>
              <KeyValue k={t('planner.fans')} v={t('planner.fansValue', { n: num(vent.fans), cap: num(sp.ventilation.fanCapacity.value) })} />
              <ConfidenceBadge confidence={sp.ventilation.fanCapacity.confidence} />
              <SourceNote item={sp.ventilation.fanCapacity} />
              <KeyValue k={t('planner.pads')} v={t('planner.padsValue', { a: num(vent.padAreaM2, 1) })} />
              <SourceNote item={sp.ventilation.padFaceVelocity} />
              <KeyValue k={t('planner.airSpeed')} v={`${range(sp.ventilation.tunnelAirSpeed, 1)} ${sp.ventilation.tunnelAirSpeed.unit}`} />
              <SourceNote item={sp.ventilation.tunnelAirSpeed} />
            </Card>
          ) : (
            <Card>
              <KeyValue k={t('planner.windows')} v={t('planner.windowsValue', { a: num(vent.windowAreaM2, 1) })} />
              <ConfidenceBadge confidence={sp.ventilation.windowAreaPct.confidence} />
              <Why>{t('planner.windowsWhy')}</Why>
              <SourceNote item={sp.ventilation.windowAreaPct} />
            </Card>
          )}
          <Card>
            <h3 className="font-bold">{t('planner.limits')}</h3>
            <KeyValue k={t('planner.ammonia')} v={`< ${num(sp.ventilation.ammoniaMaxPpm.value)} ${sp.ventilation.ammoniaMaxPpm.unit}`} />
            <p className="text-sm text-muted">{t('planner.ammoniaHint')}</p>
            <KeyValue k={t('planner.co2')} v={`< ${num(sp.ventilation.co2MaxPpm.value)} ${sp.ventilation.co2MaxPpm.unit}`} />
            <KeyValue k={t('planner.rhMax')} v={`${range(sp.ventilation.rhMax)}٪`} />
            <SourceNote item={sp.ventilation.ammoniaMaxPpm} />
          </Card>
        </div>
      )
    case 'floor':
      return (
        <div className="space-y-3">
          <h3 className="font-bold">{t('planner.floors')}</h3>
          {sp.housing.floors.map((f) => (
            <Card key={f.id}>
              <div className="flex items-center justify-between">
                <h4 className="font-bold">{lt(f.name)}</h4>
                <Badge tone={f.rating === 'recommended' ? 'leaf' : f.rating === 'acceptable' ? 'warn' : 'danger'}>{t(`planner.rating.${f.rating}`)}</Badge>
              </div>
              <p className="mt-1 text-sm">✓ {lt(f.pros)}</p>
              <p className="text-sm text-muted">✗ {lt(f.cons)}</p>
            </Card>
          ))}
          <h3 className="pt-2 font-bold">{t('planner.litters')}</h3>
          {sp.housing.litters.map((l) => {
            const depth = inp.season === 'winter' ? l.depthWinter : l.depthSummer
            return (
              <Card key={l.id}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">{lt(l.name)}</h4>
                  <Badge tone={l.rating === 'recommended' ? 'leaf' : l.rating === 'acceptable' ? 'warn' : 'danger'}>{t(`planner.rating.${l.rating}`)}</Badge>
                </div>
                <KeyValue k={`${t('planner.depth')} — ${t('planner.depthSummer')}`} v={range(l.depthSummer)} />
                <KeyValue k={`${t('planner.depth')} — ${t('planner.depthWinter')}`} v={range(l.depthWinter)} />
                <p className="text-sm text-muted">{t('planner.litterQty', { m3: num(litterVolumeM3(area, depth.value), 1) })}</p>
                <p className="mt-1 text-sm">{lt(l.note)}</p>
                <ConfidenceBadge confidence={depth.confidence} />
                <SourceNote item={depth} />
              </Card>
            )
          })}
          <Card tone="accent">
            <h4 className="font-bold">{t('planner.wetLitter')}</h4>
            <p className="text-sm">{lt(sp.housing.wetLitter)}</p>
            <h4 className="mt-3 font-bold">{t('planner.litterChange')}</h4>
            <p className="text-sm">{lt(sp.housing.litterChange)}</p>
          </Card>
        </div>
      )
    case 'equip':
      return (
        <Card>
          <h3 className="font-bold">{t('planner.equipAt', { d: num(day), n: num(inp.count) })}</h3>
          {eq.supplementary && (
            <>
              <KeyValue k={t('planner.chickTrays')} v={num(eq.chickTrays)} />
              <KeyValue k={t('planner.chickDrinkers')} v={num(eq.chickDrinkers)} />
            </>
          )}
          <KeyValue k={t('planner.panFeeders')} v={num(eq.panFeeders)} />
          <KeyValue k={t('planner.trough')} v={t('planner.troughValue', { m: num(eq.troughM, 1) })} />
          <KeyValue k={t('planner.nipples')} v={num(eq.nipples)} />
          <KeyValue k={t('planner.bells')} v={num(eq.bellDrinkers)} />
          <Why>{t('planner.equipHeight')}</Why>
          <SourceNote item={sp.equipment.panFeederBirds} />
          <SourceNote item={sp.equipment.bellDrinkerBirds} />
          <SourceNote item={sp.equipment.supplementaryUntilDay} />
        </Card>
      )
    case 'light': {
      const pts = env.lightHours.points
      return (
        <Card>
          <h3 className="font-bold">{t('planner.lightTable')}</h3>
          <table className="num mt-2 w-full text-center text-sm">
            <thead>
              <tr className="text-muted">
                <th className="py-1">{t('common.age')}</th>
                <th>{t('planner.lightHours')}</th>
                <th>{t('planner.lightDark')}</th>
                <th>{t('planner.lightIntensity')}</th>
              </tr>
            </thead>
            <tbody>
              {pts.map((p, i) => {
                const next = pts[i + 1]
                const label = next ? `${num(p.day)}–${num(next.day - 1)}` : `${num(p.day)}+`
                return (
                  <tr key={p.day} className={day >= p.day && (!next || day < next.day) ? 'bg-accent-soft font-bold' : ''}>
                    <td className="py-1">{label}</td>
                    <td>{num(p.value)}</td>
                    <td>{num(24 - p.value)}</td>
                    <td>{num(stepAt(env.lightIntensity, p.day))}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <Why>{t('planner.lightWhy')}</Why>
          <SourceNote item={env.lightHours} />
          <SourceNote item={env.lightIntensity} />
        </Card>
      )
    }
    case 'map':
      return (
        <div className="space-y-3">
          <h3 className="font-bold">{t('planner.mapTitle')}</h3>
          <PlanSvg ref={svgRef} layout={layout} title={t('planner.mapTitle')} />
          <PlanLegend closed={closed} brood={!!layout.brood} />
          <div className="no-print grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              icon="download"
              onClick={async () => {
                if (svgRef.current) files.save(await svgToPng(svgRef.current, 1600), `morabbi-plan-day${day}.png`)
              }}
            >
              {t('common.exportPng')}
            </Button>
            <Button
              variant="secondary"
              icon="download"
              onClick={() => {
                if (!svgRef.current) return
                const legend = document.getElementById('plan-summary')?.outerHTML ?? ''
                files.print(`<h1>${t('planner.mapTitle')}</h1>${svgRef.current.outerHTML}${legend}`, t('planner.mapTitle'))
              }}
            >
              {t('common.exportPdf')}
            </Button>
          </div>
          <div id="plan-summary">
            <Card>
              <KeyValue k={t('planner.area')} v={`${num(layout.length, 1)} × ${num(layout.width, 1)} ${t('common.m')}`} />
              {layout.brood && <KeyValue k={t('planner.brooding')} v={`${num(layout.brood.w * layout.brood.h, 1)} ${t('common.m2')}`} />}
              {layout.heaters.length > 0 && <KeyValue k={t('planner.legend.heater')} v={num(layout.heaters.length)} />}
              <KeyValue k={t('planner.legend.feeder')} v={num(eq.panFeeders)} />
              <KeyValue k={t('planner.legend.drinker')} v={num(eq.bellDrinkers)} />
              {closed ? <KeyValue k={t('planner.legend.fan')} v={num(vent.fans)} /> : <KeyValue k={t('planner.legend.window')} v={num(layout.windows.length)} />}
            </Card>
          </div>
        </div>
      )
    case 'small':
      return (
        <Card>
          <h3 className="mb-2 font-bold">{t('planner.small.title')}</h3>
          <ul className="list-disc space-y-2 ps-5">
            {sp.housing.smallSpaceTips.map((tip, i) => (
              <li key={i}>{lt(tip)}</li>
            ))}
          </ul>
        </Card>
      )
  }
}
