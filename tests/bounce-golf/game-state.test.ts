import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createInitialState,
  getCurrentLevel,
  getUpgradeCost,
  canAffordUpgrade,
  purchaseUpgrade,
  completeLevel,
  canPrestige,
  prestige,
  saveGame,
  loadGame,
} from '../../src/games/bounce-golf/logic/game-state'
import type { GameState } from '../../src/games/bounce-golf/logic/game-state'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('Bounce Golf Game State', () => {
  let state: GameState

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    state = createInitialState()
  })

  describe('createInitialState', () => {
    it('test_state_create_starts_at_level_0', () => {
      expect(state.currentLevel).toBe(0)
    })

    it('test_state_create_has_zero_strokes', () => {
      expect(state.strokes).toBe(0)
    })

    it('test_state_create_has_zero_stars', () => {
      expect(state.totalStars).toBe(0)
    })

    it('test_state_create_starts_with_rookie_character', () => {
      expect(state.selectedCharacter).toBe('rookie')
    })

    it('test_state_create_starts_with_zero_upgrades', () => {
      expect(state.upgrades.power).toBe(0)
      expect(state.upgrades.bounce).toBe(0)
      expect(state.upgrades.accuracy).toBe(0)
      expect(state.upgrades.magnet).toBe(0)
    })
  })

  describe('getCurrentLevel', () => {
    it('test_state_getCurrentLevel_returns_first_level', () => {
      const level = getCurrentLevel(state)
      expect(level.id).toBe(1)
    })

    it('test_state_getCurrentLevel_wraps_around', () => {
      state.currentLevel = 50
      const level = getCurrentLevel(state)
      expect(level.id).toBe(1)
    })
  })

  describe('getUpgradeCost', () => {
    it('test_state_upgradeCost_increases_with_level', () => {
      const cost0 = getUpgradeCost('power', 0)
      const cost1 = getUpgradeCost('power', 1)
      const cost5 = getUpgradeCost('power', 5)
      expect(cost0).toBeLessThan(cost1)
      expect(cost1).toBeLessThan(cost5)
    })

    it('test_state_upgradeCost_base_matches_config', () => {
      expect(getUpgradeCost('power', 0)).toBe(50)
      expect(getUpgradeCost('bounce', 0)).toBe(75)
      expect(getUpgradeCost('accuracy', 0)).toBe(100)
      expect(getUpgradeCost('magnet', 0)).toBe(200)
    })
  })

  describe('purchaseUpgrade', () => {
    it('test_state_purchaseUpgrade_increases_level', () => {
      state.totalStars = 100
      const newState = purchaseUpgrade(state, 'power')
      expect(newState.upgrades.power).toBe(1)
    })

    it('test_state_purchaseUpgrade_deducts_stars', () => {
      state.totalStars = 100
      const newState = purchaseUpgrade(state, 'power')
      expect(newState.totalStars).toBeLessThan(100)
    })

    it('test_state_purchaseUpgrade_no_op_when_insufficient_stars', () => {
      state.totalStars = 0
      const newState = purchaseUpgrade(state, 'power')
      expect(newState.upgrades.power).toBe(0)
      expect(newState.totalStars).toBe(0)
    })

    it('test_state_purchaseUpgrade_no_op_at_max_level', () => {
      state.totalStars = 99999
      state.upgrades.power = 20
      const newState = purchaseUpgrade(state, 'power')
      expect(newState.upgrades.power).toBe(20)
    })
  })

  describe('completeLevel', () => {
    it('test_state_completeLevel_increments_current_level', () => {
      const newState = completeLevel(state, 1, 2, [true, false, true])
      expect(newState.currentLevel).toBe(1)
    })

    it('test_state_completeLevel_records_completed', () => {
      const newState = completeLevel(state, 1, 2, [true, false, true])
      expect(newState.completedLevels).toContain(1)
    })

    it('test_state_completeLevel_records_best_score', () => {
      const newState = completeLevel(state, 1, 3, [true, false, false])
      expect(newState.bestScores[1]).toBe(3)
    })

    it('test_state_completeLevel_keeps_better_score', () => {
      state.bestScores[1] = 2
      const newState = completeLevel(state, 1, 3, [true, false, false])
      expect(newState.bestScores[1]).toBe(2)
    })

    it('test_state_completeLevel_adds_star_count', () => {
      const newState = completeLevel(state, 1, 2, [true, true, false])
      expect(newState.totalStars).toBe(2)
    })

    it('test_state_completeLevel_merges_stars', () => {
      state.starsEarned[1] = [true, false, false]
      const newState = completeLevel(state, 1, 2, [false, true, false])
      expect(newState.starsEarned[1]).toEqual([true, true, false])
      expect(newState.totalStars).toBe(1) // only 1 new star
    })
  })

  describe('prestige', () => {
    it('test_state_prestige_requires_all_levels_complete', () => {
      expect(canPrestige(state)).toBe(false)
    })

    it('test_state_prestige_available_when_all_complete', () => {
      for (let i = 1; i <= 50; i++) {
        state.completedLevels.push(i)
      }
      expect(canPrestige(state)).toBe(true)
    })

    it('test_state_prestige_awards_galaxy_coins', () => {
      for (let i = 1; i <= 50; i++) {
        state.completedLevels.push(i)
      }
      const newState = prestige(state)
      expect(newState.galaxyCoins).toBeGreaterThan(0)
    })

    it('test_state_prestige_resets_progress', () => {
      for (let i = 1; i <= 50; i++) {
        state.completedLevels.push(i)
      }
      state.totalStars = 500
      state.upgrades.power = 10
      const newState = prestige(state)
      expect(newState.totalStars).toBe(0)
      expect(newState.completedLevels).toHaveLength(0)
      expect(newState.upgrades.power).toBe(0)
      expect(newState.currentLevel).toBe(0)
    })

    it('test_state_prestige_preserves_galaxy_coins', () => {
      for (let i = 1; i <= 50; i++) {
        state.completedLevels.push(i)
      }
      state.galaxyCoins = 10
      const newState = prestige(state)
      expect(newState.galaxyCoins).toBeGreaterThanOrEqual(10)
    })

    it('test_state_prestige_no_op_when_incomplete', () => {
      state.totalStars = 500
      const newState = prestige(state)
      expect(newState.totalStars).toBe(500)
    })
  })

  describe('save/load', () => {
    it('test_state_save_saves_to_localStorage', () => {
      saveGame(state)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('test_state_load_restores_state', () => {
      state.totalStars = 42
      state.currentLevel = 5
      saveGame(state)
      const loaded = loadGame()
      expect(loaded).not.toBeNull()
      expect(loaded!.totalStars).toBe(42)
      expect(loaded!.currentLevel).toBe(5)
    })

    it('test_state_load_returns_null_when_empty', () => {
      const loaded = loadGame()
      expect(loaded).toBeNull()
    })

    it('test_state_load_handles_corrupted_data', () => {
      localStorageMock.setItem('bounce-golf-save', 'not-json')
      const loaded = loadGame()
      expect(loaded).toBeNull()
    })
  })
})
