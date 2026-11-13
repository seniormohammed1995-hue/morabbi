import { useEffect, useMemo, useState } from 'react'
import type { BirdKind, BirdProfile, Place, Purpose } from '../data/schema'
import { KINDS, profilesOf } from '../data/birds'
import { RULES } from '../data/rules'
import { mixingWarnings } from '../calc/birds'
import { createGroup, onboarding, setKinds } from '../db/birds'
import { getLocation } from '../store/weather'
import { useUi } from '../store/ui'
import { markVersionSeen } from './WhatsNew'
import { t, lt, type MsgKey } from '../i18n'
import { num } from '../i18n/format'
import { BirdArt, type KindCard } from '../ui/BirdArt'
import { Icon, type IconName } from '../ui/Icon'
import { Badge, Button, Card, cx, NumberInput, Page } from '../ui/kit'
import { LocationPicker } from './weather/LocationPicker'

const CARDS: KindCard[] = ['chicken', 'pigeon', 'quail', 'duck', 'goose', 'turkey', 'chicks']

export const PLACES: Array<{ id: Place; icon: IconName }> = [
  { id: 'roof-open', icon: 'sun' },
  { id: 'roof-shaded', icon: 'shade' },
  { id: 'room', icon: 'home' },
  { id: 'balcony', icon: 'balcony' },
  { id: 'yard', icon: 'yard' },
]

interface Detail {
  card: KindCard
  kind: BirdKind
  profileId: string
  purpose: Purpose
  count: number
  ageDays: number
}

type Step =
  | { s: 'welcome' }
  | { s: 'kinds' }
  | { s: 'breed'; i: number }
  | { s: 'goal'; i: number }
  | { s: 'size'; i: number }
  | { s: 'place' }
  | { s: 'location' }

const firstProfile = (kind: BirdKind): BirdProfile | undefined => profilesOf(kind)[0]

function defaultDetail(card: KindCard): Detail | null {
  const kind: BirdKind = card === 'chicks' ? 'chicken' : card
  const p = firstProfile(kind)
  if (!p) return null
  return {
    card,
    kind,
    profileId: p.id,
    purpose: p.purposes[0]!,
    count: RULES.defaultCount[kind],
    ageDays: card === 'chicks' ? 0 : p.defaultAge,
  }
}

