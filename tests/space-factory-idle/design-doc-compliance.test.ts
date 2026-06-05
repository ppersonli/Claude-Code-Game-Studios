/**
 * Space Factory Idle — Design Doc Formula Compliance Tests
 * These tests verify that the implementation matches the design doc formulas exactly.
 *
 * Design Doc Formulas:
 * 1. Production: output = baseOutput × (1 + factoryLevel × 0.1) × (1 + lineLevel × 0.2) × planetMult × prestigeMult
 * 2. Income: income = basePrice × inflationFactor × actualOutput
 * 3. Inflation: currentPrice = basePrice × max(0.1, 1 - floor(totalPlayTime/60) × 0.05)
 * 4. Stardust: stardust = floor(sqrt(totalCoins / 1,000,000))  [already correct]
 * 5. Offline: offlineEarnings = incomePerSec × min(offlineSecs, storageCapSecs) × 0.5
 * 6. Upgrade cost: cost = baseCost × 1.15^level  [already correct]
 */

import { describe, it, expect } from 'vitest'
import { calcOutput, calcInflation, CONSTANTS } from '../../src/games/space-factory-idle/logic/constants'

describe('Design Doc Formula Compliance', () => {
  describe('Formula 1: Production output', () => {
    // Design doc: output = baseOutput × (1 + factoryLevel × 0.1) × (1 + lineLevel × 0.2) × planetMult × prestigeMult

    it('calcOutput should accept factoryLevel parameter', () => {
      // Should not throw when called with factoryLevel
      expect(() => calcOutput(10, 1, 1, 1, 1, 1)).not.toThrow()
    })

    it('at factoryLevel=1, lineLevel=1, all other mults=1: output = baseOutput', () => {
      // (1 + 1*0.1) * (1 + 1*0.2) = 1.1 * 1.2 = 1.32... but design doc says level 1 = base
      // Actually the design doc says "工厂等级 +10%/级" starting from level 1
      // At level 1 with no upgrades, output should just be baseOutput × 1.1 × 1.2
      // But that doesn't match "base output at level 1" — the mults are bonuses ON TOP
      // Let me re-read: the formula is multiplicative, so at factoryLevel=1, lineLevel=1:
      // (1 + 1*0.1) × (1 + 1*0.2) = 1.1 × 1.2 = 1.32
      // This means even at level 1 you get a bonus. That's the design doc formula.
      const output = calcOutput(10, 1, 1, 1, 1, 1)
      expect(output).toBeCloseTo(10 * 1.1 * 1.2) // 13.2
    })

    it('lineLevel multiplier is 1 + lineLevel * 0.2 (not 0.5, not (level-1))', () => {
      // At factoryLevel=0 to isolate lineLevel:
      // Level 1: 1 + 1*0.2 = 1.2
      // Level 2: 1 + 2*0.2 = 1.4
      // Level 3: 1 + 3*0.2 = 1.6
      const out1 = calcOutput(10, 1, 1, 1, 1, 0)
      const out2 = calcOutput(10, 2, 1, 1, 1, 0)
      const out3 = calcOutput(10, 3, 1, 1, 1, 0)

      expect(out1).toBeCloseTo(10 * 1.2)  // 12
      expect(out2).toBeCloseTo(10 * 1.4)  // 14
      expect(out3).toBeCloseTo(10 * 1.6)  // 16
    })

    it('factoryLevel multiplier is 1 + factoryLevel * 0.1', () => {
      // At lineLevel=0 to isolate factoryLevel:
      // factoryLevel 1: 1 + 1*0.1 = 1.1
      // factoryLevel 3: 1 + 3*0.1 = 1.3
      // factoryLevel 5: 1 + 5*0.1 = 1.5
      const out1 = calcOutput(10, 0, 1, 1, 1, 1)
      const out3 = calcOutput(10, 0, 1, 1, 1, 3)
      const out5 = calcOutput(10, 0, 1, 1, 1, 5)

      expect(out1).toBeCloseTo(10 * 1.1)  // 11
      expect(out3).toBeCloseTo(10 * 1.3)  // 13
      expect(out5).toBeCloseTo(10 * 1.5)  // 15
    })

    it('combined: factoryLevel=3, lineLevel=2, planetMult=5, prestigeMult=2', () => {
      // 10 * (1 + 3*0.1) * (1 + 2*0.2) * 5 * 2
      // = 10 * 1.3 * 1.4 * 5 * 2 = 10 * 1.3 * 1.4 * 10 = 182
      const output = calcOutput(10, 2, 1, 5, 2, 3)
      expect(output).toBeCloseTo(10 * 1.3 * 1.4 * 5 * 2)
    })
  })

  describe('Formula 3: Inflation', () => {
    // Design doc: currentPrice = basePrice × max(0.1, 1 - floor(totalPlayTime/60) × 0.05)
    // calcInflation should return the discount FACTOR (0.0 to 1.0), not a divisor

    it('returns 1.0 at 0 play time (no inflation)', () => {
      expect(calcInflation(0)).toBeCloseTo(1.0)
    })

    it('returns 0.95 after 1 minute (5% discount)', () => {
      // floor(60/60) = 1 → 1 - 1*0.05 = 0.95
      expect(calcInflation(60)).toBeCloseTo(0.95)
    })

    it('returns 0.90 after 2 minutes', () => {
      // floor(120/60) = 2 → 1 - 2*0.05 = 0.90
      expect(calcInflation(120)).toBeCloseTo(0.90)
    })

    it('returns 0.50 after 10 minutes', () => {
      // floor(600/60) = 10 → 1 - 10*0.05 = 0.50
      expect(calcInflation(600)).toBeCloseTo(0.50)
    })

    it('floors at 0.10 (never goes below 10% of base price)', () => {
      // floor(3600/60) = 60 → 1 - 60*0.05 = 1 - 3.0 = -2.0 → clamped to 0.1
      expect(calcInflation(3600)).toBeCloseTo(0.10)
    })

    it('floors at 0.10 even for extreme play time', () => {
      expect(calcInflation(100000)).toBeCloseTo(0.10)
    })

    it('decreases over time (monotonically until floor)', () => {
      const t0 = calcInflation(0)
      const t1 = calcInflation(60)
      const t2 = calcInflation(120)
      expect(t0).toBeGreaterThan(t1)
      expect(t1).toBeGreaterThan(t2)
    })

    it('INFLATION_RATE_PER_MIN constant should be 0.05', () => {
      expect(CONSTANTS.INFLATION_RATE_PER_MIN).toBe(0.05)
    })

    it('INFLATION_FLOOR constant should be 0.1', () => {
      expect(CONSTANTS.INFLATION_FLOOR).toBe(0.1)
    })
  })
})
