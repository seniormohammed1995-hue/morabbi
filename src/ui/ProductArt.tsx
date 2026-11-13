import type { ReactNode } from 'react'

/**
 * Original flat illustrations for the market products, in the same "طين وقمح" style as
 * BirdArt: a tinted rounded tile and one or two solid shapes. Fixed colours (not themed) so
 * they read the same in light and dark mode. Amazon product photos may only be shown through
 * Amazon's own SiteStripe/API, so the app draws its own.
 */
export type ProductArtId =
  | 'incubator'
  | 'lamp'
  | 'thermometer'
  | 'thermostat'
  | 'socket'
  | 'nipple'
  | 'drinker'
  | 'feeder'
  | 'float'
  | 'tray'
  | 'bottle'
  | 'powder'
  | 'sprayer'
  | 'floor'
  | 'shavings'
  | 'broom'
  | 'scale'
  | 'hangScale'
  | 'chopper'
  | 'timer'
  | 'fan'
  | 'cage'

const C = {
  clay: '#B4532A',
  clayDark: '#7E3517',
  wheat: '#E9A23B',
  leaf: '#4F6B34',
  sky: '#5D8FB8',
  ink: '#3A2A1E',
  cream: '#FBF5EA',
  white: '#FFFFFF',
  red: '#D93A2B',
  grey: '#A39582',
}

const TILE: Record<ProductArtId, string> = {
  incubator: '#FBEBC8',
  lamp: '#F6E1D3',
  thermometer: '#E1E6EE',
  thermostat: '#E1E6EE',
  socket: '#ECE7DD',
  nipple: '#DCEAF4',
  drinker: '#DCEAF4',
  feeder: '#EFE5D4',
  float: '#DCEAF4',
  tray: '#FBEBC8',
  bottle: '#E3EBD6',
  powder: '#E3EBD6',
  sprayer: '#E3EBD6',
  floor: '#ECE7DD',
  shavings: '#EFE5D4',
  broom: '#ECE7DD',
  scale: '#F0DEDA',
  hangScale: '#F0DEDA',
  chopper: '#E3EBD6',
  timer: '#E1E6EE',
  fan: '#DCEAF4',
  cage: '#EFE5D4',
}

