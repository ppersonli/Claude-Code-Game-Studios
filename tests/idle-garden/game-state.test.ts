/**
 * Idle Garden Tycoon — GameState save/load tests
 * Tests for state creation, serialization, offline earnings, and play time tracking.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createDefaultState,
  saveState,
  loadState,
  resetState,
  calculateOfflineEarnings,
  trackPlayTime,
  updateGrowthStates,
  serializeState,
  deserializeState,
} from '../../src/games/idle-garden/systems/GameState'
import type { GameState } from '../../src/games/idle-garden/data/types'

// Mock localStorage
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
}

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock)
  localStorageMock.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GameState', () => {
  describe('createDefaultState', () => {
    it('creates a valid default state', () => {
      const state = createDefaultState()
      expect(state.coins).toBe(0)
      expect(state.totalCoins).toBe(0)
      expect(state.sunPoints).toBe(0)
      expect(state.prestigeLevel).toBe(0)
      expect(state.prestigeCount).toBe(0)
      expect(state.gardenLevel).toBe(1)
      expect(state.level).toBe(1)
      expect(state.experience).toBe(0)
      expect(state.unlockedFlowers).toEqual(['sunflower'])
      expect(state.upgrades).toEqual({})
      expect(state.pots.length).toBe(4)
    })

    it('creates default pots with correct structure', () => {
      const state = createDefaultState()
      state.pots.forEach((pot, i) => {
        expect(pot.id).toBe(i)
        expect(pot.flowerId).toBeNull()
        expect(pot.isWatered).toBe(false)
        expect(pot.isReady).toBe(false)
      })
    })

    it('initializes stats to zero', () => {
      const state = createDefaultState()
      expect(state.stats.totalCoinsEarned).toBe(0)
      expect(state.stats.totalFlowersGrown).toBe(0)
      expect(state.stats.totalHarvests).toBe(0)
      expect(state.stats.totalPlayTime).toBe(0)
    })
  })

  describe('saveState / loadState', () => {
    it('round-trips state through localStorage', () => {
      const state = createDefaultState()
      state.coins = 500
      state.totalCoins = 1000
      state.gardenLevel = 2
      saveState(state)

      const loaded = loadState()
      expect(loaded.coins).toBe(500)
      expect(loaded.totalCoins).toBe(1000)
      expect(loaded.gardenLevel).toBe(2)
    })

    it('returns default state when no save exists', () => {
      const loaded = loadState()
      expect(loaded.coins).toBe(0)
      expect(loaded.gardenLevel).toBe(1)
    })

    it('handles corrupted save data gracefully', () => {
      store['idle-garden-tycoon-state'] = 'not valid json{'
      const loaded = loadState()
      expect(loaded.coins).toBe(0)
    })

    it('merges partial save with defaults', () => {
      // Simulate a save from an older version missing new fields
      store['idle-garden-tycoon-state'] = JSON.stringify({ coins: 999 })
      const loaded = loadState()
      expect(loaded.coins).toBe(999)
      expect(loaded.gardenLevel).toBe(1) // default
      expect(loaded.pots.length).toBe(4) // default
    })

    it('updates lastOnline on save', () => {
      const state = createDefaultState()
      const before = Date.now()
      saveState(state)
      const loaded = loadState()
      expect(loaded.lastOnline).toBeGreaterThanOrEqual(before)
    })
  })

  describe('resetState', () => {
    it('clears localStorage and returns default state', () => {
      const state = createDefaultState()
      state.coins = 999
      saveState(state)

      const reset = resetState()
      expect(reset.coins).toBe(0)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('idle-garden-tycoon-state')
    })
  })

  describe('calculateOfflineEarnings', () => {
    it('returns 0 if offline-earn upgrade not purchased', () => {
      const state = createDefaultState()
      state.lastOnline = Date.now() - 3600_000 // 1 hour ago
      state.upgrades = {}
      expect(calculateOfflineEarnings(state)).toBe(0)
    })

    it('returns 0 if offline time < 10 seconds', () => {
      const state = createDefaultState()
      state.lastOnline = Date.now() - 5000 // 5 seconds ago
      state.upgrades = { 'offline-earn': 1 }
      expect(calculateOfflineEarnings(state)).toBe(0)
    })

    it('calculates earnings from ready flowers while offline', () => {
      const state = createDefaultState()
      state.lastOnline = Date.now() - 3600_000 // 1 hour ago
      state.upgrades = { 'offline-earn': 1, 'auto-harvest': 1 }
      state.pots = [
        { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
      ]
      const earnings = calculateOfflineEarnings(state)
      expect(earnings).toBeGreaterThan(0)
    })

    it('caps at MAX_OFFLINE_HOURS', () => {
      const state1 = createDefaultState()
      state1.lastOnline = Date.now() - 8 * 3600_000 // 8 hours
      state1.upgrades = { 'offline-earn': 1, 'auto-harvest': 1 }
      state1.pots = [
        { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
      ]

      const state2 = createDefaultState()
      state2.lastOnline = Date.now() - 24 * 3600_000 // 24 hours
      state2.upgrades = { 'offline-earn': 1, 'auto-harvest': 1 }
      state2.pots = [
        { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
      ]

      // Both should be capped at same amount
      expect(calculateOfflineEarnings(state1)).toBe(calculateOfflineEarnings(state2))
    })
  })

  describe('trackPlayTime', () => {
    it('accumulates play time from delta ms', () => {
      const state = createDefaultState()
      trackPlayTime(state, 1000) // 1 second
      expect(state.stats.totalPlayTime).toBeCloseTo(1, 1)
      trackPlayTime(state, 2500) // 2.5 seconds
      expect(state.stats.totalPlayTime).toBeCloseTo(3.5, 1)
    })
  })

  describe('updateGrowthStates', () => {
    it('marks pots as ready when fully grown', () => {
      const now = Date.now()
      const state = createDefaultState()
      state.pots = [
        { id: 0, flowerId: 'sunflower', plantedAt: now - 20_000, isWatered: false, isReady: false },
      ]
      updateGrowthStates(state, now)
      expect(state.pots[0].isReady).toBe(true)
    })

    it('does not mark empty pots as ready', () => {
      const state = createDefaultState()
      updateGrowthStates(state, Date.now())
      expect(state.pots[0].isReady).toBe(false)
    })

    it('does not change already-ready pots', () => {
      const state = createDefaultState()
      state.pots = [
        { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
      ]
      updateGrowthStates(state, Date.now())
      expect(state.pots[0].isReady).toBe(true)
    })
  })

  describe('serializeState / deserializeState', () => {
    it('round-trips through JSON', () => {
      const state = createDefaultState()
      state.coins = 42
      const json = serializeState(state)
      const restored = deserializeState(json)
      expect(restored.coins).toBe(42)
    })

    it('deserialize returns default for null', () => {
      const state = deserializeState(null)
      expect(state.coins).toBe(0)
    })

    it('deserialize returns default for invalid json', () => {
      const state = deserializeState('not json{')
      expect(state.coins).toBe(0)
    })
  })
})
