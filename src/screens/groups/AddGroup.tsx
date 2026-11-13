import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { BirdKind, Place, Purpose } from '../../data/schema'
import { KINDS, profilesOf } from '../../data/birds'
import { RULES } from '../../data/rules'
import { createGroup, toggleKind, useKinds } from '../../db/birds'
import { mixingWarnings } from '../../calc/birds'
import { t, lt } from '../../i18n'
import { BirdArt } from '../../ui/BirdArt'
import { Icon } from '../../ui/Icon'
import {
  Badge,
  Button,
  Card,
  Choice,
  cx,
  Field,
  NumberInput,
  Page,
  PageHeader,
  Select,
  toast,
} from '../../ui/kit'
import { PLACES } from '../Onboarding'

/** Add a group of any kind from one screen (after onboarding). */
export default function AddGroup() {
  const nav = useNavigate()
  const kinds = useKinds()
  const [kind, setKind] = useState<BirdKind>('chicken')
  const breeds = profilesOf(kind)
  const [profileId, setProfileId] = useState<string>(breeds[0]?.id ?? '')
  const profile = breeds.find((p) => p.id === profileId) ?? breeds[0]
  const [purpose, setPurpose] = useState<Purpose | undefined>(profile?.purposes[0])
  const [count, setCount] = useState<number | undefined>(RULES.defaultCount[kind])
  const [weeks, setWeeks] = useState<number | undefined>(undefined)
  const [place, setPlace] = useState<Place>('roof-shaded')

  const pickKind = (k: BirdKind) => {
    setKind(k)
    const p = profilesOf(k)[0]
    setProfileId(p?.id ?? '')
    setPurpose(p?.purposes[0])
    setCount(RULES.defaultCount[k])
  }

  const others = (kinds ?? [])
    .filter((k) => k !== kind)
    .map((k) => profilesOf(k)[0])
    .filter((p) => !!p)
  const warnings = profile ? mixingWarnings([profile, ...others]) : []

  return (
    <Page>
      <PageHeader title={t('add.title')} back />
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('add.kind')}>
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            disabled={profilesOf(k).length === 0}
            onClick={() => pickKind(k)}
            className={cx(
              'flex flex-col items-center rounded-2xl border-2 p-2 font-bold disabled:opacity-40',
              kind === k ? 'border-primary bg-primary-soft' : 'border-line bg-surface',
            )}
          >
            <BirdArt kind={k} size={48} />
            {t(`kind.${k}`)}
          </button>
        ))}
      </div>

      {profile && (
        <div className="mt-5">
          <Field label={t('add.breed')} htmlFor="a-breed" hint={lt(profile.description)}>
            <Select
              id="a-breed"
              value={profile.id}
              onChange={(v) => {
                setProfileId(v)
                const np = breeds.find((p) => p.id === v)!
                if (!purpose || !np.purposes.includes(purpose)) setPurpose(np.purposes[0])
              }}
              options={breeds.map((p) => ({
                value: p.id,
                label:
                  lt(p.name) + (p.dataStatus === 'limited' ? ` (${t('common.limitedData')})` : ''),
              }))}
            />
          </Field>
          {profile.purposes.length > 1 && (
            <Field label={t('ob.goal.title')}>
              <Choice
                value={purpose}
                onChange={setPurpose}
                options={profile.purposes.map((x) => ({
                  value: x,
                  label: t(`wizard.purpose.${x}`),
                }))}
              />
            </Field>
          )}
          <Field label={t('ob.count.title', { unit: t(`unit.${profile.unit}`) })} htmlFor="a-count">
            <NumberInput id="a-count" value={count} onChange={setCount} />
          </Field>
          <Field label={t('add.ageWeeks')} htmlFor="a-age" hint={t('add.ageHint')}>
            <NumberInput id="a-age" decimal value={weeks} onChange={setWeeks} />
          </Field>
          <Field label={t('ob.place.title')} htmlFor="a-place">
            <Select
              id="a-place"
              value={place}
              onChange={setPlace}
              options={PLACES.map((p) => ({ value: p.id, label: t(`place.${p.id}`) }))}
            />
          </Field>
          {profile.dataStatus === 'limited' && (
            <p className="mb-3">
              <Badge tone="warn">{t('common.limitedData')}</Badge>{' '}
              <span className="text-sm text-muted">{t('add.limited')}</span>
            </p>
          )}
          {warnings.map((w) => (
            <Card key={`${w.a}${w.b}`} tone="warn" className="mb-3">
              <h2 className="flex items-center gap-2 font-bold text-warn">
                <Icon name="alert" size={20} />
                {t('ob.mix.title', { a: t(`kind.${w.a}`), b: t(`kind.${w.b}`) })}
              </h2>
              <ul className="mt-1 list-disc ps-5 text-sm">
                {w.reasons.map((r) => (
                  <li key={r.ar}>{lt(r)}</li>
                ))}
              </ul>
            </Card>
          ))}
          <Button
            full
            icon="check"
            disabled={!count || count < 1}
            onClick={async () => {
              const id = await createGroup({
                profileId: profile.id,
                purpose: purpose ?? profile.purposes[0]!,
                count: count!,
                ageDays: weeks === undefined ? profile.defaultAge : Math.round(weeks * 7),
                place,
              })
              await toggleKind(profile.kind, true)
              toast(t('common.saved'))
              nav(`/groups/${id}`, { replace: true })
            }}
          >
            {t('add.save')}
          </Button>
        </div>
      )}
    </Page>
  )
}
