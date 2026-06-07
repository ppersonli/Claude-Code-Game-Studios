/**
 * Idle Garden Tycoon — Garden System Tests
 * TDD: Write tests FIRST, then verify implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { GameState } from '../../src/games/idle-garden/data/types'
import {
  createPot,
  createDefaultPots,
  plantFlower,
  harvestPot,
  waterPot,
  getGrowthProgress,
  isPotReady,
  getPotCount,
  addPots,
  getAutoHarvestYield,
  autoWaterPots,
} from '../../src/games/idle-garden/systems/GardenSystem'

function createInitialState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 1000,
    totalCoins: 1000,
    level: 1,
    experience: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    sunPoints: 0,
    pots: createDefaultPots(),
    gardenLevel: 1,
    unlockedFlowers: ['sunflower'],
    decorations: [],
    upgrades: {},
    spGrowthUpgrades: 0,
    spPriceUpgrades: 0,
    achievements: [],
    dailyChallenge: null,
    stats: {
      totalCoinsEarned: 1000,
      totalFlowersGrown: 0,
      totalHarvests: 0,
      totalPlayTime: 0,
      maxComboCount: 0,
    },
    lastOnline: Date.now(),
    sessionStart: Date.now(),
    lastHarvestTime: 0,
    comboCount: 0,
    ...overrides,
  }
}

describe('GardenSystem', () => {
  describe('createPot', () => {
    it('should create an empty pot with given id', () => {
      const pot = createPot(5)
      expect(pot.id).toBe(5)
      expect(pot.flowerId).toBeNull()
      expect(pot.plantedAt).toBe(0)
      expect(pot.isWatered).toBe(false)
      expect(pot.isReady).toBe(false)
    })
  })

  describe('createDefaultPots', () => {
    it('should create 4 pots by default', () => {
      const pots = createDefaultPots()
      expect(pots).toHaveLength(4)
      expect(pots[0].id).toBe(0)
      expect(pots[3].id).toBe(3)
    })
  })

  describe('plantFlower', () => {
    it('should plant a flower in an empty pot', () => {
      const state = createInitialState()
      const now = Date.now()
      const result = plantFlower(state, 0, 'sunflower', now)
      expect(result).toBe(true)
      expect(state.pots[0].flowerId).toBe('sunflower')
      expect(state.pots[0].plantedAt).toBe(now)
      expect(state.pots[0].isWatered).toBe(false)
      expect(state.pots[0].isReady).toBe(false)
    })

    it('should deduct seed cost from coins', () => {
      const state = createInitialState({ coins: 100 })
      plantFlower(state, 0, 'sunflower', Date.now())
      expect(state.coins).toBe(95) // sunflower costs 5
    })

    it('should increment totalFlowersGrown', () => {
      const state = createInitialState()
      plantFlower(state, 0, 'sunflower', Date.now())
      expect(state.stats.totalFlowersGrown).toBe(1)
    })

    it('should return false if pot is occupied', () => {
      const state = createInitialState()
      plantFlower(state, 0, 'sunflower', Date.now())
      const result = plantFlower(state, 0, 'sunflower', Date.now())
      expect(result).toBe(false)
    })

    it('should return false if insufficient coins', () => {
      const state = createInitialState({ coins: 1 })
      const result = plantFlower(state, 0, 'sunflower', Date.now())
      expect(result).toBe(false)
    })

    it('should return false if flower not unlocked', () => {
      const state = createInitialState({ unlockedFlowers: ['sunflower'] })
      const result = plantFlower(state, 0, 'rose', Date.now())
      expect(result).toBe(false)
    })

    it('should return false for invalid pot id', () => {
      const state = createInitialState()
      const result = plantFlower(state, 999, 'sunflower', Date.now())
      expect(result).toBe(false)
    })
  })

  describe('harvestPot', () => {
    it('should harvest a ready pot and return earnings', () => {
      const state = createInitialState()
      const now = Date.now()
      plantFlower(state, 0, 'sunflower', now)
      state.pots[0].isReady = true
      const earnings = harvestPot(state, 0, now + 1000)
      expect(earnings).toBeGreaterThan(0)
      expect(state.pots[0].flowerId).toBeNull()
    })

    it('should return 0 for empty pot', () => {
      const state = createInitialState()
      const earnings = harvestPot(state, 0, Date.now())
      expect(earnings).toBe(0)
    })

    it('should return 0 for unready pot', () => {
      const state = createInitialState()
      plantFlower(state, 0, 'sunflower', Date.now())
      state.pots[0].isReady = false
      const earnings = harvestPot(state, 0, Date.now())
      expect(earnings).toBe(0)
    })

    it('should increment totalHarvests', () => {
      const state = createInitialState()
      plantFlower(state, 0, 'sunflower', Date.now())
      state.pots[0].isReady = true
      harvestPot(state, 0, Date.now())
      expect(state.stats.totalHarvests).toBe(1)
    })
  })

  describe('waterPot', () => {
    it('should water a pot with a flower', () => {
      const state = createInitialState()
      plantFlower(state, 0, 'sunflower', Date.now())
      const result = waterPot(state, 0)
      expect(result).toBe(true)
      expect(state.pots[0].isWatered).toBe(true)
    })

    it('should return false for empty pot', () => {
      const state = createInitialState()
      const result = waterPot(state, 0)
      expect(result).toBe(false)
    })

    it('should return false if already watered', () => {
      const state = createInitialState()
      plantFlower(state, 0, 'sunflower', Date.now())
      waterPot(state, 0)
      const result = waterPot(state, 0)
      expect(result).toBe(false)
    })
  })

  describe('getGrowthProgress', () => {
    it('should return 0 for empty pot', () => {
      const pot = createPot(0)
      const progress = getGrowthProgress(pot, Date.now(), 1)
      expect(progress).toBe(0)
    })

    it('should return progress between 0 and 1', () => {
      const state = createInitialState()
      const now = Date.now()
      plantFlower(state, 0, 'sunflower', now)
      const progress = getGrowthProgress(state.pots[0], now + 5000, 1)
      expect(progress).toBeGreaterThan(0)
      expect(progress).toBeLessThan(1)
    })
  })

  describe('isPotReady', () => {
    it('should return false for empty pot', () => {
      const pot = createPot(0)
      expect(isPotReady(pot, Date.now(), 1)).toBe(false)
    })

    it('should return true when growth is complete', () => {
      const state = createInitialState()
      const now = Date.now()
      plantFlower(state, 0, 'sunflower', now)
      // Sunflower takes 10 seconds
      expect(isPotReady(state.pots[0], now + 11000, 1)).toBe(true)
    })
  })

  describe('getPotCount', () => {
    it('should return number of pots', () => {
      const state = createInitialState()
      expect(getPotCount(state)).toBe(4)
    })
  })

  describe('addPots', () => {
    it('should add new pots to the garden', () => {
      const state = createInitialState()
      addPots(state, 2)
      expect(state.pots).toHaveLength(6)
      expect(state.pots[4].id).toBe(4)
      expect(state.pots[5].id).toBe(5)
    })
  })

  describe('getAutoHarvestYield', () => {
    it('should return 0 if no auto-harvest upgrade', () => {
      const state = createInitialState({ upgrades: {} })
      expect(getAutoHarvestYield(state)).toBe(0)
    })

    it('should calculate yield from ready pots', () => {
      const state = createInitialState({
        upgrades: { 'auto-harvest': 1 },
        pots: [
          { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
        ],
      })
      const yieldAmount = getAutoHarvestYield(state)
      expect(yieldAmount).toBe(10) // sunflower sells for 10
    })
  })

  describe('autoWaterPots', () => {
    it('should return 0 if no auto-water upgrade', () => {
      const state = createInitialState({ upgrades: {} })
      expect(autoWaterPots(state)).toBe(0)
    })

    it('should water all unwatered pots with flowers', () => {
      const state = createInitialState({
        upgrades: { 'auto-water': 1 },
        pots: [
          { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: false },
          { id: 1, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: false },
          { id: 2, flowerId: null, plantedAt: 0, isWatered: false, isReady: false },
        ],
      })
      const count = autoWaterPots(state)
      expect(count).toBe(2)
      expect(state.pots[0].isWatered).toBe(true)
      expect(state.pots[1].isWatered).toBe(true)
      expect(state.pots[2].isWatered).toBe(false)
    })
  })
})