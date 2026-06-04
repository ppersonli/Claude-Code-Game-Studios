/** Prestige system — reset for Dark Energy */

import type { GameState } from './game-state'
import { calcPrestigeDarkEnergy, calcPrestigeThreshold } from './constants'

export function canPrestige(state: GameState): boolean {
  return state.totalCoins >= calcPrestigeThreshold(state.prestigeLevel)
}

export function getPrestigeRequirement(state: GameState): number {
  return calcPrestigeThreshold(state.prestigeLevel)
}

export function calcEarnableEnergy(state: GameState): number {
  return calcPrestigeDarkEnergy(state.totalCoins)
}

export function performPrestige(state: GameState): number {
  if (!canPrestige(state)) return 0

  const earned = calcEarnableEnergy(state)
  if (earned <= 0) return 0

  state.darkEnergy += earned
  state.prestigeLevel++
  state.prestigeCount++
  state.prestigeMult = 1 + state.darkEnergy * 0.1

  // Reset progress
  state.coins = 0
  state.totalCoins = 0
  state.towers = {}
  state.currentWave = 0
  state.totalKills = 0

  return earned
}
