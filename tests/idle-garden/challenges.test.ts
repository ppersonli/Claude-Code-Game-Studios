/**
 * Idle Garden Tycoon — Challenge System Tests
 * TDD: tests written before implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createDefaultState } from '../../src/games/idle-garden/systems/GameState'
import {
  generateDailyChallenge,
  getChallengeProgress,
  isChallengeComplete,
  claimChallengeReward,
  refreshDailyChallenge,
  getTodayString,
} from '../../src/games/idle-garden/systems/ChallengeSystem'
import type { GameState } from '../../src/games/idle-garden/data/types'

describe('ChallengeSystem', () => {
  let state: GameState

  beforeEach(() => {
    state = createDefaultState()
  })

  // ── getTodayString ───────────────────────────────────────────

  describe('getTodayString', () => {
    it('returns YYYY-MM-DD format', () => {
      const today = getTodayString()
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('returns consistent value within same day', () => {
      const a = getTodayString()
      const b = getTodayString()
      expect(a).toBe(b)
    })
  })

  // ── generateDailyChallenge ───────────────────────────────────

  describe('generateDailyChallenge', () => {
    it('generates a challenge with required fields', () => {
      state.stats.totalHarvests = 10
      state.stats.totalCoinsEarned = 500
      state.stats.totalFlowersGrown = 10
      state.stats.totalPlayTime = 120
      state.stats.maxComboCount = 1

      const challenge = generateDailyChallenge(state, '2026-06-01')

      expect(challenge.date).toBe('2026-06-01')
      expect(challenge.templateId).toBeTruthy()
      expect(challenge.target).toBeGreaterThan(0)
      expect(typeof challenge.startValue).toBe('number')
      expect(challenge.claimed).toBe(false)
    })

    it('is deterministic for same date', () => {
      const c1 = generateDailyChallenge(state, '2026-06-01')
      const c2 = generateDailyChallenge(state, '2026-06-01')
      expect(c1.templateId).toBe(c2.templateId)
      expect(c1.target).toBe(c2.target)
    })

    it('produces different challenges for different dates', () => {
      // Run multiple date pairs — at least one should differ
      let foundDiff = false
      for (let d = 1; d <= 10; d++) {
        const c1 = generateDailyChallenge(state, `2026-01-${String(d).padStart(2, '0')}`)
        const c2 = generateDailyChallenge(state, `2026-02-${String(d).padStart(2, '0')}`)
        if (c1.templateId !== c2.templateId || c1.target !== c2.target) {
          foundDiff = true
          break
        }
      }
      expect(foundDiff).toBe(true)
    })

    it('records the start value from current stats', () => {
      state.stats.totalHarvests = 42
      const challenge = generateDailyChallenge(state, '2026-06-01')
      // startValue should be the stat value for the selected template
      expect(typeof challenge.startValue).toBe('number')
    })
  })

  // ── getChallengeProgress ─────────────────────────────────────

  describe('getChallengeProgress', () => {
    it('returns 0 progress when no challenge active', () => {
      state.dailyChallenge = null
      const progress = getChallengeProgress(state)
      expect(progress.current).toBe(0)
      expect(progress.percent).toBe(0)
    })

    it('calculates progress from start value', () => {
      state.dailyChallenge = {
        date: getTodayString(),
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      }
      state.stats.totalHarvests = 5

      const progress = getChallengeProgress(state)
      expect(progress.current).toBe(5)
      expect(progress.target).toBe(10)
      expect(progress.percent).toBeCloseTo(0.5)
    })

    it('caps percent at 1.0', () => {
      state.dailyChallenge = {
        date: getTodayString(),
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      }
      state.stats.totalHarvests = 20

      const progress = getChallengeProgress(state)
      expect(progress.percent).toBe(1.0)
    })

    it('uses maxComboCount for combo challenge', () => {
      state.dailyChallenge = {
        date: getTodayString(),
        templateId: 'combo-x',
        target: 3,
        startValue: 0,
        claimed: false,
      }
      state.stats.maxComboCount = 2

      const progress = getChallengeProgress(state)
      expect(progress.current).toBe(2)
    })
  })

  // ── isChallengeComplete ──────────────────────────────────────

  describe('isChallengeComplete', () => {
    it('returns false when no challenge', () => {
      state.dailyChallenge = null
      expect(isChallengeComplete(state)).toBe(false)
    })

    it('returns false when not enough progress', () => {
      state.dailyChallenge = {
        date: getTodayString(),
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      }
      state.stats.totalHarvests = 5
      expect(isChallengeComplete(state)).toBe(false)
    })

    it('returns true when target reached', () => {
      state.dailyChallenge = {
        date: getTodayString(),
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      }
      state.stats.totalHarvests = 10
      expect(isChallengeComplete(state)).toBe(true)
    })

    it('returns true when target exceeded', () => {
      state.dailyChallenge = {
        date: getTodayString(),
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      }
      state.stats.totalHarvests = 25
      expect(isChallengeComplete(state)).toBe(true)
    })
  })

  // ── claimChallengeReward ─────────────────────────────────────

  describe('claimChallengeReward', () => {
    it('returns reward when challenge complete', () => {
      state.dailyChallenge = {
        date: getTodayString(),
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      }
      state.stats.totalHarvests = 10
      state.coins = 0

      const reward = claimChallengeReward(state)
      expect(reward).toBeGreaterThan(0)
      expect(state.coins).toBe(reward)
      expect(state.dailyChallenge!.claimed).toBe(true)
    })

    it('returns 0 when challenge not complete', () => {
      state.dailyChallenge = {
        date: getTodayString(),
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      }
      state.stats.totalHarvests = 5
      state.coins = 0

      const reward = claimChallengeReward(state)
      expect(reward).toBe(0)
      expect(state.coins).toBe(0)
    })

    it('returns 0 when already claimed', () => {
      state.dailyChallenge = {
        date: getTodayString(),
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: true,
      }
      state.stats.totalHarvests = 10

      const reward = claimChallengeReward(state)
      expect(reward).toBe(0)
    })

    it('returns 0 when no challenge active', () => {
      state.dailyChallenge = null
      const reward = claimChallengeReward(state)
      expect(reward).toBe(0)
    })
  })

  // ── refreshDailyChallenge ────────────────────────────────────

  describe('refreshDailyChallenge', () => {
    it('generates new challenge when date differs', () => {
      state.dailyChallenge = {
        date: '2020-01-01',
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      }

      refreshDailyChallenge(state)
      expect(state.dailyChallenge).not.toBeNull()
      expect(state.dailyChallenge!.date).toBe(getTodayString())
      expect(state.dailyChallenge!.claimed).toBe(false)
    })

    it('keeps challenge when same date', () => {
      const today = getTodayString()
      state.dailyChallenge = {
        date: today,
        templateId: 'earn-x',
        target: 1000,
        startValue: 0,
        claimed: false,
      }

      refreshDailyChallenge(state)
      expect(state.dailyChallenge!.templateId).toBe('earn-x')
      expect(state.dailyChallenge!.target).toBe(1000)
    })

    it('generates challenge when no challenge exists', () => {
      state.dailyChallenge = null
      refreshDailyChallenge(state)
      expect(state.dailyChallenge).not.toBeNull()
      expect(state.dailyChallenge!.date).toBe(getTodayString())
    })
  })
})
