import { describe, it, expect } from 'vitest'
import {
  calcCost,
  calcOutput,
  calcPrestigeStardust,
  calcPrestigeThreshold,
  calcInflation,
  CONSTANTS,
} from '../src/games/space-factory-idle/logic/constants'

describe('constants.ts — pure math functions', () => {
  describe('calcCost', () => {
    it('returns baseCost at level 0', () => {
      expect(calcCost(100, 1.15, 0)).toBe(100)
    })

    it('applies exponential cost scaling', () => {
      // Note: floating point — 100 * 1.15^1 ≈ 114.999... → floor = 114
      expect(calcCost(100, 1.15, 1)).toBe(114)
      // 100 * 1.15^2 ≈ 132.25 → floor = 132
      expect(calcCost(100, 1.15, 2)).toBe(132)
    })

    it('floors the result', () => {
      const result = calcCost(100, 1.15, 3)
      expect(result).toBe(Math.floor(100 * Math.pow(1.15, 3)))
    })

    it('handles costMultiplier of 1 (constant cost)', () => {
      expect(calcCost(500, 1, 10)).toBe(500)
    })

    it('handles large levels', () => {
      const result = calcCost(100, 1.15, 50)
      expect(result).toBeGreaterThan(0)
      expect(result).toBe(Math.floor(100 * Math.pow(1.15, 50)))
    })
  })

  describe('calcOutput', () => {
    it('applies design doc formula: baseOutput * factoryMult * lineMult * upgradeMult * planetMult * prestigeMult', () => {
      // factoryLevel=1, lineLevel=1: (1+0.1)*(1+0.2) = 1.32
      expect(calcOutput(10, 1, 1, 1, 1, 1)).toBeCloseTo(13.2)
    })

    it('applies line level multiplier: 1 + level * 0.2', () => {
      // factoryLevel=0 to isolate
      expect(calcOutput(10, 1, 1, 1, 1, 0)).toBeCloseTo(12)  // 10 * 1.2
      expect(calcOutput(10, 2, 1, 1, 1, 0)).toBeCloseTo(14)  // 10 * 1.4
      expect(calcOutput(10, 3, 1, 1, 1, 0)).toBeCloseTo(16)  // 10 * 1.6
    })

    it('applies factory level multiplier: 1 + factoryLevel * 0.1', () => {
      // lineLevel=0 to isolate
      expect(calcOutput(10, 0, 1, 1, 1, 1)).toBeCloseTo(11)  // 10 * 1.1
      expect(calcOutput(10, 0, 1, 1, 1, 3)).toBeCloseTo(13)  // 10 * 1.3
    })

    it('applies upgrade multiplier', () => {
      expect(calcOutput(10, 1, 1.5, 1, 1, 1)).toBeCloseTo(13.2 * 1.5)
    })

    it('applies planet multiplier', () => {
      expect(calcOutput(10, 1, 1, 1.2, 1, 1)).toBeCloseTo(13.2 * 1.2)
    })

    it('applies prestige multiplier', () => {
      expect(calcOutput(10, 1, 1, 1, 2, 1)).toBeCloseTo(13.2 * 2)
    })

    it('combines all multipliers (design doc formula)', () => {
      // 10 * (1+2*0.1) * (1+2*0.2) * 1.2 * 1.5 * 1.1
      // = 10 * 1.2 * 1.4 * 1.2 * 1.5 * 1.1 = 33.264
      const result = calcOutput(10, 2, 1.2, 1.5, 1.1, 2)
      expect(result).toBeCloseTo(33.264, 1)
    })

    it('defaults factoryLevel to 1', () => {
      expect(calcOutput(10, 1, 1, 1, 1)).toBeCloseTo(13.2)
    })
  })

  describe('calcPrestigeStardust', () => {
    it('returns 0 below threshold', () => {
      expect(calcPrestigeStardust(0)).toBe(0)
      expect(calcPrestigeStardust(500_000)).toBe(0)
    })

    it('returns 1 at exactly 1M coins', () => {
      // sqrt(1_000_000 / 1_000_000) = sqrt(1) = 1
      expect(calcPrestigeStardust(1_000_000)).toBe(1)
    })

    it('returns 10 at 100M coins', () => {
      // sqrt(100_000_000 / 1_000_000) = sqrt(100) = 10
      expect(calcPrestigeStardust(100_000_000)).toBe(10)
    })

    it('floors the result', () => {
      // sqrt(2_000_000 / 1_000_000) = sqrt(2) ≈ 1.414 → floor = 1
      expect(calcPrestigeStardust(2_000_000)).toBe(1)
    })

    it('scales sub-linearly (sqrt)', () => {
      const sd1 = calcPrestigeStardust(1_000_000)
      const sd4 = calcPrestigeStardust(4_000_000)
      // sqrt(4) = 2x sqrt(1)
      expect(sd4).toBe(sd1 * 2)
    })
  })

  describe('calcPrestigeThreshold', () => {
    it('returns base threshold at level 0', () => {
      expect(calcPrestigeThreshold(0)).toBe(CONSTANTS.PRESTIGE_BASE_THRESHOLD)
    })

    it('multiplies by 10 each level', () => {
      expect(calcPrestigeThreshold(1)).toBe(10_000_000)
      expect(calcPrestigeThreshold(2)).toBe(100_000_000)
    })

    it('grows exponentially', () => {
      const t0 = calcPrestigeThreshold(0)
      const t3 = calcPrestigeThreshold(3)
      expect(t3).toBe(t0 * 1000) // 10^3
    })
  })

  describe('calcInflation', () => {
    it('returns 1.0 at 0 play time', () => {
      expect(calcInflation(0)).toBeCloseTo(1.0)
    })

    it('decreases over time (discount factor)', () => {
      const factor1min = calcInflation(60) // 1 minute
      expect(factor1min).toBeCloseTo(0.95) // 1 - 1*0.05
    })

    it('multiplies with base price to reduce sell price over time', () => {
      const factor0 = calcInflation(0)
      const factor2min = calcInflation(120)
      // price * factor → lower factor means lower price
      expect(100 * factor2min).toBeLessThan(100 * factor0)
    })

    it('floors at 0.10 after 18+ minutes', () => {
      // floor(1080/60) = 18 → 1 - 18*0.05 = 0.1
      expect(calcInflation(1080)).toBeCloseTo(0.10)
      // Even at 10 hours (36000s), still 0.10
      expect(calcInflation(36000)).toBeCloseTo(0.10)
    })
  })

  describe('CONSTANTS', () => {
    it('has expected values', () => {
      expect(CONSTANTS.PRESTIGE_BASE_THRESHOLD).toBe(1_000_000)
      expect(CONSTANTS.PRESTIGE_THRESHOLD_MULT).toBe(10)
      expect(CONSTANTS.OFFLINE_EFFICIENCY).toBe(0.5)
      expect(CONSTANTS.MAX_OFFLINE_HOURS).toBe(8)
      expect(CONSTANTS.INFLATION_RATE_PER_HOUR).toBe(0.01)
      expect(CONSTANTS.TICK_INTERVAL).toBe(1000)
      expect(CONSTANTS.COMBO_WINDOW).toBe(3000)
      expect(CONSTANTS.COMBO_MAX_MULT).toBe(5)
      expect(CONSTANTS.EVENT_BASE_CHANCE).toBe(0.002)
    })

    it('has consistent ratios', () => {
      expect(CONSTANTS.IDLE_RATIO + CONSTANTS.ACTIVE_RATIO).toBeCloseTo(1.0)
    })
  })
})
