/**
 * Space Factory Idle — Upgrades, employees, and planet unlock system
 */

import { calcCost } from './constants'
import type { GameState, ProductionLineState } from './game-state'

/* ── Upgrade Data ───────────────────────────────────────────────── */

interface UpgradeData {
  id: string
  name: string
  description: string
  baseCost: number
  costMultiplier: number
  maxLevel: number
  effect: string
}

const UPGRADES: Record<string, UpgradeData> = {
  'line-speed': { id: 'line-speed', name: 'Line Speed', description: '+10% production speed per level', baseCost: 100, costMultiplier: 1.15, maxLevel: 50, effect: 'speed' },
  'quality-boost': { id: 'quality-boost', name: 'Quality Boost', description: '+25% output quality per level', baseCost: 200, costMultiplier: 1.2, maxLevel: 30, effect: 'quality' },
  'coin-mult': { id: 'coin-mult', name: 'Coin Multiplier', description: '+50% coin earnings per level', baseCost: 500, costMultiplier: 1.3, maxLevel: 20, effect: 'coins' },
  'combo-boost': { id: 'combo-boost', name: 'Combo Boost', description: '+20% combo damage per level', baseCost: 150, costMultiplier: 1.15, maxLevel: 40, effect: 'combo' },
  'lucky-star': { id: 'lucky-star', name: 'Lucky Star', description: 'Increases event chance', baseCost: 300, costMultiplier: 1.25, maxLevel: 10, effect: 'luck' },
  'auto-sell': { id: 'auto-sell', name: 'Auto Sell', description: 'Automatically sell when stock is full', baseCost: 1000, costMultiplier: 1, maxLevel: 1, effect: 'auto-sell' },
  'offline-earn': { id: 'offline-earn', name: 'Offline Earnings', description: 'Earn coins while offline', baseCost: 2000, costMultiplier: 1, maxLevel: 1, effect: 'offline' },
  'line-capacity': { id: 'line-capacity', name: 'Line Capacity', description: '+1 max stock per level', baseCost: 75, costMultiplier: 1.1, maxLevel: 50, effect: 'capacity' },
  'warehouse': { id: 'warehouse', name: 'Warehouse', description: '+10 max stock for all lines', baseCost: 500, costMultiplier: 1.5, maxLevel: 10, effect: 'warehouse' },
}

/* ── Upgrade Functions ──────────────────────────────────────────── */

/**
 * Get the cost of the next upgrade level.
 */
export function getUpgradeCost(state: GameState, upgradeId: string): number {
  const data = UPGRADES[upgradeId]
  if (!data) return Infinity

  const currentLevel = state.upgrades[upgradeId] || 0
  if (currentLevel >= data.maxLevel) return Infinity

  return calcCost(data.baseCost, data.costMultiplier, currentLevel)
}

/**
 * Get current level of an upgrade.
 */
export function getUpgradeLevel(state: GameState, upgradeId: string): number {
  return state.upgrades[upgradeId] || 0
}

/**
 * Check if an upgrade is maxed out.
 */
export function isUpgradeMaxed(state: GameState, upgradeId: string): boolean {
  const data = UPGRADES[upgradeId]
  if (!data) return true // Unknown upgrade is "maxed"

  const currentLevel = state.upgrades[upgradeId] || 0
  return currentLevel >= data.maxLevel
}

/**
 * Purchase an upgrade.
 */
export function purchaseUpgrade(state: GameState, upgradeId: string): boolean {
  const data = UPGRADES[upgradeId]
  if (!data) return false

  const currentLevel = state.upgrades[upgradeId] || 0
  if (currentLevel >= data.maxLevel) return false

  const cost = getUpgradeCost(state, upgradeId)
  if (cost === Infinity) return false
  if (state.coins < cost) return false

  state.coins -= cost
  state.upgrades[upgradeId] = currentLevel + 1
  state.sessionUpgradesMade += 1

  return true
}

/* ── Employee Data ──────────────────────────────────────────────── */

interface EmployeeData {
  id: string
  name: string
  description: string
  baseCost: number
  costMultiplier: number
}

const EMPLOYEES: Record<string, EmployeeData> = {
  'intern': { id: 'intern', name: 'Intern', description: '+5% output per intern', baseCost: 50, costMultiplier: 1.15 },
  'engineer': { id: 'engineer', name: 'Engineer', description: '+10% output per engineer', baseCost: 200, costMultiplier: 1.2 },
  'director': { id: 'director', name: 'Director', description: '+20% output per director', baseCost: 1000, costMultiplier: 1.3 },
}

/* ── Employee Functions ─────────────────────────────────────────── */

/**
 * Get the cost of hiring the next employee.
 */
