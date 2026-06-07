/**
 * Space Factory Idle — Prestige System Tests
 * Tests for canPrestige, performPrestige, canUnlockPlanet, calcStardustGain
 */

import { describe, it, expect } from 'vitest'
import {
  canPrestige,
  performPrestige,
  calcEarnableStardust,
  calcStardustGain,
  canUnlockPlanet,
  calcUpgradeCost,
  calcWorkerSpeed,
  calcFactoryMultiplier,
} from '../../src/games/space-factory-idle/logic/prestige'
import { createDefaultState } from '../../src/games/space-factory-idle/logic/game-state'

/* ── canPrestige ───────────────────────────────────────────────── */

describe('canPrestige', () => {
  it('returns false with 0 coins', () => {
    const state = createDefaultState()
    expect(canPrestige(state)).toBe(false)
  })

  it('returns false below threshold', () => {
    const state = createDefaultState()
    state.totalCoins = 999_999
    expect(canPrestige(state)).toBe(false)
  })

  it('returns true at exactly 1M coins (level 0)', () => {
    const state = createDefaultState()
    state.totalCoins = 1_000_000
    expect(canPrestige(state)).toBe(true)
  })

  it('returns true above threshold', () => {
    const state = createDefaultState()
    state.totalCoins = 10_000_000
    expect(canPrestige(state)).toBe(true)
  })
})

/* ── performPrestige ───────────────────────────────────────────── */

describe('performPrestige', () => {
  it('returns 0 when cannot prestige', () => {
    const state = createDefaultState()
    expect(performPrestige(state)).toBe(0)
  })

  it('awards stardust on successful prestige', () => {
    const state = createDefaultState()
    state.totalCoins = 1_000_000
    const earned = performPrestige(state)
    expect(earned).toBe(1) // sqrt(1) = 1
  })

  it('resets coins to 0', () => {
    const state = createDefaultState()
    state.totalCoins = 4_000_000
    state.coins = 4_000_000
    performPrestige(state)
    expect(state.coins).toBe(0)
    expect(state.totalCoins).toBe(0)
  })

  it('increments prestige level and count', () => {
    const state = createDefaultState()
    state.totalCoins = 1_000_000
    performPrestige(state)
    expect(state.prestigeLevel).toBe(1)
    expect(state.prestigeCount).toBe(1)
  })

  it('accumulates stardust', () => {
    const state = createDefaultState()
    state.totalCoins = 1_000_000
    performPrestige(state) // earn 1 stardust
    expect(state.starDust).toBe(1)

    // After first prestige, threshold is 10M (level 1)
    state.totalCoins = 100_000_000
    performPrestige(state) // earn 10 more stardust (sqrt(100))
    expect(state.starDust).toBe(11) // 1 + 10
  })

  it('updates prestige multiplier', () => {
    const state = createDefaultState()
    state.totalCoins = 1_000_000
    performPrestige(state) // 1 stardust → 1 + 1*0.1 = 1.1
    expect(state.prestigeMult).toBeCloseTo(1.1, 10)
  })

  it('resets production lines to default', () => {
    const state = createDefaultState()
    state.totalCoins = 1_000_000
    state.productionLines['earth'].push({
      recipeId: 'advanced-alloy',
      level: 5,
      stock: 100,
      maxStock: 50,
      automated: true,
    })
    performPrestige(state)
    expect(state.productionLines['earth'].length).toBe(1)
    expect(state.productionLines['earth'][0].recipeId).toBe('ore-smelt')
  })

  it('resets upgrades and employees', () => {
    const state = createDefaultState()
    state.totalCoins = 1_000_000
    state.upgrades = { 'auto-sell': 3, 'offline-earn': 1 }
    state.employees = { engineer: 2 }
    performPrestige(state)
    expect(Object.keys(state.upgrades).length).toBe(0)
    expect(Object.keys(state.employees).length).toBe(0)
  })

  it('preserves achievements', () => {
    const state = createDefaultState()
    state.totalCoins = 1_000_000
    state.achievements = ['first-produce', 'millionaire']
    performPrestige(state)
    expect(state.achievements).toContain('first-produce')
    expect(state.achievements).toContain('millionaire')
  })

  it('resets play time (inflation reset)', () => {
    const state = createDefaultState()
    state.totalCoins = 1_000_000
    state.totalPlayTime = 3600
    performPrestige(state)
    expect(state.totalPlayTime).toBe(0)
  })

  it('resets unlocked planets to earth only', () => {
    const state = createDefaultState()
    state.totalCoins = 1_000_000
    state.unlockedPlanets = ['earth', 'moon', 'mars']
    performPrestige(state)
    expect(state.unlockedPlanets).toEqual(['earth'])
  })
})

/* ── calcEarnableStardust ──────────────────────────────────────── */

describe('calcEarnableStardust', () => {
  it('returns 0 below threshold', () => {
    const state = createDefaultState()
    state.totalCoins = 500_000
    expect(calcEarnableStardust(state)).toBe(0)
  })

  it('returns 1 at 1M coins', () => {
    const state = createDefaultState()
    state.totalCoins = 1_000_000
    expect(calcEarnableStardust(state)).toBe(1)
  })
})

/* ── Legacy Functions ──────────────────────────────────────────── */

describe('calcStardustGain (legacy)', () => {
  it('returns 0 below 1M', () => {
    expect(calcStardustGain(999_999)).toBe(0)
  })

  it('returns 1 at 1M', () => {
    expect(calcStardustGain(1_000_000)).toBe(1)
  })

  it('floors sqrt', () => {
    expect(calcStardustGain(2_000_000)).toBe(1)
  })
})

describe('canUnlockPlanet', () => {
  it('can unlock earth with 0 stardust', () => {
    expect(canUnlockPlanet(0, 0)).toBe(true)
  })

  it('cannot unlock moon with 0 stardust', () => {
    expect(canUnlockPlanet(0, 1)).toBe(false)
  })

  it('can unlock moon with 100 stardust', () => {
    expect(canUnlockPlanet(100, 1)).toBe(true)
  })

  it('cannot unlock out of range planet', () => {
    expect(canUnlockPlanet(99999, 10)).toBe(false)
  })
})

describe('calcUpgradeCost', () => {
  it('returns baseCost at level 0', () => {
    expect(calcUpgradeCost(100, 0)).toBe(100)
  })

  it('scales with 1.12^level', () => {
    const cost = calcUpgradeCost(100, 5)
    expect(cost).toBe(Math.floor(100 * Math.pow(1.12, 5)))
  })
})

describe('calcWorkerSpeed', () => {
  it('returns baseSpeed at level 0', () => {
    expect(calcWorkerSpeed(1, 0)).toBe(1)
  })

  it('adds 10% per level', () => {
    expect(calcWorkerSpeed(1, 1)).toBeCloseTo(1.1, 10)
    expect(calcWorkerSpeed(1, 5)).toBeCloseTo(1.5, 10)
  })
})

describe('calcFactoryMultiplier', () => {
  it('returns 1 at level 1', () => {
    expect(calcFactoryMultiplier(1)).toBe(1)
  })

  it('returns 1.5 at level 2', () => {
    expect(calcFactoryMultiplier(2)).toBe(1.5)
  })

  it('scales linearly from level 2', () => {
    expect(calcFactoryMultiplier(3)).toBe(2.0)
    expect(calcFactoryMultiplier(4)).toBe(2.5)
  })
})
