/**
 * Idle Garden Tycoon — Game State Management
 * Handles state creation, serialization, offline earnings, and play time tracking.
 */

import type { GameState } from '../data/types'
import { CONSTANTS, calcGrowthProgress } from '../data/constants'
import { createDefaultPots } from './GardenSystem'
import { calcIncomePerSecond } from './CurrencySystem'
import { getFlowerById } from '../data/flowers'

const SAVE_KEY = CONSTANTS.SAVE_KEY

/**
 * Create a fresh default game state.
 */
export function createDefaultState(): GameState {
  return {
    coins: 0,
    totalCoins: 0,
    sunPoints: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    spGrowthUpgrades: 0,
    spPriceUpgrades: 0,
    pots: createDefaultPots(),
    gardenLevel: 1,
    level: 1,
    experience: 0,
    unlockedFlowers: ['sunflower'],
    upgrades: {},
    decorations: [],
    achievements: [],
    dailyChallenge: null,
    stats: {
      totalCoinsEarned: 0,
      totalFlowersGrown: 0,
      totalHarvests: 0,
      totalPlayTime: 0,
      maxComboCount: 0,
    },
    lastOnline: Date.now(),
    sessionStart: Date.now(),
    lastHarvestTime: 0,
    comboCount: 0,
  }
}

/**
 * Save game state to localStorage.
 */
export function saveState(state: GameState): void {
  if (typeof localStorage === 'undefined') return
  const toSave = { ...state, lastOnline: Date.now() }
  localStorage.setItem(SAVE_KEY, JSON.stringify(toSave))
}

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
 * Reset state to default and clear localStorage.
 */
export function resetState(): GameState {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SAVE_KEY)
  }
  return createDefaultState()
}

/**
 * Calculate offline earnings based on auto-harvest income and time away.
 * Requires offline-earn upgrade. Caps at MAX_OFFLINE_HOURS.
 * Minimum 10 seconds offline to earn anything.
 */
export function calculateOfflineEarnings(state: GameState): number {
  const offlineLevel = state.upgrades['offline-earn'] || 0
  if (offlineLevel <= 0) return 0

  const now = Date.now()
  const offlineMs = now - state.lastOnline
  const offlineSeconds = Math.max(0, offlineMs / 1000)

  if (offlineSeconds < 10) return 0

  const maxSeconds = CONSTANTS.MAX_OFFLINE_HOURS * 3600
  const cappedSeconds = Math.min(offlineSeconds, maxSeconds)

  // Income per second from auto-harvest
  const incomePerSec = calcIncomePerSecond(state)

  // Apply offline efficiency (50%)
  return Math.floor(incomePerSec * cappedSeconds * CONSTANTS.OFFLINE_EFFICIENCY)
}

/**
 * Track play time. Call each tick to accumulate totalPlayTime.
 */
export function trackPlayTime(state: GameState, deltaMs: number): void {
  state.stats.totalPlayTime += deltaMs / 1000
}

/**
 * Update isReady flags for all pots based on current time.
 */
export function updateGrowthStates(state: GameState, now: number): void {
  const growthSpeedLevel = state.upgrades['growth-speed'] || 0
  const growthMult = 1 + state.spGrowthUpgrades * CONSTANTS.SP_GROWTH_BOOST + growthSpeedLevel * CONSTANTS.GROWTH_SPEED_PER_LEVEL

  for (const pot of state.pots) {
    if (pot.flowerId && !pot.isReady) {
      const flower = getFlowerById(pot.flowerId)
      if (!flower) continue
      const elapsed = (now - pot.plantedAt) / 1000
      const progress = calcGrowthProgress(elapsed, flower.growTime, pot.isWatered, growthMult)
      if (progress >= 1) {
        pot.isReady = true
      }
    }
  }
}

/**
 * Serialize state to JSON string.
 */
export function serializeState(state: GameState): string {
  return JSON.stringify(state)
}

/**
 * Deserialize state from JSON string.
 * Falls back to default state if invalid.
 */
export function deserializeState(json: string | null): GameState {
  if (!json) return createDefaultState()
  try {
    const parsed = JSON.parse(json) as Partial<GameState>
    return { ...createDefaultState(), ...parsed }
  } catch {
    return createDefaultState()
  }
}
