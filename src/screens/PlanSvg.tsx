import { forwardRef } from 'react'
import type { Layout } from '../calc/layout'
import { t } from '../i18n'
import { num } from '../i18n/format'

/** Literal colours (not CSS variables) so the exported PNG/PDF renders identically. */
const C = {
  floor: '#FBF5EA',
  wall: '#3A2A1E',
  brood: '#F6E0D3',
  broodLine: '#B4532A',
  heater: '#D9480F',
  feeder: '#E9A23B',
  drinker: '#2B7BB9',
  tray: '#C9A227',
  window: '#7FB3D5',
  fan: '#4F6B34',
  pad: '#2B7BB9',
  door: '#8B5E3C',
  text: '#3A2A1E',
}

export const PLAN_COLORS = C

/** Top-down plan drawn to scale (1 m = `ppm` px). */
export const PlanSvg = forwardRef<SVGSVGElement, { layout: Layout; title: string }>(function PlanSvg({ layout: l, title }, ref) {
  const margin = 1.6
  const W = l.length + margin * 2
  const H = l.width + margin * 2 + 1.2
  const ox = margin
  const oy = margin
  const unit = Math.max(l.length, l.width) / 40
  const r = l.itemR
  const scaleM = niceScale(l.length / 4)

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full rounded-xl border border-line bg-white"
      role="img"
      aria-label={title}
      style={{ direction: 'ltr' }}
    >
      <rect x={0} y={0} width={W} height={H} fill="#ffffff" />
      {/* Floor */}
      <rect x={ox} y={oy} width={l.length} height={l.width} fill={C.floor} stroke={C.wall} strokeWidth={unit * 0.6} />
      {/* Brooding zone */}
      {l.brood && (
        <rect
          x={ox + l.brood.x}
          y={oy + l.brood.y}
          width={l.brood.w}
          height={l.brood.h}
          fill={C.brood}
          stroke={C.broodLine}
          strokeWidth={unit * 0.35}
          strokeDasharray={`${unit} ${unit * 0.6}`}
        />
      )}
      {/* Equipment */}
      {l.feeders.map((p, i) => (
        <circle key={`f${i}`} cx={ox + p.x} cy={oy + p.y} r={r} fill={C.feeder} stroke={C.wall} strokeWidth={r * 0.15} />
      ))}
      {l.drinkers.map((p, i) => (
        <circle key={`d${i}`} cx={ox + p.x} cy={oy + p.y} r={r * 0.85} fill="#ffffff" stroke={C.drinker} strokeWidth={r * 0.4} />
      ))}
      {l.chickTrays.map((p, i) => (
        <rect key={`t${i}`} x={ox + p.x - r * 0.7} y={oy + p.y - r * 0.7} width={r * 1.4} height={r * 1.4} fill={C.tray} opacity={0.85} />
      ))}
      {l.heaters.map((p, i) => (
        <g key={`h${i}`}>
          <circle cx={ox + p.x} cy={oy + p.y} r={r * 2.4} fill={C.heater} opacity={0.18} />
          <circle cx={ox + p.x} cy={oy + p.y} r={r * 1.1} fill={C.heater} />
        </g>
      ))}
      {/* Openings */}
      {l.windows.map((s, i) => (
        <line key={`w${i}`} x1={ox + s.x1} y1={oy + s.y1} x2={ox + s.x2} y2={oy + s.y2} stroke={C.window} strokeWidth={unit * 1.6} />
      ))}
      {l.pads.map((s, i) => (
        <line key={`p${i}`} x1={ox + s.x1} y1={oy + s.y1} x2={ox + s.x2} y2={oy + s.y2} stroke={C.pad} strokeWidth={unit * 2} strokeDasharray={`${unit * 0.5} ${unit * 0.3}`} />
      ))}
      {l.fans.map((p, i) => (
        <g key={`fan${i}`} transform={`translate(${ox + p.x} ${oy + p.y})`}>
          <rect x={-unit * 0.4} y={-Math.min(0.6, l.width / l.fans.length / 2.5)} width={unit * 1.6} height={Math.min(1.2, (l.width / l.fans.length) * 0.8)} fill={C.fan} />
        </g>
      ))}
      <line x1={ox + l.door.x1} y1={oy + l.door.y1} x2={ox + l.door.x2} y2={oy + l.door.y2} stroke={C.door} strokeWidth={unit * 1.8} />

      {/* Wind arrow: prevailing wind hits the long side */}
      <g transform={`translate(${ox + l.length / 2} ${oy - margin * 0.55})`}>
        <line x1={0} y1={-margin * 0.3} x2={0} y2={margin * 0.25} stroke={C.text} strokeWidth={unit * 0.4} />
        <path d={`M ${-unit} ${margin * 0.1} L 0 ${margin * 0.35} L ${unit} ${margin * 0.1} Z`} fill={C.text} />
        <text x={unit * 1.5} y={0} fontSize={unit * 1.6} fill={C.text} fontFamily="Cairo, sans-serif">
          {t('planner.wind')}
        </text>
      </g>

      {/* Dimensions */}
      <text x={ox + l.length / 2} y={oy + l.width + unit * 3} textAnchor="middle" fontSize={unit * 1.8} fill={C.text} fontFamily="Cairo, sans-serif">
        {num(l.length, 1)} {t('common.m')}
      </text>
      <text
        x={ox - unit * 2}
        y={oy + l.width / 2}
        textAnchor="middle"
        fontSize={unit * 1.8}
        fill={C.text}
        fontFamily="Cairo, sans-serif"
        transform={`rotate(-90 ${ox - unit * 2} ${oy + l.width / 2})`}
      >
        {num(l.width, 1)} {t('common.m')}
      </text>

      {/* Scale bar */}
      <g transform={`translate(${ox} ${H - 0.55})`}>
        <rect x={0} y={0} width={scaleM} height={unit * 0.6} fill={C.text} />
        <text x={scaleM + unit} y={unit * 0.8} fontSize={unit * 1.6} fill={C.text} fontFamily="Cairo, sans-serif">
          {t('planner.scale', { m: num(scaleM) })}
        </text>
      </g>
    </svg>
  )
})

