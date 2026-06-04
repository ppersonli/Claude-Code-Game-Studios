/**
 * Space Factory Idle — Production logic
 * Handles production ticks, selling, upgrading lines, and automation.
 */

import { calcCost, CONSTANTS } from './constants'
import type { GameState, ProductionLineState } from './game-state'
import { PLANETS } from '../data/planets'
import { RECIPES as RECIPE_ARRAY, type Recipe } from '../data/recipes'
import { getEventOutputMult } from './events'

/* ── Recipe Lookup ──────────────────────────────────────────────── */

const RECIPES: Record<string, Recipe> = Object.fromEntries(
  RECIPE_ARRAY.map(r => [r.id, r]),
)

const PLANET_MAX_LINES: Record<string, number> = (() => {
  const result: Record<string, number> = {}
  for (const planet of PLANETS) {
    result[planet.id] = planet.productionLines
  }
  return result
})()

/* ── Production Tick ────────────────────────────────────────────── */

/**
 * Process one production tick: produce items on all active lines.
 * Returns total coins earned from auto-sell.
 */
export function processProductionTick(state: GameState): number {
  let totalEarned = 0
  
  for (const [planetId, lines] of Object.entries(state.productionLines)) {
    // Produce on all planets that have production lines
    for (const line of lines) {
      const recipe = RECIPES[line.recipeId]
      if (!recipe) continue // Unknown recipe

      // Calculate multipliers
      const speedMult = 1 + (state.upgrades['line-speed'] || 0) * 0.1
      const qualityMult = 1 + (state.upgrades['quality-boost'] || 0) * 0.25
      const engineerBonus = 1 + (state.employees['engineer'] || 0) * 0.1
      const directorBonus = 1 + (state.employees['director'] || 0) * 0.2
      const prestigeMult = state.prestigeMult

      // Apply event output multiplier
      const eventMult = getEventOutputMult(state)

      // Produce items with all multipliers applied
      const baseOutput = recipe.baseOutput * (1 + (line.level - 1) * 0.5)
      const produceAmount = Math.max(1, Math.floor(
        baseOutput * speedMult * qualityMult * engineerBonus * directorBonus * prestigeMult * eventMult
      ))

      // Check if stock is full
      if (line.stock >= line.maxStock) {
        // Auto-sell if upgrade is active
        if (state.upgrades['auto-sell'] && state.upgrades['auto-sell'] > 0) {
          const coins = sellLine(state, line, planetId)
          state.coins += coins
          state.totalCoins += coins
          state.sessionCoinsEarned += coins
          totalEarned += coins
        }
        continue
      }

      // Add to stock
      const newStock = Math.min(line.stock + produceAmount, line.maxStock)
      const produced = newStock - line.stock
      line.stock = newStock
      state.totalProduced += produced
      state.sessionItemsProduced += produced
    }
  }
  
  return totalEarned
}

/**
 * Click to produce on a specific line.
 * Returns coins earned from overflow (if any).
 */
export function clickProduce(state: GameState, planetId: string, lineIndex: number): number {
  // Validate planet
  const lines = state.productionLines[planetId]
  if (!lines) return 0

  // Validate line index
  if (lineIndex < 0 || lineIndex >= lines.length) return 0

  const line = lines[lineIndex]
  const recipe = RECIPES[line.recipeId]
  if (!recipe) return 0

  // Produce items
  const produceAmount = Math.max(1, Math.floor(recipe.baseOutput * (1 + (line.level - 1) * 0.5)))

  let coinsEarned = 0

  // Check if stock is full — auto-sell overflow
  if (line.stock >= line.maxStock) {
    coinsEarned = sellLine(state, line, planetId)
    state.coins += coinsEarned
    state.totalCoins += coinsEarned
    state.sessionCoinsEarned += coinsEarned
    // Don't add more stock, it's already full
  } else {
    // Add to stock
    const newStock = Math.min(line.stock + produceAmount, line.maxStock)
    const produced = newStock - line.stock
    line.stock = newStock
    state.totalProduced += produced
    state.sessionItemsProduced += produced
  }

  return coinsEarned
}

/**
 * Sell all stock from a specific line.
 */
export function sellStock(state: GameState, planetId: string, lineIndex: number): number {
  const lines = state.productionLines[planetId]
  if (!lines) return 0
  if (lineIndex < 0 || lineIndex >= lines.length) return 0

  const line = lines[lineIndex]
  if (line.stock <= 0) return 0

  const coins = sellLine(state, line, planetId)
  state.coins += coins
  state.totalCoins += coins
  state.sessionCoinsEarned += coins
  line.stock = 0

  return coins
}

/* ── Line Upgrades ──────────────────────────────────────────────── */

