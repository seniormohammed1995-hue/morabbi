import type { SpeciesData } from '../data/schema'
import { t, lt, type MsgKey } from '../i18n'

type Kind = 'cold' | 'hot' | 'draught' | 'comfortable'

/** Deterministic chick positions for each behaviour pattern around a central brooder. */
function chicks(kind: Kind): Array<[number, number]> {
  const out: Array<[number, number]> = []
  let s = 7
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  for (let i = 0; i < 40; i++) {
    const a = rand() * Math.PI * 2
    let x: number
    let y: number
    if (kind === 'cold') {
      const r = rand() * 13
      x = 50 + Math.cos(a) * r
      y = 50 + Math.sin(a) * r
    } else if (kind === 'hot') {
      const r = 34 + rand() * 9
      x = 50 + Math.cos(a) * r
      y = 50 + Math.sin(a) * r
    } else if (kind === 'draught') {
      x = 8 + rand() * 32
      y = 10 + rand() * 80
    } else {
      x = 10 + rand() * 80
      y = 10 + rand() * 80
    }
    out.push([Math.max(6, Math.min(94, x)), Math.max(6, Math.min(94, y))])
  }
  return out
}

const LABEL: Record<Kind, MsgKey> = {
  cold: 'planner.beh.cold',
  hot: 'planner.beh.hot',
  draught: 'planner.beh.draught',
  comfortable: 'planner.beh.ok',
}

export function Behaviour({ sp }: { sp: SpeciesData }) {
  const kinds: Kind[] = ['cold', 'hot', 'draught', 'comfortable']
  return (
    <div className="grid grid-cols-2 gap-3">
      {kinds.map((k) => (
        <figure key={k} className="rounded-xl bg-surface-2 p-2">
          <svg viewBox="0 0 100 100" className="h-auto w-full" role="img" aria-label={t(LABEL[k])}>
            <rect x="2" y="2" width="96" height="96" rx="6" fill="var(--c-surface)" stroke="var(--c-line)" />
            <circle cx="50" cy="50" r="16" fill="#D9480F" opacity="0.15" />
            <circle cx="50" cy="50" r="5" fill="#D9480F" />
            {k === 'draught' && <path d="M96 30 h-14 M96 50 h-18 M96 70 h-14" stroke="var(--c-muted)" strokeWidth="2" strokeLinecap="round" />}
            {chicks(k).map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill="#E9A23B" stroke="#8a5a14" strokeWidth="0.6" />
            ))}
          </svg>
          <figcaption className="mt-1 text-sm">
            <b>{t(LABEL[k])}:</b> {lt(sp.housing.behaviour[k])}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
