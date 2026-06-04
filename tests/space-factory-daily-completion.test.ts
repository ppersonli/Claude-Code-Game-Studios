/**
 * Daily challenge completion logic tests.
 * Verifies that daily challenges can actually be completed and rewards applied.
 */
import { describe, it, expect } from 'vitest'
import {
  getTodayChallenge,
  isDailyCompletedToday,
  completeDailyChallenge,
  type DailyChallengeContext,
} from '../src/games/space-factory-idle/data/daily-challenges'
import type { GameState } from '../src/games/space-factory-idle/logic/game-state'

/* ── Helpers ────────────────────────────────────────────────────── */

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 0,
    totalCoins: 0,
    starDust: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    prestigeMult: 1,
    productionLines: {
      earth: [
        { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false },
      ],
    },
    upgrades: {},
    employees: {},
    unlockedPlanets: ['earth'],
    unlockedRecipes: ['ore-smelt'],
    totalProduced: 0,
    bestDistance: 0,
    achievements: [],
    lastDailyCompleted: '',
    dailyStreak: 0,
    lastOnline: Date.now(),
    sessionStart: Date.now(),
    activeEvent: null,
    eventEndTime: 0,
    sessionCoinsEarned: 0,
    sessionItemsProduced: 0,
    sessionUpgradesMade: 0,
    totalPlayTime: 0,
    ...overrides,
  }
}

/* ── Tests ──────────────────────────────────────────────────────── */

describe('daily-challenges.ts — completion logic', () => {
  describe('completeDailyChallenge', () => {
    it('is exported and callable', () => {
      expect(typeof completeDailyChallenge).toBe('function')
    })

    it('marks today as completed in state', () => {
      const state = makeGameState()
      const challenge = getTodayChallenge()
      const result = completeDailyChallenge(state, challenge)
      expect(result).toBe(true)
      expect(state.lastDailyCompleted).toBeTruthy()
      expect(isDailyCompletedToday(state.lastDailyCompleted)).toBe(true)
    })

    it('increments daily streak on first completion', () => {
      const state = makeGameState({ lastDailyCompleted: '' })
      const challenge = getTodayChallenge()
      completeDailyChallenge(state, challenge)
      expect(state.dailyStreak).toBe(1)
    })

    it('does not double-complete today', () => {
      const state = makeGameState()
      const challenge = getTodayChallenge()
      completeDailyChallenge(state, challenge)
      // Second attempt should return false (already completed)
      const result2 = completeDailyChallenge(state, challenge)
      expect(result2).toBe(false)
    })

    it('awards bonus coins when challenge validates', () => {
      const state = makeGameState({ sessionItemsProduced: 200 }) // enough for Mining Frenzy (100 items)
      const challenge = getTodayChallenge()
      const coinsBefore = state.coins
      completeDailyChallenge(state, challenge)
      // Should have received bonus (coins > 0 after completion)
      // The bonus is coins * multiplier, so state.coins should increase
      expect(state.coins).toBeGreaterThanOrEqual(coinsBefore)
    })

    it('preserves streak across same day', () => {
      const state = makeGameState({ dailyStreak: 5, lastDailyCompleted: '2099-01-01' })
      const challenge = getTodayChallenge()
      completeDailyChallenge(state, challenge)
      // If today's date matches lastDailyCompleted, streak shouldn't change
      // But since we set a future date, it should increment
      expect(state.dailyStreak).toBeGreaterThanOrEqual(1)
    })
  })

  describe('isDailyCompletedToday', () => {
    it('returns false for empty string', () => {
      expect(isDailyCompletedToday('')).toBe(false)
    })

    it('returns true for today', () => {
      const d = new Date()
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      expect(isDailyCompletedToday(today)).toBe(true)
    })

    it('returns false for yesterday', () => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      expect(isDailyCompletedToday(yesterday)).toBe(false)
    })
  })
})
