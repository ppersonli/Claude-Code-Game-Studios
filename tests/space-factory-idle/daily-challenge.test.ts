import { describe, it, expect, beforeEach } from 'vitest'
import { getTodayDate, getTodayChallenge, isDailyCompletedToday } from '../../src/games/space-factory-idle/data/daily-challenges'

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
})
