/**
 * Idle Garden Tycoon — Challenge System Tests
 * TDD: Tests daily challenge generation, progress, and claiming
 */

import { describe, it, expect } from 'vitest'
import type { GameState } from '../../../src/games/idle-garden/data/types'
import { createDefaultPots } from '../../../src/games/idle-garden/systems/GardenSystem'
import {
  getTodayString,
  generateDailyChallenge,
  getChallengeProgress,
  isChallengeComplete,
  claimChallengeReward,
  refreshDailyChallenge,
} from '../../../src/games/idle-garden/systems/ChallengeSystem'
import { CHALLENGES } from '../../../src/games/idle-garden/data/challenges'

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 0,
    totalCoins: 0,
    sunPoints: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    spGrowthUpgrades: 0,
    spPriceUpgrades: 0,
    pots: createDefaultPots(),
    gardenLevel: 1,
    level: 1,
    experience: 0,
    unlockedFlowers: ['sunflower'],
    upgrades: {},
    decorations: [],
    achievements: [],
    dailyChallenge: null,
    stats: {
      totalCoinsEarned: 0,
      totalFlowersGrown: 0,
      totalHarvests: 0,
      totalPlayTime: 0,
      maxComboCount: 0,
    },
    lastOnline: 0,
    sessionStart: 0,
    lastHarvestTime: 0,
    comboCount: 0,
    ...overrides,
  }
}

describe('getTodayString', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = getTodayString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns a valid date', () => {
    const result = getTodayString()
    const date = new Date(result)
    expect(date.toString()).not.toBe('Invalid Date')
  })
})

