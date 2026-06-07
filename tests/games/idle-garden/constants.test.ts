/**
 * Idle Garden Tycoon — Constants & Pure Math Functions Tests
 * TDD: These test the data-driven formulas in constants.ts
 */

import { describe, it, expect } from 'vitest'
import {
  CONSTANTS,
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
} from '../../../src/games/idle-garden/data/constants'

describe('CONSTANTS', () => {
  it('has reasonable starting values', () => {
    expect(CONSTANTS.STARTING_POTS).toBe(4)
    expect(CONSTANTS.OFFLINE_EFFICIENCY).toBe(0.5)
    expect(CONSTANTS.MAX_OFFLINE_HOURS).toBe(8)
    expect(CONSTANTS.WATER_BOOST).toBe(0.2)
    expect(CONSTANTS.PRESTIGE_BASE_THRESHOLD).toBe(100_000)
    expect(CONSTANTS.COMBO_WINDOW).toBe(3000)
    expect(CONSTANTS.COMBO_MAX_MULT).toBe(5)
  })
})

describe('calcCost', () => {
  it('returns baseCost at level 0', () => {
    expect(calcCost(100, 1.5, 0)).toBe(100)
  })

  it('scales exponentially with level', () => {
    // 100 * 1.5^1 = 150
    expect(calcCost(100, 1.5, 1)).toBe(150)
    // 100 * 1.5^2 = 225
    expect(calcCost(100, 1.5, 2)).toBe(225)
    // 100 * 1.5^3 = 337.5 → 337
    expect(calcCost(100, 1.5, 3)).toBe(337)
  })

  it('floors the result', () => {
    // 50 * 1.3^1 = 65
    expect(calcCost(50, 1.3, 1)).toBe(65)
    // 50 * 1.3^2 = 84.5 → 84
    expect(calcCost(50, 1.3, 2)).toBe(84)
  })

  it('handles costMult of 1 (flat cost)', () => {
    expect(calcCost(100, 1, 5)).toBe(100)
    expect(calcCost(100, 1, 100)).toBe(100)
  })

  it('handles large levels', () => {
    const result = calcCost(10, 2, 20)
    // 10 * 2^20 = 10 * 1048576 = 10485760
    expect(result).toBe(10_485_760)
  })
})

describe('calcGrowthProgress', () => {
  it('returns 0 when no time has elapsed', () => {
    expect(calcGrowthProgress(0, 10, false)).toBe(0)
  })

  it('returns 1 when elapsed equals growTime', () => {
    expect(calcGrowthProgress(10, 10, false)).toBe(1)
  })

  it('returns > 1 capped at 1 when elapsed exceeds growTime', () => {
    expect(calcGrowthProgress(20, 10, false)).toBe(1)
  })

  it('returns fractional progress mid-growth', () => {
    expect(calcGrowthProgress(5, 10, false)).toBe(0.5)
    expect(calcGrowthProgress(3, 10, false)).toBe(0.3)
  })

  it('applies 20% water boost (faster growth)', () => {
    // With water: effectiveTime = 10 / 1.2 = 8.33s
    // At 8.33s: progress = 1.0
    const progressWithWater = calcGrowthProgress(8.33, 10, true)
    expect(progressWithWater).toBeCloseTo(1.0, 1)

    // Without water at same time: 8.33/10 = 0.833
    const progressWithout = calcGrowthProgress(8.33, 10, false)
    expect(progressWithout).toBeCloseTo(0.833, 2)
  })

  it('applies growth multiplier from sun points', () => {
    // growthMult = 1.5 → effectiveTime = 10 / 1.5 = 6.67s
    const progress = calcGrowthProgress(6.67, 10, false, 1.5)
    expect(progress).toBeCloseTo(1.0, 1)
  })

  it('combines water boost and growth multiplier', () => {
    // waterMult = 1.2, growthMult = 1.5 → effectiveTime = 10 / (1.2 * 1.5) = 5.56s
    const progress = calcGrowthProgress(5.56, 10, true, 1.5)
    expect(progress).toBeCloseTo(1.0, 1)
  })

  it('returns 1 immediately when growTime is 0', () => {
    expect(calcGrowthProgress(0, 0, false)).toBe(1)
  })

  it('returns negative value for negative elapsed time (no clamping)', () => {
    // Function does not clamp negative values — caller should guard
    expect(calcGrowthProgress(-5, 10, false)).toBe(-0.5)
  })
})

describe('calcSellPrice', () => {
  it('returns base price with no multiplier', () => {
    expect(calcSellPrice(100)).toBe(100)
  })

  it('applies price multiplier', () => {
    expect(calcSellPrice(100, 1.5)).toBe(150)
    expect(calcSellPrice(100, 2)).toBe(200)
  })

  it('floors the result', () => {
    expect(calcSellPrice(100, 1.3)).toBe(130)
    expect(calcSellPrice(30, 1.5)).toBe(45)
  })

  it('handles zero base price', () => {
    expect(calcSellPrice(0, 1.5)).toBe(0)
  })
})

