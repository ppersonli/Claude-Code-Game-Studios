/**
 * Space Factory Idle — Game state management
 * Handles state creation, serialization, offline income, and play time tracking.
 */

import { CONSTANTS, calcCost, calcPrestigeStardust, calcPrestigeThreshold, calcOutput, calcInflation } from './constants'
import { RECIPES, getRecipesForPlanet } from '../data/recipes'
import { PLANETS } from '../data/planets'

/* ── Types ──────────────────────────────────────────────────────── */

export interface ProductionLineState {
  recipeId: string
  level: number
  stock: number
  maxStock: number
  automated: boolean
}

export interface GameState {
  // Currency
  coins: number
  totalCoins: number
  starDust: number

  // Prestige
  prestigeLevel: number
  prestigeCount: number
  prestigeMult: number

  // Factory level (design doc: +10% all production per level)
  factoryLevel: number

  // Production lines per planet
  productionLines: Record<string, ProductionLineState[]>

  // Upgrades (upgrade_id -> level)
  upgrades: Record<string, number>

  // Employees (employee_id -> count)
  employees: Record<string, number>

  // Planets & recipes
  unlockedPlanets: string[]
  unlockedRecipes: string[]

  // Stats
  totalProduced: number
  bestDistance: number

  // Achievements
  achievements: string[]

  // Daily challenge
  lastDailyCompleted: string
  dailyStreak: number

  // Session tracking
  lastOnline: number
  sessionStart: number
  sessionCoinsEarned: number
  sessionItemsProduced: number
  sessionUpgradesMade: number
  totalPlayTime: number // seconds

  // Events
  activeEvent: string | null
  eventEndTime: number
}

/* ── Default State ──────────────────────────────────────────────── */

const SAVE_KEY = CONSTANTS.SAVE_KEY

export function createDefaultState(): GameState {
  return {
    coins: 0,
    totalCoins: 0,
    starDust: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    prestigeMult: 1,
    factoryLevel: 1,
    productionLines: {
      earth: [
        { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false },
      ],
    },
    upgrades: {},
    employees: {},
    unlockedPlanets: ['earth'],
    unlockedRecipes: ['ore-smelt'],
    totalProduced: 0,
    bestDistance: 0,
    achievements: [],
    lastDailyCompleted: '',
    dailyStreak: 0,
    lastOnline: Date.now(),
    sessionStart: Date.now(),
    activeEvent: null,
    eventEndTime: 0,
    sessionCoinsEarned: 0,
    sessionItemsProduced: 0,
    sessionUpgradesMade: 0,
    totalPlayTime: 0,
  }
}

/* ── Load / Save ────────────────────────────────────────────────── */

/**
 * Load game state from localStorage.
 * Falls back to default state if no save exists or save is corrupted.
 */
export function loadState(): GameState {
  if (typeof localStorage === 'undefined') return createDefaultState()

  const json = localStorage.getItem(SAVE_KEY)
  if (!json) return createDefaultState()

  try {
    const parsed = JSON.parse(json) as Partial<GameState>
    return { ...createDefaultState(), ...parsed }
  } catch {
    return createDefaultState()
  }
}

/**
 * Save game state to localStorage.
 * Updates lastOnline timestamp.
 */
export function saveState(state: GameState): void {
  if (typeof localStorage === 'undefined') return
  const toSave = { ...state, lastOnline: Date.now() }
  localStorage.setItem(SAVE_KEY, JSON.stringify(toSave))
}

/**
 * Reset state to default values (prestige keeps stardust but this is a full reset).
 */
export function resetState(): GameState {
  const fresh = createDefaultState()
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SAVE_KEY)
  }
  return fresh
}

/* ── Offline Earnings ───────────────────────────────────────────── */

/**
 * Calculate offline earnings when player returns.
 * Requires the 'offline-earn' upgrade to be purchased.
 * Uses 50% efficiency and caps at MAX_OFFLINE_HOURS.
 */
