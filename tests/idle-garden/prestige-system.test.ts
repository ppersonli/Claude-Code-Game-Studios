/**
 * Idle Garden Tycoon — Prestige System Tests
 */
import { describe, it, expect } from 'vitest'
import {
  canPrestige,
  getPrestigeRequirement,
  calcEarnableSunPoints,
  performPrestige,
  buySunPointUpgrade,
  getGrowthBonusPercent,
  getPriceBonusPercent,
} from '../../src/games/idle-garden/systems/PrestigeSystem'
import { createDefaultState } from '../../src/games/idle-garden/systems/GameState'
import { CONSTANTS } from '../../src/games/idle-garden/data/constants'
import type { GameState } from '../../src/games/idle-garden/data/types'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...createDefaultState(), ...overrides }
}

describe('canPrestige', () => {
  it('returns false when totalCoins below threshold', () => {
    const state = makeState({ totalCoins: 50_000 })
    expect(canPrestige(state)).toBe(false)
  })

  it('returns true when totalCoins meets threshold', () => {
    const state = makeState({ totalCoins: CONSTANTS.PRESTIGE_BASE_THRESHOLD })
    expect(canPrestige(state)).toBe(true)
  })

  it('returns true when totalCoins exceeds threshold', () => {
    const state = makeState({ totalCoins: 200_000 })
    expect(canPrestige(state)).toBe(true)
  })
})

describe('getPrestigeRequirement', () => {
  it('returns base threshold for level 0', () => {
    expect(getPrestigeRequirement(0)).toBe(CONSTANTS.PRESTIGE_BASE_THRESHOLD)
  })

  it('scales with prestige level', () => {
    const req0 = getPrestigeRequirement(0)
    const req1 = getPrestigeRequirement(1)
    expect(req1).toBe(req0 * CONSTANTS.PRESTIGE_THRESHOLD_MULT)
  })
})

describe('calcEarnableSunPoints', () => {
  it('returns 0 below threshold', () => {
    expect(calcEarnableSunPoints(50_000)).toBe(0)
  })

  it('returns 1 at threshold', () => {
    expect(calcEarnableSunPoints(100_000)).toBe(1)
  })

  it('scales with totalCoins', () => {
    const sp1 = calcEarnableSunPoints(100_000)
    const sp4 = calcEarnableSunPoints(400_000)
    expect(sp4).toBeGreaterThan(sp1)
  })
})

describe('performPrestige', () => {
  it('returns 0 when cannot prestige', () => {
    const state = makeState({ totalCoins: 50_000 })
    expect(performPrestige(state)).toBe(0)
  })

  it('awards sun points', () => {
    const state = makeState({ totalCoins: 100_000 })
    const earned = performPrestige(state)
    expect(earned).toBe(1)
    expect(state.sunPoints).toBe(1)
  })

  it('increments prestige level', () => {
    const state = makeState({ totalCoins: 100_000 })
    performPrestige(state)
    expect(state.prestigeLevel).toBe(1)
    expect(state.prestigeCount).toBe(1)
  })

  it('resets coins', () => {
    const state = makeState({ totalCoins: 100_000, coins: 50_000 })
    performPrestige(state)
    expect(state.coins).toBe(0)
    expect(state.totalCoins).toBe(0)
  })

  it('resets garden', () => {
    const state = makeState({ totalCoins: 100_000, gardenLevel: 3 })
    performPrestige(state)
    expect(state.gardenLevel).toBe(1)
    expect(state.pots.length).toBe(CONSTANTS.STARTING_POTS)
  })

  it('resets upgrades', () => {
    const state = makeState({
      totalCoins: 100_000,
      upgrades: { 'auto-harvest': 3, 'auto-water': 2 },
    })
    performPrestige(state)
    expect(Object.keys(state.upgrades)).toHaveLength(0)
  })

  it('resets unlocked flowers to sunflower only', () => {
    const state = makeState({
      totalCoins: 100_000,
      unlockedFlowers: ['sunflower', 'tulip', 'rose'],
    })
    performPrestige(state)
    expect(state.unlockedFlowers).toEqual(['sunflower'])
  })

  it('resets player level and experience', () => {
    const state = makeState({ totalCoins: 100_000, level: 5, experience: 500 })
    performPrestige(state)
    expect(state.level).toBe(1)
    expect(state.experience).toBe(0)
  })

  it('preserves sun points from previous prestige', () => {
    const state = makeState({ totalCoins: 400_000, sunPoints: 3 })
    performPrestige(state)
    // sqrt(400000/100000) = 2, so earned = 2
    expect(state.sunPoints).toBe(5) // 3 + 2
  })

  it('preserves stats.totalCoinsEarned', () => {
    const state = makeState({ totalCoins: 100_000 })
    state.stats.totalCoinsEarned = 999_999
    performPrestige(state)
    expect(state.stats.totalCoinsEarned).toBe(999_999)
  })

  it('preserves spGrowthUpgrades and spPriceUpgrades', () => {
    const state = makeState({
      totalCoins: 100_000,
      spGrowthUpgrades: 5,
      spPriceUpgrades: 3,
    })
    performPrestige(state)
    expect(state.spGrowthUpgrades).toBe(5)
    expect(state.spPriceUpgrades).toBe(3)
  })
})

describe('buySunPointUpgrade', () => {
  it('returns false when no sun points', () => {
    const state = makeState({ sunPoints: 0 })
    expect(buySunPointUpgrade(state, 'growth')).toBe(false)
  })

  it('buys growth upgrade', () => {
    const state = makeState({ sunPoints: 5 })
    expect(buySunPointUpgrade(state, 'growth')).toBe(true)
    expect(state.sunPoints).toBe(4)
    expect(state.spGrowthUpgrades).toBe(1)
  })

  it('buys price upgrade', () => {
    const state = makeState({ sunPoints: 5 })
    expect(buySunPointUpgrade(state, 'price')).toBe(true)
    expect(state.sunPoints).toBe(4)
    expect(state.spPriceUpgrades).toBe(1)
  })

  it('returns false at max upgrades', () => {
    const state = makeState({
      sunPoints: 10,
      spGrowthUpgrades: CONSTANTS.SP_MAX_UPGRADES,
    })
    expect(buySunPointUpgrade(state, 'growth')).toBe(false)
  })

  it('returns false at max price upgrades', () => {
    const state = makeState({
      sunPoints: 10,
      spPriceUpgrades: CONSTANTS.SP_MAX_UPGRADES,
    })
    expect(buySunPointUpgrade(state, 'price')).toBe(false)
  })
})

describe('getGrowthBonusPercent', () => {
  it('returns 0 with no upgrades', () => {
    expect(getGrowthBonusPercent(0)).toBe(0)
  })

  it('returns correct percentage', () => {
    // 10 upgrades * 5% = 50%
    expect(getGrowthBonusPercent(10)).toBe(50)
  })
})

describe('getPriceBonusPercent', () => {
  it('returns 0 with no upgrades', () => {
    expect(getPriceBonusPercent(0)).toBe(0)
  })

  it('returns correct percentage', () => {
    // 5 upgrades * 10% = 50%
    expect(getPriceBonusPercent(5)).toBe(50)
  })
})
