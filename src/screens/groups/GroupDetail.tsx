import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFlock } from '../../db/hooks'
import { updateFlock } from '../../db/repo'
import { getProfile } from '../../data/birds'
import type { Place } from '../../data/schema'
import { ageOn, todayISO } from '../../calc/dates'
import { areaNeeded, climateAt } from '../../calc/birds'
import { isLaying } from '../../calc/routine'
import { t, lt } from '../../i18n'
import { num } from '../../i18n/format'
import { BirdArt } from '../../ui/BirdArt'
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
  TextInput,
  toast,
} from '../../ui/kit'
import { KeyValue, LinkCard } from '../parts'
import { PLACES } from '../Onboarding'
import { BroilerToday } from './BroilerToday'
import { ageText } from './format'

export default function GroupDetail() {
  const id = Number(useParams().id)
  const flock = useFlock(id)
  const nav = useNavigate()
  const [edit, setEdit] = useState(false)
  const [closing, setClosing] = useState(false)
  const [draft, setDraft] = useState<{
    name: string
    count: number | undefined
    place: Place
  } | null>(null)

  if (flock === undefined) return null
  const profile = flock ? getProfile(flock.profileId) : undefined
  if (!flock || !profile)
    return (
      <Page>
        <PageHeader title={t('group.title')} back />
        <EmptyState title={t('err.flockNotFound')}>
          <Button onClick={() => nav('/')}>{t('nav.home')}</Button>
        </EmptyState>
      </Page>
    )

  const age = Math.max(0, ageOn(flock.placementDate, todayISO()))
  const band = climateAt(profile, age)
  const laying = isLaying({
    id,
    kind: profile.kind,
    profile,
    purpose: flock.purpose,
    age,
    count: flock.initialCount,
    place: flock.place,
  })
  const stage = profile.cycle.template.stages.find((s) => age >= s.fromDay && age <= s.toDay)
  const area = areaNeeded(profile, age, flock.initialCount)

  return (
    <Page>
      <PageHeader title={flock.name} subtitle={lt(profile.name)} back />
      <Card tone="accent">
        <div className="flex items-center gap-3">
          <BirdArt kind={profile.kind} size={64} />
          <div className="min-w-0 flex-1">
            <div className="text-lg font-extrabold">
              {num(flock.initialCount)} {t(`unit.${profile.unit}`)}
            </div>
            <div className="text-muted">
              {ageText(age)} · {t(`place.${flock.place}`)}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {stage && <Badge tone="primary">{lt(stage.name)}</Badge>}
              {profile.dataStatus === 'limited' && (
                <Badge tone="warn">{t('common.limitedData')}</Badge>
              )}
            </div>
          </div>
        </div>
        {stage && <p className="mt-2 text-sm leading-relaxed">{lt(stage.summary)}</p>}
      </Card>

      {flock.speciesId ? (
        <div className="mt-4">
          <BroilerToday id={id} />
        </div>
      ) : (
        <>
          <SectionTitle icon="thermo">{t('group.climate')}</SectionTitle>
          <Card>
            <KeyValue
              k={t('group.comfort')}
              v={t('group.comfortVal', {
                lo: num(band.comfortMin.value),
                hi: num(band.comfortMax.value),
              })}
            />
            <KeyValue
              k={t('group.danger')}
              v={t('group.dangerRange', {
                lo: num(band.dangerLow.value),
                hi: num(band.dangerHigh.value),
              })}
            />
            <KeyValue k={t('group.space')} v={t('group.spaceVal', { n: num(area, 1) })} />
          </Card>
        </>
      )}

      <div className="mt-4 grid gap-2">
        <LinkCard
          to={`/birds/profile/${profile.id}`}
          icon="book"
          title={t('group.profile')}
          sub={t('group.profileSub')}
        />
        {laying && <LinkCard to={`/eggs?group=${id}`} icon="egg" title={t('tools.eggs')} />}
        <LinkCard to={`/brood?group=${id}`} icon="hatch" title={t('tools.brood')} />
      </div>

      <SectionTitle icon="edit">{t('group.manage')}</SectionTitle>
      {!edit ? (
        <div className="grid gap-2">
          <Button
            variant="secondary"
            icon="edit"
            onClick={() => {
              setDraft({ name: flock.name, count: flock.initialCount, place: flock.place })
              setEdit(true)
            }}
          >
            {t('common.edit')}
          </Button>
          <Button variant="secondary" onClick={() => setClosing(true)}>
            {t('group.close')}
          </Button>
        </div>
      ) : (
        draft && (
          <Card>
            <Field label={t('group.name')} htmlFor="g-name">
              <TextInput
                id="g-name"
                value={draft.name}
                onChange={(v) => setDraft({ ...draft, name: v })}
              />
            </Field>
            <Field label={t('group.count', { unit: t(`unit.${profile.unit}`) })} htmlFor="g-count">
              <NumberInput
                id="g-count"
                value={draft.count}
                onChange={(v) => setDraft({ ...draft, count: v })}
              />
            </Field>
            <Field label={t('ob.place.title')} htmlFor="g-place">
              <Select
                id="g-place"
                value={draft.place}
                onChange={(v) => setDraft({ ...draft, place: v })}
                options={PLACES.map((p) => ({ value: p.id, label: t(`place.${p.id}`) }))}
              />
            </Field>
            <div className="flex gap-2">
              <Button
                full
                disabled={!draft.count || draft.count < 1 || !draft.name.trim()}
                onClick={async () => {
                  await updateFlock(id, {
                    name: draft.name.trim(),
                    initialCount: Math.round(draft.count!),
                    place: draft.place,
                  })
                  setEdit(false)
                  toast(t('common.saved'))
                }}
              >
                {t('common.save')}
              </Button>
              <Button full variant="secondary" onClick={() => setEdit(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </Card>
        )
      )}
      <p className="mt-3 text-sm text-muted">
        <Link to="/settings#birds" className="font-semibold text-primary">
          {t('group.kindsHint')}
        </Link>
      </p>

      <ConfirmDialog
        open={closing}
        title={t('group.close')}
        body={t('group.closeBody')}
        onCancel={() => setClosing(false)}
        onConfirm={async () => {
          await updateFlock(id, { status: 'closed', closedAt: Date.now() })
          setClosing(false)
          nav('/', { replace: true })
        }}
      />
    </Page>
  )
}
