import { describe, it, expect, beforeEach } from 'vitest'
import {
  canUnlockCharacter,
  unlockCharacter,
  getCharacterPassiveEffect,
  type CharacterUnlockCondition,
} from '../../src/games/bounce-golf/logic/character-unlock'
import { createInitialState, type GameState } from '../../src/games/bounce-golf/logic/game-state'
import { GAME_CONFIG } from '../../src/games/bounce-golf/config'

describe('Character Unlock System', () => {
  let state: GameState

  beforeEach(() => {
    state = createInitialState()
  })

  describe('canUnlockCharacter', () => {
    it('returns false when condition not met', () => {
      // Rookie is already unlocked, so test with Bouncy (need 5 levels)
      const condition: CharacterUnlockCondition = { type: 'complete_levels', target: 5 }
      expect(canUnlockCharacter(state, condition)).toBe(false)
    })

    it('returns true when condition is met', () => {
      // Complete 5 levels
      const completedState = { ...state, completedLevels: [1, 2, 3, 4, 5] }
      const condition: CharacterUnlockCondition = { type: 'complete_levels', target: 5 }
      expect(canUnlockCharacter(completedState, condition)).toBe(true)
    })

    it('returns true for collect_stars when enough stars', () => {
      const starState = { ...state, totalStars: 50 }
      const condition: CharacterUnlockCondition = { type: 'collect_stars', target: 50 }
      expect(canUnlockCharacter(starState, condition)).toBe(true)
    })

    it('returns false for collect_stars when not enough', () => {
      const condition: CharacterUnlockCondition = { type: 'collect_stars', target: 50 }
      expect(canUnlockCharacter(state, condition)).toBe(false)
    })

    it('returns true for prestige when enough prestiges', () => {
      const prestigeState = { ...state, prestigeCount: 1 }
      const condition: CharacterUnlockCondition = { type: 'prestige', target: 1 }
      expect(canUnlockCharacter(prestigeState, condition)).toBe(true)
    })

    it('returns false for prestige when not enough', () => {
      const condition: CharacterUnlockCondition = { type: 'prestige', target: 1 }
      expect(canUnlockCharacter(state, condition)).toBe(false)
    })

    it('returns true for default unlock', () => {
      const condition: CharacterUnlockCondition = { type: 'default' }
      expect(canUnlockCharacter(state, condition)).toBe(true)
    })
  })

  describe('unlockCharacter', () => {
    it('adds character to unlocked list', () => {
      const newState = unlockCharacter(state, 'bouncy')
      expect(newState.unlockedCharacters).toContain('bouncy')
    })

    it('does not duplicate if already unlocked', () => {
      const unlockedState = { ...state, unlockedCharacters: ['rookie', 'bouncy'] as const }
      const newState = unlockCharacter(unlockedState, 'bouncy')
      const count = newState.unlockedCharacters.filter(c => c === 'bouncy').length
      expect(count).toBe(1)
    })

    it('preserves existing unlocked characters', () => {
      const unlockedState = { ...state, unlockedCharacters: ['rookie', 'bouncy'] as const }
      const newState = unlockCharacter(unlockedState, 'power')
      expect(newState.unlockedCharacters).toContain('rookie')
      expect(newState.unlockedCharacters).toContain('bouncy')
      expect(newState.unlockedCharacters).toContain('power')
    })
  })

  describe('getCharacterPassiveEffect', () => {
    it('returns correct effect for rookie', () => {
      const effect = getCharacterPassiveEffect('rookie')
      expect(effect.type).toBe('none')
    })

    it('returns bounce effect for bouncy', () => {
      const effect = getCharacterPassiveEffect('bouncy')
      expect(effect.type).toBe('bounce_multiplier')
      expect(effect.value).toBeGreaterThan(1)
    })

    it('returns power effect for powerhouse', () => {
      const effect = getCharacterPassiveEffect('power')
      expect(effect.type).toBe('power_multiplier')
      expect(effect.value).toBeGreaterThan(1)
    })

    it('returns star bonus for lucky', () => {
      const effect = getCharacterPassiveEffect('lucky')
      expect(effect.type).toBe('extra_stars')
      expect(effect.value).toBeGreaterThan(0)
    })

    it('returns phase effect for ghost', () => {
      const effect = getCharacterPassiveEffect('ghost')
      expect(effect.type).toBe('phase_through_walls')
      expect(effect.value).toBeGreaterThan(0)
    })

    it('returns split effect for splitter', () => {
      const effect = getCharacterPassiveEffect('splitter')
      expect(effect.type).toBe('split_balls')
      expect(effect.value).toBeGreaterThan(1)
    })
  })
})
