/** Farming logic — plant, grow, harvest */

import type { GameState, CropSlot } from './game-state'
import { getCropById, type Crop } from '../data/crops'
import { CONSTANTS } from '../data/constants'
import { WEATHERS } from '../data/weather'

export const MAX_SLOTS = 6

export function plantCrop(state: GameState, cropId: string): CropSlot | null {
  if (state.cropSlots.length >= MAX_SLOTS) return null

  const crop = getCropById(cropId)
  if (!crop) return null
  if (!state.unlockedCrops.includes(cropId)) return null

  const slot: CropSlot = {
    cropId,
    plantedAt: Date.now(),
    growTimeMs: crop.growTimeSeconds * 1000,
    harvested: false,
  }
  state.cropSlots.push(slot)
  return slot
}

export function getGrowthProgress(slot: CropSlot): number {
  const elapsed = Date.now() - slot.plantedAt
  return Math.min(elapsed / slot.growTimeMs, 1)
}

export function isFullyGrown(slot: CropSlot): boolean {
  return getGrowthProgress(slot) >= 1
}

export function harvestCrop(state: GameState, slotIndex: number): number {
  const slot = state.cropSlots[slotIndex]
  if (!slot || slot.harvested) return 0

  const crop = getCropById(slot.cropId)
  if (!crop) return 0

  const progress = getGrowthProgress(slot)
  const farmMult = 1 + (state.farmLevel - 1) * 0.5
  const coinMult = 1 + (state.upgrades['coin-mult'] || 0) * 0.25

  // Perfect harvest (>=100%) = 1.5x bonus
  const progressMult = progress >= 1
    ? CONSTANTS.PERFECT_HARVEST_BONUS
    : CONSTANTS.EARLY_HARVEST_PENALTY + progress * 0.5

  const weatherMult = getWeatherMultiplierForHarvest(state)
  const prestigeMult = state.prestigeBonus

  const value = Math.floor(
    crop.baseValue * farmMult * coinMult * progressMult * weatherMult * prestigeMult
  )

  slot.harvested = true
  state.coins += value
  state.totalCoins += value
  state.totalHarvests++

  // Remove harvested slot
  state.cropSlots.splice(slotIndex, 1)

  return value
}

function getWeatherMultiplierForHarvest(state: GameState): number {
  const weather = WEATHERS.find(w => w.type === state.currentWeather)
  if (!weather) return 1

  // Blackhole: next harvest is worth 3x, then weather clears
  if (state.currentWeather === 'blackhole') {
    state.currentWeather = 'clear'
    return weather.multiplier
  }

  if (state.currentWeather === 'meteor_shower') {
    const shieldLevel = state.upgrades['weather-shield'] || 0
    return 1 + (weather.multiplier - 1) * (1 - shieldLevel * 0.15)
  }

  return weather.multiplier
}

export function autoHarvestTick(state: GameState): number {
  const autoLevel = state.upgrades['auto-harvest'] || 0
  if (autoLevel === 0) return 0

  const harvestChance = getAutoHarvestChance(autoLevel)
  let totalEarned = 0

  // Check each slot (iterate backwards since we splice)
  for (let i = state.cropSlots.length - 1; i >= 0; i--) {
    const slot = state.cropSlots[i]
    if (isFullyGrown(slot) && Math.random() < harvestChance) {
      totalEarned += harvestCrop(state, i)
    }
  }

  return totalEarned
}

export function getAutoHarvestChance(level: number): number {
  switch (level) {
    case 1: return 0.10
    case 2: return 0.30
    case 3: return 0.60
    case 4: return 1.0
    default: return 0
  }
}

export function autoPlantTick(state: GameState, cropId: string): boolean {
  const autoLevel = state.upgrades['auto-plant'] || 0
  if (autoLevel === 0) return false
  if (state.cropSlots.length >= MAX_SLOTS) return false

  const plantChance = getAutoPlantChance(autoLevel)
  if (Math.random() < plantChance) {
    plantCrop(state, cropId)
    return true
  }
  return false
}

export function getAutoPlantChance(level: number): number {
  switch (level) {
    case 1: return 0
    case 2: return 0.30
    case 3: return 0.60
    case 4: return 1.0
    default: return 0
  }
}
