/**
 * Idle Garden Tycoon — GameState Tests
 * Tests save/load, offline earnings, play time tracking
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createDefaultState,
  loadState,
  saveState,
  resetState,
  calculateOfflineEarnings,
  trackPlayTime,
  updateGrowthStates,
} from '../../src/games/idle-garden/systems/GameState'
import { CONSTANTS } from '../../src/games/idle-garden/data/constants'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock)
  localStorageMock.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createDefaultState', () => {
  it('creates a valid default state', () => {
    const state = createDefaultState()
    expect(state.coins).toBe(0)
    expect(state.totalCoins).toBe(0)
    expect(state.sunPoints).toBe(0)
    expect(state.prestigeLevel).toBe(0)
    expect(state.pots.length).toBe(CONSTANTS.STARTING_POTS)
    expect(state.level).toBe(1)
    expect(state.unlockedFlowers).toContain('sunflower')
  })

  it('has default stats', () => {
    const state = createDefaultState()
    expect(state.stats.totalCoinsEarned).toBe(0)
    expect(state.stats.totalFlowersGrown).toBe(0)
    expect(state.stats.totalHarvests).toBe(0)
    expect(state.stats.totalPlayTime).toBe(0)
  })
})

describe('saveState / loadState', () => {
  it('saves and loads state correctly', () => {
    const state = createDefaultState()
    state.coins = 12345
    state.level = 3
    saveState(state)

    const loaded = loadState()
    expect(loaded.coins).toBe(12345)
    expect(loaded.level).toBe(3)
  })

  it('returns default state when no save exists', () => {
    const loaded = loadState()
    expect(loaded.coins).toBe(0)
    expect(loaded.level).toBe(1)
  })

  it('returns default state for corrupted save', () => {
    localStorageMock.setItem(CONSTANTS.SAVE_KEY, 'not-json')
    const loaded = loadState()
    expect(loaded.coins).toBe(0)
  })
})

describe('resetState', () => {
  it('clears saved state', () => {
    const state = createDefaultState()
    state.coins = 999
    saveState(state)
    resetState()
    const loaded = loadState()
    expect(loaded.coins).toBe(0)
  })
})

describe('calculateOfflineEarnings', () => {
  it('returns 0 without offline-earn upgrade', () => {
    const state = createDefaultState()
    state.lastOnline = Date.now() - 60_000
    const earnings = calculateOfflineEarnings(state)
    expect(earnings).toBe(0)
  })

  it('calculates offline earnings with upgrade', () => {
    const state = createDefaultState()
    state.lastOnline = Date.now() - 60_000 // 1 minute ago
    state.upgrades['offline-earn'] = 1
    state.upgrades['auto-harvest'] = 1
    // With auto-harvest and ready pots, it should earn something
    // (but no ready pots = 0 income)
    const earnings = calculateOfflineEarnings(state)
    expect(earnings).toBe(0) // No ready pots = 0 income per second
  })

  it('returns 0 for very short offline time', () => {
    const state = createDefaultState()
    state.lastOnline = Date.now() - 5000 // 5 seconds
    state.upgrades['offline-earn'] = 1
    const earnings = calculateOfflineEarnings(state)
    expect(earnings).toBe(0)
  })
})

describe('trackPlayTime', () => {
  it('updates play time stats with milliseconds', () => {
    const state = createDefaultState()
    const initial = state.stats.totalPlayTime
    trackPlayTime(state, 5000) // 5000ms = 5 seconds
    expect(state.stats.totalPlayTime).toBe(initial + 5)
  })
})

describe('updateGrowthStates', () => {
  it('marks pots as ready when growth completes', () => {
    const state = createDefaultState()
    const now = Date.now()
    // Plant a sunflower (10s grow time)
    state.pots[0].flowerId = 'sunflower'
    state.pots[0].plantedAt = now - 15000 // 15 seconds ago
    state.pots[0].isReady = false

    updateGrowthStates(state, now)

    expect(state.pots[0].isReady).toBe(true)
  })

  it('does not mark pots as ready before grow time', () => {
    const state = createDefaultState()
    const now = Date.now()
    state.pots[0].flowerId = 'sunflower'
    state.pots[0].plantedAt = now - 5000 // 5 seconds ago (needs 10s)
    state.pots[0].isReady = false

    updateGrowthStates(state, now)

    expect(state.pots[0].isReady).toBe(false)
  })
})
