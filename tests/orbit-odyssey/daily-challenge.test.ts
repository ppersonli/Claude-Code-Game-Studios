/**
 * Daily Challenge — unit tests
 * Covers: challenge generation, validation logic, date seeding, streak tracking
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getTodayChallenge, getTodayDate, isDailyChallengeCompleted } from '../../src/games/orbit-odyssey/data/daily-challenges'

describe('getTodayDate', () => {
  it('should return YYYY-MM-DD format', () => {
    const date = getTodayDate()
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('should return the same value on multiple calls (same day)', () => {
    const d1 = getTodayDate()
    const d2 = getTodayDate()
    expect(d1).toBe(d2)
  })
})

describe('getTodayChallenge', () => {
  it('should return a valid challenge object', () => {
    const challenge = getTodayChallenge()
    expect(challenge).toHaveProperty('id')
    expect(challenge).toHaveProperty('name')
    expect(challenge).toHaveProperty('description')
    expect(challenge).toHaveProperty('icon')
    expect(challenge).toHaveProperty('constraint')
    expect(challenge).toHaveProperty('validate')
    expect(challenge).toHaveProperty('bonusMultiplier')
    expect(typeof challenge.validate).toBe('function')
    expect(challenge.bonusMultiplier).toBeGreaterThan(1)
  })

  it('should return the same challenge on multiple calls (same day)', () => {
    const c1 = getTodayChallenge()
    const c2 = getTodayChallenge()
    expect(c1.id).toBe(c2.id)
    expect(c1.name).toBe(c2.name)
  })

  it('should have a positive bonus multiplier', () => {
    const challenge = getTodayChallenge()
    expect(challenge.bonusMultiplier).toBeGreaterThanOrEqual(1.0)
    expect(challenge.bonusMultiplier).toBeLessThanOrEqual(5.0)
  })

  it('should have an id containing today date', () => {
    const challenge = getTodayChallenge()
    const today = getTodayDate()
    expect(challenge.id).toContain(today)
  })
})

describe('Daily Challenge Validation', () => {
  const baseFlight = {
    angle: Math.PI / 4,
    speed: 300,
    distance: 1000,
    stardustCollected: 5,
    launchCount: 1,
    usedAutoLaunch: false,
  }

  it('validate should be callable without throwing', () => {
    const challenge = getTodayChallenge()
    expect(() => challenge.validate(baseFlight)).not.toThrow()
  })

  it('validate should return a boolean', () => {
    const challenge = getTodayChallenge()
    const result = challenge.validate(baseFlight)
    expect(typeof result).toBe('boolean')
  })

  it('validate should handle zero distance flight', () => {
    const challenge = getTodayChallenge()
    const result = challenge.validate({ ...baseFlight, distance: 0, stardustCollected: 0 })
    expect(typeof result).toBe('boolean')
  })

  it('validate should handle very large distance flight', () => {
    const challenge = getTodayChallenge()
    const result = challenge.validate({ ...baseFlight, distance: 1000000, stardustCollected: 500 })
    expect(typeof result).toBe('boolean')
  })

  it('validate should handle max speed flight', () => {
    const challenge = getTodayChallenge()
    const result = challenge.validate({ ...baseFlight, speed: 600 })
    expect(typeof result).toBe('boolean')
  })

  it('validate should handle zero angle', () => {
    const challenge = getTodayChallenge()
    const result = challenge.validate({ ...baseFlight, angle: 0 })
    expect(typeof result).toBe('boolean')
  })

  it('validate should handle negative angle', () => {
    const challenge = getTodayChallenge()
    const result = challenge.validate({ ...baseFlight, angle: -Math.PI / 2 })
    expect(typeof result).toBe('boolean')
  })

  it('validate should handle auto-launch used', () => {
    const challenge = getTodayChallenge()
    const result = challenge.validate({ ...baseFlight, usedAutoLaunch: true })
    expect(typeof result).toBe('boolean')
  })

  it('validate should handle multiple launches', () => {
    const challenge = getTodayChallenge()
    const result = challenge.validate({ ...baseFlight, launchCount: 10 })
    expect(typeof result).toBe('boolean')
  })
})

describe('isDailyChallengeCompleted', () => {
  it('should return false when lastDailyDate is empty', () => {
    expect(isDailyChallengeCompleted('')).toBe(false)
  })

  it('should return true when lastDailyDate matches today', () => {
    const today = getTodayDate()
    expect(isDailyChallengeCompleted(today)).toBe(true)
  })

  it('should return false when lastDailyDate is yesterday', () => {
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const yesterdayStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`
    expect(isDailyChallengeCompleted(yesterdayStr)).toBe(false)
  })

  it('should return false for a random future date', () => {
    expect(isDailyChallengeCompleted('2099-12-31')).toBe(false)
  })
})
