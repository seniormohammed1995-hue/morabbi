import { Link } from 'react-router-dom'
import type { Comfort } from '../../calc/weather'
import { useLocation } from '../../store/weather'
import { weatherSource } from '../../platform/weather'
import { share } from '../../platform'
import { t } from '../../i18n'
import { num } from '../../i18n/format'
import { BirdArt } from '../../ui/BirdArt'
import { Icon } from '../../ui/Icon'
import { cx } from '../../ui/kit'
import type { WeatherView } from './useWeather'

export const COMFORT_CLS: Record<Comfort, string> = {
  green: 'bg-leaf text-white',
  yellow: 'bg-accent text-ink',
  red: 'bg-danger text-white',
}

/** "منذ ..." label for a timestamp. */
export function since(at: number, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - at) / 60000))
  if (min < 2) return t('wx.justNow')
  if (min < 60) return t('wx.minAgo', { n: num(min) })
  const h = Math.round(min / 60)
  if (h < 48) return t('wx.hAgo', { n: num(h) })
  return t('wx.dAgo', { n: num(Math.round(h / 24)) })
}

/** Top-of-home weather strip: temperature, humidity and one comfort light per kind. */
export function WeatherBar({ view }: { view: WeatherView | undefined }) {
  const loc = useLocation()
  if (!view || loc === undefined) return <div className="h-24" aria-hidden="true" />
  if (!loc)
    return (
      <Link
        to="/weather"
        className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm"
      >
        <Icon name="pin" className="text-primary" />
        <span className="flex-1 font-semibold">{t('wx.setLocation')}</span>
        <Icon name="chevron" size={18} />
      </Link>
    )
  const f = view.forecast
  if (!f && !view.manual)
    return (
      <Link
        to="/weather"
        className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm"
      >
        <Icon name="cloud" className="text-muted" />
        <span className="flex-1 text-sm text-muted">{t('wx.noData')}</span>
      </Link>
    )
  // One light per kind: the worst group of that kind.
  const order: Comfort[] = ['green', 'yellow', 'red']
  const perKind = new Map<
    string,
    { level: Comfort; kind: (typeof view.groups)[number]['profile']['kind'] }
  >()
  for (const g of view.groups) {
    const c = view.comfort.get(g.id)
    if (!c) continue
    const prev = perKind.get(g.profile.kind)
    if (!prev || order.indexOf(c.level) > order.indexOf(prev.level))
      perKind.set(g.profile.kind, { level: c.level, kind: g.profile.kind })
  }
  const first = view.groups[0]
  const r = first ? view.readings.get(first.id) : undefined
  const air = f?.current
  const stale = f && Date.now() - f.fetchedAt > 3 * 3_600_000
  return (
    <div className="rounded-2xl border border-line bg-surface p-3 shadow-sm">
      <Link to="/weather" aria-label={t('wx.details')} className="flex items-center gap-3">
        <Icon
          name={air && !air.isDay ? 'cloud' : 'sun'}
          size={30}
          className="shrink-0 text-accent"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <span className="num text-3xl font-extrabold">
              {num(view.manual && r ? r.tempC : air?.tempC, 0)}°
            </span>
            <span className="num flex items-center gap-1 text-sm font-semibold text-muted">
              <Icon name="humidity" size={16} />
              {num(view.manual && r ? r.rh : air?.rh, 0)}٪
            </span>
          </div>
          <div className={cx('truncate text-xs', stale ? 'font-semibold text-warn' : 'text-muted')}>
            {loc.label} · {view.manual ? t('wx.manual') : f ? since(f.fetchedAt) : ''}
          </div>
        </div>
        <div className="flex shrink-0 -space-x-2 space-x-reverse">
          {[...perKind.values()].map((p) => (
            <span key={p.kind} className="relative" title={t(`kind.${p.kind}`)}>
              <BirdArt kind={p.kind} size={36} />
              <span
                className={cx(
                  'absolute -bottom-0.5 -end-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface',
                  COMFORT_CLS[p.level].split(' ')[0],
                )}
                aria-label={`${t(`kind.${p.kind}`)}: ${t(`wx.comfort.${p.level}`)}`}
                role="img"
              />
            </span>
          ))}
        </div>
      </Link>
      {f && <Attribution />}
    </div>
  )
}

/** Licence credit: a link next to every place weather data is shown (CC BY 4.0). */
export function Attribution() {
  return (
    <button
      type="button"
      className="mt-1 text-[11px] text-muted underline"
      onClick={() => share.openExternal(weatherSource.attributionUrl)}
    >
      {weatherSource.attribution}
    </button>
  )
}
