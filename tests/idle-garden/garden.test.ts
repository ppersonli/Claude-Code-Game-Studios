/**
 * Idle Garden Tycoon — GardenSystem tests (RED phase)
 * Tests are written FIRST. They will fail until implementation exists.
 */
import { describe, it, expect, beforeEach } from 'vitest'
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
} from '../../src/games/idle-garden/systems/GardenSystem'
import type { GameState, PotState } from '../../src/games/idle-garden/data/types'

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 100,
    totalCoins: 100,
    sunPoints: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    spGrowthUpgrades: 0,
    spPriceUpgrades: 0,
    pots: [],
    gardenLevel: 1,
    level: 1,
    experience: 0,
    unlockedFlowers: ['sunflower'],
    upgrades: {},
    decorations: [],
    stats: { totalCoinsEarned: 0, totalFlowersGrown: 0, totalHarvests: 0, totalPlayTime: 0 },
    lastOnline: Date.now(),
    sessionStart: Date.now(),
    lastHarvestTime: 0,
    comboCount: 0,
    ...overrides,
  }
}

describe('GardenSystem', () => {
  describe('createPot', () => {
    it('creates an empty pot with given id', () => {
      const pot = createPot(5)
      expect(pot.id).toBe(5)
      expect(pot.flowerId).toBeNull()
      expect(pot.plantedAt).toBe(0)
      expect(pot.isWatered).toBe(false)
      expect(pot.isReady).toBe(false)
    })
  })

  describe('createDefaultPots', () => {
    it('creates the default number of pots', () => {
      const pots = createDefaultPots()
      expect(pots.length).toBe(4)
      pots.forEach((pot, i) => {
        expect(pot.id).toBe(i)
        expect(pot.flowerId).toBeNull()
      })
    })
  })

  describe('plantFlower', () => {
    it('plants a flower in an empty pot', () => {
      const state = createTestState({
        pots: [createPot(0)],
        coins: 100,
      })
      const now = Date.now()
      const result = plantFlower(state, 0, 'sunflower', now)
      expect(result).toBe(true)
      expect(state.pots[0].flowerId).toBe('sunflower')
      expect(state.pots[0].plantedAt).toBe(now)
      expect(state.pots[0].isReady).toBe(false)
      expect(state.pots[0].isWatered).toBe(false)
    })

    it('deducts seed cost from coins', () => {
      const state = createTestState({
        pots: [createPot(0)],
        coins: 100,
      })
      plantFlower(state, 0, 'sunflower', Date.now())
      // sunflower seed cost = 5
      expect(state.coins).toBe(95)
    })

    it('fails if pot is already occupied', () => {
      const state = createTestState({
        pots: [{ id: 0, flowerId: 'sunflower', plantedAt: Date.now(), isWatered: false, isReady: false }],
        coins: 100,
      })
      const result = plantFlower(state, 0, 'tulip', Date.now())
      expect(result).toBe(false)
      expect(state.pots[0].flowerId).toBe('sunflower')
    })

    it('fails if not enough coins for seed', () => {
      const state = createTestState({
        pots: [createPot(0)],
        coins: 1, // not enough for sunflower (5)
      })
      const result = plantFlower(state, 0, 'sunflower', Date.now())
      expect(result).toBe(false)
      expect(state.pots[0].flowerId).toBeNull()
    })

    it('fails if flower is not unlocked', () => {
      const state = createTestState({
        pots: [createPot(0)],
        coins: 1000,
        level: 1,
        prestigeLevel: 0,
      })
      const result = plantFlower(state, 0, 'tulip', Date.now())
      expect(result).toBe(false)
    })

    it('fails for invalid pot id', () => {
      const state = createTestState({ pots: [createPot(0)], coins: 100 })
      const result = plantFlower(state, 99, 'sunflower', Date.now())
      expect(result).toBe(false)
    })

    it('updates stats.totalFlowersGrown on success', () => {
      const state = createTestState({
        pots: [createPot(0)],
        coins: 100,
      })
      plantFlower(state, 0, 'sunflower', Date.now())
      expect(state.stats.totalFlowersGrown).toBe(1)
    })
  })

  describe('harvestPot', () => {
    it('harvests a ready flower and returns sell price', () => {
      const now = Date.now()
      const state = createTestState({
        pots: [{ id: 0, flowerId: 'sunflower', plantedAt: now - 20_000, isWatered: false, isReady: true }],
      })
      const earnings = harvestPot(state, 0, now)
      // sunflower sells for 10
      expect(earnings).toBe(10)
      expect(state.pots[0].flowerId).toBeNull()
      expect(state.pots[0].isReady).toBe(false)
      expect(state.pots[0].isWatered).toBe(false)
    })

    it('adds earnings to coins', () => {
      const now = Date.now()
      const state = createTestState({
        pots: [{ id: 0, flowerId: 'sunflower', plantedAt: now - 20_000, isWatered: false, isReady: true }],
        coins: 50,
      })
      harvestPot(state, 0, now)
      expect(state.coins).toBe(60)
    })

    it('returns 0 for non-ready pot', () => {
      const now = Date.now()
      const state = createTestState({
        pots: [{ id: 0, flowerId: 'sunflower', plantedAt: now, isWatered: false, isReady: false }],
      })
      const earnings = harvestPot(state, 0, now)
      expect(earnings).toBe(0)
    })

    it('returns 0 for empty pot', () => {
      const state = createTestState({
        pots: [createPot(0)],
      })
      const earnings = harvestPot(state, 0, Date.now())
      expect(earnings).toBe(0)
    })

    it('returns 0 for invalid pot id', () => {
      const state = createTestState({ pots: [createPot(0)] })
      const earnings = harvestPot(state, 99, Date.now())
      expect(earnings).toBe(0)
    })

    it('updates combo count', () => {
      const now = Date.now()
      const state = createTestState({
        pots: [
          { id: 0, flowerId: 'sunflower', plantedAt: now - 20_000, isWatered: false, isReady: true },
          { id: 1, flowerId: 'sunflower', plantedAt: now - 20_000, isWatered: false, isReady: true },
        ],
        lastHarvestTime: 0,
        comboCount: 0,
      })
      harvestPot(state, 0, now)
      expect(state.comboCount).toBe(1)
      expect(state.lastHarvestTime).toBe(now)
    })

    it('resets combo if outside combo window', () => {
      const now = Date.now()
      const state = createTestState({
        pots: [
          { id: 0, flowerId: 'sunflower', plantedAt: now - 20_000, isWatered: false, isReady: true },
          { id: 1, flowerId: 'sunflower', plantedAt: now - 20_000, isWatered: false, isReady: true },
        ],
        lastHarvestTime: now - 10_000, // 10 seconds ago, outside 3s window
        comboCount: 5,
      })
      harvestPot(state, 0, now)
      expect(state.comboCount).toBe(1)
    })

    it('updates stats.totalHarvests', () => {
      const now = Date.now()
      const state = createTestState({
        pots: [{ id: 0, flowerId: 'sunflower', plantedAt: now - 20_000, isWatered: false, isReady: true }],
      })
      harvestPot(state, 0, now)
      expect(state.stats.totalHarvests).toBe(1)
    })

    it('applies combo multiplier to earnings', () => {
      const now = Date.now()
      const state = createTestState({
        pots: [
          { id: 0, flowerId: 'sunflower', plantedAt: now - 20_000, isWatered: false, isReady: true },
          { id: 1, flowerId: 'sunflower', plantedAt: now - 20_000, isWatered: false, isReady: true },
        ],
        lastHarvestTime: now - 1000, // within combo window
        comboCount: 2,
      })
      const earnings = harvestPot(state, 0, now)
      // combo count was 2, incremented to 3, multiplier = min(3, 5) = 1 + (3-1)*0.25 = 1.5
      expect(earnings).toBe(Math.floor(10 * 1.5))
    })

    it('applies prestige price multiplier', () => {
      const now = Date.now()
      const state = createTestState({
        pots: [{ id: 0, flowerId: 'sunflower', plantedAt: now - 20_000, isWatered: false, isReady: true }],
        spPriceUpgrades: 2, // 1 + 2*0.10 = 1.20
      })
      const earnings = harvestPot(state, 0, now)
      expect(earnings).toBe(Math.floor(10 * 1.20))
    })
  })

  describe('waterPot', () => {
    it('waters an occupied pot', () => {
      const state = createTestState({
        pots: [{ id: 0, flowerId: 'sunflower', plantedAt: Date.now(), isWatered: false, isReady: false }],
      })
      const result = waterPot(state, 0)
      expect(result).toBe(true)
      expect(state.pots[0].isWatered).toBe(true)
    })

    it('fails on empty pot', () => {
      const state = createTestState({ pots: [createPot(0)] })
      const result = waterPot(state, 0)
      expect(result).toBe(false)
    })

    it('fails on already watered pot', () => {
      const state = createTestState({
        pots: [{ id: 0, flowerId: 'sunflower', plantedAt: Date.now(), isWatered: true, isReady: false }],
      })
      const result = waterPot(state, 0)
      expect(result).toBe(false)
    })

    it('fails on invalid pot id', () => {
      const state = createTestState({ pots: [createPot(0)] })
      const result = waterPot(state, 99)
      expect(result).toBe(false)
    })
  })

  describe('getGrowthProgress', () => {
    it('returns 0 when just planted', () => {
      const now = Date.now()
      const pot: PotState = { id: 0, flowerId: 'sunflower', plantedAt: now, isWatered: false, isReady: false }
      const progress = getGrowthProgress(pot, now, 1)
      expect(progress).toBe(0)
    })

    it('returns 1 when fully grown', () => {
      const now = Date.now()
      const pot: PotState = { id: 0, flowerId: 'sunflower', plantedAt: now - 20_000, isWatered: false, isReady: false }
      const progress = getGrowthProgress(pot, now, 1)
      expect(progress).toBe(1)
    })

    it('returns 0 for empty pot', () => {
      const pot: PotState = { id: 0, flowerId: null, plantedAt: 0, isWatered: false, isReady: false }
      expect(getGrowthProgress(pot, Date.now(), 1)).toBe(0)
    })

    it('watered pot grows faster (20% boost)', () => {
      const now = Date.now()
      const dryPot: PotState = { id: 0, flowerId: 'sunflower', plantedAt: now - 5000, isWatered: false, isReady: false }
      const wetPot: PotState = { id: 0, flowerId: 'sunflower', plantedAt: now - 5000, isWatered: true, isReady: false }
      const dryProgress = getGrowthProgress(dryPot, now, 1)
      const wetProgress = getGrowthProgress(wetPot, now, 1)
      expect(wetProgress).toBeGreaterThan(dryProgress)
    })

    it('growth mult from sun points accelerates growth', () => {
      const now = Date.now()
      const pot: PotState = { id: 0, flowerId: 'sunflower', plantedAt: now - 5000, isWatered: false, isReady: false }
      const normalProgress = getGrowthProgress(pot, now, 1)
      const boostedProgress = getGrowthProgress(pot, now, 1.5)
      expect(boostedProgress).toBeGreaterThan(normalProgress)
    })
  })

  describe('isPotReady', () => {
    it('returns true when growth >= 1', () => {
      const now = Date.now()
      const pot: PotState = { id: 0, flowerId: 'sunflower', plantedAt: now - 20_000, isWatered: false, isReady: false }
      expect(isPotReady(pot, now, 1)).toBe(true)
    })

    it('returns false when still growing', () => {
      const now = Date.now()
      const pot: PotState = { id: 0, flowerId: 'sunflower', plantedAt: now - 1000, isWatered: false, isReady: false }
      expect(isPotReady(pot, now, 1)).toBe(false)
    })

    it('returns false for empty pot', () => {
      const pot: PotState = { id: 0, flowerId: null, plantedAt: 0, isWatered: false, isReady: false }
      expect(isPotReady(pot, Date.now(), 1)).toBe(false)
    })
  })

  describe('getPotCount', () => {
    it('returns number of pots', () => {
      const state = createTestState({ pots: [createPot(0), createPot(1), createPot(2)] })
      expect(getPotCount(state)).toBe(3)
    })
  })

  describe('addPots', () => {
    it('adds new pots with sequential ids', () => {
      const state = createTestState({ pots: [createPot(0), createPot(1)] })
      addPots(state, 2)
      expect(state.pots.length).toBe(4)
      expect(state.pots[2].id).toBe(2)
      expect(state.pots[3].id).toBe(3)
    })
  })

  describe('getAutoHarvestYield', () => {
    it('returns 0 if no auto-harvest upgrade', () => {
      const state = createTestState({
        pots: [{ id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true }],
        upgrades: {},
      })
      expect(getAutoHarvestYield(state)).toBe(0)
    })

    it('returns total yield from ready pots with auto-harvest', () => {
      const state = createTestState({
        pots: [
          { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
          { id: 1, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
          { id: 2, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: false },
        ],
        upgrades: { 'auto-harvest': 1 },
      })
      // 2 ready sunflowers * 10 coins each = 20
      expect(getAutoHarvestYield(state)).toBe(20)
    })
  })
})
