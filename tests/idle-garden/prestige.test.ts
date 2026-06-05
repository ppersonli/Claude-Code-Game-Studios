/**
 * Idle Garden Tycoon — PrestigeSystem tests (RED phase)
 * Tests are written FIRST. They will fail until implementation exists.
 */
import { describe, it, expect } from 'vitest'
import {
  canPrestige,
  getPrestigeRequirement,
  calcEarnableSunPoints,
  performPrestige,
  buySunPointUpgrade,
  getGrowthBonusPercent,
  getPriceBonusPercent,
} from '../../src/games/idle-garden/systems/PrestigeSystem'
import type { GameState } from '../../src/games/idle-garden/data/types'

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
    level: 5,
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

describe('PrestigeSystem', () => {
  describe('canPrestige', () => {
    it('returns true when totalCoins >= threshold', () => {
      // Level 0 threshold = 100,000
      const state = createTestState({ totalCoins: 100_000, prestigeLevel: 0 })
      expect(canPrestige(state)).toBe(true)
    })

    it('returns false when totalCoins < threshold', () => {
      const state = createTestState({ totalCoins: 99_999, prestigeLevel: 0 })
      expect(canPrestige(state)).toBe(false)
    })

    it('scales threshold with prestige level', () => {
      // Level 1 threshold = 100,000 * 5^1 = 500,000
      const state = createTestState({ totalCoins: 400_000, prestigeLevel: 1 })
      expect(canPrestige(state)).toBe(false)
      state.totalCoins = 500_000
      expect(canPrestige(state)).toBe(true)
    })
  })

  describe('getPrestigeRequirement', () => {
    it('returns base threshold for level 0', () => {
      expect(getPrestigeRequirement(0)).toBe(100_000)
    })

    it('scales by 5x per level', () => {
      expect(getPrestigeRequirement(1)).toBe(500_000)
      expect(getPrestigeRequirement(2)).toBe(2_500_000)
    })
  })

  describe('calcEarnableSunPoints', () => {
    it('returns 0 below minimum threshold', () => {
      expect(calcEarnableSunPoints(50_000)).toBe(0)
    })

    it('returns 1 at 100,000 coins', () => {
      expect(calcEarnableSunPoints(100_000)).toBe(1)
    })

    it('scales with sqrt', () => {
      // sqrt(400_000 / 100_000) = sqrt(4) = 2
      expect(calcEarnableSunPoints(400_000)).toBe(2)
    })

    it('floors fractional results', () => {
      // sqrt(200_000 / 100_000) = sqrt(2) ≈ 1.414 → 1
      expect(calcEarnableSunPoints(200_000)).toBe(1)
    })
  })

  describe('performPrestige', () => {
    it('returns 0 if cannot prestige', () => {
      const state = createTestState({ totalCoins: 50_000, prestigeLevel: 0 })
      const earned = performPrestige(state)
      expect(earned).toBe(0)
    })

    it('awards sun points based on total coins', () => {
      const state = createTestState({
        totalCoins: 400_000,
        prestigeLevel: 0,
        coins: 400_000,
      })
      const earned = performPrestige(state)
      // sqrt(400_000 / 100_000) = 2
      expect(earned).toBe(2)
      expect(state.sunPoints).toBe(2)
    })

    it('increments prestige level and count', () => {
      const state = createTestState({
        totalCoins: 100_000,
        prestigeLevel: 0,
        prestigeCount: 0,
        coins: 100_000,
      })
      performPrestige(state)
      expect(state.prestigeLevel).toBe(1)
      expect(state.prestigeCount).toBe(1)
    })

    it('resets coins to 0', () => {
      const state = createTestState({
        totalCoins: 100_000,
        coins: 100_000,
        prestigeLevel: 0,
      })
      performPrestige(state)
      expect(state.coins).toBe(0)
      expect(state.totalCoins).toBe(0)
    })

    it('resets pots to default', () => {
      const state = createTestState({
        totalCoins: 100_000,
        prestigeLevel: 0,
        coins: 100_000,
        pots: [
          { id: 0, flowerId: 'rose', plantedAt: 100, isWatered: true, isReady: false },
          { id: 1, flowerId: 'tulip', plantedAt: 200, isWatered: false, isReady: true },
          { id: 2, flowerId: null, plantedAt: 0, isWatered: false, isReady: false },
          { id: 3, flowerId: null, plantedAt: 0, isWatered: false, isReady: false },
          { id: 4, flowerId: null, plantedAt: 0, isWatered: false, isReady: false },
          { id: 5, flowerId: null, plantedAt: 0, isWatered: false, isReady: false },
        ],
        gardenLevel: 3,
      })
      performPrestige(state)
      expect(state.pots.length).toBe(4)
      expect(state.gardenLevel).toBe(1)
      state.pots.forEach(p => {
        expect(p.flowerId).toBeNull()
        expect(p.isWatered).toBe(false)
      })
    })

    it('resets upgrades', () => {
      const state = createTestState({
        totalCoins: 100_000,
        prestigeLevel: 0,
        coins: 100_000,
        upgrades: { 'auto-harvest': 2, 'auto-water': 1 },
      })
      performPrestige(state)
      expect(state.upgrades).toEqual({})
    })

    it('preserves sun points across prestiges', () => {
      const state = createTestState({
        totalCoins: 100_000,
        prestigeLevel: 0,
        coins: 100_000,
        sunPoints: 5,
      })
      performPrestige(state)
      // earned 1 more, total = 6
      expect(state.sunPoints).toBe(6)
    })

    it('preserves prestige upgrades (spGrowthUpgrades, spPriceUpgrades)', () => {
      const state = createTestState({
        totalCoins: 100_000,
        prestigeLevel: 0,
        coins: 100_000,
        spGrowthUpgrades: 3,
        spPriceUpgrades: 2,
      })
      performPrestige(state)
      expect(state.spGrowthUpgrades).toBe(3)
      expect(state.spPriceUpgrades).toBe(2)
    })
  })

  describe('buySunPointUpgrade', () => {
    it('spends 1 sun point on growth upgrade', () => {
      const state = createTestState({ sunPoints: 5, spGrowthUpgrades: 0 })
      const result = buySunPointUpgrade(state, 'growth')
      expect(result).toBe(true)
      expect(state.sunPoints).toBe(4)
      expect(state.spGrowthUpgrades).toBe(1)
    })

    it('spends 1 sun point on price upgrade', () => {
      const state = createTestState({ sunPoints: 5, spPriceUpgrades: 0 })
      const result = buySunPointUpgrade(state, 'price')
      expect(result).toBe(true)
      expect(state.sunPoints).toBe(4)
      expect(state.spPriceUpgrades).toBe(1)
    })

    it('fails if no sun points', () => {
      const state = createTestState({ sunPoints: 0 })
      const result = buySunPointUpgrade(state, 'growth')
      expect(result).toBe(false)
      expect(state.spGrowthUpgrades).toBe(0)
    })

    it('fails if at max upgrades', () => {
      const state = createTestState({ sunPoints: 100, spGrowthUpgrades: 50 })
      const result = buySunPointUpgrade(state, 'growth')
      expect(result).toBe(false)
    })
  })

  describe('getGrowthBonusPercent', () => {
    it('returns 0 with no upgrades', () => {
      expect(getGrowthBonusPercent(0)).toBe(0)
    })

    it('returns 5% per upgrade', () => {
      expect(getGrowthBonusPercent(1)).toBe(5)
      expect(getGrowthBonusPercent(10)).toBe(50)
    })
  })

  describe('getPriceBonusPercent', () => {
    it('returns 0 with no upgrades', () => {
      expect(getPriceBonusPercent(0)).toBe(0)
    })

    it('returns 10% per upgrade', () => {
      expect(getPriceBonusPercent(1)).toBe(10)
      expect(getPriceBonusPercent(5)).toBe(50)
    })
  })
})
