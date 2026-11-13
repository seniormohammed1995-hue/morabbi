import type { Forecast, Geocoder, Place, WeatherPoint, WeatherSource } from './types'

const FORECAST = 'https://api.open-meteo.com/v1/forecast'
const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search'

const HOURLY = [
  'temperature_2m',
  'relative_humidity_2m',
  'wind_speed_10m',
  'wind_gusts_10m',
  'precipitation',
  'precipitation_probability',
  'weather_code',
  'is_day',
  'shortwave_radiation',
] as const

interface OmBlock {
  time: string[] | string
  temperature_2m: number[] | number
  relative_humidity_2m: number[] | number
  wind_speed_10m: number[] | number
  wind_gusts_10m: number[] | number
  precipitation: number[] | number
  precipitation_probability?: Array<number | null>
  weather_code: number[] | number
  is_day: number[] | number
  shortwave_radiation?: number[] | number
}

/** Parses an Open-Meteo forecast response. Exported for tests. */
export function parseOpenMeteo(
  json: unknown,
  lat: number,
  lon: number,
  now = Date.now(),
): Forecast {
  const j = json as { current?: OmBlock; hourly?: OmBlock }
  if (!j.current || !j.hourly || !Array.isArray(j.hourly.time))
    throw new Error('bad weather response')
  const c = j.current
  const current: WeatherPoint = {
    time: String(c.time),
    tempC: Number(c.temperature_2m),
    rh: Number(c.relative_humidity_2m),
    windKmh: Number(c.wind_speed_10m),
    gustKmh: Number(c.wind_gusts_10m),
    precipMm: Number(c.precipitation),
    code: Number(c.weather_code),
    isDay: Number(c.is_day) === 1,
    radWm2: Number(c.shortwave_radiation ?? 0) || 0,
  }
  const h = j.hourly
  const arr = (v: number[] | number, i: number) => (Array.isArray(v) ? Number(v[i]) : NaN)
  const hourly: WeatherPoint[] = (h.time as string[]).map((time, i) => {
    const prob = h.precipitation_probability?.[i]
    return {
      time,
      tempC: arr(h.temperature_2m, i),
      rh: arr(h.relative_humidity_2m, i),
      windKmh: arr(h.wind_speed_10m, i),
      gustKmh: arr(h.wind_gusts_10m, i),
      precipMm: arr(h.precipitation, i),
      ...(prob === null || prob === undefined ? {} : { precipProb: Number(prob) }),
      code: arr(h.weather_code, i),
      isDay: arr(h.is_day, i) === 1,
      radWm2: h.shortwave_radiation === undefined ? 0 : arr(h.shortwave_radiation, i) || 0,
    }
  })
  if (![current.tempC, current.rh].every(Number.isFinite)) throw new Error('bad weather response')
  return {
    source: 'open-meteo',
    fetchedAt: now,
    lat,
    lon,
    current,
    hourly: hourly.filter((p) => Number.isFinite(p.tempC)),
  }
}

export const openMeteo: WeatherSource & Geocoder = {
  id: 'open-meteo',
  attribution: 'بيانات الجو: Open-Meteo.com (CC BY 4.0)',
  attributionUrl: 'https://open-meteo.com/',
  async forecast(lat, lon, signal) {
    const q = new URLSearchParams({
      latitude: lat.toFixed(3),
      longitude: lon.toFixed(3),
      current: HOURLY.filter((x) => x !== 'precipitation_probability').join(','),
      hourly: HOURLY.join(','),
      timezone: 'auto',
      forecast_days: '3',
      wind_speed_unit: 'kmh',
    })
    const res = await fetch(`${FORECAST}?${q}`, signal ? { signal } : {})
    if (!res.ok) throw new Error(`weather http ${res.status}`)
    return parseOpenMeteo(await res.json(), lat, lon)
  },
  async search(query, signal) {
    const first = await geocodeOnce(query, signal)
    // Arabic names in GeoNames often lack the article: "المنصورة" finds nothing, "منصورة" does.
    if (first.length === 0 && query.trim().startsWith('ال'))
      return geocodeOnce(query.trim().slice(2), signal)
    return first
  },
}

async function geocodeOnce(query: string, signal?: AbortSignal): Promise<Place[]> {
  {
    const q = new URLSearchParams({
      name: query,
      count: '10',
      language: 'ar',
      format: 'json',
      countryCode: 'EG',
    })
    const res = await fetch(`${GEOCODE}?${q}`, signal ? { signal } : {})
    if (!res.ok) throw new Error(`geocode http ${res.status}`)
    const j = (await res.json()) as {
      results?: Array<{ name: string; admin1?: string; latitude: number; longitude: number }>
    }
    return (j.results ?? []).map((r): Place => ({
      name: r.name,
      ...(r.admin1 ? { admin1: r.admin1 } : {}),
      lat: r.latitude,
      lon: r.longitude,
    }))
  }
}