/**
 * Get upgrade cost for a production line.
 */
export function getLineUpgradeCost(line: ProductionLineState): number {
  const recipe = RECIPES[line.recipeId]
  if (!recipe) return Infinity
  return calcCost(50, recipe.costMultiplier, line.level)
}

/**
 * Calculate max stock for a production line.
 */
export function calcLineMaxStock(state: GameState, line: ProductionLineState): number {
  const baseCapacity = 10
  const levelBonus = line.level * 2
  const lineCapacityBonus = state.upgrades['line-capacity'] || 0
  const warehouseBonus = (state.upgrades['warehouse'] || 0) * 10

  return baseCapacity + levelBonus + lineCapacityBonus + warehouseBonus
}

/**
 * Upgrade a production line.
 */
export function upgradeLine(state: GameState, planetId: string, lineIndex: number): boolean {
  const lines = state.productionLines[planetId]
  if (!lines) return false
  if (lineIndex < 0 || lineIndex >= lines.length) return false

  const line = lines[lineIndex]
  const cost = getLineUpgradeCost(line)
  if (cost === Infinity) return false
  if (state.coins < cost) return false

  state.coins -= cost
  line.level += 1
  line.maxStock = calcLineMaxStock(state, line)
  state.sessionUpgradesMade += 1

  return true
}

/* ── Add Production Line ────────────────────────────────────────── */

/**
 * Get cost for adding a new production line.
 */
export function getNewLineCost(planetId: string, recipeIndex: number): number {
  const planetRecipes = Object.values(RECIPES).filter(r => r.planetId === planetId)
  if (recipeIndex < 0 || recipeIndex >= planetRecipes.length) return Infinity
  return planetRecipes[recipeIndex].baseCost
}

/**
 * Add a new production line to a planet.
 */
export function addProductionLine(
  state: GameState,
  planetId: string,
  recipeId: string,
): boolean {
  // Validate planet
  if (!state.unlockedPlanets.includes(planetId)) return false

  // Validate recipe
  const recipe = RECIPES[recipeId]
  if (!recipe) return false
  if (recipe.planetId !== planetId) return false

  // Check max lines
  const maxLines = PLANET_MAX_LINES[planetId] || 3
  const currentLines = state.productionLines[planetId] || []
  if (currentLines.length >= maxLines) return false

  // Check cost
  if (state.coins < recipe.baseCost) return false

  // Deduct cost
  state.coins -= recipe.baseCost

  // Create planet entry if not existing
  if (!state.productionLines[planetId]) {
    state.productionLines[planetId] = []
  }

  // Add line
  state.productionLines[planetId].push({
    recipeId,
    level: 1,
    stock: 0,
    maxStock: 10,
    automated: false,
  })

  // Add recipe to unlocked recipes
  if (!state.unlockedRecipes.includes(recipeId)) {
    state.unlockedRecipes.push(recipeId)
  }

  return true
}

/* ── Automation ─────────────────────────────────────────────────── */

/**
 * Automate a production line (auto-produces each tick).
 */
export function automateLine(state: GameState, planetId: string, lineIndex: number): boolean {
  const lines = state.productionLines[planetId]
  if (!lines) return false
  if (lineIndex < 0 || lineIndex >= lines.length) return false

  const line = lines[lineIndex]
  if (line.automated) return false

  const cost = 1000 * (lineIndex + 1)
  if (state.coins < cost) return false

  state.coins -= cost
  line.automated = true

  return true
}

/* ── Recalculate ────────────────────────────────────────────────── */

/**
 * Recalculate maxStock for all production lines.
 */
export function recalcAllMaxStock(state: GameState): void {
  for (const lines of Object.values(state.productionLines)) {
    for (const line of lines) {
      line.maxStock = calcLineMaxStock(state, line)
    }
  }
}

/* ── Internal Helpers ───────────────────────────────────────────── */

/**
 * Calculate coins earned from selling a line's stock.
 */
function sellLine(state: GameState, line: ProductionLineState, planetId: string): number {
  const recipe = RECIPES[line.recipeId]
  if (!recipe) return 0

  const coinsPerItem = recipe.basePrice * line.level

  // Apply coin multiplier upgrade
  const coinMultLevel = state.upgrades['coin-mult'] || 0
  const coinMult = 1 + coinMultLevel * 0.5

  // Apply prestige multiplier
  const prestigeMult = state.prestigeMult

  // Apply inflation (higher inflation = lower sell price)
  const inflation = 1 + (state.totalPlayTime / 3600) * CONSTANTS.INFLATION_RATE_PER_HOUR

  return Math.floor(line.stock * coinsPerItem * coinMult * prestigeMult / inflation)
}
