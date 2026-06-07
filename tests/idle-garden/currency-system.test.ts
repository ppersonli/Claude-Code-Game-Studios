/**
 * Idle Garden Tycoon — Currency System Tests
 */
import { describe, it, expect } from 'vitest'
import {
  addCoins,
  spendCoins,
  canAfford,
  getBalance,
  transferCoins,
  calcIncomePerSecond,
} from '../../src/games/idle-garden/systems/CurrencySystem'
import { createDefaultState } from '../../src/games/idle-garden/systems/GameState'
import type { GameState } from '../../src/games/idle-garden/data/types'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...createDefaultState(), ...overrides }
}

describe('addCoins', () => {
  it('adds coins to balance', () => {
    const state = makeState()
    addCoins(state, 100)
    expect(state.coins).toBe(100)
  })

  it('updates totalCoins', () => {
    const state = makeState()
    addCoins(state, 50)
    expect(state.totalCoins).toBe(50)
  })

  it('updates stats.totalCoinsEarned', () => {
    const state = makeState()
    addCoins(state, 75)
    expect(state.stats.totalCoinsEarned).toBe(75)
  })

  it('accumulates over multiple calls', () => {
    const state = makeState()
    addCoins(state, 100)
    addCoins(state, 200)
    expect(state.coins).toBe(300)
    expect(state.totalCoins).toBe(300)
    expect(state.stats.totalCoinsEarned).toBe(300)
  })

  it('floors fractional amounts', () => {
    const state = makeState()
    addCoins(state, 99.9)
    expect(state.coins).toBe(99)
  })
})

describe('spendCoins', () => {
  it('deducts coins when affordable', () => {
    const state = makeState({ coins: 100 })
    expect(spendCoins(state, 50)).toBe(true)
    expect(state.coins).toBe(50)
  })

  it('returns false when insufficient', () => {
    const state = makeState({ coins: 30 })
    expect(spendCoins(state, 50)).toBe(false)
    expect(state.coins).toBe(30)
  })

  it('returns false for negative amount', () => {
    const state = makeState({ coins: 100 })
    expect(spendCoins(state, -10)).toBe(false)
  })

  it('floors fractional amounts before spending', () => {
    const state = makeState({ coins: 100 })
    spendCoins(state, 49.9)
    // floor(49.9) = 49, so 100 - 49 = 51
    expect(state.coins).toBe(51)
  })
})

describe('canAfford', () => {
  it('returns true when has enough coins', () => {
    const state = makeState({ coins: 100 })
    expect(canAfford(state, 100)).toBe(true)
  })

  it('returns false when not enough', () => {
    const state = makeState({ coins: 50 })
    expect(canAfford(state, 100)).toBe(false)
  })

  it('returns true when has more than enough', () => {
    const state = makeState({ coins: 200 })
    expect(canAfford(state, 100)).toBe(true)
  })
})

describe('getBalance', () => {
  it('returns current coin balance', () => {
    const state = makeState({ coins: 42 })
    expect(getBalance(state)).toBe(42)
  })
})

describe('transferCoins', () => {
  it('transfers coins between states', () => {
    const source = makeState({ coins: 100 })
    const target = makeState({ coins: 0 })
    expect(transferCoins(source, target, 60)).toBe(true)
    expect(source.coins).toBe(40)
    expect(target.coins).toBe(60)
  })

  it('returns false if source cannot afford', () => {
    const source = makeState({ coins: 30 })
    const target = makeState({ coins: 0 })
    expect(transferCoins(source, target, 50)).toBe(false)
    expect(source.coins).toBe(30)
    expect(target.coins).toBe(0)
  })
})

describe('calcIncomePerSecond', () => {
  it('returns 0 without auto-harvest upgrade', () => {
    const state = makeState()
    expect(calcIncomePerSecond(state)).toBe(0)
  })

  it('returns 0 when no pots are ready', () => {
    const state = makeState({
      upgrades: { 'auto-harvest': 1 },
      pots: [
        { id: 0, flowerId: 'sunflower', plantedAt: Date.now(), isWatered: false, isReady: false },
      ],
    })
    expect(calcIncomePerSecond(state)).toBe(0)
  })

  it('calculates income from ready pots with auto-harvest', () => {
    const state = makeState({
      upgrades: { 'auto-harvest': 1 },
      pots: [
        { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
      ],
    })
    const income = calcIncomePerSecond(state)
    // sunflower sellPrice=10, auto-harvest level 1 => interval=60s
    // income = 10 / 60 ≈ 0.167
    expect(income).toBeGreaterThan(0)
  })

  it('increases income with higher auto-harvest level', () => {
    const state1 = makeState({
      upgrades: { 'auto-harvest': 1 },
      pots: [{ id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true }],
    })
    const state2 = makeState({
      upgrades: { 'auto-harvest': 2 },
      pots: [{ id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true }],
    })
    expect(calcIncomePerSecond(state2)).toBeGreaterThan(calcIncomePerSecond(state1))
  })
})
