import type { BirdKind } from '../data/schema'

/** Selection cards include "young chicks of any kind" next to the six bird kinds. */
export type KindCard = BirdKind | 'chicks'

/**
 * One flat style for every bird: soft tinted disc, solid body, a single darker accent,
 * cream eye ring. Colours come from the "طين وقمح" identity and are fixed (not themed)
 * so the art reads the same in light and dark mode.
 */
export const KIND_COLORS: Record<
  KindCard,
  { bg: string; body: string; dark: string; accent: string }
> = {
  chicken: { bg: '#F6E1D3', body: '#B4532A', dark: '#7E3517', accent: '#D93A2B' },
  pigeon: { bg: '#E1E6EE', body: '#7D8BA1', dark: '#4C5869', accent: '#7FA37A' },
  quail: { bg: '#EFE5D4', body: '#9A7650', dark: '#5E4329', accent: '#3A2A1E' },
  duck: { bg: '#E3EBD6', body: '#F3EBDD', dark: '#4F6B34', accent: '#E9A23B' },
  goose: { bg: '#ECE7DD', body: '#FFFFFF', dark: '#A39582', accent: '#E07A2C' },
  turkey: { bg: '#F0DEDA', body: '#5A3A2E', dark: '#33201A', accent: '#C9302C' },
  chicks: { bg: '#FBEBC8', body: '#F2C14E', dark: '#C7901C', accent: '#E07A2C' },
}

function Eye({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={2.6} fill="#FBF5EA" />
      <circle cx={x + 0.4} cy={y} r={1.4} fill="#2A1C12" />
    </>
  )
}

function Chicken() {
  const c = KIND_COLORS.chicken
  return (
    <>
      <path
        d="M14 40c0-9 7-15 16-15h6l4-9c5 0 8 4 8 9v4c0 12-9 19-20 19h-2c-7 0-12-3-12-8Z"
        fill={c.body}
      />
      <path d="M12 30c4 0 6 4 5 9-4-1-6-5-5-9Z" fill={c.dark} />
      <path d="M38 13c1-3 3-4 4-2 1-2 3-2 4 0 2-1 3 1 2 3l-10 1Z" fill={c.accent} />
      <path d="M48 23l6 2-6 2Z" fill="#E9A23B" />
      <path d="M46 28c1 3 0 5-2 5-1-2 0-4 2-5Z" fill={c.accent} />
      <path
        d="M24 37c4 4 10 4 14 0"
        stroke={c.dark}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M27 48v6m8-6v6" stroke="#E9A23B" strokeWidth={2.4} strokeLinecap="round" />
      <Eye x={43} y={21} />
    </>
  )
}

function Pigeon() {
  const c = KIND_COLORS.pigeon
  return (
    <>
      <path
        d="M10 42c6-1 10-6 14-10 5-5 9-9 15-9 5 0 9 4 9 9 0 9-8 16-19 16-7 0-13-2-19-6Z"
        fill={c.body}
      />
      <path d="M38 23c-1-5 2-9 6-9 3 0 5 2 5 5 0 2-1 4-3 5Z" fill={c.body} />
      <path
        d="M38 27c3 2 7 2 10 0"
        stroke={c.accent}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M49 18l5 1.5-5 1.5Z" fill={c.dark} />
      <path
        d="M18 38c6 0 12-2 16-7"
        stroke={c.dark}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M22 41c5 0 9-1 12-4"
        stroke={c.dark}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M30 48v5m6-6v5" stroke="#C9302C" strokeWidth={2.2} strokeLinecap="round" />
      <Eye x={45} y={18} />
    </>
  )
}

