import type { CycleTask, CycleTemplate, FeedPhase, SpeciesData, Stage, Vaccination } from '../data/schema'
import { valueAt, stepAt, type Ranged } from './interp'
import { dailyFeedG, dailyWaterL, feedPhaseAt } from './feed'
import { broodingArea, marketAgeDays } from './planner'

export interface DayPlan {
  day: number
  stage: Stage | undefined
  isPrep: boolean
  temperature?: Ranged
  spotTemperature?: Ranged
  humidity?: Ranged
  lightHours?: number
  lightLux?: number
  feedPhase?: FeedPhase
  feedGPerBird?: number
  feedKgFlock?: number
  waterLFlock?: number
  targetWeightG?: Ranged
  broodAreaM2?: number
  vaccinations: Vaccination[]
  tasks: CycleTask[]
  signs: CycleTemplate['signs']
}

export function stageAt(tpl: CycleTemplate, day: number): Stage | undefined {
  return tpl.stages.find((s) => day >= s.fromDay && day <= s.toDay)
}

export function tasksOn(tpl: CycleTemplate, day: number): CycleTask[] {
  return tpl.tasks.filter((t) => (t.daily ? day >= t.fromDay && day <= t.toDay : day === t.fromDay))
}

/** Complete plan for one day of the cycle. `birds` = live birds expected that day. */
export function dayPlan(
  sp: SpeciesData,
  tpl: CycleTemplate,
  day: number,
  birds: number,
  floorM2?: number,
): DayPlan {
  const base = {
    day,
    stage: stageAt(tpl, day),
    tasks: tasksOn(tpl, day),
    signs: tpl.signs.filter((s) => day >= s.fromDay && day <= s.toDay),
    vaccinations: sp.health.vaccinations.filter((v) => v.day === day),
  }
  if (day < 0) return { ...base, isPrep: true }
  const feedG = dailyFeedG(sp, day)
  return {
    ...base,
    isPrep: false,
    temperature: valueAt(sp.environment.temperature, day),
    spotTemperature:
      day <= sp.environment.spotBroodingTemperature.points.at(-1)!.day
        ? valueAt(sp.environment.spotBroodingTemperature, day)
        : undefined,
    humidity: valueAt(sp.environment.humidity, day),
    lightHours: stepAt(sp.environment.lightHours, day),
    lightLux: stepAt(sp.environment.lightIntensity, day),
    feedPhase: feedPhaseAt(sp, day),
    feedGPerBird: feedG,
    feedKgFlock: (feedG * birds) / 1000,
    waterLFlock: dailyWaterL(sp, day) * birds,
    targetWeightG: valueAt(sp.growth.bodyWeight, day),
    broodAreaM2: floorM2 !== undefined ? broodingArea(sp, birds, day, floorM2).areaM2 : undefined,
  }
}

/** All days from preparation through market age. */
export function cycleDays(sp: SpeciesData, tpl: CycleTemplate): number[] {
  const out: number[] = []
  for (let d = -tpl.prepDays; d <= marketAgeDays(sp); d++) out.push(d)
  return out
}
