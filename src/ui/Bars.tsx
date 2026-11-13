import { num } from '../i18n/format'

/** Simple vertical bar chart. Item 0 sits on the right (RTL reading order). */
export function Bars({
  data,
  label,
}: {
  data: Array<{ label: string; value: number; highlight?: boolean }>
  label: string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const w = 100 / data.length
  return (
    <figure className="w-full">
      <svg
        viewBox="0 0 100 40"
        className="h-28 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        <line x1="0" y1="39.7" x2="100" y2="39.7" className="stroke-line" strokeWidth="0.6" />
        {data.map((d, i) => {
          const h = (d.value / max) * 38
          const x = 100 - (i + 1) * w + w * 0.18
          return (
            <rect
              key={i}
              x={x}
              y={40 - h}
              width={w * 0.64}
              height={Math.max(h, 0.5)}
              rx={1}
              className={d.highlight ? 'fill-primary' : 'fill-accent'}
            />
          )
        })}
      </svg>
      <div className="flex text-center text-[11px] text-muted">
        {data.map((d, i) => (
          <div key={i} style={{ width: `${w}%` }}>
            <div className="num font-bold text-ink">{num(d.value)}</div>
            <div className="truncate">{d.label}</div>
          </div>
        ))}
      </div>
    </figure>
  )
}
