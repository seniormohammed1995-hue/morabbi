import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportBackup, importBackup, resetAll } from '../db/repo'
import { files, notifications, share, type PermissionState } from '../platform'
import { useUi, type Theme } from '../store/ui'
import { t } from '../i18n'
import { Button, Card, Choice, ConfirmDialog, Page, PageHeader, SectionTitle, toast } from '../ui/kit'
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
  const version = __APP_VERSION__

  return (
    <Page>
      <PageHeader title={t('settings.title')} back />

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
          onClick={() => share.openExternal(`https://wa.me/?text=${encodeURIComponent(t('settings.feedbackMsg', { v: version }))}`)}
        >
          {t('settings.feedbackBtn')}
        </Button>
      </Card>

      <SectionTitle>{t('settings.about')}</SectionTitle>
      <Card>
        <p className="font-bold">
          {t('app.name')} — {t('settings.version', { v: version })} ({t('app.beta')})
        </p>
        <p className="mt-1 text-sm text-muted">{t('disclaimer.body')}</p>
        <Button variant="ghost" className="mt-2 px-0" onClick={() => nav('/library/sources')}>
          {t('library.sources')}
        </Button>
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
