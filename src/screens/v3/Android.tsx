import { APK_URL, CONFIG, RELEASES_URL } from '../../config'
import { isNative, share } from '../../platform'
import { t } from '../../i18n'
import { num } from '../../i18n/format'
import { Icon } from '../../ui/Icon'
import { Button, Card, Page, PageHeader } from '../../ui/kit'

/** "حمّل نسخة الأندرويد" with simple install steps. */
export default function Android() {
  const steps = [
    t('apk.step1', { file: CONFIG.apkName }),
    t('apk.step2'),
    t('apk.step3'),
    t('apk.step4'),
  ]
  return (
    <Page>
      <PageHeader title={t('apk.title')} back />
      <Card tone="accent" className="text-center">
        <Icon name="android" size={56} className="mx-auto text-leaf" />
        <h2 className="mt-2 text-xl font-extrabold">{t('apk.cta')}</h2>
        <p className="mt-1 text-muted">{t('apk.why')}</p>
        {!isNative() && (
          <Button icon="download" full className="mt-4" onClick={() => share.openExternal(APK_URL)}>
            {t('apk.download')} {CONFIG.apkName}
          </Button>
        )}
      </Card>

      <h2 className="mb-2 mt-5 text-lg font-bold">{t('apk.steps')}</h2>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-2xl border border-line bg-surface p-3">
            <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary font-extrabold text-primary-ink">
              {num(i + 1)}
            </span>
            <span className="leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
      <Card tone="warn" className="mt-3 text-sm leading-relaxed">
        {t('apk.data')}
      </Card>
      <p className="mt-3 text-sm text-muted">{t('apk.safe')}</p>
      <Button variant="ghost" icon="github" className="mt-1 px-0" onClick={() => share.openExternal(RELEASES_URL)}>
        {t('apk.all')}
      </Button>
    </Page>
  )
}
