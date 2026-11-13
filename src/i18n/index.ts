import { ar, type MsgKey } from './ar'
import type { LocalizedText } from '../data/schema'

export type { MsgKey }

/** Translates a UI key, replacing {name} placeholders with params. */
export function t(key: MsgKey, params?: Record<string, string | number>): string {
  let s: string = ar[key]
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v))
  }
  return s
}

/** Picks the current-language string from content text. */
export function lt(text: LocalizedText | undefined): string {
  return text?.ar ?? ''
}
