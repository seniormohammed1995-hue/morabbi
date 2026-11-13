import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportBackup, importBackup, resetAll } from '../db/repo'
import { files, notifications, type PermissionState } from '../platform'
import { APP_VERSION } from '../config'
import { openFeedback } from '../feedback'
import { KINDS, profilesOf } from '../data/birds'
import { toggleKind, useKinds } from '../db/birds'
import { ALERT_TYPES, setAlertPref, useAlertPrefs } from '../store/weather'
import { BirdArt } from '../ui/BirdArt'
import { LocationPicker } from './weather/LocationPicker'
import { BetaStrip } from './Onboarding'
import { useUi, type Theme } from '../store/ui'
import { t } from '../i18n'
import { Button, Card, Choice, ConfirmDialog, cx, Page, PageHeader, SectionTitle, toast } from '../ui/kit'
import { runDailyReminder } from './reminders'
import { todayISO } from '../calc/dates'

const SCALES = [
  { value: '0.9', label: 'أ' },
  { value: '1', label: 'أ+' },
  { value: '1.15', label: 'أ++' },
  { value: '1.3', label: 'أ+++' },
]

export default function Settings() {
  const theme = useUi((s) => s.theme)
  const setTheme = useUi((s) => s.setTheme)
  const scale = useUi((s) => s.fontScale)
  const setScale = useUi((s) => s.setFontScale)
  const select = useUi((s) => s.selectFlock)
  const nav = useNavigate()
  const [perm, setPerm] = useState<PermissionState>(notifications.state())
  const [confirm, setConfirm] = useState<null | 'import' | 'reset'>(null)
  const [pendingImport, setPendingImport] = useState<string | null>(null)
  const version = APP_VERSION
  const kinds = useKinds()
  const alertPrefs = useAlertPrefs()

  return (
    <Page>
      <PageHeader title={t('settings.title')} back />

      <section id="birds">
        <SectionTitle icon="flock">{t('set.birds')}</SectionTitle>
        <p className="mb-2 text-sm text-muted">{t('set.birdsHint')}</p>
        <div className="grid grid-cols-3 gap-2">
          {KINDS.filter((k) => profilesOf(k).length > 0).map((k) => {
            const on = kinds?.includes(k) ?? false
            return (
              <button
                key={k}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => void toggleKind(k, !on)}
                className={cx('flex flex-col items-center rounded-2xl border-2 p-2 font-bold', on ? 'border-primary bg-primary-soft' : 'border-line bg-surface opacity-70')}
              >
                <BirdArt kind={k} size={44} />
                {t(`kind.${k}`)}
              </button>
            )
          })}
        </div>
        <Button variant="secondary" icon="plus" full className="mt-2" onClick={() => nav('/birds')}>
          {t('set.addGroup')}
        </Button>
      </section>

      <SectionTitle icon="pin">{t('set.location')}</SectionTitle>
      <Card>
        <LocationPicker />
      </Card>

      <SectionTitle icon="alert">{t('set.alerts')}</SectionTitle>
      <Card>
        <p className="mb-2 text-sm text-muted">{t('set.alertsHint')}</p>
        {ALERT_TYPES.map((a) => (
          <label key={a} className="flex min-h-12 items-center justify-between gap-3 border-b border-line last:border-0">
            <span className="font-semibold">{t(`set.alert.${a}`)}</span>
            <input type="checkbox" className="h-6 w-6 accent-[var(--c-primary)]" checked={alertPrefs?.[a] ?? true} onChange={(e) => void setAlertPref(a, e.target.checked)} />
          </label>
        ))}
      </Card>

      <SectionTitle>{t('settings.theme')}</SectionTitle>
      <Choice<Theme>
        value={theme}
        onChange={setTheme}
        cols={3}
        options={(['light', 'dark', 'system'] as Theme[]).map((x) => ({ value: x, label: t(`settings.theme.${x}`) }))}
      />

      <SectionTitle>{t('settings.fontSize')}</SectionTitle>
      <Choice value={String(scale)} onChange={(v) => setScale(Number(v))} options={SCALES} />

      <SectionTitle>{t('settings.notifications')}</SectionTitle>
      <Card>
        <p className="mb-3 text-sm text-muted">{t('settings.notifications.hint')}</p>
        {perm === 'granted' ? (
          <p className="font-bold text-leaf">✓ {t('settings.notifications.on')}</p>
        ) : perm === 'denied' ? (
          <p className="text-warn">{t('settings.notifications.denied')}</p>
        ) : perm === 'unsupported' ? (
          <p className="text-muted">{t('settings.notifications.unsupported')}</p>
        ) : (
          <Button
            icon="alert"
            onClick={async () => {
              const s = await notifications.request()
              setPerm(s)
              if (s === 'granted') await runDailyReminder()
            }}
          >
            {t('settings.notifications.enable')}
          </Button>
        )}
      </Card>

      <SectionTitle>{t('settings.backup')}</SectionTitle>
      <Card>
        <p className="mb-3 text-sm text-muted">{t('settings.storage')}</p>
        <div className="grid gap-2">
          <Button variant="secondary" icon="download" onClick={async () => files.save(await exportBackup(), `tuyuri-backup-${todayISO()}.json`)}>
            {t('settings.export')}
          </Button>
          <Button
            variant="secondary"
            icon="upload"
            onClick={async () => {
              const f = await files.pick('application/json,.json')
              if (!f) return
              setPendingImport(await f.text())
              setConfirm('import')
            }}
          >
            {t('settings.import')}
          </Button>
        </div>
      </Card>

      <SectionTitle>{t('settings.feedback')}</SectionTitle>
      <Card tone="leaf">
        <p className="mb-3">{t('settings.feedbackBody')}</p>
        <Button
          icon="whatsapp"
          onClick={() => void openFeedback(t('settings.title'))}
        >
          {t('settings.feedbackBtn')}
        </Button>
      </Card>

      <SectionTitle>{t('settings.about')}</SectionTitle>
      <Card>
        <p className="font-bold">
          {t('app.name')} — {t('settings.version', { v: version })} ({t('app.beta')})
        </p>
        <BetaStrip className="mt-2" />
        <div className="mt-2 flex flex-wrap gap-x-4">
          <Button variant="ghost" className="px-0" onClick={() => nav('/about')}>
            {t('set.aboutPage')}
          </Button>
          <Button variant="ghost" className="px-0" onClick={() => nav('/library/sources')}>
            {t('library.sources')}
          </Button>
        </div>
      </Card>

      <Button variant="danger" icon="trash" full className="mt-6" onClick={() => setConfirm('reset')}>
        {t('settings.reset')}
      </Button>

      <ConfirmDialog
        open={confirm !== null}
        danger
        title={confirm === 'import' ? t('settings.import') : t('settings.reset')}
        body={confirm === 'import' ? t('settings.importConfirm') : t('settings.resetConfirm')}
        onCancel={() => {
          setConfirm(null)
          setPendingImport(null)
        }}
        onConfirm={async () => {
          if (confirm === 'import' && pendingImport) {
            try {
              const n = await importBackup(pendingImport)
              select(null)
              toast(t('settings.importDone', { n }))
            } catch {
              toast(t('settings.importBad'))
            }
          } else if (confirm === 'reset') {
            await resetAll()
            select(null)
            toast(t('common.done'))
          }
          setConfirm(null)
          setPendingImport(null)
        }}
      />
    </Page>
  )
}
