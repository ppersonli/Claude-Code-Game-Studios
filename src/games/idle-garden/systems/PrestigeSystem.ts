/**
 * Idle Garden Tycoon — Prestige System
 * Handles prestige checks, execution, sun point upgrades, and permanent bonuses.
 */

import type { GameState } from '../data/types'
import { CONSTANTS, calcSunPoints, calcPrestigeThreshold } from '../data/constants'
import { createDefaultPots } from './GardenSystem'

/**
 * Check if the player can prestige.
 * Requires totalCoins >= prestige threshold for current level.
 */
export function canPrestige(state: GameState): boolean {
  const threshold = calcPrestigeThreshold(state.prestigeLevel)
  return state.totalCoins >= threshold
}

/**
 * Get the coin requirement for a given prestige level.
 */
export function getPrestigeRequirement(prestigeLevel: number): number {
  return calcPrestigeThreshold(prestigeLevel)
}

/**
 * Calculate how many sun points would be earned from prestige.
 */
export function calcEarnableSunPoints(totalCoins: number): number {
  return calcSunPoints(totalCoins)
}

/**
 * Perform a prestige reset.
 * Returns sun points earned (0 if cannot prestige).
 *
 * Resets: coins, totalCoins, pots, gardenLevel, upgrades, unlockedFlowers (back to sunflower), level, experience
 * Preserves: sunPoints (accumulated), prestigeLevel, prestigeCount, spGrowthUpgrades, spPriceUpgrades, stats.totalCoinsEarned
 */
export function performPrestige(state: GameState): number {
  if (!canPrestige(state)) return 0

  const earned = calcEarnableSunPoints(state.totalCoins)
  if (earned <= 0) return 0

  // Award sun points
  state.sunPoints += earned

  // Increment prestige
  state.prestigeLevel += 1
  state.prestigeCount += 1

  // Reset currency
  state.coins = 0
  state.totalCoins = 0

  // Reset garden
  state.pots = createDefaultPots()
  state.gardenLevel = 1

  // Reset upgrades
  state.upgrades = {}

  // Reset unlocked flowers to just sunflower
  state.unlockedFlowers = ['sunflower']

  // Reset player level
  state.level = 1
  state.experience = 0

  // Reset combo
  state.lastHarvestTime = 0
  state.comboCount = 0

  // Preserved: sunPoints, prestigeLevel, prestigeCount, spGrowthUpgrades, spPriceUpgrades, stats

  return earned
}

/**
 * Buy a sun point upgrade (growth or price).
 * Each purchase costs 1 sun point and increases the respective bonus.
 * Returns false if: no sun points or at max upgrades.
 */
export function buySunPointUpgrade(state: GameState, type: 'growth' | 'price'): boolean {
  if (state.sunPoints <= 0) return false

  if (type === 'growth') {
    if (state.spGrowthUpgrades >= CONSTANTS.SP_MAX_UPGRADES) return false
    state.sunPoints -= 1
    state.spGrowthUpgrades += 1
  } else {
    if (state.spPriceUpgrades >= CONSTANTS.SP_MAX_UPGRADES) return false
    state.sunPoints -= 1
    state.spPriceUpgrades += 1
  }

  return true
}

/**
 * Get growth bonus percentage from sun point upgrades.
 */
export function getGrowthBonusPercent(spGrowthUpgrades: number): number {
  return spGrowthUpgrades * CONSTANTS.SP_GROWTH_BOOST * 100
}

/**
 * Get price bonus percentage from sun point upgrades.
 */
export function getPriceBonusPercent(spPriceUpgrades: number): number {
  return spPriceUpgrades * CONSTANTS.SP_PRICE_BOOST * 100
}