function niceScale(v: number): number {
  for (const s of [0.5, 1, 2, 5, 10, 20, 50]) if (s >= v) return s
  return 100
}

export function PlanLegend({ closed, brood }: { closed: boolean; brood: boolean }) {
  const items: Array<{ key: Parameters<typeof t>[0]; swatch: React.ReactNode }> = [
    ...(brood ? [{ key: 'planner.legend.brood' as const, swatch: <rect width="18" height="12" y="2" fill={C.brood} stroke={C.broodLine} strokeDasharray="3 2" /> }] : []),
    ...(brood ? [{ key: 'planner.legend.heater' as const, swatch: <circle cx="9" cy="8" r="6" fill={C.heater} /> }] : []),
    { key: 'planner.legend.feeder', swatch: <circle cx="9" cy="8" r="6" fill={C.feeder} /> },
    { key: 'planner.legend.drinker', swatch: <circle cx="9" cy="8" r="5" fill="#fff" stroke={C.drinker} strokeWidth="3" /> },
    ...(closed
      ? [
          { key: 'planner.legend.fan' as const, swatch: <rect width="10" height="14" x="4" y="1" fill={C.fan} /> },
          { key: 'planner.legend.pad' as const, swatch: <line x1="9" x2="9" y1="0" y2="16" stroke={C.pad} strokeWidth="5" strokeDasharray="3 2" /> },
        ]
      : [{ key: 'planner.legend.window' as const, swatch: <line x1="0" x2="18" y1="8" y2="8" stroke={C.window} strokeWidth="5" /> }]),
    { key: 'planner.legend.door', swatch: <line x1="0" x2="18" y1="8" y2="8" stroke={C.door} strokeWidth="5" /> },
  ]
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {items.map((it) => (
        <li key={it.key} className="flex items-center gap-1.5">
          <svg width="18" height="16" aria-hidden="true">
            {it.swatch}
          </svg>
          {t(it.key)}
        </li>
      ))}
    </ul>
  )
}
