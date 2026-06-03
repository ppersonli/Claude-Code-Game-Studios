import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  plantCrop,
  harvestCrop,
  getGrowthProgress,
  isFullyGrown,
  autoHarvestTick,
  autoPlantTick,
  getAutoHarvestChance,
  getAutoPlantChance,
  MAX_SLOTS,
} from '../../src/games/space-farm-idle/logic/farming'
import type { GameState, CropSlot } from '../../src/games/space-farm-idle/logic/game-state'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 0,
    totalCoins: 0,
    cosmicSeeds: 0,
    farmLevel: 1,
    workers: 0,
    workerSpeed: 0,
    unlockedCrops: ['wheat', 'corn'],
    cropSlots: [],
    unlockedPlanets: ['earth'],
    currentPlanet: 'earth',
    currentWeather: 'clear',
    weatherTimer: 120,
    prestigeCount: 0,
    prestigeBonus: 1,
    upgrades: {},
    totalHarvests: 0,
    lastOnline: Date.now(),
    totalPlayTime: 0,
    ...overrides,
  }
}

describe('farming', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('plantCrop', () => {
    it('should plant a crop and add to slots', () => {
      const state = makeState()
      const slot = plantCrop(state, 'wheat')
      expect(slot).not.toBeNull()
      expect(state.cropSlots).toHaveLength(1)
      expect(state.cropSlots[0].cropId).toBe('wheat')
    })

    it('should not plant more than MAX_SLOTS', () => {
      const state = makeState({
        cropSlots: Array.from({ length: MAX_SLOTS }, (_, i) => ({
          cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false,
        })),
      })
      const slot = plantCrop(state, 'wheat')
      expect(slot).toBeNull()
    })

    it('should not plant locked crops', () => {
      const state = makeState({ unlockedCrops: ['wheat'] })
      const slot = plantCrop(state, 'corn')
      expect(slot).toBeNull()
    })

    it('should not plant unknown crops', () => {
      const state = makeState()
      const slot = plantCrop(state, 'nonexistent')
      expect(slot).toBeNull()
    })
  })

  describe('getGrowthProgress', () => {
    it('should return 0 at planting time', () => {
      const slot: CropSlot = { cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }
      expect(getGrowthProgress(slot)).toBeCloseTo(0)
    })

    it('should return 0.5 at half grow time', () => {
      const slot: CropSlot = { cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }
      vi.advanceTimersByTime(15000)
      expect(getGrowthProgress(slot)).toBeCloseTo(0.5)
    })

    it('should return 1.0 at full grow time', () => {
      const slot: CropSlot = { cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }
      vi.advanceTimersByTime(30000)
      expect(getGrowthProgress(slot)).toBe(1)
    })

    it('should cap at 1.0', () => {
      const slot: CropSlot = { cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }
      vi.advanceTimersByTime(60000)
      expect(getGrowthProgress(slot)).toBe(1)
    })
  })

  describe('isFullyGrown', () => {
    it('should return false before grow time', () => {
      const slot: CropSlot = { cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }
      expect(isFullyGrown(slot)).toBe(false)
    })

    it('should return true after grow time', () => {
      const slot: CropSlot = { cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }
      vi.advanceTimersByTime(30000)
      expect(isFullyGrown(slot)).toBe(true)
    })
  })

  describe('harvestCrop', () => {
    it('should return 0 for invalid slot', () => {
      const state = makeState()
      expect(harvestCrop(state, 99)).toBe(0)
    })

    it('should give 1.5x bonus for perfect harvest', () => {
      const state = makeState()
      state.cropSlots = [{ cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }]
      vi.advanceTimersByTime(30000) // fully grown

      const earned = harvestCrop(state, 0)
      // wheat baseValue=10, farmMult=1, coinMult=1, progressMult=1.5, weatherMult=1, prestigeMult=1
      expect(earned).toBe(15)
    })

    it('should give reduced value for early harvest', () => {
      const state = makeState()
      state.cropSlots = [{ cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }]
      vi.advanceTimersByTime(15000) // 50% grown

      const earned = harvestCrop(state, 0)
      // progressMult = 0.5 + 0.5*0.5 = 0.75
      expect(earned).toBe(Math.floor(10 * 1 * 1 * 0.75 * 1 * 1))
    })

    it('should apply farm level multiplier', () => {
      const state = makeState({ farmLevel: 3 }) // farmMult = 1 + (3-1)*0.5 = 2.0
      state.cropSlots = [{ cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }]
      vi.advanceTimersByTime(30000)

      const earned = harvestCrop(state, 0)
      expect(earned).toBe(Math.floor(10 * 2.0 * 1 * 1.5 * 1 * 1)) // 30
    })

    it('should apply prestige bonus', () => {
      const state = makeState({ prestigeBonus: 2.0 })
      state.cropSlots = [{ cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }]
      vi.advanceTimersByTime(30000)

      const earned = harvestCrop(state, 0)
      expect(earned).toBe(Math.floor(10 * 1 * 1 * 1.5 * 1 * 2.0)) // 30
    })

    it('should apply weather multiplier for solar flare', () => {
      const state = makeState({ currentWeather: 'solar_flare' })
      state.cropSlots = [{ cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }]
      vi.advanceTimersByTime(30000)

      const earned = harvestCrop(state, 0)
      expect(earned).toBe(Math.floor(10 * 1 * 1 * 1.5 * 1.5 * 1)) // 22
    })

    it('should apply weather multiplier for meteor shower', () => {
      const state = makeState({ currentWeather: 'meteor_shower' })
      state.cropSlots = [{ cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }]
      vi.advanceTimersByTime(30000)

      const earned = harvestCrop(state, 0)
      expect(earned).toBe(Math.floor(10 * 1 * 1 * 1.5 * 0.7 * 1)) // 10
    })

    it('should reduce meteor shower penalty with weather shield', () => {
      const state = makeState({ currentWeather: 'meteor_shower', upgrades: { 'weather-shield': 2 } })
      state.cropSlots = [{ cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }]
      vi.advanceTimersByTime(30000)

      const earned = harvestCrop(state, 0)
      // shield level 2: penalty reduced by 2*0.15 = 0.3
      // effective mult = 1 + (0.7 - 1) * (1 - 0.3) = 1 + (-0.3 * 0.7) = 1 - 0.21 = 0.79
      expect(earned).toBe(Math.floor(10 * 1 * 1 * 1.5 * (1 + (-0.3 * 0.7)) * 1))
    })

    it('should remove slot after harvest', () => {
      const state = makeState()
      state.cropSlots = [{ cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }]
      vi.advanceTimersByTime(30000)

      harvestCrop(state, 0)
      expect(state.cropSlots).toHaveLength(0)
    })

    it('should increment totalHarvests', () => {
      const state = makeState()
      state.cropSlots = [{ cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }]
      vi.advanceTimersByTime(30000)

      harvestCrop(state, 0)
      expect(state.totalHarvests).toBe(1)
    })

    it('should add coins to state', () => {
      const state = makeState()
      state.cropSlots = [{ cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }]
      vi.advanceTimersByTime(30000)

      harvestCrop(state, 0)
      expect(state.coins).toBeGreaterThan(0)
      expect(state.totalCoins).toBe(state.coins)
    })
  })

  describe('autoHarvestTick', () => {
    it('should return 0 when no auto-harvest upgrade', () => {
      const state = makeState()
      expect(autoHarvestTick(state)).toBe(0)
    })

    it('should return 0 when no mature crops', () => {
      const state = makeState({ upgrades: { 'auto-harvest': 4 } }) // 100% chance
      state.cropSlots = [{ cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false }]
      expect(autoHarvestTick(state)).toBe(0)
    })
  })

  describe('getAutoHarvestChance', () => {
    it('should return 0.10 for level 1', () => { expect(getAutoHarvestChance(1)).toBe(0.10) })
    it('should return 0.30 for level 2', () => { expect(getAutoHarvestChance(2)).toBe(0.30) })
    it('should return 0.60 for level 3', () => { expect(getAutoHarvestChance(3)).toBe(0.60) })
    it('should return 1.0 for level 4', () => { expect(getAutoHarvestChance(4)).toBe(1.0) })
    it('should return 0 for level 0', () => { expect(getAutoHarvestChance(0)).toBe(0) })
  })

  describe('getAutoPlantChance', () => {
    it('should return 0 for level 0', () => { expect(getAutoPlantChance(0)).toBe(0) })
    it('should return 0 for level 1', () => { expect(getAutoPlantChance(1)).toBe(0) })
    it('should return 0.30 for level 2', () => { expect(getAutoPlantChance(2)).toBe(0.30) })
    it('should return 0.60 for level 3', () => { expect(getAutoPlantChance(3)).toBe(0.60) })
    it('should return 1.0 for level 4', () => { expect(getAutoPlantChance(4)).toBe(1.0) })
  })

  describe('autoPlantTick', () => {
    it('should not plant without auto-plant upgrade', () => {
      const state = makeState()
      const result = autoPlantTick(state, 'wheat')
      expect(result).toBe(false)
      expect(state.cropSlots).toHaveLength(0)
    })

    it('should not plant when slots are full', () => {
      const state = makeState({
        upgrades: { 'auto-plant': 4 },
        cropSlots: Array.from({ length: MAX_SLOTS }, () => ({
          cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false,
        })),
      })
      const result = autoPlantTick(state, 'wheat')
      expect(result).toBe(false)
    })
  })
})
