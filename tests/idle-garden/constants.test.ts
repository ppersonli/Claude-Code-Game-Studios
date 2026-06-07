/**
 * Idle Garden Tycoon — Constants & Math Functions Tests
 * TDD: Test pure math functions for correctness.
 */

import { describe, it, expect } from 'vitest'
import {
  calcCost,
  calcGrowthProgress,
  calcSellPrice,
  calcXpRequired,
  calcSunPoints,
  calcPrestigeThreshold,
  calcGrowthMultiplier,
  calcPriceMultiplier,
  calcPotsForLevel,
  calcOfflineEarnings,
  CONSTANTS,
} from '../../src/games/idle-garden/data/constants'

describe('Constants', () => {
  describe('calcCost', () => {
    it('should calculate exponential cost scaling', () => {
      // cost = floor(baseCost * costMult^level)
      expect(calcCost(100, 1.5, 0)).toBe(100) // 100 * 1.5^0 = 100
      expect(calcCost(100, 1.5, 1)).toBe(150) // 100 * 1.5^1 = 150
      expect(calcCost(100, 1.5, 2)).toBe(225) // 100 * 1.5^2 = 225
      expect(calcCost(100, 1.5, 3)).toBe(337) // 100 * 1.5^3 = 337.5 → 337
    })
  })

  describe('calcGrowthProgress', () => {
    it('should return 1 if growTime is 0', () => {
      expect(calcGrowthProgress(100, 0, false)).toBe(1)
    })

    it('should calculate progress without watering', () => {
      // 5 seconds elapsed, 10 second grow time = 50%
      expect(calcGrowthProgress(5, 10, false)).toBe(0.5)
    })

    it('should calculate progress with watering (20% boost)', () => {
      // 5 seconds elapsed, 10 second grow time, watered
      // effectiveTime = 10 / 1.2 = 8.333
      // progress = 5 / 8.333 = 0.6
      expect(calcGrowthProgress(5, 10, true)).toBeCloseTo(0.6, 2)
    })

    it('should cap at 1.0', () => {
      expect(calcGrowthProgress(20, 10, false)).toBe(1)
    })

    it('should apply growth multiplier', () => {
      // 5 seconds elapsed, 10 second grow time, 2x multiplier
      // effectiveTime = 10 / 2 = 5
      // progress = 5 / 5 = 1
      expect(calcGrowthProgress(5, 10, false, 2)).toBe(1)
    })
  })

  describe('calcSellPrice', () => {
    it('should return base price with 1x multiplier', () => {
      expect(calcSellPrice(100, 1)).toBe(100)
    })

    it('should apply price multiplier', () => {
      expect(calcSellPrice(100, 1.5)).toBe(150)
    })

    it('should floor fractional results', () => {
      expect(calcSellPrice(100, 1.3)).toBe(130)
    })
  })

  describe('calcXpRequired', () => {
    it('should calculate XP for level 1', () => {
      // floor(100 * 1^1.5) = 100
      expect(calcXpRequired(1)).toBe(100)
    })

    it('should calculate XP for level 2', () => {
      // floor(100 * 2^1.5) = floor(100 * 2.828) = 282
      expect(calcXpRequired(2)).toBe(282)
    })

    it('should scale exponentially', () => {
      const xp1 = calcXpRequired(1)
      const xp10 = calcXpRequired(10)
      expect(xp10).toBeGreaterThan(xp1 * 10)
    })
  })

  describe('calcSunPoints', () => {
    it('should return 0 if totalCoins < 100,000', () => {
      expect(calcSunPoints(99999)).toBe(0)
    })

    it('should calculate sun points at threshold', () => {
      // floor(sqrt(100000 / 100000)) = floor(1) = 1
      expect(calcSunPoints(100000)).toBe(1)
    })

    it('should scale with sqrt', () => {
      // floor(sqrt(400000 / 100000)) = floor(2) = 2
      expect(calcSunPoints(400000)).toBe(2)
    })
  })

  describe('calcPrestigeThreshold', () => {
    it('should return base threshold for level 0', () => {
      expect(calcPrestigeThreshold(0)).toBe(100000)
    })

    it('should multiply by threshold mult for each level', () => {
      // level 1: 100000 * 5^1 = 500000
      expect(calcPrestigeThreshold(1)).toBe(500000)
      // level 2: 100000 * 5^2 = 2500000
      expect(calcPrestigeThreshold(2)).toBe(2500000)
    })
  })

  describe('calcGrowthMultiplier', () => {
    it('should return 1 with 0 upgrades', () => {
      expect(calcGrowthMultiplier(0)).toBe(1)
    })

    it('should add 5% per upgrade', () => {
      expect(calcGrowthMultiplier(1)).toBeCloseTo(1.05, 2)
      expect(calcGrowthMultiplier(2)).toBeCloseTo(1.10, 2)
      expect(calcGrowthMultiplier(10)).toBeCloseTo(1.50, 2)
    })
  })

  describe('calcPriceMultiplier', () => {
    it('should return 1 with 0 upgrades', () => {
      expect(calcPriceMultiplier(0)).toBe(1)
    })

    it('should add 10% per upgrade', () => {
      expect(calcPriceMultiplier(1)).toBeCloseTo(1.10, 2)
      expect(calcPriceMultiplier(2)).toBeCloseTo(1.20, 2)
      expect(calcPriceMultiplier(5)).toBeCloseTo(1.50, 2)
    })
  })

  describe('calcPotsForLevel', () => {
    it('should return 4 pots at level 0', () => {
      expect(calcPotsForLevel(0)).toBe(4)
    })

    it('should add 3 pots per level', () => {
      expect(calcPotsForLevel(1)).toBe(7)
      expect(calcPotsForLevel(2)).toBe(10)
    })
  })

  describe('calcOfflineEarnings', () => {
    it('should return 0 if offline less than 10 seconds', () => {
      expect(calcOfflineEarnings(10, 5)).toBe(0)
    })

    it('should calculate earnings with 50% efficiency', () => {
      // 10 coins/sec * 100 seconds * 0.5 = 500
      expect(calcOfflineEarnings(10, 100)).toBe(500)
    })

    it('should cap at MAX_OFFLINE_HOURS', () => {
      const maxSeconds = CONSTANTS.MAX_OFFLINE_HOURS * 3600
      const earnings = calcOfflineEarnings(10, maxSeconds + 1000)
      expect(earnings).toBe(Math.floor(10 * maxSeconds * 0.5))
    })
  })
})