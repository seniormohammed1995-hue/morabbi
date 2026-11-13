const nf = new Map<string, Intl.NumberFormat>()

function fmt(digits: number): Intl.NumberFormat {
  const key = String(digits)
  let f = nf.get(key)
  if (!f) {
    f = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: digits, minimumFractionDigits: 0 })
    nf.set(key, f)
  }
  return f
}

/** Formats a number with Arabic-Indic digits. */
export function num(n: number | undefined | null, digits = 0): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return '—'
  return fmt(digits).format(n)
}

/** Formats a range "من–إلى" or a single number when min/max are missing or equal. */
export function range(
  r: { value: number; min?: number; max?: number },
  digits = 0,
): string {
  if (r.min !== undefined && r.max !== undefined && Math.abs(r.max - r.min) > 1e-9) {
    return `${num(r.min, digits)}–${num(r.max, digits)}`
  }
  return num(r.value, digits)
}

export function pct(n: number | undefined, digits = 1): string {
  if (n === undefined || !Number.isFinite(n)) return '—'
  return `${num(n, digits)}٪`
}

const df = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })
const dfShort = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short' })

export function dateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return df.format(new Date(y!, m! - 1, d!, 12))
}

export function dateShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return dfShort.format(new Date(y!, m! - 1, d!, 12))
}

/** Parses user input that may contain Arabic-Indic digits or Arabic decimal separator. */
export function parseNum(input: string): number | undefined {
  const s = input
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[٫,]/g, '.')
  if (s === '') return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}
