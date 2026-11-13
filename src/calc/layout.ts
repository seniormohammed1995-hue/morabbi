import type { HouseType, SpeciesData } from '../data/schema'
import { RULES } from '../data/rules'
import { broodingArea, equipment, heaterPlan, ventilation } from './planner'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}
export interface Pt {
  x: number
  y: number
}
export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface LayoutInput {
  length: number
  width: number
  height: number
  houseType: HouseType
  birds: number
  day: number
}

export interface Layout {
  length: number
  width: number
  brood: Rect | null
  heaters: Pt[]
  heaterId: string
  feeders: Pt[]
  drinkers: Pt[]
  chickTrays: Pt[]
  windows: Segment[]
  fans: Pt[]
  pads: Segment[]
  door: Segment
  truncated: boolean
  /** Drawing radius (m) for equipment icons, shrunk when the zone is crowded. */
  itemR: number
}

/** Evenly spread `n` points on a grid inside a rectangle, respecting its aspect ratio. */
export function gridPoints(r: Rect, n: number): Pt[] {
  if (n <= 0 || r.w <= 0 || r.h <= 0) return []
  const cols = Math.max(1, Math.round(Math.sqrt((n * r.w) / r.h)))
  const rows = Math.ceil(n / cols)
  const pts: Pt[] = []
  for (let i = 0; i < rows && pts.length < n; i++) {
    const inRow = Math.min(cols, n - i * cols)
    for (let j = 0; j < inRow; j++) {
      pts.push({ x: r.x + ((j + 0.5) * r.w) / inRow, y: r.y + ((i + 0.5) * r.h) / rows })
    }
  }
  return pts
}

/** Evenly spaced segments of length `size` along a line from (x1,y) to (x2,y) or vertical. */
function spaced(n: number, size: number, from: number, to: number, fixed: number, horizontal: boolean): Segment[] {
  const span = to - from
  const s = Math.min(size, span / Math.max(1, n) * 0.8)
  const out: Segment[] = []
  for (let i = 0; i < n; i++) {
    const c = from + ((i + 0.5) * span) / n
    out.push(
      horizontal
        ? { x1: c - s / 2, y1: fixed, x2: c + s / 2, y2: fixed }
        : { x1: fixed, y1: c - s / 2, x2: fixed, y2: c + s / 2 },
    )
  }
  return out
}

/**
 * Computes a top-down layout. The long side runs along x. Brooding sits at the x=0 end
 * (away from the door and fans), fans on the x=length wall, cooling pads on the x=0 wall.
 */
export function computeLayout(sp: SpeciesData, inp: LayoutInput): Layout {
  const L = Math.max(inp.length, inp.width)
  const W = Math.min(inp.length, inp.width)
  const floor = L * W
  const d = RULES.drawing

  const b = broodingArea(sp, inp.birds, inp.day, floor)
  let brood: Rect | null = null
  if (!b.full) {
    const h = Math.min(W, Math.max(Math.sqrt(b.areaM2), b.areaM2 / L))
    const l = Math.min(L, b.areaM2 / h)
    brood = { x: 0, y: (W - h) / 2, w: l, h }
  }
  const zone: Rect = brood ?? { x: 0, y: 0, w: L, h: W }
  const inner: Rect = { x: zone.x + zone.w * 0.05, y: zone.y + zone.h * 0.05, w: zone.w * 0.9, h: zone.h * 0.9 }

  const hp = heaterPlan(sp, inp.birds)
  const heatersNeeded = brood ? hp.count : 0
  const heaters = gridPoints(inner, heatersNeeded)

  const eq = equipment(sp, inp.birds, inp.day)
  let feederN = eq.panFeeders
  let drinkerN = eq.bellDrinkers
  let trayN = eq.chickTrays + eq.chickDrinkers
  const total = feederN + drinkerN + trayN
  const truncated = total > d.maxItems
  if (truncated) {
    const k = d.maxItems / total
    feederN = Math.max(1, Math.floor(feederN * k))
    drinkerN = Math.max(1, Math.floor(drinkerN * k))
    trayN = Math.floor(trayN * k)
  }

  // Alternate feeders and drinkers on one grid so birds never walk far between them.
  const mixed = gridPoints(inner, feederN + drinkerN)
  const feeders: Pt[] = []
  const drinkers: Pt[] = []
  let f = 0
  let dr = 0
  mixed.forEach((p, i) => {
    const wantFeeder = (i % 2 === 0 && f < feederN) || dr >= drinkerN
    if (wantFeeder) {
      feeders.push(p)
      f++
    } else {
      drinkers.push(p)
      dr++
    }
  })
  // Chick trays sit between the main equipment rows, inside the brooding zone.
  const chickTrays = gridPoints({ ...inner, y: inner.y + inner.h * 0.1, h: inner.h * 0.8 }, trayN).map((p) => ({
    x: p.x + inner.w / Math.max(2, trayN) / 2,
    y: p.y,
  }))

  const v = ventilation(sp, inp.birds, inp.day, floor, W * inp.height)
  const closed = inp.houseType === 'closed'
  let windows: Segment[] = []
  let fans: Pt[] = []
  let pads: Segment[] = []
  if (closed) {
    fans = Array.from({ length: Math.min(v.fans, 12) }, (_, i) => ({
      x: L,
      y: ((i + 0.5) * W) / Math.min(v.fans, 12),
    }))
    const padLen = Math.min(W * 0.9, v.padAreaM2 / d.padHeightM)
    pads = [{ x1: 0, y1: (W - padLen) / 2, x2: 0, y2: (W + padLen) / 2 }]
  } else {
    const perSide = Math.max(1, Math.ceil(v.windowAreaM2 / 2 / d.windowWidthM))
    const n = Math.min(perSide, Math.floor(L / (d.windowWidthM * 1.25)) || 1)
    windows = [...spaced(n, d.windowWidthM, 0, L, 0, true), ...spaced(n, d.windowWidthM, 0, L, W, true)]
  }

  const doorW = Math.min(1, W * 0.3)
  const door: Segment = closed
    ? { x1: L - L * 0.1 - doorW, y1: W, x2: L - L * 0.1, y2: W }
    : { x1: L, y1: (W - doorW) / 2, x2: L, y2: (W + doorW) / 2 }

  return {
    length: L,
    width: W,
    brood,
    heaters,
    heaterId: hp.heater.id,
    feeders,
    drinkers,
    chickTrays,
    windows,
    fans,
    pads,
    door,
    truncated,
    itemR: Math.min(0.35, Math.max(0.06, Math.sqrt((inner.w * inner.h) / Math.max(1, feederN + drinkerN + trayN)) * 0.22)),
  }
}
