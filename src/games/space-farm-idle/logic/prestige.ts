/** Prestige system — Cosmic Seeds calculation and prestige reset */

import type { GameState } from './game-state'
import { CONSTANTS } from '../data/constants'
import { PLANETS } from '../data/planets'

export function canPrestige(state: GameState): boolean {
  return state.totalCoins >= CONSTANTS.PRESTIGE_DIVISOR
}

export function calcCosmicSeedsEarned(state: GameState): number {
  if (state.totalCoins < CONSTANTS.PRESTIGE_DIVISOR) return 0
  return Math.floor(Math.sqrt(state.totalCoins / CONSTANTS.PRESTIGE_DIVISOR))
}

export function performPrestige(state: GameState): number {
  const seeds = calcCosmicSeedsEarned(state)
  if (seeds <= 0) return 0

  state.cosmicSeeds += seeds
  state.prestigeCount++
  state.prestigeBonus = 1 + (state.cosmicSeeds / 100) * 0.10

  // Unlock new planets based on cosmic seeds
  unlockPlanets(state)

  // Reset progress
  state.coins = 0
  state.totalCoins = 0
  state.farmLevel = 1
  state.workers = 0
  state.workerSpeed = 0
  state.cropSlots = []
  state.currentWeather = 'clear'
  state.weatherTimer = CONSTANTS.WEATHER_CHANGE_INTERVAL

  // Keep: cosmicSeeds, prestigeCount, prestigeBonus, unlockedPlanets, unlockedCrops, upgrades

  return seeds
}

export function getPrestigeRequirement(): number {
  return CONSTANTS.PRESTIGE_DIVISOR
}

function unlockPlanets(state: GameState): void {
  for (const planet of PLANETS) {
    if (!state.unlockedPlanets.includes(planet.id) && state.cosmicSeeds >= planet.unlockCosmicSeeds) {
      state.unlockedPlanets.push(planet.id)
    }
  }
}

export function checkPlanetUnlocks(state: GameState): string[] {
  const newlyUnlocked: string[] = []
  for (const planet of PLANETS) {
    if (!state.unlockedPlanets.includes(planet.id) && state.cosmicSeeds >= planet.unlockCosmicSeeds) {
      state.unlockedPlanets.push(planet.id)
      newlyUnlocked.push(planet.id)
    }
  }
  return newlyUnlocked
}
