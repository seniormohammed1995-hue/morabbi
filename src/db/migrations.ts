import type { BirdKind, HouseType, Place } from '../data/schema'

/** Shape of a flock row written by v1 (before bird kinds existed). */
export interface V1Flock {
  speciesId: string
  houseType: HouseType
  kind?: BirdKind
  profileId?: string
  place?: Place
}

/** v1 only had detailed species; each maps to a v2 bird profile. */
const SPECIES_TO_PROFILE: Record<string, { kind: BirdKind; profileId: string }> = {
  'broiler-white': { kind: 'chicken', profileId: 'chicken-broiler-white' },
}

/** v1 house types → v2 places. Roofs default to "open" so heat alerts err on the safe side. */
const HOUSE_TO_PLACE: Record<HouseType, Place> = {
  roof: 'roof-open',
  room: 'room',
  yard: 'yard',
  closed: 'room',
  open: 'yard',
}

/** Fields a v1 flock gains in v2. Existing v2 values are kept. */
export function migrateFlockV2(f: V1Flock): { kind: BirdKind; profileId: string; place: Place } {
  const mapped = SPECIES_TO_PROFILE[f.speciesId] ?? {
    kind: 'chicken' as const,
    profileId: 'chicken-broiler-white',
  }
  return {
    kind: f.kind ?? mapped.kind,
    profileId: f.profileId ?? mapped.profileId,
    place: f.place ?? HOUSE_TO_PLACE[f.houseType] ?? 'roof-open',
  }
}

/** Place → nearest v1 house type (kept for the detailed broiler planner). */
export function placeToHouse(p: Place): HouseType {
  return p === 'roof-open' || p === 'roof-shaded' ? 'roof' : p === 'yard' ? 'yard' : 'room'
}