export function calculateOfflineEarnings(state: GameState): number {
  // Must have offline-earn upgrade
  if (!state.upgrades['offline-earn'] || state.upgrades['offline-earn'] <= 0) return 0

  // Calculate time offline
  const now = Date.now()
  const offlineMs = now - state.lastOnline
  const offlineSeconds = Math.max(0, offlineMs / 1000)

  // Minimum 10 seconds offline to earn anything
  if (offlineSeconds < 10) return 0

  // Cap at max offline hours
  const maxSeconds = CONSTANTS.MAX_OFFLINE_HOURS * 3600
  const cappedSeconds = Math.min(offlineSeconds, maxSeconds)
  const offlineMinutes = cappedSeconds / 60

  // Calculate base output per minute
  const outputPerSec = calcTotalOutputPerSec(state)
  const outputPerMinute = outputPerSec * 60

  // Apply offline efficiency
  return Math.floor(outputPerMinute * offlineMinutes * CONSTANTS.OFFLINE_EFFICIENCY)
}

/**
 * Calculate total output per second across all production lines.
 */
export function calcTotalOutputPerSec(state: GameState): number {
  let total = 0

  for (const [planetId, lines] of Object.entries(state.productionLines)) {
    const planet = PLANETS.find(p => p.id === planetId)
    if (!planet) continue

    for (const line of lines) {
      const recipe = RECIPES.find(r => r.id === line.recipeId)
      if (!recipe) continue

      const output = calcOutput(
        recipe.baseOutput,
        line.level,
        1, // upgradeMult (simplified)
        planet.specialBonus,
        state.prestigeMult,
        state.factoryLevel, // BUG FIX: was hardcoded to 1
      )
      total += output
    }
  }

  return total
}

/* ── Play Time Tracking ─────────────────────────────────────────── */

/**
 * Track play time. Call each tick to accumulate totalPlayTime.
 * @param state - Game state to update
 * @param deltaMs - Milliseconds since last tick (converted to seconds)
 */
export function trackPlayTime(state: GameState, deltaMs: number): void {
  state.totalPlayTime += deltaMs / 1000
}

/* ── Legacy Functions (backward compatibility with old tests) ───── */

/**
 * Create initial state with OLD interface (for backward compatibility).
 * @deprecated Use createDefaultState() instead
 */
export function createInitialState(): {
  coins: number
  stardust: number
  factoryLevel: number
  workers: number
  workerSpeed: number
  unlockedRecipes: string[]
  activeRecipes: string[]
  unlockedPlanets: string[]
  currentPlanet: string
  prestigeCount: number
  totalCoinsEarned: number
  lastSave: number
  totalPlayTime: number
} {
  return {
    coins: 0,
    stardust: 0,
    factoryLevel: 1,
    workers: 1,
    workerSpeed: 1,
    unlockedRecipes: ['electronic-components'],
    activeRecipes: ['electronic-components'],
    unlockedPlanets: ['earth'],
    currentPlanet: 'earth',
    prestigeCount: 0,
    totalCoinsEarned: 0,
    lastSave: Date.now(),
    totalPlayTime: 0,
  }
}

/** Calculate offline income (50% efficiency) — legacy function */
export function calcOfflineIncome(
  baseIncome: number,
  offlineSeconds: number,
  maxOfflineSeconds: number = 8 * 3600,
): number {
  const capped = Math.min(offlineSeconds, maxOfflineSeconds)
  const minutes = capped / 60
  const inflation = 1 / (1 + 0.005 * minutes)
  return baseIncome * minutes * 0.5 * inflation
}

/** Calculate time elapsed since last save (in seconds) — legacy function */
export function calcOfflineTime(lastSave: number): number {
  const now = Date.now()
  return Math.max(0, (now - lastSave) / 1000)
}

/* ── Serialization ──────────────────────────────────────────────── */

export function serializeState(state: GameState): string {
  return JSON.stringify(state)
}

export function deserializeState(json: string | null): GameState {
  if (!json) return createDefaultState()
  try {
    const parsed = JSON.parse(json) as Partial<GameState>
    return { ...createDefaultState(), ...parsed }
  } catch {
    return createDefaultState()
  }
}