/** Age presets per card. Values in days. */
function agePresets(card: KindCard, p: BirdProfile): Array<{ label: MsgKey; days: number }> {
  if (card === 'chicks')
    return [
      { label: 'ob.age.days', days: 0 },
      { label: 'ob.age.week', days: 7 },
      { label: 'ob.age.2weeks', days: 14 },
      { label: 'ob.age.3weeks', days: RULES.chicksMaxAge },
    ]
  return [
    { label: 'ob.age.young', days: 14 },
    { label: 'ob.age.growing', days: 75 },
    { label: 'ob.age.adult', days: Math.max(p.defaultAge, p.cycle.endpointAge.value) },
  ]
}

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const accept = useUi((s) => s.acceptDisclaimer)
  const [step, setStep] = useState<Step>({ s: 'welcome' })
  const [cards, setCards] = useState<KindCard[]>([])
  const [details, setDetails] = useState<Detail[]>([])
  const [place, setPlace] = useState<Place>('roof-shaded')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  const warnings = useMemo(() => {
    const kinds = [...new Set(cards.map((c) => (c === 'chicks' ? 'chicken' : c)))]
    return mixingWarnings(kinds.map(firstProfile).filter((p): p is BirdProfile => !!p))
  }, [cards])

  const patch = (i: number, d: Partial<Detail>) =>
    setDetails((all) => all.map((x, j) => (j === i ? { ...x, ...d } : x)))
  const profileOf = (d: Detail) =>
    profilesOf(d.kind).find((p) => p.id === d.profileId) ?? firstProfile(d.kind)!

  const afterSize = (i: number) =>
    setStep(i + 1 < details.length ? { s: 'breed', i: i + 1 } : { s: 'place' })
  const afterBreed = (i: number) => {
    const p = profileOf(details[i]!)
    setStep(p.purposes.length > 1 ? { s: 'goal', i } : { s: 'size', i })
  }

  const finish = async () => {
    setSaving(true)
    const loc = await getLocation()
    for (const d of details) {
      await createGroup({
        profileId: d.profileId,
        purpose: d.purpose,
        count: d.count,
        ageDays: d.ageDays,
        place,
        ...(loc?.governorate ? { governorate: loc.governorate } : {}),
      })
    }
    await setKinds(details.map((d) => d.kind))
    accept()
    markVersionSeen()
    onboarding.finish()
    onDone()
  }

  if (step.s === 'welcome')
    return (
      <Page className="flex min-h-dvh flex-col justify-center">
        <div className="mx-auto mb-5 flex gap-2">
          {(['chicken', 'pigeon', 'duck'] as const).map((k) => (
            <BirdArt key={k} kind={k} size={72} />
          ))}
        </div>
        <h1 className="text-center text-3xl font-extrabold">{t('ob.welcome.title')}</h1>
        <p className="mt-2 text-center text-lg text-muted">{t('ob.welcome.body')}</p>
        <BetaStrip className="mt-6" />
        <Card className="mt-4">
          <p className="leading-relaxed">{t('disclaimer.body')}</p>
        </Card>
        <Button className="mt-6" full onClick={() => setStep({ s: 'kinds' })}>
          {t('ob.start')}
        </Button>
      </Page>
    )

  if (step.s === 'kinds')
    return (
      <Page>
        <Header
          title={t('ob.kinds.title')}
          hint={t('ob.kinds.hint')}
          onBack={() => setStep({ s: 'welcome' })}
        />
        <div
          className="grid grid-cols-2 gap-3 min-[400px]:grid-cols-3"
          role="group"
          aria-label={t('ob.kinds.title')}
        >
          {CARDS.map((c) => {
            const on = cards.includes(c)
            const available = (c === 'chicks' ? KINDS : [c]).some((k) => profilesOf(k).length > 0)
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                disabled={!available}
                onClick={() => setCards((cur) => (on ? cur.filter((x) => x !== c) : [...cur, c]))}
                className={cx(
                  'relative flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition disabled:opacity-40',
                  on ? 'border-primary bg-primary-soft' : 'border-line bg-surface',
                )}
              >
                {on && (
                  <span className="absolute end-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-ink">
                    <Icon name="check" size={16} />
                  </span>
                )}
                <BirdArt kind={c} size={64} />
                <span className="text-lg font-extrabold">{t(`kind.${c}`)}</span>
                {c === 'chicks' && (
                  <span className="text-xs text-muted">{t('kind.chicks.sub')}</span>
                )}
              </button>
            )
          })}
        </div>
        {warnings.map((w) => (
          <Card key={`${w.a}${w.b}`} tone="warn" className="mt-4">
            <h2 className="flex items-center gap-2 font-bold text-warn">
              <Icon name="alert" size={20} />
              {t('ob.mix.title', { a: t(`kind.${w.a}`), b: t(`kind.${w.b}`) })}
            </h2>
            <ul className="mt-1 list-disc space-y-1 ps-5 text-sm">
              {w.reasons.map((r) => (
                <li key={r.ar}>{lt(r)}</li>
              ))}
            </ul>
            <p className="mt-1 text-sm font-semibold">{t('ob.mix.body')}</p>
          </Card>
        ))}
        <BottomBar>
          <Button
            full
            disabled={cards.length === 0}
            onClick={() => {
              const ds = CARDS.filter((c) => cards.includes(c))
                .map(defaultDetail)
                .filter((d): d is Detail => d !== null)
              setDetails(ds)
              setStep({ s: 'breed', i: 0 })
            }}
          >
            {cards.length === 0 ? t('ob.kinds.none') : t('common.next')}
          </Button>
        </BottomBar>
      </Page>
    )

  if (step.s === 'breed' || step.s === 'goal' || step.s === 'size') {
    const d = details[step.i]!
    const p = profileOf(d)
    const back = () => {
      if (step.s === 'size')
        setStep(p.purposes.length > 1 ? { s: 'goal', i: step.i } : { s: 'breed', i: step.i })
      else if (step.s === 'goal') setStep({ s: 'breed', i: step.i })
      else setStep(step.i === 0 ? { s: 'kinds' } : { s: 'size', i: step.i - 1 })
    }
    const total = p.purposes.length > 1 ? 3 : 2
    const n = step.s === 'breed' ? 1 : step.s === 'goal' ? 2 : total
    const kindLabel = d.card === 'chicks' ? t('kind.chicks') : t(`kind.${d.kind}`)
    return (
      <Page>
        <div className="flex items-center gap-3 pt-3">
          <BirdArt kind={d.card} size={44} />
          <div className="text-sm text-muted">
            <div className="font-bold text-ink">{kindLabel}</div>
            {t('ob.step', { n: num(n), total: num(total) })}
          </div>
        </div>

        {step.s === 'breed' && (
          <>
            <Header
              title={
                d.card === 'chicks'
                  ? t('ob.chicks.which')
                  : t('ob.breed.title', { kind: t(`kind.${d.kind}`) })
              }
              onBack={back}
            />
            {d.card === 'chicks' && (
              <div className="mb-4 flex flex-wrap gap-2">
                {KINDS.filter((k) => profilesOf(k).length > 0).map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={d.kind === k}
                    onClick={() => {
                      const fp = firstProfile(k)!
                      patch(step.i, {
                        kind: k,
                        profileId: fp.id,
                        purpose: fp.purposes[0]!,
                        count: RULES.defaultCount[k],
                      })
                    }}
                    className={cx(
                      'flex min-h-11 items-center gap-1 rounded-full border-2 pe-3 ps-1 font-bold',
                      d.kind === k ? 'border-primary bg-primary-soft' : 'border-line bg-surface',
                    )}
                  >
                    <BirdArt kind={k} size={32} /> {t(`kind.${k}`)}
                  </button>
                ))}
              </div>
            )}
            <OptionList
              value={d.profileId}
              options={profilesOf(d.kind).map((x) => ({
                value: x.id,
                label: lt(x.name),
                sub: lt(x.description),
                badge:
                  x.dataStatus === 'limited' ? (
                    <Badge tone="warn">{t('common.limitedData')}</Badge>
                  ) : undefined,
              }))}
              onPick={(id) => {
                const np = profilesOf(d.kind).find((x) => x.id === id)!
                patch(step.i, {
                  profileId: id,
                  purpose: np.purposes.includes(d.purpose) ? d.purpose : np.purposes[0]!,
                })
              }}
            />
            <BottomBar>
              <DontKnow
                onClick={() => {
                  const fp = firstProfile(d.kind)!
                  patch(step.i, { profileId: fp.id, purpose: fp.purposes[0]! })
                  setStep(
                    fp.purposes.length > 1 ? { s: 'goal', i: step.i } : { s: 'size', i: step.i },
                  )
                }}
              />
              <Button full onClick={() => afterBreed(step.i)}>
                {t('common.next')}
              </Button>
            </BottomBar>
          </>
        )}

        {step.s === 'goal' && (
          <>
            <Header title={t('ob.goal.title')} onBack={back} />
            <OptionList
              value={d.purpose}
              options={p.purposes.map((x) => ({ value: x, label: t(`wizard.purpose.${x}`) }))}
              onPick={(x) => patch(step.i, { purpose: x as Purpose })}
            />
            <BottomBar>
              <DontKnow
                onClick={() => {
                  patch(step.i, { purpose: p.purposes[0]! })
                  setStep({ s: 'size', i: step.i })
                }}
              />
              <Button full onClick={() => setStep({ s: 'size', i: step.i })}>
                {t('common.next')}
              </Button>
            </BottomBar>
          </>
        )}

        {step.s === 'size' && (
          <>
            <Header title={t('ob.count.title', { unit: t(`unit.${p.unit}`) })} onBack={back} />
            <NumberInput
              ariaLabel={t('ob.count.title', { unit: t(`unit.${p.unit}`) })}
              value={d.count}
              onChange={(v) => patch(step.i, { count: Math.max(1, Math.round(v ?? 1)) })}
            />
            <h2 className="mb-2 mt-6 text-xl font-extrabold">{t('ob.age.title')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {agePresets(d.card, p).map((a) => (
                <button
                  key={a.label}
                  type="button"
                  aria-pressed={d.ageDays === a.days}
                  onClick={() => patch(step.i, { ageDays: a.days })}
                  className={cx(
                    'min-h-12 rounded-xl border-2 px-3 font-bold',
                    d.ageDays === a.days
                      ? 'border-primary bg-primary-soft'
                      : 'border-line bg-surface',
                  )}
                >
                  {t(a.label)}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-sm font-semibold text-muted" htmlFor="ob-weeks">
              {t('ob.age.exact')}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <NumberInput
                id="ob-weeks"
                value={Math.round((d.ageDays / 7) * 10) / 10}
                decimal
                onChange={(v) => {
                  const days = Math.max(0, Math.round((v ?? 0) * 7))
                  patch(step.i, {
                    ageDays: d.card === 'chicks' ? Math.min(days, RULES.chicksMaxAge) : days,
                  })
                }}
              />
              <span className="shrink-0 font-semibold">{t('ob.weeks')}</span>
            </div>
            <BottomBar>
              <DontKnow
                onClick={() => {
                  patch(step.i, {
                    count: RULES.defaultCount[d.kind],
                    ageDays: d.card === 'chicks' ? 0 : p.defaultAge,
                  })
                  afterSize(step.i)
                }}
              />
              <Button full onClick={() => afterSize(step.i)}>
                {t('common.next')}
              </Button>
            </BottomBar>
          </>
        )}
      </Page>
    )
  }

  if (step.s === 'place')
    return (
      <Page>
        <Header
          title={t('ob.place.title')}
          hint={t('ob.place.hint')}
          onBack={() => setStep({ s: 'size', i: details.length - 1 })}
        />
        <OptionList
          value={place}
          options={PLACES.map((x) => ({
            value: x.id,
            label: t(`place.${x.id}`),
            sub: t(`place.${x.id}.sub`),
            icon: x.icon,
          }))}
          onPick={(x) => setPlace(x as Place)}
        />
        <BottomBar>
          <Button full onClick={() => setStep({ s: 'location' })}>
            {t('common.next')}
          </Button>
        </BottomBar>
      </Page>
    )

  return (
    <Page>
      <Header
        title={t('ob.location.title')}
        hint={t('ob.location.hint')}
        onBack={() => setStep({ s: 'place' })}
      />
      <LocationPicker />
      <BottomBar>
        <Button full icon="check" disabled={saving} onClick={() => void finish()}>
          {t('ob.finish')}
        </Button>
      </BottomBar>
    </Page>
  )
}

export function BetaStrip({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cx(
        'flex items-center gap-2 rounded-xl border border-warn/30 bg-warn-soft p-3 text-sm font-bold text-warn',
        className,
      )}
    >
      <Icon name="alert" size={20} className="shrink-0" />
      {t('ob.beta')}
    </div>
  )
}

