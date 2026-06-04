import { describe, it, expect } from 'vitest'
import {
  CONSTANTS,
  calcCost,
  calcOutput,
  calcPrestigeStardust,
  calcPrestigeThreshold,
  calcInflation,
} from '../../src/games/space-factory-idle/logic/constants'

describe('constants', () => {
  describe('CONSTANTS', () => {
    it('should have valid save key', () => {
      expect(CONSTANTS.SAVE_KEY).toBe('space-factory-idle-state')
    })

    it('should have idle/active ratio summing to 1', () => {
      expect(CONSTANTS.IDLE_RATIO + CONSTANTS.ACTIVE_RATIO).toBeCloseTo(1.0)
    })

    it('should have positive tick interval', () => {
      expect(CONSTANTS.TICK_INTERVAL).toBeGreaterThan(0)
    })

    it('should have offline efficiency between 0 and 1', () => {
      expect(CONSTANTS.OFFLINE_EFFICIENCY).toBeGreaterThan(0)
      expect(CONSTANTS.OFFLINE_EFFICIENCY).toBeLessThanOrEqual(1)
    })

    it('should have positive max offline hours', () => {
      expect(CONSTANTS.MAX_OFFLINE_HOURS).toBeGreaterThan(0)
    })

    it('should have positive ad intervals', () => {
      expect(CONSTANTS.AD_UPGRADE_INTERVAL).toBeGreaterThan(0)
      expect(CONSTANTS.AD_MIN_INTERVAL).toBeGreaterThan(0)
    })

    it('should have combo max mult >= 1', () => {
      expect(CONSTANTS.COMBO_MAX_MULT).toBeGreaterThanOrEqual(1)
    })

    it('should have positive inflation rate', () => {
      expect(CONSTANTS.INFLATION_RATE_PER_HOUR).toBeGreaterThan(0)
    })
  })

  describe('calcCost', () => {
    it('should return baseCost at level 0', () => {
      expect(calcCost(100, 1.15, 0)).toBe(100)
    })

    it('should increase cost with level', () => {
      const cost0 = calcCost(100, 1.15, 0)
      const cost1 = calcCost(100, 1.15, 1)
      const cost2 = calcCost(100, 1.15, 2)
      expect(cost1).toBeGreaterThan(cost0)
      expect(cost2).toBeGreaterThan(cost1)
    })

    it('should follow exponential formula: floor(base * mult^level)', () => {
      // 100 * 1.15^3 = 100 * 1.520875 = 152.0875 → floor = 152
      expect(calcCost(100, 1.15, 3)).toBe(152)
    })

    it('should handle level 10 with high multiplier', () => {
      // 50 * 1.12^10 = 50 * 3.1058 = 155.29 → floor = 155
      const result = calcCost(50, 1.12, 10)
      expect(result).toBe(Math.floor(50 * Math.pow(1.12, 10)))
    })

    it('should floor the result', () => {
      // 100 * 1.15^1 = 115 → already integer
      // 100 * 1.15^2 = 132.25 → floor = 132
      expect(calcCost(100, 1.15, 2)).toBe(132)
    })

    it('should handle baseCost of 0', () => {
      expect(calcCost(0, 1.15, 5)).toBe(0)
    })

    it('should handle costMult of 1 (flat cost)', () => {
      expect(calcCost(100, 1, 100)).toBe(100)
    })

    it('should handle large levels', () => {
      const result = calcCost(100, 1.15, 50)
      expect(result).toBe(Math.floor(100 * Math.pow(1.15, 50)))
      expect(result).toBeGreaterThan(10000)
    })
  })

  describe('calcOutput', () => {
    it('should return baseOutput at level 1 with all mults = 1', () => {
      expect(calcOutput(10, 1, 1, 1, 1)).toBe(10)
    })

    it('should scale with level (levelMult = 1 + (level-1)*0.5)', () => {
      // Level 1: 10 * 1.0 * 1 * 1 * 1 = 10
      // Level 2: 10 * 1.5 * 1 * 1 * 1 = 15
      // Level 3: 10 * 2.0 * 1 * 1 * 1 = 20
      expect(calcOutput(10, 1, 1, 1, 1)).toBe(10)
      expect(calcOutput(10, 2, 1, 1, 1)).toBe(15)
      expect(calcOutput(10, 3, 1, 1, 1)).toBe(20)
    })

    it('should multiply by upgradeMult', () => {
      // baseOutput=10, level=1, upgradeMult=2 → 10 * 1.0 * 2 * 1 * 1 = 20
      expect(calcOutput(10, 1, 2, 1, 1)).toBe(20)
    })

    it('should multiply by planetMult', () => {
      // baseOutput=10, level=1, planetMult=1.5 → 10 * 1.0 * 1 * 1.5 * 1 = 15
      expect(calcOutput(10, 1, 1, 1.5, 1)).toBe(15)
    })

    it('should multiply by prestigeMult', () => {
      // baseOutput=10, level=1, prestigeMult=3 → 10 * 1.0 * 1 * 1 * 3 = 30
      expect(calcOutput(10, 1, 1, 1, 3)).toBe(30)
    })

    it('should combine all multipliers', () => {
      // baseOutput=10, level=3, upgradeMult=2, planetMult=1.5, prestigeMult=2
      // levelMult = 1 + (3-1)*0.5 = 2.0
      // 10 * 2.0 * 2 * 1.5 * 2 = 120
      expect(calcOutput(10, 3, 2, 1.5, 2)).toBe(120)
    })

    it('should handle baseOutput of 0', () => {
      expect(calcOutput(0, 5, 2, 1.5, 1)).toBe(0)
    })
  })

  describe('calcPrestigeStardust', () => {
    it('should return 0 for 0 coins', () => {
      expect(calcPrestigeStardust(0)).toBe(0)
    })

    it('should return 0 for coins below 1M threshold', () => {
      expect(calcPrestigeStardust(999_999)).toBe(0)
    })

    it('should return 1 for 1M coins', () => {
      // sqrt(1_000_000 / 1_000_000) = sqrt(1) = 1
      expect(calcPrestigeStardust(1_000_000)).toBe(1)
    })

    it('should return 10 for 100M coins', () => {
      // sqrt(100_000_000 / 1_000_000) = sqrt(100) = 10
      expect(calcPrestigeStardust(100_000_000)).toBe(10)
    })

    it('should return 100 for 10B coins', () => {
      // sqrt(10_000_000_000 / 1_000_000) = sqrt(10000) = 100
      expect(calcPrestigeStardust(10_000_000_000)).toBe(100)
    })

    it('should floor the result', () => {
      // sqrt(2_000_000 / 1_000_000) = sqrt(2) ≈ 1.414 → floor = 1
      expect(calcPrestigeStardust(2_000_000)).toBe(1)
    })

    it('should scale sub-linearly (sqrt)', () => {
      const stardust1M = calcPrestigeStardust(1_000_000)
      const stardust4M = calcPrestigeStardust(4_000_000)
      const stardust9M = calcPrestigeStardust(9_000_000)
      // sqrt(1)=1, sqrt(4)=2, sqrt(9)=3
      expect(stardust1M).toBe(1)
      expect(stardust4M).toBe(2)
      expect(stardust9M).toBe(3)
    })
  })

  describe('calcPrestigeThreshold', () => {
    it('should start at 1M for prestige level 0', () => {
      expect(calcPrestigeThreshold(0)).toBe(1_000_000)
    })

    it('should multiply by 10 each prestige level', () => {
      expect(calcPrestigeThreshold(1)).toBe(10_000_000)
      expect(calcPrestigeThreshold(2)).toBe(100_000_000)
      expect(calcPrestigeThreshold(3)).toBe(1_000_000_000)
    })

    it('should grow exponentially', () => {
      const t0 = calcPrestigeThreshold(0)
      const t5 = calcPrestigeThreshold(5)
      expect(t5).toBe(t0 * Math.pow(10, 5))
    })
  })

  describe('calcInflation', () => {
    it('should return 1.0 at 0 play time', () => {
      expect(calcInflation(0)).toBe(1)
    })

    it('should increase over time', () => {
      const inf1 = calcInflation(3600) // 1 hour
      const inf2 = calcInflation(7200) // 2 hours
      expect(inf1).toBeGreaterThan(1)
      expect(inf2).toBeGreaterThan(inf1)
    })

    it('should be 1.01 after 1 hour (1% per hour)', () => {
      // 1 + (3600 / 3600) * 0.01 = 1.01
      expect(calcInflation(3600)).toBeCloseTo(1.01)
    })

    it('should be 1.05 after 5 hours', () => {
      // 1 + (18000 / 3600) * 0.01 = 1 + 5 * 0.01 = 1.05
      expect(calcInflation(18000)).toBeCloseTo(1.05)
    })

    it('should reduce sell price (higher inflation = lower effective price)', () => {
      const inf0 = calcInflation(0)
      const inf10h = calcInflation(36000) // 10 hours
      // price / inflation → higher inflation means lower price
      const price0 = 100 / inf0
      const price10h = 100 / inf10h
      expect(price10h).toBeLessThan(price0)
    })

    it('should not increase too aggressively (after 1 hour only 1% reduction)', () => {
      const inflation = calcInflation(3600)
      expect(inflation).toBeCloseTo(1.01)
      // 100 / 1.01 ≈ 99.01 — only 1% reduction, manageable
      expect(100 / inflation).toBeGreaterThan(98)
    })
  })
})
