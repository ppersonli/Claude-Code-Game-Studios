/**
 * Space Factory Idle — Constants & Pure Math Tests
 * Tests for calcCost, calcOutput, calcInflation, calcPrestigeStardust, calcPrestigeThreshold
 */

import { describe, it, expect } from 'vitest'
import {
  CONSTANTS,
  calcCost,
  calcOutput,
  calcInflation,
  calcPrestigeStardust,
  calcPrestigeThreshold,
} from '../../src/games/space-factory-idle/logic/constants'

/* ── calcCost ──────────────────────────────────────────────────── */

describe('calcCost', () => {
  it('returns baseCost at level 0', () => {
    expect(calcCost(100, 1.15, 0)).toBe(100)
  })

  it('scales exponentially with level', () => {
    const level1 = calcCost(100, 1.15, 1)
    const level2 = calcCost(100, 1.15, 2)
    expect(level1).toBeGreaterThan(100)
    expect(level2).toBeGreaterThan(level1)
  })

  it('floors the result', () => {
    // 100 * 1.15^1 = 115, which is already integer
    // Use values that produce non-integer
    const result = calcCost(100, 1.12, 3)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('handles level 10 correctly', () => {
    // 100 * 1.15^10 ≈ 404.56 → floor = 404
    const result = calcCost(100, 1.15, 10)
    expect(result).toBe(404)
  })
})

/* ── calcOutput ────────────────────────────────────────────────── */

describe('calcOutput', () => {
  it('returns baseOutput at level 1 with no multipliers', () => {
    // factoryMult = 1 + 1*0.1 = 1.1
    // lineMult = 1 + 1*0.2 = 1.2
    // upgradeMult = 1, planetMult = 1, prestigeMult = 1
    // total = baseOutput * 1.1 * 1.2 * 1 * 1 * 1 = baseOutput * 1.32
    const result = calcOutput(10, 1, 1, 1, 1, 1)
    expect(result).toBeCloseTo(10 * 1.1 * 1.2, 10)
  })

  it('increases with factory level', () => {
    const level1 = calcOutput(10, 1, 1, 1, 1, 1)
    const level5 = calcOutput(10, 1, 1, 1, 1, 5)
    expect(level5).toBeGreaterThan(level1)
  })

  it('increases with line level', () => {
    const level1 = calcOutput(10, 1, 1, 1, 1, 1)
    const level5 = calcOutput(10, 5, 1, 1, 1, 1)
    expect(level5).toBeGreaterThan(level1)
  })

  it('applies upgrade multiplier', () => {
    const base = calcOutput(10, 1, 1, 1, 1, 1)
    const upgraded = calcOutput(10, 1, 2, 1, 1, 1)
    expect(upgraded).toBeCloseTo(base * 2, 10)
  })

  it('applies planet multiplier', () => {
    const base = calcOutput(10, 1, 1, 1, 1, 1)
    const planet2x = calcOutput(10, 1, 1, 2, 1, 1)
    expect(planet2x).toBeCloseTo(base * 2, 10)
  })

  it('applies prestige multiplier', () => {
    const base = calcOutput(10, 1, 1, 1, 1, 1)
    const prestiged = calcOutput(10, 1, 1, 1, 3, 1)
    expect(prestiged).toBeCloseTo(base * 3, 10)
  })

  it('combines all multipliers multiplicatively', () => {
    // factory=2 → 1.2, line=2 → 1.4, upgrade=1.5, planet=2, prestige=2
    const result = calcOutput(10, 2, 1.5, 2, 2, 2)
    const expected = 10 * 1.2 * 1.4 * 1.5 * 2 * 2
    expect(result).toBeCloseTo(expected, 10)
  })
})

/* ── calcInflation ─────────────────────────────────────────────── */

describe('calcInflation', () => {
  it('returns 1.0 at 0 seconds play time', () => {
    expect(calcInflation(0)).toBe(1.0)
  })

  it('decreases by 5% per minute', () => {
    // At 60 seconds (1 minute): 1 - 1*0.05 = 0.95
    expect(calcInflation(60)).toBeCloseTo(0.95, 10)
  })

  it('floors at 10% (INFLATION_FLOOR)', () => {
    // At 1800 seconds (30 minutes): 1 - 30*0.05 = -0.5 → max(0.1, -0.5) = 0.1
    expect(calcInflation(1800)).toBe(0.1)
  })

  it('decreases progressively', () => {
    const at1min = calcInflation(60)
    const at5min = calcInflation(300)
    const at10min = calcInflation(600)
    expect(at1min).toBeGreaterThan(at5min)
    expect(at5min).toBeGreaterThan(at10min)
  })

  it('uses floor of minutes', () => {
    // At 59 seconds = 0 minutes → no discount
    expect(calcInflation(59)).toBe(1.0)
    // At 60 seconds = 1 minute → 5% discount
    expect(calcInflation(60)).toBeCloseTo(0.95, 10)
  })
})

/* ── calcPrestigeStardust ──────────────────────────────────────── */

describe('calcPrestigeStardust', () => {
  it('returns 0 below 1M coins', () => {
    expect(calcPrestigeStardust(999_999)).toBe(0)
    expect(calcPrestigeStardust(0)).toBe(0)
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

  it('increases with more coins', () => {
    const dust1 = calcPrestigeStardust(1_000_000)
    const dust2 = calcPrestigeStardust(4_000_000)
    expect(dust2).toBeGreaterThan(dust1)
  })
})

/* ── calcPrestigeThreshold ─────────────────────────────────────── */

describe('calcPrestigeThreshold', () => {
  it('returns base threshold at level 0', () => {
    expect(calcPrestigeThreshold(0)).toBe(CONSTANTS.PRESTIGE_BASE_THRESHOLD)
  })

  it('multiplies by 10 for each level', () => {
    const level0 = calcPrestigeThreshold(0)
    const level1 = calcPrestigeThreshold(1)
    const level2 = calcPrestigeThreshold(2)
    expect(level1).toBe(level0 * 10)
    expect(level2).toBe(level0 * 100)
  })

  it('increases exponentially', () => {
    const thresholds = [0, 1, 2, 3].map(calcPrestigeThreshold)
    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1])
    }
  })
})
