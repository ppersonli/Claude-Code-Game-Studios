/**
 * Space Factory Idle — Income Tests
 * Tests for calcBaseIncome, calcInflationMultiplier, calcPrestigeBonus, calcFinalIncome
 */

import { describe, it, expect } from 'vitest'
import {
  calcBaseIncome,
  calcInflationMultiplier,
  calcPrestigeBonus,
  calcFinalIncome,
} from '../../src/games/space-factory-idle/logic/income'

/* ── calcBaseIncome ────────────────────────────────────────────── */

describe('calcBaseIncome', () => {
  it('returns productValue when workerSpeed=1 and factoryLevel=1', () => {
    expect(calcBaseIncome(10, 1, 1)).toBe(10)
  })

  it('scales with workerSpeed', () => {
    expect(calcBaseIncome(10, 2, 1)).toBe(20)
    expect(calcBaseIncome(10, 3, 1)).toBe(30)
  })

  it('scales with factoryLevel', () => {
    expect(calcBaseIncome(10, 1, 2)).toBe(20)
    expect(calcBaseIncome(10, 1, 5)).toBe(50)
  })

  it('combines both multipliers', () => {
    expect(calcBaseIncome(10, 2, 3)).toBe(60)
  })

  it('handles zero productValue', () => {
    expect(calcBaseIncome(0, 10, 10)).toBe(0)
  })
})

/* ── calcInflationMultiplier ───────────────────────────────────── */

describe('calcInflationMultiplier', () => {
  it('returns 1.0 at 0 minutes', () => {
    expect(calcInflationMultiplier(0)).toBeCloseTo(1.0, 10)
  })

  it('decays over time', () => {
    const at10 = calcInflationMultiplier(10)
    const at60 = calcInflationMultiplier(60)
    expect(at10).toBeGreaterThan(at60)
  })

  it('approaches 0 but never reaches it', () => {
    const at1000 = calcInflationMultiplier(1000)
    expect(at1000).toBeGreaterThan(0)
  })
})

/* ── calcPrestigeBonus ─────────────────────────────────────────── */

describe('calcPrestigeBonus', () => {
  it('returns 1.0 with 0 stardust', () => {
    expect(calcPrestigeBonus(0)).toBe(1.0)
  })

  it('increases with stardust', () => {
    expect(calcPrestigeBonus(100)).toBeCloseTo(1.1, 10)
    expect(calcPrestigeBonus(1000)).toBeCloseTo(2.0, 10)
  })

  it('adds 0.1% per stardust', () => {
    // 1 + 1/1000 = 1.001
    expect(calcPrestigeBonus(1)).toBeCloseTo(1.001, 10)
  })
})

/* ── calcFinalIncome ───────────────────────────────────────────── */

describe('calcFinalIncome', () => {
  it('combines base, inflation, and prestige', () => {
    const result = calcFinalIncome(10, 1, 1, 0, 0)
    // base = 10, inflation = 1.0, prestige = 1.0
    expect(result).toBeCloseTo(10, 10)
  })

  it('scales with all parameters', () => {
    const base = calcFinalIncome(10, 1, 1, 0, 0)
    const doubled = calcFinalIncome(20, 1, 1, 0, 0)
    expect(doubled).toBeCloseTo(base * 2, 10)
  })

  it('inflation reduces income over time', () => {
    const early = calcFinalIncome(10, 1, 1, 0, 0)
    const late = calcFinalIncome(10, 1, 1, 100, 0)
    expect(late).toBeLessThan(early)
  })

  it('stardust increases income', () => {
    const noPrestige = calcFinalIncome(10, 1, 1, 0, 0)
    const withPrestige = calcFinalIncome(10, 1, 1, 0, 500)
    expect(withPrestige).toBeGreaterThan(noPrestige)
  })
})
