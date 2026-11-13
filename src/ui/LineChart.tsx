import { num } from '../i18n/format'

export interface Series {
  label: string
  points: Array<{ x: number; y: number }>
  color: string
  dashed?: boolean
  dots?: boolean
}

/** Minimal responsive SVG line chart. X grows left→right (time axes read naturally even in RTL). */
export function LineChart({
  series,
  height = 200,
  yUnit,
  xLabel,
  ariaLabel,
}: {
  series: Series[]
  height?: number
  yUnit?: string
  xLabel?: string
  ariaLabel: string
}) {
  const all = series.flatMap((s) => s.points)
  if (all.length === 0) return null
  const W = 340
  const H = height
  const pad = { l: 40, r: 10, t: 22, b: 28 }
  const xs = all.map((p) => p.x)
  const ys = all.map((p) => p.y)
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs, x0 + 1)
  const y0 = 0
  const y1 = niceMax(Math.max(...ys, 1))
  const sx = (x: number) => pad.l + ((x - x0) / (x1 - x0)) * (W - pad.l - pad.r)
  const sy = (y: number) => H - pad.b - ((y - y0) / (y1 - y0)) * (H - pad.t - pad.b)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => y0 + f * (y1 - y0))
  const xTicks = xTickValues(x0, x1)

  return (
    <figure className="w-full" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={sy(v)} y2={sy(v)} stroke="var(--c-line)" strokeWidth={1} />
            <text x={pad.l - 4} y={sy(v) + 4} textAnchor="end" fontSize={10} fill="var(--c-muted)">
              {num(v)}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <text key={v} x={sx(v)} y={H - pad.b + 14} textAnchor="middle" fontSize={10} fill="var(--c-muted)">
            {num(v)}
          </text>
        ))}
        {xLabel && (
          <text x={W - pad.r} y={H - 2} textAnchor="end" fontSize={10} fill="var(--c-muted)">
            {xLabel}
          </text>
        )}
        {yUnit && (
          <text x={pad.l - 4} y={10} textAnchor="end" fontSize={10} fill="var(--c-muted)">
            {yUnit}
          </text>
        )}
        {series.map((s) => (
          <g key={s.label}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeDasharray={s.dashed ? '5 4' : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')}
            />
            {s.dots && s.points.map((p) => <circle key={p.x} cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill={s.color} />)}
          </g>
        ))}
      </svg>
      <figcaption dir="rtl" className="mt-1 flex flex-wrap gap-4 text-sm">
        {series.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <svg width="22" height="6" aria-hidden="true">
              <line x1="0" x2="22" y1="3" y2="3" stroke={s.color} strokeWidth="3" strokeDasharray={s.dashed ? '5 4' : undefined} />
            </svg>
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

function niceMax(v: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return step * p
}

function xTickValues(x0: number, x1: number): number[] {
  const span = x1 - x0
  const step = span <= 10 ? 2 : span <= 30 ? 5 : 7
  const out: number[] = []
  for (let v = Math.ceil(x0 / step) * step; v <= x1; v += step) out.push(v)
  return out
}
