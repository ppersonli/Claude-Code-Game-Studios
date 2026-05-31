import { describe, it, expect } from 'vitest'
import { DAILY_MODIFIERS } from '../../src/games/bubble-tea/data/daily-challenge'

describe('DAILY_MODIFIERS', () => {
  it('has 5 modifiers', () => {
    expect(DAILY_MODIFIERS).toHaveLength(5)
  })

  it('each modifier has required fields', () => {
    for (const m of DAILY_MODIFIERS) {
      expect(m.name).toBeTruthy()
      expect(m.desc).toBeTruthy()
      expect(m.timeLimit).toBeGreaterThan(0)
      expect(m.scoreMultiplier).toBeGreaterThan(0)
      expect(m.icon).toBeTruthy()
    }
  })

  it('modifiers with goals have valid goal types', () => {
    const withGoals = DAILY_MODIFIERS.filter(m => m.goal)
    expect(withGoals.length).toBeGreaterThan(0)
    for (const m of withGoals) {
      expect(['perfect', 'level', 'score', 'combo']).toContain(m.goal!.type)
      expect(m.goal!.count).toBeGreaterThan(0)
    }
  })

  it('all time limits are reasonable (30-120s)', () => {
    for (const m of DAILY_MODIFIERS) {
      expect(m.timeLimit).toBeGreaterThanOrEqual(30)
      expect(m.timeLimit).toBeLessThanOrEqual(120)
    }
  })
})
