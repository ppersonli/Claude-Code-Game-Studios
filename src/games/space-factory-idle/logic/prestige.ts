/**
 * Space Factory Idle — Prestige system
 * Handles stardust calculation, prestige reset logic, and unlock costs.
 */

import { CONSTANTS, calcPrestigeStardust, calcPrestigeThreshold } from './constants'
import type { GameState, ProductionLineState } from './game-state'
import { PLANETS } from '../data/planets'

/* ── Prestige Check Functions ───────────────────────────────────── */

/**
 * Check if the player can prestige.
 * Requires totalCoins >= prestige threshold for current level.
 */
export function canPrestige(state: GameState): boolean {
  const threshold = calcPrestigeThreshold(state.prestigeLevel)
  return state.totalCoins >= threshold
}

/**
 * Get the coin requirement for the next prestige.
 */
export function getPrestigeRequirement(state: GameState): number {
  return calcPrestigeThreshold(state.prestigeLevel)
}

/**
 * Calculate how much stardust would be earned from a prestige.
 */
export function calcEarnableStardust(state: GameState): number {
  return calcPrestigeStardust(state.totalCoins)
}

/* ── Prestige Execution ─────────────────────────────────────────── */

/**
 * Perform a prestige reset.
 * Returns the amount of stardust earned (0 if cannot prestige).
 *
 * What gets reset:
 * - coins, totalCoins
 * - production lines (back to single ore-smelt line on earth)
 * - upgrades, employees
 * - unlocked planets (back to earth only)
 * - unlocked recipes (back to ore-smelt only)
 * - totalProduced, session stats
 * - totalPlayTime (inflation reset)
 *
 * What is preserved:
 * - starDust (accumulated)
 * - prestigeLevel, prestigeCount, prestigeMult
 * - achievements
 * - bestDistance
 * - dailyStreak, lastDailyCompleted
 */
export function performPrestige(state: GameState): number {
  // Check if can prestige
  if (!canPrestige(state)) return 0

  // Calculate stardust earned
  const earned = calcEarnableStardust(state)
  if (earned <= 0) return 0

  // Add stardust
  state.starDust += earned

  // Increment prestige level and count
  state.prestigeLevel += 1
  state.prestigeCount += 1

  // Calculate new prestige multiplier: 1 + starDust * 0.1
  state.prestigeMult = 1 + state.starDust * 0.1

  // Reset currency
  state.coins = 0
  state.totalCoins = 0

  // Reset production lines to default
  state.productionLines = {
    earth: [
      { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false },
    ],
  }

  // Reset upgrades and employees
  state.upgrades = {}
  state.employees = {}

  // Reset unlocked planets to earth only
  state.unlockedPlanets = ['earth']

  // Reset unlocked recipes to ore-smelt only
  state.unlockedRecipes = ['ore-smelt']

  // Reset stats
  state.totalProduced = 0
  state.sessionCoinsEarned = 0
  state.sessionItemsProduced = 0
  state.sessionUpgradesMade = 0

  // Reset play time (inflation reset)
  state.totalPlayTime = 0

  return earned
}

/* ── Legacy Functions (kept for backward compatibility) ─────────── */

/** Stardust earned from prestige: sqrt(totalCoins / 1_000_000) */
export function calcStardustGain(totalCoinsEarned: number): number {
  if (totalCoinsEarned < 1_000_000) return 0
  return Math.floor(Math.sqrt(totalCoinsEarned / 1_000_000))
}

/** Stardust cost to unlock a planet by index (0=earth, 1=moon, etc.) */
export const PLANET_COSTS: number[] = [0, 100, 1000, 10_000, 100_000]

export function canUnlockPlanetLegacy(stardust: number, planetIndex: number): boolean {
  if (planetIndex < 0 || planetIndex >= PLANET_COSTS.length) return false
  return stardust >= PLANET_COSTS[planetIndex]
}

/** Alias for backward compatibility with old tests */
export const canUnlockPlanet = canUnlockPlanetLegacy

/** Upgrade cost formula: base × 1.12^level */
export function calcUpgradeCost(baseCost: number, level: number): number {
  return Math.floor(baseCost * Math.pow(1.12, level))
}

/** Worker speed bonus per level: +10% */
export function calcWorkerSpeed(baseSpeed: number, level: number): number {
  return baseSpeed * (1 + 0.1 * level)
}

/** Factory level production multiplier */
export function calcFactoryMultiplier(level: number): number {
  if (level <= 1) return 1
  if (level === 2) return 1.5
  return 1.5 + (level - 2) * 0.5
}