export function getEmployeeCost(state: GameState, employeeId: string): number {
  const data = EMPLOYEES[employeeId]
  if (!data) return Infinity

  const currentCount = state.employees[employeeId] || 0
  return calcCost(data.baseCost, data.costMultiplier, currentCount)
}

/**
 * Get current count of an employee type.
 */
export function getEmployeeCount(state: GameState, employeeId: string): number {
  return state.employees[employeeId] || 0
}

/**
 * Hire an employee.
 */
export function hireEmployee(state: GameState, employeeId: string): boolean {
  const data = EMPLOYEES[employeeId]
  if (!data) return false

  const cost = getEmployeeCost(state, employeeId)
  if (cost === Infinity) return false
  if (state.coins < cost) return false

  state.coins -= cost
  state.employees[employeeId] = (state.employees[employeeId] || 0) + 1

  return true
}

/* ── Planet Data ────────────────────────────────────────────────── */

interface PlanetData {
  id: string
  name: string
  description: string
  unlockCost: number
  index: number
  requiredDistance: number
  requiredPrestiges: number
  firstRecipe: string
}

const PLANETS: PlanetData[] = [
  { id: 'earth', name: 'Earth', description: 'Home planet', unlockCost: 1000, index: 0, requiredDistance: 0, requiredPrestiges: 0, firstRecipe: 'ore-smelt' },
  { id: 'moon', name: 'Moon', description: 'Earth\'s satellite', unlockCost: 5000, index: 1, requiredDistance: 10, requiredPrestiges: 0, firstRecipe: 'helium3' },
  { id: 'mars', name: 'Mars', description: 'The red planet', unlockCost: 25000, index: 2, requiredDistance: 50, requiredPrestiges: 0, firstRecipe: 'mars-alloy' },
  { id: 'europa', name: 'Europa', description: 'Jupiter\'s icy moon', unlockCost: 125000, index: 3, requiredDistance: 200, requiredPrestiges: 0, firstRecipe: 'ice-core' },
  { id: 'titan', name: 'Titan', description: 'Saturn\'s largest moon', unlockCost: 625000, index: 4, requiredDistance: 1000, requiredPrestiges: 0, firstRecipe: 'polymer' },
  { id: 'galactic', name: 'Galactic Core', description: 'The center of the galaxy', unlockCost: 3125000, index: 5, requiredDistance: 0, requiredPrestiges: 3, firstRecipe: 'polymer' },
]

/* ── Planet Functions ───────────────────────────────────────────── */

/**
 * Get unlock cost for a planet.
 */
export function getPlanetUnlockCost(planet: { id: string }): number {
  const data = PLANETS.find(p => p.id === planet.id)
  if (!data) return Infinity

  // Cost scales exponentially with index
  return 1000 * Math.pow(5, data.index)
}

/**
 * Check if a planet can be unlocked.
 */
export function canUnlockPlanet(
  state: GameState,
  planetId: string,
): { can: boolean; reason: string } {
  const data = PLANETS.find(p => p.id === planetId)
  if (!data) return { can: false, reason: 'Planet not found' }

  // Already unlocked?
  if (state.unlockedPlanets.includes(planetId)) {
    return { can: false, reason: 'Already unlocked' }
  }

  // Check prestige requirement
  if (data.requiredPrestiges > 0 && state.prestigeCount < data.requiredPrestiges) {
    return { can: false, reason: `Need ${data.requiredPrestiges} prestiges` }
  }

  // Check distance requirement
  if (data.requiredDistance > 0 && state.bestDistance < data.requiredDistance) {
    return { can: false, reason: `Need ${data.requiredDistance}km traveled` }
  }

  // Check cost
  const cost = getPlanetUnlockCost({ id: planetId })
  if (state.coins < cost) {
    return { can: false, reason: `Need ${cost} coins` }
  }

  return { can: true, reason: '' }
}

/**
 * Unlock a planet.
 */
export function unlockPlanet(state: GameState, planetId: string): boolean {
  const check = canUnlockPlanet(state, planetId)
  if (!check.can) return false

  const data = PLANETS.find(p => p.id === planetId)!
  const cost = getPlanetUnlockCost({ id: planetId })

  // Deduct cost
  state.coins -= cost

  // Add to unlocked planets
  state.unlockedPlanets.push(planetId)

  // Add first recipe line
  if (!state.productionLines[planetId]) {
    state.productionLines[planetId] = []
  }
  state.productionLines[planetId].push({
    recipeId: data.firstRecipe,
    level: 1,
    stock: 0,
    maxStock: 10,
    automated: false,
  })

  // Add recipe to unlocked recipes
  if (!state.unlockedRecipes.includes(data.firstRecipe)) {
    state.unlockedRecipes.push(data.firstRecipe)
  }

  return true
}
