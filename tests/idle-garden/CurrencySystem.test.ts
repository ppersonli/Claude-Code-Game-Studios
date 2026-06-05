/**
 * Idle Garden Tycoon — CurrencySystem Tests
 * Tests for coin management and currency calculations.
 */
import { describe, it, expect } from 'vitest'
import { addCoins, spendCoins, canAfford } from '../../src/games/idle-garden/systems/CurrencySystem'
import type { GameState } from '../../src/games/idle-garden/data/types'
import { createDefaultPots } from '../../src/games/idle-garden/systems/GardenSystem'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    level: 1,
    coins: 100,
    totalCoins: 100,
    experience: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    sunPoints: 0,
    pots: createDefaultPots(),
    gardenLevel: 1,
    unlockedFlowers: ['sunflower'],
    decorations: [],
    upgrades: {},
    comboCount: 0,
    lastHarvestTime: 0,
    spGrowthUpgrades: 0,
    spPriceUpgrades: 0,
    lastOnline: Date.now(),
    sessionStart: Date.now(),
    stats: {
      totalCoinsEarned: 0,
      totalFlowersGrown: 0,
      totalHarvests: 0,
      totalPlayTime: 0,
    },
    ...overrides,
  }
}

describe('addCoins', () => {
  it('adds coins to the state', () => {
    const state = makeState({ coins: 50 })
    addCoins(state, 30)
    expect(state.coins).toBe(80)
  })

  it('tracks total coins earned in stats', () => {
    const state = makeState()
    addCoins(state, 100)
    expect(state.stats.totalCoinsEarned).toBe(100)
  })

  it('accumulates multiple additions', () => {
    const state = makeState({ coins: 0 })
    addCoins(state, 10)
    addCoins(state, 20)
    addCoins(state, 30)
    expect(state.coins).toBe(60)
    expect(state.stats.totalCoinsEarned).toBe(60)
  })
})

describe('spendCoins', () => {
  it('deducts coins when affordable', () => {
    const state = makeState({ coins: 100 })
    const result = spendCoins(state, 50)
    expect(result).toBe(true)
    expect(state.coins).toBe(50)
  })

  it('returns false when not enough coins', () => {
    const state = makeState({ coins: 30 })
    const result = spendCoins(state, 50)
    expect(result).toBe(false)
    expect(state.coins).toBe(30) // unchanged
  })

  it('returns false for exact zero coins', () => {
    const state = makeState({ coins: 0 })
    const result = spendCoins(state, 1)
    expect(result).toBe(false)
  })
})

describe('canAfford', () => {
  it('returns true when coins >= cost', () => {
    const state = makeState({ coins: 100 })
    expect(canAfford(state, 100)).toBe(true)
    expect(canAfford(state, 50)).toBe(true)
  })

  it('returns false when coins < cost', () => {
    const state = makeState({ coins: 50 })
    expect(canAfford(state, 100)).toBe(false)
  })

  it('returns true for zero cost', () => {
    const state = makeState({ coins: 0 })
    expect(canAfford(state, 0)).toBe(true)
  })
})
