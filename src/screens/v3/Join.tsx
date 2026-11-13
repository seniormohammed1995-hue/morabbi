import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cloudEnabled, saveProfile, useProfile } from '../../cloud/client'
import { ProfileForm } from '../../cloud/payload'
import { KINDS, profilesOf } from '../../data/birds'
import { GOVERNORATES } from '../../data/rules'
import type { BirdKind } from '../../data/schema'
import { setKinds, useKinds } from '../../db/birds'
import { useLocation as useWeatherLocation } from '../../store/weather'
import { device } from '../../platform'
import { t } from '../../i18n'
import { BirdArt } from '../../ui/BirdArt'
import { Icon } from '../../ui/Icon'
import { Button, Card, cx, Field, Page, PageHeader, toast } from '../../ui/kit'

type Errors = Partial<Record<'name' | 'phone' | 'governorate' | 'kinds', string>>

const inputCls =
  'min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

/** "عرّفنا بيك": name, optional phone, governorate, kinds. Saved locally and sent to the sheet. */
export default function Join() {
  const nav = useNavigate()
  const profile = useProfile()
  const kindsNow = useKinds()
  const loc = useWeatherLocation()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gov, setGov] = useState('')
  const [kinds, setKindsLocal] = useState<BirdKind[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  // Prefill once from the saved profile, the weather location and the kinds already picked.
  useEffect(() => {
    if (profile === undefined || kindsNow === undefined) return
    setName((v) => v || profile?.name || '')
    setPhone((v) => v || profile?.phone || '')
    setGov((v) => v || profile?.governorate || loc?.governorate || '')
    setKindsLocal((v) => (v.length ? v : profile?.kinds.length ? profile.kinds : kindsNow))
  }, [profile, kindsNow, loc?.governorate])

  const save = async () => {
    const r = ProfileForm.safeParse({ name, phone, governorate: gov, kinds })
    if (!r.success) {
      const e: Errors = {}
      for (const issue of r.error.issues) {
        const k = issue.path[0] as keyof Errors
        e[k] ??= t(`join.err.${k}`)
      }
      setErrors(e)
      return
    }
    setErrors({})
    setBusy(true)
    try {
      const picked = r.data.kinds as BirdKind[]
      await saveProfile({ ...r.data, kinds: picked })
      // Keep the app's kinds in step with what the user just told us.
      if (kindsNow && picked.some((k) => !kindsNow.includes(k))) {
        await setKinds([...new Set([...kindsNow, ...picked])])
      }
      device.chime('ok')
      toast(t('join.saved', { name: r.data.name }))
      nav(-1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page>
      <PageHeader title={t('join.title')} back />
      <p className="mb-4 text-muted">{t('join.sub')}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <Field label={t('join.name')} htmlFor="join-name" {...(errors.name ? { error: errors.name } : {})}>
          <input
            id="join-name"
            autoComplete="name"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('join.namePh')}
            className={inputCls}
          />
        </Field>
        <Field
          label={t('join.phone')}
          htmlFor="join-phone"
          hint={t('join.phoneHint')}
          {...(errors.phone ? { error: errors.phone } : {})}
        >
          <input
            id="join-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            className={cx(inputCls, 'text-end')}
          />
        </Field>
        <Field label={t('join.gov')} htmlFor="join-gov" {...(errors.governorate ? { error: errors.governorate } : {})}>
          <select id="join-gov" value={gov} onChange={(e) => setGov(e.target.value)} className={inputCls}>
            <option value="">{t('join.govPick')}</option>
            {GOVERNORATES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
        <fieldset className="mb-4">
          <legend className="mb-1 font-semibold">{t('join.kinds')}</legend>
          <div className="grid grid-cols-3 gap-2">
            {KINDS.filter((k) => profilesOf(k).length > 0).map((k) => {
              const on = kinds.includes(k)
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setKindsLocal((cur) => (on ? cur.filter((x) => x !== k) : [...cur, k]))}
                  className={cx(
                    'flex flex-col items-center rounded-2xl border-2 p-2 font-bold',
                    on ? 'border-primary bg-primary-soft' : 'border-line bg-surface',
                  )}
                >
                  <BirdArt kind={k} size={40} />
                  {t(`kind.${k}`)}
                </button>
              )
            })}
          </div>
          {errors.kinds && (
            <p role="alert" className="mt-1 text-sm font-semibold text-danger">
              {errors.kinds}
            </p>
          )}
        </fieldset>
        <Card tone="plain" className="mb-4 flex gap-2 text-sm text-muted">
          <Icon name="info" size={18} className="mt-0.5 shrink-0" />
          <span>{cloudEnabled() ? t('join.privacy.cloud') : t('join.privacy.local')}</span>
        </Card>
        <Button type="submit" icon="check" full disabled={busy}>
          {t('join.save')}
        </Button>
      </form>
    </Page>
  )
}
