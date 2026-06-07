/**
 * Idle Garden Tycoon — GameState System Tests
 * TDD: Test save/load, offline earnings, and state management.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { GameState } from '../../src/games/idle-garden/data/types'
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
import { createDefaultPots } from '../../src/games/idle-garden/systems/GardenSystem'

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

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

function createState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createDefaultState(),
    ...overrides,
  }
}

describe('GameState', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('createDefaultState', () => {
    it('should create a fresh default state', () => {
      const state = createDefaultState()
      expect(state.coins).toBe(0)
      expect(state.totalCoins).toBe(0)
      expect(state.level).toBe(1)
      expect(state.pots).toHaveLength(4)
      expect(state.unlockedFlowers).toEqual(['sunflower'])
      expect(state.upgrades).toEqual({})
    })
  })

  describe('saveState & loadState', () => {
    it('should save and load state', () => {
      const state = createDefaultState()
      state.coins = 1000
      state.level = 5
      saveState(state)
      
      const loaded = loadState()
      expect(loaded.coins).toBe(1000)
      expect(loaded.level).toBe(5)
    })

    it('should return default state if no save exists', () => {
      const loaded = loadState()
      expect(loaded.coins).toBe(0)
      expect(loaded.level).toBe(1)
    })

    it('should return default state if save is corrupted', () => {
      localStorageMock.setItem('idle-garden-tycoon-state', 'invalid json')
      const loaded = loadState()
      expect(loaded.coins).toBe(0)
    })
  })

  describe('resetState', () => {
    it('should clear localStorage and return default state', () => {
      const state = createDefaultState()
      state.coins = 5000
      saveState(state)
      
      const reset = resetState()
      expect(reset.coins).toBe(0)
      expect(localStorageMock.getItem('idle-garden-tycoon-state')).toBeNull()
    })
  })

  describe('calculateOfflineEarnings', () => {
    it('should return 0 if no offline-earn upgrade', () => {
      const state = createState()
      expect(calculateOfflineEarnings(state)).toBe(0)
    })

    it('should return 0 if no auto-harvest upgrade', () => {
      const state = createState({
        upgrades: { 'offline-earn': 1 },
        pots: [
          { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
        ],
        lastOnline: Date.now() - 60000,
      })
      expect(calculateOfflineEarnings(state)).toBe(0)
    })

    it('should calculate offline earnings with both upgrades', () => {
      const state = createState({
        upgrades: { 'offline-earn': 1, 'auto-harvest': 1 },
        pots: [
          { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
        ],
        lastOnline: Date.now() - 60000, // 1 minute ago
      })
      const earnings = calculateOfflineEarnings(state)
      expect(earnings).toBeGreaterThan(0)
    })

    it('should return 0 if offline less than 10 seconds', () => {
      const state = createState({
        upgrades: { 'offline-earn': 1, 'auto-harvest': 1 },
        pots: [
          { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
        ],
        lastOnline: Date.now() - 5000, // 5 seconds ago
      })
      expect(calculateOfflineEarnings(state)).toBe(0)
    })
  })

  describe('trackPlayTime', () => {
    it('should accumulate play time', () => {
      const state = createDefaultState()
      trackPlayTime(state, 1000) // 1 second
      expect(state.stats.totalPlayTime).toBe(1)
      trackPlayTime(state, 2000) // 2 more seconds
      expect(state.stats.totalPlayTime).toBe(3)
    })
  })

  describe('updateGrowthStates', () => {
    it('should mark pots as ready when growth completes', () => {
      const state = createDefaultState()
      const now = Date.now()
      state.pots[0] = {
        id: 0,
        flowerId: 'sunflower',
        plantedAt: now - 11000, // 11 seconds ago (sunflower takes 10)
        isWatered: false,
        isReady: false,
      }
      updateGrowthStates(state, now)
      expect(state.pots[0].isReady).toBe(true)
    })

    it('should not mark pots as ready if growth incomplete', () => {
      const state = createDefaultState()
      const now = Date.now()
      state.pots[0] = {
        id: 0,
        flowerId: 'sunflower',
        plantedAt: now - 5000, // 5 seconds ago
        isWatered: false,
        isReady: false,
      }
      updateGrowthStates(state, now)
      expect(state.pots[0].isReady).toBe(false)
    })
  })

  describe('serializeState & deserializeState', () => {
    it('should serialize and deserialize state', () => {
      const state = createDefaultState()
      state.coins = 12345
      const json = serializeState(state)
      const deserialized = deserializeState(json)
      expect(deserialized.coins).toBe(12345)
    })

    it('should return default state if null', () => {
      const deserialized = deserializeState(null)
      expect(deserialized.coins).toBe(0)
    })

    it('should return default state if invalid JSON', () => {
      const deserialized = deserializeState('invalid')
      expect(deserialized.coins).toBe(0)
    })
  })
})