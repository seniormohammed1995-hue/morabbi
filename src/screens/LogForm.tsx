import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useFlockView } from '../db/hooks'
import { db, type DailyLog } from '../db'
import { saveLog } from '../db/repo'
import { ageOn, todayISO } from '../calc/dates'
import { dailyFeedG } from '../calc/feed'
import { valueAt } from '../calc/interp'
import { RULES } from '../data/rules'
import { compressImage, files } from '../platform'
import { t } from '../i18n'
import { dateLong, num } from '../i18n/format'
import { Icon } from '../ui/Icon'
import { Button, Field, NumberInput, Page, PageHeader, Stepper, toast } from '../ui/kit'

interface Form {
  date: string
  deaths: number
  culls: number
  feedKg?: number
  waterL?: number
  sampleWeightG?: number
  sampleSize?: number
  tempC?: number
  rhPct?: number
  notes: string
  photo?: Blob
}

const empty = (date: string): Form => ({ date, deaths: 0, culls: 0, notes: '' })

function fromLog(l: DailyLog): Form {
  return {
    date: l.date,
    deaths: l.deaths,
    culls: l.culls,
    feedKg: l.feedKg,
    waterL: l.waterL,
    sampleWeightG: l.sampleWeightG,
    sampleSize: l.sampleSize,
    tempC: l.tempC,
    rhPct: l.rhPct,
    notes: l.notes ?? '',
    photo: l.photo,
  }
}

