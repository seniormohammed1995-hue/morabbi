import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Brood as BroodRow } from '../../db'
import { addBrood, failBrood, hatchToGroup, useBroods } from '../../db/broods'
import { useGroups } from '../../db/birds'
import { getProfile, KINDS, profilesOf } from '../../data/birds'
import type { BirdProfile, Place } from '../../data/schema'
import { addDays, todayISO } from '../../calc/dates'
import { broodState } from '../../calc/brood'
import { t, lt } from '../../i18n'
import { dateLong, num } from '../../i18n/format'
import { BirdArt } from '../../ui/BirdArt'
import { Icon } from '../../ui/Icon'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  NumberInput,
  Page,
  PageHeader,
  SectionTitle,
  Select,
  SourceNote,
  toast,
} from '../../ui/kit'
import { FeedbackCard } from '../Feedback'
import { PLACES } from '../Onboarding'
import { ProductNudge } from '../v3/ProductNudge'

export default function Brood() {
  const broods = useBroods()
  const [params] = useSearchParams()
  const [adding, setAdding] = useState(false)
  const sitting = broods?.filter((b) => b.status === 'sitting') ?? []
  const past = broods?.filter((b) => b.status !== 'sitting') ?? []

  return (
    <Page>
      <PageHeader title={t('brood.title')} back />
      {adding ? (
        <NewBrood
          groupId={Number(params.get('group')) || undefined}
          onDone={() => setAdding(false)}
        />
      ) : (
        <>
          {broods && sitting.length === 0 && (
            <EmptyState icon="hatch" title={t('brood.empty.title')} body={t('brood.empty.body')}>
              <Button icon="plus" onClick={() => setAdding(true)}>
                {t('brood.add')}
              </Button>
            </EmptyState>
          )}
          <div className="space-y-4">
            {sitting.map((b) => (
              <BroodCard key={b.id} b={b} />
            ))}
          </div>
          <ProductNudge id="incubator" className="mt-4" />
          {sitting.length > 0 && (
            <Button
              icon="plus"
              variant="secondary"
              full
              className="mt-4"
              onClick={() => setAdding(true)}
            >
              {t('brood.add')}
            </Button>
          )}
          {past.length > 0 && (
            <>
              <SectionTitle icon="list">{t('brood.past')}</SectionTitle>
              <ul className="space-y-2">
                {past.map((b) => {
                  const p = getProfile(b.profileId)
                  return (
                    <li
                      key={b.id}
                      className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm"
                    >
                      {p && <BirdArt kind={p.kind} size={28} />}
                      <span className="flex-1">
                        {p ? lt(p.name) : ''} · {dateLong(b.startDate)}
                      </span>
                      <Badge tone={b.status === 'hatched' ? 'leaf' : 'muted'}>
                        {b.status === 'hatched'
                          ? t('brood.hatchedN', { n: num(b.hatched ?? 0), of: num(b.eggs) })
                          : t('brood.failed')}
                      </Badge>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </>
      )}
      <FeedbackCard from={t('brood.title')} />
    </Page>
  )
}

function BroodCard({ b }: { b: BroodRow }) {
  const nav = useNavigate()
  const p = getProfile(b.profileId)
  const [hatchOpen, setHatchOpen] = useState(false)
  const [failOpen, setFailOpen] = useState(false)
  const [hatched, setHatched] = useState<number | undefined>(undefined)
  const [place, setPlace] = useState<Place>('room')
  if (!p) return null
  const inc = p.breeding.incubationDays
  const s = broodState(b.startDate, todayISO(), inc.value, p.breeding.checks)
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <Card>
      <div className="flex items-center gap-4">
        <svg
          width="88"
          height="88"
          viewBox="0 0 88 88"
          role="img"
          aria-label={t('brood.dayOf', { n: num(s.day), total: num(s.hatchDay) })}
        >
          <circle cx="44" cy="44" r={r} className="fill-none stroke-surface-2" strokeWidth="9" />
          <circle
            cx="44"
            cy="44"
            r={r}
            className="fill-none stroke-primary"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${c * s.progress} ${c}`}
            transform="rotate(-90 44 44)"
          />
          <text x="44" y="42" textAnchor="middle" className="fill-ink text-[22px] font-extrabold">
            {num(s.day)}
          </text>
          <text x="44" y="60" textAnchor="middle" className="fill-muted text-[11px]">
            {t('brood.of', { n: num(s.hatchDay) })}
          </text>
        </svg>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-extrabold">
            <BirdArt kind={p.kind} size={28} /> {lt(p.name)}
          </div>
          <div className="text-sm text-muted">{t('brood.eggs', { n: num(b.eggs) })}</div>
          <div className="mt-1 font-semibold">
            {s.daysLeft > 0
              ? t('brood.left', { n: num(s.daysLeft), date: dateLong(s.hatchDate) })
              : s.late
                ? t('brood.late')
                : t('brood.hatchNow')}
          </div>
          <SourceNote item={inc} />
        </div>
      </div>

      {s.today.map((ch) => (
        <div key={ch.id} className="mt-3 rounded-xl border border-accent/40 bg-accent-soft p-3">
          <div className="flex items-center gap-2 font-bold">
            <Icon name="alert" size={18} /> {t('common.today')}: {lt(ch.title)}
          </div>
          <p className="text-sm">{lt(ch.detail)}</p>
        </div>
      ))}
      {s.next && (
        <p className="mt-3 text-sm">
          <span className="font-bold">{t('brood.next')}</span> {lt(s.next.title)} —{' '}
          {dateLong(s.next.date)}
        </p>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer font-bold text-primary">{t('brood.care')}</summary>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-sm leading-relaxed">
          {p.breeding.checks.map((ch) => (
            <li key={ch.id}>
              <span className="font-semibold">{t('brood.day', { n: num(ch.day) })}:</span>{' '}
              {lt(ch.title)} — {lt(ch.detail)}
            </li>
          ))}
          {p.breeding.care.map((x) => (
            <li key={x.ar}>{lt(x)}</li>
          ))}
        </ul>
      </details>

      {s.day >= inc.value - 2 && !hatchOpen && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button icon="hatch" onClick={() => setHatchOpen(true)}>
            {t('brood.hatchedBtn')}
          </Button>
          <Button variant="secondary" onClick={() => setFailOpen(true)}>
            {t('brood.failBtn')}
          </Button>
        </div>
      )}
      {s.day < inc.value - 2 && (
        <Button variant="ghost" className="mt-2 px-0 text-sm" onClick={() => setFailOpen(true)}>
          {t('brood.failBtn')}
        </Button>
      )}
      {hatchOpen && (
        <div className="mt-3 rounded-xl bg-leaf-soft p-3">
          <Field label={t('brood.howMany')} htmlFor={`h-${b.id}`}>
            <NumberInput id={`h-${b.id}`} value={hatched} onChange={setHatched} />
          </Field>
          <Field label={t('ob.place.title')} htmlFor={`hp-${b.id}`}>
            <Select
              id={`hp-${b.id}`}
              value={place}
              onChange={setPlace}
              options={PLACES.map((x) => ({ value: x.id, label: t(`place.${x.id}`) }))}
            />
          </Field>
          <Button
            full
            icon="check"
            disabled={!hatched || hatched < 1}
            onClick={async () => {
              const id = await hatchToGroup(b.id, Math.round(hatched!), place)
              toast(t('brood.converted'))
              nav(`/groups/${id}`)
            }}
          >
            {t('brood.convert')}
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={failOpen}
        title={t('brood.failBtn')}
        body={t('brood.failBody')}
        onCancel={() => setFailOpen(false)}
        onConfirm={async () => {
          await failBrood(b.id)
          setFailOpen(false)
        }}
      />
    </Card>
  )
}

function NewBrood({ groupId, onDone }: { groupId?: number; onDone: () => void }) {
  const groups = useGroups()
  const fromGroup = groups?.find((g) => g.id === groupId)
  const mine = [...new Set((groups ?? []).map((g) => g.profileId))]
    .map((id) => getProfile(id))
    .filter((p): p is BirdProfile => !!p)
  const all = KINDS.flatMap(profilesOf)
  const options = mine.length ? [...mine, ...all.filter((p) => !mine.includes(p))] : all
  const [profileId, setProfileId] = useState(fromGroup?.profileId ?? options[0]?.id ?? '')
  const [daysAgo, setDaysAgo] = useState<number | undefined>(0)
  const [eggs, setEggsN] = useState<number | undefined>(undefined)
  const p = getProfile(profileId)
  return (
    <Card>
      <h2 className="mb-3 text-lg font-extrabold">{t('brood.add')}</h2>
      <Field label={t('brood.which')} htmlFor="nb-p">
        <Select
          id="nb-p"
          value={profileId}
          onChange={setProfileId}
          options={options.map((x) => ({
            value: x.id,
            label: `${t(`kind.${x.kind}`)} — ${lt(x.name)}`,
          }))}
        />
      </Field>
      {p && p.breeding.broody !== 'yes' && (
        <p className="-mt-2 mb-3 text-sm text-warn">{t(`profile.broody.${p.breeding.broody}`)}</p>
      )}
      <Field label={t('brood.since')} htmlFor="nb-d" hint={t('brood.sinceHint')}>
        <NumberInput id="nb-d" value={daysAgo} onChange={setDaysAgo} />
      </Field>
      <Field
        label={t('brood.eggsQ')}
        htmlFor="nb-e"
        hint={
          p?.breeding.eggsPerSitting
            ? t('brood.eggsHint', { n: num(p.breeding.eggsPerSitting.value) })
            : undefined
        }
      >
        <NumberInput id="nb-e" value={eggs} onChange={setEggsN} />
      </Field>
      <div className="flex gap-2">
        <Button
          full
          disabled={!p || !eggs || eggs < 1}
          onClick={async () => {
            await addBrood({
              kind: p!.kind,
              profileId: p!.id,
              ...(fromGroup ? { flockId: fromGroup.id } : {}),
              startDate: addDays(todayISO(), -Math.max(0, Math.round(daysAgo ?? 0))),
              eggs: Math.round(eggs!),
            })
            onDone()
          }}
        >
          {t('common.save')}
        </Button>
        <Button full variant="secondary" onClick={onDone}>
          {t('common.cancel')}
        </Button>
      </div>
    </Card>
  )
}
