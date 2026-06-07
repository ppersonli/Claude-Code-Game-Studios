/**
 * Idle Garden Tycoon — Prestige System Tests
 * TDD: Test prestige mechanics and sun point upgrades.
 */

import { describe, it, expect } from 'vitest'
import type { GameState } from '../../src/games/idle-garden/data/types'
import {
  canPrestige,
  getPrestigeRequirement,
  calcEarnableSunPoints,
  performPrestige,
  buySunPointUpgrade,
  getGrowthBonusPercent,
  getPriceBonusPercent,
} from '../../src/games/idle-garden/systems/PrestigeSystem'
import { createDefaultPots } from '../../src/games/idle-garden/systems/GardenSystem'

function createInitialState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 0,
    totalCoins: 0,
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
    ...overrides,
  }
}

describe('PrestigeSystem', () => {
  describe('canPrestige', () => {
    it('should return false if totalCoins < threshold', () => {
      const state = createInitialState({ totalCoins: 50000 })
      expect(canPrestige(state)).toBe(false)
    })

    it('should return true if totalCoins >= threshold', () => {
      const state = createInitialState({ totalCoins: 100000 })
      expect(canPrestige(state)).toBe(true)
    })
  })

  describe('getPrestigeRequirement', () => {
    it('should return 100,000 for prestige level 0', () => {
      expect(getPrestigeRequirement(0)).toBe(100000)
    })

    it('should return 500,000 for prestige level 1', () => {
      expect(getPrestigeRequirement(1)).toBe(500000)
    })
  })

  describe('calcEarnableSunPoints', () => {
    it('should return 0 if totalCoins < 100,000', () => {
      expect(calcEarnableSunPoints(50000)).toBe(0)
    })

    it('should calculate sun points at 100,000 coins', () => {
      expect(calcEarnableSunPoints(100000)).toBe(1)
    })

    it('should scale with sqrt', () => {
      expect(calcEarnableSunPoints(400000)).toBe(2)
    })
  })

  describe('performPrestige', () => {
    it('should return 0 if cannot prestige', () => {
      const state = createInitialState({ totalCoins: 50000 })
      const earned = performPrestige(state)
      expect(earned).toBe(0)
    })

    it('should award sun points and reset state', () => {
      const state = createInitialState({
        totalCoins: 100000,
        coins: 50000,
        level: 5,
        experience: 500,
        upgrades: { 'auto-harvest': 3 },
        unlockedFlowers: ['sunflower', 'tulip', 'rose'],
      })
      const earned = performPrestige(state)
      expect(earned).toBe(1)
      expect(state.sunPoints).toBe(1)
      expect(state.prestigeLevel).toBe(1)
      expect(state.prestigeCount).toBe(1)
      expect(state.coins).toBe(0)
      expect(state.totalCoins).toBe(0)
      expect(state.level).toBe(1)
      expect(state.experience).toBe(0)
      expect(state.upgrades).toEqual({})
      expect(state.unlockedFlowers).toEqual(['sunflower'])
    })

    it('should preserve sun point upgrades', () => {
      const state = createInitialState({
        totalCoins: 100000,
        spGrowthUpgrades: 5,
        spPriceUpgrades: 3,
      })
      performPrestige(state)
      expect(state.spGrowthUpgrades).toBe(5)
      expect(state.spPriceUpgrades).toBe(3)
    })
  })

  describe('buySunPointUpgrade', () => {
    it('should return false if no sun points', () => {
      const state = createInitialState({ sunPoints: 0 })
      expect(buySunPointUpgrade(state, 'growth')).toBe(false)
    })

    it('should buy growth upgrade', () => {
      const state = createInitialState({ sunPoints: 5 })
      const result = buySunPointUpgrade(state, 'growth')
      expect(result).toBe(true)
      expect(state.sunPoints).toBe(4)
      expect(state.spGrowthUpgrades).toBe(1)
    })

    it('should buy price upgrade', () => {
      const state = createInitialState({ sunPoints: 5 })
      const result = buySunPointUpgrade(state, 'price')
      expect(result).toBe(true)
      expect(state.sunPoints).toBe(4)
      expect(state.spPriceUpgrades).toBe(1)
    })

    it('should return false at max upgrades', () => {
      const state = createInitialState({
        sunPoints: 5,
        spGrowthUpgrades: 50,
      })
      expect(buySunPointUpgrade(state, 'growth')).toBe(false)
    })
  })

  describe('getGrowthBonusPercent', () => {
    it('should return 0 with 0 upgrades', () => {
      expect(getGrowthBonusPercent(0)).toBe(0)
    })

    it('should return 5% per upgrade', () => {
      expect(getGrowthBonusPercent(1)).toBe(5)
      expect(getGrowthBonusPercent(2)).toBe(10)
    })
  })

  describe('getPriceBonusPercent', () => {
    it('should return 0 with 0 upgrades', () => {
      expect(getPriceBonusPercent(0)).toBe(0)
    })

    it('should return 10% per upgrade', () => {
      expect(getPriceBonusPercent(1)).toBe(10)
      expect(getPriceBonusPercent(2)).toBe(20)
    })
  })
})