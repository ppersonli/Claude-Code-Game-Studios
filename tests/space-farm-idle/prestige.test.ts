import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  canPrestige,
  calcCosmicSeedsEarned,
  performPrestige,
  getPrestigeRequirement,
  checkPlanetUnlocks,
} from '../../src/games/space-farm-idle/logic/prestige'
import type { GameState } from '../../src/games/space-farm-idle/logic/game-state'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
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

describe('prestige', () => {
  describe('canPrestige', () => {
    it('should return false when totalCoins below 1M', () => {
      expect(canPrestige(makeState({ totalCoins: 500_000 }))).toBe(false)
    })

    it('should return true when totalCoins >= 1M', () => {
      expect(canPrestige(makeState({ totalCoins: 1_000_000 }))).toBe(true)
    })

    it('should return true when totalCoins exceeds 1M', () => {
      expect(canPrestige(makeState({ totalCoins: 50_000_000 }))).toBe(true)
    })
  })

  describe('calcCosmicSeedsEarned', () => {
    it('should return 0 for 0 coins', () => {
      expect(calcCosmicSeedsEarned(makeState({ totalCoins: 0 }))).toBe(0)
    })

    it('should return 1 for 1M coins', () => {
      expect(calcCosmicSeedsEarned(makeState({ totalCoins: 1_000_000 }))).toBe(1)
    })

    it('should return 10 for 100M coins', () => {
      expect(calcCosmicSeedsEarned(makeState({ totalCoins: 100_000_000 }))).toBe(10)
    })

    it('should return 100 for 10B coins', () => {
      expect(calcCosmicSeedsEarned(makeState({ totalCoins: 10_000_000_000 }))).toBe(100)
    })
  })

  describe('getPrestigeRequirement', () => {
    it('should return 1M', () => {
      expect(getPrestigeRequirement()).toBe(1_000_000)
    })
  })

  describe('performPrestige', () => {
    it('should return 0 if cannot prestige', () => {
      const state = makeState({ totalCoins: 500_000 })
      expect(performPrestige(state)).toBe(0)
    })

    it('should award cosmic seeds', () => {
      const state = makeState({ totalCoins: 1_000_000 })
      const earned = performPrestige(state)
      expect(earned).toBe(1)
      expect(state.cosmicSeeds).toBe(1)
    })

    it('should increment prestige count', () => {
      const state = makeState({ totalCoins: 1_000_000 })
      performPrestige(state)
      expect(state.prestigeCount).toBe(1)
    })

    it('should reset coins and totalCoins', () => {
      const state = makeState({ totalCoins: 5_000_000, coins: 2_000_000 })
      performPrestige(state)
      expect(state.coins).toBe(0)
      expect(state.totalCoins).toBe(0)
    })

    it('should reset farm level and workers', () => {
      const state = makeState({ totalCoins: 1_000_000, farmLevel: 10, workers: 5, workerSpeed: 0.5 })
      performPrestige(state)
      expect(state.farmLevel).toBe(1)
      expect(state.workers).toBe(0)
      expect(state.workerSpeed).toBe(0)
    })

    it('should clear crop slots', () => {
      const state = makeState({
        totalCoins: 1_000_000,
        cropSlots: [
          { cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false },
          { cropId: 'corn', plantedAt: Date.now(), growTimeMs: 30000, harvested: false },
        ],
      })
      performPrestige(state)
      expect(state.cropSlots).toHaveLength(0)
    })

    it('should update prestige bonus', () => {
      const state = makeState({ totalCoins: 100_000_000 }) // 10 seeds
      performPrestige(state)
      // prestigeBonus = 1 + (10/100) * 0.10 = 1.01
      expect(state.prestigeBonus).toBeCloseTo(1.01)
    })

    it('should accumulate cosmic seeds across prestiges', () => {
      const state = makeState({ totalCoins: 1_000_000 })
      performPrestige(state) // +1 seed
      state.totalCoins = 1_000_000
      performPrestige(state) // +1 seed
      expect(state.cosmicSeeds).toBe(2)
    })

    it('should reset weather to clear', () => {
      const state = makeState({ totalCoins: 1_000_000, currentWeather: 'solar_flare' })
      performPrestige(state)
      expect(state.currentWeather).toBe('clear')
    })

    it('should keep unlocked planets and cosmic seeds', () => {
      const state = makeState({
        totalCoins: 1_000_000,
        cosmicSeeds: 150,
        unlockedPlanets: ['earth', 'moon'],
      })
      performPrestige(state)
      expect(state.cosmicSeeds).toBe(151) // 150 + 1
      expect(state.unlockedPlanets).toContain('earth')
      expect(state.unlockedPlanets).toContain('moon')
    })
  })

  describe('checkPlanetUnlocks', () => {
    it('should unlock moon at 100 cosmic seeds', () => {
      const state = makeState({ cosmicSeeds: 100, unlockedPlanets: ['earth'] })
      const unlocked = checkPlanetUnlocks(state)
      expect(unlocked).toContain('moon')
      expect(state.unlockedPlanets).toContain('moon')
    })

    it('should unlock mars at 1000 cosmic seeds', () => {
      const state = makeState({ cosmicSeeds: 1000, unlockedPlanets: ['earth'] })
      const unlocked = checkPlanetUnlocks(state)
      expect(unlocked).toContain('mars')
    })

    it('should not unlock planets already unlocked', () => {
      const state = makeState({ cosmicSeeds: 1000, unlockedPlanets: ['earth', 'moon'] })
      const unlocked = checkPlanetUnlocks(state)
      expect(unlocked).not.toContain('moon')
    })

    it('should not unlock planets with insufficient seeds', () => {
      const state = makeState({ cosmicSeeds: 50, unlockedPlanets: ['earth'] })
      const unlocked = checkPlanetUnlocks(state)
      expect(unlocked).toHaveLength(0)
    })
  })
})
