/**
 * Idle Garden Tycoon — Prestige System Tests
 * TDD: Tests prestige checks, execution, sun point upgrades
 */

import { describe, it, expect } from 'vitest'
import type { GameState } from '../../../src/games/idle-garden/data/types'
import { createDefaultPots } from '../../../src/games/idle-garden/systems/GardenSystem'
import {
  canPrestige,
  getPrestigeRequirement,
  calcEarnableSunPoints,
  performPrestige,
  buySunPointUpgrade,
  getGrowthBonusPercent,
  getPriceBonusPercent,
} from '../../../src/games/idle-garden/systems/PrestigeSystem'
import { CONSTANTS } from '../../../src/games/idle-garden/data/constants'

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 0,
    totalCoins: 0,
    sunPoints: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    spGrowthUpgrades: 0,
    spPriceUpgrades: 0,
    pots: createDefaultPots(),
    gardenLevel: 1,
    level: 1,
    experience: 0,
    unlockedFlowers: ['sunflower'],
    upgrades: {},
    decorations: [],
    achievements: [],
    dailyChallenge: null,
    stats: {
      totalCoinsEarned: 0,
      totalFlowersGrown: 0,
      totalHarvests: 0,
      totalPlayTime: 0,
      maxComboCount: 0,
    },
    lastOnline: 0,
    sessionStart: 0,
    lastHarvestTime: 0,
    comboCount: 0,
    ...overrides,
  }
}

describe('canPrestige', () => {
  it('returns false when totalCoins below threshold', () => {
    const state = createTestState({ totalCoins: 50_000 })
    expect(canPrestige(state)).toBe(false)
  })

  it('returns true when totalCoins meets threshold', () => {
    const state = createTestState({ totalCoins: 100_000 })
    expect(canPrestige(state)).toBe(true)
  })

  it('returns true when totalCoins exceeds threshold', () => {
    const state = createTestState({ totalCoins: 200_000 })
    expect(canPrestige(state)).toBe(true)
  })

  it('threshold increases with prestige level', () => {
    const state0 = createTestState({ totalCoins: 100_000, prestigeLevel: 0 })
    expect(canPrestige(state0)).toBe(true)

    const state1 = createTestState({ totalCoins: 100_000, prestigeLevel: 1 })
    expect(canPrestige(state1)).toBe(false) // threshold is 500K for level 1

    const state1ok = createTestState({ totalCoins: 500_000, prestigeLevel: 1 })
    expect(canPrestige(state1ok)).toBe(true)
  })
})

describe('getPrestigeRequirement', () => {
  it('returns base threshold for level 0', () => {
    expect(getPrestigeRequirement(0)).toBe(100_000)
  })

  it('scales by PRESTIGE_THRESHOLD_MULT', () => {
    expect(getPrestigeRequirement(1)).toBe(500_000)
    expect(getPrestigeRequirement(2)).toBe(2_500_000)
  })
})

describe('calcEarnableSunPoints', () => {
  it('returns 0 below threshold', () => {
    expect(calcEarnableSunPoints(0)).toBe(0)
    expect(calcEarnableSunPoints(50_000)).toBe(0)
  })

  it('returns sun points based on sqrt formula', () => {
    // floor(sqrt(100000/100000)) = 1
    expect(calcEarnableSunPoints(100_000)).toBe(1)
    // floor(sqrt(400000/100000)) = 2
    expect(calcEarnableSunPoints(400_000)).toBe(2)
    // floor(sqrt(900000/100000)) = 3
    expect(calcEarnableSunPoints(900_000)).toBe(3)
  })
})

