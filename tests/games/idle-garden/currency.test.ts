/**
 * Idle Garden Tycoon — Currency System Tests
 * TDD: Tests coin management, spending, and passive income
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { GameState } from '../../../src/games/idle-garden/data/types'
import {
  addCoins,
  spendCoins,
  canAfford,
  getBalance,
  transferCoins,
  calcIncomePerSecond,
} from '../../../src/games/idle-garden/systems/CurrencySystem'

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 0,
    totalCoins: 0,
    sunPoints: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    spGrowthUpgrades: 0,
    spPriceUpgrades: 0,
    pots: [],
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

describe('addCoins', () => {
  it('adds coins to balance', () => {
    const state = createTestState()
    addCoins(state, 100)
    expect(state.coins).toBe(100)
  })

  it('accumulates coins', () => {
    const state = createTestState()
    addCoins(state, 50)
    addCoins(state, 30)
    expect(state.coins).toBe(80)
  })

  it('updates totalCoins', () => {
    const state = createTestState()
    addCoins(state, 100)
    expect(state.totalCoins).toBe(100)
  })

  it('updates stats.totalCoinsEarned', () => {
    const state = createTestState()
    addCoins(state, 100)
    addCoins(state, 50)
    expect(state.stats.totalCoinsEarned).toBe(150)
  })

  it('floors fractional amounts', () => {
    const state = createTestState()
    addCoins(state, 99.9)
    expect(state.coins).toBe(99)
  })

  it('handles zero amount', () => {
    const state = createTestState()
    addCoins(state, 0)
    expect(state.coins).toBe(0)
  })
})

describe('spendCoins', () => {
  it('deducts coins from balance', () => {
    const state = createTestState({ coins: 200 })
    const result = spendCoins(state, 50)
    expect(result).toBe(true)
    expect(state.coins).toBe(150)
  })

  it('returns false when insufficient funds', () => {
    const state = createTestState({ coins: 50 })
    const result = spendCoins(state, 100)
    expect(result).toBe(false)
    expect(state.coins).toBe(50) // unchanged
  })

  it('returns false for negative amount', () => {
    const state = createTestState({ coins: 100 })
    const result = spendCoins(state, -10)
    expect(result).toBe(false)
    expect(state.coins).toBe(100)
  })

  it('allows spending exact balance', () => {
    const state = createTestState({ coins: 100 })
    const result = spendCoins(state, 100)
    expect(result).toBe(true)
    expect(state.coins).toBe(0)
  })

  it('floors fractional amounts before spending', () => {
    const state = createTestState({ coins: 100 })
    spendCoins(state, 50.9)
    // floored = floor(50.9) = 50, so 100 - 50 = 50
    expect(state.coins).toBe(50)
  })
})

describe('canAfford', () => {
  it('returns true when player has enough coins', () => {
    const state = createTestState({ coins: 100 })
    expect(canAfford(state, 50)).toBe(true)
  })

  it('returns false when player has insufficient coins', () => {
    const state = createTestState({ coins: 50 })
    expect(canAfford(state, 100)).toBe(false)
  })

  it('returns true for exact amount', () => {
    const state = createTestState({ coins: 100 })
    expect(canAfford(state, 100)).toBe(true)
  })

  it('returns true for zero cost', () => {
    const state = createTestState({ coins: 0 })
    expect(canAfford(state, 0)).toBe(true)
  })
})

describe('getBalance', () => {
  it('returns current coin balance', () => {
    const state = createTestState({ coins: 42 })
    expect(getBalance(state)).toBe(42)
  })

  it('returns 0 for new game', () => {
    const state = createTestState()
    expect(getBalance(state)).toBe(0)
  })
})

describe('transferCoins', () => {
  it('transfers coins between states', () => {
    const source = createTestState({ coins: 200 })
    const target = createTestState({ coins: 50 })

    const result = transferCoins(source, target, 100)
    expect(result).toBe(true)
    expect(source.coins).toBe(100)
    expect(target.coins).toBe(150)
  })

  it('returns false when source cannot afford', () => {
    const source = createTestState({ coins: 50 })
    const target = createTestState({ coins: 0 })

    const result = transferCoins(source, target, 100)
    expect(result).toBe(false)
    expect(source.coins).toBe(50)
    expect(target.coins).toBe(0)
  })
})

describe('calcIncomePerSecond', () => {
  it('returns 0 without auto-harvest upgrade', () => {
    const state = createTestState({
      upgrades: {},
      pots: [{ id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true }],
    })
    expect(calcIncomePerSecond(state)).toBe(0)
  })

  it('returns 0 when no pots are ready', () => {
    const state = createTestState({
      upgrades: { 'auto-harvest': 1 },
      pots: [{ id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: false }],
    })
    expect(calcIncomePerSecond(state)).toBe(0)
  })

  it('calculates income with auto-harvest level 1', () => {
    // sunflower sellPrice = 10, auto-harvest level 1 → interval = 60s
    // income = 10 / 60 = 0.1667 coins/sec
    const state = createTestState({
      upgrades: { 'auto-harvest': 1 },
      pots: [{ id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true }],
    })
    expect(calcIncomePerSecond(state)).toBeCloseTo(0.1667, 2)
  })

  it('scales income with auto-harvest level', () => {
    // Level 2: interval = 30s, income = 10/30 = 0.333
    const state = createTestState({
      upgrades: { 'auto-harvest': 2 },
      pots: [{ id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true }],
    })
    expect(calcIncomePerSecond(state)).toBeCloseTo(0.333, 2)
  })

  it('sums income from multiple ready pots', () => {
    const state = createTestState({
      upgrades: { 'auto-harvest': 1 },
      pots: [
        { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
        { id: 1, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
        { id: 2, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
      ],
    })
    // 3 sunflowers × 10 sellPrice = 30 total, interval 60s → 30/60 = 0.5
    expect(calcIncomePerSecond(state)).toBeCloseTo(0.5, 2)
  })
})
