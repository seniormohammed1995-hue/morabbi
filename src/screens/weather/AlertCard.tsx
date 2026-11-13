import type { WeatherAlert } from '../../calc/weather'
import { ALERT_ADVICE } from '../../data/weather'
import { t, lt } from '../../i18n'
import { num } from '../../i18n/format'
import { Icon, type IconName } from '../../ui/Icon'
import { Card, SourceNote } from '../../ui/kit'
import type { Group } from './useWeather'
import { hourLabel } from './time'

const ICON: Record<WeatherAlert['type'], IconName> = {
  heat: 'fire',
  cold: 'thermo',
  humid: 'humidity',
  wind: 'wind',
  rain: 'rain',
}

/** A weather alert: when, who, numbered steps and one "why" line. */
export function AlertCard({ alert, groups }: { alert: WeatherAlert; groups: Group[] }) {
  const adv = ALERT_ADVICE[alert.type]
  const who = groups.filter((g) => alert.groupIds.includes(g.id)).map((g) => g.flock.name)
  return (
    <Card tone={alert.severity >= 3 ? 'danger' : 'warn'}>
      <h3 className="flex items-center gap-2 text-lg font-extrabold">
        <Icon name={ICON[alert.type]} />
        {lt(adv.title)}
      </h3>
      <p className="mt-1 text-sm font-semibold">
        {t('wx.alert.when', { when: hourLabel(alert.at) })}
        {alert.type === 'heat' || alert.type === 'cold'
          ? ` · ${t('wx.alert.temp', { n: num(alert.value, 0) })}`
          : ''}
        {alert.type === 'wind' ? ` · ${t('wx.alert.gust', { n: num(alert.value, 0) })}` : ''}
      </p>
      {who.length > 0 && (
        <p className="text-sm text-muted">{t('wx.alert.who', { who: who.join('، ') })}</p>
      )}
      {alert.need && (
        <p className="mt-2 rounded-lg bg-surface/70 p-2 font-bold">
          {t('wx.alert.need', { min: num(alert.need.min), max: num(alert.need.max) })}
        </p>
      )}
      <ol className="mt-2 list-decimal space-y-1 ps-5 [list-style-type:arabic-indic]">
        {adv.steps.map((s) => (
          <li key={s.ar}>{lt(s)}</li>
        ))}
      </ol>
      <p className="mt-2 text-sm">
        <span className="font-bold">{t('common.why')} </span>
        {lt(adv.why)}
      </p>
      <SourceNote item={{ source: adv.source, sourceUrl: adv.sourceUrl, confidence: 'medium' }} />
    </Card>
  )
}
