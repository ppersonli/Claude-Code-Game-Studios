/**
 * Idle Garden Tycoon — Currency System Tests
 * TDD: Write tests FIRST, then implement.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { GameState } from '../../src/games/idle-garden/data/types'
import {
  addCoins,
  spendCoins,
  canAfford,
  getBalance,
  transferCoins,
  calcIncomePerSecond,
} from '../../src/games/idle-garden/systems/CurrencySystem'

function createInitialState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 0,
    totalCoins: 0,
    level: 1,
    experience: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    sunPoints: 0,
    pots: [],
    gardenLevel: 1,
    unlockedFlowers: ['sunflower'],
    decorations: [],
    upgrades: {},
    spGrowthUpgrades: 0,
    spPriceUpgrades: 0,
    achievements: [],
    dailyChallenge: null,
    stats: {
      totalCoinsEarned: 0,
      totalFlowersGrown: 0,
      totalHarvests: 0,
      totalPlayTime: 0,
      maxComboCount: 0,
    },
    lastOnline: Date.now(),
    sessionStart: Date.now(),
    lastHarvestTime: 0,
    comboCount: 0,
    ...overrides,
  }
}

describe('CurrencySystem', () => {
  describe('addCoins', () => {
    it('should add coins to player balance', () => {
      const state = createInitialState({ coins: 100 })
      addCoins(state, 50)
      expect(state.coins).toBe(150)
    })

    it('should update totalCoins when adding coins', () => {
      const state = createInitialState({ coins: 100, totalCoins: 100 })
      addCoins(state, 50)
      expect(state.totalCoins).toBe(150)
    })

    it('should update stats.totalCoinsEarned when adding coins', () => {
      const state = createInitialState({ coins: 100, stats: { totalCoinsEarned: 100, totalFlowersGrown: 0, totalHarvests: 0, totalPlayTime: 0, maxComboCount: 0 } })
      addCoins(state, 50)
      expect(state.stats.totalCoinsEarned).toBe(150)
    })

    it('should floor fractional coins', () => {
      const state = createInitialState({ coins: 100 })
      addCoins(state, 49.9)
      expect(state.coins).toBe(149)
    })
  })

  describe('spendCoins', () => {
    it('should deduct coins from player balance', () => {
      const state = createInitialState({ coins: 100 })
      const result = spendCoins(state, 50)
      expect(result).toBe(true)
      expect(state.coins).toBe(50)
    })

    it('should return false if insufficient funds', () => {
      const state = createInitialState({ coins: 10 })
      const result = spendCoins(state, 50)
      expect(result).toBe(false)
      expect(state.coins).toBe(10) // unchanged
    })

    it('should return false for negative amounts', () => {
      const state = createInitialState({ coins: 100 })
      const result = spendCoins(state, -50)
      expect(result).toBe(false)
      expect(state.coins).toBe(100) // unchanged
    })

    it('should floor fractional amounts', () => {
      const state = createInitialState({ coins: 100 })
      const result = spendCoins(state, 49.9)
      expect(result).toBe(true)
      expect(state.coins).toBe(51)
    })
  })

  describe('canAfford', () => {
    it('should return true if player has enough coins', () => {
      const state = createInitialState({ coins: 100 })
      expect(canAfford(state, 100)).toBe(true)
    })

    it('should return false if player has insufficient coins', () => {
      const state = createInitialState({ coins: 50 })
      expect(canAfford(state, 100)).toBe(false)
    })

    it('should return true if player has exactly enough coins', () => {
      const state = createInitialState({ coins: 100 })
      expect(canAfford(state, 100)).toBe(true)
    })
  })

  describe('getBalance', () => {
    it('should return current coin balance', () => {
      const state = createInitialState({ coins: 250 })
      expect(getBalance(state)).toBe(250)
    })
  })

  describe('transferCoins', () => {
    it('should transfer coins between two states', () => {
      const source = createInitialState({ coins: 100 })
      const target = createInitialState({ coins: 50 })
      const result = transferCoins(source, target, 30)
      expect(result).toBe(true)
      expect(source.coins).toBe(70)
      expect(target.coins).toBe(80)
    })

    it('should return false if source cannot afford', () => {
      const source = createInitialState({ coins: 10 })
      const target = createInitialState({ coins: 50 })
      const result = transferCoins(source, target, 30)
      expect(result).toBe(false)
      expect(source.coins).toBe(10)
      expect(target.coins).toBe(50)
    })
  })

  describe('calcIncomePerSecond', () => {
    it('should return 0 if auto-harvest upgrade is not purchased', () => {
      const state = createInitialState({ upgrades: {} })
      expect(calcIncomePerSecond(state)).toBe(0)
    })

    it('should calculate income based on ready flowers', () => {
      const state = createInitialState({
        upgrades: { 'auto-harvest': 1 },
        pots: [
          { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
          { id: 1, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
        ],
      })
      // 2 sunflowers at 10 coins each = 20 coins total
      // Level 1 harvest = 1 harvest/60s = 20/60 = 0.333 coins/s
      expect(calcIncomePerSecond(state)).toBeCloseTo(0.333, 2)
    })

    it('should return 0 if no flowers are ready', () => {
      const state = createInitialState({
        upgrades: { 'auto-harvest': 1 },
        pots: [
          { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: false },
        ],
      })
      expect(calcIncomePerSecond(state)).toBe(0)
    })
  })
})