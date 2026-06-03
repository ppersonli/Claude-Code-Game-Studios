/** Game state management — save/load with forward-compatible merging */

import { CONSTANTS } from '../data/constants'
import { CROPS, getCropById } from '../data/crops'
import { PLANETS } from '../data/planets'
import { UPGRADES, getUpgradeCost } from '../data/upgrades'
import { WEATHERS, rollWeather, type WeatherType } from '../data/weather'

export interface CropSlot {
  cropId: string
  plantedAt: number        // timestamp ms
  growTimeMs: number       // total grow time
  harvested: boolean
}

export interface GameState {
  coins: number
  totalCoins: number        // lifetime coins (for prestige calc)
  cosmicSeeds: number

  farmLevel: number
  workers: number
  workerSpeed: number       // 0..1

  unlockedCrops: string[]
  cropSlots: CropSlot[]     // current planet's active crop slots (max 6)

  unlockedPlanets: string[]
  currentPlanet: string

  currentWeather: WeatherType
  weatherTimer: number      // seconds until weather changes

  prestigeCount: number
  prestigeBonus: number     // 1 + cosmicSeeds/100 * 0.10

  upgrades: Record<string, number>  // upgradeId -> level

  totalHarvests: number
  lastOnline: number
  totalPlayTime: number
}

const DEFAULT_STATE: GameState = {
  coins: 0,
  totalCoins: 0,
  cosmicSeeds: 0,
  farmLevel: 1,
  workers: 0,
  workerSpeed: 0,
  unlockedCrops: ['wheat'],
  cropSlots: [],
  unlockedPlanets: ['earth'],
  currentPlanet: 'earth',
  currentWeather: 'clear',
  weatherTimer: CONSTANTS.WEATHER_CHANGE_INTERVAL,
  prestigeCount: 0,
  prestigeBonus: 1,
  upgrades: {},
  totalHarvests: 0,
  lastOnline: Date.now(),
  totalPlayTime: 0,
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(CONSTANTS.SAVE_KEY)
    if (!raw) return freshState()
    const saved = JSON.parse(raw) as Partial<GameState>
    return mergeDefaults(saved)
  } catch {
    return freshState()
  }
}

function freshState(): GameState {
  return { ...DEFAULT_STATE, lastOnline: Date.now() }
}

function mergeDefaults(saved: Partial<GameState>): GameState {
  return {
    ...DEFAULT_STATE,
    ...saved,
    unlockedCrops: saved.unlockedCrops || DEFAULT_STATE.unlockedCrops,
    cropSlots: saved.cropSlots || [],
    unlockedPlanets: saved.unlockedPlanets || ['earth'],
    upgrades: saved.upgrades || {},
    lastOnline: saved.lastOnline || Date.now(),
  }
}

export function saveState(state: GameState): void {
  state.lastOnline = Date.now()
  localStorage.setItem(CONSTANTS.SAVE_KEY, JSON.stringify(state))
}

export function resetState(): GameState {
  const fresh = freshState()
  saveState(fresh)
  return fresh
}

export function calculateOfflineEarnings(state: GameState): number {
  const now = Date.now()
  const secondsOff = Math.min(
    (now - state.lastOnline) / 1000,
    CONSTANTS.MAX_OFFLINE_HOURS * 3600,
  )
  if (secondsOff < 10) return 0

  const baseIncome = calcBaseIncome(state)
  return Math.floor(baseIncome * secondsOff * CONSTANTS.OFFLINE_EFFICIENCY)
}

export function calcBaseIncome(state: GameState): number {
  let total = 0
  const planetCrops = CROPS.filter(c => c.planetId === state.currentPlanet)
  const cropCount = Math.min(state.cropSlots.length, 6)

  for (const crop of planetCrops) {
    const value = crop.baseValue
    const farmMult = 1 + (state.farmLevel - 1) * 0.5
    const upgradeMult = getUpgradeMultiplier(state)
    const prestigeMult = state.prestigeBonus
    total += value * farmMult * upgradeMult * prestigeMult * cropCount * 0.1
  }
  return total
}

export function getUpgradeMultiplier(state: GameState): number {
  const coinLevel = state.upgrades['coin-mult'] || 0
  return 1 + coinLevel * 0.25
}

export function getWeatherMultiplier(state: GameState): number {
  const weather = WEATHERS.find(w => w.type === state.currentWeather)
  if (!weather) return 1

  if (state.currentWeather === 'meteor_shower') {
    const shieldLevel = state.upgrades['weather-shield'] || 0
    return 1 + (weather.multiplier - 1) * (1 - shieldLevel * 0.15)
  }
  return weather.multiplier
}

export function tickWeather(state: GameState, deltaSeconds: number): boolean {
  state.weatherTimer -= deltaSeconds
  if (state.weatherTimer <= 0) {
    const newWeather = rollWeather()
    state.currentWeather = newWeather.type
    state.weatherTimer = CONSTANTS.WEATHER_CHANGE_INTERVAL
    return true
  }
  return false
}

export function trackPlayTime(state: GameState, deltaMs: number): void {
  state.totalPlayTime += deltaMs / 1000
}