const ART: Record<ProductArtId, ReactNode> = {
  incubator: (
    <>
      <rect x="12" y="22" width="40" height="26" rx="6" fill={C.white} stroke={C.clay} strokeWidth="2.5" />
      <path d="M12 30c0-8 9-14 20-14s20 6 20 14" fill="#DCEAF4" stroke={C.clay} strokeWidth="2.5" />
      <ellipse cx="24" cy="29" rx="4" ry="5" fill={C.cream} stroke={C.wheat} strokeWidth="1.5" />
      <ellipse cx="32" cy="27" rx="4" ry="5" fill={C.cream} stroke={C.wheat} strokeWidth="1.5" />
      <ellipse cx="40" cy="29" rx="4" ry="5" fill={C.cream} stroke={C.wheat} strokeWidth="1.5" />
      <rect x="22" y="38" width="20" height="6" rx="2" fill={C.ink} />
      <text x="32" y="43" textAnchor="middle" fontSize="5" fill="#7CF29A" fontFamily="monospace">37.7</text>
    </>
  ),
  lamp: (
    <>
      <path d="M32 8v8" stroke={C.ink} strokeWidth="2.5" />
      <path d="M20 22h24l-4 14H24z" fill={C.clayDark} />
      <circle cx="32" cy="40" r="8" fill={C.red} />
      <path d="M20 50l-4 4M32 52v6M44 50l4 4" stroke={C.wheat} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  thermometer: (
    <>
      <rect x="16" y="14" width="32" height="36" rx="6" fill={C.white} stroke={C.sky} strokeWidth="2.5" />
      <text x="32" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.ink} fontFamily="sans-serif">32°</text>
      <text x="32" y="43" textAnchor="middle" fontSize="8" fill={C.sky} fontFamily="sans-serif">60%</text>
      <path d="M48 44h8" stroke={C.grey} strokeWidth="2" />
    </>
  ),
  thermostat: (
    <>
      <rect x="14" y="16" width="36" height="30" rx="5" fill={C.ink} />
      <rect x="19" y="21" width="26" height="11" rx="2" fill="#13261A" />
      <text x="32" y="30" textAnchor="middle" fontSize="8" fill="#7CF29A" fontFamily="monospace">30.0</text>
      <circle cx="24" cy="39" r="2.5" fill={C.wheat} />
      <circle cx="32" cy="39" r="2.5" fill={C.wheat} />
      <circle cx="40" cy="39" r="2.5" fill={C.red} />
      <path d="M32 46v8M28 54h8" stroke={C.grey} strokeWidth="2.5" />
    </>
  ),
  socket: (
    <>
      <path d="M32 10v10" stroke={C.ink} strokeWidth="2.5" />
      <rect x="22" y="20" width="20" height="22" rx="5" fill={C.white} stroke={C.grey} strokeWidth="2.5" />
      <path d="M24 46h16l-2 8H26z" fill={C.grey} />
      <path d="M26 28h12M26 34h12" stroke={C.grey} strokeWidth="2" />
    </>
  ),
  nipple: (
    <>
      <rect x="8" y="16" width="48" height="8" rx="4" fill={C.sky} />
      {[16, 32, 48].map((x) => (
        <g key={x}>
          <path d={`M${x - 4} 24h8l-2 10h-4z`} fill={C.clay} />
          <circle cx={x} cy="40" r="3" fill="#8EC5EA" />
        </g>
      ))}
    </>
  ),
  drinker: (
    <>
      <path d="M32 8v6" stroke={C.ink} strokeWidth="2.5" />
      <path d="M22 14h20v24c0 4-4 6-10 6s-10-2-10-6z" fill="#8EC5EA" fillOpacity="0.85" stroke={C.sky} strokeWidth="2" />
      <ellipse cx="32" cy="48" rx="20" ry="6" fill={C.clay} />
      <ellipse cx="32" cy="46" rx="16" ry="3" fill="#8EC5EA" />
    </>
  ),
  feeder: (
    <>
      <path d="M32 8v6" stroke={C.ink} strokeWidth="2.5" />
      <path d="M24 14h16v24H24z" fill={C.wheat} stroke={C.clayDark} strokeWidth="2" />
      <ellipse cx="32" cy="46" rx="20" ry="7" fill={C.clay} />
      <path d="M14 44c6 3 30 3 36 0" stroke={C.clayDark} strokeWidth="2" fill="none" />
      {[20, 26, 32, 38, 44].map((x) => (
        <path key={x} d={`M${x} 40v6`} stroke={C.clayDark} strokeWidth="1.5" />
      ))}
    </>
  ),
  float: (
    <>
      <rect x="10" y="26" width="44" height="26" rx="4" fill="#8EC5EA" fillOpacity="0.7" stroke={C.sky} strokeWidth="2" />
      <path d="M10 34h44" stroke={C.white} strokeWidth="1.5" />
      <path d="M44 12v14M44 16H30" stroke={C.grey} strokeWidth="3" strokeLinecap="round" />
      <circle cx="26" cy="32" r="7" fill={C.wheat} stroke={C.clayDark} strokeWidth="1.5" />
    </>
  ),
  tray: (
    <>
      <ellipse cx="32" cy="40" rx="24" ry="9" fill={C.clay} />
      <ellipse cx="32" cy="38" rx="20" ry="6" fill={C.wheat} />
      {[22, 28, 34, 40].map((x, i) => (
        <circle key={x} cx={x} cy={37 + (i % 2)} r="1.5" fill={C.clayDark} />
      ))}
      <circle cx="44" cy="24" r="7" fill="#F2C14E" />
      <path d="M50 24l4 1-4 2" fill={C.wheat} />
      <circle cx="46" cy="22" r="1.3" fill={C.ink} />
    </>
  ),
  bottle: (
    <>
      <rect x="26" y="8" width="12" height="8" rx="2" fill={C.leaf} />
      <path d="M22 18h20v34a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z" fill={C.white} stroke={C.leaf} strokeWidth="2.5" />
      <rect x="22" y="28" width="20" height="14" fill="#E3EBD6" />
      <path d="M32 31v8M28 35h8" stroke={C.leaf} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  powder: (
    <>
      <path d="M18 22h28l-3 30H21z" fill={C.white} stroke={C.leaf} strokeWidth="2.5" />
      <rect x="16" y="16" width="32" height="7" rx="2" fill={C.leaf} />
      <rect x="22" y="30" width="20" height="12" rx="2" fill="#E3EBD6" />
      <circle cx="28" cy="36" r="2" fill={C.leaf} />
      <circle cx="35" cy="36" r="2" fill={C.wheat} />
    </>
  ),
  sprayer: (
    <>
      <path d="M20 26h22v24a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6z" fill={C.leaf} />
      <rect x="27" y="14" width="8" height="12" fill={C.ink} />
      <path d="M35 18h12l4 3" stroke={C.ink} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M54 18l4-2M54 22h5M54 26l4 2" stroke="#8EC5EA" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  floor: (
    <>
      <rect x="10" y="14" width="44" height="36" rx="3" fill={C.grey} />
      {[18, 26, 34, 42].map((y) => (
        <path key={y} d={`M10 ${y}h44`} stroke={C.white} strokeWidth="2" />
      ))}
      {[18, 26, 34, 42, 50].map((x) => (
        <path key={x} d={`M${x} 14v36`} stroke={C.white} strokeWidth="2" />
      ))}
    </>
  ),
  shavings: (
    <>
      <path d="M8 46c8-10 40-10 48 0z" fill={C.wheat} />
      {[
        [18, 38],
        [28, 34],
        [38, 36],
        [46, 40],
        [24, 42],
        [34, 42],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y}c3-3 6-3 8 0`} stroke={C.clayDark} strokeWidth="1.8" fill="none" />
      ))}
    </>
  ),
  broom: (
    <>
      <path d="M44 8L30 34" stroke={C.clayDark} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M22 32l14 6-6 14-14-6z" fill={C.wheat} />
      <path d="M8 50h20l2 6H6z" fill={C.grey} />
      <path d="M28 50l10-6" stroke={C.ink} strokeWidth="2.5" />
    </>
  ),
  scale: (
    <>
      <rect x="10" y="30" width="44" height="20" rx="5" fill={C.white} stroke={C.clay} strokeWidth="2.5" />
      <rect x="22" y="38" width="20" height="7" rx="1.5" fill={C.ink} />
      <text x="32" y="44" textAnchor="middle" fontSize="5.5" fill="#7CF29A" fontFamily="monospace">1250g</text>
      <ellipse cx="32" cy="24" rx="12" ry="6" fill="#F2C14E" />
      <circle cx="40" cy="20" r="4" fill="#F2C14E" />
      <circle cx="41" cy="19" r="1" fill={C.ink} />
    </>
  ),
  hangScale: (
    <>
      <path d="M32 6v8" stroke={C.ink} strokeWidth="2.5" />
      <rect x="22" y="14" width="20" height="18" rx="5" fill={C.clay} />
      <rect x="25" y="18" width="14" height="7" rx="1" fill={C.ink} />
      <path d="M32 32v6" stroke={C.ink} strokeWidth="2.5" />
      <path d="M26 38h12l2 4H24z" fill={C.grey} />
      <rect x="20" y="42" width="24" height="14" rx="2" fill={C.wheat} />
    </>
  ),
  chopper: (
    <>
      <path d="M18 26h28l-3 26H21z" fill={C.white} fillOpacity="0.9" stroke={C.leaf} strokeWidth="2.5" />
      <rect x="16" y="18" width="32" height="8" rx="3" fill={C.leaf} />
      <circle cx="28" cy="40" r="4" fill="#7FA37A" />
      <circle cx="37" cy="44" r="3" fill={C.wheat} />
      <path d="M32 10v8" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  timer: (
    <>
      <rect x="16" y="12" width="32" height="40" rx="6" fill={C.white} stroke={C.sky} strokeWidth="2.5" />
      <circle cx="32" cy="30" r="10" fill="#DCEAF4" stroke={C.sky} strokeWidth="2" />
      <path d="M32 30V23M32 30l5 3" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
      <path d="M27 46v4M37 46v4" stroke={C.grey} strokeWidth="3" />
    </>
  ),
  fan: (
    <>
      <rect x="12" y="12" width="40" height="40" rx="6" fill={C.white} stroke={C.sky} strokeWidth="2.5" />
      <circle cx="32" cy="32" r="14" fill="none" stroke={C.grey} strokeWidth="1.5" />
      <path d="M32 32c0-8 6-10 8-6s-4 6-8 6zM32 32c8 0 10 6 6 8s-6-4-6-8zM32 32c0 8-6 10-8 6s4-6 8-6zM32 32c-8 0-10-6-6-8s6 4 6 8z" fill={C.sky} />
      <circle cx="32" cy="32" r="2.5" fill={C.ink} />
    </>
  ),
  cage: (
    <>
      <rect x="10" y="14" width="44" height="34" rx="3" fill="none" stroke={C.grey} strokeWidth="2.5" />
      {[18, 26, 34, 42, 50].map((x) => (
        <path key={x} d={`M${x} 14v34`} stroke={C.grey} strokeWidth="1.5" />
      ))}
      <rect x="8" y="48" width="48" height="6" rx="2" fill={C.clay} />
      <circle cx="28" cy="38" r="6" fill={C.clay} />
      <circle cx="32" cy="34" r="3" fill={C.clay} />
      <path d="M34 33l3 1-3 1" fill={C.wheat} />
    </>
  ),
}

export function ProductArt({ art, size = 72 }: { art: ProductArtId; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0 rounded-2xl"
      style={{ background: TILE[art] }}
    >
      {ART[art]}
    </svg>
  )
}