describe('CHALLENGES data', () => {
  it('has challenge templates', () => {
    expect(CHALLENGES.length).toBeGreaterThan(0)
  })

  it('each template has required fields', () => {
    for (const c of CHALLENGES) {
      expect(c.id).toBeTruthy()
      expect(c.description).toBeTruthy()
      expect(c.statKey).toBeTruthy()
      expect(c.targetRange).toHaveLength(2)
      expect(c.targetRange[0]).toBeLessThanOrEqual(c.targetRange[1])
      expect(c.rewardBase).toBeGreaterThanOrEqual(0)
      expect(c.rewardPerUnit).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('generateDailyChallenge', () => {
  it('generates a challenge for a given date', () => {
    const state = createTestState()
    const challenge = generateDailyChallenge(state, '2026-06-05')
    expect(challenge).not.toBeNull()
    expect(challenge!.date).toBe('2026-06-05')
    expect(challenge!.templateId).toBeTruthy()
    expect(challenge!.target).toBeGreaterThanOrEqual(0)
    expect(challenge!.claimed).toBe(false)
  })

  it('is deterministic for the same date', () => {
    const state = createTestState()
    const c1 = generateDailyChallenge(state, '2026-06-05')
    const c2 = generateDailyChallenge(state, '2026-06-05')
    expect(c1!.templateId).toBe(c2!.templateId)
    expect(c1!.target).toBe(c2!.target)
  })

  it('may differ for different dates', () => {
    const state = createTestState()
    const c1 = generateDailyChallenge(state, '2026-06-05')
    const c2 = generateDailyChallenge(state, '2026-06-06')
    // They might be the same (random chance), but at least the date differs
    expect(c1!.date).not.toBe(c2!.date)
  })

  it('records the startValue from current stats', () => {
    const state = createTestState({
      stats: { ...createTestState().stats, totalHarvests: 42 },
    })
    const challenge = generateDailyChallenge(state, '2026-06-05')
    // startValue depends on which template was selected
    expect(challenge!.startValue).toBeGreaterThanOrEqual(0)
  })
})

describe('getChallengeProgress', () => {
  it('returns zeros when no challenge active', () => {
    const state = createTestState()
    const progress = getChallengeProgress(state)
    expect(progress).toEqual({ current: 0, target: 0, percent: 0 })
  })

  it('calculates progress toward target', () => {
    const state = createTestState({
      dailyChallenge: {
        date: '2026-06-05',
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      },
      stats: { ...createTestState().stats, totalHarvests: 5 },
    })
    const progress = getChallengeProgress(state)
    expect(progress.current).toBe(5)
    expect(progress.target).toBe(10)
    expect(progress.percent).toBeCloseTo(0.5, 1)
  })

  it('accounts for startValue offset', () => {
    const state = createTestState({
      dailyChallenge: {
        date: '2026-06-05',
        templateId: 'harvest-x',
        target: 10,
        startValue: 3,
        claimed: false,
      },
      stats: { ...createTestState().stats, totalHarvests: 8 },
    })
    const progress = getChallengeProgress(state)
    // current = max(0, 8 - 3) = 5
    expect(progress.current).toBe(5)
    expect(progress.percent).toBeCloseTo(0.5, 1)
  })

  it('caps percent at 1.0', () => {
    const state = createTestState({
      dailyChallenge: {
        date: '2026-06-05',
        templateId: 'harvest-x',
        target: 5,
        startValue: 0,
        claimed: false,
      },
      stats: { ...createTestState().stats, totalHarvests: 100 },
    })
    const progress = getChallengeProgress(state)
    expect(progress.percent).toBe(1)
  })
})

describe('isChallengeComplete', () => {
  it('returns false when no challenge active', () => {
    const state = createTestState()
    expect(isChallengeComplete(state)).toBe(false)
  })

  it('returns false when target not reached', () => {
    const state = createTestState({
      dailyChallenge: {
        date: '2026-06-05',
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      },
      stats: { ...createTestState().stats, totalHarvests: 5 },
    })
    expect(isChallengeComplete(state)).toBe(false)
  })

  it('returns true when target reached', () => {
    const state = createTestState({
      dailyChallenge: {
        date: '2026-06-05',
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      },
      stats: { ...createTestState().stats, totalHarvests: 10 },
    })
    expect(isChallengeComplete(state)).toBe(true)
  })

  it('returns false when already claimed', () => {
    const state = createTestState({
      dailyChallenge: {
        date: '2026-06-05',
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: true,
      },
      stats: { ...createTestState().stats, totalHarvests: 100 },
    })
    expect(isChallengeComplete(state)).toBe(false)
  })
})

describe('claimChallengeReward', () => {
  it('claims reward and awards coins when complete', () => {
    const state = createTestState({
      dailyChallenge: {
        date: '2026-06-05',
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      },
      stats: { ...createTestState().stats, totalHarvests: 10 },
    })
    const reward = claimChallengeReward(state)
    expect(reward).toBeGreaterThan(0)
    expect(state.dailyChallenge!.claimed).toBe(true)
    expect(state.coins).toBe(reward)
  })

  it('returns 0 when not complete', () => {
    const state = createTestState({
      dailyChallenge: {
        date: '2026-06-05',
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      },
      stats: { ...createTestState().stats, totalHarvests: 5 },
    })
    const reward = claimChallengeReward(state)
    expect(reward).toBe(0)
    expect(state.dailyChallenge!.claimed).toBe(false)
  })

  it('returns 0 when already claimed', () => {
    const state = createTestState({
      dailyChallenge: {
        date: '2026-06-05',
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: true,
      },
      stats: { ...createTestState().stats, totalHarvests: 100 },
    })
    const reward = claimChallengeReward(state)
    expect(reward).toBe(0)
  })

  it('returns 0 when no challenge active', () => {
    const state = createTestState()
    const reward = claimChallengeReward(state)
    expect(reward).toBe(0)
  })
})

describe('refreshDailyChallenge', () => {
  it('generates a new challenge when none exists', () => {
    const state = createTestState()
    refreshDailyChallenge(state)
    expect(state.dailyChallenge).not.toBeNull()
    expect(state.dailyChallenge!.date).toBe(getTodayString())
  })

  it('generates a new challenge when date has changed', () => {
    const state = createTestState({
      dailyChallenge: {
        date: '2026-01-01',
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      },
    })
    refreshDailyChallenge(state)
    expect(state.dailyChallenge!.date).toBe(getTodayString())
  })

  it('keeps existing challenge when still today', () => {
    const today = getTodayString()
    const state = createTestState({
      dailyChallenge: {
        date: today,
        templateId: 'harvest-x',
        target: 10,
        startValue: 0,
        claimed: false,
      },
    })
    refreshDailyChallenge(state)
    expect(state.dailyChallenge!.templateId).toBe('harvest-x')
    expect(state.dailyChallenge!.target).toBe(10)
  })
})
