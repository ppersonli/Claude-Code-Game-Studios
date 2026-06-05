/**
 * Idle Garden Tycoon — Currency System
 * Handles coin management: adding, spending, checking balance.
 */

import type { GameState } from '../data/types'
import { getFlowerById } from '../data/flowers'
import { calcSellPrice, calcPriceMultiplier } from '../data/constants'

/**
 * Add coins to the player's balance.
 * Updates totalCoins and stats.totalCoinsEarned.
 */
export function addCoins(state: GameState, amount: number): void {
  const floored = Math.floor(amount)
  state.coins += floored
  state.totalCoins += floored
  state.stats.totalCoinsEarned += floored
}

/**
 * Spend coins from the player's balance.
 * Returns false if insufficient funds (no state change).
 */
export function spendCoins(state: GameState, amount: number): boolean {
  const floored = Math.floor(amount)
  if (floored < 0) return false
  if (state.coins < floored) return false
  state.coins -= floored
  return true
}

/**
 * Check if the player can afford a given cost.
 */
export function canAfford(state: GameState, cost: number): boolean {
  return state.coins >= cost
}

/**
 * Get current coin balance.
 */
export function getBalance(state: GameState): number {
  return state.coins
}

/**
 * Transfer coins between two game states.
 * Returns false if source cannot afford the amount.
 */
export function transferCoins(source: GameState, target: GameState, amount: number): boolean {
  if (!spendCoins(source, amount)) return false
  addCoins(target, amount)
  return true
}

/**
 * Calculate passive income per second from auto-harvest.
 * Only counts if player has the auto-harvest upgrade.
 * Returns coins per second (for display/offline calc).
 */
export function calcIncomePerSecond(state: GameState): number {
  const autoHarvestLevel = state.upgrades['auto-harvest'] || 0
  if (autoHarvestLevel <= 0) return 0

  const priceMult = calcPriceMultiplier(state.spPriceUpgrades)
  let totalValue = 0
  let readyCount = 0

  for (const pot of state.pots) {
    if (pot.isReady && pot.flowerId) {
      const flower = getFlowerById(pot.flowerId)
      if (flower) {
        totalValue += calcSellPrice(flower.sellPrice, priceMult)
        readyCount++
      }
    }
  }

  if (readyCount === 0) return 0

  // Auto-harvest rate depends on level: level 1 = 1 harvest/60s, level 2 = 1/30s, level 3 = 1/15s
  const harvestInterval = 60 / autoHarvestLevel
  return totalValue / harvestInterval
}
