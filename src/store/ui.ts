import { create } from 'zustand'
import { prefs } from '../platform'

export type Theme = 'light' | 'dark' | 'system'

interface UiState {
  theme: Theme
  fontScale: number
  selectedFlockId: number | null
  disclaimerAccepted: boolean
  setTheme: (t: Theme) => void
  setFontScale: (s: number) => void
  selectFlock: (id: number | null) => void
  acceptDisclaimer: () => void
}

const KEY_THEME = 'morabbi-theme'
const KEY_FONT = 'morabbi-font-scale'
const KEY_FLOCK = 'morabbi-flock'
const KEY_DISCLAIMER = 'morabbi-disclaimer-v1'

export function applyTheme(theme: Theme): void {
  const dark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function applyFontScale(scale: number): void {
  document.documentElement.style.setProperty('--font-scale', String(scale))
}

const initialFlock = Number(prefs.get(KEY_FLOCK))

export const useUi = create<UiState>((set) => ({
  theme: (prefs.get(KEY_THEME) as Theme | null) ?? 'system',
  fontScale: Number(prefs.get(KEY_FONT)) || 1,
  selectedFlockId: Number.isFinite(initialFlock) && initialFlock > 0 ? initialFlock : null,
  disclaimerAccepted: prefs.get(KEY_DISCLAIMER) === '1',
  setTheme: (theme) => {
    prefs.set(KEY_THEME, theme)
    applyTheme(theme)
    set({ theme })
  },
  setFontScale: (fontScale) => {
    prefs.set(KEY_FONT, String(fontScale))
    applyFontScale(fontScale)
    set({ fontScale })
  },
  selectFlock: (id) => {
    prefs.set(KEY_FLOCK, id === null ? '' : String(id))
    set({ selectedFlockId: id })
  },
  acceptDisclaimer: () => {
    prefs.set(KEY_DISCLAIMER, '1')
    set({ disclaimerAccepted: true })
  },
}))
