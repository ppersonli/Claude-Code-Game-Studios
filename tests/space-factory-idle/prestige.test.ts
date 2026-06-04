import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  canPrestige,
  getPrestigeRequirement,
  calcEarnableStardust,
  performPrestige,
} from '../../src/games/space-factory-idle/logic/prestige'
import type { GameState } from '../../src/games/space-factory-idle/logic/game-state'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 0,
    totalCoins: 0,
    starDust: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    prestigeMult: 1,
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
    ...overrides,
  }
}

describe('prestige', () => {
  describe('canPrestige', () => {
    it('should return false when totalCoins below threshold', () => {
      const state = makeState({ totalCoins: 500_000 })
      expect(canPrestige(state)).toBe(false)
    })

    it('should return true when totalCoins >= threshold', () => {
      const state = makeState({ totalCoins: 1_000_000 })
      expect(canPrestige(state)).toBe(true)
    })

    it('should return true when totalCoins exceeds threshold', () => {
      const state = makeState({ totalCoins: 5_000_000 })
      expect(canPrestige(state)).toBe(true)
    })

    it('should use correct threshold for prestige level 1', () => {
      // Level 1 threshold = 1M * 10 = 10M
      const state = makeState({ totalCoins: 10_000_000, prestigeLevel: 1 })
      expect(canPrestige(state)).toBe(true)
    })

    it('should return false at prestige level 1 with only 5M coins', () => {
      const state = makeState({ totalCoins: 5_000_000, prestigeLevel: 1 })
      expect(canPrestige(state)).toBe(false)
    })
  })

  describe('getPrestigeRequirement', () => {
    it('should return 1M for prestige level 0', () => {
      const state = makeState({ prestigeLevel: 0 })
      expect(getPrestigeRequirement(state)).toBe(1_000_000)
    })

    it('should return 10M for prestige level 1', () => {
      const state = makeState({ prestigeLevel: 1 })
      expect(getPrestigeRequirement(state)).toBe(10_000_000)
    })
  })

  describe('calcEarnableStardust', () => {
    it('should return 0 for 0 coins', () => {
      const state = makeState({ totalCoins: 0 })
      expect(calcEarnableStardust(state)).toBe(0)
    })

    it('should return 1 for 1M coins', () => {
      const state = makeState({ totalCoins: 1_000_000 })
      expect(calcEarnableStardust(state)).toBe(1)
    })

    it('should return 10 for 100M coins', () => {
      const state = makeState({ totalCoins: 100_000_000 })
      expect(calcEarnableStardust(state)).toBe(10)
    })
  })

  describe('performPrestige', () => {
    it('should return 0 if cannot prestige', () => {
      const state = makeState({ totalCoins: 500_000 })
      expect(performPrestige(state)).toBe(0)
    })

    it('should award star dust', () => {
      const state = makeState({ totalCoins: 1_000_000 })
      const earned = performPrestige(state)
      expect(earned).toBe(1)
      expect(state.starDust).toBe(1)
    })

    it('should increment prestige level and count', () => {
      const state = makeState({ totalCoins: 1_000_000 })
      performPrestige(state)
      expect(state.prestigeLevel).toBe(1)
      expect(state.prestigeCount).toBe(1)
    })

    it('should reset coins and totalCoins', () => {
      const state = makeState({ totalCoins: 1_000_000, coins: 500_000 })
      performPrestige(state)
      expect(state.coins).toBe(0)
      expect(state.totalCoins).toBe(0)
    })

    it('should reset production lines to default', () => {
      const state = makeState({
        totalCoins: 1_000_000,
        productionLines: {
          earth: [
            { recipeId: 'ore-smelt', level: 5, stock: 100, maxStock: 50, automated: true },
            { recipeId: 'metal-work', level: 3, stock: 50, maxStock: 30, automated: false },
          ],
        },
      })
      performPrestige(state)
      expect(state.productionLines.earth).toHaveLength(1)
      expect(state.productionLines.earth[0].level).toBe(1)
      expect(state.productionLines.earth[0].stock).toBe(0)
      expect(state.productionLines.earth[0].automated).toBe(false)
    })

    it('should reset upgrades and employees', () => {
      const state = makeState({
        totalCoins: 1_000_000,
        upgrades: { 'line-speed': 5, 'quality-boost': 3 },
        employees: { engineer: 10 },
      })
      performPrestige(state)
      expect(Object.keys(state.upgrades)).toHaveLength(0)
      expect(Object.keys(state.employees)).toHaveLength(0)
    })

    it('should reset unlocked planets to earth only', () => {
      const state = makeState({
        totalCoins: 1_000_000,
        unlockedPlanets: ['earth', 'moon', 'mars'],
      })
      performPrestige(state)
      expect(state.unlockedPlanets).toEqual(['earth'])
    })

    it('should reset unlocked recipes to ore-smelt only', () => {
      const state = makeState({
        totalCoins: 1_000_000,
        unlockedRecipes: ['ore-smelt', 'metal-work', 'electronics'],
      })
      performPrestige(state)
      expect(state.unlockedRecipes).toEqual(['ore-smelt'])
    })

    it('should reset totalProduced and session stats', () => {
      const state = makeState({
        totalCoins: 1_000_000,
        totalProduced: 5000,
        sessionCoinsEarned: 1000,
        sessionItemsProduced: 200,
        sessionUpgradesMade: 10,
      })
      performPrestige(state)
      expect(state.totalProduced).toBe(0)
      expect(state.sessionCoinsEarned).toBe(0)
      expect(state.sessionItemsProduced).toBe(0)
      expect(state.sessionUpgradesMade).toBe(0)
    })

    it('should reset totalPlayTime (inflation reset)', () => {
      const state = makeState({
        totalCoins: 1_000_000,
        totalPlayTime: 36000, // 10 hours
      })
      performPrestige(state)
      expect(state.totalPlayTime).toBe(0)
    })

    it('should calculate prestigeMult correctly', () => {
      const state = makeState({ totalCoins: 100_000_000 }) // 10 stardust
      performPrestige(state)
      // prestigeMult = 1 + starDust * 0.1 = 1 + 10 * 0.1 = 2.0
      expect(state.prestigeMult).toBeCloseTo(2.0)
    })

    it('should accumulate star dust across prestiges', () => {
      const state = makeState({ totalCoins: 1_000_000 })
      performPrestige(state) // +1 stardust, totalCoins reset to 0
      // After prestige level 1, threshold = 1M * 10 = 10M. Need >= 10M.
      state.totalCoins = 10_000_000 // sqrt(10) = 3 stardust
      performPrestige(state)
      expect(state.starDust).toBe(4) // 1 + 3
    })

    it('should return 0 if earned stardust is 0 even with enough coins', () => {
      // This edge case: totalCoins = 999,999 < 1M threshold
      const state = makeState({ totalCoins: 999_999 })
      expect(performPrestige(state)).toBe(0)
    })

    it('should handle multiple prestiges in sequence', () => {
      const state = makeState({ totalCoins: 10_000_000 }) // sqrt(10) = 3 stardust
      const earned1 = performPrestige(state)
      expect(earned1).toBe(3)
      expect(state.prestigeLevel).toBe(1)
      // After prestige: totalCoins=0, starDust=3, prestigeMult=1.3

      // Need 10M * 10 = 100M for prestige level 1
      state.totalCoins = 100_000_000
      const earned2 = performPrestige(state) // sqrt(100) = 10
      expect(earned2).toBe(10)
      expect(state.prestigeLevel).toBe(2)
      expect(state.starDust).toBe(13) // 3 + 10
    })
  })
})