function Quail() {
  const c = KIND_COLORS.quail
  return (
    <>
      <ellipse cx={30} cy={37} rx={18} ry={13} fill={c.body} />
      <circle cx={44} cy={25} r={8} fill={c.body} />
      <path d="M51 24l5 2-5 2Z" fill={c.accent} />
      <path
        d="M38 22c3-2 8-2 11 0"
        stroke="#FBF5EA"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      {[
        [22, 32],
        [28, 36],
        [34, 32],
        [24, 41],
        [31, 43],
        [38, 39],
        [19, 37],
      ].map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x! - 2} ${y}h4`}
          stroke={c.dark}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      <path d="M26 49v5m7-5v5" stroke={c.dark} strokeWidth={2.2} strokeLinecap="round" />
      <Eye x={45} y={24} />
    </>
  )
}

function Duck() {
  const c = KIND_COLORS.duck
  return (
    <>
      <path
        d="M8 38c6 1 10-1 14-1h14c4-3 4-7 3-11-1-6 2-11 8-11 5 0 8 4 8 8 0 3-2 5-4 6 1 13-6 22-21 22-12 0-20-5-22-13Z"
        fill={c.body}
        stroke={c.dark}
        strokeWidth={0}
      />
      <path d="M41 15c3-2 9-1 11 3 1 3 0 6-3 7-3 0-7-1-9-4-1-2 0-4 1-6Z" fill={c.dark} />
      <path d="M52 21c3 0 6 1 6 3s-3 3-7 2Z" fill={c.accent} />
      <path
        d="M18 42c6 3 14 3 20-1"
        stroke="#CBBFA9"
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M10 52c6-2 10 2 16 0s10 2 16 0 10 2 16 0"
        stroke="#7FB2C9"
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      <Eye x={47} y={19} />
    </>
  )
}

function Goose() {
  const c = KIND_COLORS.goose
  return (
    <>
      <path
        d="M10 42c0-7 7-11 15-11h8c3 0 5-3 5-7V17c0-4 3-7 7-7s6 3 6 6v20c0 9-7 15-18 15h-8c-9 0-15-4-15-9Z"
        fill={c.body}
        stroke={c.dark}
        strokeWidth={1.6}
      />
      <path d="M51 14l6 3-6 2Z" fill={c.accent} />
      <path
        d="M48 12c2 0 3 1 3 2"
        stroke={c.accent}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M18 41c6 3 12 3 18 0"
        stroke={c.dark}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M27 51v4m8-4v4" stroke={c.accent} strokeWidth={2.4} strokeLinecap="round" />
      <Eye x={46} y={15} />
    </>
  )
}

function Turkey() {
  const c = KIND_COLORS.turkey
  const feathers = [-60, -35, -12, 12, 35, 60]
  return (
    <>
      {feathers.map((a) => (
        <ellipse
          key={a}
          cx={24}
          cy={22}
          rx={5}
          ry={14}
          fill={a % 2 === 0 ? c.dark : '#8A5A3E'}
          transform={`rotate(${a} 24 36)`}
        />
      ))}
      <ellipse cx={30} cy={40} rx={15} ry={11} fill={c.body} />
      <path d="M38 36c1-8 2-14 7-16 4-1 6 2 6 5 0 3-2 5-4 6l-3 7Z" fill="#9FB4C7" />
      <path d="M50 24l5 2-5 2Z" fill="#E9A23B" />
      <path d="M48 28c3 1 3 6 0 8-2-2-2-6 0-8Z" fill={c.accent} />
      <path d="M27 50v5m7-5v5" stroke="#B9846A" strokeWidth={2.4} strokeLinecap="round" />
      <Eye x={46} y={23} />
    </>
  )
}

function Chicks() {
  const c = KIND_COLORS.chicks
  return (
    <>
      <path
        d="M8 50c0-8 5-14 12-14s12 6 12 14Z"
        fill="#FBF5EA"
        stroke="#E2D2B8"
        strokeWidth={1.4}
      />
      <path
        d="M8 42l5 3 4-4 4 4 5-4 4 4 2-2"
        stroke="#E2D2B8"
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
      />
      <circle cx={40} cy={38} r={12} fill={c.body} />
      <circle cx={44} cy={25} r={8} fill={c.body} />
      <path d="M51 25l5 2-5 2Z" fill={c.accent} />
      <path
        d="M33 38c3 3 8 3 11 0"
        stroke={c.dark}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M38 50v4m6-4v4" stroke={c.accent} strokeWidth={2.2} strokeLinecap="round" />
      <Eye x={45} y={24} />
    </>
  )
}

const ART: Record<KindCard, () => React.JSX.Element> = {
  chicken: Chicken,
  pigeon: Pigeon,
  quail: Quail,
  duck: Duck,
  goose: Goose,
  turkey: Turkey,
  chicks: Chicks,
}

/** Bird illustration on a tinted disc. Decorative: callers give the visible label. */
export function BirdArt({
  kind,
  size = 64,
  className,
}: {
  kind: KindCard
  size?: number
  className?: string
}) {
  const Art = ART[kind]
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx={32} cy={32} r={32} fill={KIND_COLORS[kind].bg} />
      <Art />
    </svg>
  )
}
