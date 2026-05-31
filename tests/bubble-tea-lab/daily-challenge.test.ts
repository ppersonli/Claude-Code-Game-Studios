import { describe, it, expect } from 'vitest'
import { DAILY_MODIFIERS } from '../../src/games/bubble-tea-lab/data/daily-challenge'

describe('DAILY_MODIFIERS data', () => {
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

  it('first modifier (Speed Rush) has no goal', () => {
    const speedRush = DAILY_MODIFIERS[0]
    expect(speedRush.name).toBe('限时冲刺')
    expect(speedRush.timeLimit).toBe(60)
    expect(speedRush.scoreMultiplier).toBe(1)
    expect(speedRush.goal).toBeUndefined()
  })

  it('Perfect Challenge has correct goal', () => {
    const m = DAILY_MODIFIERS.find(m => m.name === '完美挑战')!
    expect(m.timeLimit).toBe(45)
    expect(m.scoreMultiplier).toBe(1.5)
    expect(m.goal).toEqual({ type: 'perfect', count: 3 })
  })

  it('Level Rush has correct goal', () => {
    const m = DAILY_MODIFIERS.find(m => m.name === '等级冲刺')!
    expect(m.timeLimit).toBe(90)
    expect(m.scoreMultiplier).toBe(1.2)
    expect(m.goal).toEqual({ type: 'level', count: 3 })
  })

  it('High Score has correct goal', () => {
    const m = DAILY_MODIFIERS.find(m => m.name === '高分挑战')!
    expect(m.timeLimit).toBe(60)
    expect(m.scoreMultiplier).toBe(2)
    expect(m.goal).toEqual({ type: 'score', count: 300 })
  })

  it('Combo Storm has correct goal', () => {
    const m = DAILY_MODIFIERS.find(m => m.name === '连击风暴')!
    expect(m.timeLimit).toBe(50)
    expect(m.scoreMultiplier).toBe(1.8)
    expect(m.goal).toEqual({ type: 'combo', count: 5 })
  })

  it('all modifiers have scoreMultiplier >= 1', () => {
    for (const m of DAILY_MODIFIERS) {
      expect(m.scoreMultiplier).toBeGreaterThanOrEqual(1)
    }
  })
})