describe('calcXpRequired', () => {
  it('returns XP_BASE for level 1', () => {
    // floor(100 * 1^1.5) = 100
    expect(calcXpRequired(1)).toBe(100)
  })

  it('scales with level^1.5', () => {
    // floor(100 * 2^1.5) = floor(100 * 2.828) = 282
    expect(calcXpRequired(2)).toBe(282)
    // floor(100 * 3^1.5) = floor(100 * 5.196) = 519
    expect(calcXpRequired(3)).toBe(519)
  })

  it('returns 0 for level 0', () => {
    // floor(100 * 0^1.5) = 0
    expect(calcXpRequired(0)).toBe(0)
  })
})

describe('calcSunPoints', () => {
  it('returns 0 below SP_FORMULA_DIVISOR', () => {
    expect(calcSunPoints(0)).toBe(0)
    expect(calcSunPoints(50_000)).toBe(0)
    expect(calcSunPoints(99_999)).toBe(0)
  })

  it('returns 1 at exactly SP_FORMULA_DIVISOR', () => {
    // floor(sqrt(100000 / 100000)) = floor(sqrt(1)) = 1
    expect(calcSunPoints(100_000)).toBe(1)
  })

  it('scales with sqrt(totalCoins / divisor)', () => {
    // floor(sqrt(400000 / 100000)) = floor(sqrt(4)) = 2
    expect(calcSunPoints(400_000)).toBe(2)
    // floor(sqrt(900000 / 100000)) = floor(sqrt(9)) = 3
    expect(calcSunPoints(900_000)).toBe(3)
    // floor(sqrt(10000000 / 100000)) = floor(sqrt(100)) = 10
    expect(calcSunPoints(10_000_000)).toBe(10)
  })

  it('floors the result', () => {
    // floor(sqrt(200000 / 100000)) = floor(sqrt(2)) = floor(1.414) = 1
    expect(calcSunPoints(200_000)).toBe(1)
  })
})

describe('calcPrestigeThreshold', () => {
  it('returns base threshold at prestige level 0', () => {
    expect(calcPrestigeThreshold(0)).toBe(100_000)
  })

  it('scales by PRESTIGE_THRESHOLD_MULT per level', () => {
    // 100000 * 5^1 = 500000
    expect(calcPrestigeThreshold(1)).toBe(500_000)
    // 100000 * 5^2 = 2500000
    expect(calcPrestigeThreshold(2)).toBe(2_500_000)
    // 100000 * 5^3 = 12500000
    expect(calcPrestigeThreshold(3)).toBe(12_500_000)
  })
})

describe('calcGrowthMultiplier', () => {
  it('returns 1 with no upgrades', () => {
    expect(calcGrowthMultiplier(0)).toBe(1)
  })

  it('adds 5% per upgrade', () => {
    expect(calcGrowthMultiplier(1)).toBeCloseTo(1.05, 2)
    expect(calcGrowthMultiplier(2)).toBeCloseTo(1.10, 2)
    expect(calcGrowthMultiplier(10)).toBeCloseTo(1.50, 2)
  })
})

describe('calcPriceMultiplier', () => {
  it('returns 1 with no upgrades', () => {
    expect(calcPriceMultiplier(0)).toBe(1)
  })

  it('adds 10% per upgrade', () => {
    expect(calcPriceMultiplier(1)).toBeCloseTo(1.10, 2)
    expect(calcPriceMultiplier(2)).toBeCloseTo(1.20, 2)
    expect(calcPriceMultiplier(5)).toBeCloseTo(1.50, 2)
  })
})

describe('calcPotsForLevel', () => {
  it('returns STARTING_POTS for garden level 0', () => {
    expect(calcPotsForLevel(0)).toBe(4)
  })

  it('adds 3 pots per garden level', () => {
    expect(calcPotsForLevel(1)).toBe(7)
    expect(calcPotsForLevel(2)).toBe(10)
    expect(calcPotsForLevel(5)).toBe(19)
  })
})

describe('calcOfflineEarnings', () => {
  it('returns 0 for very short offline time (< 10s)', () => {
    expect(calcOfflineEarnings(100, 5)).toBe(0)
  })

  it('returns 0 for zero coins per second', () => {
    expect(calcOfflineEarnings(0, 3600)).toBe(0)
  })

  it('calculates earnings with 50% efficiency', () => {
    // 10 coins/sec * 3600s * 0.5 = 18000
    expect(calcOfflineEarnings(10, 3600)).toBe(18_000)
  })

  it('caps at MAX_OFFLINE_HOURS (8 hours)', () => {
    // 10 coins/sec * (8*3600) * 0.5 = 144000
    const maxEarnings = calcOfflineEarnings(10, 999_999)
    expect(maxEarnings).toBe(144_000)
  })

  it('floors the result', () => {
    // 7 coins/sec * 100s * 0.5 = 350
    expect(calcOfflineEarnings(7, 100)).toBe(350)
  })
})
