import { describe, it, expect } from 'vitest'
import { ACHIEVEMENTS } from '../src/games/orbit-odyssey/data/achievements'
import { getTodayChallenge, getTodayDate, isDailyChallengeCompleted } from '../src/games/orbit-odyssey/data/daily-challenges'

describe('Achievement System', () => {
  const baseState = {
    totalLaunches: 0,
    bestDistance: 0,
    stardustTotal: 0,
    prestigeCount: 0,
    prestigeCores: 0,
    unlockedShips: ['scout'] as string[],
    unlockedSystems: ['sol'] as string[],
  }

  it('should have 12 achievements', () => {
    expect(ACHIEVEMENTS.length).toBe(12)
  })

  it('each achievement has required fields', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.id).toBeTruthy()
      expect(a.name).toBeTruthy()
      expect(a.description).toBeTruthy()
      expect(a.icon).toBeTruthy()
      expect(typeof a.check).toBe('function')
    }
  })

  it('first_flight: triggers at 1 launch', () => {
    const check = ACHIEVEMENTS.find(a => a.id === 'first_flight')!.check
    expect(check({ ...baseState, totalLaunches: 0 })).toBe(false)
    expect(check({ ...baseState, totalLaunches: 1 })).toBe(true)
    expect(check({ ...baseState, totalLaunches: 100 })).toBe(true)
  })

  it('veteran_pilot: triggers at 100 launches', () => {
    const check = ACHIEVEMENTS.find(a => a.id === 'veteran_pilot')!.check
    expect(check({ ...baseState, totalLaunches: 99 })).toBe(false)
    expect(check({ ...baseState, totalLaunches: 100 })).toBe(true)
  })

  it('master_pilot: triggers at 1000 launches', () => {
    const check = ACHIEVEMENTS.find(a => a.id === 'master_pilot')!.check
    expect(check({ ...baseState, totalLaunches: 999 })).toBe(false)
    expect(check({ ...baseState, totalLaunches: 1000 })).toBe(true)
  })

  it('light_year: triggers at 1000 distance', () => {
    const check = ACHIEVEMENTS.find(a => a.id === 'light_year')!.check
    expect(check({ ...baseState, bestDistance: 999 })).toBe(false)
    expect(check({ ...baseState, bestDistance: 1000 })).toBe(true)
  })

  it('deep_space: triggers at 10000 distance', () => {
    const check = ACHIEVEMENTS.find(a => a.id === 'deep_space')!.check
    expect(check({ ...baseState, bestDistance: 9999 })).toBe(false)
    expect(check({ ...baseState, bestDistance: 10000 })).toBe(true)
  })

  it('interstellar: triggers at 100000 distance', () => {
    const check = ACHIEVEMENTS.find(a => a.id === 'interstellar')!.check
    expect(check({ ...baseState, bestDistance: 99999 })).toBe(false)
    expect(check({ ...baseState, bestDistance: 100000 })).toBe(true)
  })

  it('stardust_collector: triggers at 10000 stardust', () => {
    const check = ACHIEVEMENTS.find(a => a.id === 'stardust_collector')!.check
    expect(check({ ...baseState, stardustTotal: 9999 })).toBe(false)
    expect(check({ ...baseState, stardustTotal: 10000 })).toBe(true)
  })

  it('cosmic_wealth: triggers at 1000000 stardust', () => {
    const check = ACHIEVEMENTS.find(a => a.id === 'cosmic_wealth')!.check
    expect(check({ ...baseState, stardustTotal: 999999 })).toBe(false)
    expect(check({ ...baseState, stardustTotal: 1000000 })).toBe(true)
  })

  it('first_prestige: triggers at 1 prestige', () => {
    const check = ACHIEVEMENTS.find(a => a.id === 'first_prestige')!.check
    expect(check({ ...baseState, prestigeCount: 0 })).toBe(false)
    expect(check({ ...baseState, prestigeCount: 1 })).toBe(true)
  })

  it('prestige_master: triggers at 10 prestiges', () => {
    const check = ACHIEVEMENTS.find(a => a.id === 'prestige_master')!.check
    expect(check({ ...baseState, prestigeCount: 9 })).toBe(false)
    expect(check({ ...baseState, prestigeCount: 10 })).toBe(true)
  })

  it('collector: triggers when all 5 ships unlocked', () => {
    const check = ACHIEVEMENTS.find(a => a.id === 'collector')!.check
    expect(check({ ...baseState, unlockedShips: ['scout', 'racer', 'tanker', 'phantom', 'nova'] })).toBe(true)
    expect(check({ ...baseState, unlockedShips: ['scout', 'racer'] })).toBe(false)
  })

  it('explorer: triggers when all 3 systems unlocked', () => {
    const check = ACHIEVEMENTS.find(a => a.id === 'explorer')!.check
    expect(check({ ...baseState, unlockedSystems: ['sol', 'nebula', 'void'] })).toBe(true)
    expect(check({ ...baseState, unlockedSystems: ['sol'] })).toBe(false)
  })

  it('achievements have unique IDs', () => {
    const ids = ACHIEVEMENTS.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('Daily Challenge System', () => {
  it('getTodayDate returns YYYY-MM-DD format', () => {
    const dateStr = getTodayDate()
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('getTodayChallenge returns a valid challenge', () => {
    const challenge = getTodayChallenge()
    expect(challenge.id).toBeTruthy()
    expect(challenge.name).toBeTruthy()
    expect(challenge.description).toBeTruthy()
    expect(challenge.icon).toBeTruthy()
    expect(challenge.bonusMultiplier).toBeGreaterThan(1)
    expect(typeof challenge.validate).toBe('function')
  })

  it('getTodayChallenge is deterministic (same date = same challenge)', () => {
    const c1 = getTodayChallenge()
    const c2 = getTodayChallenge()
    expect(c1.id).toBe(c2.id)
    expect(c1.name).toBe(c2.name)
  })

  it('challenge IDs contain today date', () => {
    const challenge = getTodayChallenge()
    const today = getTodayDate()
    expect(challenge.id).toContain(today)
  })

  it('isDailyChallengeCompleted returns false when date mismatches', () => {
    expect(isDailyChallengeCompleted('2020-01-01')).toBe(false)
  })

  it('isDailyChallengeCompleted returns true when date matches', () => {
    const today = getTodayDate()
    expect(isDailyChallengeCompleted(today)).toBe(true)
  })

  it('challenge validation works for Sharp Shooter', () => {
    const challenge = getTodayChallenge()
    if (challenge.name === 'Sharp Shooter') {
      expect(challenge.validate({ angle: Math.PI / 4, speed: 300, distance: 500, stardustCollected: 5, launchCount: 1, usedAutoLaunch: false })).toBe(true)
    }
  })

  it('challenge validation works for Speed Demon', () => {
    const challenge = getTodayChallenge()
    if (challenge.name === 'Speed Demon') {
      expect(challenge.validate({ angle: 0, speed: 600, distance: 500, stardustCollected: 5, launchCount: 1, usedAutoLaunch: false })).toBe(true)
      expect(challenge.validate({ angle: 0, speed: 300, distance: 500, stardustCollected: 5, launchCount: 1, usedAutoLaunch: false })).toBe(false)
    }
  })

  it('challenge validation works for Collector', () => {
    const challenge = getTodayChallenge()
    if (challenge.name === 'Collector') {
      expect(challenge.validate({ angle: 0, speed: 300, distance: 500, stardustCollected: 15, launchCount: 1, usedAutoLaunch: false })).toBe(true)
      expect(challenge.validate({ angle: 0, speed: 300, distance: 500, stardustCollected: 5, launchCount: 1, usedAutoLaunch: false })).toBe(false)
    }
  })

  it('challenge validation works for Marathon', () => {
    const challenge = getTodayChallenge()
    if (challenge.name === 'Marathon') {
      expect(challenge.validate({ angle: 0, speed: 300, distance: 6000, stardustCollected: 5, launchCount: 1, usedAutoLaunch: false })).toBe(true)
      expect(challenge.validate({ angle: 0, speed: 300, distance: 4000, stardustCollected: 5, launchCount: 1, usedAutoLaunch: false })).toBe(false)
    }
  })

  it('challenge validation works for Collector (stardust)', () => {
    const challenge = getTodayChallenge()
    if (challenge.name === 'Stardust Hunter') {
      expect(challenge.validate({ angle: 0, speed: 300, distance: 500, stardustCollected: 25, launchCount: 1, usedAutoLaunch: false })).toBe(true)
      expect(challenge.validate({ angle: 0, speed: 300, distance: 500, stardustCollected: 10, launchCount: 1, usedAutoLaunch: false })).toBe(false)
    }
  })

  it('challenge bonus multiplier is between 1.3 and 2.5', () => {
    const challenge = getTodayChallenge()
    expect(challenge.bonusMultiplier).toBeGreaterThanOrEqual(1.3)
    expect(challenge.bonusMultiplier).toBeLessThanOrEqual(2.5)
  })
})
