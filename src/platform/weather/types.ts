/** One hour (or the current moment) of weather at the user's location. */
export interface WeatherPoint {
  /** Local time, ISO without zone: YYYY-MM-DDTHH:mm. */
  time: string
  tempC: number
  rh: number
  windKmh: number
  gustKmh: number
  precipMm: number
  /** 0–100, absent for the current reading. */
  precipProb?: number
  /** WMO weather code. */
  code: number
  isDay: boolean
  /** Shortwave solar radiation, W/m². */
  radWm2: number
}

export interface Forecast {
  source: string
  /** Epoch ms when it was fetched. */
  fetchedAt: number
  lat: number
  lon: number
  current: WeatherPoint
  /** Hourly from the start of today, 3 days. */
  hourly: WeatherPoint[]
}

/** Any provider the app can read weather from. Screens never call a provider directly. */
export interface WeatherSource {
  id: string
  /** Credit line shown under weather data, as the provider's licence requires. */
  attribution: string
  attributionUrl: string
  forecast(lat: number, lon: number, signal?: AbortSignal): Promise<Forecast>
}

export interface Place {
  name: string
  admin1?: string
  lat: number
  lon: number
}

export interface Geocoder {
  search(query: string, signal?: AbortSignal): Promise<Place[]>
}
