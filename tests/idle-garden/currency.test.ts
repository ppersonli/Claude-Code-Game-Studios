/**
 * Idle Garden Tycoon — CurrencySystem tests (RED phase)
 * Tests are written FIRST. They will fail until implementation exists.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  addCoins,
  spendCoins,
  canAfford,
  getBalance,
  transferCoins,
  calcIncomePerSecond,
} from '../../src/games/idle-garden/systems/CurrencySystem'
import type { GameState } from '../../src/games/idle-garden/data/types'

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 100,
    totalCoins: 100,
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
    stats: { totalCoinsEarned: 0, totalFlowersGrown: 0, totalHarvests: 0, totalPlayTime: 0 },
    lastOnline: Date.now(),
    sessionStart: Date.now(),
    lastHarvestTime: 0,
    comboCount: 0,
    ...overrides,
  }
}

describe('CurrencySystem', () => {
  describe('addCoins', () => {
    it('increases coins and totalCoins', () => {
      const state = createTestState()
      addCoins(state, 50)
      expect(state.coins).toBe(150)
      expect(state.totalCoins).toBe(150)
    })

    it('handles zero amount', () => {
      const state = createTestState()
      addCoins(state, 0)
      expect(state.coins).toBe(100)
      expect(state.totalCoins).toBe(100)
    })

    it('handles large amounts', () => {
      const state = createTestState()
      addCoins(state, 1_000_000)
      expect(state.coins).toBe(1_000_100)
      expect(state.totalCoins).toBe(1_000_100)
    })

    it('updates stats.totalCoinsEarned', () => {
      const state = createTestState()
      addCoins(state, 50)
      expect(state.stats.totalCoinsEarned).toBe(50)
    })

    it('floors fractional amounts', () => {
      const state = createTestState()
      addCoins(state, 10.7)
      expect(state.coins).toBe(110)
    })
  })

  describe('spendCoins', () => {
    it('decreases coins and returns true on success', () => {
      const state = createTestState({ coins: 100 })
      const result = spendCoins(state, 40)
      expect(result).toBe(true)
      expect(state.coins).toBe(60)
    })

    it('returns false and does not deduct if insufficient', () => {
      const state = createTestState({ coins: 30 })
      const result = spendCoins(state, 50)
      expect(result).toBe(false)
      expect(state.coins).toBe(30)
    })

    it('handles exact balance', () => {
      const state = createTestState({ coins: 100 })
      const result = spendCoins(state, 100)
      expect(result).toBe(true)
      expect(state.coins).toBe(0)
    })

    it('handles zero amount', () => {
      const state = createTestState({ coins: 100 })
      const result = spendCoins(state, 0)
      expect(result).toBe(true)
      expect(state.coins).toBe(100)
    })

    it('does not modify totalCoins', () => {
      const state = createTestState({ coins: 100, totalCoins: 500 })
      spendCoins(state, 50)
      expect(state.totalCoins).toBe(500)
    })
  })

  describe('canAfford', () => {
    it('returns true when coins >= cost', () => {
      const state = createTestState({ coins: 100 })
      expect(canAfford(state, 100)).toBe(true)
      expect(canAfford(state, 50)).toBe(true)
    })

    it('returns false when coins < cost', () => {
      const state = createTestState({ coins: 30 })
      expect(canAfford(state, 50)).toBe(false)
    })

    it('returns true for zero cost', () => {
      const state = createTestState({ coins: 0 })
      expect(canAfford(state, 0)).toBe(true)
    })
  })

  describe('getBalance', () => {
    it('returns current coins', () => {
      const state = createTestState({ coins: 42 })
      expect(getBalance(state)).toBe(42)
    })
  })

  describe('transferCoins', () => {
    it('transfers from source to target when affordable', () => {
      const source = createTestState({ coins: 100 })
      const target = createTestState({ coins: 50 })
      const result = transferCoins(source, target, 30)
      expect(result).toBe(true)
      expect(source.coins).toBe(70)
      expect(target.coins).toBe(80)
    })

    it('fails if source cannot afford', () => {
      const source = createTestState({ coins: 20 })
      const target = createTestState({ coins: 50 })
      const result = transferCoins(source, target, 30)
      expect(result).toBe(false)
      expect(source.coins).toBe(20)
      expect(target.coins).toBe(50)
    })
  })

  describe('calcIncomePerSecond', () => {
    it('returns 0 with no ready pots', () => {
      const state = createTestState({ pots: [] })
      expect(calcIncomePerSecond(state)).toBe(0)
    })

    it('calculates income from ready flowers', () => {
      const state = createTestState({
        pots: [
          { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
          { id: 1, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
        ],
        unlockedFlowers: ['sunflower'],
      })
      // sunflower sells for 10, with auto-harvest level 0 -> no auto income
      const income = calcIncomePerSecond(state)
      expect(income).toBe(0) // no auto-harvest = no passive income
    })

    it('calculates passive income with auto-harvest', () => {
      const state = createTestState({
        pots: [
          { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
        ],
        upgrades: { 'auto-harvest': 1 },
        unlockedFlowers: ['sunflower'],
      })
      const income = calcIncomePerSecond(state)
      expect(income).toBeGreaterThan(0)
    })
  })
})
