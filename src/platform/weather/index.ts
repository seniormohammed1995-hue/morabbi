/**
 * Weather goes through here only. Swapping providers = adding a WeatherSource and
 * changing `weatherSource` below (see QUESTIONS.md for the licence question).
 */
import { openMeteo } from './openMeteo'
import type { Geocoder, WeatherSource } from './types'

export type { Forecast, Place, WeatherPoint, WeatherSource, Geocoder } from './types'

export const weatherSource: WeatherSource = openMeteo
export const geocoder: Geocoder = openMeteo

export const geolocation = {
  supported(): boolean {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator
  },
  /** Asks for the device position once. Resolves null if refused, unavailable or slow. */
  current(timeoutMs = 15000): Promise<{ lat: number; lon: number } | null> {
    if (!geolocation.supported()) return Promise.resolve(null)
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 3_600_000 },
      )
    })
  },
}

export const network = {
  online(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine
  },
}
