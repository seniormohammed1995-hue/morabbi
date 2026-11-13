import type { BirdKind, BirdProfile } from '../schema'
import { CHICKEN_PROFILES } from './chicken'
import { PIGEON_PROFILES } from './pigeon'
import { QUAIL_PROFILES } from './quail'
import { DUCK_PROFILES } from './duck'
import { GOOSE_PROFILES } from './goose'
import { TURKEY_PROFILES } from './turkey'

/** Every bird profile (one per breed), in the order shown to the user. */
export const PROFILES: BirdProfile[] = [
  ...CHICKEN_PROFILES,
  ...PIGEON_PROFILES,
  ...QUAIL_PROFILES,
  ...DUCK_PROFILES,
  ...GOOSE_PROFILES,
  ...TURKEY_PROFILES,
]

export const KINDS: BirdKind[] = ['chicken', 'pigeon', 'quail', 'duck', 'goose', 'turkey']

const byId = new Map(PROFILES.map((p) => [p.id, p]))

export function getProfile(id: string): BirdProfile | undefined {
  return byId.get(id)
}

export function profilesOf(kind: BirdKind): BirdProfile[] {
  return PROFILES.filter((p) => p.kind === kind)
}
