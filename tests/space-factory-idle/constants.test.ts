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
    it('should return baseOutput * factoryMult * lineMult at level 1, factoryLevel 1', () => {
      // (1 + 1*0.1) * (1 + 1*0.2) = 1.1 * 1.2 = 1.32
      expect(calcOutput(10, 1, 1, 1, 1, 1)).toBeCloseTo(10 * 1.1 * 1.2)
    })

    it('should scale with line level (lineMult = 1 + level*0.2)', () => {
      // factoryLevel=0 to isolate lineLevel
      // Level 1: 10 * 1.0 * 1.2 = 12
      // Level 2: 10 * 1.0 * 1.4 = 14
      // Level 3: 10 * 1.0 * 1.6 = 16
      expect(calcOutput(10, 1, 1, 1, 1, 0)).toBeCloseTo(12)
      expect(calcOutput(10, 2, 1, 1, 1, 0)).toBeCloseTo(14)
      expect(calcOutput(10, 3, 1, 1, 1, 0)).toBeCloseTo(16)
    })

    it('should scale with factory level (factoryMult = 1 + factoryLevel*0.1)', () => {
      // lineLevel=0 to isolate factoryLevel
      expect(calcOutput(10, 0, 1, 1, 1, 1)).toBeCloseTo(11)
      expect(calcOutput(10, 0, 1, 1, 1, 3)).toBeCloseTo(13)
      expect(calcOutput(10, 0, 1, 1, 1, 5)).toBeCloseTo(15)
    })

    it('should multiply by upgradeMult', () => {
      expect(calcOutput(10, 1, 2, 1, 1, 1)).toBeCloseTo(10 * 1.1 * 1.2 * 2)
    })

    it('should multiply by planetMult', () => {
      expect(calcOutput(10, 1, 1, 1.5, 1, 1)).toBeCloseTo(10 * 1.1 * 1.2 * 1.5)
    })

    it('should multiply by prestigeMult', () => {
      expect(calcOutput(10, 1, 1, 1, 3, 1)).toBeCloseTo(10 * 1.1 * 1.2 * 3)
    })

    it('should combine all multipliers (design doc formula)', () => {
      // 10 * (1 + 3*0.1) * (1 + 2*0.2) * 2 * 1.5 * 2
      // = 10 * 1.3 * 1.4 * 2 * 1.5 * 2 = 109.2
      expect(calcOutput(10, 2, 2, 1.5, 2, 3)).toBeCloseTo(10 * 1.3 * 1.4 * 2 * 1.5 * 2)
    })

    it('should handle baseOutput of 0', () => {
      expect(calcOutput(0, 5, 2, 1.5, 1, 3)).toBe(0)
    })

    it('should default factoryLevel to 1', () => {
      expect(calcOutput(10, 1, 1, 1, 1)).toBeCloseTo(10 * 1.1 * 1.2)
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
      expect(calcInflation(0)).toBeCloseTo(1.0)
    })

    it('should decrease over time (discount factor)', () => {
      const inf1 = calcInflation(60)   // 1 minute
      const inf2 = calcInflation(120)  // 2 minutes
      expect(inf1).toBeLessThan(1)
      expect(inf2).toBeLessThan(inf1)
    })

    it('should be 0.95 after 1 minute (5% per min)', () => {
      // floor(60/60) = 1 → 1 - 1*0.05 = 0.95
      expect(calcInflation(60)).toBeCloseTo(0.95)
    })

    it('should be 0.50 after 10 minutes', () => {
      // floor(600/60) = 10 → 1 - 10*0.05 = 0.50
      expect(calcInflation(600)).toBeCloseTo(0.50)
    })

    it('should floor at 0.10 (never below 10% of base price)', () => {
      // floor(3600/60) = 60 → 1 - 60*0.05 = -2.0 → clamped to 0.1
      expect(calcInflation(3600)).toBeCloseTo(0.10)
    })

    it('should multiply with base price to reduce sell price over time', () => {
      const factor0 = calcInflation(0)
      const factor10m = calcInflation(600)
      // price * factor → lower factor means lower price
      const price0 = 100 * factor0
      const price10m = 100 * factor10m
      expect(price10m).toBeLessThan(price0)
    })

    it('should not reduce too aggressively (after 1 min only 5% reduction)', () => {
      const factor = calcInflation(60)
      expect(factor).toBeCloseTo(0.95)
      // 100 * 0.95 = 95 — only 5% reduction, manageable
      expect(100 * factor).toBeGreaterThan(90)
    })
  })
})