function Header({ title, hint, onBack }: { title: string; hint?: string; onBack?: () => void }) {
  return (
    <header className="mb-4 pt-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="-ms-2 mb-1 grid h-11 w-11 place-items-center rounded-full"
          aria-label={t('nav.back')}
        >
          <Icon name="back" />
        </button>
      )}
      <h1 className="text-2xl font-extrabold">{title}</h1>
      {hint && <p className="mt-1 text-muted">{hint}</p>}
    </header>
  )
}

function OptionList({
  value,
  options,
  onPick,
}: {
  value: string
  options: Array<{
    value: string
    label: string
    sub?: string
    icon?: IconName
    badge?: React.ReactNode
  }>
  onPick: (v: string) => void
}) {
  return (
    <div className="space-y-2" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onPick(o.value)}
          className={cx(
            'flex w-full items-start gap-3 rounded-2xl border-2 p-3 text-start transition',
            value === o.value ? 'border-primary bg-primary-soft' : 'border-line bg-surface',
          )}
        >
          {o.icon && <Icon name={o.icon} size={28} className="mt-0.5 shrink-0 text-primary" />}
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2 text-lg font-bold">
              {o.label} {o.badge}
            </span>
            {o.sub && (
              <span className="mt-0.5 block text-sm leading-relaxed text-muted">{o.sub}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}

function DontKnow({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="secondary" full onClick={onClick}>
      {t('ob.dontKnow')}
    </Button>
  )
}

function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-6 flex gap-2 border-t border-line bg-bg/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur">
      {children}
    </div>
  )
}
