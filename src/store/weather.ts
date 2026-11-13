import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { RULES } from '../data/rules'
import { weatherSource, network, type Forecast } from '../platform/weather'

/** Where weather is read for. */
export interface WeatherLocation {
  lat: number
  lon: number
  label: string
  mode: 'gps' | 'governorate' | 'search'
  governorate?: string
}

/** A thermometer reading typed by the user; it replaces the estimate for a few hours. */
export interface ManualReading {
  tempC: number
  rh?: number
  at: number
}

export type AlertType = 'heat' | 'cold' | 'humid' | 'wind' | 'rain'
export type AlertPrefs = Record<AlertType, boolean>
export const ALERT_TYPES: AlertType[] = ['heat', 'cold', 'humid', 'wind', 'rain']
const DEFAULT_PREFS: AlertPrefs = { heat: true, cold: true, humid: true, wind: true, rain: true }

const K = {
  location: 'weather-location',
  forecast: 'weather-last',
  manual: 'weather-manual',
  prefs: 'alert-prefs',
  shown: 'alerts-shown',
} as const

async function kvGet<T>(key: string): Promise<T | undefined> {
  return (await db.kv.get(key))?.value as T | undefined
}

export const useLocation = () =>
  useLiveQuery(async () => (await kvGet<WeatherLocation>(K.location)) ?? null, [])
export const useForecast = () =>
  useLiveQuery(async () => (await kvGet<Forecast>(K.forecast)) ?? null, [])
export const useAlertPrefs = () =>
  useLiveQuery(
    async () => ({ ...DEFAULT_PREFS, ...(await kvGet<Partial<AlertPrefs>>(K.prefs)) }),
    [],
  )

/** The manual reading, or null once it is older than the override window. */
export function useManualReading(now = Date.now()): ManualReading | null | undefined {
  return useLiveQuery(async () => {
    const m = await kvGet<ManualReading>(K.manual)
    return m && now - m.at < RULES.manualReadingHours * 3_600_000 ? m : null
  }, [Math.floor(now / 600_000)])
}

export async function setLocation(loc: WeatherLocation): Promise<void> {
  await db.kv.put({ key: K.location, value: loc })
  await refreshWeather(true)
}

export async function getLocation(): Promise<WeatherLocation | undefined> {
  return kvGet<WeatherLocation>(K.location)
}

export async function setManualReading(tempC: number, rh?: number): Promise<void> {
  await db.kv.put({
    key: K.manual,
    value: { tempC, ...(rh === undefined ? {} : { rh }), at: Date.now() } satisfies ManualReading,
  })
}

export async function clearManualReading(): Promise<void> {
  await db.kv.delete(K.manual)
}

export async function setAlertPref(type: AlertType, on: boolean): Promise<void> {
  const cur = { ...DEFAULT_PREFS, ...(await kvGet<Partial<AlertPrefs>>(K.prefs)) }
  await db.kv.put({ key: K.prefs, value: { ...cur, [type]: on } })
}

export async function getAlertPrefs(): Promise<AlertPrefs> {
  return { ...DEFAULT_PREFS, ...(await kvGet<Partial<AlertPrefs>>(K.prefs)) }
}

/** Alert ids already shown today (for the per-day cap). */
export async function shownToday(date: string): Promise<string[]> {
  const s = await kvGet<{ date: string; ids: string[] }>(K.shown)
  return s?.date === date ? s.ids : []
}

export async function markShown(date: string, ids: string[]): Promise<void> {
  const prev = await shownToday(date)
  await db.kv.put({ key: K.shown, value: { date, ids: [...new Set([...prev, ...ids])] } })
}

let inflight: Promise<Forecast | null> | null = null

/**
 * Fetches a new forecast when the last one is older than the refresh interval (or `force`).
 * Never throws: offline or failing requests keep the last stored reading.
 */
export function refreshWeather(force = false): Promise<Forecast | null> {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const loc = await getLocation()
      if (!loc || !network.online()) return null
      const last = await kvGet<Forecast>(K.forecast)
      const sameSpot =
        last && Math.abs(last.lat - loc.lat) < 0.01 && Math.abs(last.lon - loc.lon) < 0.01
      const fresh = last && Date.now() - last.fetchedAt < RULES.weatherRefreshHours * 3_600_000
      if (!force && sameSpot && fresh) return last
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 15_000)
      try {
        const f = await weatherSource.forecast(loc.lat, loc.lon, ctrl.signal)
        await db.kv.put({ key: K.forecast, value: f })
        return f
      } finally {
        clearTimeout(timer)
      }
    } catch {
      return null
    } finally {
      inflight = null
    }
  })()
  return inflight
}
