import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getDailyChallenge,
  isDailyChallengeCompleted,
  completeDailyChallenge,
  getDailyChallengeStreak,
  type DailyChallenge,
} from '../../src/games/bounce-golf/logic/daily-challenge'
import { createInitialState, type GameState } from '../../src/games/bounce-golf/logic/game-state'

describe('Daily Challenge System', () => {
  let state: GameState

  beforeEach(() => {
    state = createInitialState()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getDailyChallenge', () => {
    it('returns a challenge object with required fields', () => {
      const challenge = getDailyChallenge()
      expect(challenge).toHaveProperty('id')
      expect(challenge).toHaveProperty('name')
      expect(challenge).toHaveProperty('description')
      expect(challenge).toHaveProperty('target')
      expect(challenge).toHaveProperty('reward')
    })

    it('returns same challenge on same day', () => {
      const challenge1 = getDailyChallenge()
      const challenge2 = getDailyChallenge()
      expect(challenge1.id).toBe(challenge2.id)
    })

    it('returns different challenge on different day', () => {
      const challenge1 = getDailyChallenge()
      
      // Advance to next day
      vi.setSystemTime(new Date(Date.now() + 86400000))
      const challenge2 = getDailyChallenge()
      
      expect(challenge1.id).not.toBe(challenge2.id)
    })

    it('challenge has valid target value', () => {
      const challenge = getDailyChallenge()
      expect(challenge.target).toBeGreaterThan(0)
    })

    it('challenge has valid reward', () => {
      const challenge = getDailyChallenge()
      expect(challenge.reward).toBeGreaterThan(0)
    })
  })

  describe('isDailyChallengeCompleted', () => {
    it('returns false when no challenge completed today', () => {
      expect(isDailyChallengeCompleted(state)).toBe(false)
    })

    it('returns true when challenge completed today', () => {
      const completedState = completeDailyChallenge(state)
      expect(isDailyChallengeCompleted(completedState)).toBe(true)
    })
  })

  describe('completeDailyChallenge', () => {
    it('adds reward to galaxy coins', () => {
      const challenge = getDailyChallenge()
      const newState = completeDailyChallenge(state)
      expect(newState.galaxyCoins).toBe(state.galaxyCoins + challenge.reward)
    })

    it('increments daily challenge count', () => {
      const newState = completeDailyChallenge(state)
      expect(newState.dailyChallengesCompleted).toBe(state.dailyChallengesCompleted + 1)
    })

    it('records completion date', () => {
      const newState = completeDailyChallenge(state)
      expect(newState.lastDailyChallengeDate).toBeDefined()
    })

    it('can only complete once per day', () => {
      const state1 = completeDailyChallenge(state)
      const state2 = completeDailyChallenge(state1)
      expect(state2.galaxyCoins).toBe(state1.galaxyCoins) // No additional reward
    })
  })

  describe('getDailyChallengeStreak', () => {
    it('returns 0 when no challenges completed', () => {
      expect(getDailyChallengeStreak(state)).toBe(0)
    })

    it('returns 1 after completing one challenge', () => {
      const newState = completeDailyChallenge(state)
      expect(getDailyChallengeStreak(newState)).toBe(1)
    })

    it('returns 2 after completing challenges on consecutive days', () => {
      vi.setSystemTime(new Date('2026-06-08'))
      let currentState = completeDailyChallenge(state)
      
      vi.setSystemTime(new Date('2026-06-09'))
      currentState = completeDailyChallenge(currentState)
      
      expect(getDailyChallengeStreak(currentState)).toBe(2)
    })

    it('resets streak when missing a day', () => {
      vi.setSystemTime(new Date('2026-06-08'))
      let currentState = completeDailyChallenge(state)
      
      vi.setSystemTime(new Date('2026-06-10')) // Skip day 9
      currentState = completeDailyChallenge(currentState)
      
      expect(getDailyChallengeStreak(currentState)).toBe(1)
    })
  })
})