export default function LogForm() {
  const { id } = useParams()
  const flockId = Number(id)
  const [params] = useSearchParams()
  const view = useFlockView(flockId)
  const nav = useNavigate()
  const [form, setForm] = useState<Form>(() => empty(params.get('date') ?? todayISO()))
  const [more, setMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedDate, setLoadedDate] = useState<string | null>(null)

  // Load an existing log for the selected date.
  useEffect(() => {
    if (loadedDate === form.date) return
    let cancelled = false
    void db.logs
      .where('[flockId+date]')
      .equals([flockId, form.date])
      .first()
      .then((l) => {
        if (cancelled) return
        setForm(l ? fromLog(l) : empty(form.date))
        if (l && (l.sampleWeightG || l.tempC || l.notes || l.photo || l.waterL)) setMore(true)
        setLoadedDate(form.date)
      })
    return () => {
      cancelled = true
    }
  }, [flockId, form.date, loadedDate])

  const photoUrl = useMemo(() => (form.photo ? URL.createObjectURL(form.photo) : null), [form.photo])
  useEffect(() => () => (photoUrl ? URL.revokeObjectURL(photoUrl) : undefined), [photoUrl])

  if (!view) return null
  const { flock, species } = view
  const sp = species.data
  const age = ageOn(flock.placementDate, form.date)
  const aliveBefore = view.logs
    .filter((l) => l.date < form.date)
    .reduce((n, l) => n - l.deaths - l.culls, flock.initialCount)
  const expectedFeed = age >= 0 ? (dailyFeedG(sp, age) * aliveBefore) / 1000 : 0
  const targetWeight = age >= 0 ? valueAt(sp.growth.bodyWeight, age).value : 0
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function submit() {
    setError(null)
    if (age < 0) return setError(t('log.ageOutOfRange'))
    const nums = [form.feedKg, form.waterL, form.sampleWeightG, form.sampleSize, form.rhPct]
    if (nums.some((n) => n !== undefined && n < 0) || form.deaths < 0 || form.culls < 0) return setError(t('log.invalid'))
    if (form.deaths + form.culls > aliveBefore) return setError(t('log.tooManyDeaths'))
    await saveLog({
      flockId,
      date: form.date,
      age,
      deaths: form.deaths,
      culls: form.culls,
      feedKg: form.feedKg ?? 0,
      ...(form.waterL !== undefined ? { waterL: form.waterL } : {}),
      ...(form.sampleWeightG !== undefined ? { sampleWeightG: form.sampleWeightG } : {}),
      ...(form.sampleSize !== undefined ? { sampleSize: form.sampleSize } : {}),
      ...(form.tempC !== undefined ? { tempC: form.tempC } : {}),
      ...(form.rhPct !== undefined ? { rhPct: form.rhPct } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      ...(form.photo ? { photo: form.photo } : {}),
      updatedAt: Date.now(),
    })
    toast(t('log.saved'))
    nav(-1)
  }

  return (
    <Page>
      <PageHeader title={t('log.title')} subtitle={`${flock.name} · ${age >= 0 ? t('common.ageDays', { n: num(age) }) : ''}`} back />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <Field label={t('log.date')} htmlFor="log-date" hint={dateLong(form.date)}>
          <input
            id="log-date"
            type="date"
            className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-lg"
            value={form.date}
            min={flock.placementDate}
            max={todayISO()}
            onChange={(e) => e.target.value && set('date', e.target.value)}
          />
        </Field>
        <Field label={t('log.deaths')}>
          <Stepper label={t('log.deaths')} value={form.deaths} onChange={(v) => set('deaths', v)} />
        </Field>
        <Field label={t('log.feed')} htmlFor="log-feed" hint={age >= 0 ? t('log.feedHint', { kg: num(expectedFeed, 1) }) : undefined}>
          <NumberInput id="log-feed" decimal value={form.feedKg} onChange={(v) => set('feedKg', v)} placeholder={num(expectedFeed, 1)} />
        </Field>

        <button type="button" className="mb-4 flex items-center gap-1 font-bold text-primary" onClick={() => setMore((m) => !m)} aria-expanded={more}>
          <Icon name={more ? 'close' : 'plus'} size={18} /> {t('log.more')}
        </button>

        {more && (
          <>
            <Field label={t('log.culls')}>
              <Stepper label={t('log.culls')} value={form.culls} onChange={(v) => set('culls', v)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('log.weight')} htmlFor="log-weight">
                <NumberInput id="log-weight" value={form.sampleWeightG} onChange={(v) => set('sampleWeightG', v)} />
              </Field>
              <Field label={t('log.sampleSize')} htmlFor="log-sample">
                <NumberInput id="log-sample" value={form.sampleSize} onChange={(v) => set('sampleSize', v)} placeholder={num(RULES.weighSampleMin)} />
              </Field>
            </div>
            <p className="-mt-2 mb-4 text-sm text-muted">{t('log.weightHint', { g: num(targetWeight), n: num(RULES.weighSampleMin) })}</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label={t('log.water')} htmlFor="log-water">
                <NumberInput id="log-water" decimal value={form.waterL} onChange={(v) => set('waterL', v)} />
              </Field>
              <Field label={t('log.temp')} htmlFor="log-temp">
                <NumberInput id="log-temp" decimal value={form.tempC} onChange={(v) => set('tempC', v)} />
              </Field>
              <Field label={t('log.rh')} htmlFor="log-rh">
                <NumberInput id="log-rh" value={form.rhPct} onChange={(v) => set('rhPct', v)} />
              </Field>
            </div>
            <Field label={t('log.notes')} htmlFor="log-notes">
              <textarea
                id="log-notes"
                rows={3}
                className="w-full rounded-xl border border-line bg-surface p-3"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </Field>
            <Field label={t('log.photo')}>
              {photoUrl ? (
                <div className="space-y-2">
                  <img src={photoUrl} alt={t('log.photo')} className="max-h-60 w-full rounded-xl object-cover" />
                  <Button variant="secondary" icon="trash" onClick={() => set('photo', undefined)}>
                    {t('log.removePhoto')}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  icon="camera"
                  onClick={async () => {
                    const f = await files.pick('image/*')
                    if (f) set('photo', await compressImage(f))
                  }}
                >
                  {t('log.addPhoto')}
                </Button>
              )}
            </Field>
          </>
        )}

        {error && (
          <p role="alert" className="mb-3 rounded-xl bg-danger-soft p-3 font-semibold text-danger">
            {error}
          </p>
        )}
        <Button type="submit" full icon="check">
          {t('common.save')}
        </Button>
      </form>
    </Page>
  )
}
