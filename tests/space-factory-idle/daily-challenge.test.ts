import { describe, it, expect, beforeEach } from 'vitest'
import { getTodayDate, getTodayChallenge, isDailyCompletedToday, getDailyChallengeProgress, type DailyChallenge, type DailyChallengeContext } from '../../src/games/space-factory-idle/data/daily-challenges'

describe('Daily Challenges', () => {
  describe('getTodayDate', () => {
    it('returns date in YYYY-MM-DD format', () => {
      const date = getTodayDate()
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
    it('returns consistent value within same day', () => {
      const d1 = getTodayDate()
      const d2 = getTodayDate()
      expect(d1).toBe(d2)
    })
  })

  describe('getTodayChallenge', () => {
    it('returns a valid challenge structure', () => {
      const challenge = getTodayChallenge()
      expect(challenge).toHaveProperty('id')
      expect(challenge).toHaveProperty('name')
      expect(challenge).toHaveProperty('description')
      expect(challenge).toHaveProperty('icon')
      expect(challenge).toHaveProperty('bonusMultiplier')
      expect(challenge).toHaveProperty('validate')
    })
    it('has a date-embedded ID', () => {
      const challenge = getTodayChallenge()
      const today = getTodayDate()
      expect(challenge.id).toContain(today)
    })
    it('is deterministic (same challenge every call)', () => {
      const c1 = getTodayChallenge()
      const c2 = getTodayChallenge()
      expect(c1.name).toBe(c2.name)
      expect(c1.bonusMultiplier).toBe(c2.bonusMultiplier)
    })
    it('bonus multiplier is reasonable', () => {
      const challenge = getTodayChallenge()
      expect(challenge.bonusMultiplier).toBeGreaterThanOrEqual(1)
      expect(challenge.bonusMultiplier).toBeLessThanOrEqual(10)
    })
    it('validate function is callable', () => {
      const challenge = getTodayChallenge()
      const result = challenge.validate({
        totalCoinsEarned: 0,
        itemsProduced: 0,
        upgradesMade: 0,
        activeTime: 0,
        prestigeDone: false,
      })
      expect(typeof result).toBe('boolean')
    })
  })

  describe('isDailyCompletedToday', () => {
    it('returns false for empty string', () => {
      expect(isDailyCompletedToday('')).toBe(false)
    })
    it('returns true for today', () => {
      expect(isDailyCompletedToday(getTodayDate())).toBe(true)
    })
    it('returns false for yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
      expect(isDailyCompletedToday(dateStr)).toBe(false)
    })
    it('returns false for future date', () => {
      expect(isDailyCompletedToday('2099-01-01')).toBe(false)
    })
  })

  describe('getTodayChallenge goal', () => {
    it('every challenge has a goal with type and target', () => {
      const challenge = getTodayChallenge()
      expect(challenge.goal).toBeDefined()
      expect(challenge.goal.type).toBeTruthy()
      expect(challenge.goal.target).toBeGreaterThan(0)
    })
  })

  describe('getDailyChallengeProgress', () => {
    const makeChallenge = (goal: DailyChallenge['goal']): DailyChallenge => ({
      id: 'test',
      name: 'Test',
      description: 'Test',
      icon: '',
      bonusMultiplier: 2,
      validate: () => false,
      goal,
    })

    const emptyCtx: DailyChallengeContext = {
      totalCoinsEarned: 0,
      itemsProduced: 0,
      upgradesMade: 0,
      activeTime: 0,
      prestigeDone: false,
    }

    it('returns 0% when no progress made', () => {
      const challenge = makeChallenge({ type: 'items', target: 100 })
      const progress = getDailyChallengeProgress(challenge, emptyCtx)
      expect(progress.current).toBe(0)
      expect(progress.target).toBe(100)
      expect(progress.percent).toBe(0)
      expect(progress.completed).toBe(false)
    })

    it('tracks items produced correctly', () => {
      const challenge = makeChallenge({ type: 'items', target: 100 })
      const ctx: DailyChallengeContext = { ...emptyCtx, itemsProduced: 47 }
      const progress = getDailyChallengeProgress(challenge, ctx)
      expect(progress.current).toBe(47)
      expect(progress.target).toBe(100)
      expect(progress.percent).toBeCloseTo(0.47)
      expect(progress.label).toBe('47 / 100')
      expect(progress.completed).toBe(false)
    })

    it('tracks upgrades made correctly', () => {
      const challenge = makeChallenge({ type: 'upgrades', target: 10 })
      const ctx: DailyChallengeContext = { ...emptyCtx, upgradesMade: 5 }
      const progress = getDailyChallengeProgress(challenge, ctx)
      expect(progress.current).toBe(5)
      expect(progress.percent).toBe(0.5)
      expect(progress.completed).toBe(false)
    })

    it('tracks coins earned correctly', () => {
      const challenge = makeChallenge({ type: 'coins', target: 50000 })
      const ctx: DailyChallengeContext = { ...emptyCtx, totalCoinsEarned: 25000 }
      const progress = getDailyChallengeProgress(challenge, ctx)
      expect(progress.current).toBe(25000)
      expect(progress.percent).toBe(0.5)
    })

    it('tracks coinsTime correctly', () => {
      const challenge = makeChallenge({ type: 'coinsTime', target: 10000 })
      const ctx: DailyChallengeContext = { ...emptyCtx, totalCoinsEarned: 8000 }
      const progress = getDailyChallengeProgress(challenge, ctx)
      expect(progress.current).toBe(8000)
      expect(progress.label).toBe('8000 / 10000')
    })

    it('tracks prestige correctly (not done)', () => {
      const challenge = makeChallenge({ type: 'prestige', target: 1 })
      const progress = getDailyChallengeProgress(challenge, emptyCtx)
      expect(progress.current).toBe(0)
      expect(progress.completed).toBe(false)
    })

    it('tracks prestige correctly (done)', () => {
      const challenge = makeChallenge({ type: 'prestige', target: 1 })
      const ctx: DailyChallengeContext = { ...emptyCtx, prestigeDone: true }
      const progress = getDailyChallengeProgress(challenge, ctx)
      expect(progress.current).toBe(1)
      expect(progress.percent).toBe(1)
      expect(progress.completed).toBe(true)
    })

    it('clamps current at target (no overshoot)', () => {
      const challenge = makeChallenge({ type: 'items', target: 100 })
      const ctx: DailyChallengeContext = { ...emptyCtx, itemsProduced: 250 }
      const progress = getDailyChallengeProgress(challenge, ctx)
      expect(progress.current).toBe(100)
      expect(progress.percent).toBe(1)
      expect(progress.label).toBe('100 / 100')
      expect(progress.completed).toBe(true)
    })

    it('marks as completed when target is met exactly', () => {
      const challenge = makeChallenge({ type: 'upgrades', target: 10 })
      const ctx: DailyChallengeContext = { ...emptyCtx, upgradesMade: 10 }
      const progress = getDailyChallengeProgress(challenge, ctx)
      expect(progress.completed).toBe(true)
      expect(progress.percent).toBe(1)
    })
  })
})