describe('performPrestige', () => {
  it('awards sun points and increments prestige level', () => {
    const state = createTestState({ totalCoins: 400_000 })
    const earned = performPrestige(state)
    expect(earned).toBe(2) // floor(sqrt(400000/100000))
    expect(state.sunPoints).toBe(2)
    expect(state.prestigeLevel).toBe(1)
    expect(state.prestigeCount).toBe(1)
  })

  it('resets coins and totalCoins', () => {
    const state = createTestState({ totalCoins: 400_000, coins: 100_000 })
    performPrestige(state)
    expect(state.coins).toBe(0)
    expect(state.totalCoins).toBe(0)
  })

  it('resets garden to default pots', () => {
    const state = createTestState({ totalCoins: 400_000 })
    state.pots = [{ id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: true, isReady: true }]
    performPrestige(state)
    expect(state.pots).toHaveLength(4)
    expect(state.pots[0].flowerId).toBeNull()
  })

  it('resets upgrades', () => {
    const state = createTestState({
      totalCoins: 400_000,
      upgrades: { 'auto-harvest': 3, 'auto-water': 2 },
    })
    performPrestige(state)
    expect(state.upgrades).toEqual({})
  })

  it('resets unlocked flowers to sunflower only', () => {
    const state = createTestState({
      totalCoins: 400_000,
      unlockedFlowers: ['sunflower', 'tulip', 'rose'],
    })
    performPrestige(state)
    expect(state.unlockedFlowers).toEqual(['sunflower'])
  })

  it('resets player level and experience', () => {
    const state = createTestState({ totalCoins: 400_000, level: 10, experience: 500 })
    performPrestige(state)
    expect(state.level).toBe(1)
    expect(state.experience).toBe(0)
  })

  it('preserves sun points (accumulated)', () => {
    const state = createTestState({ totalCoins: 400_000, sunPoints: 5 })
    performPrestige(state)
    expect(state.sunPoints).toBe(7) // 5 + 2
  })

  it('preserves existing prestigeLevel and prestigeCount', () => {
    // With prestigeLevel=2, threshold = 100K * 5^2 = 2.5M, so totalCoins must be >= 2.5M
    const state = createTestState({
      totalCoins: 3_000_000,
      prestigeLevel: 2,
      prestigeCount: 3,
    })
    performPrestige(state)
    expect(state.prestigeLevel).toBe(3) // 2 + 1
    expect(state.prestigeCount).toBe(4) // 3 + 1
  })

  it('preserves stats.totalCoinsEarned', () => {
    const state = createTestState({
      totalCoins: 400_000,
      stats: {
        totalCoinsEarned: 1_000_000,
        totalFlowersGrown: 100,
        totalHarvests: 50,
        totalPlayTime: 3600,
        maxComboCount: 5,
      },
    })
    performPrestige(state)
    expect(state.stats.totalCoinsEarned).toBe(1_000_000)
  })

  it('returns 0 if cannot prestige', () => {
    const state = createTestState({ totalCoins: 50_000 })
    const earned = performPrestige(state)
    expect(earned).toBe(0)
    expect(state.prestigeLevel).toBe(0) // unchanged
  })

  it('resets combo tracking', () => {
    const state = createTestState({
      totalCoins: 400_000,
      comboCount: 5,
      lastHarvestTime: Date.now(),
    })
    performPrestige(state)
    expect(state.comboCount).toBe(0)
    expect(state.lastHarvestTime).toBe(0)
  })
})

describe('buySunPointUpgrade', () => {
  it('buys a growth upgrade', () => {
    const state = createTestState({ sunPoints: 3 })
    const result = buySunPointUpgrade(state, 'growth')
    expect(result).toBe(true)
    expect(state.sunPoints).toBe(2)
    expect(state.spGrowthUpgrades).toBe(1)
  })

  it('buys a price upgrade', () => {
    const state = createTestState({ sunPoints: 3 })
    const result = buySunPointUpgrade(state, 'price')
    expect(result).toBe(true)
    expect(state.sunPoints).toBe(2)
    expect(state.spPriceUpgrades).toBe(1)
  })

  it('returns false with no sun points', () => {
    const state = createTestState({ sunPoints: 0 })
    expect(buySunPointUpgrade(state, 'growth')).toBe(false)
    expect(buySunPointUpgrade(state, 'price')).toBe(false)
  })

  it('returns false at max upgrades', () => {
    const state = createTestState({
      sunPoints: 5,
      spGrowthUpgrades: CONSTANTS.SP_MAX_UPGRADES,
    })
    expect(buySunPointUpgrade(state, 'growth')).toBe(false)
  })

  it('allows purchasing multiple upgrades', () => {
    const state = createTestState({ sunPoints: 10 })
    for (let i = 0; i < 5; i++) {
      buySunPointUpgrade(state, 'growth')
    }
    expect(state.spGrowthUpgrades).toBe(5)
    expect(state.sunPoints).toBe(5)
  })
})

describe('getGrowthBonusPercent', () => {
  it('returns 0 with no upgrades', () => {
    expect(getGrowthBonusPercent(0)).toBe(0)
  })

  it('returns 5% per upgrade', () => {
    expect(getGrowthBonusPercent(1)).toBe(5)
    expect(getGrowthBonusPercent(2)).toBe(10)
    expect(getGrowthBonusPercent(10)).toBe(50)
  })
})

describe('getPriceBonusPercent', () => {
  it('returns 0 with no upgrades', () => {
    expect(getPriceBonusPercent(0)).toBe(0)
  })

  it('returns 10% per upgrade', () => {
    expect(getPriceBonusPercent(1)).toBe(10)
    expect(getPriceBonusPercent(2)).toBe(20)
    expect(getPriceBonusPercent(5)).toBe(50)
  })
})
