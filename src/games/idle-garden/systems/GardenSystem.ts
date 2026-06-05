/**
 * Idle Garden Tycoon — Garden System
 * Handles pot management, planting, growing, harvesting, and watering.
 */

import type { GameState, PotState } from '../data/types'
import { getFlowerById, getAvailableFlowers } from '../data/flowers'
import { calcGrowthProgress, calcSellPrice, calcPriceMultiplier, CONSTANTS } from '../data/constants'
import { addCoins } from './CurrencySystem'

/**
 * Create a single empty pot.
 */
export function createPot(id: number): PotState {
  return { id, flowerId: null, plantedAt: 0, isWatered: false, isReady: false }
}

/**
 * Create the default set of pots for a new game.
 */
export function createDefaultPots(): PotState[] {
  return Array.from({ length: CONSTANTS.STARTING_POTS }, (_, i) => createPot(i))
}

/**
 * Plant a flower in a pot.
 * Deducts seed cost, sets plantedAt, marks pot as occupied.
 * Returns false if: pot occupied, insufficient coins, flower not unlocked, invalid pot.
 */
export function plantFlower(state: GameState, potId: number, flowerId: string, now: number): boolean {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot) return false
  if (pot.flowerId !== null) return false

  const flower = getFlowerById(flowerId)
  if (!flower) return false

  // Check unlock
  const available = getAvailableFlowers(state.level, state.prestigeLevel)
  if (!available.some(f => f.id === flowerId)) return false

  // Check cost
  if (state.coins < flower.seedCost) return false

  // Deduct and plant
  state.coins -= flower.seedCost
  pot.flowerId = flowerId
  pot.plantedAt = now
  pot.isWatered = false
  pot.isReady = false
  state.stats.totalFlowersGrown += 1

  return true
}

/**
 * Harvest a ready pot.
 * Returns earnings (0 if not ready or empty).
 * Updates combo tracking.
 */
export function harvestPot(state: GameState, potId: number, now: number): number {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot) return 0
  if (!pot.isReady || !pot.flowerId) return 0

  const flower = getFlowerById(pot.flowerId)
  if (!flower) return 0

  // Combo tracking
  const timeSinceLastHarvest = now - state.lastHarvestTime
  if (timeSinceLastHarvest <= CONSTANTS.COMBO_WINDOW) {
    state.comboCount += 1
  } else {
    state.comboCount = 1
  }
  state.lastHarvestTime = now

  // Calculate earnings with combo multiplier
  const comboMult = 1 + (Math.min(state.comboCount, CONSTANTS.COMBO_MAX_MULT) - 1) * 0.25
  const priceMult = calcPriceMultiplier(state.spPriceUpgrades)
  const earnings = Math.floor(calcSellPrice(flower.sellPrice, priceMult) * comboMult)

  // Add coins
  addCoins(state, earnings)

  // Clear pot
  pot.flowerId = null
  pot.plantedAt = 0
  pot.isWatered = false
  pot.isReady = false

  // Stats
  state.stats.totalHarvests += 1

  return earnings
}

/**
 * Water a pot (20% growth speed boost).
 * Returns false if: empty, already watered, invalid pot.
 */
export function waterPot(state: GameState, potId: number): boolean {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot) return false
  if (pot.flowerId === null) return false
  if (pot.isWatered) return false

  pot.isWatered = true
  return true
}

/**
 * Get growth progress for a pot (0.0 to 1.0).
 * Returns 0 for empty pots.
 */
export function getGrowthProgress(pot: PotState, now: number, growthMult: number): number {
  if (!pot.flowerId) return 0
  const flower = getFlowerById(pot.flowerId)
  if (!flower) return 0
  const elapsed = (now - pot.plantedAt) / 1000
  return calcGrowthProgress(elapsed, flower.growTime, pot.isWatered, growthMult)
}

/**
 * Check if a pot's flower is ready to harvest.
 */
export function isPotReady(pot: PotState, now: number, growthMult: number): boolean {
  return getGrowthProgress(pot, now, growthMult) >= 1
}

/**
 * Get the number of pots in the garden.
 */
export function getPotCount(state: GameState): number {
  return state.pots.length
}

/**
 * Add new pots to the garden (from upgrades).
 */
export function addPots(state: GameState, count: number): void {
  const startId = state.pots.length
  for (let i = 0; i < count; i++) {
    state.pots.push(createPot(startId + i))
  }
}

/**
 * Calculate auto-harvest yield from all ready pots.
 * Returns 0 if player has no auto-harvest upgrade.
 */
export function getAutoHarvestYield(state: GameState): number {
  const autoHarvestLevel = state.upgrades['auto-harvest'] || 0
  if (autoHarvestLevel <= 0) return 0

  const priceMult = calcPriceMultiplier(state.spPriceUpgrades)
  let total = 0

  for (const pot of state.pots) {
    if (pot.isReady && pot.flowerId) {
      const flower = getFlowerById(pot.flowerId)
      if (flower) {
        total += calcSellPrice(flower.sellPrice, priceMult)
      }
    }
  }

  return total
}

/**
 * Auto-water all pots that have flowers and are not yet watered.
 * Requires auto-water upgrade level > 0.
 * Returns the number of pots watered.
 */
export function autoWaterPots(state: GameState): number {
  const autoWaterLevel = state.upgrades['auto-water'] || 0
  if (autoWaterLevel <= 0) return 0

  let count = 0
  for (const pot of state.pots) {
    if (pot.flowerId && !pot.isWatered) {
      pot.isWatered = true
      count++
    }
  }
  return count
}
